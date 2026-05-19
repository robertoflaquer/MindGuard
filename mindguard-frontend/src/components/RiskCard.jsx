// src/components/RiskCard.jsx
import { AlertTriangle, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const LEVEL_CONFIG = {
  stable:        { color: 'var(--stable)',  bg: 'var(--stable-bg)',  label: 'Estável',       icon: CheckCircle  },
  attention:     { color: 'var(--attn)',    bg: 'var(--attn-bg)',    label: 'Atenção',        icon: AlertCircle  },
  elevated_risk: { color: 'var(--elev)',    bg: 'var(--elev-bg)',    label: 'Risco Elevado',  icon: AlertCircle  },
  high_risk:     { color: 'var(--danger)',  bg: 'var(--danger-bg)',  label: 'Risco Alto',     icon: AlertTriangle},
}

const ACTION_NAMES = {
  'Breathing Exercise':       'Exercício de Respiração',
  'Short Meditation':         'Meditação Curta',
  'Nature Walk':              'Caminhada na Natureza',
  'Sleep Hygiene':            'Higiene do Sono',
  'Light Exercise':           'Exercício Leve',
  'Journaling':               'Escrita Terapêutica',
  'Social Connection':        'Conexão Social',
  'Psychologist Consultation':'Consulta com Psicólogo',
  'Psychiatrist Consultation':'Consulta com Psiquiatra',
  'Wellness Coach':           'Coach de Bem-Estar',
  'Emergency Support':        'Suporte de Emergência',
}

const ACTION_INSTRUCTIONS = {
  'Breathe in for 4, hold 4, exhale 6': 'Inspire por 4s, segure 4s, expire por 6s. Repita 5 vezes.',
  'Find a quiet place. Focus on breath for 10 minutes.': 'Encontre um lugar tranquilo. Foque na respiração por 10 minutos.',
  'Walk outdoors for at least 20 minutes.': 'Caminhe ao ar livre por pelo menos 20 minutos.',
  'Avoid screens 1h before bed. Sleep and wake at the same time.': 'Evite telas 1h antes de dormir. Durma e acorde no mesmo horário.',
  'Yoga, stretching or light walk for 30 minutes.': 'Yoga, alongamento ou caminhada leve por 30 minutos.',
  'Write about your feelings and thoughts for 15 minutes.': 'Escreva sobre seus sentimentos e pensamentos por 15 minutos.',
  'Contact someone close. Talk or meet.': 'Entre em contato com alguém próximo. Converse ou se encontre.',
}

const RADIUS = 54
const CIRC   = 2 * Math.PI * RADIUS  // ≈ 339.3

function GaugeRing({ pct, color }) {
  const clamped = Math.min(Math.max(pct, 0), 100)
  const offset  = CIRC * (1 - clamped / 100)
  return (
    <svg width="132" height="132" viewBox="0 0 132 132" style={{ transform: 'rotate(-90deg)', display: 'block' }}>
      {/* Track */}
      <circle cx="66" cy="66" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
      {/* Progress */}
      <circle
        cx="66" cy="66" r={RADIUS}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1), stroke 0.4s ease' }}
      />
    </svg>
  )
}

function RiskCardSkeleton() {
  return (
    <div className="card animate-pulse-dark">
      <div className="flex gap-6 items-center">
        <div className="w-32 h-32 rounded-full flex-shrink-0" style={{ background: 'var(--bg-raised)' }} />
        <div className="flex-1 space-y-3">
          <div className="h-5 rounded-lg w-36" style={{ background: 'var(--bg-raised)' }} />
          <div className="h-3 rounded-lg w-full" style={{ background: 'var(--bg-raised)' }} />
          <div className="h-3 rounded-lg w-3/4" style={{ background: 'var(--bg-raised)' }} />
          <div className="h-3 rounded-lg w-1/2" style={{ background: 'var(--bg-raised)' }} />
        </div>
      </div>
      <p className="text-xs text-center mt-5" style={{ color: 'var(--text-muted)' }}>Calculando risco...</p>
    </div>
  )
}

export default function RiskCard({ risk, isLoading }) {
  if (isLoading) return <RiskCardSkeleton />
  if (!risk) return null

  const level  = risk.risk_level || 'stable'
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.stable
  const Icon   = config.icon
  const pct    = Math.round(risk.risk_score || 0)
  const conf   = Math.round((risk.confidence_level || 0) * 100)

  const actionName  = risk.recommended_action   ? (ACTION_NAMES[risk.recommended_action]         ?? risk.recommended_action)   : null
  const actionInstr = risk.action_instructions  ? (ACTION_INSTRUCTIONS[risk.action_instructions] ?? risk.action_instructions)  : null
  const factors     = Array.isArray(risk.secondary_factors) ? risk.secondary_factors : []
  const updatedAt   = risk.assessment_timestamp || risk.assessment_date

  return (
    <div className="card animate-fade-up">
      <div className="flex gap-6 items-center">
        {/* Circular gauge */}
        <div className="relative flex-shrink-0" style={{ width: 132, height: 132 }}>
          <GaugeRing pct={pct} color={config.color} />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span className="text-2xl font-bold tabular-nums" style={{ color: config.color }}>{pct}%</span>
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>risco</span>
          </div>
        </div>

        {/* Info panel */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: config.bg, color: config.color }}>
              <Icon className="w-3.5 h-3.5" />
              {config.label}
            </span>
            {risk.requires_professional_review && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                <AlertTriangle className="w-3 h-3" />
                Revisão profissional
              </span>
            )}
          </div>

          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-sec)' }}>{risk.primary_explanation}</p>

          <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
            Confiança: {conf}%
          </p>

          {factors.length > 0 && (
            <div className="mt-3 space-y-1">
              {factors.map((f, i) => (
                <p key={i} className="text-xs flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                  <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: 'var(--text-muted)' }} />
                  {f}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recommended action */}
      {actionName && (
        <div className="mt-5 p-4 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--jade)' }}>
            Ação Recomendada
          </p>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-pri)' }}>{actionName}</p>
          {actionInstr && <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-sec)' }}>{actionInstr}</p>}
          {risk.action_duration && (
            <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <Clock className="w-3 h-3" />
              {risk.action_duration} min
            </p>
          )}
        </div>
      )}

      {updatedAt && (
        <p className="text-xs mt-4 text-right" style={{ color: 'var(--text-muted)' }}>
          Avaliado {formatDistanceToNow(new Date(updatedAt), { addSuffix: true, locale: ptBR })}
        </p>
      )}
    </div>
  )
}
