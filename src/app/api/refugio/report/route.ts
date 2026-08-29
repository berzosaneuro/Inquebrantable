import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthUser } from '@/lib/refugio'

export const dynamic = 'force-dynamic'

const schema = z.object({
  targetType: z.enum(['post', 'comment']),
  targetId: z.number().int().positive(),
  reason: z.string().trim().max(500).optional(),
})

export async function POST(req: Request) {
  const { supabase, user } = await getAuthUser()
  if (!user) return NextResponse.json({ ok: false, error: 'no-auth' }, { status: 401 })

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 })

  await supabase.from('inq_reports').insert({
    target_type: parsed.data.targetType,
    target_id: parsed.data.targetId,
    reporter_id: user.id,
    reason: parsed.data.reason || null,
  })
  return NextResponse.json({ ok: true })
}
