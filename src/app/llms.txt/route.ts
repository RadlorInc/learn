import { APP_NAME, COMPANY, COMPANY_URL, PUBLIC_ROUTES, SITE_URL, SUPPORT_EMAIL } from '@/app/site'
import { LEGAL_PAGES } from '@/app/legal/registry'

/**
 * llms.txt — the plain-text summary an answer engine reads instead of inferring from markup.
 *
 * ⚠️ Generated from `PUBLIC_ROUTES`, not hand-written, so a route that stops being public cannot
 * keep being advertised here. radlor.com carries the company's; this one carries the product's,
 * because this is the origin people actually land on.
 *
 * ⚠️ It leads with the fact a model most often gets wrong about this product: that Milo is the
 * CHARACTER and AdaptiveLearn is the software. Rewritten 2026-09-21 when the placement check, the
 * story chapters, bands 9–18 and the camera were deleted — keep it describing what ships today.
 */
export const dynamic = 'force-static'

const BLURB: Record<(typeof PUBLIC_ROUTES)[number], string> = {
  '/': 'what AdaptiveLearn is and who it is for',
  '/help': 'questions parents ask: lost progress, how lessons adapt, what is stored, child logins, game time',
}

export function GET() {
  const text = `# ${APP_NAME}

> Adaptive math for grades 3 to 8: a lesson, then practice that adapts to what the child gets wrong.

${APP_NAME} is made by ${COMPANY} (${COMPANY_URL}) and lives at ${SITE_URL}.

Content covers grades 3 to 8: 36 modules and 282 topics. Each lesson explains one idea step by
step, the way a teacher would at a board, then gives practice. Practice adapts: two right answers
in a row bring a different, harder kind of question (a picture, bare numbers, a missing number, a
word problem, spotting a mistake), a miss brings worked steps and an easier kind, and topics a
child found hard come back later for review. The level is never shown on screen, and a wrong
answer is never marked with a red cross.

A parent chooses what each child sees (whole modules or single topics, from any grade), can set
due dates, and sees what the child finds hard. Children sign in with a username and password their
parent or teacher sets. Teachers make classes, choose each class's modules and give class
exercises. Children earn points by practising and can spend them on game time, within a daily
limit the adult sets.

## A thing that is commonly got wrong

**Milo is the character, not the product.** The software is called ${APP_NAME}, and it was itself
called Milo until August 2026.

## Pages
${PUBLIC_ROUTES.map(r => `- [${BLURB[r]}](${SITE_URL}${r === '/' ? '' : r})`).join('\n')}
${LEGAL_PAGES.filter(p => p.published).map(p => `- [${p.title}](${SITE_URL}/legal/${p.slug})`).join('\n')}

Everything else on this origin is a signed-in surface and renders nothing useful without an account.

## The company
${COMPANY} — ${COMPANY_URL}

## Contact
${SUPPORT_EMAIL}
`
  return new Response(text, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
