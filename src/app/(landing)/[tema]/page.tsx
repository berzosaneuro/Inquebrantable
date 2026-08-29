import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import './landing.css'

type Tema = {
  h1: string
  sub: string
  circle?: string
  cta: string
}

const TEMAS: Record<string, Tema> = {
  test: {
    h1: 'No sé qué me pasa.',
    sub: 'Haz el test de Inquebrantable y descubre en qué punto estás y por dónde empezar. 16 preguntas, sin juicios.',
    cta: 'Hacer el test',
  },
  ansiedad: {
    h1: 'Cuando la cabeza no para.',
    sub: 'Herramientas para calmarte ahora, y un espacio donde otras mujeres cuentan lo mismo que tú.',
    circle: 'ansiedad',
    cta: 'Empezar por el test',
  },
  autoestima: {
    h1: 'Alguien te convenció de que vales menos.',
    sub: 'Un camino para recordar quién eres y qué mereces. Empieza conociéndote.',
    circle: 'autoestima',
    cta: 'Hacer el test',
  },
  limites: {
    h1: 'No sabes decir que no.',
    sub: 'Los límites no son muros: son puertas que tú controlas. Aprende a poner los tuyos.',
    circle: 'limites',
    cta: 'Hacer el test',
  },
  ruptura: {
    h1: 'Después de una relación que te dejó pequeña.',
    sub: 'No estás rota. Estás reconstruyéndote. Y no tienes que hacerlo sola.',
    circle: 'rupturas',
    cta: 'Empezar',
  },
  relaciones: {
    h1: 'Hay vínculos que pesan.',
    sub: 'Aprende a reconocer lo que te hace daño y a rodearte de lo que te cuida.',
    circle: 'relaciones',
    cta: 'Hacer el test',
  },
  dependencia: {
    h1: 'Tu calma depende de otra persona.',
    sub: 'Volver a ti. Que tu estabilidad sea tuya y de nadie más.',
    circle: 'dependencia',
    cta: 'Hacer el test',
  },
}

export const dynamicParams = false

export function generateStaticParams() {
  return Object.keys(TEMAS).map((tema) => ({ tema }))
}

export function generateMetadata({ params }: { params: { tema: string } }): Metadata {
  const t = TEMAS[params.tema]
  if (!t) return {}
  return {
    title: `${t.h1} · Inquebrantable`,
    description: t.sub,
    openGraph: { title: t.h1, description: t.sub },
  }
}

export default function LandingTema({ params }: { params: { tema: string } }) {
  const t = TEMAS[params.tema]
  if (!t) notFound()

  return (
    <main className="lnd">
      <div className="lnd-inner">
        <p className="lnd-brand">INQUEBRANTABLE</p>
        <h1>{t.h1}</h1>
        <p className="lnd-sub">{t.sub}</p>
        <div className="lnd-cta">
          <Link href="/evaluacion" className="lnd-btn">
            {t.cta}
          </Link>
          {t.circle && (
            <Link href={`/refugio?circle=${t.circle}`} className="lnd-btn ghost">
              Entrar al Refugio
            </Link>
          )}
        </div>
        <p className="lnd-foot">
          Un espacio de acompañamiento emocional para mujeres. No sustituye a un
          profesional de la salud mental.
        </p>
      </div>
    </main>
  )
}
