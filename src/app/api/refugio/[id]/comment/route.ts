import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthUser, nickOf, contieneInsulto } from '@/lib/refugio'

export const dynamic = 'force-dynamic'

const schema = z.object({
  body: z.string().trim().min(1).max(2000),
  anonymous: z.boolean().optional(),
})

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await getAuthUser()
  if (!user) return NextResponse.json({ ok: false, error: 'no-auth' }, { status: 401 })

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Escribe tu respuesta.' }, { status: 400 })
  }
  if (contieneInsulto(parsed.data.body)) {
    return NextResponse.json(
      { ok: false, error: 'En el Refugio cuidamos el respeto. Reformula tu comentario.' },
      { status: 400 },
    )
  }

  const isAnon = Boolean(parsed.data.anonymous)
  const { error } = await supabase.from('inq_comments').insert({
    post_id: Number(params.id),
    user_id: user.id,
    body: parsed.data.body,
    is_anonymous: isAnon,
    author_nick: isAnon ? null : nickOf(user),
  })
  if (error) return NextResponse.json({ ok: false, error: 'db' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
