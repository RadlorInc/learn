-- SEC-06 — READ-ONLY. How many stored crash rows still carry a URL query or fragment.
-- For Rafi to run in the SQL editor. SELECT only; changes nothing.
-- New rows stop gaining these once the fix deploys; this counts what was stored before it.
select
  count(*) filter (where url ~ '#')                                  as url_with_fragment,          -- any #…: consent/unsubscribe #t=, implicit-flow #access_token=
  count(*) filter (where url ~ '#.*\bt=')                            as consent_or_unsubscribe_token,
  count(*) filter (where url ~ '[?&](th|token_hash|code)=')          as email_token_or_code_param,
  count(*) filter (where url ~ 'access_token=|refresh_token=')       as session_token,
  count(*) filter (where url ~ '\?')                                 as url_with_any_query,         -- includes harmless ?module=…; upper bound for the cleanup below
  count(*) filter (where url is not null)                            as rows_with_url,              -- control: > 0 or the zeros above mean nothing
  count(*)                                                           as error_events_total,         -- control
  min(at) filter (where url ~ '[?#]')                                as oldest_affected,
  max(at) filter (where url ~ '[?#]')                                as newest_affected              -- should stop advancing after the deploy
from public.error_events;
