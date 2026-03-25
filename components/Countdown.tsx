'use client'
import { useEffect, useState } from 'react'
import { CONTEST_CONFIG, isVotingOpen, isContestEnded } from '@/lib/config'

function pad(n: number) { return String(n).padStart(2, '0') }

export default function Countdown() {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const calc = () => {
      const diff = Math.max(0, CONTEST_CONFIG.voteEndDate.getTime() - Date.now())
      setT({ d: Math.floor(diff / 86400000), h: Math.floor(diff % 86400000 / 3600000), m: Math.floor(diff % 3600000 / 60000), s: Math.floor(diff % 60000 / 1000) })
    }
    calc(); const i = setInterval(calc, 1000); return () => clearInterval(i)
  }, [])

  if (!mounted) return null
  if (isContestEnded()) return (
    <div style={{ textAlign: 'center', margin: '1rem auto', maxWidth: '500px', padding: '0.8rem 1.5rem', background: 'rgba(224,82,82,0.1)', border: '1px solid rgba(224,82,82,0.35)', borderRadius: '12px', color: '#E05252', fontWeight: 600, letterSpacing: '1px', fontSize: '0.88rem' }}>
      🏆 Le concours est terminé — Découvrez les gagnants !
    </div>
  )
  if (!isVotingOpen()) return (
    <div style={{ textAlign: 'center', margin: '1rem auto', maxWidth: '500px', padding: '0.8rem 1.5rem', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '12px', color: '#C9A84C', fontSize: '0.85rem' }}>
      Les votes n'ont pas encore commencé
    </div>
  )

  return (
    <div style={{ textAlign: 'center', margin: '1.2rem auto', maxWidth: '440px', padding: '1rem 1.5rem', background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.22)', borderRadius: '14px' }}>
      <p style={{ color: '#8A8799', fontSize: '0.65rem', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '0.7rem' }}>Fin des votes dans</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.2rem' }}>
        {[{ v: t.d, l: 'J' }, { v: t.h, l: 'H' }, { v: t.m, l: 'M' }, { v: t.s, l: 'S' }].map((u, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', fontWeight: 700, color: '#C9A84C', lineHeight: 1 }}>{pad(u.v)}</div>
            <div style={{ fontSize: '0.6rem', color: '#8A8799', letterSpacing: '2px', marginTop: '3px' }}>{u.l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
