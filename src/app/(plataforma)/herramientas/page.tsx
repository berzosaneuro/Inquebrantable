'use client'

import { useState } from 'react'
import Link from 'next/link'

type Tool = { id: string; title: string; when: string; steps: string[]; action?: { href: string; label: string } }

const TOOLS: Record<string, Tool> = {
  calmarme: {
    id: 'calmarme',
    title: 'Necesito calmarme',
    when: 'Cuando el cuerpo va a mil.',
    steps: [
      'Apoya los pies en el suelo y siente el peso de tu cuerpo.',
      'Respira: 4 segundos entrando, 6 saliendo. Cinco veces.',
      'Nombra en voz baja 3 cosas que ves, 2 que oyes, 1 que tocas.',
      'No tienes que resolver nada ahora. Solo estar aquí un minuto más.',
    ],
    action: { href: '/clasica#sos', label: 'Respiración guiada con voz' },
  },
  ansiedad: {
    id: 'ansiedad',
    title: 'Estoy muy ansiosa',
    when: 'Cuando notas que sube.',
    steps: [
      'Es una alarma, no un peligro real. Va a bajar.',
      'Respiración 4-7-8: entra 4, mantén 7, sale 8. Tres rondas.',
      'Moja las muñecas y la nuca con agua fría.',
      'Di en voz alta: «Estoy teniendo ansiedad y puedo sostenerlo».',
    ],
    action: { href: '/clasica#sos', label: 'SOS con respiración guiada' },
  },
  sobrepensar: {
    id: 'sobrepensar',
    title: 'No puedo dejar de pensar',
    when: 'Cuando la cabeza da vueltas a lo mismo.',
    steps: [
      'Escribe el pensamiento tal cual, sin ordenarlo.',
      '¿Es un problema que puedo resolver hoy, o una preocupación?',
      'Si no puedes hacer nada ahora, dale una hora concreta mañana.',
      'Ocupa las manos 10 minutos: agua fría, caminar, ordenar algo.',
    ],
    action: { href: '/diario', label: 'Sacarlo en el diario' },
  },
  escribirle: {
    id: 'escribirle',
    title: 'Tengo ganas de escribirle',
    when: 'Antes de mandar ese mensaje.',
    steps: [
      'Escríbele aquí todo lo que dirías. No lo vas a enviar.',
      '¿Qué esperas que pase si lo mandas? ¿Suele pasar eso?',
      '¿Qué necesitas de verdad? ¿Puedes dártelo tú o pedírselo a otra persona?',
      'Espera 24 horas. Mañana lo hablas con la cabeza más fría.',
    ],
    action: { href: '/diario', label: 'Guardarlo en el diario' },
  },
  insuficiente: {
    id: 'insuficiente',
    title: 'Me siento insuficiente',
    when: 'Cuando la voz dura toma el mando.',
    steps: [
      '¿Le dirías eso a una amiga que quieres? Escríbeselo a ella.',
      'Ahora léelo como si te lo dijeran a ti.',
      'Nombra 3 cosas que hiciste esta semana, por pequeñas que sean.',
      'No tienes que sentirte suficiente para serlo.',
    ],
    action: { href: '/clasica#ritual', label: 'Afirmación del día' },
  },
  decir_no: {
    id: 'decir_no',
    title: 'No sé decir que no',
    when: 'Cuando te piden algo que no quieres hacer.',
    steps: [
      '«No puedo» es una frase completa. No hace falta excusa.',
      'Para ganar tiempo: «Déjame que lo piense y te digo».',
      'Puedes decir que no y cuidar el vínculo: «Ahora no puedo, pero te quiero igual».',
      'La incomodidad de decir que no dura un momento. La de decir que sí sin querer, días.',
    ],
    action: { href: '/clasica#programas', label: 'Programa: Poner límites' },
  },
  limite: {
    id: 'limite',
    title: 'Necesito poner un límite',
    when: 'Cuando algo te hace daño y no lo dices.',
    steps: [
      'Nombra el comportamiento, no la persona: «Cuando me hablas así…».',
      'Di cómo te hace sentir: «…me siento pequeña».',
      'Pide el cambio concreto: «Necesito que me hables de otra forma».',
      'Un límite no es un ataque. Es información sobre lo que puedes sostener.',
    ],
  },
}

const GROUPS: { id: string; label: string; tools: string[]; links?: { href: string; label: string }[] }[] = [
  { id: 'calmarme', label: 'Quiero calmarme', tools: ['calmarme', 'ansiedad'] },
  { id: 'dejar-de-pensar', label: 'Quiero dejar de pensar', tools: ['sobrepensar', 'escribirle'] },
  {
    id: 'entenderme',
    label: 'Quiero entenderme',
    tools: ['insuficiente'],
    links: [{ href: '/evaluacion', label: 'Hacer la evaluación' }, { href: '/mapa', label: 'Ver mi mapa emocional' }],
  },
  {
    id: 'hablar',
    label: 'Quiero hablar',
    tools: ['decir_no', 'limite'],
    links: [{ href: '/refugio', label: 'Entrar al Refugio' }],
  },
  {
    id: 'ayuda',
    label: 'Necesito ayuda',
    tools: [],
    links: [
      { href: '/recursos', label: 'Recursos y teléfonos (España)' },
      { href: '/clasica#sos', label: 'SOS ahora' },
    ],
  },
]

export default function HerramientasPage() {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <>
      <p className="eyebrow">Herramientas</p>
      <h1>Algo que puedes hacer ahora.</h1>
      <p className="lede">Elige por lo que necesitas. Cada herramienta se hace en pocos minutos.</p>

      {GROUPS.map((g) => (
        <section key={g.id} id={g.id} style={{ scrollMarginTop: 20 }}>
          <h2>{g.label}</h2>
          {g.tools.map((tid) => {
            const t = TOOLS[tid]
            const isOpen = open === t.id
            return (
              <div className="plat-card" key={t.id} style={{ margin: '10px 0' }}>
                <button
                  onClick={() => setOpen(isOpen ? null : t.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--ink)', textAlign: 'left', width: '100%', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                >
                  <strong style={{ fontSize: 15.5 }}>{t.title}</strong>
                  <br />
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>{t.when}</span>
                </button>
                {isOpen && (
                  <>
                    <ol style={{ margin: '12px 0 0', paddingLeft: 20, fontSize: 14.5 }}>
                      {t.steps.map((s, i) => (
                        <li key={i} style={{ margin: '7px 0' }}>{s}</li>
                      ))}
                    </ol>
                    {t.action && (
                      <div className="plat-reco">
                        <Link href={t.action.href}>
                          <span>{t.action.label}</span>
                          <span className="arw">→</span>
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
          {g.links && (
            <div className="plat-reco">
              {g.links.map((l) => (
                <Link key={l.href} href={l.href}>
                  <span>{l.label}</span>
                  <span className="arw">→</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      ))}

      <p className="plat-disclaimer">
        Estas herramientas son de acompañamiento y educación emocional. No sustituyen la
        ayuda de un profesional. Si lo estás pasando muy mal, mira{' '}
        <Link href="/recursos" style={{ color: 'var(--rose)' }}>Recursos de ayuda</Link>.
      </p>
    </>
  )
}
