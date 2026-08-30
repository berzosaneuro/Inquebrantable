import Link from 'next/link'
import type { Metadata } from 'next'
import { PlatHeader } from '../_ui'

export const metadata: Metadata = {
  title: 'La historia de Adriana — Inquebrantable',
  description: 'De la herida más profunda a mi propósito. Así nació Inquebrantable.',
}

export default function HistoriaPage() {
  return (
    <>
      <PlatHeader title="Mi historia" sub="Cómo nació Inquebrantable." />

      <div className="card photo" style={{ minHeight: 220, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 22 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="bg" src="/adriana.jpg" alt="Adriana Puertas" />
        <p className="c-label" style={{ color: 'var(--cream-soft)', position: 'relative', zIndex: 2 }}>Adriana Puertas</p>
        <p className="c-title" style={{ color: 'var(--cream)', position: 'relative', zIndex: 2, fontSize: '1.9rem' }}>
          No nací <em>inquebrantable.</em>
        </p>
      </div>

      <div className="prose">
        <p>
          Me convertí en madre muy joven. Demasiado joven para saber quién era yo. Sin
          darme cuenta, construí mi vida entera alrededor de los demás: sus necesidades,
          sus emociones, sus expectativas.
        </p>
        <p>
          Durante años viví <strong>esperando</strong>. Esperando que alguien me viera de
          verdad. Que alguien viniera a decirme que todo iba a estar bien. Que alguien me
          salvara.
        </p>
        <p>Pero nadie vino.</p>
        <p>
          Y en esa soledad que duele tanto, encontré algo que nunca había buscado:{' '}
          <strong>a mí misma</strong>. Descubrí que la única persona capaz de salvarme era
          yo. Que mi fuerza no dependía de nadie más.
        </p>
        <p>
          Aprendí que romperse no es el final. Es el principio. Las grietas dejan entrar
          la luz.
        </p>
        <p className="prose-firma">Así nació INQUEBRANTABLE.</p>
      </div>

      <Link href="/evaluacion" className="btn block" style={{ marginTop: 6 }}>
        Descubrir en qué fase estás
      </Link>
      <Link href="/niveles" className="link-rose" style={{ display: 'inline-flex', marginTop: 16 }}>
        Ver el camino de niveles →
      </Link>
    </>
  )
}
