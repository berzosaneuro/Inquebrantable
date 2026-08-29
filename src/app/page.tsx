import Link from 'next/link'
import './home.css'
import Reveal from './Reveal'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/supabase/env'
import { LEVELS } from '@/lib/evaluacion'

export const dynamic = 'force-dynamic'

async function loadHome() {
  if (!supabaseConfigured()) return { nick: null as string | null, levelIdx: null as number | null }
  try {
    const supabase = createServerSupabase()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return { nick: null, levelIdx: null }
    const nick =
      (auth.user.user_metadata?.nick as string | undefined) ||
      auth.user.email?.split('@')[0] ||
      null
    const { data: test } = await supabase
      .from('inq_test_results')
      .select('level_idx')
      .eq('kind', 'full')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return { nick, levelIdx: test?.level_idx ?? null }
  } catch {
    return { nick: null, levelIdx: null }
  }
}

const MOODS = [
  { id: 'mal', label: 'Mal', ico: '🌧️' },
  { id: 'normal', label: 'Regular', ico: '😐' },
  { id: 'bien', label: 'Bien', ico: '🙂' },
  { id: 'muy_bien', label: 'Muy bien', ico: '💗', tint: true },
]

export default async function HomePage() {
  const { nick, levelIdx } = await loadHome()
  const loggedIn = Boolean(nick)

  return (
    <main className="home">
      <Reveal />

      <section className="home-hero">
        <p className="h-brand">INQUEBRANTABLE</p>
        <p className="h-tag">Un espacio para volver a encontrarte</p>
        <Link href={loggedIn ? '/hoy' : '/evaluacion'} className="btn">
          {loggedIn ? 'Continuar' : 'Empezar'}
        </Link>
      </section>

      <div className="wrap">
        <section className="tight reveal">
          <h2>¿Cómo estás hoy?</h2>
          <p className="body">Escúchate. No hace falta estar bien para empezar.</p>
          <div className="home-mood">
            {MOODS.map((m) => (
              <Link key={m.id} href={`/hoy?m=${m.id}`} className={m.tint ? 'tint' : ''}>
                <span className="ico">{m.ico}</span>
                {m.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="tight reveal">
          <div className="home-card">
            <h3>No necesitas saber qué te pasa</h3>
            <p className="body">
              Te ayudamos a entenderte mejor con una evaluación personalizada.
            </p>
            <Link href="/evaluacion" className="btn dark">
              Descubrirme
            </Link>
          </div>
        </section>

        <section className="reveal">
          <p className="kicker">Tu camino</p>
          <h2>Un recorrido. No una solución rápida.</h2>
          <div className="home-journey">
            {LEVELS.map((lv) => (
              <div key={lv.idx} className={`step ${levelIdx === lv.idx ? 'on' : ''}`}>
                <span className="dot" />
                <span className="lbl">{lv.name}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="tight reveal">
          <div className="home-story">
            <h3>La historia de Adriana</h3>
            <p>De la herida más profunda a mi propósito.</p>
            <Link href="/clasica#historia">Conoce mi historia →</Link>
          </div>
        </section>

        <section className="tight reveal">
          <div className="home-refugio">
            <h3>No estás sola</h3>
            <p>Refugio es tu lugar seguro. Aquí siempre hay alguien que te entiende.</p>
            <Link href="/refugio" className="btn">
              Entrar al Refugio
            </Link>
          </div>
        </section>

        <section className="tight reveal">
          <p className="kicker">¿Qué necesitas ahora?</p>
          <div className="home-mood" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Link href="/herramientas#calmarme">Calmarme</Link>
            <Link href="/refugio">Hablar</Link>
            <Link href="/evaluacion">Entenderme</Link>
            <Link href="/recursos">Necesito ayuda</Link>
          </div>
        </section>
      </div>

      <footer className="home-foot">
        <p className="brand">INQUEBRANTABLE</p>
        <div className="links">
          <Link href="/refugio">Refugio</Link>
          <Link href="/herramientas">Herramientas</Link>
          <Link href="/recursos">Recursos</Link>
          <Link href="/clasica">Ver todo</Link>
        </div>
        <p className="legal">
          Inquebrantable acompaña, pero no sustituye a un profesional de la salud mental
          ni es un servicio de emergencia.
        </p>
      </footer>
    </main>
  )
}
