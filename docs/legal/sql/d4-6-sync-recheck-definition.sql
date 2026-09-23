-- READ-ONLY. Production's sync_recheck, every overload, in full — a definition, no user data — plus
-- markers for the authorization check. The repo's final version (5 arguments) has md5 5871da3484227246e88962e59c2f3d5c.
select format('public_tables=%s has_learners=%s', (select count(*) from pg_tables where schemaname = 'public'),
              to_regclass('public.learners') is not null)                        as db,
       p.oid::regprocedure::text                                                 as signature,
       md5(pg_get_functiondef(p.oid))                                            as def_md5,
       pg_get_functiondef(p.oid) ~* 'from\s+public\.learner_access'              as reads_learner_access,
       pg_get_functiondef(p.oid) ~* 'auth\.uid\(\)'                              as checks_auth_uid,
       pg_get_functiondef(p.oid) ~* '42501'                                      as raises_42501,
       pg_get_functiondef(p.oid)                                                 as definition
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'sync_recheck'
 order by 2;
