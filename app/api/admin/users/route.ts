import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { isAdmin } from '@/lib/config'

export async function GET() {
  try {
    const supabase = await createServerSupabase()

    // Vérifier que c'est bien l'admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Client admin avec service_role pour lire auth.users
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Récupérer tous les utilisateurs depuis auth.users
    const { data: authUsers, error: authErr } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })
    if (authErr) throw authErr

    // Récupérer tous les votes avec les infos candidats
    const { data: votes, error: votesErr } = await adminClient
      .from('votes')
      .select(`
        id,
        user_id,
        candidate_id,
        created_at,
        candidates (
          id,
          name,
          category,
          photo_url
        )
      `)
    if (votesErr) throw votesErr

    // Assembler : pour chaque user, attacher ses votes
    const users = authUsers.users
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(u => ({
        id: u.id,
        email: u.email,
        full_name: u.user_metadata?.full_name || null,
        created_at: u.created_at,
        confirmed_at: u.confirmed_at,
        votes: (votes || []).filter(v => v.user_id === u.id),
      }))

    return NextResponse.json(users)
  } catch (err: any) {
    console.error('GET /api/admin/users error:', err)
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}
