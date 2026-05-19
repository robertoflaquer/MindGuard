// src/components/CBIForm.jsx
import { useState } from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'

// --------------------------------------------------------
// Perguntas
// --------------------------------------------------------
// type: 'freq' → Nunca … Sempre (0-4)
// type: 'deg'  → Nada … Muito (0-4)
const SECTIONS = [
  {
    id: 'personal',
    title: 'Burnout Pessoal',
    subtitle: 'Com que frequência você experimenta as situações abaixo?',
    color: 'orange',
    questions: [
      { id: 1,  text: 'Com que frequência você se sente cansado(a)?',                                                    type: 'freq' },
      { id: 2,  text: 'Com que frequência você fica exausto(a) fisicamente?',                                             type: 'freq' },
      { id: 3,  text: 'Com que frequência você fica exausto(a) emocionalmente?',                                          type: 'freq' },
      { id: 4,  text: 'Com que frequência você pensa: "Eu não aguento mais"?',                                            type: 'freq' },
      { id: 5,  text: 'Com que frequência você se sente esgotado(a)?',                                                   type: 'freq' },
      { id: 6,  text: 'Com que frequência você se sente fraco(a) e suscetível a doenças?',                               type: 'freq' },
    ],
  },
  {
    id: 'work',
    title: 'Burnout Relacionado ao Trabalho',
    subtitle: 'As afirmações abaixo se aplicam ao seu trabalho.',
    color: 'red',
    questions: [
      { id: 7,  text: 'Com que frequência você se sente esgotado(a) ao fim de um dia de trabalho?',                      type: 'freq' },
      { id: 8,  text: 'Com que frequência você fica exausto(a) pela manhã ao pensar em mais um dia de trabalho?',        type: 'freq' },
      { id: 9,  text: 'Com que frequência você se sente mais cansado(a) a cada hora de trabalho?',                       type: 'freq' },
      { id: 10, text: 'Com que frequência você tem energia suficiente para família e amigos fora do trabalho?',           type: 'freq', reversed: true },
      { id: 11, text: 'Em que grau o seu trabalho é emocionalmente exaustivo?',                                          type: 'deg' },
      { id: 12, text: 'Em que grau o seu trabalho lhe frustra?',                                                         type: 'deg' },
      { id: 13, text: 'Em que grau você se sente esgotado(a) por causa do seu trabalho?',                                type: 'deg' },
    ],
  },
  {
    id: 'people',
    title: 'Burnout Relacionado às Pessoas',
    subtitle: 'Pense nas pessoas com quem você lida no trabalho (colegas, clientes, parceiros).',
    color: 'purple',
    questions: [
      { id: 14, text: 'Em que grau você acha difícil lidar com as pessoas no trabalho?',                                 type: 'deg' },
      { id: 15, text: 'Em que grau lidar com as pessoas no trabalho drena sua energia?',                                 type: 'deg' },
      { id: 16, text: 'Em que grau você acha frustrante lidar com as pessoas no trabalho?',                              type: 'deg' },
      { id: 17, text: 'Em que grau você sente que dá mais do que recebe no trabalho?',                                   type: 'deg' },
      { id: 18, text: 'Com que frequência você está cansado(a) de lidar com as pessoas no trabalho?',                    type: 'freq' },
      { id: 19, text: 'Com que frequência você se pergunta por quanto tempo ainda conseguirá trabalhar neste ritmo?',     type: 'freq' },
    ],
  },
]

const FREQ_OPTIONS = [
  { value: 0, label: 'Nunca' },
  { value: 1, label: 'Raramente' },
  { value: 2, label: 'Às vezes' },
  { value: 3, label: 'Frequentemente' },
  { value: 4, label: 'Sempre' },
]

const DEGREE_OPTIONS = [
  { value: 0, label: 'Nada' },
  { value: 1, label: 'Pouco' },
  { value: 2, label: 'Moderado' },
  { value: 3, label: 'Bastante' },
  { value: 4, label: 'Muito' },
]

const ALL_QUESTIONS = SECTIONS.flatMap((s) => s.questions)
const TOTAL = ALL_QUESTIONS.length  // 19
const MAX_SCORE = TOTAL * 4         // 76

const SECTION_COLORS = {
  orange: { accent: '#FB923C' },
  red:    { accent: '#F87171' },
  purple: { accent: '#C084FC' },
}

// --------------------------------------------------------
// Componente principal
// --------------------------------------------------------
export default function CBIForm({ onSuccess }) {
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
    return <CBIResult result={result} onReset={() => { setResult(null); setAnswers({}) }} />
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cabeçalho */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.25)' }}>
        <h2 className="font-bold text-base" style={{ fontFamily: 'Nunito, system-ui, sans-serif', fontWeight: 800, color: '#FB923C' }}>Copenhagen Burnout Inventory (CBI)</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-sec)' }}>Considere as últimas 4 semanas ao responder.</p>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 rounded-full h-1.5" style={{ background: 'rgba(251,146,60,0.2)' }}>
            <div className="h-1.5 rounded-full transition-all" style={{ width: `${(answered / TOTAL) * 100}%`, background: '#FB923C' }} />
          </div>
          <span className="text-xs font-semibold" style={{ color: '#FB923C' }}>{answered}/{TOTAL}</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl text-sm" style={{ background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.22)', color: 'var(--danger)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Seções */}
      {SECTIONS.map((section) => {
        const { accent } = SECTION_COLORS[section.color]
        return (
          <div key={section.id}>
            <div className="rounded-xl p-3 mb-3" style={{ background: `${accent}18`, border: `1px solid ${accent}35` }}>
              <h3 className="font-bold text-sm" style={{ color: accent }}>{section.title}</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{section.subtitle}</p>
            </div>
            <div className="space-y-3">
              {section.questions.map((q) => {
                const opts = q.type === 'freq' ? FREQ_OPTIONS : DEGREE_OPTIONS
                const selected = answers[q.id]
                return (
                  <div
                    key={q.id}
                    className="rounded-xl p-4 transition-colors"
                    style={
                      selected !== undefined
                        ? { background: `${accent}08`, border: `1px solid ${accent}35` }
                        : { background: 'var(--bg-card)', border: '1px solid var(--border)' }
                    }
                  >
                    <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-pri)' }}>
                      <span className="font-bold mr-2" style={{ color: accent }}>{q.id}.</span>
                      {q.text}
                    </p>
                    <div className="grid grid-cols-5 gap-1.5">
                      {opts.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelect(q.id, opt.value)}
                          className="flex flex-col items-center justify-center rounded-lg py-2 px-1 text-xs transition-all"
                          style={
                            selected === opt.value
                              ? { background: accent, color: '#060C16', fontWeight: 600, border: `1px solid ${accent}` }
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
          </div>
        )
      })}

      <button type="submit" disabled={!allAnswered || submitting} className="btn-primary w-full py-3 text-sm font-semibold">
        {submitting ? 'Enviando...' : 'Concluir CBI'}
      </button>
    </form>
  )
}

function CBIResult({ result, onReset }) {
  const { totalScore } = result
  const score = Number(totalScore)
  const pct = Math.round((score / MAX_SCORE) * 100)

  let level, levelColor, advice
  if (score <= 28) {
    level = 'Burnout baixo';    levelColor = 'var(--stable)'
    advice = 'Seus indicadores de burnout estão dentro do padrão normal. Mantenha o equilíbrio entre trabalho e vida pessoal.'
  } else if (score <= 50) {
    level = 'Burnout moderado'; levelColor = 'var(--elev)'
    advice = 'Você apresenta sinais moderados de burnout. Considere estabelecer limites mais claros e praticar autocuidado regularmente.'
  } else {
    level = 'Burnout elevado';  levelColor = 'var(--danger)'
    advice = 'Seu nível de burnout está elevado. Recomendamos fortemente conversar com um profissional de saúde mental.'
  }

  return (
    <div className="text-center space-y-6">
      <CheckCircle className="w-14 h-14 mx-auto" style={{ color: 'var(--jade)' }} />
      <div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sua pontuação CBI</p>
        <p className="text-5xl font-bold tabular-nums mt-1" style={{ color: 'var(--text-pri)' }}>
          {score}<span className="text-xl font-normal" style={{ color: 'var(--text-muted)' }}>/{MAX_SCORE}</span>
        </p>
        <p className="text-lg font-bold mt-2" style={{ color: levelColor, fontFamily: 'Fraunces, Georgia, serif' }}>{level}</p>
      </div>
      <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: 'var(--bg-raised)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: levelColor }} />
      </div>
      <p className="text-sm leading-relaxed p-4 rounded-xl" style={{ color: 'var(--text-sec)', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>{advice}</p>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>O risco no dashboard foi atualizado com base na sua resposta.</p>
      <button onClick={onReset} className="text-sm font-semibold hover:underline" style={{ color: '#FB923C' }}>
        Refazer questionário
      </button>
    </div>
  )
}
