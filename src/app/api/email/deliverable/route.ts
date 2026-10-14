import { NextResponse } from 'next/server'
import { adultFromBearer, undeliverableReason } from '@/features/consent/server'

/**
 * Can we email the signed-in adult? `{ undeliverable: true }` once their own address hard-bounced or complained
 * (`email_undeliverable`). The Waiting card asks, so a consent email that bounced AFTER it was sent does not leave the
 * parent waiting for it. Answers only about the caller's own address, and only a boolean; never names an address.
 */
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const adult = await adultFromBearer(req)
    if (!adult) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    return NextResponse.json({ undeliverable: !!adult.email && (await undeliverableReason(adult.email)) !== null })
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 502 })
  }
}
