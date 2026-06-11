// src/components/BreathingExercise.jsx
// Animated box-breathing guide (4-4-6-2) — registers mood/energy on completion
import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Wind, CheckCircle2 } from 'lucide-react'
import api from '../services/api'
import { useToastStore } from '../store/useToastStore'

const PHASES = [
  { label: 'Inspire',  duration: 4, color: '#34D399', scale: 1.35 },
  { label: 'Segure',   duration: 4, color: '#818CF8', scale: 1.35 },
  { label: 'Expire',   duration: 6, color: '#60A5FA', scale: 0.75 },
  { label: 'Segure',   duration: 2, color: '#A78BFA', scale: 0.75 },
]
const TOTAL_CYCLES = 3

export default function BreathingExercise({ onClose }) {
  const [started,    setStarted]    = useState(false)
  const [prep,       setPrep]       = useState(0) // countdown 3,2,1 antes de iniciar
  const [phaseIdx,   setPhaseIdx]   = useState(0)
  const [countdown,  setCountdown]  = useState(PHASES[0].duration)
  const [cyclesDone, setCyclesDone] = useState(0)
  const [done,       setDone]       = useState(false)
  const [mood,       setMood]       = useState(7)
  const [energy,     setEnergy]     = useState(6)
  const [saving,     setSaving]     = useState(false)
  const timerRef = useRef(null)
  const { addToast } = useToastStore()

  // Countdown de preparação: 3, 2, 1, depois inicia o ciclo de respiração
  useEffect(() => {
    if (prep <= 0) return
    const t = setTimeout(() => {
      if (prep === 1) {
        setStarted(true)
        setPhaseIdx(0)
        setCountdown(PHASES[0].duration)
      }
      setPrep(p => p - 1)
    }, 1000)
    return () => clearTimeout(t)
  }, [prep])

  const advance = useCallback(() => {
    setPhaseIdx((prev) => {
      const next = (prev + 1) % PHASES.length
      setCountdown(PHASES[next].duration)
      if (next === 0) {
        setCyclesDone((c) => {
          const total = c + 1
          if (total >= TOTAL_CYCLES) {
            setDone(true)
            return total
          }
          return total
        })
      }
      return next
    })
  }, [])

  useEffect(() => {
    if (!started || done) return
    timerRef.current = setInterval(() => {
      setCountdown((t) => {
        if (t <= 1) { advance(); return PHASES[phaseIdx].duration }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [started, done, phaseIdx, advance])

  async function handleSave() {
    setSaving(true)
    try {
      const now = new Date().toISOString()
      await api.post('/api/signals/batch', {
        signals: [
          { signalType: 'mood',         value: mood,   timestamp: now },
          { signalType: 'energy_level', value: energy, timestamp: now },
        ],
      })
      addToast('success', 'Humor e energia registrados!')
    } catch {
      addToast('error', 'Erro ao salvar sinais.')
    } finally {
      setSaving(false)
      onClose?.()
    }
  }

  const phase = PHASES[phaseIdx]
  const progress = done ? 1 : cyclesDone / TOTAL_CYCLES

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(6,12,22,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}
    >
      <div className="w-full max-w-sm rounded-3xl p-6 relative animate-fade-up"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg btn-ghost"
          style={{ color: 'var(--text-muted)' }}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-5">
          <Wind className="w-4 h-4" style={{ color: 'var(--jade)' }} />
          <p className="text-sm font-bold" style={{ color: 'var(--text-pri)', fontFamily: 'Nunito, system-ui, sans-serif' }}>
            Respiração Consciente
          </p>
        </div>

        {!started && !done && prep === 0 && (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl"
              style={{ background: 'rgba(45,212,191,0.1)', border: '2px solid rgba(45,212,191,0.25)' }}>
              🫁
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-pri)' }}>Técnica Box Breathing</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Inspire 4s, segure 4s, expire 6s, segure 2s.<br />
                {TOTAL_CYCLES} ciclos completos (~{TOTAL_CYCLES * 16}s)
              </p>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Usado por militares e atletas para regular o sistema nervoso e reduzir cortisol.
            </p>
            <button
              onClick={() => setPrep(3)}
              className="btn-primary w-full py-3 text-sm font-semibold"
            >
              Começar
            </button>
          </div>
        )}

        {(prep > 0 || (started && !done)) && (() => {
          const isPrep      = prep > 0
          const showColor   = isPrep ? '#A78BFA' : phase.color
          const showLabel   = isPrep ? 'Prepare-se' : phase.label
          const showCount   = isPrep ? prep : countdown
          const showScale   = isPrep ? 0.75 : phase.scale
          // Durante prep, transição rápida (0.6s). Durante respiração, duração da fase.
          const transDur    = isPrep ? 0.6 : phase.duration
          return (
            <div className="text-center space-y-6">
              {/* Progress dots */}
              <div className="flex justify-center gap-2">
                {Array.from({ length: TOTAL_CYCLES }).map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full transition-all"
                    style={{ background: i < cyclesDone ? 'var(--jade)' : 'var(--bg-raised)' }} />
                ))}
              </div>

              {/* Animated circle */}
              <div className="relative flex items-center justify-center" style={{ height: 200 }}>
                <div
                  className="absolute rounded-full"
                  style={{
                    width: 170,
                    height: 170,
                    background: `${showColor}08`,
                    transform: `scale(${showScale})`,
                    transition: `transform ${transDur}s ease-in-out, background 0.6s`,
                    border: `1px solid ${showColor}20`,
                  }}
                />
                <div
                  className="absolute rounded-full flex flex-col items-center justify-center"
                  style={{
                    width: 130,
                    height: 130,
                    background: `${showColor}18`,
                    border: `2px solid ${showColor}60`,
                    transform: `scale(${showScale})`,
                    transition: `transform ${transDur}s ease-in-out, background 0.6s, border-color 0.6s`,
                  }}
                >
                  <span className="text-4xl font-extrabold tabular-nums" style={{ color: showColor }}>
                    {showCount}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-lg font-bold" style={{ color: showColor, fontFamily: 'Nunito, system-ui, sans-serif' }}>
                  {showLabel}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {isPrep ? 'Iniciando em instantes' : `Ciclo ${Math.min(cyclesDone + 1, TOTAL_CYCLES)} de ${TOTAL_CYCLES}`}
                </p>
              </div>

              <button
                onClick={() => { clearInterval(timerRef.current); onClose?.() }}
                className="w-full py-2.5 rounded-xl text-xs font-semibold"
                style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)' }}
              >
                Parar
              </button>
            </div>
          )
        })()}

        {done && (
          <div className="text-center space-y-5">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
              style={{ background: 'rgba(45,212,191,0.12)' }}>
              <CheckCircle2 className="w-8 h-8" style={{ color: 'var(--jade)' }} />
            </div>
            <div>
              <p className="font-bold text-base" style={{ color: 'var(--jade)', fontFamily: 'Nunito, system-ui, sans-serif' }}>
                Exercício concluído!
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Como você está se sentindo agora?
              </p>
            </div>

            <div className="space-y-4">
              <SliderInput label="Humor" emoji="😊" value={mood} onChange={setMood} color="var(--jade)" />
              <SliderInput label="Energia" emoji="⚡" value={energy} onChange={setEnergy} color="#FBBF24" />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary w-full py-3 text-sm font-semibold"
            >
              {saving ? 'Salvando...' : 'Salvar e fechar'}
            </button>
            <button
              onClick={onClose}
              className="w-full text-xs py-1"
              style={{ color: 'var(--text-muted)' }}
            >
              Fechar sem salvar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SliderInput({ label, emoji, value, onChange, color }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold" style={{ color: 'var(--text-sec)' }}>
          {emoji} {label}
        </span>
        <span className="text-sm font-bold tabular-nums" style={{ color }}>{value}/10</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-jade"
        style={{ accentColor: color, height: 4 }}
      />
    </div>
  )
}
