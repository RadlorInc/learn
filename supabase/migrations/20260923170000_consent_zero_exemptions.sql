-- ═══════════════════════════════════════════════════════════════════════════════════════════════
-- ZERO EXEMPTIONS: EVERY CHILD HAS A CONSENT RECORD, BY STRUCTURE. (Deploy loop D6, 2026-09-23.)
--
-- Every account on production is a team or intern test account (founder's statement). So instead of
-- grandfathering the children that existed before consent was built, this removes them and the
-- exemption with them: from here on no path lets a child exist without a granted consent record.
--
-- ⚠️⚠️ IRREVERSIBLE FOR DATA. It deletes EVERY child and everything about them (every learner_id table
-- cascades; their own logins go too). Adult accounts, profiles and classes stay. Only a restore of the
-- backup taken before it brings the children back — and that rolls back everything else since.
-- Take a backup immediately before approving it, and tell the interns first (founder's gate).
--
-- WHAT IT DOES, IN ORDER (one transaction; any failure rolls the whole file back):
--   1. every child is deleted THROUGH delete_child_data(), not `delete from learners` — a plain delete
--      would leave each child's consent `granted` with learner_id null, i.e. UNUSED, and the add-a-child
--      flow reuses an unused granted consent: the next child would be silently pre-authorised. Through
--      delete_child_data the consent is marked `withdrawn` (the record survives, as evidence) and the
--      child's own login is removed.
--   2. any error_events row tagged to a child that no longer exists is deleted (0 expected: the FK
--      cascades since 20260923140000; kept so the post-condition below is a statement, not a hope).
--   3. the exemption is removed: the view, the grandfather branch in consent_ok(), the INSERT refusal
--      in enforce_learner_consent() (its column is gone), and the column itself.
--   4. learners.consent_id becomes NOT NULL — a STRUCTURE that cannot express a consent-less child,
--      rather than a check that catches one. The trigger still requires the consent to be GRANTED.
--   5. post-conditions, each raising (and so rolling everything back) if false — see the end.
--
-- ⚠️ SECURITY POSTURE: the two functions below are `pg_get_functiondef` output with NAMED lines changed
-- (the grandfather branch; the exempt refusal; one comment). SECURITY DEFINER, SET search_path, owner and
-- grants are UNCHANGED — no privilege change in this file.
--
-- ROLLBACK: structure — re-add `consent_exempt_at timestamptz`, drop NOT NULL on consent_id, restore the
-- two functions and the view from 20260923120000. Data — only the pre-D6 backup.
-- ═══════════════════════════════════════════════════════════════════════════════════════════════

-- 1. every child, through the one deletion routine
do $$
declare r record;
begin
  for r in select id from public.learners loop
    perform public.delete_child_data(r.id);
  end loop;
end $$;

-- 2. crash rows for children that no longer exist
delete from public.error_events e
 where e.learner_id is not null
   and not exists (select 1 from public.learners l where l.id = e.learner_id);

-- 3. the exemption
drop view if exists public.consent_exempt_learners;

CREATE OR REPLACE FUNCTION public.consent_ok(p_learner_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select exists (
    select 1 from public.learners l
     where l.id = p_learner_id
       and exists (
             select 1 from public.parental_consents c
              where c.id = l.consent_id and c.state = 'granted'
           )
  )
$function$;

CREATE OR REPLACE FUNCTION public.enforce_learner_consent()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if tg_op = 'INSERT' then
    if new.consent_id is null
       or not exists (select 1 from public.parental_consents c
                       where c.id = new.consent_id
                         and c.state = 'granted'
                         and c.parent_id = new.created_by
                         -- Phase 2: a consent covers ONE child. Without this, one granted row
                         -- could create any number of children; the bind trigger only ever
                         -- recorded the first.
                         and c.learner_id is null) then
      raise exception 'no granted parental consent for this child — refusing to create them'
        using errcode = 'P0C01',
              hint = 'Create a parental_consents row, move it to granted, and pass its id as '
                     'learners.consent_id. This is not a transient failure.';
    end if;
  else
    -- UPDATE: every child needs live consent; withdrawing it freezes the row (withdrawal deletes it).
    if not public.consent_ok(new.id) then
      raise exception 'no granted parental consent for learner % — refusing to change their record', new.id
        using errcode = 'P0C01',
              hint = 'This is not a transient failure.';
    end if;
  end if;
  return new;
end
$function$;

alter table public.learners drop column consent_exempt_at;

-- 4. no child without a consent record, by structure
alter table public.learners alter column consent_id set not null;

-- 5. post-conditions — any failure raises and the whole migration rolls back
do $$
begin
  if exists (select 1 from public.learners) then
    raise exception 'D6: children remain after the clear';
  end if;
  if exists (select 1 from public.learners l
              where not exists (select 1 from public.parental_consents c
                                 where c.id = l.consent_id and c.state = 'granted')) then
    raise exception 'D6: a child exists without a granted consent record';
  end if;
  if exists (select 1 from public.error_events e
              where e.learner_id is not null
                and not exists (select 1 from public.learners l where l.id = e.learner_id)) then
    raise exception 'D6: orphaned error_events remain';
  end if;
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'learners' and column_name = 'consent_exempt_at') then
    raise exception 'D6: the exemption column still exists';
  end if;
  if not (select attnotnull from pg_attribute where attrelid = 'public.learners'::regclass and attname = 'consent_id') then
    raise exception 'D6: learners.consent_id is not NOT NULL';
  end if;
  if pg_get_functiondef('public.consent_ok(uuid)'::regprocedure) ~* 'exempt' then
    raise exception 'D6: consent_ok still mentions an exemption';
  end if;
end $$;
