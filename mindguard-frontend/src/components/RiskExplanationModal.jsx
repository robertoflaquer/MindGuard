// src/components/RiskExplanationModal.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, TrendingDown, TrendingUp, Minus, BookOpen, Loader } from 'lucide-react'
import api from '../services/api'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const Q_COLORS = {
  PSS:  '#818CF8',
  GAD7: '#34D399',
  CBI:  '#FB923C',
  OLBI: '#C084FC',
}

const Q_LABELS = {
  PSS:  'PSS-10',
  GAD7: 'GAD-7',
  CBI:  'CBI',
  OLBI: 'OLBI',
}

function Bar({ value, max = 100, color, height = 8 }) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100)
  return (
    <div className="rounded-full overflow-hidden" style={{ height, background: 'var(--border)' }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}

function SignalRow({ signal }) {
  const isUp   = signal.direction === 'up'
  const isDown = signal.direction === 'down'
  const isBad  = signal.is_bad
  const pct    = signal.percent_change
  const Icon   = isUp ? TrendingUp : isDown ? TrendingDown : Minus
  const color  = isBad ? 'var(--danger)' : signal.is_significant ? 'var(--stable)' : 'var(--text-muted)'

  return (
    <div className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: 'var(--text-pri)' }}>
          {signal.display_name}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Atual: <strong>{signal.current_value}</strong> · Ref: {signal.baseline_value}
        </p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-xs font-bold tabular-nums" style={{ color }}>
          {pct > 0 ? '+' : ''}{pct}%
        </span>
      </div>
    </div>
  )
}

export default function RiskExplanationModal({ risk, onClose }) {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    api.get('/api/risk/breakdown').then(res => {
      if (mounted) { setData(res.data.data); setLoading(false) }
    }).catch(() => {
      if (mounted) setLoading(false)
    })
    return () => { mounted = false }
  }, [])

  // Close on backdrop click
  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
  }

  const riskScore = Math.round(risk?.risk_score || 0)
  const riskColor = riskScore >= 75 ? 'var(--danger)' : riskScore >= 60 ? '#F97316' : riskScore >= 30 ? 'var(--attn)' : 'var(--stable)'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdrop}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-5 py-4" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Análise de Risco</p>
            <h2 className="text-base font-bold mt-0.5" style={{ color: 'var(--text-pri)' }}>Por que {riskScore}% de risco?</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-xl">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-6">
          {/* Score decomposition */}
          <section className="rounded-xl p-4 space-y-4" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Como foi calculado</p>

            {/* Q 70% */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span style={{ color: '#818CF8' }}>
                  <strong style={{ color: 'var(--text-pri)' }}>Questionários Clínicos</strong> (70% do score)
                </span>
                {data?.questionnaire_score != null && (
                  <span className="font-bold tabular-nums" style={{ color: '#818CF8' }}>{data.questionnaire_score}%</span>
                )}
              </div>
              <Bar value={data?.questionnaire_score ?? 0} color="#818CF8" height={10} />
            </div>

            {/* S 30% */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span style={{ color: '#2DD4BF' }}>
                  <strong style={{ color: 'var(--text-pri)' }}>Sinais Biométricos</strong> (30% do score)
                </span>
              </div>
              <Bar value={data?.signal_deviations?.filter(s => s.is_bad).length > 0 ? Math.min(data.signal_deviations.filter(s=>s.is_bad).length * 25, 85) : 20} color="#2DD4BF" height={10} />
            </div>

            {/* Context */}
            {data?.active_contexts?.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(249,115,22,0.15)', color: '#F97316', border: '1px solid rgba(249,115,22,0.3)' }}>
                  +{data.active_contexts.length} contexto{data.active_contexts.length > 1 ? 's' : ''} ativo{data.active_contexts.length > 1 ? 's' : ''} amplificando o risco
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Score final</span>
              <span className="text-2xl font-extrabold tabular-nums" style={{ color: riskColor }}>{riskScore}%</span>
            </div>
          </section>

          {loading && (
            <div className="flex items-center justify-center py-8 gap-2" style={{ color: 'var(--text-muted)' }}>
              <Loader className="w-4 h-4 animate-spin" />
              <span className="text-sm">Carregando detalhes...</span>
            </div>
          )}

          {/* Questionnaire details */}
          {!loading && data?.questionnaire_details?.length > 0 && (
            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Questionários</p>
              <div className="space-y-3">
                {data.questionnaire_details.map((q) => {
                  const color = Q_COLORS[q.code] || '#818CF8'
                  return (
                    <div key={q.code} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold" style={{ color }}>{Q_LABELS[q.code] || q.code}</span>
                        <span style={{ color: 'var(--text-sec)' }}>
                          <strong style={{ color: 'var(--text-pri)' }}>{q.score}</strong>/{q.max_score}
                          {q.completed_at && (
                            <span className="ml-1.5" style={{ color: 'var(--text-muted)' }}>
                              · {formatDistanceToNow(new Date(q.completed_at), { addSuffix: true, locale: ptBR })}
                            </span>
                          )}
                        </span>
                      </div>
                      <Bar value={q.score} max={q.max_score} color={color} height={8} />
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Signal deviations */}
          {!loading && data?.signal_deviations?.length > 0 && (
            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Sinais: atual vs referência (7 dias)
              </p>
              <div>
                {data.signal_deviations.map((s) => <SignalRow key={s.name} signal={s} />)}
              </div>
              <p className="text-xs pt-1" style={{ color: 'var(--text-muted)' }}>
                Referência = média dos 7–21 dias anteriores. Desvio ≥ 15% é considerado significativo.
              </p>
            </section>
          )}

          {/* Active contexts */}
          {!loading && data?.active_contexts?.length > 0 && (
            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Contextos Ativos</p>
              <div className="flex flex-wrap gap-2">
                {data.active_contexts.map((c, i) => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-full font-medium"
                    style={{ background: 'rgba(249,115,22,0.12)', color: '#F97316', border: '1px solid rgba(249,115,22,0.25)' }}>
                    {c.name} · {c.severity}
                  </span>
                ))}
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Contextos ajustam os pesos dos sinais para evitar falsos alertas em situações esperadas.
              </p>
            </section>
          )}

          {/* No data fallback */}
          {!loading && !data?.questionnaire_details?.length && !data?.signal_deviations?.length && (
            <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
              Continue registrando dados para ver a decomposição detalhada do seu risco.
            </p>
          )}

          {/* Link to methodology */}
          <button
            onClick={() => { onClose(); navigate('/metodologia') }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'rgba(45,212,191,0.1)', color: 'var(--jade)', border: '1px solid rgba(45,212,191,0.25)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(45,212,191,0.18)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(45,212,191,0.1)' }}
          >
            <BookOpen className="w-4 h-4" />
            Ver metodologia científica completa
          </button>
        </div>
      </div>
    </div>
  )
}
