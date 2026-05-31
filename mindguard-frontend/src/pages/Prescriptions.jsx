// src/pages/Prescriptions.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useThemeStore } from '../store/useThemeStore'
import { ArrowLeft, Sun, Moon, FileText, Shield, ChevronDown, ChevronUp, AlertCircle, Pill, Clock } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import api from '../services/api'

function MindGuardLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9.5 4A2.5 2.5 0 0 1 12 6.5v11a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 4Z" fill="var(--jade)" />
      <path d="M14.5 4A2.5 2.5 0 0 0 12 6.5v11a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 4Z" fill="var(--jade)" fillOpacity="0.78" />
    </svg>
  )
}

function PrescriptionCard({ rx }) {
  const [open, setOpen] = useState(false)
  const items = typeof rx.items === 'string' ? JSON.parse(rx.items) : rx.items || []
  const issued = rx.issued_at ? format(parseISO(rx.issued_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—'

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <button
        className="w-full p-4 flex items-center gap-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(74,158,255,0.12)' }}
        >
          <FileText className="w-5 h-5" style={{ color: 'var(--accent)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm" style={{ color: 'var(--fg-base)' }}>
            {rx.specialist_name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)' }}>
            {rx.specialty} · {issued}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(45,212,191,0.1)', color: 'var(--stable)' }}
          >
            {items.length} {items.length === 1 ? 'item' : 'itens'}
          </span>
          {open ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--fg-muted)' }} /> : <ChevronDown className="w-4 h-4" style={{ color: 'var(--fg-muted)' }} />}
        </div>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '1rem' }}>
          {items.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--fg-muted)' }}>Nenhum item listado</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                    background: 'var(--bg-raised)', borderRadius: 10,
                    padding: '0.75rem',
                  }}
                >
                  <Pill className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--fg-base)' }}>{item.medication || item.name || `Item ${i + 1}`}</p>
                    {item.dosage && <p className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)' }}>Dosagem: {item.dosage}</p>}
                    {item.frequency && <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>Frequência: {item.frequency}</p>}
                    {item.instructions && <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--fg-muted)' }}>{item.instructions}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {rx.observations && (
            <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(74,158,255,0.06)', border: '1px solid rgba(74,158,255,0.15)' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--accent)' }}>Observações do médico</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--fg-base)' }}>{rx.observations}</p>
            </div>
          )}

          {/* Audit hash */}
          {rx.audit_hash && (
            <div className="mt-3 flex items-start gap-2 p-3 rounded-xl" style={{ background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.15)' }}>
              <Shield className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--stable)' }} />
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--stable)' }}>Auditoria SHA-256</p>
                <p className="text-xs mt-0.5 break-all font-mono" style={{ color: 'var(--fg-muted)', fontSize: '0.68rem' }}>{rx.audit_hash}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Prescriptions() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { isDark, toggle: toggleTheme } = useThemeStore()
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    api.get('/api/prescriptions')
      .then(({ data }) => setPrescriptions(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-deep)' }}>
      {/* Header */}
      <header className="sticky top-0 z-30" style={{ background: 'var(--header-blur)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl transition-colors"
            style={{ color: 'var(--fg-muted)', background: 'var(--bg-card)' }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1 }}>
            <MindGuardLogo />
            <div>
              <h1 className="text-sm font-bold" style={{ fontFamily: 'Nunito, system-ui, sans-serif', fontWeight: 800, color: 'var(--fg-base)' }}>
                Prescrições
              </h1>
              <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>Histórico de receitas médicas</p>
            </div>
          </div>
          <button onClick={toggleTheme} className="btn-ghost p-2 rounded-xl">
            {isDark ? <Sun className="w-4 h-4" style={{ color: 'var(--attn)' }} /> : <Moon className="w-4 h-4" style={{ color: 'var(--accent)' }} />}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '2rem 1.25rem' }}>

        {/* Info banner */}
        <div className="rounded-2xl p-4 mb-6 flex gap-3" style={{ background: 'rgba(74,158,255,0.07)', border: '1px solid rgba(74,158,255,0.2)' }}>
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--fg-base)' }}>Prescrições digitais</p>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--fg-muted)' }}>
              Receitas emitidas após consultas com os especialistas do Blua. Cada prescrição possui hash SHA-256 para auditoria e imutabilidade.
            </p>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--fg-muted)' }}>
            <Clock className="w-8 h-8 mx-auto mb-3 animate-spin" style={{ opacity: 0.4 }} />
            <p className="text-sm">Carregando prescrições…</p>
          </div>
        )}

        {!loading && prescriptions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--bg-card)' }}
            >
              <FileText className="w-8 h-8" style={{ color: 'var(--fg-muted)', opacity: 0.4 }} />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--fg-base)' }}>Nenhuma prescrição</p>
            <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>
              As receitas emitidas após suas teleconsultas aparecerão aqui.
            </p>
            <button
              className="btn-primary mt-6 px-6 py-2.5"
              onClick={() => navigate('/treatment')}
            >
              Agendar consulta
            </button>
          </div>
        )}

        {!loading && prescriptions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--fg-muted)' }}>
              {prescriptions.length} {prescriptions.length === 1 ? 'prescrição' : 'prescrições'}
            </p>
            {prescriptions.map((rx) => (
              <PrescriptionCard key={rx.id} rx={rx} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
