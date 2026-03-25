'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { isVotingOpen, isContestEnded } from '@/lib/config'
import toast from 'react-hot-toast'
import type { Candidate } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

export default function CandidatPage() {
  const { slug } = useParams() as { slug: string }
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [hasVotedCat, setHasVotedCat] = useState(false)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      // Try by slug first, then by id
      let { data } = await supabase.from('candidates').select('*').eq('slug', slug).single()
      if (!data) { const r = await supabase.from('candidates').select('*').eq('id', slug).single(); data = r.data }
      setCandidate(data)

      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u)
      if (u && data) {
        const { data: voted } = await supabase.rpc('has_voted_in_category', { p_user_id: u.id, p_category: data.category })
        setHasVotedCat(!!voted)
      }
      setLoading(false)
    }
    load()
  }, [slug])

  const handleVote = async () => {
    if (!user) { router.push('/connexion'); return }
    if (!candidate) return
    setVoting(true)
    const res = await fetch('/api/votes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ candidateId: candidate.id }) })
    const data = await res.json()
    setVoting(false)
    if (res.ok) {
      setHasVotedCat(true)
      setCandidate(c => c ? { ...c, vote_count: c.vote_count + 1 } : null)
      toast.success(`Vote enregistré pour ${candidate.name} ! 🎉`)
    } else {
      toast.error(data.error)
    }
  }

  const handleShare = () => {
    const url = window.location.href
    if (navigator.share) navigator.share({ title: candidate?.name || '', url })
    else { navigator.clipboard.writeText(url); toast.success('Lien copié !') }
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '5rem', color: '#8A8799' }}>
      <div style={{ fontSize: '2.5rem', animation: 'float 1.5s ease-in-out infinite' }}>👑</div>
      <p style={{ marginTop: '1rem', letterSpacing: '3px', textTransform: 'uppercase', fontSize: '0.8rem' }}>Chargement...</p>
    </div>
  )

  if (!candidate) return (
    <div style={{ textAlign: 'center', padding: '5rem', color: '#8A8799' }}>
      <p style={{ fontSize: '3rem' }}>🔍</p>
      <p style={{ marginTop: '1rem' }}>Candidat introuvable</p>
      <Link href="/" style={{ color: '#C9A84C', marginTop: '1rem', display: 'inline-block' }}>← Retour aux candidats</Link>
    </div>
  )

  const isMiss = candidate.category === 'miss'
  const color = isMiss ? '#D4547A' : '#4A8FD4'
  const votingOpen = isVotingOpen()
  const ended = isContestEnded()
  const canVote = user && votingOpen && !hasVotedCat && !ended

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem 3rem' }}>
      {/* Back */}
      <Link href="/" style={{ color: '#8A8799', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem' }}>
        ← Retour aux candidats
      </Link>

      <div style={{ background: '#1A1A26', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '20px', overflow: 'hidden' }}>
        {/* Photo hero */}
        <div style={{ position: 'relative', height: 'clamp(280px, 50vw, 450px)' }}>
          {candidate.photo_url
            ? <Image src={candidate.photo_url} alt={candidate.name} fill style={{ objectFit: 'cover', objectPosition: 'top' }} priority />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8rem', background: '#12121A' }}>{isMiss ? '👸' : '🤴'}</div>
          }
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,26,38,1) 0%, rgba(26,26,38,0.3) 50%, transparent 100%)' }} />
          <span style={{ position: 'absolute', top: '1rem', left: '1rem', background: `${color}dd`, color: 'white', padding: '0.35rem 1rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' }}>
            {isMiss ? '♛ Miss IAI' : '♚ Master IAI'}
          </span>
        </div>

        <div style={{ padding: '2rem' }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: 900, marginBottom: '0.3rem' }}>
            {candidate.name}
          </h1>
          {candidate.promotion && (
            <p style={{ fontSize: '0.82rem', color: '#C9A84C', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1.2rem' }}>
              {candidate.promotion}
            </p>
          )}

          {/* Stats */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1, background: '#12121A', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 700, color: '#C9A84C' }}>{candidate.vote_count}</div>
              <div style={{ fontSize: '0.7rem', color: '#8A8799', letterSpacing: '2px', textTransform: 'uppercase' }}>Votes reçus</div>
            </div>
            <div style={{ flex: 1, background: '#12121A', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 700, color }}>
                {isMiss ? 'Miss' : 'Master'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#8A8799', letterSpacing: '2px', textTransform: 'uppercase' }}>Catégorie</div>
            </div>
          </div>

          <p style={{ fontSize: '0.95rem', color: '#9A97B0', lineHeight: 1.8, marginBottom: '2rem' }}>
            {candidate.description}
          </p>

          {/* Vote CTA */}
          <button onClick={canVote ? handleVote : (!user ? () => router.push('/connexion') : undefined)}
            disabled={!!user && (!votingOpen || hasVotedCat || voting || ended)}
            style={{
              width: '100%', padding: '1rem', borderRadius: '12px', border: 'none',
              fontFamily: 'Outfit, sans-serif', fontSize: '1rem', fontWeight: 700,
              cursor: canVote || !user ? 'pointer' : 'not-allowed', transition: 'all 0.3s',
              letterSpacing: '1px', textTransform: 'uppercase',
              opacity: user && (hasVotedCat || !votingOpen || ended) ? 0.6 : 1,
              background: hasVotedCat ? 'linear-gradient(135deg, #4CAF7D, #2d8a5a)' : `linear-gradient(135deg, ${color}, ${color}cc)`,
              color: 'white', marginBottom: '0.8rem',
            }}>
            {voting ? 'Envoi...' : hasVotedCat ? `✓ Voté en ${isMiss ? 'Miss' : 'Master'}` : ended ? '🏁 Concours terminé' : !user ? '🔐 Se connecter pour voter' : `Voter pour ${candidate.name}`}
          </button>

          <button onClick={handleShare} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid rgba(201,168,76,0.3)', background: 'transparent', color: '#C9A84C', fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
            📤 Partager ce profil
          </button>
        </div>
      </div>
    </div>
  )
}
