// src/components/DailyCheckinForm.jsx
import { useState } from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'

const QUESTIONS = [
  { id: 1, label: 'Como está seu humor hoje?',         lowLabel: 'Muito mal',  highLabel: 'Excelente', reverse: true  },
  { id: 2, label: 'Como está seu nível de energia?',   lowLabel: 'Muito baixo',highLabel: 'Muito alto', reverse: true  },
  { id: 3, label: 'Qual é o seu nível de estresse?',   lowLabel: 'Nenhum',     highLabel: 'Extremo',   reverse: false },
]

function riskColor(value, reverse) {
  const r = reverse ? (10 - value) / 10 : value / 10
  if (r <= 0.35) return { bg: 'var(--stable)',  text: '#060C16' }
  if (r <= 0.65) return { bg: 'var(--attn)',    text: '#060C16' }
  return             { bg: 'var(--danger)',  text: '#fff'    }
}

export default function DailyCheckinForm({ onSuccess }) {
  const [answers,     setAnswers]     = useState({})
  const [submitting,  setSubmitting]  = useState(false)
  const [result,      setResult]      = useState(null)
  const [savedAnswers,setSavedAnswers] = useState({})
  const [error,       setError]       = useState('')

  const answered    = Object.keys(answers).length
  const allAnswered = answered === QUESTIONS.length

  function handleSelect(qId, value) {
    setAnswers((p) => ({ ...p, [qId]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!allAnswered) { setError('Responda todas as perguntas antes de continuar.'); return }
    setError('')
    setSubmitting(true)
    try {
      const data = await onSuccess(answers)
      setSavedAnswers({ ...answers })
      setResult(data)
    } catch {
      setError('Erro ao enviar. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return <DailyCheckinResult result={result} answers={savedAnswers} onReset={() => { setResult(null); setAnswers({}); setSavedAnswers({}) }} />
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header card */}
      <div className="rounded-xl p-4" style={{ background: 'var(--jade-glow)', border: '1px solid rgba(45,212,191,0.2)' }}>
        <h2 className="font-bold text-base" style={{ fontFamily: 'Nunito, system-ui, sans-serif', fontWeight: 800, color: 'var(--jade)' }}>Check-in Diário</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-sec)' }}>3 perguntas rápidas sobre como você está agora.</p>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 rounded-full h-1.5" style={{ background: 'rgba(45,212,191,0.2)' }}>
            <div className="h-1.5 rounded-full transition-all" style={{ width: `${(answered / QUESTIONS.length) * 100}%`, background: 'var(--jade)' }} />
          </div>
          <span className="text-xs font-semibold" style={{ color: 'var(--jade)' }}>{answered}/{QUESTIONS.length}</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl text-sm" style={{ background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.22)', color: 'var(--danger)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        {QUESTIONS.map((q) => {
          const selected = answers[q.id]
          return (
            <div
              key={q.id}
              className="rounded-xl p-4 transition-colors"
              style={
                selected !== undefined
                  ? { background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.25)' }
                  : { background: 'var(--bg-card)', border: '1px solid var(--border)' }
              }
            >
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-pri)' }}>
                <span className="font-bold mr-2" style={{ color: 'var(--jade)' }}>{q.id}.</span>
                {q.label}
              </p>

              <div className="flex gap-1">
                {Array.from({ length: 11 }, (_, i) => {
                  const isSelected = selected === i
                  const { bg, text } = riskColor(i, q.reverse)
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelect(q.id, i)}
                      className="flex-1 h-9 rounded-lg text-xs font-semibold transition-all"
                      style={
                        isSelected
                          ? { background: bg, color: text, border: `1px solid ${bg}` }
                          : { background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                      }
                    >
                      {i}
                    </button>
                  )
                })}
              </div>

              <div className="flex justify-between mt-1.5">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{q.lowLabel}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{q.highLabel}</span>
              </div>
            </div>
          )
        })}
      </div>

      <button type="submit" disabled={!allAnswered || submitting} className="btn-primary w-full py-3 text-sm font-semibold">
        {submitting ? 'Registrando...' : 'Registrar Check-in'}
      </button>
    </form>
  )
}

function DailyCheckinResult({ result, answers, onReset }) {
  const { totalScore, maxScore } = result
  const pct = Math.round((totalScore / maxScore) * 100)

  let levelText, levelColor, advice
  if (totalScore <= 9) {
    levelText  = 'Você está bem!'
    levelColor = 'var(--stable)'
    advice     = 'Seu humor, energia e estresse estão em bom equilíbrio hoje. Continue assim.'
  } else if (totalScore <= 19) {
    levelText  = 'Atenção moderada'
    levelColor = 'var(--attn)'
    advice     = 'Alguns indicadores sugerem leve tensão. Um momento de pausa pode ajudar.'
  } else {
    levelText  = 'Dia difícil'
    levelColor = 'var(--danger)'
    advice     = 'Seus indicadores de hoje apontam alto estresse. Tente descansar e, se necessário, busque apoio.'
  }

  const items = [
    { label: 'Humor',   value: answers[1], reverse: true  },
    { label: 'Energia', value: answers[2], reverse: true  },
    { label: 'Estresse',value: answers[3], reverse: false },
  ]

  return (
    <div className="text-center space-y-6">
      <CheckCircle className="w-14 h-14 mx-auto" style={{ color: 'var(--jade)' }} />

      <div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Check-in registrado</p>
        <p className="text-xl font-bold mt-1" style={{ color: levelColor, fontFamily: 'Fraunces, Georgia, serif' }}>{levelText}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => {
          const { bg } = riskColor(item.value, item.reverse)
          return (
            <div key={item.label} className="rounded-xl p-3" style={{ background: `${bg}18`, border: `1px solid ${bg}40` }}>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
              <p className="text-2xl font-bold mt-0.5 tabular-nums" style={{ color: bg }}>{item.value}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>/10</p>
            </div>
          )
        })}
      </div>

      <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: 'var(--bg-raised)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: levelColor }} />
      </div>

      <p className="text-sm leading-relaxed p-4 rounded-xl" style={{ color: 'var(--text-sec)', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {advice}
      </p>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>O risco no dashboard será atualizado em instantes.</p>

      <button onClick={onReset} className="text-sm font-semibold hover:underline" style={{ color: 'var(--jade)' }}>
        Refazer check-in
      </button>
    </div>
  )
}
