// src/components/PushNotificationDemo.jsx
// Simula uma push notification estilo iOS — aparece 10s após mount.
// Conteúdo é contextual ao risco atual + sinais detectados.
import { useEffect, useState } from 'react'
import { X, Wind } from 'lucide-react'

const SESSION_KEY = 'mg_push_shown_at'
const COOLDOWN_MS = 5 * 60 * 1000 // 5 min — re-show during long demos
const DELAY_MS = 10_000
const AUTO_DISMISS_MS = 12_000

function MindGuardIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="36" rx="9" fill="url(#mgGrad)" />
      <path d="M11 18c0-3 2-5 5-5 1.5 0 2.5.6 3 1.5.5-.9 1.5-1.5 3-1.5 3 0 5 2 5 5 0 4.5-8 9-8 9s-8-4.5-8-9z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
      <defs>
        <linearGradient id="mgGrad" x1="0" y1="0" x2="36" y2="36">
          <stop stopColor="#A78BFA" />
          <stop offset="1" stopColor="#2DD4BF" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function PushNotificationDemo({ risk, onAction }) {
  const [visible, setVisible] = useState(false)
  const [entering, setEntering] = useState(false)

  useEffect(() => {
    const last = parseInt(sessionStorage.getItem(SESSION_KEY) || '0', 10)
    if (Date.now() - last < COOLDOWN_MS) return

    const showTimer = setTimeout(() => {
      setVisible(true)
      sessionStorage.setItem(SESSION_KEY, String(Date.now()))
      requestAnimationFrame(() => setEntering(true))
    }, DELAY_MS)

    return () => clearTimeout(showTimer)
  }, [])

  useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => dismiss(), AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [visible])

  function dismiss() {
    setEntering(false)
    setTimeout(() => setVisible(false), 280)
  }

  function handleAction() {
    dismiss()
    onAction?.()
  }

  if (!visible) return null

  const score = risk ? Math.round(parseFloat(risk.risk_score)) : null
  const isElevated = score != null && score >= 60

  const title = 'MindGuard'
  const body = isElevated
    ? 'Detectamos sinais de tensão sustentada. 5 min de respiração agora reduzem cortisol em 18%.'
    : 'Hora do check-in: registre como você está se sentindo agora.'

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 'env(safe-area-inset-top, 0px)',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        padding: '12px 14px 0 14px',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <div
        onClick={handleAction}
        style={{
          pointerEvents: 'auto',
          cursor: 'pointer',
          width: '100%',
          maxWidth: 420,
          background: 'rgba(28, 28, 30, 0.86)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 16,
          padding: '12px 14px',
          color: 'white',
          boxShadow: '0 14px 40px rgba(0,0,0,0.45)',
          transform: entering ? 'translateY(0) scale(1)' : 'translateY(-120%) scale(0.96)',
          opacity: entering ? 1 : 0,
          transition: 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flexShrink: 0 }}>
            <MindGuardIcon />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.95)' }}>
                {title}
              </span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>agora</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35, marginBottom: 2 }}>
              {isElevated ? 'Pausa consciente recomendada' : 'Check-in diário'}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.4, color: 'rgba(255,255,255,0.85)' }}>
              {body}
            </div>
            {isElevated && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, color: '#5EEAD4', fontSize: 12, fontWeight: 600 }}>
                <Wind style={{ width: 12, height: 12 }} />
                Toque para iniciar respiração guiada
              </div>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); dismiss() }}
            aria-label="Dispensar notificação"
            style={{
              flexShrink: 0,
              background: 'rgba(255,255,255,0.10)',
              border: 'none',
              borderRadius: '50%',
              width: 22,
              height: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            <X style={{ width: 12, height: 12 }} />
          </button>
        </div>
      </div>
    </div>
  )
}
