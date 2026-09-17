-- Asks PostgREST to reload its schema cache. Applied to production 2026-09-17 right after 20260917083255_parent_pin,
-- while diagnosing "function not found" answers that turned out to come from probing the WRONG PROJECT
-- (.env.local points at qaymxunzlarwusogwyak, not production wrnjqjhrbnqxornmfisf). Harmless and not needed;
-- kept as a file only so the repo matches production's migration ledger.
notify pgrst, 'reload schema';
