import type { Metadata } from 'next'
import './plataforma.css'
import Nav from './Nav'

export const metadata: Metadata = {
  title: 'Inquebrantable',
  description:
    'Acompañamiento emocional para mujeres: entiende lo que te pasa, da un paso, encuentra apoyo y reconstrúyete.',
}

export default function PlataformaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="plat">
      <div className="plat-wrap">{children}</div>
      <Nav />
    </div>
  )
}
