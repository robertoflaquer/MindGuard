// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useRiskStore } from '../store/useRiskStore'
import { useSignalStore } from '../store/useSignalStore'
import { useQuestionnaireStore } from '../store/useQuestionnaireStore'
import { useToastStore } from '../store/useToastStore'
import {
  LogOut,
  AlertTriangle,
  Activity,
  ClipboardList,
  ChevronRight,
  Layers,
  Sun,
  Moon,
  Stethoscope,
  Video,
  ScrollText,
  Building2,
  FlaskConical,
} from 'lucide-react'
import { useThemeStore } from '../store/useThemeStore'
import RiskCard from '../components/RiskCard'
import RiskExplanationModal from '../components/RiskExplanationModal'
import SignalForm from '../components/SignalForm'
import SignalChart from '../components/SignalChart'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import api from '../services/api'
import { useInsightsStore } from '../store/useInsightsStore'

const Q_META = {
  PSS:           { label: 'PSS-10',   color: '#818CF8', getLevelText: (s) => s <= 13 ? 'Baixo' : s <= 26 ? 'Moderado' : 'Elevado' },
  GAD7:          { label: 'GAD-7',    color: '#34D399', getLevelText: (s) => s <= 4  ? 'Mínima' : s <= 9  ? 'Leve'     : s <= 14 ? 'Moderada' : 'Grave' },
  CBI:           { label: 'CBI',      color: '#FB923C', getLevelText: (s) => s <= 28 ? 'Baixo' : s <= 50 ? 'Moderado' : 'Elevado' },
  OLBI:          { label: 'OLBI',     color: '#C084FC', getLevelText: (s) => s <= 28 ? 'Baixo' : s <= 44 ? 'Moderado' : 'Elevado' },
  DAILY_CHECKIN: { label: 'Check-in', color: '#2DD4BF', getLevelText: (s) => s <= 9  ? 'Bem'   : s <= 19 ? 'Moderado' : 'Difícil' },
}

const LEVEL_SCORE_COLOR = (level) => {
  if (level === 'Baixo' || level === 'Bem' || level === 'Mínima') return 'var(--stable)'
  if (level === 'Moderado' || level === 'Moderada' || level === 'Leve') return 'var(--attn)'
  return 'var(--danger)'
}

const RISK_LEVEL_LABELS = {
  stable:        'Estável',
  attention:     'Atenção',
  elevated_risk: 'Risco Elevado',
  high_risk:     'Risco Alto',
}

function MindGuardLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9.5 4A2.5 2.5 0 0 1 12 6.5v11a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 4Z" fill="var(--jade)" />
      <path d="M14.5 4A2.5 2.5 0 0 0 12 6.5v11a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 4Z" fill="var(--jade)" fillOpacity="0.78" />
    </svg>
  )
}

function QuestionnaireCard({ q }) {
  const meta = Q_META[q.code]
  if (!meta) return null
  const score = Number(q.total_score)
  const max   = Number(q.max_score)
  const pct   = Math.round((score / max) * 100)
  const level = meta.getLevelText(score)
  const scoreColor = LEVEL_SCORE_COLOR(level)

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2.5"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderTop: `2px solid ${meta.color}` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: meta.color }}>{meta.label}</span>
        <span className="text-xs font-semibold" style={{ color: scoreColor }}>{level}</span>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text-pri)' }}>{score}</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/{max}</span>
      </div>

      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-raised)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: scoreColor }} />
      </div>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {formatDistanceToNow(new Date(q.completed_at), { addSuffix: true, locale: ptBR })}
      </p>
    </div>
  )
}

function SimulateWearableButton({ onDone }) {
  const [loading, setLoading] = useState(false)
  const [device, setDevice] = useState('apple_watch')

  async function simulate() {
    setLoading(true)
    try {
      await api.post('/api/signals/simulate', { device })
      onDone?.()
    } catch {
      // ignore — wearable sim is demo only
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <select
        value={device}
        onChange={(e) => setDevice(e.target.value)}
        className="input-field"
        style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem', height: 'auto' }}
      >
        <option value="apple_watch">Apple Watch</option>
        <option value="galaxy_watch">Galaxy Watch</option>
      </select>
      <button
        onClick={simulate}
        disabled={loading}
        className="btn-ghost flex items-center gap-1.5 text-xs"
        title="Simular leitura de wearable"
        style={{ whiteSpace: 'nowrap' }}
      >
        <Activity className="w-3.5 h-3.5" />
        {loading ? 'Importando…' : 'Simular Wearable'}
      </button>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const user     = useAuthStore((s) => s.user)
  const logout   = useAuthStore((s) => s.logout)

  const currentRisk    = useRiskStore((s) => s.currentRisk)
  const isRiskLoading  = useRiskStore((s) => s.isLoading)
  const fetchCurrentRisk = useRiskStore((s) => s.fetchCurrentRisk)

  const signals           = useSignalStore((s) => s.signals)
  const fetchRecentSignals = useSignalStore((s) => s.fetchRecentSignals)
  const fetchSignalTypes   = useSignalStore((s) => s.fetchSignalTypes)

  const { due, history, fetchDue, fetchHistory } = useQuestionnaireStore()
  const addToast = useToastStore((s) => s.addToast)

  const { recommendations, fetchInsights } = useInsightsStore()

  const [activeTab, setActiveTab] = useState('overview')
  const [showRiskModal, setShowRiskModal] = useState(false)
  const { isDark, toggle: toggleTheme } = useThemeStore()

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchCurrentRisk()
    fetchRecentSignals()
    fetchSignalTypes()
    fetchDue()
    fetchHistory(null, 20)
    fetchInsights()
  }, [])

  useEffect(() => {
    if (activeTab === 'overview') fetchCurrentRisk()
  }, [activeTab])

  const dueCount = due.filter((q) => q.is_due).length

  const latestByType = Object.values(
    history.reduce((acc, h) => { if (!acc[h.code]) acc[h.code] = h; return acc }, {})
  )

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-deep)' }}>
      {/* Header */}
      <header className="sticky top-0 z-30" style={{ background: 'var(--header-blur)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MindGuardLogo />
            <span className="text-lg font-bold" style={{ fontFamily: 'Nunito, system-ui, sans-serif', fontWeight: 800, color: 'var(--text-pri)' }}>
              MindGuard
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate('/treatment')}
              className="btn-ghost flex items-center gap-1.5 text-sm"
            >
              <Stethoscope className="w-4 h-4" />
              <span className="hidden sm:inline">Tratamento</span>
            </button>
            <button
              onClick={() => navigate('/prescriptions')}
              className="btn-ghost flex items-center gap-1.5 text-sm"
            >
              <ScrollText className="w-4 h-4" />
              <span className="hidden sm:inline">Prescrições</span>
            </button>

            <button
              onClick={() => navigate('/contexts')}
              className="btn-ghost flex items-center gap-1.5 text-sm"
            >
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">Contextos</span>
            </button>
            <button
              onClick={() => navigate('/metodologia')}
              className="btn-ghost flex items-center gap-1.5 text-sm"
              title="Embasamento científico do modelo de risco"
            >
              <FlaskConical className="w-4 h-4" />
              <span className="hidden sm:inline">Metodologia</span>
            </button>

            <button
              onClick={() => navigate('/empresa')}
              className="btn-ghost flex items-center gap-1.5 text-sm"
              style={{ color: 'var(--jade)' }}
              title="Visão executiva B2B"
            >
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Empresa</span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="btn-ghost p-2 rounded-xl"
              title={isDark ? 'Modo claro' : 'Modo escuro'}
            >
              {isDark
                ? <Sun  className="w-4 h-4" style={{ color: 'var(--attn)' }} />
                : <Moon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              }
            </button>

            <div className="w-px h-5 mx-0.5" style={{ background: 'var(--border-mid)' }} />

            <div className="text-right hidden sm:block">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Olá,</p>
              <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text-pri)' }}>{user?.fullName}</p>
            </div>

            <button onClick={handleLogout} className="btn-ghost flex items-center gap-1.5 text-sm ml-0.5">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8">
        {/* Pending questionnaires banner */}
        {dueCount > 0 && (
          <button
            onClick={() => navigate('/questionnaires')}
            className="w-full mb-6 flex items-center justify-between gap-3 px-5 py-3.5 rounded-xl transition-all"
            style={{ background: 'var(--jade-glow)', border: '1px solid rgba(45,212,191,0.25)', color: 'var(--jade)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(45,212,191,0.18)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--jade-glow)' }}
          >
            <div className="flex items-center gap-3">
              <ClipboardList className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm font-medium text-left">
                {dueCount} questionário{dueCount > 1 ? 's' : ''} pendente{dueCount > 1 ? 's' : ''} — responda para melhorar a precisão da análise.
              </p>
            </div>
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
          </button>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-8 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {[
            { key: 'overview', label: 'Visão Geral' },
            { key: 'signals',  label: 'Registrar Sinais' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              style={
                activeTab === key
                  ? { background: 'var(--bg-raised)', color: 'var(--text-pri)', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }
                  : { color: 'var(--text-muted)' }
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-up">
            {/* Risk Status */}
            <section>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
                Status de Risco
              </p>
              {isRiskLoading ? (
                <RiskCard isLoading />
              ) : currentRisk ? (
                <RiskCard risk={currentRisk} onWhyClick={() => setShowRiskModal(true)} />
              ) : (
                <div className="card text-center py-10">
                  <AlertTriangle className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-sec)' }}>
                    Nenhuma avaliação de risco ainda. Registre alguns sinais para começar.
                  </p>
                </div>
              )}
            </section>

            {/* Questionnaire summaries */}
            {latestByType.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    Questionários Recentes
                  </p>
                  <button
                    onClick={() => navigate('/questionnaires')}
                    className="flex items-center gap-1 text-xs font-semibold transition-colors"
                    style={{ color: 'var(--jade)' }}
                  >
                    Ver todos <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {latestByType.map((q) => <QuestionnaireCard key={q.code} q={q} />)}
                </div>
              </section>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    Próximos Passos
                  </p>
                  <button
                    onClick={() => navigate('/relatorio-semanal')}
                    className="flex items-center gap-1 text-xs font-semibold transition-colors"
                    style={{ color: 'var(--jade)' }}
                  >
                    Ver relatório semanal <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {recommendations.slice(0, 3).map((rec, i) => {
                    const ICONS = { sleep: '😴', breathing: '🧘', questionnaire: '📋', professional: '👨‍⚕️', movement: '🚶' }
                    const COLORS = { high: 'var(--danger)', medium: 'var(--attn)', low: 'var(--stable)' }
                    return (
                      <div key={i} className="rounded-xl px-4 py-3 flex items-center gap-3"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `2px solid ${COLORS[rec.priority] || 'var(--jade)'}` }}>
                        <span className="text-lg leading-none flex-shrink-0">{ICONS[rec.type] || '✨'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-pri)' }}>{rec.title}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{rec.action}</p>
                        </div>
                        {rec.action_type === 'questionnaire' && (
                          <button onClick={() => navigate('/questionnaires')} className="text-xs font-semibold flex-shrink-0" style={{ color: 'var(--jade)' }}>Fazer</button>
                        )}
                        {rec.action_type === 'appointment' && (
                          <button onClick={() => navigate('/treatment')} className="text-xs font-semibold flex-shrink-0" style={{ color: 'var(--jade)' }}>Agendar</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Treatment CTA */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => navigate('/conectar')}
                className="w-full text-left rounded-2xl p-5 flex items-center gap-4 transition-all"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '3px solid var(--jade)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-raised)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-card)' }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
                  style={{ background: 'rgba(45,212,191,0.12)' }}>
                  🍎
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ color: 'var(--text-pri)' }}>Conectar Apple Health</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Importe HRV, sono e FC reais do Apple Watch
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
              </button>
              <button
                onClick={() => navigate('/treatment')}
                className="w-full text-left rounded-2xl p-5 flex items-center gap-4 transition-all group"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--bg-raised)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.borderLeft = '3px solid var(--accent)'; e.currentTarget.style.background = 'var(--bg-card)' }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(74,158,255,0.12)' }}>
                  <Video className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ color: 'var(--text-pri)' }}>Agendar Consulta</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Psiquiatra, psicólogo ou terapeuta · Videochamada · 45 min
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
              </button>
              <button
                onClick={() => navigate('/prescriptions')}
                className="w-full text-left rounded-2xl p-5 flex items-center gap-4 transition-all group"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '3px solid var(--stable)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-raised)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-card)' }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(45,212,191,0.12)' }}>
                  <ScrollText className="w-5 h-5" style={{ color: 'var(--stable)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ color: 'var(--text-pri)' }}>Prescrições</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Receitas digitais com auditoria SHA-256
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
              </button>
            </section>

            {/* Signal chart */}
            <section>
              {signals?.length > 0 ? (
                <SignalChart signals={signals} />
              ) : (
                <div className="card text-center py-10">
                  <Activity className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-sec)' }}>
                    Nenhum sinal registrado ainda. Registre alguns para começar.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Signals Tab */}
        {activeTab === 'signals' && (
          <div className="animate-fade-up">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Registrar Sinais
              </p>
              <SimulateWearableButton onDone={() => {
                fetchRecentSignals()
                addToast('info', 'Dados do wearable importados! Calculando risco...')
                setTimeout(async () => {
                  try {
                    const updated = await fetchCurrentRisk()
                    if (updated) {
                      const label = RISK_LEVEL_LABELS[updated.risk_level] || updated.risk_level
                      addToast('success', `Risco atualizado: ${label} (${Math.round(updated.risk_score ?? 0)}%)`)
                    }
                  } catch { /* silent */ }
                }, 5000)
              }} />
            </div>
            <SignalForm
              onSuccess={async () => {
                fetchRecentSignals()
                addToast('info', 'Sinais registrados! Calculando análise de risco...')
                setTimeout(async () => {
                  try {
                    const updated = await fetchCurrentRisk()
                    if (updated) {
                      const label = RISK_LEVEL_LABELS[updated.risk_level] || updated.risk_level
                      const score = Math.round(updated.risk_score ?? 0)
                      addToast('success', `Risco atualizado: ${label} (${score}%)`)
                    }
                  } catch {
                    addToast('error', 'Não foi possível atualizar o risco. Tente novamente.')
                  }
                }, 5000)
              }}
            />
          </div>
        )}
      </main>

      {showRiskModal && currentRisk && (
        <RiskExplanationModal
          risk={currentRisk}
          onClose={() => setShowRiskModal(false)}
        />
      )}
    </div>
  )
}
