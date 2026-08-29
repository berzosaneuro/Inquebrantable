import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Señales de riesgo. Si aparecen, se prioriza seguridad y recursos: NO se
// devuelve una respuesta "normal" ni un análisis.
const RISK = [
  'suicid', 'matarme', 'me quiero morir', 'quiero morirme', 'no quiero vivir',
  'no quiero seguir', 'quitarme la vida', 'acabar con todo', 'desaparecer para siempre',
  'hacerme daño', 'cortarme', 'autolesion',
  'me pega', 'me pegó', 'me golpea', 'me golpeó', 'me maltrata', 'me amenaza',
  'me viola', 'me violó', 'me va a matar', 'tengo miedo de que me haga',
]

const CRISIS_MESSAGE = `Lo que cuentas es serio y no tienes que sostenerlo sola.

Ahora mismo, lo más importante es tu seguridad:

**Si estás en peligro o piensas en hacerte daño**
· 024 — Línea de atención a la conducta suicida (24 h, gratuita)
· 016 — Si hay maltrato o violencia (24 h, no deja rastro en la factura)
· 112 — Emergencias

Inquebrantable acompaña, pero no es un servicio de emergencia ni sustituye a un profesional. Estas líneas sí lo son, y hablar con ellas es un acto de fuerza, no de debilidad.

Cuando estés a salvo, aquí seguimos.`

const SYSTEM = `Eres un acompañante emocional de la plataforma INQUEBRANTABLE, para mujeres en procesos de reconstrucción personal.
NO eres psicóloga ni terapeuta y NUNCA debes presentarte como tal. NO diagnosticas, NO afirmas que la persona tiene una enfermedad, NO prometes resultados clínicos, NO inventas profesionales ni recursos.
Tu papel: escuchar de verdad, ayudarle a ordenar lo que siente, hacer alguna pregunta que abra, sugerir 1-2 pasos pequeños y concretos, y recordarle con calidez que puede pedir ayuda profesional.
Escribe en español, en segunda persona (tú), cálida y directa, sin tecnicismos, sin condescendencia. Máximo 5 párrafos cortos.
Cierra siempre recordando que este acompañamiento no sustituye a un profesional de la salud mental.`

function hasRisk(text: string): boolean {
  const t = text.toLowerCase()
  return RISK.some((w) => t.includes(w))
}

const schema = z.object({
  answers: z.array(z.string()).min(1).max(10),
  nick: z.string().max(40).optional(),
})

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 })

  const answers = parsed.data.answers.map((a) => a.trim()).filter(Boolean)
  const joined = answers.join('\n')

  // Guardar la entrada (si hay sesión) — sin la valoración, se añade luego.
  try {
    const supabase = createServerSupabase()
    const { data } = await supabase.auth.getUser()
    if (data.user) {
      await supabase.from('inq_kv').upsert(
        {
          user_id: data.user.id,
          key: 'inq-hablar-ultima',
          value: { answers, at: new Date().toISOString() },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,key' },
      )
    }
  } catch {
    /* no bloquea */
  }

  if (hasRisk(joined)) {
    return NextResponse.json({ ok: true, crisis: true, message: CRISIS_MESSAGE })
  }

  const key = process.env.ANTHROPIC_API_KEY?.trim()
  if (!key) {
    // Sin clave: el cliente usa su motor offline.
    return NextResponse.json({ ok: true, crisis: false, useOffline: true })
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1200,
        system: SYSTEM,
        messages: [
          {
            role: 'user',
            content: `${parsed.data.nick ? `Se llama ${parsed.data.nick}. ` : ''}Estas son sus respuestas de reflexión de hoy:\n\n${joined}\n\nAcompáñala.`,
          },
        ],
      }),
    })
    if (!res.ok) throw new Error(`anthropic ${res.status}`)
    const data = await res.json()
    const text = data?.content?.[0]?.text
    if (typeof text === 'string' && text.length > 40) {
      return NextResponse.json({ ok: true, crisis: false, text })
    }
    return NextResponse.json({ ok: true, crisis: false, useOffline: true })
  } catch {
    return NextResponse.json({ ok: true, crisis: false, useOffline: true })
  }
}
