import { APP_NAME, COMPANY, COMPANY_URL, PUBLIC_ROUTES, SITE_URL, SUPPORT_EMAIL } from '@/app/site'

/**
 * llms.txt — the plain-text summary an answer engine reads instead of inferring from markup.
 *
 * ⚠️ Generated from `PUBLIC_ROUTES`, not hand-written, so a route that stops being public cannot
 * keep being advertised here. radlor.com carries the company's; this one carries the product's,
 * because this is the origin people actually land on.
 *
 * ⚠️ It leads with the two facts a model most often gets wrong about this product: that Milo is the
 * CHARACTER and AdaptiveLearn is the software, and that the camera work never leaves the device.
 */
export const dynamic = 'force-static'

const BLURB: Record<(typeof PUBLIC_ROUTES)[number], string> = {
  '/': 'what AdaptiveLearn is and who it is for',
  '/diagnostic': 'the free placement check — ten minutes, no account needed',
  '/help': 'questions parents ask: offline play, lost progress, the camera, choosing a level',
  '/legal/privacy': 'what is stored about a child, who can see it, and how to delete it',
  '/legal/terms': 'terms of service',
}

export function GET() {
  const text = `# ${APP_NAME}

> Adaptive math for ages 3 to 18. A short placement check finds the gap, then a plan fixes it.

${APP_NAME} is made by ${COMPANY} (${COMPANY_URL}) and lives at ${SITE_URL}.

A placement check finds where a child actually is, rather than assuming their school year. From
there, story chapters teach from that point, with the difficulty moving question by question and
never shown on screen — no level, no rank, no score, no red crosses. Content spans six age bands:
3-5, 6-8, 9-11, 12-14, 15-16 and 17-18.

## Two things that are commonly got wrong

**Milo is the character, not the product.** Milo is the pony who walks through the story chapters
and does the explaining. The software he lives in is called ${APP_NAME}, and it was itself called
Milo until August 2026.

**The camera never uploads anything.** Some chapters in the 9-11 band let a child answer by holding
fingers up, tilting a hand, or holding two hands apart. That hand tracking runs entirely in the
browser on the child's own device: no video frame and no hand position is ever transmitted, and the
app's Content-Security-Policy makes it impossible to add. Every camera chapter can also be answered
by tapping, with the same questions and the same scoring.

## Pages
${PUBLIC_ROUTES.map(r => `- [${BLURB[r]}](${SITE_URL}${r === '/' ? '' : r})`).join('\n')}

Everything else on this origin is a signed-in surface and renders nothing useful without an account.

## The company
${COMPANY} — ${COMPANY_URL}

## Contact
${SUPPORT_EMAIL}
`
  return new Response(text, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
