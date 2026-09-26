-- fix-MAP-02-before.sql — READ-ONLY. Run by Rafi in the Supabase SQL editor (production), not by an agent.
--
-- MAP-02: until this fix the Stripe webhook stored the WHOLE Stripe event in billing_events.payload,
-- including the parent's email / name / phone / address (checkout.session.completed →
-- data.object.customer_details) and our own account id (client_reference_id, metadata.account_id).
-- billing_events survives account deletion, so such a row would still identify the family.
--
-- Billing is in Stripe TEST mode and not switched on, so the EXPECTED result is 0 rows total.
-- If `rows_with_pii` is not 0, tell the agent: the fix then needs a one-off scrub migration.
--
-- Columns:
--   total_rows          every billing_events row (expected 0; a positive control that the table was read)
--   livemode_rows       rows whose event says livemode = true (real money; expected 0)
--   rows_with_pii       rows whose payload holds an email, name, phone or address anywhere,
--                       or our account id via client_reference_id / metadata
--   rows_with_email     subset: an email-shaped string anywhere in the payload text
--   rows_with_address   subset: an "address" key anywhere in the payload
--   newest_at           when the newest row was written (null when the table is empty)
select
  count(*)                                                                      as total_rows,
  count(*) filter (where payload #>> '{livemode}' = 'true')                     as livemode_rows,
  count(*) filter (where payload::text ~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}'
                      or payload::text ~ '"(name|phone|address|customer_details|customer_email|client_reference_id)"'
                      or payload #> '{data,object,metadata,account_id}' is not null)  as rows_with_pii,
  count(*) filter (where payload::text ~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}')    as rows_with_email,
  count(*) filter (where payload::text ~ '"address"')                                as rows_with_address,
  max(at)                                                                       as newest_at
from public.billing_events;
