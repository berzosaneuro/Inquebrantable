import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthUser } from '@/lib/refugio'

export const dynamic = 'force-dynamic'

const schema = z.object({
  postId: z.number().int().positive().optional(),
  commentId: z.number().int().positive().optional(),
})

export async function POST(req: Request) {
  const { supabase, user } = await getAuthUser()
  if (!user) return NextResponse.json({ ok: false, error: 'no-auth' }, { status: 401 })

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success || (!parsed.data.postId && !parsed.data.commentId)) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  // Se resuelve el autor en servidor (RLS permite leer user_id de contenido
  // visible) y nunca se envía al cliente.
  let authorId: string | null = null
  if (parsed.data.postId) {
    const { data } = await supabase
      .from('inq_posts')
      .select('user_id')
      .eq('id', parsed.data.postId)
      .maybeSingle()
    authorId = data?.user_id ?? null
  } else if (parsed.data.commentId) {
    const { data } = await supabase
      .from('inq_comments')
      .select('user_id')
      .eq('id', parsed.data.commentId)
      .maybeSingle()
    authorId = data?.user_id ?? null
  }

  if (!authorId || authorId === user.id) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  await supabase
    .from('inq_blocks')
    .upsert(
      { blocker_id: user.id, blocked_id: authorId },
      { onConflict: 'blocker_id,blocked_id' },
    )

  return NextResponse.json({ ok: true })
}
