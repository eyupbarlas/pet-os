do $$ begin create role anon nologin; exception when duplicate_object then null; end $$; do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$; do $$ begin create role service_role nologin bypassrls; exception when duplicate_object then null; end $$;
create schema auth; create table auth.users(id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create schema extensions; create extension pgcrypto schema extensions;
create schema cron; create function cron.schedule(text,text,text) returns bigint language sql as 'select 1::bigint';
create function cron.schedule(text,text) returns bigint language sql as 'select 1::bigint';
