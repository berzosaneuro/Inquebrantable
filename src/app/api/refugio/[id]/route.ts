import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/refugio'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await getAuthUser()
  if (!user) return NextResponse.json({ ok: false, error: 'no-auth' }, { status: 401 })
  const id = Number(params.id)

  const { data: post } = await supabase
    .from('inq_posts')
    .select('id, circle_slug, author_nick, body, is_anonymous, created_at, user_id')
    .eq('id', id)
    .maybeSingle()
  if (!post) return NextResponse.json({ ok: false, error: 'not-found' }, { status: 404 })

  const { data: comments } = await supabase
    .from('inq_comments')
    .select('id, author_nick, body, is_anonymous, created_at, user_id')
    .eq('post_id', id)
    .order('created_at')

  return NextResponse.json({
    ok: true,
    post: {
      id: post.id,
      circle_slug: post.circle_slug,
      author: post.is_anonymous ? 'Anónima' : post.author_nick || 'Anónima',
      body: post.body,
      created_at: post.created_at,
      isMine: post.user_id === user.id,
    },
    comments: (comments ?? []).map((c) => ({
      id: c.id,
      author: c.is_anonymous ? 'Anónima' : c.author_nick || 'Anónima',
      body: c.body,
      created_at: c.created_at,
      isMine: c.user_id === user.id,
    })),
  })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await getAuthUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })
  // RLS (inq_posts_delete_own) garantiza que solo borre las suyas.
  await supabase.from('inq_posts').delete().eq('id', Number(params.id))
  return NextResponse.json({ ok: true })
}
