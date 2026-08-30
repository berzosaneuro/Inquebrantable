import Link from 'next/link'
import type { Metadata } from 'next'
import { PlatHeader, stepIcon } from '../_ui'

export const metadata: Metadata = {
  title: 'El camino de niveles — Inquebrantable',
  description: 'Cuatro fases, un solo camino. Las etapas del proceso de reconstrucción.',
}

const NIVELES = [
  {
    n: 1,
    name: 'La Grieta',
    desc: 'Algo dentro de ti se ha roto. Estás en el punto de partida, y aunque duele, aquí comienza todo. Las grietas dejan pasar la luz.',
    msg: 'El hecho de estar aquí ya es valentía.',
  },
  {
    n: 2,
    name: 'El Despertar',
    desc: 'Empiezas a ver patrones, a cuestionar lo que antes aceptabas. Algo en ti se está despertando. Es incómodo, y también es necesario.',
    msg: 'Estás empezando a verte. Eso cambia todo.',
  },
  {
    n: 3,
    name: 'Reconstrucción',
    desc: 'Ya no te conformas con sobrevivir. Estás construyendo conscientemente quién quieres ser. Es un proceso, no un destino.',
    msg: 'Cada decisión consciente es un ladrillo nuevo.',
  },
  {
    n: 4,
    name: 'Inquebrantable',
    desc: 'Has integrado tu historia. Te priorizas sin culpa. Tus límites son actos de amor. Eres tu propia base.',
    msg: 'Has llegado a casa. A ti misma.',
  },
]

export default function NivelesPage() {
  return (
    <>
      <PlatHeader title="El camino" sub="Cuatro fases. Un solo camino." />

      <p className="c-sub" style={{ margin: '4px 0 18px' }}>
        Cada mujer entra por una grieta y emerge como algo nuevo. Estas son las etapas
        del proceso de reconstrucción. No es una escalera: se avanza y se vuelve.
      </p>

      {NIVELES.map((nv, i) => (
        <div className="card" key={nv.n}>
          <div className="nivel-head">
            <span className="nivel-ico">{stepIcon(i)}</span>
            <div>
              <p className="c-label">Nivel {nv.n}</p>
              <p className="c-title" style={{ fontSize: '1.5rem' }}>{nv.name}</p>
            </div>
          </div>
          <p className="c-sub" style={{ marginTop: 10 }}>{nv.desc}</p>
          <p className="nivel-msg">{nv.msg}</p>
        </div>
      ))}

      <Link href="/evaluacion" className="btn block" style={{ marginTop: 8 }}>
        Ver en qué fase estás
      </Link>
    </>
  )
}
