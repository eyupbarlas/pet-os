// The only local writers (mobile.md 3.3). Each is one PowerSync write transaction; the connector
// uploads the rows in write order, so RLS sees the member row before the pet and its tasks.
import { newId, tickId, type Species, type TaskTemplate } from '@petos/domain';
import { powerSync } from '../powersync/system';

export interface NewMed { name: string; time_of_day: string }

export interface CreateHouseholdInput {
  userId: string;
  displayName: string;
  householdName: string;
  timezone: string;
  today: string;
  pet: { name: string; species: Species };
  tasks: TaskTemplate[];
  med: NewMed | null;
}

/** First-run bootstrap (mobile C-B3): household, own member row, pet, routine, optional med. */
export async function createHousehold(i: CreateHouseholdInput) {
  const now = new Date().toISOString();
  const householdId = newId();
  const petId = newId();
  await powerSync.writeTransaction(async (tx) => {
    // owner_id and created_by are forced to the caller by the server trigger; set here so the
    // local copy is right before the first sync.
    await tx.execute(
      'insert into household (id, name, timezone, owner_id, created_by, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?)',
      [householdId, i.householdName, i.timezone, i.userId, i.userId, now, now],
    );
    await tx.execute(
      'insert into household_member (id, household_id, user_id, display_name, joined_at) values (?, ?, ?, ?, ?)',
      [newId(), householdId, i.userId, i.displayName, now],
    );
    await tx.execute(
      'insert into pet (id, household_id, name, species, sort_order, created_at, updated_at) values (?, ?, ?, ?, 0, ?, ?)',
      [petId, householdId, i.pet.name, i.pet.species, now, now],
    );
    // streak_critical and paused are left to the server (seed trigger, default false); the client
    // mirrors the rule until the row syncs back.
    let order = 0;
    for (const t of i.tasks) {
      await tx.execute(
        `insert into task (id, household_id, pet_id, kind, template_key, time_of_day, every_n_days, anchor_date, sort_order, created_at, updated_at)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newId(), householdId, petId, t.kind, t.template_key, t.time_of_day, t.every_n_days, i.today, order++, now, now],
      );
    }
    if (i.med) {
      const medId = newId();
      await tx.execute(
        'insert into medication (id, household_id, pet_id, name, starts_on, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?)',
        [medId, householdId, petId, i.med.name, i.today, now, now],
      );
      await tx.execute(
        `insert into task (id, household_id, pet_id, kind, title, time_of_day, every_n_days, anchor_date, medication_id, sort_order, created_at, updated_at)
         values (?, ?, ?, 'med', ?, ?, 1, ?, ?, ?, ?, ?)`,
        [newId(), householdId, petId, i.med.name, i.med.time_of_day, i.today, medId, order++, now, now],
      );
    }
    // Best effort: the profile row is created by the server and may not have synced yet.
    await tx.execute('update profiles set display_name = ? where id = ?', [i.displayName, i.userId]);
  });
  return { householdId, petId };
}

export interface TickTarget { id: string; household_id: string; pet_id: string }

/** Tick = one row per task per household day, deterministic id (ADR 0014, mobile.md 3.5). */
export async function tickTask(task: TickTarget, localDate: string, userId: string) {
  const id = tickId(task.id, localDate, 0);
  await powerSync.writeTransaction(async (tx) => {
    const existing = await tx.getOptional('select id from tick where id = ?', [id]);
    if (existing) return;
    await tx.execute(
      'insert into tick (id, household_id, pet_id, task_id, local_date, slot, actor_id, client_at) values (?, ?, ?, ?, ?, 0, ?, ?)',
      [id, task.household_id, task.pet_id, task.id, localDate, userId, new Date().toISOString()],
    );
  });
}

/** Undo = local delete; the server ignores deletes outside today/yesterday. */
export async function untickTask(tickRowId: string) {
  await powerSync.writeTransaction(async (tx) => {
    await tx.execute('delete from tick where id = ?', [tickRowId]);
  });
}
