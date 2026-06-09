// src/pages/Connect.jsx
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useThemeStore } from '../store/useThemeStore'
import { useToastStore } from '../store/useToastStore'
import { useRiskStore } from '../store/useRiskStore'
import api from '../services/api'
import {
  ArrowLeft, Sun, Moon, Upload, CheckCircle, AlertCircle,
  Smartphone, FileText, Loader, ChevronRight, RefreshCw,
} from 'lucide-react'

function MindGuardLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9.5 4A2.5 2.5 0 0 1 12 6.5v11a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 4Z" fill="var(--jade)" />
      <path d="M14.5 4A2.5 2.5 0 0 0 12 6.5v11a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 4Z" fill="var(--jade)" fillOpacity="0.78" />
    </svg>
  )
}

const STEPS = [
  { n: 1, title: 'Abra o app Saúde no iPhone', desc: 'O ícone é um coração branco em fundo rosa. Você o encontra na tela inicial.' },
  { n: 2, title: 'Toque no seu perfil (canto superior direito)', desc: 'É o círculo com sua foto ou iniciais no canto superior direito da tela.' },
  { n: 3, title: 'Role para baixo e toque em "Exportar todos os dados de saúde"', desc: 'Fica na seção "Dados de saúde". O iOS levará alguns segundos para preparar o arquivo.' },
  { n: 4, title: 'Salve o arquivo ZIP no seu dispositivo', desc: 'Escolha "Salvar em Arquivos" e anote onde salvou. O ZIP contém o arquivo export.xml.' },
  { n: 5, title: 'Extraia e envie o arquivo export.xml aqui', desc: 'Descompacte o ZIP e selecione o arquivo export.xml. Não precisa enviar o ZIP inteiro.' },
]

const SIGNAL_LABELS = {
  HRV:            'Variabilidade Cardíaca (HRV)',
  HR_resting:     'FC em Repouso',
  sleep_duration: 'Duração do Sono',
  sleep_quality:  'Qualidade do Sono',
  steps:          'Passos Diários',
  spo2:           'Saturação O₂',
}

export default function Connect() {
  const navigate   = useNavigate()
  const { isDark, toggle: toggleTheme } = useThemeStore()
  const { addToast } = useToastStore()
  const { fetchCurrentRisk } = useRiskStore()

  const fileInputRef = useRef(null)
  const [dragOver, setDragOver]   = useState(false)
  const [file, setFile]           = useState(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult]       = useState(null)
  const [error, setError]         = useState(null)

  function handleFile(f) {
    if (!f) return
    if (!f.name.endsWith('.xml') && !f.name.endsWith('.zip')) {
      setError('Envie o arquivo export.xml (ou o ZIP contendo ele).')
      return
    }
    setFile(f)
    setError(null)
    setResult(null)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    handleFile(f)
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/api/wearables/apple-health/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      })
      setResult(res.data.data)
      addToast('success', `${res.data.data.imported} registros importados com sucesso!`)
      // Trigger risk refresh after 5s
      setTimeout(() => fetchCurrentRisk(), 5000)
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro ao importar. Verifique se o arquivo é o export.xml correto.'
      setError(msg)
      addToast('error', msg)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-pri)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 px-5 py-3.5"
        style={{ background: 'var(--header-blur)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="btn-ghost p-2 rounded-xl">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <MindGuardLogo />
              <span className="font-bold text-sm" style={{ color: 'var(--text-pri)' }}>MindGuard</span>
            </div>
            <div className="w-px h-4 mx-1" style={{ background: 'var(--border-mid)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--jade)' }}>Conectar Apple Health</span>
          </div>
          <button onClick={toggleTheme} className="btn-ghost p-2 rounded-xl">
            {isDark ? <Sun className="w-4 h-4" style={{ color: 'var(--attn)' }} /> : <Moon className="w-4 h-4" style={{ color: 'var(--accent)' }} />}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8 space-y-8">

        {/* Hero */}
        <section className="text-center space-y-3 animate-fade-up">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl"
            style={{ background: 'rgba(45,212,191,0.12)', border: '1px solid rgba(45,212,191,0.25)' }}>
            🍎
          </div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-pri)' }}>
            Importe seus dados do Apple Watch
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-sec)' }}>
            Conecte dados reais de HRV, sono, frequência cardíaca e passos para uma análise de risco muito mais precisa.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {['HRV', 'Sono', 'FC Repouso', 'Passos'].map(label => (
              <span key={label} className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(45,212,191,0.1)', color: 'var(--jade)', border: '1px solid rgba(45,212,191,0.2)' }}>
                {label}
              </span>
            ))}
          </div>
        </section>

        {/* Success state */}
        {result && (
          <section className="rounded-2xl p-6 space-y-4 animate-fade-up"
            style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.3)' }}>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6" style={{ color: 'var(--jade)' }} />
              <div>
                <p className="font-bold" style={{ color: 'var(--jade)' }}>Importação concluída!</p>
                <p className="text-sm" style={{ color: 'var(--text-sec)' }}>{result.message}</p>
              </div>
            </div>
            {result.summary?.by_type && (
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(result.summary.by_type).map(([type, count]) => (
                  <div key={type} className="rounded-xl px-3 py-2 flex justify-between items-center"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <span className="text-xs" style={{ color: 'var(--text-sec)' }}>{SIGNAL_LABELS[type] || type}</span>
                    <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--jade)' }}>{count}</span>
                  </div>
                ))}
              </div>
            )}
            {result.summary?.date_range && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Período: {result.summary.date_range}
              </p>
            )}
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Ver análise atualizada no Dashboard
            </button>
          </section>
        )}

        {/* Upload area */}
        {!result && (
          <>
            <section className="animate-fade-up">
              <div
                className="rounded-2xl p-8 text-center transition-all cursor-pointer"
                style={{
                  border: `2px dashed ${dragOver ? 'var(--jade)' : 'var(--border)'}`,
                  background: dragOver ? 'rgba(45,212,191,0.06)' : 'var(--bg-card)',
                }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xml,.zip"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
                {file ? (
                  <div className="space-y-2">
                    <FileText className="w-8 h-8 mx-auto" style={{ color: 'var(--jade)' }} />
                    <p className="font-semibold" style={{ color: 'var(--text-pri)' }}>{file.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {(file.size / 1024 / 1024).toFixed(1)} MB · Clique para trocar
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-8 h-8 mx-auto" style={{ color: 'var(--text-muted)' }} />
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--text-pri)' }}>Arraste o export.xml aqui</p>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>ou clique para selecionar o arquivo</p>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Aceita .xml ou .zip · Máximo 50 MB</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-3 flex items-start gap-2 rounded-xl px-4 py-3"
                  style={{ background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--danger)' }} />
                  <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full btn-primary mt-4 py-3.5 flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Processando... (pode levar alguns segundos)
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Importar dados do Apple Health
                  </>
                )}
              </button>
            </section>

            {/* Step-by-step instructions */}
            <section className="space-y-3 animate-fade-up">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" style={{ color: 'var(--jade)' }} />
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--jade)' }}>
                  Como exportar do iPhone
                </p>
              </div>
              <div className="space-y-2">
                {STEPS.map((step) => (
                  <div key={step.n} className="flex gap-3 rounded-xl p-4"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                      style={{ background: 'rgba(45,212,191,0.15)', color: 'var(--jade)' }}>
                      {step.n}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-pri)' }}>{step.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Privacy note */}
        <section className="rounded-2xl p-4 space-y-1 animate-fade-up"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--text-sec)' }}>🔒 Privacidade e Segurança</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Seu arquivo é processado no servidor e os dados extraídos ficam vinculados apenas à sua conta.
            O arquivo original não é armazenado — apenas os valores numéricos são salvos.
            Você pode excluir seus dados a qualquer momento nas configurações.
          </p>
        </section>

      </main>
    </div>
  )
}
