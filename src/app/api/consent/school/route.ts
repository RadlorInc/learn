import { NextResponse } from 'next/server'
import { sinkHandled } from '@/infra/errorSink'
import { callerKey, overLimit } from '../../_rateLimit'
import { NOTICE_VERSION } from '@/features/consent/copy'
import { ConfigMissing, requireConfig, PRIVACY_VERSION, TERMS_VERSION, rpc, adultFromBearer, type RpcError } from '@/features/consent/server'

/**
 * A teacher states that their school authorised them to add their students (migration 20261113130000, attorney item
 * A3). Records a granted ACCOUNT consent of method 'school_official' naming the school; the learner gate then lets
 * this teacher add students exactly as a parent with email-plus consent adds children.
 *
 * The caller is whoever the token says, never a body field. The notice version is the browser's, checked, as in
 * /api/consent/request: anything but the current one is "reload and read it again".
 */
export async function POST(req: Request) {
  if (overLimit(callerKey(req, 'consent-school'), 5, 10 * 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }
  const body = await req.json().catch(() => ({}))
  if (body?.noticeVersion !== NOTICE_VERSION) return NextResponse.json({ error: 'stale_notice' }, { status: 409 })
  if (body?.agree !== true) return NextResponse.json({ error: 'not_agreed' }, { status: 400 })
  const school = typeof body?.school === 'string' ? body.school.trim() : ''
  if (school.length < 2 || school.length > 120) return NextResponse.json({ error: 'school_name' }, { status: 400 })

  try {
    requireConfig()
    const teacher = (await adultFromBearer(req))?.id
    if (!teacher) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    try {
      const id = await rpc<string>('consent_grant_school', {
        p_teacher: teacher, p_school_name: school, p_notice_version: NOTICE_VERSION,
        p_privacy_version: PRIVACY_VERSION, p_terms_version: TERMS_VERSION, p_lang: 'en',
      })
      return NextResponse.json({ ok: true, id })
    } catch (e) {
      const code = (e as RpcError).code
      if (code === 'P0C03') return NextResponse.json({ error: 'not_eligible' }, { status: 403 })
      if (code === '22023') return NextResponse.json({ error: 'school_name' }, { status: 400 })
      // The function or the notice version is not in this database yet (the app went first). Nothing was written.
      if (code === 'PGRST202' || code === 'P0C04') return NextResponse.json({ error: 'not_ready' }, { status: 503 })
      throw e
    }
  } catch (e) {
    if (e instanceof ConfigMissing) {
      console.error('[consent/school] not configured: missing', e.message)
      return NextResponse.json({ error: 'not_configured' }, { status: 503 })
    }
    console.error('[consent/school] failed', e)
    await sinkHandled('[consent/school] failed', e)
    return NextResponse.json({ error: 'failed' }, { status: 502 })
  }
}
