// src/components/ErrorBoundary.jsx
import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-deep)' }}>
        <div className="rounded-2xl p-8 max-w-md w-full text-center" style={{ background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--danger)' }} />
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Nunito, system-ui, sans-serif', fontWeight: 800, color: 'var(--text-pri)' }}>
            Algo deu errado
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            {this.state.error?.message || 'Erro inesperado. Tente recarregar a página.'}
          </p>
          <button onClick={() => window.location.reload()} className="btn-primary px-6 py-2">
            Recarregar página
          </button>
        </div>
      </div>
    )
  }
}
