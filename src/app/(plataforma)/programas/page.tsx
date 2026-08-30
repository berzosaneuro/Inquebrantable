'use client'

import { useEffect, useState } from 'react'
import { useSession } from '@/lib/useSession'
import { kvAll, kvSet } from '@/lib/kv'
import { PlatHeader } from '../_ui'

type Programa = {
  id: string; icon: string; name: string; desc: string; tags: string[]; ejercicios: string[]
}

const PROGRAMAS: Programa[] = [
  {
    id: 'volver-a-ti', icon: '🌱', name: 'Volver a ti',
    desc: 'Un programa para reconectarte con quien eres cuando nadie te mira. Para las que se perdieron cuidando a todos los demás.',
    tags: ['identidad', 'autoconocimiento', '21 días'],
    ejercicios: [
      'Escribe 3 cosas que hacías antes que te daban vida.',
      'Pasa 10 minutos sola sin el móvil. Observa qué sientes.',
      'Identifica una creencia sobre ti misma que ya no te sirve.',
      'Haz algo hoy solo por ti, sin justificarlo.',
      'Escribe una carta a la versión de ti que empezó este programa.',
    ],
  },
  {
    id: 'recuperar-valor', icon: '💎', name: 'Recuperar tu valor',
    desc: 'Para cuando alguien te convenció de que vales menos. Días para recordar quién eres y qué mereces.',
    tags: ['autoestima', 'límites', '14 días'],
    ejercicios: [
      'Anota una vez que alguien te trató bien y lo rechazaste. ¿Por qué?',
      'Lista 5 cosas que haces bien sin necesitar que nadie lo confirme.',
      'Identifica a alguien que drena tu energía. ¿Qué límite necesitas?',
      'Di NO a algo hoy. Sin dar explicaciones largas.',
      'Escribe qué mereces recibir en una relación sana.',
    ],
  },
  {
    id: 'poner-limites', icon: '🔆', name: 'Poner límites',
    desc: 'Los límites no son muros, son puertas que tú controlas. Práctica real para aprender a decir lo que necesitas.',
    tags: ['límites', 'comunicación', '10 días'],
    ejercicios: [
      'Identifica un área donde no tienes límites. ¿Qué ocurre ahí?',
      'Practica decir "necesito pensarlo" antes de comprometerte.',
      'Escribe cómo te sientes cuando dices SÍ sin querer.',
      'Observa: ¿quién respeta tus límites? ¿quién no?',
      'Define un límite concreto que pondrás esta semana.',
    ],
  },
  {
    id: 'sanar-relacion', icon: '🌊', name: 'Sanar una relación tóxica',
    desc: 'Para las que salieron — o están saliendo — de una relación que las dejó pequeñas. Reconstrucción real.',
    tags: ['recuperación', '30 días'],
    ejercicios: [
      'Escribe sin filtros cómo te hizo sentir esa relación.',
      'Identifica qué necesidades intentabas cubrir ahí.',
      'Lista las señales que ignoraste. Sin juzgarte.',
      'Escribe qué parte de ti sobrevivió a esa relación.',
      'Describe cómo sería una relación que sí te cuida.',
    ],
  },
]

export default function ProgramasPage() {
  const { user } = useSession()
  const [pasos, setPasos] = useState<Record<string, number>>({})
  const [abierto, setAbierto] = useState<string | null>(null)
  const [reflexion, setReflexion] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    kvAll().then((all) => {
      const p: Record<string, number> = {}
      for (const pr of PROGRAMAS) {
        const v = all['inq-prog-' + pr.id] as { paso?: number } | undefined
        p[pr.id] = v?.paso ?? 0
      }
      setPasos(p)
    })
  }, [])

  const prog = PROGRAMAS.find((p) => p.id === abierto)

  async function completar() {
    if (!prog) return
    if (!user) { setMsg('Crea una cuenta para guardar tu progreso.'); return }
    const paso = Math.min((pasos[prog.id] ?? 0) + 1, prog.ejercicios.length)
    setPasos({ ...pasos, [prog.id]: paso })
    await kvSet('inq-prog-' + prog.id, { paso, reflexion: reflexion || undefined, at: new Date().toISOString() })
    setReflexion(''); setMsg('Guardado.')
  }

  if (prog) {
    const paso = pasos[prog.id] ?? 0
    const pct = Math.round((paso / prog.ejercicios.length) * 100)
    const done = paso >= prog.ejercicios.length
    return (
      <>
        <PlatHeader title={prog.name} sub={`${paso}/${prog.ejercicios.length} · ${pct}%`} />
        <button className="btn ghost" style={{ marginBottom: 12 }} onClick={() => { setAbierto(null); setMsg('') }}>← Volver a programas</button>

        <div className="card">
          <p className="c-sub">{prog.desc}</p>
          <div className="bar" style={{ marginTop: 14 }}><span style={{ width: `${pct}%` }} /></div>
          <p className="pct">{pct}% completado</p>
        </div>

        {done ? (
          <div className="card navy" style={{ textAlign: 'center' }}>
            <p className="ritual-afirm">Programa completado</p>
            <p className="c-sub" style={{ marginTop: 8 }}>Has recorrido este camino entera. Lo que aprendiste ya es tuyo para siempre.</p>
          </div>
        ) : (
          <div className="card">
            <p className="c-label">Ejercicio {paso + 1}</p>
            <p className="c-title" style={{ fontSize: '1.35rem' }}>{prog.ejercicios[paso]}</p>
            <label className="field" style={{ marginTop: 14 }}>
              <span>Tu reflexión sobre este ejercicio</span>
              <textarea value={reflexion} onChange={(e) => setReflexion(e.target.value)} rows={4}
                placeholder="Escribe lo que este ejercicio te hace sentir o pensar…" />
            </label>
            <button className="btn block" onClick={completar}>Completado ✓</button>
            {msg && <p className="plat-msg ok">{msg}</p>}
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <PlatHeader title="Programas" sub="Reconstrucción guiada. Cada programa es un camino." />
      {PROGRAMAS.map((p) => {
        const paso = pasos[p.id] ?? 0
        const pct = Math.round((paso / p.ejercicios.length) * 100)
        return (
          <button key={p.id} className="card prog-card" onClick={() => { setAbierto(p.id); setMsg('') }}>
            <div className="prog-top">
              <span className="prog-ico">{p.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="c-title" style={{ fontSize: '1.4rem' }}>{p.name}</p>
                <p className="prog-tags">{p.tags.join(' · ')}</p>
              </div>
            </div>
            <p className="c-sub" style={{ marginTop: 8 }}>{p.desc}</p>
            {paso > 0 && (
              <>
                <div className="bar" style={{ marginTop: 12 }}><span style={{ width: `${pct}%` }} /></div>
                <p className="pct">{pct}% · continúa donde lo dejaste</p>
              </>
            )}
          </button>
        )
      })}
    </>
  )
}
