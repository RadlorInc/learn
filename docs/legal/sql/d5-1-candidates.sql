-- D5 step 1 — READ-ONLY. Your account's children, so you can pick a TARGET (to delete) and a CONTROL
-- (another child on the same account, which must be untouched). Edit ONE line: the account email below.
-- Nothing personal is written to the repo — the email is typed here, in the SQL editor.
with params as (select 'YOUR-ACCOUNT-EMAIL@example.com'::text as account_email),
acct as (select u.id from auth.users u, params p where lower(u.email) = lower(p.account_email)),
kids as (select l.id, l.display_name, l.consent_exempt_at is not null as exempt, l.consent_id
           from public.learners l where l.created_by = (select id from acct)),
child_tables as (
  select c.relname::text as t from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and c.relname <> 'parental_consents'
     and exists (select 1 from pg_attribute a where a.attrelid = c.oid and a.attname = 'learner_id' and a.attnum > 0 and not a.attisdropped))
select (select count(*) from acct) as account_found,
       k.id as learner_id, k.display_name, k.exempt, k.consent_id,
       (select string_agg(la.parent_id::text, ',') from public.learner_access la where la.learner_id = k.id and la.access_role = 'self') as child_login_id,
       (select string_agg(t || '=' || n, ' ' order by t) from (
          select ct.t, (xpath('/row/n/text()', query_to_xml(format('select count(*) as n from public.%I where learner_id = %L', ct.t, k.id), false, true, '')))[1]::text::int as n
            from child_tables ct) x where n > 0) as rows_per_table
  from kids k
 order by k.display_name;
