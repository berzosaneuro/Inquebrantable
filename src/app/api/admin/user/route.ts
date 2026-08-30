import { NextResponse } from 'next/server'
import { z } from 'zod'
import { checkAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

const schema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('mute'), userId: z.string().uuid(), muted: z.boolean(), reason: z.string().trim().max(300).optional() }),
  z.object({ op: z.literal('note'), userId: z.string().uuid(), note: z.string().max(2000) }),
])

export async function POST(req: Request) {
  const gate = await checkAdmin()
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.reason }, { status: gate.reason === 'no-session' ? 401 : 403 })

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'bad-body' }, { status: 400 })
  const d = parsed.data

  const args =
    d.op === 'mute'
      ? { p_op: 'mute', p_user: d.userId, p_bool: d.muted, p_text: d.reason ?? null }
      : { p_op: 'note', p_user: d.userId, p_bool: null, p_text: d.note }

  const { error } = await gate.supabase!.rpc('inq_admin_user_op', args)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
