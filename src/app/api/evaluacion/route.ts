import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/supabase/env'
import { QUESTIONS, scoreAssessment } from '@/lib/evaluacion'

export const dynamic = 'force-dynamic'

const schema = z.object({
  answers: z.array(z.number().int().min(0).max(3)).length(QUESTIONS.length),
})

async function user() {
  const supabase = createServerSupabase()
  const { data } = await supabase.auth.getUser()
  return { supabase, user: data.user }
}

export async function GET() {
  if (!supabaseConfigured()) return NextResponse.json({ history: [] })
  const { supabase, user: u } = await user()
  if (!u) return NextResponse.json({ history: [] })
  const { data } = await supabase
    .from('inq_test_results')
    .select('score, level_idx, dimensions, created_at')
    .eq('kind', 'full')
    .order('created_at', { ascending: false })
    .limit(24)
  return NextResponse.json({ history: data ?? [] })
}

export async function POST(req: Request) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'no-config' }, { status: 503 })
  }
  const { supabase, user: u } = await user()
  if (!u) return NextResponse.json({ ok: false, error: 'no-auth' }, { status: 401 })

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Respuestas incompletas.' }, { status: 400 })
  }

  const result = scoreAssessment(parsed.data.answers)
  const { error } = await supabase.from('inq_test_results').insert({
    user_id: u.id,
    kind: 'full',
    score: result.average,
    level_idx: result.levelIdx,
    dimensions: result.dimensions,
    answers: parsed.data.answers,
  })
  if (error) return NextResponse.json({ ok: false, error: 'db' }, { status: 500 })

  return NextResponse.json({ ok: true, result })
}
