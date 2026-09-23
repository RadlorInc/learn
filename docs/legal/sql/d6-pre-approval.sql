-- D6 pre-approval check. READ-ONLY; no personal data (Resend ids are opaque).
--   ledger: which repo migrations (main @ a6b08182, 104 files) production has not recorded, and any version
--           production has that the repo lacks. Expected: pending = 20260923170000 only; ledger_rows = 103.
--   b3:     every consent whose delayed second email (B3) is scheduled — its Resend id, state, and when it is due.
with repo(v) as (values ('20260615083757'),('20260615123941'),('20260615142012'),('20260615142049'),('20260615142138'),('20260615142414'),('20260615142513'),('20260615142939'),('20260616074944'),('20260616094022'),('20260616094232'),('20260616100231'),('20260616112002'),('20260616113036'),('20260616114634'),('20260616120411'),('20260616131455'),('20260616133249'),('20260616135344'),('20260616141828'),('20260617004359'),('20260617004432'),('20260617005044'),('20260617012517'),('20260617013927'),('20260617015724'),('20260617061215'),('20260617062300'),('20260617063532'),('20260617101451'),('20260617103206'),('20260617111507'),('20260617133302'),('20260617133316'),('20260617140142'),('20260617144759'),('20260617145125'),('20260617150142'),('20260617150311'),('20260628083735'),('20260628083921'),('20260628181320'),('20260629023238'),('20260629023502'),('20260702032342'),('20260702090611'),('20260702113253'),('20260702121810'),('20260702131627'),('20260702140622'),('20260702145218'),('20260702163943'),('20260702164343'),('20260703014247'),('20260703014331'),('20260705161254'),('20260705161328'),('20260705163002'),('20260705164509'),('20260718103024'),('20260721053831'),('20260817142406'),('20260817174352'),('20260817174723'),('20260817175739'),('20260820111858'),('20260823195529'),('20260823213619'),('20260823213657'),('20260823215352'),('20260823221818'),('20260823222038'),('20260823222545'),('20260823225313'),('20260824133906'),('20260824134125'),('20260825030558'),('20260903100000'),('20260903100100'),('20260905110530'),('20260905120000'),('20260905130000'),('20260905140000'),('20260905150000'),('20260905160000'),('20260914015455'),('20260917072319'),('20260917083255'),('20260917083744'),('20260917090504'),('20260917112109'),('20260917112252'),('20260917114845'),('20260918100000'),('20260918120000'),('20260918140000'),('20260920151900'),('20260921053233'),('20260921182306'),('20260923120000'),('20260923130000'),('20260923140000'),('20260923150000'),('20260923170000'))
select * from (
  select 1 as ord, 'ledger' as kind,
         format('ledger_rows=%s repo_files=%s', (select count(*) from supabase_migrations.schema_migrations), (select count(*) from repo)) as a,
         (select coalesce(string_agg(v, ' ' order by v), 'none') from repo where v not in (select version from supabase_migrations.schema_migrations)) as b,
         (select coalesce(string_agg(version, ' ' order by version), 'none') from supabase_migrations.schema_migrations where version not in (select v from repo)) as c,
         null::text as d
  union all
  select 2, 'b3', c.state, c.second_email_provider_id,
         to_char(c.second_notice_scheduled_for at time zone 'UTC', 'YYYY-MM-DD HH24:MI "UTC"'),
         case when c.learner_id is null then 'no child linked' else 'child ' || (exists (select 1 from public.learners l where l.id = c.learner_id))::text end
    from public.parental_consents c
   where c.second_email_provider_id is not null
) r order by ord;
-- Columns: for 'ledger' → a = counts, b = repo versions NOT on production (pending), c = production versions NOT in the repo.
--          for 'b3'     → a = consent state, b = Resend id of the scheduled second email, c = when it is due, d = the child.
