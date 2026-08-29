import { createServerSupabase } from '@/lib/supabase/server'

const DIACRITICS = /[̀-ͯ]/g

const BANNED = [
  'puta', 'zorra', 'gilipollas', 'imbecil', 'idiota', 'subnormal',
  'maricon', 'retrasada', 'retrasado', 'muerete',
]

/** Filtro basico de respeto. La moderacion real es humana (denuncias + panel). */
export function contieneInsulto(texto: string): boolean {
  const t = texto.toLowerCase().normalize('NFD').replace(DIACRITICS, '')
  return BANNED.some((w) => new RegExp(`\\b${w}\\b`).test(t))
}

export async function getAuthUser() {
  const supabase = createServerSupabase()
  const { data } = await supabase.auth.getUser()
  return { supabase, user: data.user }
}

/** Nick de la usuaria (de user_metadata; el email es fuente secundaria). */
export function nickOf(user: {
  user_metadata?: Record<string, unknown>
  email?: string | null
}) {
  return (
    (user.user_metadata?.nick as string | undefined) ||
    user.email?.split('@')[0] ||
    'Anonima'
  )
}

export type FeedPost = {
  id: number
  circle_slug: string
  author: string
  body: string
  is_anonymous: boolean
  created_at: string
  isMine: boolean
  comments: number
  reactions: Record<string, number>
  myReactions: string[]
}
