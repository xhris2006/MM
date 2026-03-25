'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { isContestEnded } from '@/lib/config'
import type { Candidate } from '@/lib/types'

export default function ResultatsPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const ended = isContestEnded()

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('candidates').select('*').order('vote_count', { ascending: false })
      setCandidates(data || []); setLoading(false)
    }
    fetch()
    const ch = supabase.channel('rt-results')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' }, fetch)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const miss = candidates.filter(c => c.category === 'miss')
  const master = candidates.filter(c => c.category === 'master')
  const total = candidates.reduce((s, c) => s + c.vote_count, 0)
  const medals = ['🥇', '🥈', '🥉']

  const Section = ({ title, list, color }: { title: string; list: Candidate[]; color: string }) => {
    const max = Math.max(...list.map(c => c.vote_count), 1)
    return (
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', fontWeight: 700, marginBottom: '1.2rem', color }}>{title}</h2>

        {ended && list[0] && (
          <div style={{ background: `linear-gradient(135deg, ${color}18, ${color}06)`, border: `1px solid ${color}44`, borderRadius: '14px', padding: '1.3rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '1.2rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', border: `3px solid ${color}`, flexShrink: 0 }}>
              {list[0].photo_url ? <Image src={list[0].photo_url} alt={list[0].name} fill style={{ objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', background: '#12121A' }}>{color === '#D4547A' ? '👸' : '🤴'}</div>}
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', letterSpacing: '3px', textTransform: 'uppercase', color, marginBottom: '0.2rem' }}>🏆 Gagnant(e)</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 900 }}>{list[0].name}</div>
              <div style={{ fontSize: '0.8rem', color: '#8A8799' }}>{list[0].vote_count} votes</div>
            </div>
          </div>
        )}

        {list.map((c, i) => {
          const pct = Math.round((c.vote_count / max) * 100)
          return (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: i === 0 ? `${color}10` : '#1A1A26', border: `1px solid ${i === 0 ? color + '33' : 'rgba(201,168,76,0.1)'}`, borderRadius: '12px', padding: '0.9rem 1.1rem', marginBottom: '0.7rem', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', minWidth: '32px', color: i === 0 ? '#C9A84C' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#8A8799' }}>
                {medals[i] || `#${i + 1}`}
              </span>
              <div style={{ position: 'relative', width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', border: `2px solid rgba(201,168,76,0.18)`, flexShrink: 0 }}>
                {c.photo_url ? <Image src={c.photo_url} alt={c.name} fill style={{ objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', background: '#12121A' }}>{color === '#D4547A' ? '👸' : '🤴'}</div>}
              </div>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</div>
                <div style={{ fontSize: '0.72rem', color: '#8A8799' }}>{c.promotion}</div>
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.07)', borderRadius: '10px', marginTop: '0.35rem' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '10px', transition: 'width 1s ease' }} />
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color }}>{c.vote_count}</div>
                <div style={{ fontSize: '0.67rem', color: '#8A8799' }}>{pct}%</div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1rem 3rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.7rem, 4vw, 2.6rem)', fontWeight: 900, background: 'linear-gradient(135deg, #E8C97A, #C9A84C, #9A7A30)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          {ended ? '🏆 Résultats Officiels' : '📊 Classement en direct'}
        </h1>
        <p style={{ color: '#8A8799', marginTop: '0.4rem', fontSize: '0.85rem' }}>
          {ended ? 'Concours terminé' : 'Mis à jour en temps réel'} · {total} votes au total
        </p>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: '4rem', color: '#8A8799' }}>Chargement...</div> : (
        <>
          <Section title="♛ Miss IAI" list={miss} color="#D4547A" />
          <Section title="♚ Master IAI" list={master} color="#4A8FD4" />
        </>
      )}
    </div>
  )
}
