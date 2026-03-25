'use client'
import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase'
import type { Candidate } from '@/lib/types'

export default function QRPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [selected, setSelected] = useState<'site' | string>('site')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || typeof window !== 'undefined' ? window.location.origin : ''
  const supabase = createClient()

  useEffect(() => {
    supabase.from('candidates').select('id, name, slug, category').order('name').then(({ data }) => setCandidates(data || []))
  }, [])

  useEffect(() => {
    const url = selected === 'site' ? siteUrl : `${siteUrl}/candidats/${candidates.find(c => c.id === selected)?.slug || selected}`
    QRCode.toDataURL(url, {
      width: 300, margin: 2,
      color: { dark: '#C9A84C', light: '#0A0A0F' },
      errorCorrectionLevel: 'M',
    }).then(setQrDataUrl).catch(() => {})
  }, [selected, candidates, siteUrl])

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = qrDataUrl
    const name = selected === 'site' ? 'qr-site' : `qr-${candidates.find(c => c.id === selected)?.name?.toLowerCase().replace(/\s+/g, '-') || selected}`
    a.download = `${name}-miss-master-iai.png`
    a.click()
  }

  const selectedCandidate = selected !== 'site' ? candidates.find(c => c.id === selected) : null
  const targetUrl = selected === 'site' ? siteUrl : `${siteUrl}/candidats/${selectedCandidate?.slug || selected}`

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem 1rem 3rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 900, background: 'linear-gradient(135deg, #E8C97A, #C9A84C, #9A7A30)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          📱 QR Codes
        </h1>
        <p style={{ color: '#8A8799', fontSize: '0.88rem', marginTop: '0.4rem' }}>
          Partagez le site ou le profil d'un candidat via QR Code
        </p>
      </div>

      {/* Selector */}
      <div style={{ background: '#1A1A26', border: '1px solid rgba(201,168,76,0.18)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.75rem', color: '#8A8799', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Choisir la destination</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.7rem 1rem', borderRadius: '10px', cursor: 'pointer', background: selected === 'site' ? 'rgba(201,168,76,0.1)' : 'transparent', border: `1px solid ${selected === 'site' ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.06)'}`, transition: 'all 0.2s' }}>
            <input type="radio" name="qr" value="site" checked={selected === 'site'} onChange={() => setSelected('site')} style={{ accentColor: '#C9A84C' }} />
            <span style={{ fontSize: '0.88rem', fontWeight: selected === 'site' ? 600 : 400, color: selected === 'site' ? '#C9A84C' : '#F0EDE6' }}>🌐 Page d'accueil du site</span>
          </label>

          {candidates.map(c => {
            const isMiss = c.category === 'miss'
            return (
              <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.7rem 1rem', borderRadius: '10px', cursor: 'pointer', background: selected === c.id ? `rgba(${isMiss ? '212,84,122' : '74,143,212'},0.1)` : 'transparent', border: `1px solid ${selected === c.id ? (isMiss ? 'rgba(212,84,122,0.4)' : 'rgba(74,143,212,0.4)') : 'rgba(255,255,255,0.06)'}`, transition: 'all 0.2s' }}>
                <input type="radio" name="qr" value={c.id} checked={selected === c.id} onChange={() => setSelected(c.id)} style={{ accentColor: isMiss ? '#D4547A' : '#4A8FD4' }} />
                <span style={{ fontSize: '0.85rem', color: selected === c.id ? (isMiss ? '#D4547A' : '#4A8FD4') : '#F0EDE6', fontWeight: selected === c.id ? 600 : 400 }}>
                  {isMiss ? '♛' : '♚'} {c.name}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#8A8799', letterSpacing: '1px' }}>{c.category}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* QR Display */}
      {qrDataUrl && (
        <div style={{ background: '#1A1A26', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '16px', padding: '2rem', textAlign: 'center' }}>
          <div style={{ background: '#0A0A0F', padding: '1.5rem', borderRadius: '12px', display: 'inline-block', marginBottom: '1.2rem', border: '2px solid rgba(201,168,76,0.2)' }}>
            <img src={qrDataUrl} alt="QR Code" style={{ display: 'block', width: '220px', height: '220px', imageRendering: 'pixelated' }} />
          </div>

          <p style={{ fontSize: '0.78rem', color: '#8A8799', marginBottom: '0.5rem' }}>
            {selected === 'site' ? '🌐 Dirige vers la page principale' : `👤 Profil de ${selectedCandidate?.name}`}
          </p>
          <p style={{ fontSize: '0.7rem', color: '#5A5770', wordBreak: 'break-all', marginBottom: '1.2rem', fontFamily: 'monospace' }}>
            {targetUrl}
          </p>

          <button onClick={handleDownload} style={{ padding: '0.75rem 2rem', background: 'linear-gradient(135deg, #C9A84C, #9A7A30)', border: 'none', borderRadius: '10px', color: '#0A0A0F', fontFamily: 'Outfit, sans-serif', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', letterSpacing: '0.5px' }}>
            ⬇️ Télécharger le QR Code
          </button>

          <p style={{ fontSize: '0.72rem', color: '#5A5770', marginTop: '1rem', lineHeight: 1.5 }}>
            Imprimez-le sur des affiches, flyers ou partagez l'image directement
          </p>
        </div>
      )}
    </div>
  )
}
