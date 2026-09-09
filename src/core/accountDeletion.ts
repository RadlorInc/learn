/**
 * WHAT SURVIVES ACCOUNT DELETION — one declaration, read by the page a parent reads, by the gate
 * that proves it, and (once counsel has written it) by §11 of the Terms.
 *
 * ⚠️ A DELETION CLAUSE THAT QUIETLY EXCEPTS SOMETHING IS THE SAME DEFECT AS DESCRIBING A TOOL YOU
 * DO NOT RUN. Everything on this list is something a parent is told about in plain words before
 * they confirm. If a table ever survives deletion and is NOT on this list,
 * `accountDeletion.test.ts` goes red naming it — which is the moment §11 would otherwise have
 * become a false statement.
 *
 * ⚠️ ADDING A ROW HERE IS A DECISION, NOT A FIX. The first instinct on a red gate is to add the
 * surviving table to this list and move on. That is exactly backwards: the question is whether the
 * table SHOULD survive, and the answer is almost always no. A new row needs a legal reason a
 * parent would accept, written out, and the Terms have to change in the same commit.
 */
export interface Survivor {
  /** The table, qualified, exactly as `pg_class` reports it. */
  table: string
  /** What is left in it once the account is gone. */
  what: string
  /** Why it may not be deleted. This is the sentence §11 has to be able to stand behind. */
  why: string
}

export const SURVIVORS: readonly Survivor[] = [
  {
    table: 'public.billing_events',
    what: 'the record that a payment happened — amount, date and Stripe\'s own reference',
    why: 'accounting and tax rules require a business to keep a record of payments received. '
       + 'The row is stripped of who it belonged to: billing_events.account_id is ON DELETE SET '
       + 'NULL, so after deletion it names nobody and cannot be joined back to a family.',
  },
] as const

/**
 * Held by a third party rather than by us, so deletion here cannot reach it. Named separately
 * because "we deleted everything" is false if a processor still holds a copy, and a parent asking
 * about their data deserves to be pointed at the right door.
 */
export const HELD_ELSEWHERE = [
  {
    who: 'Stripe',
    what: 'its own record of any payment, under its own retention rules',
    why: 'Stripe is the payment processor and is a controller of that record in its own right; we '
       + 'do not control how long it keeps it.',
  },
] as const

/**
 * ⚠️ NOT A SURVIVOR, AND WORTH SAYING SO. `diagnostic_leads` holds an email address given to the
 * logged-out placement check BEFORE any account existed. It is keyed on the address, has no
 * user_id and no learner_id, so nothing links it to an account and account deletion cannot find
 * it. It prunes at 24 months and the Privacy Policy already says so — but a parent who used the
 * free check and then signed up with the same address still has that row after deleting their
 * account, and they can only get rid of it by writing in. That is a real gap in the promise; it is
 * recorded here rather than silently ignored.
 */
export const NOT_REACHABLE_BY_DELETION = 'public.diagnostic_leads' as const
