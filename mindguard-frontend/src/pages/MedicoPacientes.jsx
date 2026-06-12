// src/pages/MedicoPacientes.jsx
// Portal do médico: lista de pacientes acompanhados.
// Roberto Silva (= demo user logado) é o único clicavel — os outros mostram
// um overlay de "demo limitada" para focar a apresentação.
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useThemeStore } from '../store/useThemeStore'
import {
  ArrowLeft, ChevronRight, AlertTriangle, Activity, ClipboardList,
  Lock, Sun, Moon, Stethoscope, Search,
} from 'lucide-react'

function MindGuardLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9.5 4A2.5 2.5 0 0 1 12 6.5v11a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 4Z" fill="var(--jade)" />
      <path d="M14.5 4A2.5 2.5 0 0 0 12 6.5v11a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 4Z" fill="var(--jade)" fillOpacity="0.78" />
    </svg>
  )
}

const PATIENTS = [
  {
    id: 'roberto',
    isDemoUser: true,
    name: 'Roberto Silva',
    age: 34,
    company: 'TechCorp Brasil',
    plan: 'CarePlus Empresarial Premium',
    riskScore: 68,
    riskLevel: 'Elevado',
    riskColor: '#F97316',
    lastUpdate: 'há 2 min',
    summary: 'HRV ↓ 32% · PSS-10: 28/40 · contexto: deadline ativo',
    flags: ['professional_review', 'recent_signal_drop'],
  },
  {
    id: 'maria',
    name: 'Maria Costa',
    age: 41,
    company: 'TechCorp Brasil',
    plan: 'CarePlus Empresarial Premium',
    riskScore: 24,
    riskLevel: 'Baixo',
    riskColor: '#34D399',
    lastUpdate: 'há 18 min',
    summary: 'Indicadores estáveis · sono 7.6h · GAD-7: 5/21',
    flags: [],
  },
  {
    id: 'joao',
    name: 'João Oliveira',
    age: 28,
    company: 'TechCorp Brasil',
    plan: 'CarePlus Empresarial Premium',
    riskScore: 45,
    riskLevel: 'Atenção',
    riskColor: '#FBBF24',
    lastUpdate: 'há 1h',
    summary: 'Sono fragmentado 3 noites · stress 6/10 · pendente PSS',
    flags: ['questionnaire_due'],
  },
]

const FLAG_LABELS = {
  professional_review:  { icon: AlertTriangle, label: 'Revisão profissional', color: 'var(--danger)' },
  recent_signal_drop:   { icon: Activity,      label: 'Queda recente HRV',    color: '#F97316' },
  questionnaire_due:    { icon: ClipboardList, label: 'Questionário devido',  color: 'var(--attn)' },
}

export default function MedicoPacientes() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { isDark, toggle: toggleTheme } = useThemeStore()

  const handleClick = (patient) => {
    if (patient.isDemoUser) {
      sessionStorage.setItem('mg_doctor_mode', '1')
      navigate('/medico')
    } else {
      // Demo focada — só Roberto tem dados reais
      alert(`Em produção, este card abre o resumo clínico de ${patient.name}.\n\nPara esta demonstração, o paciente com dados completos é Roberto Silva.`)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-deep)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 py-3" style={{ background: 'var(--header-blur)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => navigate('/dashboard')} className="btn-ghost p-2 rounded-xl flex-shrink-0" title="Voltar ao dashboard">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <MindGuardLogo />
            <div className="min-w-0">
              <span className="text-sm font-bold" style={{ color: 'var(--text-pri)' }}>Portal Médico</span>
              <span className="hidden sm:inline text-xs ml-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                · Dra. Helena Rodrigues
              </span>
            </div>
          </div>
          <button onClick={toggleTheme} className="btn-ghost p-2 rounded-xl" title={isDark ? 'Modo claro' : 'Modo escuro'}>
            {isDark
              ? <Sun  className="w-4 h-4" style={{ color: 'var(--attn)' }} />
              : <Moon className="w-4 h-4" style={{ color: 'var(--accent)' }} />}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 py-8">
        {/* Hero */}
        <div className="mb-7">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3" style={{ background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.28)' }}>
            <Stethoscope className="w-3 h-3" style={{ color: '#818CF8' }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#818CF8' }}>
              Vista do médico
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2" style={{ color: 'var(--text-pri)', fontFamily: 'Nunito, system-ui, sans-serif', fontWeight: 800 }}>
            Pacientes acompanhados
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            3 colaboradores da TechCorp Brasil em monitoramento ativo via plano CarePlus Empresarial.
          </p>
        </div>

        {/* Search bar (visual only — demo) */}
        <div className="mb-5 flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar paciente por nome, CPF ou ID..."
            className="bg-transparent border-none outline-none flex-1 text-sm"
            style={{ color: 'var(--text-pri)' }}
            readOnly
          />
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard label="Total" value="3" />
          <StatCard label="Em risco" value="1" valueColor="var(--danger)" />
          <StatCard label="Pendentes" value="1" valueColor="var(--attn)" />
        </div>

        {/* Patient cards */}
        <div className="flex flex-col gap-3">
          {PATIENTS.map((p) => (
            <PatientCard key={p.id} patient={p} onClick={() => handleClick(p)} />
          ))}
        </div>

        {/* Note */}
        <p className="text-xs mt-8 text-center" style={{ color: 'var(--text-muted)' }}>
          🔒 Dados protegidos pela LGPD · acesso médico autenticado · audit log ativo
        </p>
      </main>
    </div>
  )
}

function StatCard({ label, value, valueColor }) {
  return (
    <div className="rounded-xl px-4 py-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-xl font-bold" style={{ color: valueColor || 'var(--text-pri)', fontFamily: 'Nunito, system-ui, sans-serif' }}>{value}</div>
    </div>
  )
}

function PatientCard({ patient, onClick }) {
  const { isDemoUser, name, age, riskScore, riskLevel, riskColor, lastUpdate, summary, flags } = patient

  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 transition-all relative overflow-hidden"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${riskColor}`,
        opacity: isDemoUser ? 1 : 0.78,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-raised)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-card)' }}
    >
      {/* Avatar with risk ring */}
      <div className="flex items-center gap-4 sm:gap-5 flex-shrink-0">
        <div className="relative w-14 h-14 flex-shrink-0">
          <svg width="56" height="56" viewBox="0 0 56 56" className="absolute inset-0">
            <circle cx="28" cy="28" r="25" fill="none" stroke="var(--border)" strokeWidth="3" />
            <circle
              cx="28" cy="28" r="25" fill="none"
              stroke={riskColor} strokeWidth="3"
              strokeDasharray={`${(riskScore / 100) * 157} 157`}
              strokeLinecap="round"
              transform="rotate(-90 28 28)"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center font-bold text-base" style={{ color: riskColor }}>
            {riskScore}
          </div>
        </div>

        <div className="flex-1 min-w-0 sm:hidden">
          <div className="font-bold text-base truncate" style={{ color: 'var(--text-pri)' }}>{name}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{age} anos · {lastUpdate}</div>
        </div>
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="hidden sm:flex items-baseline gap-2 mb-1">
          <span className="font-bold text-base truncate" style={{ color: 'var(--text-pri)' }}>{name}</span>
          <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>· {age} anos</span>
          <span className="text-xs ml-auto flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{lastUpdate}</span>
        </div>
        <div className="text-xs mb-2" style={{ color: 'var(--text-sec)' }}>
          <span className="font-semibold" style={{ color: riskColor }}>Risco {riskLevel}</span>
          <span style={{ color: 'var(--text-muted)' }}> · {summary}</span>
        </div>

        {flags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {flags.map((f) => {
              const meta = FLAG_LABELS[f]
              if (!meta) return null
              const Icon = meta.icon
              return (
                <span
                  key={f}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: `${meta.color}1f`, color: meta.color }}
                >
                  <Icon className="w-2.5 h-2.5" />
                  {meta.label}
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
        {isDemoUser ? (
          <>
            <span className="text-xs font-semibold" style={{ color: 'var(--jade)' }}>Abrir prontuário</span>
            <ChevronRight className="w-4 h-4" style={{ color: 'var(--jade)' }} />
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)' }}>
            <Lock className="w-3 h-3" />
            Demo limitada
          </span>
        )}
      </div>
    </button>
  )
}
