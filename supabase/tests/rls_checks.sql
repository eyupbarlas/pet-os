-- Source: backend-sync.md 11.6
do $$
declare bad text;
begin
  -- 1. every public table has RLS on
  select string_agg(c.relname, ', ') into bad
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
  if bad is not null then raise exception 'RLS off on: %', bad; end if;

  -- 2. anon has no table privileges in public
  select string_agg(c.relname, ', ') into bad
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r','v')
    and (has_table_privilege('anon', c.oid, 'SELECT') or has_table_privilege('anon', c.oid, 'INSERT')
      or has_table_privilege('anon', c.oid, 'UPDATE') or has_table_privilege('anon', c.oid, 'DELETE'));
  if bad is not null then raise exception 'anon table grants on: %', bad; end if;

  -- 3. anon can execute only the allow-listed functions
  select string_agg(p.oid::regprocedure::text, ', ') into bad
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public','private','analytics')
    and has_function_privilege('anon', p.oid, 'EXECUTE')
    and p.proname not in ('get_care_card','record_invite_landing','health','get_app_config');
  if bad is not null then raise exception 'anon can execute: %', bad; end if;

  -- 4. analytics schema not usable by API roles
  if has_schema_privilege('anon','analytics','USAGE') or has_schema_privilege('authenticated','analytics','USAGE') then
    raise exception 'analytics schema exposed';
  end if;
end $$;
