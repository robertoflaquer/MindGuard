// src/pages/WeeklyReport.jsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInsightsStore } from '../store/useInsightsStore'
import { useThemeStore } from '../store/useThemeStore'
import {
  ArrowLeft, Sun, Moon, TrendingUp, TrendingDown, AlertCircle,
  CheckCircle, Target, BookOpen, ChevronRight, Loader, Sparkles,
} from 'lucide-react'

function MindGuardLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9.5 4A2.5 2.5 0 0 1 12 6.5v11a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 4Z" fill="var(--jade)" />
      <path d="M14.5 4A2.5 2.5 0 0 0 12 6.5v11a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 4Z" fill="var(--jade)" fillOpacity="0.78" />
    </svg>
  )
}

const TYPE_META = {
  sleep:          { icon: '😴', color: '#60A5FA', label: 'Sono' },
  breathing:      { icon: '🧘', color: '#2DD4BF', label: 'Respiração' },
  questionnaire:  { icon: '📋', color: '#818CF8', label: 'Questionário' },
  professional:   { icon: '👨‍⚕️', color: '#34D399', label: 'Profissional' },
  movement:       { icon: '🚶', color: '#FB923C', label: 'Movimento' },
}

const PRIORITY_LABEL = { high: 'Alta', medium: 'Média', low: 'Baixa' }
const PRIORITY_COLOR = { high: 'var(--danger)', medium: 'var(--attn)', low: 'var(--stable)' }

export default function WeeklyReport() {
  const navigate = useNavigate()
  const { isDark, toggle: toggleTheme } = useThemeStore()
  const { recommendations, weeklyNarrative, loading, fetchInsights } = useInsightsStore()

  useEffect(() => { fetchInsights() }, [])

  const riskScore = weeklyNarrative?.risk_score
  const riskColor = riskScore != null
    ? riskScore >= 75 ? 'var(--danger)'
    : riskScore >= 60 ? '#F97316'
    : riskScore >= 30 ? 'var(--attn)'
    : 'var(--stable)'
    : 'var(--text-muted)'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-pri)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 px-5 py-3.5"
        style={{ background: 'var(--header-blur)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="btn-ghost p-2 rounded-xl">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <MindGuardLogo />
              <span className="font-bold text-sm" style={{ color: 'var(--text-pri)' }}>MindGuard</span>
            </div>
            <div className="w-px h-4 mx-1" style={{ background: 'var(--border-mid)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--jade)' }}>Relatório Semanal</span>
          </div>
          <button onClick={toggleTheme} className="btn-ghost p-2 rounded-xl">
            {isDark ? <Sun className="w-4 h-4" style={{ color: 'var(--attn)' }} /> : <Moon className="w-4 h-4" style={{ color: 'var(--accent)' }} />}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8 space-y-8">

        {loading && (
          <div className="flex items-center justify-center py-16 gap-3" style={{ color: 'var(--text-muted)' }}>
            <Loader className="w-5 h-5 animate-spin" />
            <span>Gerando seu relatório...</span>
          </div>
        )}

        {!loading && weeklyNarrative && (
          <>
            {/* Week header */}
            <section className="animate-fade-up">
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
                Sua semana
              </p>
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-pri)' }}>
                  {weeklyNarrative.period}
                </h1>
                {riskScore != null && (
                  <div className="text-right">
                    <p className="text-3xl font-extrabold tabular-nums" style={{ color: riskColor }}>{riskScore}%</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>score de risco</p>
                  </div>
                )}
              </div>
            </section>

            {/* AI Summary — sua semana em 1 frase */}
            <section className="animate-fade-up">
              <div
                className="rounded-2xl p-5 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(167,139,250,0.10) 0%, rgba(45,212,191,0.08) 100%)',
                  border: '1px solid rgba(167,139,250,0.28)',
                }}
              >
                <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full" style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.15), transparent 70%)' }} />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(167,139,250,0.18)' }}>
                      <Sparkles className="w-3.5 h-3.5" style={{ color: '#A78BFA' }} />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#A78BFA' }}>
                      Sua semana em 1 frase
                    </p>
                  </div>
                  <p className="text-base font-semibold leading-snug" style={{ color: 'var(--text-pri)' }}>
                    {weeklyNarrative.summary}
                  </p>
                </div>
              </div>
            </section>

            {/* Positives + Highlights detalhados */}
            {(weeklyNarrative.positives?.length > 0 || weeklyNarrative.highlights?.length > 0) && (
              <section className="rounded-2xl p-5 animate-fade-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                {weeklyNarrative.positives?.length > 0 && (
                  <div className="space-y-2">
                    {weeklyNarrative.positives.map((p, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--stable)' }} />
                        <span style={{ color: 'var(--text-sec)' }}>{p}</span>
                      </div>
                    ))}
                  </div>
                )}

                {weeklyNarrative.highlights?.length > 0 && (
                  <div className={`${weeklyNarrative.positives?.length > 0 ? 'mt-3' : ''} space-y-2`}>
                    {weeklyNarrative.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--attn)' }} />
                        <span style={{ color: 'var(--text-sec)' }}>{h}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Next week focus */}
            <section className="rounded-2xl p-5 animate-fade-up" style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.25)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4" style={{ color: 'var(--jade)' }} />
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--jade)' }}>Foco para a próxima semana</p>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-sec)' }}>{weeklyNarrative.next_week_focus}</p>
            </section>
          </>
        )}

        {/* Recommendations */}
        {!loading && recommendations.length > 0 && (
          <section className="space-y-3 animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Recomendações personalizadas
            </p>
            {recommendations.map((rec, i) => {
              const meta = TYPE_META[rec.type] || { icon: '✨', color: 'var(--jade)', label: '' }
              return (
                <div key={i} className="rounded-2xl p-5 space-y-3"
                  style={{ background: 'var(--bg-card)', border: `1px solid var(--border)`, borderLeft: `3px solid ${meta.color}` }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-xl leading-none mt-0.5">{meta.icon}</span>
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--text-pri)' }}>{rec.title}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-sec)' }}>{rec.reason}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-semibold"
                      style={{ background: `${PRIORITY_COLOR[rec.priority]}18`, color: PRIORITY_COLOR[rec.priority], border: `1px solid ${PRIORITY_COLOR[rec.priority]}40` }}>
                      {PRIORITY_LABEL[rec.priority]}
                    </span>
                  </div>
                  <div className="rounded-xl px-4 py-3 flex items-center gap-3"
                    style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
                    <span className="text-xs" style={{ color: 'var(--text-sec)' }}>
                      <strong style={{ color: 'var(--text-pri)' }}>Como fazer: </strong>
                      {rec.action}
                    </span>
                  </div>
                  {rec.action_type === 'questionnaire' && (
                    <button
                      onClick={() => navigate('/questionnaires')}
                      className="flex items-center gap-1.5 text-xs font-semibold"
                      style={{ color: meta.color }}
                    >
                      Ir para questionários
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {rec.action_type === 'appointment' && (
                    <button
                      onClick={() => navigate('/treatment')}
                      className="flex items-center gap-1.5 text-xs font-semibold"
                      style={{ color: meta.color }}
                    >
                      Ver especialistas
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )
            })}
          </section>
        )}

        {!loading && !weeklyNarrative && recommendations.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <p className="text-base font-semibold" style={{ color: 'var(--text-sec)' }}>Dados insuficientes para o relatório</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Registre sinais e responda questionários por pelo menos 7 dias para gerar o relatório semanal.
            </p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary mt-4">
              Ir para o Dashboard
            </button>
          </div>
        )}

        {/* Link to methodology */}
        <section className="animate-fade-up pb-4">
          <button
            onClick={() => navigate('/metodologia')}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'rgba(45,212,191,0.08)', color: 'var(--jade)', border: '1px solid rgba(45,212,191,0.2)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(45,212,191,0.14)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(45,212,191,0.08)' }}
          >
            <BookOpen className="w-4 h-4" />
            Como calculamos essas recomendações
          </button>
        </section>

      </main>
    </div>
  )
}
