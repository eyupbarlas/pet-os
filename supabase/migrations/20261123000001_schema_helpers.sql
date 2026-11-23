-- Source: docs/architecture/mvp/backend-sync.md (section 11 sketch). ADRs 0010-0019.
set check_function_bodies = off;  -- helpers reference tables created in the next migration
create schema if not exists private;      -- NOT in the Data API's exposed schemas
create schema if not exists analytics;    -- NOT exposed; no grants to anon/authenticated
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Privacy B3: stop Supabase's default grants from re-appearing on new objects.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema private
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema analytics
  revoke all on tables from public, anon, authenticated;
revoke all on schema analytics from public, anon, authenticated;
-- (After creating everything below, a final sweep repeats the revokes and then applies §11.5 grants.)

create or replace function private.my_household_ids()
returns setof uuid language sql stable security definer set search_path = '' as $$
  select m.household_id from public.household_member m
  where m.user_id = (select auth.uid()) and m.left_at is null
$$;

create or replace function private.today_local(p_household uuid)
returns date language sql stable security definer set search_path = '' as $$
  select (now() at time zone h.timezone)::date from public.household h where h.id = p_household
$$;

create or replace function private.new_token()            -- 256 bits, base64url, 43 chars
returns text language sql volatile set search_path = '' as $$
  select rtrim(translate(encode(extensions.gen_random_bytes(32), 'base64'), '+/', '-_'), '=')
$$;

create or replace function private.raise_app(p_code text)  -- stable error codes (architecture B-7)
returns void language plpgsql as $$
begin raise exception using errcode = 'P0001', message = p_code; end $$;

grant usage on schema private to authenticated;            -- needed for policy evaluation
grant execute on function private.my_household_ids() to authenticated;
