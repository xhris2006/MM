import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { isAdmin } from '@/lib/config'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const userId = params.id
    if (userId === user.id) {
      return NextResponse.json({ error: 'Impossible de supprimer votre propre compte.' }, { status: 400 })
    }

    const adminClient = getAdminClient()
    const { data: userVotes } = await adminClient
      .from('votes')
      .select('candidate_id')
      .eq('user_id', userId)

    if (userVotes && userVotes.length > 0) {
      for (const vote of userVotes) {
        await adminClient.rpc('decrement_vote', { p_candidate_id: vote.candidate_id })
      }
      await adminClient.from('votes').delete().eq('user_id', userId)
    }

    const { error: deleteErr } = await adminClient.auth.admin.deleteUser(userId)
    if (deleteErr) throw deleteErr

    return NextResponse.json({ success: true, message: 'Utilisateur et ses votes supprimés.' })
  } catch (err: any) {
    console.error('DELETE /api/admin/users/[id] error:', err)
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const userId = params.id
    const { action, voteId, newCandidateId, candidateId } = await req.json()
    const adminClient = getAdminClient()

    if (action === 'delete_vote') {
      const { data: vote } = await adminClient
        .from('votes')
        .select('candidate_id')
        .eq('id', voteId)
        .single()
      if (vote) {
        await adminClient.from('votes').delete().eq('id', voteId)
        await adminClient.rpc('decrement_vote', { p_candidate_id: vote.candidate_id })
      }
      return NextResponse.json({ success: true })
    }

    if (action === 'change_vote') {
      const { data: vote } = await adminClient
        .from('votes')
        .select('candidate_id')
        .eq('id', voteId)
        .single()
      if (!vote) return NextResponse.json({ error: 'Vote introuvable' }, { status: 404 })

      const { data: newCandidate } = await supabase
        .from('candidates')
        .select('category')
        .eq('id', newCandidateId)
        .single()
      if (!newCandidate) return NextResponse.json({ error: 'Candidat cible introuvable' }, { status: 404 })

      await adminClient.rpc('decrement_vote', { p_candidate_id: vote.candidate_id })
      await adminClient.from('votes').update({ candidate_id: newCandidateId }).eq('id', voteId)
      await adminClient.rpc('increment_vote', { p_candidate_id: newCandidateId })

      return NextResponse.json({ success: true })
    }

    if (action === 'add_vote') {
      const { data: newCandidate } = await supabase
        .from('candidates')
        .select('category')
        .eq('id', candidateId)
        .single()
      if (!newCandidate) return NextResponse.json({ error: 'Candidat introuvable' }, { status: 404 })

      const { data: alreadyVoted } = await supabase.rpc('has_voted_in_category', {
        p_user_id: userId,
        p_category: newCandidate.category,
      })
      if (alreadyVoted) {
        return NextResponse.json({ error: `Cet utilisateur a déjà voté en ${newCandidate.category}.` }, { status: 409 })
      }

      const { error: insertErr } = await adminClient
        .from('votes')
        .insert({ user_id: userId, candidate_id: candidateId })
      if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

      await adminClient.rpc('increment_vote', { p_candidate_id: candidateId })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
  } catch (err: any) {
    console.error('PATCH /api/admin/users/[id] error:', err)
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}
