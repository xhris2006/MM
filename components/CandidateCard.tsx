'use client'
import Image from 'next/image'
import Link from 'next/link'
import type { Candidate } from '@/lib/types'

interface Props {
  candidate: Candidate
  maxVotes: number
  onClick: () => void
}

export default function CandidateCard({ candidate, maxVotes, onClick }: Props) {
  const pct = maxVotes > 0 ? Math.round((candidate.vote_count / maxVotes) * 100) : 0
  const isMiss = candidate.category === 'miss'
  const color = isMiss ? '#D4547A' : '#4A8FD4'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  const candidateUrl = `${siteUrl}/candidats/${candidate.slug || candidate.id}`

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (navigator.share) {
      navigator.share({ title: candidate.name, text: `Votez pour ${candidate.name} - Miss & Master IAI Mbalmayo 2025`, url: candidateUrl })
    } else {
      navigator.clipboard.writeText(candidateUrl)
      alert('Lien copié !')
    }
  }

  return (
    <div style={{ background: '#1A1A26', border: '1px solid rgba(201,168,76,0.13)', borderRadius: '16px', overflow: 'hidden', transition: 'all 0.35s cubic-bezier(0.175,0.885,0.32,1.275)', cursor: 'pointer' }}
      onClick={onClick}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-5px)'; (e.currentTarget as HTMLDivElement).style.borderColor = color; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 16px 48px ${color}22` }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(201,168,76,0.13)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}>

      {/* Photo — taille réduite sur mobile */}
      <div style={{ position: 'relative', height: 'clamp(200px, 35vw, 280px)', overflow: 'hidden' }}>
        {candidate.photo_url ? (
          <Image src={candidate.photo_url} alt={candidate.name} fill style={{ objectFit: 'cover', transition: 'transform 0.5s' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(3rem, 10vw, 5rem)', background: '#12121A' }}>
            {isMiss ? '👸' : '🤴'}
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,15,0.75) 0%, transparent 55%)' }} />

        <span style={{ position: 'absolute', top: '0.7rem', left: '0.7rem', background: `${color}dd`, color: 'white', padding: '0.22rem 0.7rem', borderRadius: '50px', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          {isMiss ? 'Miss' : 'Master'}
        </span>
        <span style={{ position: 'absolute', top: '0.7rem', right: '0.7rem', background: 'rgba(10,10,15,0.82)', border: '1px solid rgba(201,168,76,0.4)', color: '#C9A84C', padding: '0.22rem 0.6rem', borderRadius: '50px', fontSize: '0.72rem', fontWeight: 600 }}>
          🗳 {candidate.vote_count}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '0.9rem 1.1rem 1rem' }}>
        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1rem, 3.5vw, 1.15rem)', fontWeight: 700, marginBottom: '0.15rem', lineHeight: 1.2 }}>
          {candidate.name}
        </h3>
        {candidate.promotion && (
          <p style={{ fontSize: '0.7rem', color: '#C9A84C', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 500, marginBottom: '0.5rem' }}>
            {candidate.promotion}
          </p>
        )}
        <p style={{ fontSize: '0.78rem', color: '#8A8799', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '0.8rem' }}>
          {candidate.description}
        </p>

        {/* Vote bar */}
        <div style={{ height: '3px', background: 'rgba(255,255,255,0.07)', borderRadius: '10px', overflow: 'hidden', marginBottom: '0.35rem' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}99)`, borderRadius: '10px', transition: 'width 1s ease' }} />
        </div>
        <p style={{ fontSize: '0.65rem', color: '#8A8799', textAlign: 'right', marginBottom: '0.8rem' }}>{pct}% des votes</p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
          <Link href={`/candidats/${candidate.slug || candidate.id}`}
            style={{ flex: 1, textAlign: 'center', padding: '0.5rem', background: `${color}18`, border: `1px solid ${color}44`, borderRadius: '8px', color, fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', letterSpacing: '0.5px' }}>
            🔗 Profil
          </Link>
          <button onClick={handleShare}
            style={{ flex: 1, padding: '0.5rem', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '8px', color: '#C9A84C', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', letterSpacing: '0.5px' }}>
            📤 Partager
          </button>
        </div>
      </div>
    </div>
  )
}
