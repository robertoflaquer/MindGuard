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
  BarChart2,
  Smartphone,
  CheckCircle2,
  WifiOff,
  Flame,
  Wind,
  UserCheck,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import { useThemeStore } from '../store/useThemeStore'
import RiskCard from '../components/RiskCard'
import RiskExplanationModal from '../components/RiskExplanationModal'
import SignalForm from '../components/SignalForm'
import SignalChart from '../components/SignalChart'
import BreathingExercise from '../components/BreathingExercise'
import MoodCalendar from '../components/MoodCalendar'
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

function AppleHealthIcon({ size = 18, color = 'currentColor' }) {
  // Heart-pulse glyph clean para representar Apple Health
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      <path d="M3.22 12h5l1.5-3 3 6 1.5-3h7.5"/>
    </svg>
  )
}

function GalaxyWatchIcon({ size = 18, color = 'currentColor' }) {
  // Smartwatch outline clean
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="6"/>
      <polyline points="9 4 9.5 1.5 14.5 1.5 15 4"/>
      <polyline points="9 20 9.5 22.5 14.5 22.5 15 20"/>
      <circle cx="12" cy="12" r="1.5" fill={color}/>
    </svg>
  )
}

function WearableStatusCard({ status, onConnect }) {
  const connected = status?.apple_health?.connected
  const lastSync  = status?.apple_health?.last_sync
  const total     = status?.apple_health?.total_records ?? 0

  return (
    <button
      onClick={onConnect}
      className="w-full text-left rounded-2xl p-4 flex items-center gap-4 transition-all"
      style={{
        background: connected ? 'rgba(45,212,191,0.07)' : 'var(--bg-card)',
        border: `1px solid ${connected ? 'rgba(45,212,191,0.3)' : 'var(--border)'}`,
      }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: connected ? 'rgba(45,212,191,0.15)' : 'var(--bg-raised)' }}>
        <AppleHealthIcon size={20} color={connected ? 'var(--jade)' : 'var(--text-muted)'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold" style={{ color: 'var(--text-pri)' }}>Apple Health</p>
          {connected
            ? <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(45,212,191,0.15)', color: 'var(--jade)' }}>
                <CheckCircle2 className="w-3 h-3" /> Conectado
              </span>
            : <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)' }}>
                <WifiOff className="w-3 h-3" /> Não conectado
              </span>
          }
        </div>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {connected
            ? `${total} registros · Última sync ${lastSync ? formatDistanceToNow(new Date(lastSync), { addSuffix: true, locale: ptBR }) : '—'}`
            : 'Importe seu export.xml para dados reais de HRV, sono e FC'}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
    </button>
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
  const [wearableStatus, setWearableStatus] = useState(null)
  const [streak, setStreak] = useState(0)
  const [showBreathing, setShowBreathing] = useState(false)
  const [trend, setTrend] = useState(null)
  const { isDark, toggle: toggleTheme } = useThemeStore()

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchCurrentRisk()
    fetchRecentSignals()
    fetchSignalTypes()
    fetchDue()
    fetchHistory(null, 20)
    fetchInsights()
    api.get('/api/signals/streak').then(r => setStreak(r.data?.data?.streak ?? 0)).catch(() => {})
    api.get('/api/risk/trend').then(r => setTrend(r.data?.data ?? null)).catch(() => {})
  }, [])

  useEffect(() => {
    if (activeTab === 'overview') fetchCurrentRisk()
    if (activeTab === 'signals') {
      api.get('/api/wearables/status').then(r => setWearableStatus(r.data.data)).catch(() => {})
    }
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

          <div className="flex items-center gap-1">
            {/* Primary nav — visible on all screens */}
            <button onClick={() => navigate('/treatment')} className="btn-ghost flex items-center gap-1.5 text-sm min-h-[44px] px-2" title="Tratamento">
              <Stethoscope className="w-4 h-4" />
              <span className="hidden sm:inline">Tratamento</span>
            </button>
            <button onClick={() => navigate('/contexts')} className="btn-ghost flex items-center gap-1.5 text-sm min-h-[44px] px-2" title="Contextos">
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">Contextos</span>
            </button>

            {/* Secondary nav — hidden on mobile */}
            <button onClick={() => navigate('/prescriptions')} className="hidden sm:flex btn-ghost items-center gap-1.5 text-sm min-h-[44px] px-2">
              <ScrollText className="w-4 h-4" />
              <span className="hidden md:inline">Prescrições</span>
            </button>
            <button onClick={() => navigate('/metodologia')} className="hidden sm:flex btn-ghost items-center gap-1.5 text-sm min-h-[44px] px-2" title="Metodologia científica">
              <FlaskConical className="w-4 h-4" />
              <span className="hidden md:inline">Metodologia</span>
            </button>
            <button onClick={() => navigate('/medico')} className="hidden sm:flex btn-ghost items-center gap-1.5 text-sm min-h-[44px] px-2" style={{ color: '#818CF8' }} title="Área do médico">
              <UserCheck className="w-4 h-4" />
              <span className="hidden md:inline">Médico</span>
            </button>
            <button onClick={() => navigate('/empresa')} className="hidden sm:flex btn-ghost items-center gap-1.5 text-sm min-h-[44px] px-2" style={{ color: 'var(--jade)' }} title="Visão executiva B2B">
              <Building2 className="w-4 h-4" />
              <span className="hidden md:inline">Empresa</span>
            </button>

            {/* Theme toggle */}
            <button onClick={toggleTheme} className="btn-ghost p-2 rounded-xl min-h-[44px] min-w-[44px]" title={isDark ? 'Modo claro' : 'Modo escuro'}>
              {isDark
                ? <Sun  className="w-4 h-4" style={{ color: 'var(--attn)' }} />
                : <Moon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              }
            </button>

            <div className="w-px h-5 mx-0.5 hidden sm:block" style={{ background: 'var(--border-mid)' }} />

            <div className="text-right hidden md:block">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Olá,</p>
              <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text-pri)' }}>{user?.fullName}</p>
            </div>

            <button onClick={handleLogout} className="btn-ghost flex items-center gap-1.5 text-sm min-h-[44px] px-2">
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
                {dueCount} questionário{dueCount > 1 ? 's' : ''} pendente{dueCount > 1 ? 's' : ''}. Responda para melhorar a precisão da análise.
              </p>
            </div>
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
          </button>
        )}

        {/* Streak badge */}
        {streak > 0 && (
          <div className="mb-5 flex items-center gap-2 w-fit px-4 py-2 rounded-full"
            style={{ background: 'rgba(167,139,250,0.14)', border: '1px solid rgba(167,139,250,0.35)' }}>
            <Flame className="w-4 h-4" style={{ color: '#A78BFA', fill: '#A78BFA' }} />
            <span className="text-sm font-bold" style={{ color: '#A78BFA' }}>
              {streak} {streak === 1 ? 'dia' : 'dias'} seguidos
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· Continue assim!</span>
          </div>
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
                <>
                  <RiskCard risk={currentRisk} onWhyClick={() => setShowRiskModal(true)} />
                  {trend && trend.points >= 2 && (() => {
                    const isUp   = trend.direction === 'up'
                    const isDown = trend.direction === 'down'
                    const tColor = isUp ? 'var(--danger)' : isDown ? 'var(--stable)' : 'var(--text-muted)'
                    const tBg    = isUp ? 'var(--danger-bg)' : isDown ? 'var(--stable-bg)' : 'var(--bg-card)'
                    const tBorder= isUp ? 'rgba(239,68,68,0.25)' : isDown ? 'rgba(45,212,191,0.25)' : 'var(--border)'
                    const Icon   = isUp ? TrendingUp : isDown ? TrendingDown : Minus
                    const label  = isUp ? 'Tendência de alta' : isDown ? 'Tendência de melhora' : 'Risco estável'
                    const delta  = isUp ? `+${Math.abs(trend.slope)}` : isDown ? `−${Math.abs(trend.slope)}` : null
                    return (
                      <div className="mt-3 flex gap-3 px-4 py-3 rounded-xl items-start"
                        style={{ background: tBg, border: `1px solid ${tBorder}` }}>
                        <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: tColor }} />
                        <div>
                          <p className="text-xs font-bold" style={{ color: tColor }}>{label}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {delta && <>{delta} pts/dia nos últimos {trend.points} avaliações</>}
                            {!delta && 'Sem variação significativa recente'}
                          </p>
                          {trend.days_to_high_risk && (
                            <p className="text-xs mt-1 font-semibold" style={{ color: 'var(--danger)' }}>
                              ⚠ Pode atingir Risco Alto em ~{trend.days_to_high_risk} dias
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </>
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

            {/* Quick action cards row */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/relatorio-semanal')}
                className="text-left rounded-2xl p-4 flex items-center gap-3 transition-all"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-raised)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-card)' }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--accent-glow)' }}>
                  <BarChart2 className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--text-pri)' }}>Relatório Semanal</p>
                  <p className="text-xs mt-0.5 hidden sm:block" style={{ color: 'var(--text-muted)' }}>Análise + recomendações</p>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
              </button>

              <button
                onClick={() => setShowBreathing(true)}
                className="text-left rounded-2xl p-4 flex items-center gap-3 transition-all"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '3px solid var(--jade)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-raised)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-card)' }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(45,212,191,0.12)' }}>
                  <Wind className="w-4 h-4" style={{ color: 'var(--jade)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--text-pri)' }}>Respiração</p>
                  <p className="text-xs mt-0.5 hidden sm:block" style={{ color: 'var(--text-muted)' }}>Box breathing · 48s</p>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
              </button>

            </section>

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

            {/* Mood calendar heatmap */}
            <section>
              <MoodCalendar />
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
          <div className="animate-fade-up space-y-8">

            {/* Wearables section */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" style={{ color: 'var(--jade)' }} />
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  Dispositivos
                </p>
              </div>
              <WearableStatusCard
                status={wearableStatus}
                onConnect={() => navigate('/conectar')}
              />
              {/* Galaxy Watch — coming soon */}
              <div className="w-full rounded-2xl p-4 flex items-center gap-4 opacity-50"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--bg-raised)' }}>
                  <GalaxyWatchIcon size={20} color="var(--text-muted)" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--text-pri)' }}>Galaxy Watch</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Em breve, via Health Connect (Android)</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)' }}>Em breve</span>
              </div>
            </section>

            {/* Manual entry */}
            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Registro Manual
              </p>
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
            </section>
          </div>
        )}
      </main>

      {showRiskModal && currentRisk && (
        <RiskExplanationModal
          risk={currentRisk}
          onClose={() => setShowRiskModal(false)}
        />
      )}

      {showBreathing && (
        <BreathingExercise onClose={() => setShowBreathing(false)} />
      )}
    </div>
  )
}
