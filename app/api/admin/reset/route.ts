import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/config'

export async function DELETE() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  await supabase.from('votes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('candidates').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  return NextResponse.json({ success: true })
}
