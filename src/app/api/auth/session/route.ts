import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/supabase/env'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!supabaseConfigured()) return NextResponse.json({ user: null })
  const supabase = createServerSupabase()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return NextResponse.json({ user: null })
  const nick =
    (data.user.user_metadata?.nick as string | undefined) ||
    data.user.email?.split('@')[0] ||
    'tú'
  return NextResponse.json({
    user: { id: data.user.id, email: data.user.email, nick },
  })
}
