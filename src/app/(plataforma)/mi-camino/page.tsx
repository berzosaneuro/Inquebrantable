import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/supabase/env'
import { LEVELS } from '@/lib/evaluacion'
import { PlatHeader, IconBell, IconPlus, Butterfly, Leaf } from '../_ui'

export const dynamic = 'force-dynamic'

const MOOD_VAL: Record<string, number> = {
  mal: 0, ansiosa: 1, triste: 1, agotada: 2, normal: 3, bien: 4, muy_bien: 4,
}
const PROGRAMS: Record<string, string> = {
  'volver-a-ti': 'Volver a ti',
  'recuperar-valor': 'Recuperar tu valor',
  'poner-limites': 'Poner límites',
  'sanar-relacion': 'Sanar una relación',
}

/** Área suave del estado de ánimo semanal (valores 0–4). */
function MoodChart({ week }: { week: number[] }) {
  const w = 280
  const h = 96
  const max = 4
  const step = w / (week.length - 1)
  const y = (v: number) => 10 + (1 - v / max) * (h - 22)
  const pts = week.map((v, i) => [i * step, y(v)] as const)
  // curva suavizada
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const cx = (x0 + x1) / 2
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`
  }
  const area = `${d} L${w},${h} L0,${h} Z`
  return (
    <div className="emochart">
      <div className="yax" aria-hidden>
        <span>😄</span><span>🙂</span><span>😐</span><span>😔</span><span>😣</span>
      </div>
      <div className="plot">
        <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--rose)" stopOpacity="0.34" />
              <stop offset="100%" stopColor="var(--rose)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path className="fill" d={area} />
          <path className="line" d={d} />
          <circle className="dot" cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.4" />
        </svg>
        <div className="xax">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((x) => <span key={x}>{x}</span>)}
        </div>
      </div>
    </div>
  )
}

export default async function MiCaminoPage() {
  let nick: string | null = null
  let levelIdx = 1
  let score = 35
  let week = [2, 1, 2, 3, 2, 3, 4]
  let program:
    | { name: string; paso: number; modulo?: number; sesion?: number; pct?: number }
    | null = { name: 'Reconstruyéndome', paso: 2, modulo: 3, sesion: 2, pct: 60 }
  let achievements = 4

  if (supabaseConfigured()) {
    try {
      const supabase = createServerSupabase()
      const { data: auth } = await supabase.auth.getUser()
      if (auth.user) {
        nick =
          (auth.user.user_metadata?.nick as string | undefined) ||
          auth.user.email?.split('@')[0] ||
          null
        const [test, checkins, kv] = await Promise.all([
          supabase.from('inq_test_results').select('level_idx, score').eq('kind', 'full').order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('inq_checkins').select('mood, created_at').order('created_at', { ascending: false }).limit(40),
          supabase.from('inq_kv').select('key, value'),
        ])
        if (test.data) {
          levelIdx = test.data.level_idx ?? 1
          score = test.data.score ?? 0
        }
        if ((checkins.data ?? []).length) {
          const byDay: Record<string, number> = {}
          for (const c of checkins.data ?? []) {
            const d = c.created_at.slice(0, 10)
            if (!(d in byDay)) byDay[d] = MOOD_VAL[c.mood] ?? 3
          }
          week = []
          for (let i = 6; i >= 0; i--) {
            const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10)
            week.push(d in byDay ? byDay[d] : 2)
          }
        }
        let found: { name: string; paso: number } | null = null
        const kvMap: Record<string, unknown> = {}
        for (const r of kv.data ?? []) {
          kvMap[r.key] = r.value
          if (r.key.startsWith('inq-prog-')) {
            const slug = r.key.replace('inq-prog-', '')
            const paso = (r.value as { paso?: number })?.paso ?? 0
            if (!found || paso > found.paso) found = { name: PROGRAMS[slug] || 'Tu programa', paso }
          }
        }
        program = found
        achievements = [
          (checkins.data ?? []).length > 0,
          !!test.data,
          !!kvMap['inq-ritual-resp'] || !!kvMap['inq-habitos'],
          !!found,
          !!kvMap['inq-terapia-hist'],
        ].filter(Boolean).length
      }
    } catch {
      /* invitada → datos de muestra */
    }
  }

  const level = LEVELS[levelIdx] ?? LEVELS[1]

  return (
    <>
      <PlatHeader
        title="Mi camino"
        sub={nick ? `Tu evolución, ${nick}.` : 'Tu evolución, paso a paso.'}
        action={
          <Link href="/notificaciones" className="tb-btn" aria-label="Notificaciones">
            <IconBell />
          </Link>
        }
      />

      <div className="card has-ring">
        <div className="ring-deco" aria-hidden><Butterfly /></div>
        <p className="c-label">Tu nivel actual</p>
        <p className="c-title">{level.name}</p>
        <p className="c-sub">Nivel {level.idx + 1} de 4 · {Math.round(score)}%</p>
        <div className="bar" style={{ marginTop: 12 }}>
          <span style={{ width: `${Math.max(5, score)}%` }} />
        </div>
      </div>

      <div className="card">
        <p className="c-label">Tu mapa emocional</p>
        <p className="c-sub">Así te has sentido esta semana.</p>
        <MoodChart week={week} />
        <Link href="/mapa" className="link-rose">Ver mapa completo →</Link>
      </div>

      <div className="card">
        <div className="deco r" aria-hidden><Leaf /></div>
        <p className="c-label">Tu siguiente paso</p>
        <p className="c-title" style={{ fontSize: '1.45rem' }}>Respiración consciente</p>
        <p className="c-sub">5 min · Calma tu mente y tu cuerpo.</p>
        <Link href="/ritual" className="btn sm" style={{ marginTop: 14 }}>Empezar ahora</Link>
      </div>

      {program ? (
        <div className="card" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="c-label">Tu programa</p>
            <p className="c-title" style={{ fontSize: '1.4rem' }}>{program.name}</p>
            <p className="c-sub">
              Módulo {program.modulo ?? Math.floor(program.paso / 3) + 1} · Sesión {program.sesion ?? (program.paso % 3) + 1}
            </p>
            {(() => {
              const pct = program.pct ?? Math.min(100, 20 + program.paso * 20)
              return (
                <>
                  <div className="bar" style={{ marginTop: 12 }}>
                    <span style={{ width: `${pct}%` }} />
                  </div>
                  <p className="pct">{pct}% completado</p>
                </>
              )
            })()}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="thumb" src="/pregunta.jpg" alt="" />
        </div>
      ) : (
        <div className="card">
          <p className="c-label">Tu programa</p>
          <p className="c-title" style={{ fontSize: '1.4rem' }}>Elige un programa</p>
          <p className="c-sub">Un recorrido guiado de varias sesiones para lo que ahora te pesa.</p>
          <Link href="/programas" className="btn sm" style={{ marginTop: 14 }}>Ver programas</Link>
        </div>
      )}

      <div className="card-grid">
        <Link href="/progreso" className="card" style={{ textDecoration: 'none' }}>
          <p className="c-label">Tu progreso</p>
          <p style={{ fontFamily: 'var(--serif)', fontSize: '1.35rem', color: 'var(--ink)', margin: '2px 0 4px', lineHeight: 1.1 }}>
            Estás avanzando
          </p>
          <p className="c-sub">Paso a paso, sin prisa.</p>
          <span className="link-rose" style={{ marginTop: 10 }}>Ver detalle →</span>
        </Link>
        <Link href="/progreso" className="card" style={{ textDecoration: 'none' }}>
          <p className="c-label">Tus logros</p>
          <p style={{ fontFamily: 'var(--serif)', fontSize: '1.7rem', color: 'var(--rose-deep)', margin: '0 0 2px' }}>
            {achievements} logros
          </p>
          <p className="c-sub">Sigue así, lo estás haciendo bien.</p>
        </Link>
      </div>

      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
        <div>
          <p className="c-label">Tu diario</p>
          <p className="c-sub" style={{ margin: 0 }}>Escribe lo que necesitas soltar.</p>
        </div>
        <Link href="/diario" className="add-fab" aria-label="Nueva entrada"><IconPlus /></Link>
      </div>

      <div className="rows" style={{ marginTop: 18 }}>
        <Link href="/evaluacion"><span>Repetir evaluación</span><span className="arw">→</span></Link>
        <Link href="/niveles"><span>El camino de niveles</span><span className="arw">→</span></Link>
      </div>
    </>
  )
}
