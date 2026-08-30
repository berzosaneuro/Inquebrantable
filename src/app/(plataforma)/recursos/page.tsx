import type { Metadata } from 'next'
import { PlatHeader } from '../_ui'

export const metadata: Metadata = {
  title: 'Recursos de ayuda · Inquebrantable',
  description: 'Teléfonos y organizaciones de ayuda en España.',
}

// Recursos oficiales de España. Datos públicos y contrastables.
// En una fase posterior esto pasa a ser gestionable desde el panel admin.
const EMERGENCIA = [
  {
    name: '112 · Emergencias',
    desc: 'Si estás en peligro ahora mismo. Policía, sanitario, bomberos.',
    phone: '112',
  },
  {
    name: '016 · Violencia de género',
    desc: 'Atención 24 h, gratuita y confidencial. No deja rastro en la factura. También por WhatsApp (600 000 016) y email (016-online@igualdad.gob.es).',
    phone: '016',
  },
  {
    name: '024 · Conducta suicida',
    desc: 'Línea de atención a la conducta suicida del Ministerio de Sanidad. 24 h, gratuita.',
    phone: '024',
  },
]

const APOYO = [
  {
    name: 'Teléfono de la Esperanza',
    desc: 'Apoyo emocional y crisis, 24 h.',
    phone: '717 003 717',
    web: 'https://telefonodelaesperanza.org',
  },
  {
    name: 'Cruz Roja «Te escucho»',
    desc: 'Apoyo emocional por teléfono.',
    phone: '900 107 917',
    web: 'https://www2.cruzroja.es',
  },
  {
    name: 'Fundación ANAR',
    desc: 'Ayuda a menores y adolescentes, y a familias. También línea para adultos ante situaciones de riesgo de menores.',
    phone: '900 20 20 10',
    web: 'https://www.anar.org',
  },
]

function Card({
  name,
  desc,
  phone,
  web,
}: {
  name: string
  desc: string
  phone: string
  web?: string
}) {
  return (
    <div className="plat-card">
      <strong style={{ fontSize: 16 }}>{name}</strong>
      <p style={{ margin: '6px 0 12px', fontSize: 14, color: 'var(--sand)' }}>{desc}</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <a
          href={`tel:${phone.replace(/\s/g, '')}`}
          className="plat-btn"
          style={{ width: 'auto', textDecoration: 'none', padding: '10px 18px' }}
        >
          Llamar {phone}
        </a>
        {web && (
          <a
            href={web}
            target="_blank"
            rel="noopener noreferrer"
            className="plat-btn ghost"
            style={{ width: 'auto', textDecoration: 'none', padding: '10px 18px' }}
          >
            Web
          </a>
        )}
      </div>
    </div>
  )
}

export default function RecursosPage() {
  return (
    <>
      <PlatHeader title="Recursos de ayuda" sub="No tienes que poder sola con todo." />
      <p className="c-sub" style={{ margin: '2px 0 8px' }}>
        Inquebrantable acompaña, pero no es un servicio de emergencia ni sustituye a
        profesionales. Si lo necesitas, estas líneas sí lo son.
      </p>

      <h2>Si es urgente</h2>
      {EMERGENCIA.map((r) => (
        <Card key={r.name} {...r} />
      ))}

      <h2>Apoyo emocional</h2>
      {APOYO.map((r) => (
        <Card key={r.name} {...r} />
      ))}

      <p className="plat-disclaimer">
        Estos servicios son públicos y gratuitos en España. Si estás fuera de España,
        busca el equivalente en tu país o llama a los servicios de emergencia locales.
      </p>
    </>
  )
}
