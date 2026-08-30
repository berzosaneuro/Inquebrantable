import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseConfigured } from '@/lib/supabase/env'
import { getAuthUser, nickOf, contieneInsulto } from '@/lib/refugio'

export const dynamic = 'force-dynamic'

// ── GET: feed de un círculo (o todos) ──
export async function GET(req: Request) {
  if (!supabaseConfigured()) return NextResponse.json({ posts: [], circles: [] })
  const { supabase, user } = await getAuthUser()

  const { data: circles } = await supabase
    .from('inq_circles')
    .select('slug, name, description, sort')
    .order('sort')

  if (!user) {
    return NextResponse.json({ posts: [], circles: circles ?? [], needAuth: true })
  }

  const circle = new URL(req.url).searchParams.get('circle')
  let q = supabase
    .from('inq_posts')
    .select('id, circle_slug, author_nick, body, is_anonymous, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(60)
  if (circle) q = q.eq('circle_slug', circle)
  const { data: rows } = await q

  const ids = (rows ?? []).map((r) => r.id)
  const [{ data: reactions }, { data: comments }] = await Promise.all([
    ids.length
      ? supabase.from('inq_reactions').select('post_id, kind, user_id').in('post_id', ids)
      : Promise.resolve({ data: [] as { post_id: number; kind: string; user_id: string }[] }),
    ids.length
      ? supabase.from('inq_comments').select('post_id').in('post_id', ids)
      : Promise.resolve({ data: [] as { post_id: number }[] }),
  ])

  const commentCount: Record<number, number> = {}
  for (const c of comments ?? []) commentCount[c.post_id] = (commentCount[c.post_id] || 0) + 1

  const reactMap: Record<number, Record<string, number>> = {}
  const myReactMap: Record<number, string[]> = {}
  for (const r of reactions ?? []) {
    reactMap[r.post_id] ??= {}
    reactMap[r.post_id][r.kind] = (reactMap[r.post_id][r.kind] || 0) + 1
    if (r.user_id === user.id) (myReactMap[r.post_id] ??= []).push(r.kind)
  }

  const posts = (rows ?? []).map((r) => ({
    id: r.id,
    circle_slug: r.circle_slug,
    author: r.is_anonymous ? 'Anónima' : r.author_nick || 'Anónima',
    body: r.body,
    is_anonymous: r.is_anonymous,
    created_at: r.created_at,
    isMine: r.user_id === user.id,
    comments: commentCount[r.id] || 0,
    reactions: reactMap[r.id] || {},
    myReactions: myReactMap[r.id] || [],
  }))

  return NextResponse.json({ posts, circles: circles ?? [] })
}

// ── POST: nueva publicación ──
const schema = z.object({
  circle: z.string().min(1).max(40),
  body: z.string().trim().min(1).max(4000),
  anonymous: z.boolean().optional(),
})

export async function POST(req: Request) {
  const { supabase, user } = await getAuthUser()
  if (!user) return NextResponse.json({ ok: false, error: 'no-auth' }, { status: 401 })

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Escribe algo para publicar.' }, { status: 400 })
  }
  if (contieneInsulto(parsed.data.body)) {
    return NextResponse.json(
      { ok: false, error: 'En el Refugio cuidamos el respeto. Reformula tu mensaje.' },
      { status: 400 },
    )
  }

  const { data: muted } = await supabase.rpc('inq_is_muted', { p_user: user.id })
  if (muted === true) {
    return NextResponse.json(
      { ok: false, error: 'Tu cuenta está en pausa en el Refugio. Escríbenos desde Contacto si crees que es un error.' },
      { status: 403 },
    )
  }

  const isAnon = Boolean(parsed.data.anonymous)
  const { error } = await supabase.from('inq_posts').insert({
    user_id: user.id,
    circle_slug: parsed.data.circle,
    body: parsed.data.body,
    is_anonymous: isAnon,
    author_nick: isAnon ? null : nickOf(user),
  })
  if (error) return NextResponse.json({ ok: false, error: 'db' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
