import Link from 'next/link'
import './home.css'
import Reveal from './Reveal'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/supabase/env'
import { LEVELS, DIMENSIONS, type DimId } from '@/lib/evaluacion'

export const dynamic = 'force-dynamic'

type Home = {
  nick: string | null
  levelIdx: number | null
  priority: DimId | null
  streak: number
  activeDays: number
}

async function loadHome(): Promise<Home> {
  const empty: Home = { nick: null, levelIdx: null, priority: null, streak: 0, activeDays: 0 }
  if (!supabaseConfigured()) return empty
  try {
    const supabase = createServerSupabase()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return empty
    const nick =
      (auth.user.user_metadata?.nick as string | undefined) ||
      auth.user.email?.split('@')[0] ||
      null

    const [test, checkins] = await Promise.all([
      supabase
        .from('inq_test_results')
        .select('level_idx, dimensions')
        .eq('kind', 'full')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('inq_checkins').select('created_at').order('created_at', { ascending: false }),
    ])

    let priority: DimId | null = null
    const dims = test.data?.dimensions as Record<DimId, number> | undefined
    if (dims) {
      priority = ([...DIMENSIONS].sort((a, b) => dims[a.id] - dims[b.id])[0]?.id ?? null) as DimId
    }

    const days = [...new Set((checkins.data ?? []).map((c) => c.created_at.slice(0, 10)))].sort()
    let streak = 0
    const today = new Date().toISOString().slice(0, 10)
    const yst = new Date(Date.now() - 864e5).toISOString().slice(0, 10)
    if (days.includes(today) || days.includes(yst)) {
      let cur = days.includes(today) ? today : yst
      while (days.includes(cur)) {
        streak++
        cur = new Date(new Date(cur).getTime() - 864e5).toISOString().slice(0, 10)
      }
    }

    return {
      nick,
      levelIdx: test.data?.level_idx ?? null,
      priority,
      streak,
      activeDays: days.length,
    }
  } catch {
    return empty
  }
}

export default async function HomePage() {
  const h = await loadHome()
  const loggedIn = Boolean(h.nick)
  const primaryCta = loggedIn ? '/mi-camino' : '/evaluacion'
  const primaryLabel = loggedIn ? 'Continuar mi camino' : 'Empezar'

  return (
    <main className="home">
      <Reveal />

      {/* 1 · HERO */}
      <section className="home-hero">
        <div className="wrap">
          <p className="kicker">Inquebrantable</p>
          <h1>Un espacio para volver a encontrarte.</h1>
          <p className="sub">
            {loggedIn
              ? `Aquí sigues tú, ${h.nick}. Retomemos donde lo dejaste.`
              : 'Cuando dejas de esperar que alguien venga a salvarte y empiezas a hacerlo tú.'}
          </p>
          <Link href={primaryCta} className="btn">
            {primaryLabel}
          </Link>
          {!loggedIn && (
            <Link href="/clasica#menu" className="btn outline">
              Ya tengo cuenta
            </Link>
          )}
        </div>
        <span className="scroll-hint">Baja</span>
      </section>

      {/* 2 · ¿CÓMO ESTÁS HOY? */}
      <section className="reveal">
        <div className="wrap">
          <p className="kicker">Bloque uno</p>
          <h2>¿Cómo estás hoy?</h2>
          <p className="body">
            No hace falta que lo expliques. Solo elige lo que más se acerca y te llevamos a
            algo que puede ayudarte ahora.
          </p>
          <div className="home-mood">
            {[
              ['Mal', 'mal'],
              ['Ansiosa', 'ansiosa'],
              ['Triste', 'triste'],
              ['Agotada', 'agotada'],
              ['Normal', 'normal'],
              ['Bien', 'bien'],
            ].map(([label, id]) => (
              <Link key={id} href={`/hoy?m=${id}`}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3 · NO NECESITAS SABER QUÉ TE PASA */}
      <section className="paper reveal">
        <div className="wrap">
          <p className="kicker">Bloque dos</p>
          <h2>No necesitas saber qué te pasa.</h2>
          <p className="body">
            A veces solo sabes que algo no va bien. La evaluación de Inquebrantable te ayuda
            a ponerle nombre: autoestima, límites, agotamiento, soledad… Es orientativa, no
            un diagnóstico.
          </p>
          <Link href="/evaluacion" className="btn">
            Descubrirme
          </Link>
        </div>
      </section>

      {/* 4 · TU CAMINO */}
      <section className="reveal">
        <div className="wrap">
          <p className="kicker">Bloque tres</p>
          <h2>Tu camino.</h2>
          <p className="body">
            Inquebrantable no es un destino al que llegar rápido. Es un recorrido, y todas
            empiezan por algún punto de él.
          </p>
          <div className="camino">
            {LEVELS.map((lv) => (
              <div
                key={lv.idx}
                className={`camino-step ${h.levelIdx === lv.idx ? 'here' : ''}`}
              >
                <span className="n">Nivel {lv.idx + 1}</span>
                <h3>{lv.name}</h3>
                <p>{lv.desc}</p>
              </div>
            ))}
          </div>
          {loggedIn && h.levelIdx != null && (
            <p className="camino-you">
              Ahora mismo estás en <strong>{LEVELS[h.levelIdx].name}</strong>
              {h.priority && (
                <>
                  {' '}
                  y tu área que más pide cuidado es{' '}
                  <strong>
                    {DIMENSIONS.find((d) => d.id === h.priority)?.label.toLowerCase()}
                  </strong>
                </>
              )}
              . <Link href="/mi-camino" style={{ color: 'var(--rose)' }}>Ver mi camino →</Link>
            </p>
          )}
        </div>
      </section>

      {/* 5 · LA HISTORIA DE ADRIANA */}
      <section className="home-adriana reveal">
        <div className="wrap">
          <p className="kicker">Quién está detrás</p>
          <p className="quote">
            «No nací inquebrantable. Me convertí en madre muy joven y construí mi vida
            entera alrededor de los demás. Durante años esperé que alguien viniera a
            salvarme. Nadie vino. Y en esa soledad me encontré a mí misma.»
          </p>
          <p className="sig">Adriana Puertas</p>
          <p style={{ marginTop: 20 }}>
            <Link href="/clasica#historia" className="btn outline">
              Leer su historia
            </Link>
          </p>
        </div>
      </section>

      {/* 6 · NO ESTÁS SOLA */}
      <section className="paper reveal">
        <div className="wrap">
          <p className="kicker">Bloque cuatro</p>
          <h2>No estás sola.</h2>
          <p className="body">
            El Refugio es un espacio de mujeres que están en lo mismo que tú. Puedes contar
            lo que llevas dentro con tu nombre o de forma anónima, y leer a otras. Con
            respeto, sin postureo, sin juicio.
          </p>
          <Link href="/refugio" className="btn">
            Entrar al Refugio
          </Link>
        </div>
      </section>

      {/* 7 · ¿QUÉ NECESITAS AHORA? */}
      <section className="reveal">
        <div className="wrap">
          <p className="kicker">Bloque cinco</p>
          <h2>¿Qué necesitas ahora?</h2>
          <div className="needs">
            {[
              ['Calmarme', 'Respiración y regulación', '/herramientas#calmarme'],
              ['Hablar', 'El Refugio y el acompañante', '/refugio'],
              ['Entenderme', 'La evaluación y tu mapa', '/evaluacion'],
              ['Avanzar', 'Programas y tu progreso', '/mi-camino'],
              ['Necesito ayuda', 'Recursos y teléfonos reales', '/recursos'],
            ].map(([lbl, hint, href]) => (
              <Link key={lbl} href={href}>
                <span className="lbl">{lbl}</span>
                <span className="hint">{hint}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 8 · ESTÁS AVANZANDO */}
      <section className="paper reveal">
        <div className="wrap">
          <p className="kicker">Bloque seis</p>
          <h2>Estás avanzando.</h2>
          {loggedIn ? (
            <>
              <div className="home-progress">
                <div className="stat">
                  <div className="n">{h.streak}</div>
                  <div className="l">{h.streak === 1 ? 'día seguido' : 'días seguidos'}</div>
                </div>
                <div className="stat">
                  <div className="n">{h.activeDays}</div>
                  <div className="l">días contigo</div>
                </div>
              </div>
              <p className="body">
                Aquí no hay rachas que perder ni comparaciones con nadie. Si un día no
                puedes, vuelves cuando puedas y seguimos desde ahí.
              </p>
              <Link href="/progreso" className="btn outline">
                Ver mi evolución
              </Link>
            </>
          ) : (
            <>
              <p className="body">
                Cada check-in, cada test, cada paso queda guardado. Con el tiempo vas viendo
                tu evolución: cómo cambia tu mapa, cómo suben tus días contigo.
              </p>
              <p className="body">
                Y si un día lo dejas, no pasa nada: no se borra nada. Aquí no se castiga a
                nadie por tener un mal día.
              </p>
            </>
          )}
        </div>
      </section>

      {/* BLOQUE FINAL */}
      <section className="home-final reveal">
        <div className="wrap">
          <p className="kicker">Y ahora</p>
          <h2>Tu historia todavía no ha terminado.</h2>
          <Link href={loggedIn ? '/mi-camino' : '/evaluacion'} className="btn">
            {loggedIn ? 'Ir a mi camino' : 'Empezar mi camino'}
          </Link>
        </div>
      </section>

      <footer className="home-foot">
        <p className="brand">INQUEBRANTABLE</p>
        <div>
          <Link href="/refugio">Refugio</Link>
          <Link href="/herramientas">Herramientas</Link>
          <Link href="/recursos">Recursos</Link>
          <Link href="/clasica">Ver todo</Link>
        </div>
        <p className="legal">
          Inquebrantable acompaña, pero no sustituye a un profesional de la salud mental ni
          es un servicio de emergencia.
        </p>
      </footer>
    </main>
  )
}
