// Typed read hooks over the local PowerSync database (mobile.md 3.2). Screens never write SQL.
import { useMemo } from 'react';
import { useQuery } from '@powersync/react';
import { parseTimestamp } from './time';
import { isStreakCritical, localDate, tickKey, type ClosedDay, type Species, type StreakTask, type TaskKind } from '@petos/domain';

export interface Membership { household_id: string; household_name: string | null; timezone: string }

/** The signed-in user's active household (MVP: one at a time), or null. */
export function useMembership(userId: string | undefined) {
  const { data, isLoading } = useQuery<Membership>(
    `select m.household_id, h.name as household_name, coalesce(h.timezone, 'Europe/Warsaw') as timezone
       from household_member m join household h on h.id = m.household_id
      where m.user_id = ? and m.left_at is null
      order by m.joined_at limit 1`,
    [userId ?? ''],
  );
  return { membership: data[0] ?? null, isLoading };
}

export interface PetRow { id: string; name: string; species: Species; created_at: string | null }

export function usePets(householdId: string | undefined) {
  const { data } = useQuery<PetRow>(
    'select id, name, species, created_at from pet where household_id = ? order by sort_order, created_at',
    [householdId ?? ''],
  );
  return data;
}

interface TaskDbRow {
  id: string; household_id: string; pet_id: string; kind: TaskKind; template_key: string | null; title: string | null;
  time_of_day: string | null; every_n_days: number | null; anchor_date: string; ends_on: string | null;
  paused: number | null; streak_critical: number | null; sort_order: number | null;
}
export interface TodayTask extends StreakTask {
  household_id: string; pet_id: string; kind: TaskKind; template_key: string | null; title: string | null;
  time_of_day: string | null;
  tick: { id: string; actor_id: string | null; actor_name: string | null; client_at: string | null } | null;
}

/**
 * Everything Today needs for one pet: its tasks, every slot-0 tick and rest day (for the
 * provisional streak), the latest closed streak day, and today's tick per task.
 */
export function usePetDay(pet: PetRow | undefined, timezone: string, today: string) {
  const petId = pet?.id ?? '';
  const { data: tasks } = useQuery<TaskDbRow>(
    `select id, household_id, pet_id, kind, template_key, title, time_of_day, every_n_days, anchor_date, ends_on,
            paused, streak_critical, sort_order
       from task where pet_id = ?`,
    [petId],
  );
  const { data: ticks } = useQuery<{ id: string; task_id: string; local_date: string; actor_id: string | null; client_at: string | null; actor_name: string | null }>(
    `select k.id, k.task_id, k.local_date, k.actor_id, k.client_at,
            (select m.display_name from household_member m
              where m.user_id = k.actor_id and m.household_id = k.household_id limit 1) as actor_name
       from tick k where k.pet_id = ? and k.slot = 0`,
    [petId],
  );
  const { data: rest } = useQuery<{ local_date: string }>('select local_date from rest_day where pet_id = ?', [petId]);
  const { data: closed } = useQuery<{ local_date: string; streak_after: number; passes_used_in_month: number }>(
    'select local_date, streak_after, passes_used_in_month from streak_day where pet_id = ? order by local_date desc limit 1',
    [petId],
  );

  return useMemo(() => {
    const species = pet?.species ?? 'dog';
    const todayTicks = new Map(ticks.filter((k) => k.local_date === today).map((k) => [k.task_id, k]));
    const list: TodayTask[] = [...tasks]
      .sort((a, b) => (a.time_of_day ?? '99').localeCompare(b.time_of_day ?? '99') || (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((r) => {
        const k = todayTicks.get(r.id);
        return {
          id: r.id, household_id: r.household_id, pet_id: r.pet_id, kind: r.kind, template_key: r.template_key, title: r.title,
          time_of_day: r.time_of_day ? r.time_of_day.slice(0, 5) : null,
          anchor_date: r.anchor_date, ends_on: r.ends_on, paused: !!r.paused, every_n_days: r.every_n_days ?? 1,
          // The server seeds streak_critical; until the row syncs back, mirror its rule locally.
          streak_critical: r.streak_critical == null ? isStreakCritical(species, r.kind) : !!r.streak_critical,
          tick: k ? { id: k.id, actor_id: k.actor_id, actor_name: k.actor_name, client_at: k.client_at } : null,
        };
      });
    const c = closed[0];
    const lastClosed: ClosedDay | null = c ? { date: c.local_date, streak: c.streak_after, passesUsedInMonth: c.passes_used_in_month } : null;
    const petFirstDay = pet?.created_at ? safeLocalDate(pet.created_at, timezone) ?? today : today;
    return {
      tasks: list,
      streakInput: {
        tasks: list,
        ticks: new Set(ticks.map((k) => tickKey(k.task_id, k.local_date))),
        restDays: new Set(rest.map((r) => r.local_date)),
        petFirstDay, lastClosed, today,
      },
    };
  }, [pet, tasks, ticks, rest, closed, timezone, today]);
}

function safeLocalDate(iso: string, tz: string) {
  const ms = parseTimestamp(iso);
  if (Number.isNaN(ms)) return null;
  try { return localDate(ms, tz); } catch { return null; }
}

export interface HouseholdRow { id: string; name: string | null; owner_id: string | null }

export function useHousehold(householdId: string | undefined) {
  const { data } = useQuery<HouseholdRow>('select id, name, owner_id from household where id = ?', [householdId ?? '']);
  return data[0] ?? null;
}

export interface MemberRow { id: string; user_id: string; display_name: string | null; joined_at: string | null }

/** Active members, longest-standing first (the order ownership passes in). */
export function useMembers(householdId: string | undefined) {
  const { data } = useQuery<MemberRow>(
    `select id, user_id, display_name, joined_at from household_member
      where household_id = ? and left_at is null order by joined_at, id`,
    [householdId ?? ''],
  );
  return data;
}

export interface InviteRow { id: string; token: string; expires_at: string | null; created_at: string | null }

/** Open invites. They sync to the owner only; expired ones are filtered here. */
export function useOpenInvites(householdId: string | undefined) {
  const { data } = useQuery<InviteRow>(
    'select id, token, expires_at, created_at from invite where household_id = ? order by created_at desc',
    [householdId ?? ''],
  );
  return useMemo(() => data.filter((i) => !i.expires_at || parseTimestamp(i.expires_at) > Date.now()), [data]);
}

/** The signed-in user's saved display name, if the profile has synced. */
export function useMyDisplayName(userId: string | undefined) {
  const { data } = useQuery<{ display_name: string | null }>('select display_name from profiles where id = ?', [userId ?? '']);
  return data[0]?.display_name ?? null;
}
