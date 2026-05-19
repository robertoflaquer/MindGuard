// src/components/Toast.jsx
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { useToastStore } from '../store/useToastStore'

const CONFIGS = {
  success: { icon: CheckCircle, color: 'var(--stable)', accent: 'var(--stable-bg)' },
  error:   { icon: XCircle,     color: 'var(--danger)', accent: 'var(--danger-bg)' },
  info:    { icon: Info,        color: 'var(--jade)',   accent: 'var(--jade-glow)' },
}

function ToastItem({ toast }) {
  const removeToast = useToastStore((s) => s.removeToast)
  const cfg  = CONFIGS[toast.type] || CONFIGS.info
  const Icon = cfg.icon

  return (
    <div
      className="flex items-start gap-3 px-4 py-3.5 rounded-xl max-w-sm w-full animate-slide-in"
      style={{
        background: 'var(--bg-card)',
        border: `1px solid var(--border-mid)`,
        borderLeft: `3px solid ${cfg.color}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: cfg.color }} />
      <p className="text-sm flex-1 leading-snug" style={{ color: 'var(--text-sec)' }}>{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 transition-colors"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-pri)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export default function Toast() {
  const toasts = useToastStore((s) => s.toasts)
  if (!toasts.length) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 items-end">
      {toasts.map((t) => <ToastItem key={t.id} toast={t} />)}
    </div>
  )
}
