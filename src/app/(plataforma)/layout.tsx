import type { Metadata } from 'next'
import './plataforma.css'
import Nav from './Nav'

export const metadata: Metadata = {
  title: 'Inquebrantable — Tu espacio de reconstrucción emocional',
  description:
    'Acompañamiento emocional para mujeres: check-in diario, test y mapa emocional, diario privado, comunidad y herramientas.',
}

export default function PlataformaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="plat">
      <Nav />
      <div className="plat-wrap">{children}</div>
    </div>
  )
}
