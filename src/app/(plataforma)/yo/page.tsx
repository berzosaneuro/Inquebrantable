'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from '@/lib/useSession'
import { kvGet, kvSet } from '@/lib/kv'
import { LEVELS } from '@/lib/evaluacion'
import { PlatHeader } from '../_ui'

type Sos = { at: string; texto?: string }

export default function YoPage() {
  const { user, loading } = useSession()
  const [msg, setMsg] = useState('')
  const [stats, setStats] = useState<{ dias: number; racha: number; nivel: number | null }>({ dias: 0, racha: 0, nivel: null })
  const [bio, setBio] = useState('')
  const [bioMsg, setBioMsg] = useState('')
  const [sos, setSos] = useState<Sos[]>([])

  useEffect(() => {
    if (!user) return
    fetch('/api/progreso', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (j.needAuth) return
        const nivel = Array.isArray(j.tests) && j.tests.length ? j.tests[j.tests.length - 1].level_idx : null
        setStats({ dias: j.activeDays ?? 0, racha: j.longestStreak ?? 0, nivel })
      })
      .catch(() => {})
    kvGet<string>('inq-bio', '').then((v) => setBio(typeof v === 'string' ? v : ''))
    kvGet<Sos[]>('inq-sos-hist', []).then((v) => setSos(Array.isArray(v) ? v : []))
  }, [user])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }
  async function guardarBio() {
    setBioMsg('Guardando…')
    const ok = await kvSet('inq-bio', bio)
    setBioMsg(ok ? 'Guardado.' : 'No se pudo guardar.')
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

  const nivel = stats.nivel != null ? LEVELS[stats.nivel] : null

  return (
    <>
      <PlatHeader title="Yo" sub={user ? user.nick : 'Tu cuenta y tu privacidad.'} />

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
          <Link href="/entrar" className="btn" style={{ marginTop: 16 }}>Crear cuenta o entrar</Link>
        </div>
      ) : (
        <>
          {/* perfil */}
          <div className="card perfil-card">
            <span className="perfil-avatar">{user.nick.slice(0, 1).toUpperCase()}</span>
            <p className="c-title" style={{ fontSize: '1.5rem', marginTop: 10 }}>{user.nick}</p>
            <p className="c-sub">{user.email}</p>
            <div className="perfil-stats">
              <div><b>{stats.dias}</b><span>días contigo</span></div>
              <div><b>{stats.racha}</b><span>mejor racha</span></div>
              <div><b>{nivel ? nivel.name.replace('El ', '') : '—'}</b><span>nivel</span></div>
            </div>
          </div>

          {/* mensaje personal */}
          <div className="card">
            <p className="c-label">Tu mensaje personal</p>
            <label className="field" style={{ marginTop: 8 }}>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                placeholder="Escribe algo sobre ti, para ti…" />
            </label>
            <button className="btn block" onClick={guardarBio}>Guardar mensaje</button>
            {bioMsg && <p className="plat-msg ok">{bioMsg}</p>}
          </div>

          <h2>Tu espacio</h2>
          <div className="rows">
            <Link href="/mi-camino"><span>Mi camino</span><span className="arw">→</span></Link>
            <Link href="/progreso"><span>Progreso y logros</span><span className="arw">→</span></Link>
            <Link href="/diario"><span>Diario privado</span><span className="arw">→</span></Link>
            <Link href="/notificaciones"><span>Notificaciones</span><span className="arw">→</span></Link>
            <Link href="/premium"><span>Premium · planes y precios</span><span className="arw">→</span></Link>
            <Link href="/entrar?tab=contacto"><span>Contacto con Adriana</span><span className="arw">→</span></Link>
          </div>

          {sos.length > 0 && (
            <>
              <h2>Historial SOS</h2>
              <div className="rows">
                {sos.slice(0, 6).map((s, i) => (
                  <div key={i} style={{ display: 'block', padding: '14px 2px', borderBottom: '1px solid var(--line)' }}>
                    <p className="c-label" style={{ margin: 0 }}>
                      {new Date(s.at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </p>
                    {s.texto && <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--ink-soft)' }}>{s.texto}</p>}
                  </div>
                ))}
              </div>
            </>
          )}

          <h2>Privacidad</h2>
          <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
            Tu diario es privado y solo tú lo ves. En el Refugio puedes publicar de forma
            anónima. Puedes borrar tus datos o tu cuenta cuando quieras.
          </p>
          <button className="btn ghost block" style={{ marginTop: 12 }} onClick={borrarDatos}>
            Borrar mis datos (mantener la cuenta)
          </button>
          <button className="btn ghost block"
            style={{ marginTop: 10, color: 'var(--rose-deep)', borderColor: 'var(--rose-soft)' }}
            onClick={borrarCuenta}>
            Cerrar mi cuenta
          </button>
          {msg && <p className="plat-msg">{msg}</p>}

          <h2>Sesión</h2>
          <button className="btn ghost block" onClick={logout}>Cerrar sesión</button>
        </>
      )}
    </>
  )
}
