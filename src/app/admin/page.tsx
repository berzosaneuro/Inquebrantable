'use client'

import { useCallback, useEffect, useState } from 'react'

type User = { id: string; nick: string | null; email: string; created_at: string }
type Contact = {
  id: number
  name: string
  email: string | null
  message: string
  handled: boolean
  created_at: string
}
type Stats = {
  totalUsers: number
  testsCompleted: number
  usersWithTest: number
  pendingMessages: number
  levels: { name: string; count: number }[]
}
type Data = { users: User[]; contact: Contact[]; stats: Stats }

function fmt(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [data, setData] = useState<Data | null>(null)
  const [tab, setTab] = useState<'resumen' | 'usuarias' | 'mensajes'>('resumen')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/data', { cache: 'no-store' })
    if (res.status === 401) {
      setAuthed(false)
      return
    }
    const json = await res.json()
    if (!json.ok) {
      setAuthed(true)
      setNotice(json.error || 'No se pudieron cargar los datos.')
      return
    }
    setAuthed(true)
    setNotice('')
    setData({ users: json.users, contact: json.contact, stats: json.stats })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    const res = await fetch('/api/admin/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const json = await res.json()
    if (!json.ok) {
      setErr(json.error || 'No se pudo entrar.')
      return
    }
    setPassword('')
    load()
  }

  async function logout() {
    await fetch('/api/admin/session', { method: 'DELETE' })
    setAuthed(false)
    setData(null)
  }

  async function toggleHandled(c: Contact) {
    await fetch('/api/admin/data', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, handled: !c.handled }),
    })
    load()
  }

  if (authed === null) {
    return (
      <div className="adm-wrap">
        <p className="sub">Cargando…</p>
      </div>
    )
  }

  if (!authed) {
    return (
      <form className="adm-login" onSubmit={login}>
        <h1>Inquebrantable · Admin</h1>
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          autoFocus
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Entrar</button>
        <p className="err">{err}</p>
      </form>
    )
  }

  const s = data?.stats

  return (
    <div className="adm-wrap">
      <div className="adm-top">
        <div>
          <h1>Inquebrantable</h1>
          <p className="sub">Panel de administración</p>
        </div>
        <button className="ghost" onClick={logout}>
          Salir
        </button>
      </div>

      {notice && <div className="adm-notice">{notice}</div>}

      <div className="adm-tabs">
        {(['resumen', 'usuarias', 'mensajes'] as const).map((t) => (
          <button
            key={t}
            className={`adm-tab ${tab === t ? 'on' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'resumen' ? 'Resumen' : t === 'usuarias' ? `Usuarias (${data?.users.length ?? 0})` : `Mensajes (${data?.contact.length ?? 0})`}
          </button>
        ))}
      </div>

      {tab === 'resumen' && s && (
        <>
          <div className="adm-stats">
            <div className="adm-stat">
              <div className="n">{s.totalUsers}</div>
              <div className="l">Usuarias registradas</div>
            </div>
            <div className="adm-stat">
              <div className="n">{s.usersWithTest}</div>
              <div className="l">Han hecho el test</div>
            </div>
            <div className="adm-stat">
              <div className="n">{s.testsCompleted}</div>
              <div className="l">Tests completados</div>
            </div>
            <div className="adm-stat">
              <div className="n">{s.pendingMessages}</div>
              <div className="l">Mensajes sin atender</div>
            </div>
          </div>
          <div className="adm-bars">
            <h3>Nivel actual de las usuarias</h3>
            {s.levels.map((lv) => {
              const max = Math.max(1, ...s.levels.map((x) => x.count))
              return (
                <div className="adm-bar-row" key={lv.name}>
                  <span>{lv.name}</span>
                  <span className="adm-bar-track">
                    <span
                      className="adm-bar-fill"
                      style={{ width: `${(lv.count / max) * 100}%` }}
                    />
                  </span>
                  <span className="v">{lv.count}</span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {tab === 'usuarias' && (
        <div className="adm-table-scroll">
          {data && data.users.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Nick</th>
                  <th>Email</th>
                  <th>Registro</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.nick || '—'}</td>
                    <td>{u.email}</td>
                    <td className="when">{fmt(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty">Todavía no hay usuarias registradas.</p>
          )}
        </div>
      )}

      {tab === 'mensajes' && (
        <div className="adm-table-scroll">
          {data && data.contact.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>De</th>
                  <th>Mensaje</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.contact.map((c) => (
                  <tr key={c.id}>
                    <td className="when">{fmt(c.created_at)}</td>
                    <td>
                      {c.name}
                      {c.email && (
                        <>
                          <br />
                          <span className="when">{c.email}</span>
                        </>
                      )}
                    </td>
                    <td className="msg">{c.message}</td>
                    <td>
                      <span className={`pill ${c.handled ? 'done' : 'pend'}`}>
                        {c.handled ? 'Atendido' : 'Pendiente'}
                      </span>
                      <br />
                      <button className="ghost" onClick={() => toggleHandled(c)}>
                        {c.handled ? 'Marcar pendiente' : 'Marcar atendido'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty">Todavía no hay mensajes de contacto.</p>
          )}
        </div>
      )}
    </div>
  )
}
