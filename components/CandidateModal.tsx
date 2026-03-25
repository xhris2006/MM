'use client'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase'
import { isVotingOpen, isContestEnded } from '@/lib/config'
import type { Candidate } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

interface Props {
  candidate: Candidate | null
  onClose: () => void
  onVoteSuccess: (id: string) => void
  onVoteRemoved: (id: string) => void
}

export default function CandidateModal({ candidate, onClose, onVoteSuccess, onVoteRemoved }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [hasVotedCat, setHasVotedCat] = useState(false)
  const [votedCandidateId, setVotedCandidateId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkingVote, setCheckingVote] = useState(true)
  const [showConfirmRemove, setShowConfirmRemove] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!candidate) return
    setCheckingVote(true)
    setShowConfirmRemove(false)
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user)
      if (data.user) {
        // Check if voted in this category
        const { data: voted } = await supabase.rpc('has_voted_in_category', {
          p_user_id: data.user.id,
          p_category: candidate.category,
        })
        setHasVotedCat(!!voted)
        // Find which candidate they voted for in this category
        if (voted) {
          const { data: voteData } = await supabase
            .from('votes')
            .select('candidate_id, candidates!inner(category)')
            .eq('user_id', data.user.id)
            .eq('candidates.category', candidate.category)
            .single()
          setVotedCandidateId(voteData?.candidate_id || null)
        }
      }
      setCheckingVote(false)
    })
  }, [candidate?.id])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [])

  if (!candidate) return null

  const isMiss = candidate.category === 'miss'
  const color = isMiss ? '#D4547A' : '#4A8FD4'
  const votingOpen = isVotingOpen()
  const ended = isContestEnded()
  // User voted specifically for THIS candidate
  const votedForThis = votedCandidateId === candidate.id

  const handleVote = async () => {
    if (!user) { router.push('/connexion'); onClose(); return }
    setLoading(true)
    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: candidate.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setHasVotedCat(true)
      setVotedCandidateId(candidate.id)
      onVoteSuccess(candidate.id)
      toast.success(`Vote enregistré pour ${candidate.name} ! 🎉`)
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  const handleRemoveVote = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/votes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: candidate.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setHasVotedCat(false)
      setVotedCandidateId(null)
      setShowConfirmRemove(false)
      onVoteRemoved(candidate.id)
      toast.success('Votre vote a été retiré.')
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  const btnLabel = () => {
    if (checkingVote || loading) return '...'
    if (hasVotedCat && !votedForThis) return `✓ Voté dans la catégorie ${isMiss ? 'Miss' : 'Master'}`
    if (votedForThis) return `✓ Vous avez voté pour ${candidate.name}`
    if (ended) return '🏁 Concours terminé'
    if (!votingOpen) return '⏳ Votes fermés'
    if (!user) return '🔐 Se connecter pour voter'
    return `Voter pour ${candidate.name}`
  }

  const canVote = user && votingOpen && !hasVotedCat && !loading && !checkingVote && !ended
  const canRemove = user && votingOpen && votedForThis && !loading && !checkingVote && !ended

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}>
      <div style={{ background: '#1A1A26', border: '1px solid rgba(201,168,76,0.22)', borderRadius: '20px', maxWidth: '550px', width: '100%', overflow: 'hidden', position: 'relative', margin: 'auto', animation: 'fadeSlideUp 0.35s ease' }}>

        <button onClick={onClose} style={{ position: 'absolute', top: '0.8rem', right: '0.8rem', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>✕</button>

        {/* Photo */}
        <div style={{ position: 'relative', height: 'clamp(220px, 40vw, 320px)' }}>
          {candidate.photo_url
            ? <Image src={candidate.photo_url} alt={candidate.name} fill style={{ objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7rem', background: '#12121A' }}>{isMiss ? '👸' : '🤴'}</div>
          }
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,26,38,1) 0%, transparent 50%)' }} />
        </div>

        <div style={{ padding: '1.3rem 1.8rem 1.8rem' }}>
          <span style={{ fontSize: '0.7rem', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 600, color }}>{isMiss ? '♛ Miss IAI' : '♚ Master IAI'}</span>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.4rem, 5vw, 1.8rem)', fontWeight: 900, margin: '0.25rem 0 0.15rem' }}>{candidate.name}</h2>
          {candidate.promotion && <p style={{ fontSize: '0.78rem', color: '#C9A84C', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.9rem' }}>{candidate.promotion}</p>}
          <p style={{ fontSize: '0.88rem', color: '#9A97B0', lineHeight: 1.75, marginBottom: '1.2rem' }}>{candidate.description}</p>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.3rem', background: '#12121A', borderRadius: '10px', padding: '0.9rem' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', fontWeight: 700, color: '#C9A84C' }}>{candidate.vote_count}</div>
              <div style={{ fontSize: '0.65rem', color: '#8A8799', letterSpacing: '2px', textTransform: 'uppercase' }}>Votes</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', fontWeight: 700, color }}>{isMiss ? 'Miss' : 'Master'}</div>
              <div style={{ fontSize: '0.65rem', color: '#8A8799', letterSpacing: '2px', textTransform: 'uppercase' }}>Catégorie</div>
            </div>
          </div>

          {/* Vote / Already voted button */}
          <button
            onClick={canVote ? handleVote : (!user ? () => { router.push('/connexion'); onClose() } : undefined)}
            disabled={!!user && (!votingOpen || (hasVotedCat && !votedForThis) || loading || checkingVote || ended)}
            style={{
              width: '100%', padding: '0.95rem', borderRadius: '11px', border: 'none',
              fontFamily: 'Outfit, sans-serif', fontSize: '0.95rem', fontWeight: 700,
              cursor: canVote || !user ? 'pointer' : 'default',
              letterSpacing: '0.5px', textTransform: 'uppercase', transition: 'all 0.3s',
              opacity: user && ((hasVotedCat && !votedForThis) || !votingOpen || ended) ? 0.55 : 1,
              background: votedForThis
                ? 'linear-gradient(135deg, #4CAF7D, #2d8a5a)'
                : `linear-gradient(135deg, ${color}, ${color}aa)`,
              color: 'white',
            }}>
            {btnLabel()}
          </button>

          {/* Retirer le vote — only shown if voted for THIS candidate and voting still open */}
          {canRemove && !showConfirmRemove && (
            <button onClick={() => setShowConfirmRemove(true)}
              style={{ width: '100%', marginTop: '0.7rem', padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(224,82,82,0.35)', background: 'transparent', color: '#E05252', fontFamily: 'Outfit, sans-serif', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', letterSpacing: '0.5px', transition: 'all 0.2s' }}>
              ↩ Retirer mon vote
            </button>
          )}

          {/* Confirmation retrait */}
          {showConfirmRemove && (
            <div style={{ marginTop: '0.7rem', padding: '1rem', background: 'rgba(224,82,82,0.08)', border: '1px solid rgba(224,82,82,0.3)', borderRadius: '10px' }}>
              <p style={{ color: '#E05252', fontSize: '0.83rem', marginBottom: '0.8rem', textAlign: 'center' }}>
                Confirmer le retrait de votre vote pour <strong>{candidate.name}</strong> ?
              </p>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button onClick={handleRemoveVote} disabled={loading}
                  style={{ flex: 1, padding: '0.6rem', background: '#E05252', border: 'none', borderRadius: '8px', color: 'white', fontFamily: 'Outfit, sans-serif', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', opacity: loading ? 0.7 : 1 }}>
                  {loading ? '...' : 'Oui, retirer'}
                </button>
                <button onClick={() => setShowConfirmRemove(false)}
                  style={{ flex: 1, padding: '0.6rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#8A8799', fontFamily: 'Outfit, sans-serif', cursor: 'pointer', fontSize: '0.85rem' }}>
                  Annuler
                </button>
              </div>
            </div>
          )}

          {!user && !ended && (
            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#8A8799', marginTop: '0.7rem' }}>
              Une connexion est requise · <a href="/connexion" style={{ color: '#C9A84C' }}>S'inscrire gratuitement</a>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
