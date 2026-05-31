// src/pages/Register.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { AlertCircle } from 'lucide-react'

function MindGuardLogo() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9.5 4A2.5 2.5 0 0 1 12 6.5v11a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 4Z" fill="var(--jade)" />
      <path d="M14.5 4A2.5 2.5 0 0 0 12 6.5v11a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 4Z" fill="var(--jade)" fillOpacity="0.78" />
    </svg>
  )
}

export default function Register() {
  const navigate   = useNavigate()
  const register   = useAuthStore((s) => s.register)
  const error      = useAuthStore((s) => s.error)
  const clearError = useAuthStore((s) => s.clearError)

  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '', fullName: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [localError, setLocalError] = useState('')

  const handleChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    clearError()
    if (formData.password !== formData.confirmPassword) { setLocalError('As senhas não correspondem'); return }
    if (formData.password.length < 8) { setLocalError('A senha deve ter no mínimo 8 caracteres'); return }
    setIsLoading(true)
    try {
      await register(formData.email, formData.password, formData.fullName)
      navigate('/dashboard')
    } catch {
      setLocalError(error || 'Erro ao criar conta')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--bg-deep)' }}>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <div className="ring-breathe  absolute w-80  h-80  rounded-full border" style={{ borderColor: 'var(--jade)' }} />
        <div className="ring-breathe2 absolute w-[560px] h-[560px] rounded-full border" style={{ borderColor: 'var(--jade)' }} />
        <div className="absolute w-[720px] h-[720px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(45,212,191,0.05) 0%, transparent 68%)' }} />
      </div>

      <div className="relative w-full max-w-md animate-fade-up">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-3">
            <MindGuardLogo />
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Nunito, system-ui, sans-serif', fontWeight: 800, color: 'var(--text-pri)' }}>
              MindGuard
            </h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Comece a monitorar sua saúde mental hoje</p>
        </div>

        <div className="rounded-2xl p-8" style={{ background: 'rgba(20,30,44,0.88)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-pri)' }}>Criar conta</h2>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Preencha seus dados para começar</p>

          {localError && (
            <div className="mb-6 p-3.5 rounded-xl flex items-center gap-3 text-sm" style={{ background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.22)', color: 'var(--danger)' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {localError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nome Completo</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="input-field" placeholder="Seu nome" required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" placeholder="seu@email.com" required />
            </div>
            <div>
              <label className="label">Senha</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className="input-field" placeholder="Mínimo 8 caracteres" required />
            </div>
            <div>
              <label className="label">Confirmar Senha</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="input-field" placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 mt-2 text-base">
              {isLoading ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </form>

          <p className="text-sm text-center mt-6" style={{ color: 'var(--text-muted)' }}>
            Já tem conta?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--jade)' }}>
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
