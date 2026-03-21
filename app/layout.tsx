import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'Miss & Master IAI Mbalmayo 2025',
  description: 'Votez pour vos candidats favoris au concours Miss & Master IAI Mbalmayo',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="relative z-10 min-h-screen">
          <Header />
          <main className="relative z-10">{children}</main>
          <footer className="relative z-10 text-center py-8 text-sm"
            style={{ borderTop: '1px solid rgba(201,168,76,0.1)', marginTop: '3rem' }}>
            <p style={{ color: '#8A8799' }}>© {new Date().getFullYear()} Miss & Master IAI Mbalmayo</p>
            <p style={{ color: '#5A5770', marginTop: '4px', fontSize: '0.8rem' }}>Institut Africain d'Informatique · Mbalmayo, Cameroun</p>
            <p style={{ marginTop: '10px', fontSize: '0.78rem' }}>
              Développé par{' '}
              <a
                href="VOTRE_LIEN_PORTFOLIO_ICI"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#C9A84C',
                  textDecoration: 'none',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  borderBottom: '1px solid rgba(201,168,76,0.4)',
                  paddingBottom: '1px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  (e.target as HTMLAnchorElement).style.color = '#E8C97A'
                  ;(e.target as HTMLAnchorElement).style.borderBottomColor = '#E8C97A'
                }}
                onMouseLeave={e => {
                  (e.target as HTMLAnchorElement).style.color = '#C9A84C'
                  ;(e.target as HTMLAnchorElement).style.borderBottomColor = 'rgba(201,168,76,0.4)'
                }}
              >
                Xhris Dior
              </a>
            </p>
          </footer>
        </div>
        <Toaster position="top-center" toastOptions={{
          style: { background: '#1A1A26', color: '#F0EDE6', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '12px', fontFamily: 'Outfit, sans-serif' },
          success: { iconTheme: { primary: '#C9A84C', secondary: '#0A0A0F' } },
        }} />
      </body>
    </html>
  )
}
