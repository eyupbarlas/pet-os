-- Source: docs/architecture/mvp/backend-sync.md (section 11 sketch). ADRs 0010-0019.
-- per-user ------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  locale text not null default 'pl_PL' check (locale in ('pl_PL','en_US')),
  consent_usage_stats   boolean not null default false,
  consent_crash_reports boolean not null default false,       -- architecture B-2 / privacy P4
  consent_marketing     boolean not null default false,
  consent_updated_at timestamptz,
  consent_policy_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notification_settings (
  id uuid primary key references auth.users(id) on delete cascade,
  quiet_start time, quiet_end time,
  nudge_enabled boolean not null default false,
  nudge_at time not null default '19:00',
  updated_at timestamptz not null default now()
);

-- household -----------------------------------------------------------------
create table public.household (
  id uuid primary key,
  name text check (char_length(name) <= 60),
  timezone text not null default 'Europe/Warsaw',
  owner_id uuid not null references auth.users(id) on delete restrict,  -- exactly one owner (§8.5); set by trigger, changed by RPC only
  created_by uuid references auth.users(id) on delete set null,   -- set by trigger
  last_closed_date date,                                          -- server-only, not synced
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.household_member (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.household(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  removed_by uuid references auth.users(id) on delete set null,
  unique (household_id, user_id)
);
create index on public.household_member (user_id) where left_at is null;
create index on public.household_member (removed_by);
create index on public.household (owner_id);

create table public.invite (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.household(id) on delete cascade,
  token text not null unique default private.new_token(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  landing_view_count int not null default 0           -- platform B8 / PO P-M3; no IP, no UA
);
create index on public.invite (household_id);

-- pets and routine ----------------------------------------------------------
create table public.pet (
  id uuid primary key,
  household_id uuid not null references public.household(id) on delete cascade on update cascade,
  name text not null check (char_length(name) between 1 and 40),
  species text not null check (species in ('dog','cat')),
  breed text check (char_length(breed) <= 60),
  birth_date date,
  birth_date_estimated boolean not null default false,
  weight_kg numeric(5,2) check (weight_kg > 0 and weight_kg < 150),
  care_notes text check (char_length(care_notes) <= 2000),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, household_id)
);
create index on public.pet (household_id);

create table public.medication (
  id uuid primary key,
  household_id uuid not null, pet_id uuid not null,
  name text not null check (char_length(name) <= 80),
  dose text check (char_length(dose) <= 80),
  notes text check (char_length(notes) <= 500),
  starts_on date not null, ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (pet_id, household_id) references public.pet(id, household_id) on delete cascade on update cascade
);
create index on public.medication (pet_id, household_id);
create index on public.medication (household_id);

create table public.task (
  id uuid primary key,
  household_id uuid not null, pet_id uuid not null,
  kind text not null check (kind in ('meal','walk','water','litter','med','custom')),
  template_key text,
  title text check (char_length(title) <= 60),
  amount text check (char_length(amount) <= 40),
  streak_critical boolean not null default false,        -- overwritten by seed trigger
  time_of_day time,                                      -- null = any time today
  every_n_days smallint not null default 1 check (every_n_days between 1 and 90),
  anchor_date date not null,
  ends_on date,
  paused boolean not null default false,
  medication_id uuid references public.medication(id) on delete set null,   -- same-household check by trigger
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (template_key is not null or title is not null),
  foreign key (pet_id, household_id) references public.pet(id, household_id) on delete cascade on update cascade
);
create index on public.task (pet_id, household_id);
create index on public.task (household_id);
create index on public.task (medication_id);

create table public.tick (
  id uuid primary key,                                   -- v5(NS_TICK, task_id|local_date|slot)
  household_id uuid not null, pet_id uuid not null,
  task_id uuid not null references public.task(id) on delete cascade,  -- task deletes are impossible for clients
  local_date date not null,
  slot smallint not null default 0 check (slot between 0 and 11),
  actor_id uuid references auth.users(id) on delete set null,
  client_at timestamptz not null,
  received_at timestamptz not null default now(),
  unique (task_id, local_date, slot),
  foreign key (pet_id, household_id) references public.pet(id, household_id) on delete cascade on update cascade
);
create index on public.tick (pet_id, local_date);
create index on public.tick (household_id);
create index on public.tick (actor_id);

create table public.rest_day (
  id uuid primary key,                                   -- v5(NS_REST, pet_id|local_date)
  household_id uuid not null, pet_id uuid not null,
  local_date date not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (pet_id, local_date),
  foreign key (pet_id, household_id) references public.pet(id, household_id) on delete cascade on update cascade
);
create index on public.rest_day (household_id);
create index on public.rest_day (created_by);

create table public.streak_day (
  id uuid primary key default gen_random_uuid(),         -- architecture B-11
  household_id uuid not null, pet_id uuid not null,
  local_date date not null,
  outcome text not null check (outcome in ('complete','rest','neutral','paw_pass','missed')),
  streak_after int not null check (streak_after >= 0),
  passes_used_in_month smallint not null check (passes_used_in_month between 0 and 2),
  computed_at timestamptz not null default now(),
  unique (pet_id, local_date),
  foreign key (pet_id, household_id) references public.pet(id, household_id) on delete cascade on update cascade
);
create index on public.streak_day (household_id);

-- health, places, contacts --------------------------------------------------
create table public.health_record (
  id uuid primary key,
  household_id uuid not null, pet_id uuid not null,
  kind text not null check (kind in ('vet_visit','vaccination')),
  title text check (char_length(title) <= 80),
  occurred_on date, next_due_on date,
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (pet_id, household_id) references public.pet(id, household_id) on delete cascade on update cascade
);
create index on public.health_record (pet_id, household_id);
create index on public.health_record (household_id);

create table public.vet_contact (
  id uuid primary key,                                   -- = household_id
  household_id uuid not null unique references public.household(id) on delete cascade on update cascade,
  name text, phone text, address text,
  notes text check (char_length(notes) <= 500),
  updated_at timestamptz not null default now(),
  check (id = household_id)
);

create table public.pet_place (
  id uuid primary key,                                   -- v5(NS_PLACE, pet_id|kind)
  household_id uuid not null, pet_id uuid not null,
  kind text not null check (kind in ('food','groomer')),
  provider text not null check (provider in ('psibufet','booksy','custom')),
  name text check (char_length(name) <= 80),
  url text check (url is null or url ~ '^https://'),
  next_visit_on date,
  note text check (char_length(note) <= 300),
  updated_at timestamptz not null default now(),
  unique (pet_id, kind),
  foreign key (pet_id, household_id) references public.pet(id, household_id) on delete cascade on update cascade
);
create index on public.pet_place (household_id);

-- care card (one pet) -------------------------------------------------------
create table public.care_card_link (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null, pet_id uuid not null,
  token text not null unique default private.new_token(),
  owner_contacts jsonb not null default '[]'
    check (jsonb_typeof(owner_contacts) = 'array' and jsonb_array_length(owner_contacts) <= 3),
  note text check (char_length(note) <= 1000),
  lang text not null default 'pl_PL' check (lang in ('pl_PL','en_US')),
  show_vet boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz,
  expires_at timestamptz,                                -- unused in MVP
  view_count int not null default 0,
  last_viewed_at timestamptz,
  foreign key (pet_id, household_id) references public.pet(id, household_id) on delete cascade on update cascade  -- privacy B1
);
create index on public.care_card_link (pet_id, household_id);
create index on public.care_card_link (household_id);

-- per-user prefs ------------------------------------------------------------
create table public.reminder_pref (
  id uuid primary key,                                   -- v5(NS_REMIND, user_id|task_id)
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid not null references public.household(id) on delete cascade on update cascade,
  task_id uuid not null references public.task(id) on delete cascade,   -- same-household check by trigger
  enabled boolean not null default false,
  anytime_remind_at time,
  updated_at timestamptz not null default now(),
  unique (user_id, task_id)
);
create index on public.reminder_pref (task_id);
create index on public.reminder_pref (household_id);

-- server-only ---------------------------------------------------------------
create table public.deletion_followup (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,                                 -- no FK: the user is gone
  step text not null check (step in ('posthog_person','receipt_email','apple_revoke')),
  payload jsonb not null default '{}',                   -- cleared on success or after 7 days
  attempts int not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_error text,
  last_error_at timestamptz,
  done_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.deletion_followup (next_attempt_at) where done_at is null;

create table public.app_config (
  id boolean primary key default true check (id),        -- single row
  min_supported_version text not null default '0.0.0',
  maintenance_message_key text,
  push_sync_enabled boolean not null default false       -- deferred feature (§12)
);
