// src/pages/Questionnaires.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useQuestionnaireStore } from '../store/useQuestionnaireStore'
import { useRiskStore } from '../store/useRiskStore'
import { ArrowLeft, Clock, CheckCircle, ChevronRight, Sun, Moon } from 'lucide-react'
import { useThemeStore } from '../store/useThemeStore'
import PSSForm from '../components/PSSForm'
import CBIForm from '../components/CBIForm'
import OLBIForm from '../components/OLBIForm'
import DailyCheckinForm from '../components/DailyCheckinForm'
import GAD7Form from '../components/GAD7Form'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function MindGuardLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 34 34" fill="none" aria-hidden>
      <path d="M17 30C9 26 5 19.5 5 13a6 6 0 0 1 12-1 6 6 0 0 1 12 1c0 6.5-4 13.5-12 17z" fill="var(--jade)" opacity="0.9" />
      <path d="M9 17h4l2-4.5 4.5 9 2.5-4.5H26" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const Q_META = {
  PSS:           { shortName: 'PSS-10',   color: '#818CF8' },
  DAILY_CHECKIN: { shortName: 'Check-in', color: '#2DD4BF' },
  CBI:           { shortName: 'CBI',      color: '#FB923C' },
  OLBI:          { shortName: 'OLBI',     color: '#C084FC' },
  GAD7:          { shortName: 'GAD-7',    color: '#F87171' },
}

const IMPLEMENTED = new Set(['PSS', 'CBI', 'OLBI', 'DAILY_CHECKIN', 'GAD7'])

function getLevelInfo(code, score) {
  if (code === 'PSS')           return score <= 13 ? { text: 'Baixo',    clr: 'var(--stable)' } : score <= 26 ? { text: 'Moderado', clr: 'var(--attn)' } : { text: 'Elevado',  clr: 'var(--danger)' }
  if (code === 'CBI')           return score <= 28 ? { text: 'Baixo',    clr: 'var(--stable)' } : score <= 50 ? { text: 'Moderado', clr: 'var(--elev)'  } : { text: 'Elevado',  clr: 'var(--danger)' }
  if (code === 'OLBI')          return score <= 28 ? { text: 'Baixo',    clr: 'var(--stable)' } : score <= 44 ? { text: 'Moderado', clr: 'var(--elev)'  } : { text: 'Elevado',  clr: 'var(--danger)' }
  if (code === 'DAILY_CHECKIN') return score <= 9  ? { text: 'Bem',      clr: 'var(--stable)' } : score <= 19 ? { text: 'Moderado', clr: 'var(--attn)'  } : { text: 'Difícil',  clr: 'var(--danger)' }
  const pct = score
  return pct <= 40 ? { text: 'Baixo', clr: 'var(--stable)' } : pct <= 70 ? { text: 'Moderado', clr: 'var(--attn)' } : { text: 'Elevado', clr: 'var(--danger)' }
}

export default function Questionnaires() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { due, history, fetchDue, fetchHistory, submitQuestionnaire } = useQuestionnaireStore()
  const fetchCurrentRisk = useRiskStore((s) => s.fetchCurrentRisk)
  const [active, setActive] = useState(null)
  const { isDark, toggle: toggleTheme } = useThemeStore()

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchDue()
    fetchHistory()
  }, [])

  async function handleSubmit(code, answers) {
    const responses = Object.fromEntries(Object.entries(answers).map(([k, v]) => [String(k), v]))
    const result = await submitQuestionnaire(code, responses)
    setTimeout(() => fetchCurrentRisk(), 4000)
    setActive(null)
    fetchDue()
    fetchHistory(code, 5)
    return result
  }

  const FORM_META = {
    PSS:           { title: 'PSS-10',   subtitle: 'Escala de Percepção de Estresse', Form: PSSForm },
    CBI:           { title: 'CBI',      subtitle: 'Copenhagen Burnout Inventory',     Form: CBIForm },
    OLBI:          { title: 'OLBI',     subtitle: 'Oldenburg Burnout Inventory',      Form: OLBIForm },
    DAILY_CHECKIN: { title: 'Check-in', subtitle: 'Avaliação rápida de hoje',          Form: DailyCheckinForm },
    GAD7:          { title: 'GAD-7',    subtitle: 'Escala de Transtorno de Ansiedade', Form: GAD7Form },
  }

  const dueItems = due.filter((q) => q.is_due)
  const upToDate = due.filter((q) => !q.is_due)

  /* ── Form view ──────────────────────────────────── */
  if (active && FORM_META[active]) {
    const { title, subtitle, Form } = FORM_META[active]
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-deep)' }}>
        <header className="sticky top-0 z-30" style={{ background: 'var(--header-blur)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-4">
            <button
              onClick={() => setActive(null)}
              className="p-2 rounded-xl transition-colors"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-card)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-pri)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1">
              <h1 className="font-bold text-sm" style={{ color: 'var(--text-pri)' }}>{title}</h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
            </div>
            <button onClick={toggleTheme} className="btn-ghost p-2 rounded-xl" title={isDark ? 'Modo claro' : 'Modo escuro'}>
              {isDark ? <Sun className="w-4 h-4" style={{ color: 'var(--attn)' }} /> : <Moon className="w-4 h-4" style={{ color: 'var(--accent)' }} />}
            </button>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-5 py-6">
          <Form onSuccess={(answers) => handleSubmit(active, answers)} />
        </main>
      </div>
    )
  }

  /* ── List view ──────────────────────────────────── */
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-deep)' }}>
      <header className="sticky top-0 z-30" style={{ background: 'var(--header-blur)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl transition-colors"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-card)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-pri)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5 flex-1">
            <MindGuardLogo />
            <h1 className="text-base font-bold" style={{ fontFamily: 'Nunito, system-ui, sans-serif', fontWeight: 800, color: 'var(--text-pri)' }}>
              Questionários
            </h1>
          </div>
          <button onClick={toggleTheme} className="btn-ghost p-2 rounded-xl" title={isDark ? 'Modo claro' : 'Modo escuro'}>
            {isDark ? <Sun className="w-4 h-4" style={{ color: 'var(--attn)' }} /> : <Moon className="w-4 h-4" style={{ color: 'var(--accent)' }} />}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8 space-y-8">

        {/* Pending */}
        {dueItems.length > 0 && (
          <section>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <Clock className="w-3.5 h-3.5" style={{ color: 'var(--attn)' }} />
              Pendentes ({dueItems.length})
            </p>
            <div className="space-y-3">
              {dueItems.map((q) => {
                const meta   = Q_META[q.code] ?? { shortName: q.code, color: '#6B7280' }
                const isReady = IMPLEMENTED.has(q.code)
                return (
                  <div
                    key={q.id}
                    className="rounded-xl p-4 flex items-center justify-between"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${meta.color}` }}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: meta.color, background: `${meta.color}1A` }}>
                          {meta.shortName}
                        </span>
                        {!q.last_completed && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--attn-bg)', color: 'var(--attn)' }}>
                            Nunca respondido
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-pri)' }}>{q.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {q.question_count} perguntas · A cada {q.frequency_days} dia{q.frequency_days > 1 ? 's' : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => isReady && setActive(q.code)}
                      disabled={!isReady}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={isReady
                        ? { background: meta.color, color: '#060C16' }
                        : { background: 'var(--bg-raised)', color: 'var(--text-muted)', cursor: 'not-allowed' }
                      }
                    >
                      {isReady ? 'Iniciar' : 'Em breve'}
                      {isReady && <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Up to date */}
        {upToDate.length > 0 && (
          <section>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <CheckCircle className="w-3.5 h-3.5" style={{ color: 'var(--stable)' }} />
              Em dia
            </p>
            <div className="space-y-3">
              {upToDate.map((q) => {
                const meta = Q_META[q.code] ?? { shortName: q.code, color: '#6B7280' }
                return (
                  <div
                    key={q.id}
                    className="rounded-xl p-4 flex items-center justify-between opacity-60"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: meta.color, background: `${meta.color}1A` }}>
                          {meta.shortName}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--stable-bg)', color: 'var(--stable)' }}>
                          Concluído
                        </span>
                      </div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-pri)' }}>{q.name}</p>
                      {q.last_completed && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          Respondido {formatDistanceToNow(new Date(q.last_completed), { addSuffix: true, locale: ptBR })}
                        </p>
                      )}
                      {q.next_due_at && (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Próximo: {format(new Date(q.next_due_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                    <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--stable)' }} />
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* History */}
        {history.length > 0 && (
          <section>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Histórico</p>
            <div className="space-y-2">
              {history.map((h) => {
                const score = Number(h.total_score)
                const max   = Number(h.max_score)
                const pct   = Math.round((score / max) * 100)
                const meta  = Q_META[h.code] ?? { shortName: h.code, color: '#6B7280' }
                const lv    = getLevelInfo(h.code, score)
                return (
                  <div key={h.id} className="rounded-xl p-3.5 flex items-center justify-between" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: meta.color, background: `${meta.color}1A` }}>
                          {meta.shortName}
                        </span>
                        <span className="text-xs font-semibold" style={{ color: lv.clr }}>{lv.text}</span>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-pri)' }}>
                        {score}<span className="font-normal" style={{ color: 'var(--text-muted)' }}>/{max}</span>
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {format(new Date(h.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="w-20">
                      <div className="rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--bg-raised)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: lv.clr }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {due.length === 0 && history.length === 0 && (
          <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Carregando questionários...</p>
          </div>
        )}
      </main>
    </div>
  )
}
