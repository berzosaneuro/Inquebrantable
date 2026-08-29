import './plataforma.css'
import Nav from './Nav'

export default function PlataformaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="plat">
      <Nav />
      <div className="plat-wrap">{children}</div>
    </div>
  )
}
