import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { isAdmin } from '@/lib/config'

// Client admin Supabase
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// ✅ DELETE corrigé
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> } // Changement ici : Promise
) {
  try {
    const { id: userId } = await params; // On attend la résolution des params
    
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Impossible de supprimer votre propre compte.' },
        { status: 400 }
      )
    }

    const adminClient = getAdminClient()

    const { data: userVotes } = await supabase
      .from('votes')
      .select('candidate_id')
      .eq('user_id', userId)

    if (userVotes?.length) {
      for (const vote of userVotes) {
        await supabase.rpc('decrement_vote', {
          p_candidate_id: vote.candidate_id
        })
      }

      await supabase.from('votes').delete().eq('user_id', userId)
    }

    const { error } = await adminClient.auth.admin.deleteUser(userId)
    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error(err)
    return NextResponse.json(
      { error: err.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// ✅ PATCH corrigé
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Changement ici : Promise
) {
  try {
    const { id: userId } = await params; // On attend la résolution des params
    
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { action, voteId, newCandidateId, candidateId } = await req.json()

    if (action === 'delete_vote') {
      const { data: vote } = await supabase
        .from('votes')
        .select('candidate_id')
        .eq('id', voteId)
        .single()

      if (vote) {
        await supabase.from('votes').delete().eq('id', voteId)
        await supabase.rpc('decrement_vote', {
          p_candidate_id: vote.candidate_id
        })
      }

      return NextResponse.json({ success: true })
    }

    if (action === 'change_vote') {
      const { data: vote } = await supabase
        .from('votes')
        .select('candidate_id')
        .eq('id', voteId)
        .single()

      if (!vote) {
        return NextResponse.json({ error: 'Vote introuvable' }, { status: 404 })
      }

      const { data: newCandidate } = await supabase
        .from('candidates')
        .select('category')
        .eq('id', newCandidateId)
        .single()

      if (!newCandidate) {
        return NextResponse.json({ error: 'Candidat introuvable' }, { status: 404 })
      }

      await supabase.rpc('decrement_vote', {
        p_candidate_id: vote.candidate_id
      })

      await supabase
        .from('votes')
        .update({ candidate_id: newCandidateId })
        .eq('id', voteId)

      await supabase.rpc('increment_vote', {
        p_candidate_id: newCandidateId
      })

      return NextResponse.json({ success: true })
    }

    if (action === 'add_vote') {
      const { data: newCandidate } = await supabase
        .from('candidates')
        .select('category')
        .eq('id', candidateId)
        .single()

      if (!newCandidate) {
        return NextResponse.json({ error: 'Candidat introuvable' }, { status: 404 })
      }

      const { data: alreadyVoted } = await supabase.rpc(
        'has_voted_in_category',
        {
          p_user_id: userId,
          p_category: newCandidate.category
        }
      )

      if (alreadyVoted) {
        return NextResponse.json(
          { error: `Déjà voté en ${newCandidate.category}` },
          { status: 409 }
        )
      }

      const { error } = await supabase
        .from('votes')
        .insert({ user_id: userId, candidate_id: candidateId })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      await supabase.rpc('increment_vote', {
        p_candidate_id: candidateId
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 })

  } catch (err: any) {
    console.error(err)
    return NextResponse.json(
      { error: err.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
