-- error_events — durable crash log for the client ErrorBoundary and the server onRequestError.
--
-- WHY: both paths already `console.error` a structured line, so crashes are visible in Vercel logs
-- — for about an hour, to whoever happens to be looking. Nobody was. That is how the 2026-08-17
-- plan-pointer P0 ran for three months unseen while production's own tables were saying so. A
-- crash that is not retained is a crash nobody can answer a parent about.
--
-- WHY HERE AND NOT SENTRY: this project already has a database, a dashboard the founder opens
-- daily, and no monitoring vendor. A table costs nothing, needs no account, and is queryable today.
-- The `MONITORING_INGEST_URL` seam in `errorSink.ts` is deliberately KEPT, so moving to Sentry
-- later is still a one-env-var change with no code edit — this is the floor, not the ceiling.
--
-- SECURITY: RLS on, and NO insert policy for anon or authenticated. Writes come from the API routes
-- with the service-role key, which bypasses RLS. That is deliberate and is the lesson of
-- `20260816170000_leads_server_only.sql`: `diagnostic_leads` opened an anonymous INSERT surface,
-- named "Supabase Auth rate limits" as the mitigation, and that mitigation does not apply to a
-- PostgREST table write — so anyone holding the public anon key could fill it for free, for ever.
-- ⚠️ DO NOT ADD AN ANON INSERT POLICY HERE. The whole point of routing through `/api/report-error`
-- is that it rate-limits by IP (30/min) and caps every field; an anon grant would reopen the bypass
-- around it.
--
-- ⚠️ NOTHING SENSITIVE IS STORED. Message, stack, path and a learner UUID — no request headers and
-- no bodies, because those carry the Supabase bearer token and child PII (see instrumentation.ts).
-- `learner_id` is a plain uuid column and deliberately NOT a foreign key: a crash must still be
-- recorded when the learner id is stale, absent, or from a device whose row was deleted.

create table public.error_events (
  id          uuid primary key default gen_random_uuid(),
  at          timestamptz not null default now(),
  -- 'client' = the browser ErrorBoundary; 'server' = Next's onRequestError.
  source      text not null check (source in ('client', 'server')),
  message     text not null check (char_length(message) <= 500),
  stack       text check (stack is null or char_length(stack) <= 2000),
  -- client only: React's component stack, which names the chapter that broke.
  component_stack text check (component_stack is null or char_length(component_stack) <= 2000),
  url         text check (url is null or char_length(url) <= 500),
  ua          text check (ua is null or char_length(ua) <= 300),
  -- server only: the coarse request shape. No headers, no body.
  method      text check (method is null or char_length(method) <= 10),
  route_path  text check (route_path is null or char_length(route_path) <= 300),
  digest      text check (digest is null or char_length(digest) <= 100),
  -- WHO. Turns a pile of stack traces into something answerable when a parent writes in.
  learner_id  uuid
);

-- The two questions this table exists to answer: "what broke in the last hour" and "what broke for
-- THIS child". Both are the first thing anyone types after a support email.
create index error_events_at on public.error_events (at desc);
create index error_events_learner on public.error_events (learner_id, at desc) where learner_id is not null;

alter table public.error_events enable row level security;

-- No policies at all, on purpose: RLS with zero policies denies everyone. Service-role bypasses RLS
-- and is the only writer; reads are the Supabase dashboard.
revoke all on public.error_events from anon, authenticated;
