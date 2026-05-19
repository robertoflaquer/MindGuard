// src/components/OLBIForm.jsx
import { useState } from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'

// --------------------------------------------------------
// Perguntas (traduzidas do inglês para português)
// Itens revertidos marcados com reversed: true
// Subscala: 'E' = Exaustão, 'D' = Desengajamento
// --------------------------------------------------------
const QUESTIONS = [
  { id: 1,  sub: 'D', reversed: true,  text: 'Sempre encontro aspectos novos e interessantes no meu trabalho.' },
  { id: 2,  sub: 'E', reversed: false, text: 'Há dias em que me sinto cansado(a) antes mesmo de chegar ao trabalho.' },
  { id: 3,  sub: 'D', reversed: false, text: 'Acontece cada vez mais de eu falar de maneira negativa sobre o meu trabalho.' },
  { id: 4,  sub: 'E', reversed: false, text: 'Depois do trabalho, costumo precisar de mais tempo do que antes para relaxar e me recuperar.' },
  { id: 5,  sub: 'E', reversed: true,  text: 'Consigo tolerar bem a pressão do meu trabalho.' },
  { id: 6,  sub: 'D', reversed: false, text: 'Ultimamente, tenho trabalhado cada vez mais no "piloto automático", sem pensar muito.' },
  { id: 7,  sub: 'D', reversed: true,  text: 'Vejo meu trabalho como um desafio positivo.' },
  { id: 8,  sub: 'E', reversed: false, text: 'Durante o trabalho, frequentemente me sinto emocionalmente esgotado(a).' },
  { id: 9,  sub: 'D', reversed: false, text: 'Com o tempo, é fácil se desconectar deste tipo de trabalho.' },
  { id: 10, sub: 'E', reversed: true,  text: 'Após o trabalho, ainda tenho energia suficiente para meus momentos de lazer.' },
  { id: 11, sub: 'D', reversed: false, text: 'Às vezes me sinto mal com as tarefas do meu trabalho.' },
  { id: 12, sub: 'E', reversed: false, text: 'Após o trabalho, geralmente me sinto esgotado(a) e sem forças.' },
  { id: 13, sub: 'D', reversed: true,  text: 'Este é o único tipo de trabalho que consigo me imaginar fazendo.' },
  { id: 14, sub: 'E', reversed: true,  text: 'Geralmente consigo gerenciar bem a quantidade de trabalho que tenho.' },
  { id: 15, sub: 'D', reversed: true,  text: 'Sinto que estou cada vez mais engajado(a) no meu trabalho.' },
  { id: 16, sub: 'E', reversed: true,  text: 'Quando trabalho, geralmente me sinto cheio(a) de energia.' },
]

const OPTIONS = [
  { value: 0, label: 'Discordo totalmente' },
  { value: 1, label: 'Discordo' },
  { value: 2, label: 'Neutro' },
  { value: 3, label: 'Concordo' },
  { value: 4, label: 'Concordo totalmente' },
]

const TOTAL = QUESTIONS.length  // 16
const MAX_SCORE = TOTAL * 4     // 64

// Subscalas para exibição no resultado
const EXHAUSTION_IDS  = new Set([2, 4, 5, 8, 10, 12, 14, 16])
const DISENGAGE_IDS   = new Set([1, 3, 6, 7, 9, 11, 13, 15])

// --------------------------------------------------------
// Componente principal
// --------------------------------------------------------
export default function OLBIForm({ onSuccess }) {
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const answered = Object.keys(answers).length
  const allAnswered = answered === TOTAL

  function handleSelect(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!allAnswered) { setError('Responda todas as perguntas antes de continuar.'); return }
    setError('')
    setSubmitting(true)
    try {
      const data = await onSuccess(answers)
      setResult(data)
    } catch {
      setError('Erro ao enviar. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return <OLBIResult result={result} answers={answers} onReset={() => { setResult(null); setAnswers({}) }} />
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cabeçalho */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.25)' }}>
        <h2 className="font-bold text-base" style={{ fontFamily: 'Nunito, system-ui, sans-serif', fontWeight: 800, color: '#C084FC' }}>Oldenburg Burnout Inventory (OLBI)</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-sec)' }}>Indique o quanto você concorda com cada afirmação sobre seu trabalho atual.</p>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 rounded-full h-1.5" style={{ background: 'rgba(192,132,252,0.2)' }}>
            <div className="h-1.5 rounded-full transition-all" style={{ width: `${(answered / TOTAL) * 100}%`, background: '#C084FC' }} />
          </div>
          <span className="text-xs font-semibold" style={{ color: '#C084FC' }}>{answered}/{TOTAL}</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl text-sm" style={{ background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.22)', color: 'var(--danger)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Perguntas */}
      <div className="space-y-3">
        {QUESTIONS.map((q) => {
          const selected = answers[q.id]
          const subLabel = q.sub === 'E' ? 'Exaustão' : 'Desengajamento'
          const subAccent = q.sub === 'E' ? 'var(--danger)' : '#60A5FA'
          return (
            <div
              key={q.id}
              className="rounded-xl p-4 transition-colors"
              style={
                selected !== undefined
                  ? { background: 'rgba(192,132,252,0.06)', border: '1px solid rgba(192,132,252,0.25)' }
                  : { background: 'var(--bg-card)', border: '1px solid var(--border)' }
              }
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <p className="text-sm font-medium" style={{ color: 'var(--text-pri)' }}>
                  <span className="font-bold mr-2" style={{ color: '#C084FC' }}>{q.id}.</span>
                  {q.text}
                </p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ color: subAccent, background: `${subAccent}1A` }}>
                  {subLabel}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(q.id, opt.value)}
                    className="flex flex-col items-center justify-center rounded-lg py-2 px-1 text-xs transition-all"
                    style={
                      selected === opt.value
                        ? { background: '#C084FC', color: '#060C16', fontWeight: 600, border: '1px solid #C084FC' }
                        : { background: 'var(--bg-surface)', color: 'var(--text-sec)', border: '1px solid var(--border)' }
                    }
                  >
                    <span className="text-sm font-bold leading-none mb-0.5">{opt.value}</span>
                    <span className="leading-tight text-center text-[10px]">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <button type="submit" disabled={!allAnswered || submitting} className="btn-primary w-full py-3 text-sm font-semibold">
        {submitting ? 'Enviando...' : 'Concluir OLBI'}
      </button>
    </form>
  )
}

function OLBIResult({ result, answers, onReset }) {
  const { totalScore } = result
  const score = Number(totalScore)
  const pct = Math.round((score / MAX_SCORE) * 100)

  const exhaustionRaw = [...EXHAUSTION_IDS].reduce((s, id) => s + (answers[id] ?? 0), 0)
  const disengageRaw  = [...DISENGAGE_IDS].reduce((s, id)  => s + (answers[id] ?? 0), 0)
  const exhaustionPct = Math.round((exhaustionRaw / (8 * 4)) * 100)
  const disengagePct  = Math.round((disengageRaw  / (8 * 4)) * 100)

  let level, levelColor, advice
  if (score <= 28) {
    level = 'Burnout baixo';    levelColor = 'var(--stable)'
    advice = 'Seus indicadores de esgotamento e desengajamento estão dentro do padrão esperado. Mantenha o equilíbrio com pausas regulares.'
  } else if (score <= 44) {
    level = 'Burnout moderado'; levelColor = 'var(--elev)'
    advice = 'Você apresenta sinais moderados de esgotamento ou desengajamento. Avalie suas demandas de trabalho e priorize o autocuidado.'
  } else {
    level = 'Burnout elevado';  levelColor = 'var(--danger)'
    advice = 'Seu nível de burnout está elevado. Recomendamos fortemente apoio profissional e uma revisão das suas condições de trabalho.'
  }

  const subBarColor = (pct) => pct <= 44 ? 'var(--stable)' : pct <= 69 ? 'var(--elev)' : 'var(--danger)'

  return (
    <div className="text-center space-y-6">
      <CheckCircle className="w-14 h-14 mx-auto" style={{ color: 'var(--jade)' }} />
      <div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sua pontuação OLBI</p>
        <p className="text-5xl font-bold tabular-nums mt-1" style={{ color: 'var(--text-pri)' }}>
          {score}<span className="text-xl font-normal" style={{ color: 'var(--text-muted)' }}>/{MAX_SCORE}</span>
        </p>
        <p className="text-lg font-bold mt-2" style={{ color: levelColor, fontFamily: 'Fraunces, Georgia, serif' }}>{level}</p>
      </div>

      <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: 'var(--bg-raised)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: levelColor }} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-left">
        {[
          { label: 'Exaustão', pct: exhaustionPct, accent: 'var(--danger)' },
          { label: 'Desengajamento', pct: disengagePct, accent: '#60A5FA' },
        ].map(({ label, pct: p, accent }) => (
          <div key={label} className="rounded-xl p-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: accent }}>{label}</p>
            <div className="w-full rounded-full h-1.5 overflow-hidden mb-1" style={{ background: 'var(--bg-raised)' }}>
              <div className="h-full rounded-full" style={{ width: `${p}%`, background: subBarColor(p) }} />
            </div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{p}%</p>
          </div>
        ))}
      </div>

      <p className="text-sm leading-relaxed p-4 rounded-xl" style={{ color: 'var(--text-sec)', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>{advice}</p>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>O risco no dashboard foi atualizado com base na sua resposta.</p>
      <button onClick={onReset} className="text-sm font-semibold hover:underline" style={{ color: '#C084FC' }}>
        Refazer questionário
      </button>
    </div>
  )
}
