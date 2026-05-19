// src/components/PSSForm.jsx
import { useState } from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'

const PSS_QUESTIONS = [
  { id: 1, text: 'Com que frequência você ficou aborrecido por causa de algo que aconteceu inesperadamente?' },
  { id: 2, text: 'Com que frequência você sentiu que foi incapaz de controlar coisas importantes na sua vida?' },
  { id: 3, text: 'Com que frequência você esteve nervoso ou estressado?' },
  { id: 4, text: 'Com que frequência você esteve confiante em sua capacidade de lidar com seus problemas pessoais?', positive: true },
  { id: 5, text: 'Com que frequência você sentiu que as coisas aconteceram da maneira que você esperava?', positive: true },
  { id: 6, text: 'Com que frequência você achou que não conseguiria lidar com todas as coisas que tinha por fazer?' },
  { id: 7, text: 'Com que frequência você foi capaz de controlar irritações na sua vida?', positive: true },
  { id: 8, text: 'Com que frequência você sentiu que todos os aspectos de sua vida estavam sob controle?', positive: true },
  { id: 9, text: 'Com que frequência você esteve irritado por causa de coisas que estiveram fora de seu controle?' },
  { id: 10, text: 'Com que frequência você sentiu que os problemas acumularam tanto que você não conseguiria resolvê-los?' },
]

const OPTIONS = [
  { value: 0, label: 'Nunca' },
  { value: 1, label: 'Quase nunca' },
  { value: 2, label: 'Às vezes' },
  { value: 3, label: 'Pouco frequente' },
  { value: 4, label: 'Muito frequente' },
]

// Itens positivos têm pontuação revertida no backend — aqui só exibimos o aviso
const PERIOD_LABEL = 'Considere os últimos 30 dias.'

export default function PSSForm({ onSuccess }) {
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const answered = Object.keys(answers).length
  const total = PSS_QUESTIONS.length
  const allAnswered = answered === total

  function handleSelect(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!allAnswered) {
      setError('Responda todas as perguntas antes de continuar.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      // Chama o store via prop para manter o componente desacoplado
      const data = await onSuccess(answers)
      setResult(data)
    } catch {
      setError('Erro ao enviar. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return <PSSResult result={result} onReset={() => { setResult(null); setAnswers({}) }} />
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cabeçalho */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.25)' }}>
        <h2 className="font-bold text-base" style={{ fontFamily: 'Nunito, system-ui, sans-serif', fontWeight: 800, color: '#818CF8' }}>
          Escala de Percepção de Estresse (PSS-10)
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-sec)' }}>{PERIOD_LABEL}</p>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 rounded-full h-1.5" style={{ background: 'rgba(129,140,248,0.2)' }}>
            <div className="h-1.5 rounded-full transition-all" style={{ width: `${(answered / total) * 100}%`, background: '#818CF8' }} />
          </div>
          <span className="text-xs font-semibold" style={{ color: '#818CF8' }}>{answered}/{total}</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl text-sm" style={{ background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.22)', color: 'var(--danger)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Perguntas */}
      <div className="space-y-4">
        {PSS_QUESTIONS.map((q) => {
          const selected = answers[q.id]
          return (
            <div
              key={q.id}
              className="rounded-xl p-4 transition-colors"
              style={
                selected !== undefined
                  ? { background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.25)' }
                  : { background: 'var(--bg-card)', border: '1px solid var(--border)' }
              }
            >
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-pri)' }}>
                <span className="font-bold mr-2" style={{ color: '#818CF8' }}>{q.id}.</span>
                {q.text}
              </p>
              <div className="grid grid-cols-5 gap-2">
                {OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(q.id, opt.value)}
                    className="flex flex-col items-center justify-center rounded-lg py-2 px-1 text-xs transition-all"
                    style={
                      selected === opt.value
                        ? { background: '#818CF8', color: '#060C16', fontWeight: 600, border: '1px solid #818CF8' }
                        : { background: 'var(--bg-surface)', color: 'var(--text-sec)', border: '1px solid var(--border)' }
                    }
                  >
                    <span className="text-base font-bold leading-none mb-1">{opt.value}</span>
                    <span className="leading-tight text-center">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <button type="submit" disabled={!allAnswered || submitting} className="btn-primary w-full py-3 text-sm font-semibold">
        {submitting ? 'Enviando...' : 'Concluir PSS'}
      </button>
    </form>
  )
}

function PSSResult({ result, onReset }) {
  const { totalScore, maxScore } = result
  const pct = Math.round((totalScore / maxScore) * 100)

  let level, levelColor, advice
  if (totalScore <= 13) {
    level = 'Estresse baixo'
    levelColor = 'var(--stable)'
    advice = 'Seu nível de estresse percebido está dentro do padrão normal. Continue com seus hábitos de bem-estar.'
  } else if (totalScore <= 26) {
    level = 'Estresse moderado'
    levelColor = 'var(--attn)'
    advice = 'Você está percebendo um nível moderado de estresse. Considere práticas de relaxamento e autocuidado.'
  } else {
    level = 'Estresse elevado'
    levelColor = 'var(--danger)'
    advice = 'Seu nível de estresse percebido está alto. Recomendamos conversar com um profissional de saúde mental.'
  }

  return (
    <div className="text-center space-y-6">
      <CheckCircle className="w-14 h-14 mx-auto" style={{ color: 'var(--jade)' }} />
      <div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sua pontuação PSS</p>
        <p className="text-5xl font-bold tabular-nums mt-1" style={{ color: 'var(--text-pri)' }}>
          {totalScore}<span className="text-xl font-normal" style={{ color: 'var(--text-muted)' }}>/{maxScore}</span>
        </p>
        <p className="text-lg font-bold mt-2" style={{ color: levelColor, fontFamily: 'Fraunces, Georgia, serif' }}>{level}</p>
      </div>

      <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: 'var(--bg-raised)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: levelColor }} />
      </div>

      <p className="text-sm leading-relaxed p-4 rounded-xl" style={{ color: 'var(--text-sec)', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>{advice}</p>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>O risco no dashboard foi atualizado com base na sua resposta.</p>

      <button onClick={onReset} className="text-sm font-semibold hover:underline" style={{ color: '#818CF8' }}>
        Refazer questionário
      </button>
    </div>
  )
}
