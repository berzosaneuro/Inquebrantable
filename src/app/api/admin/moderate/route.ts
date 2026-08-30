import { NextResponse } from 'next/server'
import { z } from 'zod'
import { checkAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

const schema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('hide-post'), id: z.number().int(), hidden: z.boolean() }),
  z.object({ op: z.literal('hide-comment'), id: z.number().int(), hidden: z.boolean() }),
  z.object({ op: z.literal('hide-answer'), id: z.number().int(), hidden: z.boolean() }),
  z.object({ op: z.literal('resolve-report'), id: z.number().int(), status: z.enum(['reviewed', 'dismissed']) }),
  z.object({ op: z.literal('handle-message'), id: z.number().int(), handled: z.boolean() }),
  z.object({ op: z.literal('set-daily-question'), question: z.string().trim().min(4).max(300) }),
  z.object({ op: z.literal('add-daily-question'), question: z.string().trim().min(4).max(300) }),
  z.object({ op: z.literal('toggle-daily-question'), id: z.number().int(), active: z.boolean() }),
  z.object({ op: z.literal('delete-daily-question'), id: z.number().int() }),
  z.object({ op: z.literal('dismiss-crisis'), contentType: z.enum(['post', 'comment', 'answer']), contentId: z.number().int() }),
  z.object({ op: z.literal('add-admin'), email: z.string().trim().email() }),
  z.object({ op: z.literal('remove-admin'), email: z.string().trim().email() }),
])

export async function POST(req: Request) {
  const gate = await checkAdmin()
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.reason }, { status: gate.reason === 'no-session' ? 401 : 403 })

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'bad-body' }, { status: 400 })
  const d = parsed.data

  let p_id: number | null = null
  let p_bool: boolean | null = null
  let p_text: string | null = null
  switch (d.op) {
    case 'hide-post':
    case 'hide-comment':
    case 'hide-answer':
      p_id = d.id; p_bool = d.hidden; break
    case 'handle-message':
      p_id = d.id; p_bool = d.handled; break
    case 'resolve-report':
      p_id = d.id; p_text = d.status; break
    case 'set-daily-question':
    case 'add-daily-question':
      p_text = d.question; break
    case 'toggle-daily-question':
      p_id = d.id; p_bool = d.active; break
    case 'delete-daily-question':
      p_id = d.id; break
    case 'dismiss-crisis':
      p_text = `${d.contentType}:${d.contentId}`; break
    case 'add-admin':
    case 'remove-admin':
      p_text = d.email; break
  }

  const { error } = await gate.supabase!.rpc('inq_admin_moderate', { p_op: d.op, p_id, p_bool, p_text })
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
