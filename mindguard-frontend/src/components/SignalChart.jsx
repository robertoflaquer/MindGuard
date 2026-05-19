// src/components/SignalChart.jsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const SIGNAL_META = {
  HRV:            { label: 'Variabilidade Cardíaca', unit: 'ms',    color: '#A78BFA' },
  HR_resting:     { label: 'FC Repouso',              unit: 'bpm',   color: '#F87171' },
  sleep_duration: { label: 'Sono',                    unit: 'h',     color: '#60A5FA' },
  sleep_quality:  { label: 'Qualidade do Sono',       unit: '/100',  color: '#34D399' },
  stress_level:   { label: 'Estresse',                unit: '/10',   color: '#FBBF24' },
  energy_level:   { label: 'Energia',                 unit: '/10',   color: '#22D3EE' },
  mood:           { label: 'Humor',                   unit: '/10',   color: '#F472B6' },
  steps:          { label: 'Passos',                  unit: '',      color: '#818CF8' },
}

function fmt(ts) {
  const d = new Date(ts)
  if (isToday(d))     return `Hoje ${format(d, 'HH:mm')}`
  if (isYesterday(d)) return `Ontem ${format(d, 'HH:mm')}`
  return format(d, 'dd/MM HH:mm', { locale: ptBR })
}

function SparkTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="px-2.5 py-1.5 rounded-lg text-xs" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-mid)' }}>
      <p style={{ color: 'var(--text-muted)' }}>{fmt(p.ts)}</p>
      <p className="font-semibold" style={{ color: 'var(--text-pri)' }}>{p.value}</p>
    </div>
  )
}

function SignalCard({ signalType, dataPoints }) {
  const meta   = SIGNAL_META[signalType] ?? { label: signalType, unit: '', color: '#6B7280' }
  if (!dataPoints.length) return null

  const sorted = [...dataPoints].sort((a, b) => a.ts - b.ts)
  const latest = sorted[sorted.length - 1]
  const prev   = sorted.length > 1 ? sorted[sorted.length - 2] : null
  const diff   = prev ? latest.value - prev.value : null
  const diffStr = diff !== null ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}` : null
  const diffColor = diff === null ? 'var(--text-muted)' : diff > 0 ? 'var(--stable)' : diff < 0 ? 'var(--danger)' : 'var(--text-muted)'

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2 transition-colors"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderTop: `2px solid ${meta.color}`,
      }}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {meta.label}
        </p>
        {diffStr && (
          <span className="text-xs font-semibold" style={{ color: diffColor }}>{diffStr}</span>
        )}
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text-pri)' }}>
          {parseFloat(latest.value).toFixed(1)}
        </span>
        {meta.unit && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{meta.unit}</span>
        )}
      </div>

      {sorted.length >= 2 && (
        <ResponsiveContainer width="100%" height={50}>
          <LineChart data={sorted} margin={{ top: 2, right: 2, left: 0, bottom: 0 }}>
            <Line type="monotone" dataKey="value" stroke={meta.color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
            <XAxis dataKey="ts" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip content={<SparkTooltip />} />
          </LineChart>
        </ResponsiveContainer>
      )}

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{fmt(latest.ts)}</p>
    </div>
  )
}

export default function SignalChart({ signals }) {
  if (!signals?.length) return null

  const byType = {}
  signals.forEach((s) => {
    if (!byType[s.signal_type]) byType[s.signal_type] = []
    byType[s.signal_type].push({ ts: new Date(s.timestamp).getTime(), value: parseFloat(s.value) })
  })

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
        Sinais Recentes
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Object.entries(byType).map(([type, pts]) => (
          <SignalCard key={type} signalType={type} dataPoints={pts} />
        ))}
      </div>
    </div>
  )
}
