'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { isAdmin } from '@/lib/config'
import type { User } from '@supabase/supabase-js'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setUser(s?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navLinks = [
    { href: '/', label: 'Candidats' },
    { href: '/resultats', label: 'Résultats' },
    { href: '/qr', label: '📱 QR Code' },
  ]

  const linkStyle = (href: string) => ({
    border: `1px solid ${pathname === href ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.1)'}`,
    color: pathname === href ? '#C9A84C' : '#8A8799',
    padding: '0.4rem 1rem',
    borderRadius: '50px',
    fontSize: '0.82rem',
    letterSpacing: '0.5px',
    textDecoration: 'none',
    transition: 'all 0.2s',
    background: pathname === href ? 'rgba(201,168,76,0.08)' : 'transparent',
    whiteSpace: 'nowrap' as const,
  })

  return (
    <header style={{ borderBottom: '1px solid rgba(201,168,76,0.12)', position: 'relative', zIndex: 20 }}>
      <div style={{ background: 'linear-gradient(90deg, rgba(201,168,76,0.08), transparent)', borderBottom: '1px solid rgba(201,168,76,0.08)', textAlign: 'center', padding: '0.35rem', fontSize: '0.68rem', color: '#8A8799', letterSpacing: '3px', textTransform: 'uppercase' }}>
        ✦ Institut Africain d'Informatique · Mbalmayo ✦
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.2rem' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '0.8rem' }}>
          <span style={{ fontSize: '2.2rem', display: 'block', animation: 'float 3s ease-in-out infinite' }}>👑</span>
          <h1 style={{
            fontFamily: 'Playfair Display, serif', fontWeight: 900,
            fontSize: 'clamp(1.3rem, 3.5vw, 2.2rem)', letterSpacing: '2px',
            background: 'linear-gradient(135deg, #E8C97A, #C9A84C, #9A7A30)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            lineHeight: 1.1,
          }}>Miss & Master IAI</h1>
          <p style={{ color: '#8A8799', letterSpacing: '3px', fontSize: '0.7rem', textTransform: 'uppercase', marginTop: '3px' }}>
            Mbalmayo · Édition 2025
          </p>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {navLinks.map(l => <Link key={l.href} href={l.href} style={linkStyle(l.href)}>{l.label}</Link>)}

          {user ? (
            <>
              {isAdmin(user.email) && (
                <Link href="/admin" style={{
                  border: `1px solid ${pathname.startsWith('/admin') ? 'rgba(74,143,212,0.7)' : 'rgba(74,143,212,0.3)'}`,
                  color: '#4A8FD4', padding: '0.4rem 1rem', borderRadius: '50px',
                  fontSize: '0.82rem', letterSpacing: '0.5px', textDecoration: 'none',
                  background: pathname.startsWith('/admin') ? 'rgba(74,143,212,0.1)' : 'transparent',
                }}>⚙️ Admin</Link>
              )}
              <span style={{ color: '#C9A84C', fontSize: '0.78rem', padding: '0.4rem 0.6rem', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '50px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </span>
              <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid rgba(224,82,82,0.3)', color: '#E05252', padding: '0.4rem 0.9rem', borderRadius: '50px', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                Déconnexion
              </button>
            </>
          ) : (
            <Link href="/connexion" style={{ background: 'linear-gradient(135deg, #C9A84C, #9A7A30)', border: 'none', color: '#0A0A0F', padding: '0.45rem 1.2rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.5px', textDecoration: 'none' }}>
              Se connecter
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
