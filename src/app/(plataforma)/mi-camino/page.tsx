import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/supabase/env'
import { LEVELS } from '@/lib/evaluacion'

export const dynamic = 'force-dynamic'

const MOOD_VAL: Record<string, number> = {
  mal: 0, ansiosa: 1, triste: 1, agotada: 2, normal: 3, bien: 4, muy_bien: 5,
}
const PROGRAMS: Record<string, string> = {
  'volver-a-ti': 'Volver a ti',
  'recuperar-valor': 'Recuperar tu valor',
  'poner-limites': 'Poner límites',
  'sanar-relacion': 'Sanar una relación',
}

function Spark({ points }: { points: number[] }) {
  if (points.length < 2) return null
  const w = 300
  const h = 80
  const max = 5
  const step = w / (points.length - 1)
  const y = (v: number) => h - 6 - (v / max) * (h - 16)
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${i * step},${y(p)}`).join(' ')
  const area = `${d} L${w},${h} L0,${h} Z`
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <path className="fill" d={area} />
      <path className="line" d={d} />
    </svg>
  )
}

export default async function MiCaminoPage() {
  let loggedIn = false
  let nick: string | null = null
  let levelIdx: number | null = null
  let score = 0
  let week: number[] = []
  let program: { name: string; paso: number } | null = null
  let achievements = 0

  if (supabaseConfigured()) {
    try {
      const supabase = createServerSupabase()
      const { data: auth } = await supabase.auth.getUser()
      if (auth.user) {
        loggedIn = true
        nick =
          (auth.user.user_metadata?.nick as string | undefined) ||
          auth.user.email?.split('@')[0] ||
          null
        const [test, checkins, kv] = await Promise.all([
          supabase
            .from('inq_test_results')
            .select('level_idx, score')
            .eq('kind', 'full')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase.from('inq_checkins').select('mood, created_at').order('created_at', { ascending: false }).limit(40),
          supabase.from('inq_kv').select('key, value'),
        ])
        if (test.data) {
          levelIdx = test.data.level_idx
          score = test.data.score ?? 0
        }
        // últimos 7 días de estado
        const byDay: Record<string, number> = {}
        for (const c of checkins.data ?? []) {
          const d = c.created_at.slice(0, 10)
          if (!(d in byDay)) byDay[d] = MOOD_VAL[c.mood] ?? 3
        }
        for (let i = 6; i >= 0; i--) {
          const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10)
          week.push(d in byDay ? byDay[d] : 3)
        }
        // programa en curso
        for (const r of kv.data ?? []) {
          if (r.key.startsWith('inq-prog-')) {
            const slug = r.key.replace('inq-prog-', '')
            const paso = (r.value as { paso?: number })?.paso ?? 0
            if (!program || paso > program.paso) program = { name: PROGRAMS[slug] || 'Tu programa', paso }
          }
        }
        // logros (simplificado)
        const kvMap: Record<string, unknown> = {}
        for (const r of kv.data ?? []) kvMap[r.key] = r.value
        const got = [
          (checkins.data ?? []).length > 0,
          !!test.data,
          !!kvMap['inq-ritual-resp'] || !!kvMap['inq-habitos'],
          !!program,
          !!kvMap['inq-terapia-hist'],
        ]
        achievements = got.filter(Boolean).length
      }
    } catch {
      /* invitada */
    }
  }

  if (!loggedIn) {
    return (
      <>
        <div className="plat-head">
          <div className="h-title">
            <h1>Mi camino</h1>
            <p className="sub">Tu evolución, paso a paso.</p>
          </div>
        </div>
        <p className="lede">
          Aquí verás tu nivel, tu mapa emocional, tu siguiente paso y tu progreso. Necesitas
          una cuenta para empezar.
        </p>
        <Link href="/clasica#menu" className="btn block">
          Crear cuenta / entrar
        </Link>
      </>
    )
  }

  const level = levelIdx != null ? LEVELS[levelIdx] : null

  return (
    <>
      <div className="plat-head">
        <div className="h-title">
          <h1>Mi camino</h1>
          <p className="sub">Tu evolución, paso a paso.</p>
        </div>
        <Link href="/clasica#notif" className="h-icon" aria-label="Notificaciones">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      {level ? (
        <div className="card">
          <p className="c-label">Tu nivel actual</p>
          <p className="c-title">{level.name}</p>
          <p className="c-sub">Nivel {level.idx + 1} de 4 · {score}%</p>
          <div className="bar" style={{ marginTop: 12 }}>
            <span style={{ width: `${Math.max(4, score)}%` }} />
          </div>
        </div>
      ) : (
        <div className="card">
          <p className="c-label">Tu nivel actual</p>
          <p className="c-title">Sin evaluar</p>
          <p className="c-sub">Haz la evaluación para descubrir dónde estás.</p>
          <Link href="/evaluacion" className="btn block" style={{ marginTop: 14 }}>
            Hacer la evaluación
          </Link>
        </div>
      )}

      {week.length > 1 && (
        <div className="card">
          <p className="c-label">Tu mapa emocional</p>
          <p className="c-sub" style={{ marginBottom: 10 }}>Así te has sentido esta semana.</p>
          <Spark points={week} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink-mute)', marginTop: 4 }}>
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => <span key={d}>{d}</span>)}
          </div>
        </div>
      )}

      <div className="card">
        <p className="c-label">Tu siguiente paso</p>
        <p className="c-title" style={{ fontSize: '1.4rem' }}>Respiración consciente</p>
        <p className="c-sub">5 min · Calma tu mente y tu cuerpo.</p>
        <Link href="/clasica#ritual" className="btn block" style={{ marginTop: 14 }}>
          Empezar ahora
        </Link>
      </div>

      {program && (
        <div className="card">
          <p className="c-label">Tu programa</p>
          <p className="c-title" style={{ fontSize: '1.4rem' }}>{program.name}</p>
          <p className="c-sub">Paso {program.paso + 1}</p>
          <div className="bar" style={{ marginTop: 12 }}>
            <span style={{ width: `${Math.min(100, (program.paso / 5) * 100)}%` }} />
          </div>
          <Link href="/clasica#programas" style={{ color: 'var(--rose-deep)', fontSize: 13, display: 'inline-block', marginTop: 10 }}>
            Continuar →
          </Link>
        </div>
      )}

      <div className="card-grid">
        <Link href="/progreso" className="card" style={{ textDecoration: 'none' }}>
          <p className="c-label">Tu progreso</p>
          <p style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', color: 'var(--ink)', margin: '4px 0' }}>
            Estás avanzando
          </p>
          <p className="c-sub">Paso a paso, sin prisa.</p>
        </Link>
        <Link href="/progreso" className="card" style={{ textDecoration: 'none' }}>
          <p className="c-label">Tus logros</p>
          <p style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', color: 'var(--rose-deep)', margin: '2px 0' }}>
            {achievements} logros
          </p>
          <p className="c-sub">Sigue así, lo estás haciendo bien.</p>
        </Link>
      </div>

      <div className="card">
        <p className="c-label">Tu diario</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <p className="c-sub" style={{ margin: 0 }}>Escribe lo que necesitas soltar.</p>
          <Link
            href="/diario"
            aria-label="Nueva entrada"
            style={{
              flex: 'none', width: 38, height: 38, borderRadius: '50%',
              background: 'var(--rose)', color: 'var(--navy-deep)',
              display: 'grid', placeItems: 'center', textDecoration: 'none', fontSize: 20,
            }}
          >
            +
          </Link>
        </div>
      </div>

      <div className="rows" style={{ marginTop: 20 }}>
        <Link href="/evaluacion"><span>Evaluación {level && '· repetir'}</span><span className="arw">→</span></Link>
        <Link href="/mapa"><span>Mapa emocional completo</span><span className="arw">→</span></Link>
        <Link href="/clasica#niveles"><span>El camino de niveles</span><span className="arw">→</span></Link>
      </div>
    </>
  )
}
