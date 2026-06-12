// src/pages/MedicoView.jsx
// Doctor-facing patient summary — read-only view for clinical review
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useThemeStore } from '../store/useThemeStore'
import api from '../services/api'
import {
  ArrowLeft, Sun, Moon, Activity, Brain, Heart, Moon as MoonIcon,
  Footprints, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown,
  Minus, Stethoscope, ClipboardList, Calendar, Shield, Printer,
  Clock, User,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function MindGuardLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9.5 4A2.5 2.5 0 0 1 12 6.5v11a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 4Z" fill="var(--jade)" />
      <path d="M14.5 4A2.5 2.5 0 0 0 12 6.5v11a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 4Z" fill="var(--jade)" fillOpacity="0.78" />
    </svg>
  )
}

const Q_META = {
  PSS:           { label: 'PSS-10',   color: '#818CF8', getLevel: (s) => s <= 13 ? 'Baixo' : s <= 26 ? 'Moderado' : 'Elevado' },
  GAD7:          { label: 'GAD-7',    color: '#34D399', getLevel: (s) => s <= 4  ? 'Mínima' : s <= 9  ? 'Leve' : s <= 14 ? 'Moderada' : 'Grave' },
  CBI:           { label: 'CBI',      color: '#FB923C', getLevel: (s) => s <= 28 ? 'Baixo' : s <= 50 ? 'Moderado' : 'Elevado' },
  OLBI:          { label: 'OLBI',     color: '#C084FC', getLevel: (s) => s <= 28 ? 'Baixo' : s <= 44 ? 'Moderado' : 'Elevado' },
  DAILY_CHECKIN: { label: 'Check-in', color: '#2DD4BF', getLevel: (s) => s <= 9  ? 'Bem' : s <= 19 ? 'Moderado' : 'Difícil' },
}

const SIGNAL_META = {
  HRV:            { label: 'HRV',           unit: 'ms',  Icon: Activity,  color: '#60A5FA', ref: '>50ms ideal',  decimals: 0 },
  HR_resting:     { label: 'FC Repouso',    unit: 'bpm', Icon: Heart,     color: '#F87171', ref: '60-100 bpm',   decimals: 0 },
  sleep_duration: { label: 'Sono',          unit: 'h',   Icon: MoonIcon,  color: '#818CF8', ref: '7-9h ideal',   decimals: 1 },
  sleep_quality:  { label: 'Qualidade Sono',unit: '/10', Icon: MoonIcon,  color: '#A78BFA', ref: '≥7 ideal',     decimals: 0 },
  steps:          { label: 'Passos',        unit: '',    Icon: Footprints, color: '#34D399', ref: '>8.000/dia', decimals: 0, isInt: true },
  spo2:           { label: 'SpO₂',          unit: '%',   Icon: Activity,  color: '#2DD4BF', ref: '≥95%',         decimals: 1 },
  stress_level:   { label: 'Estresse',      unit: '/10', Icon: Brain,     color: '#FB923C', ref: '<5 ideal',     decimals: 0 },
  mood:           { label: 'Humor',         unit: '/10', Icon: Brain,     color: '#2DD4BF', ref: '>6 ideal',     decimals: 0 },
  energy_level:   { label: 'Energia',       unit: '/10', Icon: Activity,  color: '#FBBF24', ref: '>6 ideal',     decimals: 0 },
}

function formatSignal(value, meta) {
  const n = parseFloat(value)
  if (isNaN(n)) return value
  if (meta.isInt) return Math.round(n).toLocaleString('pt-BR')
  if (meta.decimals === 0) return Math.round(n).toString()
  return n.toFixed(meta.decimals)
}

const RISK_LEVEL = (score) =>
  score >= 75 ? { label: 'Alto',    color: 'var(--danger)', bg: 'var(--danger-bg)', icon: AlertTriangle } :
  score >= 60 ? { label: 'Elevado', color: '#F97316',       bg: '#F9731618',        icon: TrendingUp    } :
  score >= 30 ? { label: 'Moderado',color: 'var(--attn)',   bg: 'var(--attn-bg)',   icon: Minus         } :
                { label: 'Baixo',   color: 'var(--stable)', bg: 'var(--stable-bg)', icon: CheckCircle2  }

const SEVERITY_COLOR = {
  mild:     { label: 'Leve',     color: 'var(--attn)',   bg: 'var(--attn-bg)'   },
  moderate: { label: 'Moderado', color: '#F97316',       bg: '#F9731618'        },
  severe:   { label: 'Grave',    color: 'var(--danger)', bg: 'var(--danger-bg)' },
}

function RiskGauge({ score }) {
  if (score == null) return null
  const r   = 52
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const rl   = RISK_LEVEL(score)
  const Icon = rl.icon
  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <div className="relative w-[128px] h-[128px]">
        <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
          <circle cx="64" cy="64" r={r} strokeWidth="10" fill="none" stroke="var(--bg-raised)" />
          <circle cx="64" cy="64" r={r} strokeWidth="10" fill="none"
            stroke={rl.color} strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold tabular-nums" style={{ color: rl.color }}>{Math.round(score)}</span>
          <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>/ 100</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: rl.bg, color: rl.color }}>
        <Icon className="w-3.5 h-3.5" />
        Risco {rl.label}
      </div>
    </div>
  )
}

function Section({ title, icon: Icon, iconColor, children }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: iconColor }} />
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{title}</p>
      </div>
      {children}
    </section>
  )
}

export default function MedicoView() {
  const navigate  = useNavigate()
  const user      = useAuthStore((s) => s.user)
  const { isDark, toggle: toggleTheme } = useThemeStore()

  const [risk,     setRisk]     = useState(null)
  const [signals,  setSignals]  = useState([])
  const [qHistory, setQHistory] = useState([])
  const [contexts, setContexts] = useState([])
  const [appts,    setAppts]    = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    Promise.all([
      api.get('/api/risk/current').catch(() => ({ data: null })),
      api.get('/api/signals/recent?limit=100').catch(() => ({ data: { data: [] } })),
      api.get('/api/questionnaires/history').catch(() => ({ data: { data: [] } })),
      api.get('/api/contexts/active').catch(() => ({ data: { data: [] } })),
      api.get('/api/appointments').catch(() => ({ data: { data: [] } })),
    ]).then(([r, s, q, c, a]) => {
      setRisk(r.data?.data ?? null)
      setSignals(s.data?.data ?? [])
      setQHistory(q.data?.data ?? [])
      setContexts(c.data?.data ?? [])
      setAppts(a.data?.data ?? [])
      setLoading(false)
    })
  }, [])

  // Group signals by type — take latest per type
  const latestByType = {}
  signals.forEach((s) => {
    if (!latestByType[s.signal_type]) latestByType[s.signal_type] = s
  })

  // Compute 7-day average per signal type
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const avgAccum = {}
  signals.forEach((s) => {
    const val = parseFloat(s.value)
    if (!isNaN(val) && new Date(s.timestamp) >= sevenDaysAgo) {
      if (!avgAccum[s.signal_type]) avgAccum[s.signal_type] = { sum: 0, n: 0 }
      avgAccum[s.signal_type].sum += val
      avgAccum[s.signal_type].n++
    }
  })
  const avgByType = Object.fromEntries(
    Object.entries(avgAccum).map(([k, v]) => [k, Math.round((v.sum / v.n) * 10) / 10])
  )

  // Group questionnaire history by code — take latest per code
  const latestQ = {}
  qHistory.forEach((q) => {
    if (!latestQ[q.code]) latestQ[q.code] = q
  })

  const riskScore = risk?.risk_score ?? risk?.score ?? null

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-deep)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 py-3"
        style={{ background: 'var(--header-blur)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => {
                const isDoctor = sessionStorage.getItem('mg_doctor_mode') === '1'
                navigate(isDoctor ? '/medico/pacientes' : '/dashboard')
              }}
              className="btn-ghost p-2 rounded-xl flex-shrink-0"
              title={sessionStorage.getItem('mg_doctor_mode') === '1' ? 'Voltar para pacientes' : 'Voltar ao dashboard'}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <MindGuardLogo />
            <div className="min-w-0">
              <span className="text-sm font-bold" style={{ color: 'var(--text-pri)' }}>Área do Médico</span>
              <span className="hidden sm:inline text-xs ml-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                {sessionStorage.getItem('mg_doctor_mode') === '1' ? '· Roberto Silva · 34 anos' : '· Resumo clínico do paciente'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-1.5 btn-ghost px-3 py-2 rounded-xl text-xs font-semibold"
              style={{ color: 'var(--jade)', border: '1px solid rgba(45,212,191,0.25)' }}
            >
              <Printer className="w-3.5 h-3.5" />
              Exportar
            </button>
            <button onClick={toggleTheme} className="btn-ghost p-2 rounded-xl">
              {isDark ? <Sun className="w-4 h-4" style={{ color: 'var(--attn)' }} /> : <Moon className="w-4 h-4" style={{ color: 'var(--accent)' }} />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3" style={{ color: 'var(--text-muted)' }}>
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Carregando dados clínicos...
          </div>
        ) : (
          <>
            {/* Patient identity card */}
            <section className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
                    style={{ background: 'rgba(45,212,191,0.12)', color: 'var(--jade)', border: '1px solid rgba(45,212,191,0.25)' }}>
                    {(user?.name || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-base" style={{ color: 'var(--text-pri)', fontFamily: 'Nunito, system-ui, sans-serif' }}>
                      {user?.name || 'Paciente'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Stethoscope className="w-3 h-3" style={{ color: 'var(--jade)' }} />
                      <span className="text-xs font-medium" style={{ color: 'var(--jade)' }}>Monitoramento ativo</span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <RiskGauge score={riskScore} />
                </div>
              </div>

              {/* Risk factors */}
              {risk?.factors && (
                <div className="mt-4 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ borderTop: '1px solid var(--border)' }}>
                  {Object.entries(risk.factors).slice(0, 4).map(([key, val]) => (
                    <div key={key} className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-raised)' }}>
                      <p className="text-xs mb-1 capitalize" style={{ color: 'var(--text-muted)' }}>
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-base font-bold tabular-nums" style={{ color: 'var(--text-pri)' }}>
                        {typeof val === 'number' ? `${Math.round(val)}%` : val}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                <Clock className="w-3 h-3 inline mr-1" />
                Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                {risk?.calculated_at && (
                  <> · Risco calculado {formatDistanceToNow(new Date(risk.calculated_at), { addSuffix: true, locale: ptBR })}</>
                )}
              </p>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Questionnaire results */}
              <Section title="Questionários — Última Avaliação" icon={ClipboardList} iconColor="var(--accent)">
                <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  {Object.entries(Q_META).map(([code, meta], i) => {
                    const entry = latestQ[code]
                    const score = entry ? Number(entry.total_score) : null
                    const max   = entry ? Number(entry.max_score)   : null
                    const level = score != null ? meta.getLevel(score) : null
                    return (
                      <div
                        key={code}
                        className="flex items-center justify-between px-4 py-3"
                        style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.color }} />
                          <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-pri)' }}>{meta.label}</p>
                            {entry?.completed_at && (
                              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {formatDistanceToNow(new Date(entry.completed_at), { addSuffix: true, locale: ptBR })}
                              </p>
                            )}
                          </div>
                        </div>
                        {score != null ? (
                          <div className="text-right">
                            <p className="text-sm font-bold" style={{ color: 'var(--text-pri)' }}>
                              {score}<span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>/{max}</span>
                            </p>
                            <span className="text-xs font-semibold" style={{
                              color: level === 'Baixo' || level === 'Bem' || level === 'Mínima' ? 'var(--stable)' :
                                     level === 'Moderado' || level === 'Moderada' || level === 'Leve' ? 'var(--attn)' : 'var(--danger)',
                            }}>
                              {level}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)' }}>
                            Não respondido
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Section>

              {/* Biometric signals */}
              <Section title="Sinais Biométricos — Valores Recentes" icon={Activity} iconColor="var(--stable)">
                <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  {Object.entries(SIGNAL_META).filter(([k]) => latestByType[k]).map(([key, meta], i) => {
                    const sig  = latestByType[key]
                    const Icon = meta.Icon
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between px-4 py-3"
                        style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 flex-shrink-0" style={{ color: meta.color }} />
                          <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-pri)' }}>{meta.label}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{meta.ref}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold tabular-nums" style={{ color: meta.color }}>
                            {formatSignal(sig.value, meta)}
                            <span className="text-xs font-normal ml-0.5" style={{ color: 'var(--text-muted)' }}>{meta.unit}</span>
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {formatDistanceToNow(new Date(sig.timestamp), { addSuffix: true, locale: ptBR })}
                          </p>
                          {avgByType[key] != null && avgAccum[key]?.n > 1 && (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                              Média 7d: <span className="font-semibold" style={{ color: meta.color }}>
                                {formatSignal(avgByType[key], meta)}{meta.unit}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {Object.keys(latestByType).length === 0 && (
                    <p className="px-4 py-6 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                      Nenhum sinal registrado ainda
                    </p>
                  )}
                </div>
              </Section>

              {/* Active contexts */}
              <Section title="Contextos Ativos — Fatores de Risco" icon={Shield} iconColor="var(--attn)">
                <div className="space-y-2">
                  {contexts.length === 0 ? (
                    <div className="rounded-2xl px-4 py-5 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                      <CheckCircle2 className="w-5 h-5 mx-auto mb-2" style={{ color: 'var(--stable)' }} />
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum fator de risco contextual ativo</p>
                    </div>
                  ) : contexts.map((ctx, i) => {
                    const sev = ctx.severity ? SEVERITY_COLOR[ctx.severity] : null
                    return (
                      <div key={ctx.id || i} className="rounded-xl px-4 py-3 flex items-start gap-3"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: sev ? `3px solid ${sev.color}` : '3px solid var(--border)' }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-pri)' }}>{ctx.name}</p>
                          {ctx.notes && (
                            <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-sec)' }}>{ctx.notes}</p>
                          )}
                          {ctx.start_date && (
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                              Desde {format(new Date(ctx.start_date), 'dd/MM/yyyy')}
                              {ctx.end_date ? ` → ${format(new Date(ctx.end_date), 'dd/MM/yyyy')}` : ' · em aberto'}
                            </p>
                          )}
                        </div>
                        {sev && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                            style={{ color: sev.color, background: sev.bg }}>
                            {sev.label}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Section>

              {/* Appointments */}
              <Section title="Consultas Agendadas" icon={Calendar} iconColor="var(--accent)">
                <div className="space-y-2">
                  {appts.length === 0 ? (
                    <div className="rounded-2xl px-4 py-5 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhuma consulta agendada</p>
                    </div>
                  ) : appts.slice(0, 5).map((a, i) => (
                    <div key={a.id || i} className="rounded-xl px-4 py-3 flex items-center gap-3"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(99,102,241,0.12)' }}>
                        <User className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-pri)' }}>
                          {a.specialist_name || a.specialistName || 'Especialista'}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {a.scheduled_date || a.scheduledDate
                            ? format(new Date(a.scheduled_date || a.scheduledDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                            : 'Data a confirmar'}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{
                        background: a.status === 'confirmed' ? 'var(--stable-bg)' : 'var(--attn-bg)',
                        color:      a.status === 'confirmed' ? 'var(--stable)'    : 'var(--attn)',
                      }}>
                        {a.status === 'confirmed' ? 'Confirmada' : 'Pendente'}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            </div>

            {/* Clinical disclaimer */}
            <div className="rounded-xl px-4 py-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                <span className="font-semibold">Nota clínica:</span> Este resumo é gerado automaticamente pelo sistema MindGuard com base nos dados auto-reportados e biométricos do paciente.
                Não substitui avaliação clínica presencial. Scores de risco são indicativos e devem ser interpretados em conjunto com a anamnese completa.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
