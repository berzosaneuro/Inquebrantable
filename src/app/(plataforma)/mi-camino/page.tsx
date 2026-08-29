import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/supabase/env'
import { LEVELS, DIMENSIONS, PRIORITY_PROGRAM, type DimId } from '@/lib/evaluacion'

export const dynamic = 'force-dynamic'

export default async function MiCaminoPage() {
  let loggedIn = false
  let levelIdx: number | null = null
  let priority: DimId | null = null
  let nick: string | null = null
  let streak = 0

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
        const { data: test } = await supabase
          .from('inq_test_results')
          .select('level_idx, dimensions')
          .eq('kind', 'full')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (test) {
          levelIdx = test.level_idx
          const d = test.dimensions as Record<DimId, number> | null
          if (d) priority = [...DIMENSIONS].sort((a, b) => d[a.id] - d[b.id])[0].id
        }
        const { data: c } = await supabase.from('inq_checkins').select('created_at')
        const days = [...new Set((c ?? []).map((x) => x.created_at.slice(0, 10)))].sort()
        const t = new Date().toISOString().slice(0, 10)
        const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10)
        if (days.includes(t) || days.includes(y)) {
          let cur = days.includes(t) ? t : y
          while (days.includes(cur)) {
            streak++
            cur = new Date(new Date(cur).getTime() - 864e5).toISOString().slice(0, 10)
          }
        }
      }
    } catch {
      /* invitada */
    }
  }

  if (!loggedIn) {
    return (
      <>
        <p className="eyebrow">Mi camino</p>
        <h1>Aquí verás dónde estás y qué necesitas.</h1>
        <p className="lede">
          Nivel, mapa emocional, siguiente paso, programa, progreso y diario — todo en un
          sitio. Necesitas una cuenta para empezar tu camino.
        </p>
        <Link
          href="/clasica#menu"
          className="plat-btn"
          style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
        >
          Crear cuenta / entrar
        </Link>
      </>
    )
  }

  const prioDim = priority ? DIMENSIONS.find((d) => d.id === priority) : null
  const prog = priority ? PRIORITY_PROGRAM[priority] : null

  return (
    <>
      <p className="eyebrow">Mi camino</p>
      <h1>{nick ? `${nick}, esto es lo tuyo.` : 'Mi camino'}</h1>

      {levelIdx == null ? (
        <>
          <p className="lede">
            Todavía no te has hecho la evaluación. Es el primer paso para entender dónde
            estás.
          </p>
          <Link
            href="/evaluacion"
            className="plat-btn"
            style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
          >
            Hacer la evaluación
          </Link>
        </>
      ) : (
        <>
          <div className="plat-level">
            <div className="lname">{LEVELS[levelIdx].name}</div>
            <div className="ldesc">{LEVELS[levelIdx].desc}</div>
          </div>

          {prioDim && (
            <p>
              Tu área que más pide cuidado ahora es{' '}
              <strong>{prioDim.label.toLowerCase()}</strong> — {prioDim.low.toLowerCase()}.
            </p>
          )}

          <h2>Tu siguiente paso</h2>
          <div className="plat-reco">
            {prog && (
              <Link href="/clasica#programas">
                <span>
                  Programa: {prog.label}
                  <br />
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                    Un camino de días guiado
                  </span>
                </span>
                <span className="arw">→</span>
              </Link>
            )}
            <Link href="/clasica#ritual">
              <span>
                Ritual de hoy
                <br />
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>Cinco minutos para ti</span>
              </span>
              <span className="arw">→</span>
            </Link>
          </div>
        </>
      )}

      <h2>Todo tu camino</h2>
      <div className="plat-reco">
        <Link href="/evaluacion">
          <span>Evaluación {levelIdx != null && '· repetir'}</span>
          <span className="arw">→</span>
        </Link>
        <Link href="/mapa">
          <span>Mapa emocional</span>
          <span className="arw">→</span>
        </Link>
        <Link href="/progreso">
          <span>Progreso y logros{streak > 0 && ` · ${streak} días`}</span>
          <span className="arw">→</span>
        </Link>
        <Link href="/diario">
          <span>Diario privado</span>
          <span className="arw">→</span>
        </Link>
        <Link href="/clasica#niveles">
          <span>El camino de niveles</span>
          <span className="arw">→</span>
        </Link>
      </div>
    </>
  )
}
