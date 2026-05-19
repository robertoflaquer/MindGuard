// GAD-7: Generalized Anxiety Disorder Scale (7 items)
import { useState } from 'react'

const QUESTIONS = [
  'Sentir-se nervoso(a), ansioso(a) ou muito tenso(a)',
  'Não conseguir parar ou controlar as preocupações',
  'Preocupar-se demais com diferentes coisas',
  'Dificuldade para relaxar',
  'Ficar tão agitado(a) que é difícil ficar parado(a)',
  'Ficar facilmente aborrecido(a) ou irritado(a)',
  'Sentir medo como se algo terrível fosse acontecer',
]

const OPTIONS = [
  { value: 0, label: 'Nunca' },
  { value: 1, label: 'Vários dias' },
  { value: 2, label: 'Mais da metade dos dias' },
  { value: 3, label: 'Quase todos os dias' },
]

export default function GAD7Form({ onSubmit, onCancel, isSubmitting }) {
  const [answers, setAnswers] = useState({})

  const total = Object.values(answers).reduce((s, v) => s + v, 0)
  const answered = Object.keys(answers).length
  const complete = answered === QUESTIONS.length

  function getLevel() {
    if (total <= 4) return { text: 'Mínimo', color: 'var(--stable)' }
    if (total <= 9) return { text: 'Leve', color: 'var(--attn)' }
    if (total <= 14) return { text: 'Moderado', color: 'var(--elev)' }
    return { text: 'Grave', color: 'var(--danger)' }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!complete) return
    const numericAnswers = Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, Number(v)]))
    onSubmit('GAD7', numericAnswers)
  }

  const level = complete ? getLevel() : null

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--fg-muted)', lineHeight: 1.5 }}>
        Nas <strong>últimas 2 semanas</strong>, com que frequência você foi incomodado(a) pelos seguintes problemas?
      </div>

      {QUESTIONS.map((q, i) => {
        const key = String(i + 1)
        return (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--fg-base)', fontWeight: 500 }}>
              <span style={{ color: 'var(--accent)', marginRight: '0.4rem', fontWeight: 700 }}>{i + 1}.</span>
              {q}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
              {OPTIONS.map((opt) => {
                const selected = answers[key] === opt.value
                return (
                  <label
                    key={opt.value}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.5rem 0.75rem', borderRadius: 8,
                      border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                      background: selected ? 'rgba(var(--accent-rgb),0.08)' : 'var(--surface-2)',
                      cursor: 'pointer', fontSize: '0.82rem', color: 'var(--fg-base)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <input
                      type="radio"
                      name={`gad7_q${key}`}
                      value={opt.value}
                      checked={selected}
                      onChange={() => setAnswers((prev) => ({ ...prev, [key]: opt.value }))}
                      style={{ display: 'none' }}
                    />
                    <span style={{
                      width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${selected ? 'var(--accent)' : 'var(--fg-muted)'}`,
                      background: selected ? 'var(--accent)' : 'transparent',
                      transition: 'all 0.15s',
                    }} />
                    <span>{opt.label}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--fg-muted)' }}>{opt.value}</span>
                  </label>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Score preview */}
      {complete && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.75rem 1rem', borderRadius: 10,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--fg-muted)' }}>Score GAD-7</span>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: level.color }}>
            {total}/21 — {level.text}
          </span>
        </div>
      )}

      {/* Progress */}
      <div style={{ fontSize: '0.78rem', color: 'var(--fg-muted)', textAlign: 'center' }}>
        {answered}/{QUESTIONS.length} respondidas
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={onCancel}>
          Cancelar
        </button>
        <button
          type="submit"
          className="btn-primary"
          style={{ flex: 2 }}
          disabled={!complete || isSubmitting}
        >
          {isSubmitting ? 'Enviando…' : 'Enviar GAD-7'}
        </button>
      </div>
    </form>
  )
}
