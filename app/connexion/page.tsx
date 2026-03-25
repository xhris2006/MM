'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function ConnexionPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { full_name: fullName },
            // Pas de emailRedirectTo = confirmation désactivée côté Supabase Dashboard
          }
        })
        if (error) throw error
        // Si email confirm désactivé, l'utilisateur est directement connecté
        if (data.session) {
          toast.success(`Bienvenue ${fullName || email} ! 🎉`)
          router.push('/')
          router.refresh()
        } else {
          // Fallback si confirmation encore active
          toast('Vérifiez votre email pour confirmer votre compte', { icon: '📧' })
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        toast.success('Connexion réussie !')
        const redirect = searchParams.get('redirect') || '/'
        router.push(redirect)
        router.refresh()
      }
    } catch (err: any) {
      const msgs: Record<string, string> = {
        'Invalid login credentials': 'Email ou mot de passe incorrect',
        'User already registered': 'Cet email est déjà enregistré. Connectez-vous.',
        'Password should be at least 6 characters': 'Le mot de passe doit faire au moins 6 caractères',
        'Email rate limit exceeded': 'Trop de tentatives. Réessayez dans quelques minutes.',
      }
      const msg = Object.entries(msgs).find(([k]) => err.message?.includes(k))?.[1] || err.message || 'Une erreur est survenue'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const inp: React.CSSProperties = { width: '100%', background: '#12121A', border: '1px solid rgba(255,255,255,0.1)', color: '#F0EDE6', padding: '0.8rem 1rem', borderRadius: '10px', fontFamily: 'Outfit, sans-serif', fontSize: '0.92rem', outline: 'none', marginBottom: '1rem' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '0.75rem', color: '#8A8799', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.4rem' }

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ background: '#1A1A26', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '20px', padding: '2.2rem', maxWidth: '420px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '2.2rem' }}>👑</span>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.7rem', color: '#C9A84C', marginTop: '0.4rem' }}>
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </h2>
          <p style={{ color: '#8A8799', fontSize: '0.82rem', marginTop: '0.3rem' }}>
            {mode === 'login' ? 'Accédez à votre compte pour voter' : 'Inscrivez-vous et votez gratuitement'}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#12121A', borderRadius: '10px', padding: '3px', marginBottom: '1.4rem' }}>
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '7px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.88rem', transition: 'all 0.2s', background: mode === m ? '#1A1A26' : 'transparent', color: mode === m ? '#F0EDE6' : '#8A8799', fontWeight: mode === m ? 600 : 400 }}>
              {m === 'login' ? 'Se connecter' : "S'inscrire"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <label style={lbl}>Nom complet</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Jean Dupont" style={inp} />
            </>
          )}
          <label style={lbl}>Adresse email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="votre@email.com" style={inp} />

          <label style={lbl}>Mot de passe</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" minLength={6} style={{ ...inp, marginBottom: '1.3rem' }} />

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.88rem', background: 'linear-gradient(135deg, #C9A84C, #9A7A30)', border: 'none', borderRadius: '10px', color: '#0A0A0F', fontFamily: 'Outfit, sans-serif', fontSize: '0.98rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.5px', opacity: loading ? 0.7 : 1, transition: 'all 0.3s' }}>
            {loading ? '...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#5A5770', marginTop: '1.2rem', lineHeight: 1.6 }}>
          Chaque email ne peut voter qu'<strong style={{ color: '#8A8799' }}>une seule fois par catégorie</strong>.
          Aucune confirmation par email requise.
        </p>
      </div>
    </div>
  )
}
