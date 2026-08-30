'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PlatHeader } from '../_ui'

type Tab = 'registro' | 'login' | 'contacto'

function EntrarInner() {
  const params = useSearchParams()
  const initial = (params.get('tab') as Tab) || 'registro'
  const next = params.get('next') || '/yo'
  const [tab, setTab] = useState<Tab>(['registro', 'login', 'contacto'].includes(initial) ? initial : 'registro')

  // registro
  const [rNick, setRNick] = useState('')
  const [rEmail, setREmail] = useState('')
  const [rPass, setRPass] = useState('')
  // login
  const [lEmail, setLEmail] = useState('')
  const [lPass, setLPass] = useState('')
  // contacto
  const [cName, setCName] = useState('')
  const [cEmail, setCEmail] = useState('')
  const [cMsg, setCMsg] = useState('')

  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ t: 'err' | 'ok'; x: string } | null>(null)

  async function doRegister() {
    if (busy) return
    setBusy(true); setMsg(null)
    try {
      const r = await fetch('/api/auth/signup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nick: rNick, email: rEmail, password: rPass }),
      })
      const j = await r.json()
      if (j.ok) window.location.href = next
      else setMsg({ t: 'err', x: j.error || 'No se pudo crear la cuenta.' })
    } catch {
      setMsg({ t: 'err', x: 'Fallo de conexión. Inténtalo otra vez.' })
    } finally { setBusy(false) }
  }

  async function doLogin() {
    if (busy) return
    setBusy(true); setMsg(null)
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: lEmail, password: lPass }),
      })
      const j = await r.json()
      if (j.ok) window.location.href = next
      else setMsg({ t: 'err', x: j.error || 'Email o contraseña incorrectos.' })
    } catch {
      setMsg({ t: 'err', x: 'Fallo de conexión. Inténtalo otra vez.' })
    } finally { setBusy(false) }
  }

  async function doContact() {
    if (busy) return
    setBusy(true); setMsg(null)
    try {
      const r = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cName, email: cEmail, message: cMsg }),
      })
      const j = await r.json()
      if (j.ok) { setMsg({ t: 'ok', x: 'Mensaje enviado. Te responderemos pronto.' }); setCName(''); setCEmail(''); setCMsg('') }
      else setMsg({ t: 'err', x: j.error || 'No se pudo enviar.' })
    } catch {
      setMsg({ t: 'err', x: 'Fallo de conexión. Inténtalo otra vez.' })
    } finally { setBusy(false) }
  }

  return (
    <>
      <PlatHeader title="Cuenta" sub="Guarda tu evolución y participa en el Refugio." />

      <div className="subtabs">
        {([['registro', 'Crear cuenta'], ['login', 'Entrar'], ['contacto', 'Contacto']] as const).map(([k, l]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => { setTab(k); setMsg(null) }}>{l}</button>
        ))}
      </div>

      <div className="card">
        {tab === 'registro' && (
          <>
            <label className="field">
              <span>Nickname</span>
              <input type="text" value={rNick} maxLength={20} placeholder="Tu nombre en la comunidad"
                onChange={(e) => setRNick(e.target.value)} />
            </label>
            <label className="field">
              <span>Email</span>
              <input type="email" value={rEmail} placeholder="tu@email.com" autoComplete="email"
                onChange={(e) => setREmail(e.target.value)} />
            </label>
            <label className="field">
              <span>Contraseña</span>
              <input type="password" value={rPass} placeholder="Mínimo 6 caracteres" autoComplete="new-password"
                onChange={(e) => setRPass(e.target.value)} />
            </label>
            <button className="btn block" onClick={doRegister} disabled={busy || !rNick || !rEmail || rPass.length < 6}>
              {busy ? 'Creando…' : 'Crear cuenta'}
            </button>
          </>
        )}

        {tab === 'login' && (
          <>
            <label className="field">
              <span>Email</span>
              <input type="email" value={lEmail} placeholder="tu@email.com" autoComplete="email"
                onChange={(e) => setLEmail(e.target.value)} />
            </label>
            <label className="field">
              <span>Contraseña</span>
              <input type="password" value={lPass} placeholder="Tu contraseña" autoComplete="current-password"
                onChange={(e) => setLPass(e.target.value)} />
            </label>
            <button className="btn block" onClick={doLogin} disabled={busy || !lEmail || !lPass}>
              {busy ? 'Entrando…' : 'Iniciar sesión'}
            </button>
          </>
        )}

        {tab === 'contacto' && (
          <>
            <p className="c-sub" style={{ marginBottom: 14 }}>
              ¿Quieres escribir a Adriana? Cuéntale lo que necesitas.
            </p>
            <label className="field">
              <span>Tu nombre</span>
              <input type="text" value={cName} placeholder="¿Cómo te llamas?"
                onChange={(e) => setCName(e.target.value)} />
            </label>
            <label className="field">
              <span>Email</span>
              <input type="email" value={cEmail} placeholder="Para poder responderte"
                onChange={(e) => setCEmail(e.target.value)} />
            </label>
            <label className="field">
              <span>Mensaje</span>
              <textarea value={cMsg} rows={4} placeholder="Cuéntame algo…"
                onChange={(e) => setCMsg(e.target.value)} />
            </label>
            <button className="btn block" onClick={doContact} disabled={busy || !cName || !cMsg}>
              {busy ? 'Enviando…' : 'Enviar mensaje'}
            </button>
          </>
        )}

        {msg && <p className={`plat-msg ${msg.t}`}>{msg.x}</p>}
      </div>

      <p className="plat-disclaimer">
        Al crear una cuenta aceptas un uso cuidadoso del espacio. Puedes borrar tus datos
        o tu cuenta cuando quieras desde <Link href="/yo" style={{ color: 'var(--rose-deep)' }}>Yo</Link>.
      </p>
    </>
  )
}

export default function EntrarPage() {
  return (
    <Suspense fallback={<p className="plat-empty">Cargando…</p>}>
      <EntrarInner />
    </Suspense>
  )
}
