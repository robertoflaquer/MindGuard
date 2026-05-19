// src/pages/Treatment.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useThemeStore } from '../store/useThemeStore'
import { useAppointmentStore } from '../store/useAppointmentStore'
import { ArrowLeft, Sun, Moon, Star, Video, CheckCircle, CalendarDays, ChevronRight } from 'lucide-react'
import { addDays, format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function MindGuardLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 34 34" fill="none" aria-hidden>
      <path d="M17 30C9 26 5 19.5 5 13a6 6 0 0 1 12-1 6 6 0 0 1 12 1c0 6.5-4 13.5-12 17z" fill="var(--jade)" opacity="0.9" />
      <path d="M9 17h4l2-4.5 4.5 9 2.5-4.5H26" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const SPECIALISTS = [
  {
    id: 1,
    name: 'Dra. Ana Lima',
    role: 'Psiquiatra',
    reg: 'CRM/SP 123.456',
    initials: 'AL',
    color: '#818CF8',
    rating: 4.9,
    sessions: 234,
    bio: 'Especialista em saúde mental ocupacional e burnout.',
    unavailable: [1, 3],
  },
  {
    id: 2,
    name: 'Dr. Carlos Mendes',
    role: 'Psicólogo Clínico',
    reg: 'CRP/SP 06/654321',
    initials: 'CM',
    color: '#2DD4BF',
    rating: 4.8,
    sessions: 189,
    bio: 'Abordagem cognitivo-comportamental, ansiedade e depressão.',
    unavailable: [0, 4],
  },
  {
    id: 3,
    name: 'Dra. Fernanda Costa',
    role: 'Terapeuta TCC',
    reg: 'CRP/SP 06/789012',
    initials: 'FC',
    color: '#FB923C',
    rating: 4.9,
    sessions: 312,
    bio: 'Terapia cognitivo-comportamental para estresse e esgotamento.',
    unavailable: [2, 5],
  },
]

const TIME_SLOTS = [
  { time: '08:00', label: '08:00 – 08:45' },
  { time: '09:00', label: '09:00 – 09:45' },
  { time: '10:00', label: '10:00 – 10:45' },
  { time: '11:00', label: '11:00 – 11:45' },
  { time: '14:00', label: '14:00 – 14:45' },
  { time: '15:00', label: '15:00 – 15:45' },
  { time: '16:00', label: '16:00 – 16:45' },
  { time: '17:00', label: '17:00 – 17:45' },
]

const DAYS = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i))

function Avatar({ specialist, size = 48 }) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold flex-shrink-0"
      style={{ width: size, height: size, background: `${specialist.color}22`, color: specialist.color, fontSize: size * 0.35 }}
    >
      {specialist.initials}
    </div>
  )
}

function SpecialistCard({ spec, selected, onSelect }) {
  const isSelected = selected?.id === spec.id
  return (
    <button
      onClick={() => onSelect(spec)}
      className="w-full text-left rounded-2xl p-4 transition-all"
      style={{
        background: isSelected ? `${spec.color}15` : 'var(--bg-card)',
        border: `1.5px solid ${isSelected ? spec.color : 'var(--border)'}`,
      }}
    >
      <div className="flex items-center gap-3">
        <Avatar specialist={spec} size={48} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-tight" style={{ color: 'var(--text-pri)' }}>{spec.name}</p>
          <p className="text-xs mt-0.5" style={{ color: spec.color }}>{spec.role}</p>
          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{spec.reg}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="flex items-center gap-1 justify-end">
            <Star className="w-3 h-3" style={{ color: '#FBBF24', fill: '#FBBF24' }} />
            <span className="text-xs font-bold" style={{ color: 'var(--text-pri)' }}>{spec.rating}</span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{spec.sessions} sessões</p>
        </div>
      </div>
      <p className="text-xs mt-2.5 leading-relaxed" style={{ color: 'var(--text-sec)' }}>{spec.bio}</p>
    </button>
  )
}

function ConfirmedScreen({ spec, date, time, notes, onNew, onDash }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-deep)' }}>
      <div className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md text-center animate-fade-up">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(45,212,191,0.15)' }}>
            <CheckCircle className="w-10 h-10" style={{ color: 'var(--stable)' }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-pri)', fontFamily: 'Nunito, system-ui, sans-serif' }}>
            Consulta Agendada!
          </h2>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
            Você receberá um lembrete por e-mail antes da consulta.
          </p>

          <div className="rounded-2xl p-5 text-left mb-6 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3">
              <Avatar specialist={spec} size={44} />
              <div>
                <p className="font-bold text-sm" style={{ color: 'var(--text-pri)' }}>{spec.name}</p>
                <p className="text-xs" style={{ color: spec.color }}>{spec.role}</p>
              </div>
            </div>

            <div className="h-px" style={{ background: 'var(--border)' }} />

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3" style={{ background: 'var(--bg-raised)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Data</p>
                <p className="text-sm font-semibold capitalize" style={{ color: 'var(--text-pri)' }}>
                  {format(date, "EEEE, dd/MM", { locale: ptBR })}
                </p>
              </div>
              <div className="rounded-xl p-3" style={{ background: 'var(--bg-raised)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Horário</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-pri)' }}>
                  {TIME_SLOTS.find(s => s.time === time)?.label}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl p-3" style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)' }}>
              <Video className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--jade)' }} />
              <p className="text-xs font-semibold" style={{ color: 'var(--jade)' }}>Consulta por videochamada · 45 min</p>
            </div>

            {notes && (
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Sua observação</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-sec)' }}>{notes}</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={onDash}
              className="btn-primary w-full py-3 font-semibold"
            >
              Ir para o Dashboard
            </button>
            <button
              onClick={onNew}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-sec)' }}
            >
              Agendar outra consulta
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Treatment() {
  const navigate = useNavigate()
  const { isDark, toggle: toggleTheme } = useThemeStore()
  const { fetchSpecialists, specialists: apiSpecialists, createAppointment } = useAppointmentStore()

  const [selectedSpec, setSelectedSpec]   = useState(null)
  const [selectedDate, setSelectedDate]   = useState(null)
  const [selectedTime, setSelectedTime]   = useState(null)
  const [notes, setNotes]                 = useState('')
  const [confirmed, setConfirmed]         = useState(false)
  const [step, setStep]                   = useState(1)
  const [saving, setSaving]               = useState(false)

  // Merge API specialists data into static list (keeps bio, rating, etc.)
  const specialists = SPECIALISTS.map((s) => {
    const api = apiSpecialists.find((a) => a.id === s.id)
    return api ? { ...s, id: api.id } : s
  })

  useEffect(() => { fetchSpecialists() }, [])

  const canProceedStep1 = !!selectedSpec
  const canConfirm      = !!selectedSpec && !!selectedDate && !!selectedTime

  function handleSelectSpec(spec) {
    setSelectedSpec(spec)
    setSelectedDate(null)
    setSelectedTime(null)
  }

  function isSlotDisabled(dayIndex, time) {
    if (!selectedSpec) return false
    return selectedSpec.unavailable.includes(dayIndex % 2) && ['09:00', '14:00'].includes(time)
  }

  async function handleConfirm() {
    if (!canConfirm) return
    setSaving(true)
    try {
      await createAppointment({
        specialistId: selectedSpec.id,
        scheduledDate: format(selectedDate, 'yyyy-MM-dd'),
        scheduledTime: selectedTime,
        observations: notes || null,
      })
    } catch {
      // appointment saved locally even if API fails
    } finally {
      setSaving(false)
      setConfirmed(true)
    }
  }

  function handleReset() {
    setSelectedSpec(null)
    setSelectedDate(null)
    setSelectedTime(null)
    setNotes('')
    setConfirmed(false)
    setStep(1)
  }

  if (confirmed && selectedSpec && selectedDate && selectedTime) {
    return (
      <ConfirmedScreen
        spec={selectedSpec}
        date={selectedDate}
        time={selectedTime}
        notes={notes}
        onNew={handleReset}
        onDash={() => navigate('/dashboard')}
      />
    )
  }

  const dayIndex = selectedDate ? DAYS.findIndex(d => isSameDay(d, selectedDate)) : -1

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-deep)' }}>
      {/* Header */}
      <header className="sticky top-0 z-30" style={{ background: 'var(--header-blur)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl transition-colors"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-card)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-pri)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5 flex-1">
            <MindGuardLogo />
            <div>
              <h1 className="text-sm font-bold leading-tight" style={{ fontFamily: 'Nunito, system-ui, sans-serif', fontWeight: 800, color: 'var(--text-pri)' }}>
                Agendar Consulta
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Videochamada · 45 min</p>
            </div>
          </div>
          <button onClick={toggleTheme} className="btn-ghost p-2 rounded-xl" title={isDark ? 'Modo claro' : 'Modo escuro'}>
            {isDark ? <Sun className="w-4 h-4" style={{ color: 'var(--attn)' }} /> : <Moon className="w-4 h-4" style={{ color: 'var(--accent)' }} />}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8 space-y-8 pb-24">

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {['Profissional', 'Data & Hora', 'Confirmar'].map((label, i) => {
            const s = i + 1
            const active = step === s
            const done   = step > s
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={
                      done   ? { background: 'var(--stable)', color: '#fff' } :
                      active ? { background: 'var(--accent)', color: '#fff' } :
                               { background: 'var(--bg-raised)', color: 'var(--text-muted)' }
                    }
                  >
                    {done ? '✓' : s}
                  </div>
                  <span className="text-xs font-semibold hidden sm:block" style={{ color: active ? 'var(--text-pri)' : 'var(--text-muted)' }}>
                    {label}
                  </span>
                </div>
                {i < 2 && <div className="flex-1 h-px" style={{ background: done ? 'var(--stable)' : 'var(--border)' }} />}
              </div>
            )
          })}
        </div>

        {/* Step 1 – Specialist */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
            Escolha o profissional
          </p>
          <div className="space-y-3">
            {specialists.map((spec) => (
              <SpecialistCard
                key={spec.id}
                spec={spec}
                selected={selectedSpec}
                onSelect={(s) => { handleSelectSpec(s); setStep(Math.max(step, 2)) }}
              />
            ))}
          </div>
        </section>

        {/* Step 2 – Date & Time (shown after specialist chosen) */}
        {selectedSpec && (
          <section className="animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
              Escolha a data
            </p>

            {/* Week scroll */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
              {DAYS.map((day, i) => {
                const isSel = selectedDate && isSameDay(day, selectedDate)
                const isToday = i === 0
                return (
                  <button
                    key={i}
                    onClick={() => { setSelectedDate(day); setSelectedTime(null); setStep(Math.max(step, 2)) }}
                    className="flex flex-col items-center gap-1 px-3.5 py-3 rounded-2xl transition-all flex-shrink-0"
                    style={
                      isSel
                        ? { background: 'var(--accent)', color: '#fff', border: '1.5px solid var(--accent)' }
                        : { background: 'var(--bg-card)', color: 'var(--text-sec)', border: '1.5px solid var(--border)' }
                    }
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ opacity: isSel ? 1 : 0.6 }}>
                      {format(day, 'EEE', { locale: ptBR }).slice(0, 3)}
                    </span>
                    <span className="text-lg font-bold leading-none">{format(day, 'd')}</span>
                    {isToday && (
                      <span className="text-xs font-semibold" style={{ color: isSel ? 'rgba(255,255,255,0.8)' : 'var(--accent)' }}>
                        hoje
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                  Horários disponíveis
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {TIME_SLOTS.map(({ time, label }) => {
                    const disabled = isSlotDisabled(dayIndex, time)
                    const isSel    = selectedTime === time
                    return (
                      <button
                        key={time}
                        disabled={disabled}
                        onClick={() => { setSelectedTime(time); setStep(3) }}
                        className="py-2.5 rounded-xl text-sm font-semibold transition-all"
                        style={
                          disabled
                            ? { background: 'var(--bg-raised)', color: 'var(--text-muted)', opacity: 0.4, cursor: 'not-allowed' }
                            : isSel
                              ? { background: 'var(--accent)', color: '#fff', border: '1.5px solid var(--accent)' }
                              : { background: 'var(--bg-card)', color: 'var(--text-sec)', border: '1.5px solid var(--border)' }
                        }
                      >
                        {time}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Step 3 – Notes + Confirm */}
        {canConfirm && (
          <section className="animate-fade-up">
            {/* Summary */}
            <div className="rounded-2xl p-4 mb-5 flex items-center gap-3" style={{ background: `${selectedSpec.color}12`, border: `1px solid ${selectedSpec.color}30` }}>
              <Avatar specialist={selectedSpec} size={40} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm" style={{ color: 'var(--text-pri)' }}>{selectedSpec.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })} · {TIME_SLOTS.find(s => s.time === selectedTime)?.label}
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl" style={{ background: 'rgba(45,212,191,0.12)', border: '1px solid rgba(45,212,191,0.25)' }}>
                <Video className="w-3.5 h-3.5" style={{ color: 'var(--jade)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--jade)' }}>Vídeo</span>
              </div>
            </div>

            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Descreva brevemente o motivo (opcional)
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="input-field w-full resize-none"
              placeholder="Ex: Tenho sentido muito estresse no trabalho e dificuldade para dormir..."
            />
          </section>
        )}
      </main>

      {/* Floating confirm button */}
      {canConfirm && (
        <div
          className="fixed bottom-0 left-0 right-0 px-5 py-4"
          style={{ background: 'var(--header-blur)', backdropFilter: 'blur(16px)', borderTop: '1px solid var(--border)' }}
        >
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 font-semibold"
            >
              <CalendarDays className="w-4 h-4" />
              {saving ? 'Agendando…' : 'Confirmar Agendamento'}
              {!saving && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
