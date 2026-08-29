'use client'

import { useState } from 'react'
import Link from 'next/link'

type Tool = {
  id: string
  title: string
  when: string
  steps: string[]
  action?: { href: string; label: string }
}

const TOOLS: Tool[] = [
  {
    id: 'calmarme',
    title: 'Necesito calmarme',
    when: 'Cuando el cuerpo va a mil.',
    steps: [
      'Apoya los pies en el suelo y siente el peso de tu cuerpo.',
      'Respira: 4 segundos entrando, 6 saliendo. Repítelo 5 veces.',
      'Nombra en voz baja 3 cosas que ves, 2 que oyes, 1 que tocas.',
      'No tienes que resolver nada ahora. Solo estar aquí un minuto más.',
    ],
    action: { href: '/#sos', label: 'Respiración guiada con voz' },
  },
  {
    id: 'sobrepensar',
    title: 'No puedo dejar de pensar',
    when: 'Cuando la cabeza da vueltas a lo mismo.',
    steps: [
      'Escribe el pensamiento tal cual, sin ordenarlo.',
      'Pregúntate: ¿esto es un problema que puedo resolver hoy, o una preocupación?',
      'Si no puedes hacer nada ahora, dale una hora concreta mañana para pensarlo.',
      'Haz algo que ocupe las manos durante 10 minutos: agua fría, caminar, ordenar algo.',
    ],
  },
  {
    id: 'escribirle',
    title: 'Tengo ganas de escribirle',
    when: 'Antes de mandar ese mensaje.',
    steps: [
      'Escríbele aquí todo lo que querrías decirle. No lo vas a enviar.',
      '¿Qué esperas que pase si lo mandas? ¿Suele pasar eso?',
      '¿Qué necesitas de verdad ahora mismo? ¿Puedes dártelo tú o pedírselo a otra persona?',
      'Espera 24 horas. Si mañana sigues queriendo, lo hablas con la cabeza más fría.',
    ],
    action: { href: '/diario', label: 'Guardarlo en el diario' },
  },
  {
    id: 'decir-no',
    title: 'No sé decir que no',
    when: 'Cuando te piden algo que no quieres hacer.',
    steps: [
      'No hace falta una excusa larga. «No puedo» es una frase completa.',
      'Frase para ganar tiempo: «Déjame que lo piense y te digo».',
      'Puedes decir que no y a la vez cuidar el vínculo: «Ahora no puedo, pero te quiero igual».',
      'La incomodidad de decir que no dura un momento. La de decir que sí sin querer, días.',
    ],
    action: { href: '/#programas', label: 'Programa: Poner límites' },
  },
  {
    id: 'insuficiente',
    title: 'Me siento insuficiente',
    when: 'Cuando la voz dura toma el mando.',
    steps: [
      '¿Le dirías eso mismo a una amiga que quieres? Escríbele a ella lo que te dirías.',
      'Ahora léelo como si te lo dijeran a ti.',
      'Nombra 3 cosas que hiciste esta semana, por pequeñas que sean.',
      'No tienes que sentirte suficiente para serlo.',
    ],
    action: { href: '/#ritual', label: 'Afirmación del día' },
  },
  {
    id: 'ansiedad',
    title: 'Estoy muy ansiosa',
    when: 'Cuando notas que sube.',
    steps: [
      'Es una alarma, no un peligro real. Va a bajar.',
      'Respiración 4-7-8: entra 4, mantén 7, sale 8. Tres rondas.',
      'Moja las muñecas y la nuca con agua fría.',
      'Di en voz alta: «Estoy teniendo ansiedad y puedo sostenerlo».',
    ],
    action: { href: '/#sos', label: 'SOS con respiración guiada' },
  },
  {
    id: 'limite',
    title: 'Necesito poner un límite',
    when: 'Cuando algo te está haciendo daño y no lo dices.',
    steps: [
      'Nombra el comportamiento concreto, no la persona: «Cuando me hablas así…».',
      'Di cómo te hace sentir: «…me siento pequeña».',
      'Pide el cambio concreto: «Necesito que me hables de otra forma».',
      'Un límite no es un ataque. Es información sobre lo que puedes y no puedes sostener.',
    ],
  },
]

export default function HerramientasPage() {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <>
      <p className="eyebrow">Herramientas</p>
      <h1>Algo que puedes hacer ahora</h1>
      <p className="lede">
        Herramientas rápidas para momentos concretos. Elige la que encaje con lo que
        sientes.
      </p>

      {TOOLS.map((t) => {
        const isOpen = open === t.id
        return (
          <div className="plat-card" key={t.id}>
            <button
              onClick={() => setOpen(isOpen ? null : t.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--cream)',
                textAlign: 'left',
                width: '100%',
                cursor: 'pointer',
                padding: 0,
                fontFamily: 'inherit',
              }}
            >
              <strong style={{ fontSize: 16 }}>{t.title}</strong>
              <br />
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>{t.when}</span>
            </button>
            {isOpen && (
              <>
                <ol style={{ margin: '14px 0 0', paddingLeft: 20, fontSize: 14.5 }}>
                  {t.steps.map((s, i) => (
                    <li key={i} style={{ margin: '8px 0' }}>
                      {s}
                    </li>
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

      <p className="plat-disclaimer">
        Estas herramientas son de acompañamiento y educación emocional. No sustituyen la
        ayuda de un profesional. Si lo estás pasando muy mal, mira{' '}
        <Link href="/recursos" style={{ color: 'var(--rose)' }}>
          Recursos de ayuda
        </Link>
        .
      </p>
    </>
  )
}
