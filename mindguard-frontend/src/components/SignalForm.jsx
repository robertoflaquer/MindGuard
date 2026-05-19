// src/components/SignalForm.jsx
import { useState, useEffect } from 'react'

const SIGNAL_LABELS = {
  HRV:            'Variabilidade Cardíaca',
  HR_resting:     'Frequência Cardíaca em Repouso',
  sleep_duration: 'Duração do Sono',
  sleep_quality:  'Qualidade do Sono',
  steps:          'Passos',
  energy_level:   'Nível de Energia',
  mood:           'Humor',
  stress_level:   'Nível de Estresse',
}

const UNIT_LABELS = {
  ms:    'ms',
  bpm:   'bpm',
  hours: 'horas',
  score: 'pontuação',
  count: 'contagem',
}

function signalLabel(name, unit) {
  const n = SIGNAL_LABELS[name] ?? name.replace(/_/g, ' ')
  const u = UNIT_LABELS[unit] ?? unit
  return `${n} (${u})`
}
import { useSignalStore } from '../store/useSignalStore'
import { useToastStore } from '../store/useToastStore'
import { AlertCircle, Send, Plus, X } from 'lucide-react'

export default function SignalForm({ onSuccess }) {
  const signalTypes    = useSignalStore((s) => s.signalTypes)
  const fetchSignalTypes = useSignalStore((s) => s.fetchSignalTypes)
  const ingestSignals  = useSignalStore((s) => s.ingestSignals)
  const isLoading      = useSignalStore((s) => s.isLoading)
  const error          = useSignalStore((s) => s.error)
  const addToast       = useToastStore((s) => s.addToast)

  const [signals, setSignals] = useState([
    { signalType: 'HRV',           value: '' },
    { signalType: 'sleep_duration', value: '' },
    { signalType: 'stress_level',   value: '' },
  ])
  const [localError, setLocalError] = useState('')

  useEffect(() => { fetchSignalTypes() }, [])

  const handleChange   = (i, field, val) => setSignals((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s))
  const addSignal      = () => setSignals((prev) => [...prev, { signalType: 'HRV', value: '' }])
  const removeSignal   = (i) => setSignals((prev) => prev.filter((_, idx) => idx !== i))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    const valid = signals.filter((s) => s.value !== '')
    if (!valid.length) { setLocalError('Registre pelo menos um sinal'); return }

    const formatted = valid.map((s) => ({
      signalType: s.signalType,
      value: parseFloat(s.value),
      timestamp: new Date().toISOString(),
    }))

    try {
      await ingestSignals(formatted)
      setSignals([
        { signalType: 'HRV',           value: '' },
        { signalType: 'sleep_duration', value: '' },
        { signalType: 'stress_level',   value: '' },
      ])
      onSuccess()
    } catch (err) {
      const msg = error || err?.message || 'Erro ao enviar sinais'
      setLocalError(msg)
      addToast('error', msg)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6">
      {localError && (
        <div className="p-3.5 rounded-xl flex items-center gap-3 text-sm" style={{ background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.22)', color: 'var(--danger)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {localError}
        </div>
      )}

      <div className="space-y-3">
        {signals.map((signal, i) => (
          <div key={i} className="flex gap-3 items-end">
            <div className="flex-1">
              {i === 0 && <label className="label">Tipo de Sinal</label>}
              <select
                value={signal.signalType}
                onChange={(e) => handleChange(i, 'signalType', e.target.value)}
                className="input-field"
              >
                {signalTypes.map((t) => (
                  <option key={t.id} value={t.name}>{signalLabel(t.name, t.unit)}</option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              {i === 0 && <label className="label">Valor</label>}
              <input
                type="number"
                step="0.1"
                value={signal.value}
                onChange={(e) => handleChange(i, 'value', e.target.value)}
                className="input-field"
                placeholder="—"
              />
            </div>

            {signals.length > 1 && (
              <button
                type="button"
                onClick={() => removeSignal(i)}
                className="p-2.5 rounded-xl transition-all duration-150 flex-shrink-0"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addSignal}
        className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
        style={{ color: 'var(--jade)' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#25bfac'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--jade)'; }}
      >
        <Plus className="w-4 h-4" />
        Adicionar sinal
      </button>

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold"
      >
        <Send className="w-4 h-4" />
        {isLoading ? 'Enviando...' : 'Registrar Sinais'}
      </button>
    </form>
  )
}
