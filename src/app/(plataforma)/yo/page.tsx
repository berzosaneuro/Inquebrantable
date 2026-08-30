'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from '@/lib/useSession'
import { PlatHeader } from '../_ui'

export default function YoPage() {
  const { user, loading } = useSession()
  const [msg, setMsg] = useState('')

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  async function borrarDatos() {
    if (!confirm('Esto borra tu progreso, check-ins, tests, diario y publicaciones. Tu cuenta se mantiene. ¿Seguro?')) return
    setMsg('Borrando…')
    const res = await fetch('/api/me', { method: 'DELETE' })
    setMsg(res.ok ? 'Datos borrados.' : 'No se pudo borrar todo. Inténtalo otra vez.')
  }

  async function borrarCuenta() {
    if (!confirm('Esto borra TODO y cierra tu cuenta para siempre. No se puede deshacer. ¿Seguro?')) return
    const res = await fetch('/api/me?cuenta=1', { method: 'DELETE' })
    if (res.ok) {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/'
    } else {
      setMsg('No se pudo cerrar la cuenta. Escríbenos desde Contacto.')
    }
  }

  return (
    <>
      <PlatHeader
        title="Yo"
        sub={user ? user.nick : 'Tu cuenta y tu privacidad.'}
      />

      {loading ? (
        <p className="plat-empty">Cargando…</p>
      ) : !user ? (
        <div className="card">
          <p className="c-label">Aún no tienes cuenta aquí</p>
          <p className="c-title" style={{ fontSize: '1.5rem' }}>Guarda tu evolución</p>
          <p className="c-sub">
            Con una cuenta guardas tus check-ins, tu diario, tu progreso y puedes
            participar en el Refugio. Puedes seguir usando la app sin cuenta.
          </p>
          <Link href="/clasica#menu" className="btn" style={{ marginTop: 16 }}>
            Crear cuenta o entrar
          </Link>
        </div>
      ) : (
        <>
          <div className="card">
            <p className="c-label">Tu cuenta</p>
            <p className="c-title" style={{ fontSize: '1.5rem' }}>{user.nick}</p>
            <p className="c-sub">{user.email}</p>
          </div>

          <h2>Tu espacio</h2>
          <div className="rows">
            <Link href="/mi-camino"><span>Mi camino</span><span className="arw">→</span></Link>
            <Link href="/progreso"><span>Progreso y logros</span><span className="arw">→</span></Link>
            <Link href="/diario"><span>Diario privado</span><span className="arw">→</span></Link>
            <Link href="/clasica#menu"><span>Perfil y notificaciones</span><span className="arw">→</span></Link>
            <Link href="/clasica#menu"><span>Contacto</span><span className="arw">→</span></Link>
          </div>

          <h2>Privacidad</h2>
          <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
            Tu diario es privado y solo tú lo ves. En el Refugio puedes publicar de forma
            anónima. Puedes borrar tus datos o tu cuenta cuando quieras.
          </p>
          <button className="btn ghost block" style={{ marginTop: 12 }} onClick={borrarDatos}>
            Borrar mis datos (mantener la cuenta)
          </button>
          <button
            className="btn ghost block"
            style={{ marginTop: 10, color: 'var(--rose-deep)', borderColor: 'var(--rose-soft)' }}
            onClick={borrarCuenta}
          >
            Cerrar mi cuenta
          </button>
          {msg && <p className="plat-msg">{msg}</p>}

          <h2>Sesión</h2>
          <button className="btn ghost block" onClick={logout}>
            Cerrar sesión
          </button>
        </>
      )}
    </>
  )
}
