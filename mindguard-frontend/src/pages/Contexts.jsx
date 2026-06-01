// src/pages/Contexts.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useContextStore } from '../store/useContextStore'
import { useToastStore } from '../store/useToastStore'
import {
  ArrowLeft, ShieldPlus, CalendarDays, Briefcase,
  Activity, PenLine, X, Plus, Layers, Sun, Moon,
} from 'lucide-react'
import { useThemeStore } from '../store/useThemeStore'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function MindGuardLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9.5 4A2.5 2.5 0 0 1 12 6.5v11a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 4Z" fill="var(--jade)" />
      <path d="M14.5 4A2.5 2.5 0 0 0 12 6.5v11a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 4Z" fill="var(--jade)" fillOpacity="0.78" />
    </svg>
  )
}

const CATEGORY_META = {
  health:     { label: 'Saúde',           icon: ShieldPlus,   color: '#60A5FA' },
  life_event: { label: 'Eventos de Vida', icon: CalendarDays, color: '#34D399' },
  work:       { label: 'Trabalho',        icon: Briefcase,    color: '#FB923C' },
  physical:   { label: 'Físico',          icon: Activity,     color: '#C084FC' },
  custom:     { label: 'Outro',           icon: PenLine,      color: 'var(--text-muted)' },
}

const SEVERITY_LABEL = { mild: 'Leve', moderate: 'Moderado', severe: 'Grave' }
const SEVERITY_COLOR = {
  mild:     { color: 'var(--attn)',   bg: 'var(--attn-bg)'   },
  moderate: { color: 'var(--elev)',   bg: 'var(--elev-bg)'   },
  severe:   { color: 'var(--danger)', bg: 'var(--danger-bg)' },
}

function categoryOf(code, contextTypes) {
  return contextTypes.find((t) => t.code === code)?.category || 'custom'
}

function ActiveContextCard({ ctx, onClose, contextTypes }) {
  const cat  = categoryOf(ctx.code, contextTypes)
  const meta = CATEGORY_META[cat] || CATEGORY_META.custom
  const Icon = meta.icon
  const sev  = ctx.severity ? SEVERITY_COLOR[ctx.severity] : null

  const start = ctx.start_date ? format(parseISO(ctx.start_date), 'dd/MM/yyyy') : '—'
  const end   = ctx.end_date   ? format(parseISO(ctx.end_date),   'dd/MM/yyyy') : 'em aberto'

  return (
    <div className="rounded-xl p-4 flex gap-4 items-start" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${meta.color}` }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-raised)' }}>
        <Icon className="w-4.5 h-4.5" style={{ color: meta.color, width: 18, height: 18 }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-semibold text-sm" style={{ color: 'var(--text-pri)' }}>{ctx.name}</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ color: meta.color, background: `${meta.color}1A` }}>
            {meta.label}
          </span>
          {sev && (
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ color: sev.color, background: sev.bg }}>
              {SEVERITY_LABEL[ctx.severity]}
            </span>
          )}
        </div>
        <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{start} → {end}</p>
        {ctx.notes && (
          <p className="text-sm mt-1 leading-snug line-clamp-2" style={{ color: 'var(--text-sec)' }}>{ctx.notes}</p>
        )}
      </div>

      <button
        onClick={() => onClose(ctx.id)}
        className="flex-shrink-0 p-1.5 rounded-lg transition-colors"
        style={{ color: 'var(--text-muted)' }}
        title="Encerrar contexto"
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-bg)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

function TypeSelector({ contextTypes, selected, onSelect }) {
  const grouped = contextTypes.reduce((acc, t) => {
    const cat = t.category || 'custom'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(t)
    return acc
  }, {})

  const ORDER = ['health', 'life_event', 'work', 'physical', 'custom']
  const sorted = ORDER.filter((c) => grouped[c])

  return (
    <div className="space-y-4">
      {sorted.map((cat) => {
        const meta = CATEGORY_META[cat] || CATEGORY_META.custom
        const Icon = meta.icon

        return (
          <div key={cat}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <Icon style={{ color: meta.color, width: 12, height: 12 }} />
              {meta.label}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {grouped[cat].map((t) => {
                const isSelected = selected === t.code
                return (
                  <button
                    key={t.code}
                    type="button"
                    onClick={() => onSelect(t.code)}
                    className="text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-150"
                    style={
                      isSelected
                        ? { background: `${meta.color}18`, border: `1px solid ${meta.color}55`, color: 'var(--text-pri)', fontWeight: 600 }
                        : { background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-sec)' }
                    }
                    onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = 'var(--border-mid)'; e.currentTarget.style.color = 'var(--text-pri)' } }}
                    onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-sec)' } }}
                  >
                    {t.name}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Contexts() {
  const navigate  = useNavigate()
  const user      = useAuthStore((s) => s.user)
  const addToast  = useToastStore((s) => s.addToast)
  const { contextTypes, activeContexts, isLoading, fetchTypes, fetchActive, addContext, closeContext } = useContextStore()

  const [selectedCode, setSelectedCode] = useState('')
  const [notes,        setNotes]        = useState('')
  const [startDate,    setStartDate]    = useState(() => new Date().toISOString().slice(0, 10))
  const [endDate,      setEndDate]      = useState('')
  const [severity,     setSeverity]     = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const { isDark, toggle: toggleTheme } = useThemeStore()

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchTypes()
    fetchActive()
  }, [])

  const selectedType = contextTypes.find((t) => t.code === selectedCode)
  const isCustom     = selectedCode === 'custom'

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedCode) { addToast('error', 'Selecione o tipo de situação.'); return }
    if (isCustom && !notes.trim()) { addToast('error', 'Para "Outra Situação", descreva o contexto nas notas.'); return }
    setSubmitting(true)
    try {
      await addContext({ contextCode: selectedCode, startDate, endDate: endDate || undefined, severity: severity || undefined, notes: notes.trim() || undefined })
      addToast('success', 'Contexto registrado com sucesso!')
      setSelectedCode(''); setNotes(''); setStartDate(new Date().toISOString().slice(0, 10)); setEndDate(''); setSeverity('')
      fetchActive()
    } catch (err) {
      addToast('error', err.message || 'Erro ao registrar contexto')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleClose(id) {
    try { await closeContext(id); addToast('success', 'Contexto encerrado.') }
    catch { addToast('error', 'Não foi possível encerrar o contexto.') }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-deep)' }}>
      {/* Header */}
      <header className="sticky top-0 z-30" style={{ background: 'var(--header-blur)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center gap-4">
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
              <h1 className="text-base font-bold leading-none" style={{ color: 'var(--text-pri)' }}>
                Contextos de Vida
              </h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Situações que influenciam sua saúde mental</p>
            </div>
          </div>
          <button onClick={toggleTheme} className="btn-ghost p-2 rounded-xl" title={isDark ? 'Modo claro' : 'Modo escuro'}>
            {isDark ? <Sun className="w-4 h-4" style={{ color: 'var(--attn)' }} /> : <Moon className="w-4 h-4" style={{ color: 'var(--accent)' }} />}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8 space-y-8">

        {/* Active contexts */}
        <section>
          <div className="flex items-center gap-2.5 mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Contextos Ativos</p>
            {activeContexts.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'var(--bg-raised)', color: 'var(--text-sec)' }}>
                {activeContexts.length}
              </span>
            )}
          </div>

          {isLoading && activeContexts.length === 0 ? (
            <div className="card text-center py-8" style={{ color: 'var(--text-muted)' }}>Carregando...</div>
          ) : activeContexts.length === 0 ? (
            <div className="card text-center py-10" style={{ borderStyle: 'dashed' }}>
              <Layers className="w-9 h-9 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-sec)' }}>Nenhum contexto ativo.</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Adicione situações relevantes para melhorar a precisão da análise.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeContexts.map((ctx) => (
                <ActiveContextCard key={ctx.id} ctx={ctx} onClose={handleClose} contextTypes={contextTypes} />
              ))}
            </div>
          )}
        </section>

        {/* Form */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
            Registrar Situação
          </p>

          <form onSubmit={handleSubmit} className="card space-y-6">
            {/* Type selector */}
            <div>
              <label className="label">Tipo de situação <span style={{ color: 'var(--danger)' }}>*</span></label>
              {contextTypes.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Carregando tipos...</p>
              ) : (
                <TypeSelector contextTypes={contextTypes} selected={selectedCode} onSelect={setSelectedCode} />
              )}
              {selectedType && !isCustom && (
                <p className="text-xs mt-2 italic" style={{ color: 'var(--text-muted)' }}>{selectedType.impact_description}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="label">
                {isCustom ? <>Descreva a situação <span style={{ color: 'var(--danger)' }}>*</span></> : 'Detalhes pessoais (opcional)'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder={isCustom
                  ? 'Descreva a situação. Ex: "Início de nova medicação. Mudei de cidade há 2 semanas."'
                  : 'Ex: Relatório médico indica recuperação. Viagem a trabalho por 5 dias...'}
                className="input-field text-sm leading-relaxed"
              />
              <p className="text-xs text-right mt-1" style={{ color: 'var(--text-muted)' }}>{notes.length}/1000</p>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Início <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field text-sm" required />
              </div>
              <div>
                <label className="label">Fim <span style={{ color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>(opcional)</span></label>
                <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className="input-field text-sm" />
              </div>
            </div>

            {/* Severity */}
            <div>
              <label className="label">Intensidade <span style={{ color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>(opcional)</span></label>
              <div className="flex gap-2">
                {[
                  { value: 'mild',     label: 'Leve',    color: 'var(--attn)',   bg: 'var(--attn-bg)'   },
                  { value: 'moderate', label: 'Moderado', color: 'var(--elev)',  bg: 'var(--elev-bg)'   },
                  { value: 'severe',   label: 'Grave',   color: 'var(--danger)', bg: 'var(--danger-bg)' },
                ].map(({ value, label, color, bg }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSeverity(severity === value ? '' : value)}
                    className="flex-1 py-2.5 text-sm rounded-xl border font-medium transition-all duration-150"
                    style={
                      severity === value
                        ? { background: bg, border: `1px solid ${color}55`, color }
                        : { background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedCode}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              {submitting ? 'Registrando...' : 'Registrar Contexto'}
            </button>
          </form>
        </section>

        {/* Info box */}
        <div className="rounded-xl px-5 py-4 text-sm leading-relaxed" style={{ background: 'var(--jade-glow)', border: '1px solid rgba(45,212,191,0.2)', color: 'var(--text-sec)' }}>
          <p className="font-semibold mb-1" style={{ color: 'var(--jade)' }}>Como os contextos são usados</p>
          <p>
            Situações como doenças, férias ou eventos de vida ajudam o sistema a interpretar
            variações nos seus sinais com mais precisão. Um HRV mais baixo durante uma doença,
            por exemplo, não indica o mesmo risco que em um dia normal.
          </p>
          <p className="mt-2">
            O algoritmo de risco ajusta dinamicamente os pesos de cada sinal conforme
            os contextos ativos, evitando falsos alertas em situações esperadas.
          </p>
        </div>
      </main>
    </div>
  )
}
