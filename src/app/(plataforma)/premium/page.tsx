import type { Metadata } from 'next'
import Link from 'next/link'
import { PlatHeader } from '../_ui'

export const metadata: Metadata = {
  title: 'Inquebrantable Premium — planes y precios',
  description: 'Reconstrucción emocional guiada. Planes y precios de Inquebrantable Premium.',
}

const BENEFICIOS = [
  'Acompañamiento emocional guiado, más profundo y personalizado',
  'Programas completos de reconstrucción emocional',
  'Reflexiones y ejercicios avanzados según tu momento',
  'Historial completo de tu evolución',
  'Herramientas avanzadas de regulación emocional',
]

export default function PremiumPage() {
  return (
    <>
      <PlatHeader title="Premium" sub="Cuando sostenerse no es suficiente. Es momento de reconstruirte." />

      <div className="card navy" style={{ textAlign: 'center' }}>
        <span style={{ fontSize: 26 }}>✦</span>
        <p className="c-title" style={{ color: 'var(--cream)', fontSize: '1.7rem', marginTop: 4 }}>
          Inquebrantable Premium
        </p>
        <p className="c-sub" style={{ marginTop: 8 }}>
          Todo lo del plan gratuito, más el acompañamiento completo.
        </p>
      </div>

      <div className="card">
        <p className="c-label">Qué incluye</p>
        <ul className="premium-list">
          {BENEFICIOS.map((b) => (
            <li key={b}><span>✓</span>{b}</li>
          ))}
        </ul>
      </div>

      <div className="premium-planes">
        <div className="plan">
          <p className="plan-precio">5,99&nbsp;€</p>
          <p className="plan-periodo">al mes</p>
        </div>
        <div className="plan destacado">
          <span className="plan-badge">Ahorra 22&nbsp;€</span>
          <p className="plan-precio">49&nbsp;€</p>
          <p className="plan-periodo">al año</p>
        </div>
      </div>

      <button className="btn block" disabled style={{ marginTop: 6 }}>
        Disponible muy pronto
      </button>
      <p className="c-sub" style={{ textAlign: 'center', marginTop: 10 }}>
        Incluye 7 días de prueba gratis. Cancela cuando quieras, sin compromisos.
      </p>

      <p className="plat-disclaimer">
        Premium amplía el acompañamiento emocional y educativo. No es terapia ni sustituye
        a un profesional de la salud mental. Si lo necesitas, mira{' '}
        <Link href="/recursos" style={{ color: 'var(--rose-deep)' }}>Recursos de ayuda</Link>.
      </p>
    </>
  )
}
