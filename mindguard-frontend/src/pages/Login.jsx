// src/pages/Login.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { AlertCircle } from 'lucide-react'

function MindGuardLogo() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden>
      <path d="M17 30C9 26 5 19.5 5 13a6 6 0 0 1 12-1 6 6 0 0 1 12 1c0 6.5-4 13.5-12 17z" fill="var(--jade)" opacity="0.9" />
      <path d="M9 17h4l2-4.5 4.5 9 2.5-4.5H26" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Login() {
  const navigate  = useNavigate()
  const login     = useAuthStore((s) => s.login)
  const error     = useAuthStore((s) => s.error)
  const clearError = useAuthStore((s) => s.clearError)

  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [localError,setLocalError]= useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setLocalError('')
    clearError()
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch {
      setLocalError(error || 'Credenciais inválidas')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--bg-deep)' }}>
      {/* Ambient background rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <div className="ring-breathe  absolute w-80  h-80  rounded-full border" style={{ borderColor: 'var(--jade)' }} />
        <div className="ring-breathe2 absolute w-[560px] h-[560px] rounded-full border" style={{ borderColor: 'var(--jade)' }} />
        <div className="absolute w-[720px] h-[720px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(45,212,191,0.05) 0%, transparent 68%)' }} />
      </div>

      <div className="relative w-full max-w-md animate-fade-up">
        {/* Wordmark */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-3">
            <MindGuardLogo />
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Nunito, system-ui, sans-serif', fontWeight: 800, color: 'var(--text-pri)' }}>
              MindGuard
            </h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Monitoramento inteligente da sua saúde mental</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: 'rgba(20,30,44,0.88)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-pri)' }}>Bem-vindo de volta</h2>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Entre na sua conta para continuar</p>

          {localError && (
            <div className="mb-6 p-3.5 rounded-xl flex items-center gap-3 text-sm" style={{ background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.22)', color: 'var(--danger)' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {localError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="seu@email.com" required />
            </div>
            <div>
              <label className="label">Senha</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 mt-2 text-base">
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-sm text-center mt-6" style={{ color: 'var(--text-muted)' }}>
            Não tem conta?{' '}
            <Link to="/register" className="font-semibold hover:underline" style={{ color: 'var(--jade)' }}>
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
