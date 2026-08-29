// Evaluación orientativa de INQUEBRANTABLE.
// NO es un diagnóstico. Mide 8 dimensiones de bienestar emocional; cada
// pregunta puntúa 0-3 y el resultado por dimensión se normaliza a 0-100
// (más alto = mejor en esa área).

export type DimId =
  | 'autoestima'
  | 'limites'
  | 'relaciones'
  | 'dependencia'
  | 'agotamiento'
  | 'soledad'
  | 'autocuidado'
  | 'pedir_ayuda'

export const DIMENSIONS: { id: DimId; label: string; low: string; high: string }[] = [
  { id: 'autoestima', label: 'Autoestima', low: 'Te cuesta verte con valor', high: 'Reconoces tu valor' },
  { id: 'limites', label: 'Límites', low: 'Te cuesta decir que no', high: 'Pones límites con calma' },
  { id: 'relaciones', label: 'Relaciones', low: 'Tus vínculos te pesan', high: 'Tus vínculos te sostienen' },
  { id: 'dependencia', label: 'Autonomía emocional', low: 'Dependes de otros para estar bien', high: 'Tu estabilidad depende de ti' },
  { id: 'agotamiento', label: 'Energía', low: 'Te sientes agotada', high: 'Tienes energía disponible' },
  { id: 'soledad', label: 'Acompañamiento', low: 'Te sientes sola', high: 'Te sientes acompañada' },
  { id: 'autocuidado', label: 'Autocuidado', low: 'Te dejas la última', high: 'Te cuidas de forma habitual' },
  { id: 'pedir_ayuda', label: 'Pedir ayuda', low: 'Cargas todo sola', high: 'Sabes pedir ayuda' },
]

type Q = { d: DimId; q: string; a: string[]; invert?: boolean }

// 16 preguntas, 2 por dimensión. `invert: true` → la opción 0 es la más sana.
export const QUESTIONS: Q[] = [
  { d: 'autoestima', q: '¿Con qué frecuencia te hablas con dureza cuando algo te sale mal?', a: ['Casi siempre', 'A menudo', 'A veces', 'Rara vez'], invert: true },
  { d: 'autoestima', q: '¿Sientes que tienes que hacer méritos para que te quieran?', a: ['Siempre', 'Muchas veces', 'A veces', 'No, me valen tal como soy'], invert: true },

  { d: 'limites', q: 'Cuando alguien te pide algo que no quieres hacer…', a: ['Lo hago igual', 'Cedo tras dudar mucho', 'Lo negocio', 'Digo que no sin culpa'] },
  { d: 'limites', q: '¿Te sientes responsable de las emociones de los demás?', a: ['Todo el tiempo', 'Bastante', 'A veces', 'Casi nunca'], invert: true },

  { d: 'relaciones', q: '¿Las personas cercanas te tratan con respeto?', a: ['Casi nunca', 'A veces', 'Casi siempre', 'Siempre'] },
  { d: 'relaciones', q: '¿Puedes mostrarte tal como eres con quienes te rodean?', a: ['Con nadie', 'Con muy pocas', 'Con algunas', 'Con varias personas'] },

  { d: 'dependencia', q: 'Tu estado de ánimo, ¿depende de cómo te trate una persona concreta?', a: ['Totalmente', 'Bastante', 'Un poco', 'Casi nada'], invert: true },
  { d: 'dependencia', q: '¿Necesitas la aprobación de alguien para tomar decisiones tuyas?', a: ['Siempre', 'A menudo', 'A veces', 'Decido por mí'], invert: true },

  { d: 'agotamiento', q: '¿Cómo llegas al final del día?', a: ['Sin nada, vacía', 'Muy cansada', 'Algo cansada', 'Con energía'] },
  { d: 'agotamiento', q: '¿Descansas de verdad en algún momento?', a: ['Nunca', 'Casi nunca', 'A veces', 'Sí, a menudo'] },

  { d: 'soledad', q: '¿Sientes que hay alguien que te entiende de verdad?', a: ['Nadie', 'Casi nadie', 'Alguna persona', 'Varias personas'] },
  { d: 'soledad', q: '¿Con qué frecuencia te sientes invisible para los demás?', a: ['Siempre', 'A menudo', 'A veces', 'Rara vez'], invert: true },

  { d: 'autocuidado', q: '¿Haces algo cada día solo porque te hace bien a ti?', a: ['Nunca', 'Casi nunca', 'A veces', 'Casi todos los días'] },
  { d: 'autocuidado', q: 'Cuando te sientes mal, ¿te permites parar y cuidarte?', a: ['Nunca, sigo adelante', 'Casi nunca', 'A veces', 'Sí, me lo permito'] },

  { d: 'pedir_ayuda', q: '¿Pides ayuda cuando la necesitas?', a: ['Jamás', 'Casi nunca', 'A veces', 'Sí, cuando hace falta'] },
  { d: 'pedir_ayuda', q: '¿Te da vergüenza que otros vean que lo estás pasando mal?', a: ['Mucha', 'Bastante', 'Un poco', 'No especialmente'], invert: true },
]

export const LEVELS = [
  { idx: 0, name: 'La Grieta', desc: 'El punto de ruptura. Aquí empieza todo.' },
  { idx: 1, name: 'El Despertar', desc: 'Empiezas a verte y a nombrar lo que sientes.' },
  { idx: 2, name: 'Reconstrucción', desc: 'Trabajo activo. Estás construyendo tu base.' },
  { idx: 3, name: 'Inquebrantable', desc: 'Tu fuerza ya no depende de nadie más.' },
]

export type DimScores = Record<DimId, number>

export function scoreAssessment(answers: number[]): {
  dimensions: DimScores
  average: number
  levelIdx: number
  priority: DimId
} {
  const raw: Record<string, { sum: number; n: number }> = {}
  QUESTIONS.forEach((q, i) => {
    const pick = Math.max(0, Math.min(3, answers[i] ?? 0))
    const val = q.invert ? 3 - pick : pick
    if (!raw[q.d]) raw[q.d] = { sum: 0, n: 0 }
    raw[q.d].sum += val
    raw[q.d].n += 1
  })
  const dimensions = {} as DimScores
  for (const dim of DIMENSIONS) {
    const r = raw[dim.id] || { sum: 0, n: 1 }
    dimensions[dim.id] = Math.round((r.sum / (r.n * 3)) * 100)
  }
  const vals = Object.values(dimensions)
  const average = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
  const levelIdx = average < 25 ? 0 : average < 50 ? 1 : average < 75 ? 2 : 3
  const priority = (Object.entries(dimensions).sort((a, b) => a[1] - b[1])[0]?.[0] ||
    'autoestima') as DimId
  return { dimensions, average, levelIdx, priority }
}

// Recomendación de programa según el área prioritaria.
export const PRIORITY_PROGRAM: Record<DimId, { slug: string; label: string }> = {
  autoestima: { slug: 'recuperar-valor', label: 'Recuperar tu valor' },
  limites: { slug: 'poner-limites', label: 'Poner límites' },
  relaciones: { slug: 'sanar-relacion', label: 'Sanar una relación tóxica' },
  dependencia: { slug: 'volver-a-ti', label: 'Volver a ti' },
  agotamiento: { slug: 'volver-a-ti', label: 'Volver a ti' },
  soledad: { slug: 'volver-a-ti', label: 'Volver a ti' },
  autocuidado: { slug: 'volver-a-ti', label: 'Volver a ti' },
  pedir_ayuda: { slug: 'recuperar-valor', label: 'Recuperar tu valor' },
}
