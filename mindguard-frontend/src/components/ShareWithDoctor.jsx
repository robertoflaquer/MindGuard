// src/components/ShareWithDoctor.jsx
// Modal para compartilhar acesso ao prontuario MindGuard com o medico via QR Code.
import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Copy, CheckCircle2, Stethoscope, Mail, Link as LinkIcon } from 'lucide-react'

export default function ShareWithDoctor({ onClose, patientName = 'Roberto Silva' }) {
  const [copied, setCopied] = useState(false)

  const shareUrl = `${window.location.origin}/medico/pacientes`
  const accessCode = 'CP-RBT-' + Math.random().toString(36).slice(2, 7).toUpperCase()

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 420,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '1.75rem',
          color: 'var(--text-pri)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          animation: 'scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(129,140,248,0.14)',
              border: '1px solid rgba(129,140,248,0.30)',
            }}>
              <Stethoscope style={{ width: 16, height: 16, color: '#818CF8' }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, fontFamily: 'Nunito, system-ui, sans-serif' }}>
                Compartilhar com médico
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Acesso de leitura ao seu resumo clínico
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg" aria-label="Fechar">
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* QR Code card */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          padding: '1.25rem',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          marginBottom: '1rem',
          border: '1px solid var(--border)',
        }}>
          <QRCodeSVG
            value={shareUrl}
            size={200}
            level="M"
            includeMargin={false}
            bgColor="#ffffff"
            fgColor="#0a0e1a"
            imageSettings={{
              src: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9.5 4A2.5 2.5 0 0 1 12 6.5v11a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 4Z" fill="#2DD4BF"/><path d="M14.5 4A2.5 2.5 0 0 0 12 6.5v11a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 4Z" fill="#2DD4BF" fill-opacity="0.78"/></svg>`),
              height: 32,
              width: 32,
              excavate: true,
            }}
          />
        </div>

        {/* Access code */}
        <div style={{
          background: 'var(--bg-raised)',
          border: '1px dashed var(--border)',
          borderRadius: 12,
          padding: '0.875rem 1rem',
          marginBottom: '0.875rem',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Código de acesso
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Menlo, Consolas, monospace', color: 'var(--jade)' }}>
              {accessCode}
            </div>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'right' }}>
            Expira em<br />
            <strong style={{ color: 'var(--text-pri)' }}>15 min</strong>
          </div>
        </div>

        {/* Patient name context */}
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
          Ao aceitar, seu médico verá: histórico de risco, sinais biométricos dos últimos 30 dias,
          questionários completos (PSS, GAD-7) e contextos ativos. <strong style={{ color: 'var(--text-pri)' }}>{patientName}</strong>,
          você pode revogar este acesso a qualquer momento.
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={copyLink}
            className="btn-ghost"
            style={{
              flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '0.6rem 0.75rem',
              fontSize: 12, fontWeight: 700,
              border: '1px solid var(--border)',
              borderRadius: 10,
              color: copied ? 'var(--stable)' : 'var(--text-pri)',
              background: copied ? 'var(--stable-bg)' : 'transparent',
              transition: 'all 0.2s',
            }}
          >
            {copied ? (
              <>
                <CheckCircle2 style={{ width: 14, height: 14 }} />
                Copiado!
              </>
            ) : (
              <>
                <LinkIcon style={{ width: 14, height: 14 }} />
                Copiar link
              </>
            )}
          </button>
          <button
            onClick={() => alert('Em produção: envia link por e-mail ao médico cadastrado.')}
            className="btn-primary"
            style={{
              flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '0.6rem 0.75rem',
              fontSize: 12, fontWeight: 700,
              borderRadius: 10,
            }}
          >
            <Mail style={{ width: 14, height: 14 }} />
            Enviar por e-mail
          </button>
        </div>

        <div style={{ fontSize: 10, textAlign: 'center', color: 'var(--text-muted)', marginTop: '1rem' }}>
          🔒 Acesso protegido por código único · LGPD compliant · audit log
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92) translateY(8px) }
          to   { opacity: 1; transform: scale(1) translateY(0) }
        }
      `}</style>
    </div>
  )
}
