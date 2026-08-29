import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthUser } from '@/lib/refugio'

export const dynamic = 'force-dynamic'

const schema = z.object({
  kind: z.enum(['acompano', 'entiendo', 'yo_tambien', 'gracias']),
})

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await getAuthUser()
  if (!user) return NextResponse.json({ ok: false, error: 'no-auth' }, { status: 401 })

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 })

  const postId = Number(params.id)
  const { kind } = parsed.data

  const { data: existing } = await supabase
    .from('inq_reactions')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .eq('kind', kind)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('inq_reactions')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .eq('kind', kind)
    return NextResponse.json({ ok: true, active: false })
  }

  await supabase.from('inq_reactions').insert({ post_id: postId, user_id: user.id, kind })
  return NextResponse.json({ ok: true, active: true })
}
