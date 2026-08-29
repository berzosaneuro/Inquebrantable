'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from '@/lib/useSession'

export default function YoPage() {
  const { user, loading } = useSession()
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!loading && !user) window.location.href = '/clasica#menu'
  }, [loading, user])

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

  if (loading || !user) return <p className="plat-empty">Cargando…</p>

  return (
    <>
      <p className="eyebrow">Tu cuenta</p>
      <h1>{user.nick}</h1>
      <p className="lede">{user.email}</p>

      <h2>Tu espacio</h2>
      <div className="plat-reco">
        <Link href="/mi-camino"><span>Mi camino</span><span className="arw">→</span></Link>
        <Link href="/progreso"><span>Progreso y logros</span><span className="arw">→</span></Link>
        <Link href="/diario"><span>Diario privado</span><span className="arw">→</span></Link>
        <Link href="/clasica#menu"><span>Perfil y notificaciones</span><span className="arw">→</span></Link>
        <Link href="/clasica#menu"><span>Contacto</span><span className="arw">→</span></Link>
      </div>

      <h2>Privacidad</h2>
      <p style={{ fontSize: 14, color: 'var(--sand)' }}>
        Tu diario es privado y solo tú lo ves. En el Refugio puedes publicar de forma
        anónima. Puedes borrar tus datos o tu cuenta cuando quieras.
      </p>
      <button className="plat-btn ghost" style={{ marginTop: 10 }} onClick={borrarDatos}>
        Borrar mis datos (mantener la cuenta)
      </button>
      <button
        className="plat-btn ghost"
        style={{ marginTop: 10, color: '#E58AA0', borderColor: 'rgba(229,138,160,0.4)' }}
        onClick={borrarCuenta}
      >
        Cerrar mi cuenta
      </button>
      {msg && <p className="plat-msg">{msg}</p>}

      <h2>Sesión</h2>
      <button className="plat-btn ghost" onClick={logout}>
        Cerrar sesión
      </button>
    </>
  )
}
