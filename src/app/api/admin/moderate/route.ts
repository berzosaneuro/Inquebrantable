import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdmin } from '@/lib/admin-auth'
import { createServerSupabase } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const schema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('hide-post'), id: z.number().int(), hidden: z.boolean() }),
  z.object({ op: z.literal('hide-comment'), id: z.number().int(), hidden: z.boolean() }),
  z.object({
    op: z.literal('resolve-report'),
    id: z.number().int(),
    status: z.enum(['reviewed', 'dismissed']),
  }),
  z.object({ op: z.literal('set-daily-question'), question: z.string().trim().min(4).max(300) }),
])

export async function POST(req: Request) {
  if (!isAdmin()) return NextResponse.json({ ok: false }, { status: 401 })

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 })
  const d = parsed.data

  const supabase = createServerSupabase()
  const { error } = await supabase.rpc('inq_admin_moderate', {
    p_op: d.op,
    p_id: 'id' in d ? d.id : null,
    p_bool: 'hidden' in d ? d.hidden : null,
    p_text:
      d.op === 'resolve-report'
        ? d.status
        : d.op === 'set-daily-question'
          ? d.question
          : null,
  })
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
