'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { Candidate } from '@/lib/types'
import CandidateCard from '@/components/CandidateCard'
import CandidateModal from '@/components/CandidateModal'
import Countdown from '@/components/Countdown'

type Filter = 'all' | 'miss' | 'master'

export default function HomePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchCandidates = useCallback(async () => {
    const { data } = await supabase.from('candidates').select('*').order('vote_count', { ascending: false })
    setCandidates(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCandidates()
    const ch = supabase.channel('rt-candidates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' }, fetchCandidates)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [fetchCandidates])

  const filtered = filter === 'all' ? candidates : candidates.filter(c => c.category === filter)
  const maxVotes = Math.max(...candidates.map(c => c.vote_count), 1)

  const handleVoteSuccess = (id: string) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, vote_count: c.vote_count + 1 } : c))
    setSelected(null)
  }

  const handleVoteRemoved = (id: string) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, vote_count: Math.max(c.vote_count - 1, 0) } : c))
    setSelected(null)
  }

  const filters = [
    { key: 'all' as Filter, label: '✦ Tous', color: '#C9A84C', activeColor: '#0A0A0F' },
    { key: 'miss' as Filter, label: '♛ Miss IAI', color: '#D4547A', activeColor: 'white' },
    { key: 'master' as Filter, label: '♚ Master IAI', color: '#4A8FD4', activeColor: 'white' },
  ]

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
      <Countdown />
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.7rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{ padding: '0.55rem 1.5rem', borderRadius: '50px', fontFamily: 'Outfit,sans-serif', fontSize: 'clamp(0.78rem,2.5vw,0.88rem)', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.5px', border: `2px solid ${f.color}`, transition: 'all 0.22s', background: filter === f.key ? f.color : 'transparent', color: filter === f.key ? f.activeColor : f.color }}>{f.label}</button>
        ))}
      </div>
      <p style={{ textAlign: 'center', color: '#8A8799', fontSize: '0.8rem', marginBottom: '1.5rem' }}>{filtered.length} candidat{filtered.length !== 1 ? 's' : ''}</p>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#8A8799' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.8rem', animation: 'float 1.5s ease-in-out infinite' }}>👑</div>
          <p style={{ letterSpacing: '3px', textTransform: 'uppercase', fontSize: '0.8rem' }}>Chargement...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#8A8799', border: '1px dashed rgba(201,168,76,0.18)', borderRadius: '16px' }}>
          <p style={{ fontSize: '2.5rem' }}>🎭</p>
          <p style={{ letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.82rem', marginTop: '0.8rem' }}>Aucun candidat pour le moment</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,260px),1fr))', gap: '1.2rem' }}>
          {filtered.map(c => <CandidateCard key={c.id} candidate={c} maxVotes={maxVotes} onClick={() => setSelected(c)} />)}
        </div>
      )}
      {selected && (
        <CandidateModal
          candidate={selected}
          onClose={() => setSelected(null)}
          onVoteSuccess={handleVoteSuccess}
          onVoteRemoved={handleVoteRemoved}
        />
      )}
    </div>
  )
}
