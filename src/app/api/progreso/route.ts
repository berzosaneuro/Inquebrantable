import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/supabase/env'

export const dynamic = 'force-dynamic'

function dayKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10)
}

/** Racha actual y más larga de días consecutivos con actividad. */
function streaks(days: string[]) {
  const set = [...new Set(days)].sort()
  if (set.length === 0) return { current: 0, longest: 0, returnedAfterGap: false }
  let longest = 1
  let run = 1
  for (let i = 1; i < set.length; i++) {
    const prev = new Date(set[i - 1])
    const cur = new Date(set[i])
    const diff = Math.round((+cur - +prev) / 86400000)
    if (diff === 1) run++
    else run = 1
    longest = Math.max(longest, run)
  }
  // racha actual: cuenta hacia atrás desde hoy/ayer
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  let current = 0
  if (set.includes(today) || set.includes(yesterday)) {
    let cursor = set.includes(today) ? today : yesterday
    while (set.includes(cursor)) {
      current++
      cursor = new Date(new Date(cursor).getTime() - 86400000).toISOString().slice(0, 10)
    }
  }
  // ¿ha vuelto tras un hueco de 2+ días?
  let returnedAfterGap = false
  for (let i = 1; i < set.length; i++) {
    const diff = Math.round(
      (+new Date(set[i]) - +new Date(set[i - 1])) / 86400000,
    )
    if (diff >= 3) returnedAfterGap = true
  }
  return { current, longest, returnedAfterGap }
}

export async function GET() {
  if (!supabaseConfigured()) return NextResponse.json({ needAuth: true })
  const supabase = createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ needAuth: true })

  const [checkins, tests, kv, posts] = await Promise.all([
    supabase.from('inq_checkins').select('mood, need, created_at').order('created_at'),
    supabase
      .from('inq_test_results')
      .select('score, level_idx, created_at')
      .order('created_at'),
    supabase.from('inq_kv').select('key, value'),
    supabase.from('inq_posts').select('id').limit(1),
  ])

  const checkinRows = checkins.data ?? []
  const activeDays = checkinRows.map((c) => dayKey(c.created_at))
  const st = streaks(activeDays)

  const kvMap: Record<string, unknown> = {}
  for (const r of kv.data ?? []) kvMap[r.key] = r.value

  const hasRitual =
    !!kvMap['inq-ritual-resp'] || !!kvMap['inq-habitos'] || !!kvMap['inq-user-level']
  const progKeys = Object.keys(kvMap).filter((k) => k.startsWith('inq-prog-'))
  const hasProgram = progKeys.length > 0
  const testRows = tests.data ?? []
  const firstTest = testRows[0]
  const lastTest = testRows[testRows.length - 1]
  const askedForHelp = checkinRows.some((c) => c.need === 'ayuda')
  const didLimits = !!kvMap['inq-prog-poner-limites']
  const hasPosted = (posts.data ?? []).length > 0

  const achievements = [
    { id: 'primer-paso', label: 'Primer paso', got: activeDays.length > 0 },
    { id: 'primer-test', label: 'Te has mirado', got: testRows.length > 0 },
    { id: 'primer-ritual', label: 'Primer ritual', got: hasRitual },
    { id: 'refugio', label: 'Hablaste en el Refugio', got: hasPosted },
    { id: 'pedir-ayuda', label: 'Pediste ayuda', got: askedForHelp },
    { id: 'limite', label: 'Trabajaste tus límites', got: didLimits },
    { id: 'volver', label: 'Volviste', got: st.returnedAfterGap },
    { id: 'programa', label: 'Empezaste un programa', got: hasProgram },
    { id: 'siete-dias', label: '7 días contigo', got: st.longest >= 7 },
    { id: 'treinta-dias', label: '30 días de camino', got: st.longest >= 30 },
  ]

  return NextResponse.json({
    activeDays: [...new Set(activeDays)].length,
    streak: st.current,
    longestStreak: st.longest,
    returned: st.returnedAfterGap && st.current > 0,
    checkins: checkinRows.length,
    lastCheckin: checkinRows[checkinRows.length - 1]?.created_at ?? null,
    tests: testRows.map((t) => ({
      score: t.score,
      level_idx: t.level_idx,
      created_at: t.created_at,
    })),
    firstScore: firstTest?.score ?? null,
    lastScore: lastTest?.score ?? null,
    achievements,
  })
}
