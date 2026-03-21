import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { isVotingOpen } from '@/lib/config'

// POST — voter
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non connecté. Veuillez vous connecter pour voter.' }, { status: 401 })
    if (!isVotingOpen()) return NextResponse.json({ error: 'Les votes sont fermés.' }, { status: 403 })

    const { candidateId } = await req.json()
    if (!candidateId) return NextResponse.json({ error: 'Candidat manquant.' }, { status: 400 })

    const { data: candidate } = await supabase.from('candidates').select('id,category').eq('id', candidateId).single()
    if (!candidate) return NextResponse.json({ error: 'Candidat introuvable.' }, { status: 404 })

    const { data: alreadyVoted } = await supabase.rpc('has_voted_in_category', {
      p_user_id: user.id,
      p_category: candidate.category,
    })
    if (alreadyVoted) {
      return NextResponse.json({ error: `Vous avez déjà voté dans la catégorie ${candidate.category === 'miss' ? 'Miss' : 'Master'}.` }, { status: 409 })
    }

    const { error: vErr } = await supabase.from('votes').insert({ user_id: user.id, candidate_id: candidateId })
    if (vErr) {
      if (vErr.code === '23505') return NextResponse.json({ error: 'Vous avez déjà voté pour ce candidat.' }, { status: 409 })
      return NextResponse.json({ error: vErr.message }, { status: 500 })
    }
    await supabase.rpc('increment_vote', { p_candidate_id: candidateId })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE — retirer son vote
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non connecté.' }, { status: 401 })
    if (!isVotingOpen()) return NextResponse.json({ error: 'Impossible de retirer un vote après la clôture du concours.' }, { status: 403 })

    const { candidateId } = await req.json()
    if (!candidateId) return NextResponse.json({ error: 'Candidat manquant.' }, { status: 400 })

    // Vérifier que ce vote existe bien
    const { data: vote } = await supabase.from('votes')
      .select('id').eq('user_id', user.id).eq('candidate_id', candidateId).single()
    if (!vote) return NextResponse.json({ error: 'Aucun vote trouvé pour ce candidat.' }, { status: 404 })

    // Supprimer le vote
    const { error: dErr } = await supabase.from('votes')
      .delete().eq('user_id', user.id).eq('candidate_id', candidateId)
    if (dErr) return NextResponse.json({ error: dErr.message }, { status: 500 })

    // Décrémenter le compteur (minimum 0)
    await supabase.rpc('decrement_vote', { p_candidate_id: candidateId })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}
