import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseConfigured } from '@/lib/supabase/env'
import { getAuthUser, nickOf, contieneInsulto } from '@/lib/refugio'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!supabaseConfigured()) return NextResponse.json({ question: null, answers: [] })
  const { supabase, user } = await getAuthUser()

  const { data: q } = await supabase
    .from('inq_daily_questions')
    .select('id, question')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!q) return NextResponse.json({ question: null, answers: [] })
  if (!user) {
    return NextResponse.json({ question: q, answers: [], needAuth: true })
  }

  const { data: answers } = await supabase
    .from('inq_daily_answers')
    .select('id, author_nick, body, is_anonymous, created_at, user_id')
    .eq('question_id', q.id)
    .order('created_at', { ascending: false })
    .limit(80)

  return NextResponse.json({
    question: q,
    answers: (answers ?? []).map((a) => ({
      id: a.id,
      author: a.is_anonymous ? 'Anónima' : a.author_nick || 'Anónima',
      body: a.body,
      created_at: a.created_at,
      isMine: a.user_id === user.id,
    })),
  })
}

const schema = z.object({
  questionId: z.number().int().positive(),
  body: z.string().trim().min(1).max(1500),
  anonymous: z.boolean().optional(),
})

export async function POST(req: Request) {
  const { supabase, user } = await getAuthUser()
  if (!user) return NextResponse.json({ ok: false, error: 'no-auth' }, { status: 401 })

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Escribe tu respuesta.' }, { status: 400 })
  if (contieneInsulto(parsed.data.body)) {
    return NextResponse.json({ ok: false, error: 'Cuidamos el respeto. Reformula tu respuesta.' }, { status: 400 })
  }

  const isAnon = parsed.data.anonymous !== false
  const { error } = await supabase.from('inq_daily_answers').insert({
    question_id: parsed.data.questionId,
    user_id: user.id,
    body: parsed.data.body,
    is_anonymous: isAnon,
    author_nick: isAnon ? null : nickOf(user),
  })
  if (error) return NextResponse.json({ ok: false, error: 'db' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
