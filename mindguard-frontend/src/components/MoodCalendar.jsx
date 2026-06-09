// src/components/MoodCalendar.jsx
// 90-day GitHub-style heatmap using daily risk scores
import { useEffect, useState } from 'react'
import api from '../services/api'
import { format, subDays, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function scoreColor(score) {
  if (score == null) return 'var(--bg-raised)'
  if (score >= 75) return '#EF4444'
  if (score >= 60) return '#F97316'
  if (score >= 30) return '#FBBF24'
  return '#34D399'
}

function scoreLabel(score) {
  if (score == null) return 'Sem dados'
  if (score >= 75) return `Risco Alto (${score}%)`
  if (score >= 60) return `Risco Elevado (${score}%)`
  if (score >= 30) return `Moderado (${score}%)`
  return `Baixo (${score}%)`
}

export default function MoodCalendar() {
  const [history, setHistory] = useState([])
  const [tooltip, setTooltip] = useState(null)

  useEffect(() => {
    api.get('/api/risk/history?days=90&limit=200').then(r => {
      setHistory(r.data?.data ?? [])
    }).catch(() => {})
  }, [])

  // Build date → latest score map
  const byDay = {}
  history.forEach((h) => {
    const day = (h.assessment_date || h.assessment_timestamp || '').slice(0, 10)
    if (!day) return
    if (!byDay[day] || byDay[day].score < h.risk_score) {
      byDay[day] = { score: h.risk_score, level: h.risk_level }
    }
  })

  // Build 90-day grid (newest first, then reverse for display)
  const days = Array.from({ length: 90 }, (_, i) => {
    const d = subDays(startOfDay(new Date()), 89 - i)
    const key = format(d, 'yyyy-MM-dd')
    return { key, date: d, ...byDay[key] }
  })

  // Split into weeks of 7 for display
  const weeks = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  const hasAnyData = Object.keys(byDay).length > 0

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Histórico 90 dias
        </p>
        <div className="flex items-center gap-1.5">
          {[['Baixo', '#34D399'], ['Moderado', '#FBBF24'], ['Elevado', '#F97316'], ['Alto', '#EF4444']].map(([l, c]) => (
            <div key={l} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
              <span className="text-xs hidden sm:inline" style={{ color: 'var(--text-muted)' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {!hasAnyData ? (
        <div className="rounded-xl px-4 py-5 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Sem histórico de risco ainda. Responda questionários e registre sinais para visualizar aqui.
          </p>
        </div>
      ) : (
        <div className="rounded-xl p-3 relative overflow-x-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex gap-1 min-w-max">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day) => (
                  <div
                    key={day.key}
                    className="w-3.5 h-3.5 rounded-sm cursor-default transition-transform hover:scale-125"
                    style={{ background: scoreColor(day.score) }}
                    title={`${format(day.date, 'dd/MM', { locale: ptBR })} · ${scoreLabel(day.score)}`}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setTooltip({ x: rect.left, y: rect.top, day })
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Month labels */}
          <div className="flex gap-1 mt-1.5 min-w-max">
            {weeks.map((week, wi) => {
              const d = week[0]?.date
              const isFirstOfMonth = d && d.getDate() <= 7
              return (
                <div key={wi} className="w-3.5 text-center">
                  {isFirstOfMonth && (
                    <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                      {format(d, 'MMM', { locale: ptBR })}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-2.5 py-1.5 rounded-lg pointer-events-none text-xs font-semibold"
          style={{
            top: tooltip.y - 40,
            left: tooltip.x,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: scoreColor(tooltip.day.score),
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          {format(tooltip.day.date, "dd 'de' MMM", { locale: ptBR })} · {scoreLabel(tooltip.day.score)}
        </div>
      )}
    </div>
  )
}
