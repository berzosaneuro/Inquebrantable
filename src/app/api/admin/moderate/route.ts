import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdmin } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const schema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('hide-post'), id: z.number().int(), hidden: z.boolean() }),
  z.object({ op: z.literal('hide-comment'), id: z.number().int(), hidden: z.boolean() }),
  z.object({ op: z.literal('resolve-report'), id: z.number().int(), status: z.enum(['reviewed', 'dismissed']) }),
  z.object({ op: z.literal('set-daily-question'), question: z.string().trim().min(4).max(300) }),
])

export async function POST(req: Request) {
  if (!isAdmin()) return NextResponse.json({ ok: false }, { status: 401 })
  const admin = getSupabaseAdmin()
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'Falta SUPABASE_SERVICE_ROLE_KEY.' }, { status: 503 })
  }

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 })
  const d = parsed.data

  if (d.op === 'hide-post') {
    await admin.from('inq_posts').update({ hidden: d.hidden }).eq('id', d.id)
  } else if (d.op === 'hide-comment') {
    await admin.from('inq_comments').update({ hidden: d.hidden }).eq('id', d.id)
  } else if (d.op === 'resolve-report') {
    await admin.from('inq_reports').update({ status: d.status }).eq('id', d.id)
  } else if (d.op === 'set-daily-question') {
    await admin.from('inq_daily_questions').update({ active: false }).eq('active', true)
    await admin.from('inq_daily_questions').insert({ question: d.question, active: true })
  }

  return NextResponse.json({ ok: true })
}
