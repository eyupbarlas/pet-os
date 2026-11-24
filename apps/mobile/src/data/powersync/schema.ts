// Client schema = view layer over the synced tables (ADR 0004/0012). Column names follow the
// backend model. Server schema changes are additive during the beta, so no SQLite migrations.
import { column, Schema, Table } from '@powersync/common';

const t = (columns: Record<string, any>, options?: { indexes?: Record<string, string[]> }) => new Table(columns, options);
const text = column.text, int = column.integer, real = column.real;

export const AppSchema = new Schema({
  household: t({ name: text, timezone: text, owner_id: text, created_by: text, created_at: text, updated_at: text }),
  household_member: t({ household_id: text, user_id: text, display_name: text, joined_at: text, left_at: text, removed_by: text }, { indexes: { by_household: ['household_id'] } }),
  invite: t({ household_id: text, token: text, created_by: text, created_at: text, expires_at: text }),
  pet: t({ household_id: text, name: text, species: text, breed: text, birth_date: text, birth_date_estimated: int, weight_kg: real, care_notes: text, sort_order: int, created_at: text, updated_at: text }, { indexes: { by_household: ['household_id'] } }),
  task: t({ household_id: text, pet_id: text, kind: text, template_key: text, title: text, amount: text, streak_critical: int, time_of_day: text, every_n_days: int, anchor_date: text, ends_on: text, paused: int, medication_id: text, sort_order: int, created_at: text, updated_at: text }, { indexes: { by_pet: ['pet_id'] } }),
  tick: t({ household_id: text, pet_id: text, task_id: text, local_date: text, slot: int, actor_id: text, client_at: text, received_at: text }, { indexes: { by_pet_date: ['pet_id', 'local_date'] } }),
  rest_day: t({ household_id: text, pet_id: text, local_date: text, created_by: text, created_at: text }),
  streak_day: t({ household_id: text, pet_id: text, local_date: text, outcome: text, streak_after: int, passes_used_in_month: int, computed_at: text }, { indexes: { by_pet_date: ['pet_id', 'local_date'] } }),
  medication: t({ household_id: text, pet_id: text, name: text, dose: text, notes: text, starts_on: text, ends_on: text, created_at: text, updated_at: text }),
  health_record: t({ household_id: text, pet_id: text, kind: text, title: text, occurred_on: text, next_due_on: text, note: text, created_at: text, updated_at: text }),
  vet_contact: t({ household_id: text, name: text, phone: text, address: text, notes: text, updated_at: text }),
  pet_place: t({ household_id: text, pet_id: text, kind: text, provider: text, name: text, url: text, next_visit_on: text, note: text, updated_at: text }),
  care_card_link: t({ household_id: text, pet_id: text, token: text, owner_contacts: text, note: text, lang: text, show_vet: int, created_by: text, created_at: text, updated_at: text, revoked_at: text, expires_at: text, view_count: int, last_viewed_at: text }),
  reminder_pref: t({ user_id: text, household_id: text, task_id: text, enabled: int, anytime_remind_at: text, updated_at: text }),
  profiles: t({ display_name: text, locale: text, consent_usage_stats: int, consent_crash_reports: int, consent_marketing: int, consent_updated_at: text, consent_policy_version: text, created_at: text, updated_at: text }),
  notification_settings: t({ quiet_start: text, quiet_end: text, nudge_enabled: int, nudge_at: text, updated_at: text }),
});
