// src/pages/Welcome.jsx — Landing page pública
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import {
  Activity, Brain, ShieldCheck, LineChart, Watch, Sparkles,
  ArrowRight, PlayCircle, AlertCircle, Heart, Stethoscope
} from 'lucide-react'

function MindGuardLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9.5 4A2.5 2.5 0 0 1 12 6.5v11a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 4Z" fill="var(--jade)" />
      <path d="M14.5 4A2.5 2.5 0 0 0 12 6.5v11a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 4Z" fill="var(--jade)" fillOpacity="0.78" />
    </svg>
  )
}

export default function Welcome() {
  const navigate = useNavigate()
  const loginDemo = useAuthStore((s) => s.loginDemo)
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoError, setDemoError] = useState('')

  const handleDemo = async () => {
    setDemoLoading(true)
    setDemoError('')
    try {
      await loginDemo()
      navigate('/dashboard')
    } catch (e) {
      setDemoError('Não foi possível carregar a demo. Tente em alguns segundos.')
    } finally {
      setDemoLoading(false)
    }
  }

  const handleDoctorDemo = async () => {
    setDemoLoading(true)
    setDemoError('')
    try {
      await loginDemo()
      sessionStorage.setItem('mg_doctor_mode', '1')
      navigate('/medico/pacientes')
    } catch (e) {
      setDemoError('Não foi possível carregar a demo. Tente em alguns segundos.')
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-deep)', color: 'var(--text-pri)' }}>
      {/* Ambient rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none -z-0">
        <div className="ring-breathe absolute w-[420px] h-[420px] rounded-full border" style={{ borderColor: 'var(--jade)' }} />
        <div className="ring-breathe2 absolute w-[820px] h-[820px] rounded-full border" style={{ borderColor: 'var(--jade)' }} />
        <div className="absolute w-[1100px] h-[1100px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(45,212,191,0.06) 0%, transparent 65%)' }} />
      </div>

      {/* NAV */}
      <header className="relative z-10 max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MindGuardLogo size={32} />
          <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Nunito, system-ui, sans-serif', fontWeight: 800 }}>
            MindGuard
          </span>
        </div>
        <nav className="flex items-center gap-2 sm:gap-4">
          <a href="#como-funciona" className="hidden sm:inline text-sm px-3 py-2 rounded-lg hover:bg-white/5 transition" style={{ color: 'var(--text-muted)' }}>
            Como funciona
          </a>
          <Link to="/empresa" className="hidden sm:inline text-sm px-3 py-2 rounded-lg hover:bg-white/5 transition" style={{ color: 'var(--text-muted)' }}>
            Para empresas
          </Link>
          <Link to="/login" className="text-sm px-4 py-2 rounded-lg hover:bg-white/5 transition" style={{ color: 'var(--text-pri)' }}>
            Entrar
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-12 pb-20 sm:pt-20 sm:pb-28 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 animate-fade-up" style={{ background: 'rgba(45,212,191,0.10)', border: '1px solid rgba(45,212,191,0.30)' }}>
          <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--jade)' }} />
          <span className="text-xs font-semibold tracking-wide" style={{ color: 'var(--jade)' }}>
            FIAP × CarePlus · Challenges 2026
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05] mb-6 animate-fade-up" style={{ fontFamily: 'Nunito, system-ui, sans-serif', fontWeight: 800 }}>
          Detectamos o burnout
          <br />
          <span style={{ color: 'var(--jade)' }}>antes da crise.</span>
        </h1>

        <p className="text-base sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up" style={{ color: 'var(--text-muted)' }}>
          MindGuard combina sinais biométricos, questionários clínicos validados e contexto de vida para identificar risco de saúde mental{' '}
          <strong style={{ color: 'var(--text-pri)' }}>7 a 14 dias antes</strong>{' '}
          da pessoa pedir ajuda.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center animate-fade-up">
          <button
            onClick={handleDemo}
            disabled={demoLoading}
            className="btn-primary inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base w-full sm:w-auto"
          >
            {demoLoading ? (
              <>Carregando demo...</>
            ) : (
              <>
                <PlayCircle className="w-5 h-5" />
                Ver demonstração ao vivo
              </>
            )}
          </button>
          <Link to="/register" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base rounded-xl w-full sm:w-auto transition" style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-pri)' }}>
            Criar conta
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Doctor demo secondary CTA */}
        <div className="mt-4 animate-fade-up">
          <button
            onClick={handleDoctorDemo}
            disabled={demoLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-full transition hover:opacity-80"
            style={{ background: 'rgba(129,140,248,0.10)', border: '1px solid rgba(129,140,248,0.30)', color: '#818CF8' }}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            Modo médico (portal CarePlus)
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {demoError && (
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
            <AlertCircle className="w-4 h-4" /> {demoError}
          </div>
        )}

        <p className="text-xs mt-8" style={{ color: 'var(--text-muted)' }}>
          A demo carrega um colaborador fictício com 90 dias de sinais reais, sem precisar criar conta.
        </p>
      </section>

      {/* PROBLEMA */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat number="32%" label="dos brasileiros sofrem de burnout" source="ISMA-BR, 2024" />
          <Stat number="R$ 282 bi" label="custo anual de afastamentos por saúde mental" source="OMS · Brasil" />
          <Stat number="60 dias" label="tempo médio para uma crise ser detectada hoje" source="estudo CarePlus" />
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="relative z-10 max-w-6xl mx-auto px-6 pb-20 sm:pb-28">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3" style={{ fontFamily: 'Nunito, system-ui, sans-serif', fontWeight: 800 }}>
            Como o MindGuard funciona
          </h2>
          <p className="text-base sm:text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            Três fontes de dados se cruzam para gerar um score de risco confiável, não um diagnóstico isolado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <FeatureCard
            icon={<Watch className="w-6 h-6" />}
            title="1. Sinais biométricos"
            text="HRV, frequência cardíaca, sono, energia, humor e estresse. Capturados por wearables (Apple Watch, Galaxy Watch) ou inseridos manualmente."
          />
          <FeatureCard
            icon={<Brain className="w-6 h-6" />}
            title="2. Questionários clínicos"
            text="PSS-10, GAD-7, CBI, OLBI e Check-in Diário. Escalas validadas internacionalmente para estresse, ansiedade e burnout."
          />
          <FeatureCard
            icon={<Activity className="w-6 h-6" />}
            title="3. Contexto de vida"
            text="Deadlines, viagens, doenças ou eventos pessoais que ajustam dinamicamente os pesos do algoritmo de risco."
          />
        </div>

        <div className="mt-10 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center" style={{ background: 'rgba(20,30,44,0.65)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex-1">
            <div className="text-xs font-semibold tracking-wider mb-2" style={{ color: 'var(--jade)' }}>
              ALGORITMO PROPRIETÁRIO
            </div>
            <h3 className="text-xl font-bold mb-2">Baseline personalizada, não populacional</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Cada usuário tem sua linha de base calculada por mediana + IQR sobre 7 a 14 dias. Detectamos desvios de <strong style={{ color: 'var(--text-pri)' }}>15%</strong> e quando 2 ou mais sinais convergem para risco, o score escala. Sem isso, valores "normais para a média" mascariam crises de pessoas com baseline naturalmente alta.
            </p>
          </div>
          <div className="flex-shrink-0 w-full md:w-auto">
            <div className="rounded-xl px-5 py-4 text-center" style={{ background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.30)' }}>
              <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Score de risco do demo</div>
              <div className="text-4xl font-bold" style={{ color: 'var(--danger)' }}>68</div>
              <div className="text-xs mt-1" style={{ color: 'var(--danger)' }}>Risco Elevado</div>
            </div>
          </div>
        </div>
      </section>

      {/* PARA EMPRESAS */}
      <section id="para-empresas" className="relative z-10 max-w-6xl mx-auto px-6 pb-20 sm:pb-28">
        <div className="rounded-2xl p-8 sm:p-12" style={{ background: 'linear-gradient(135deg, rgba(45,212,191,0.08), rgba(20,30,44,0.6))', border: '1px solid rgba(45,212,191,0.25)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="text-xs font-semibold tracking-wider mb-3" style={{ color: 'var(--jade)' }}>
                SAÚDE CORPORATIVA
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4" style={{ fontFamily: 'Nunito, system-ui, sans-serif', fontWeight: 800 }}>
                Pensado para o ecossistema CarePlus
              </h2>
              <p className="text-base leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
                Integração nativa com o cadastro de beneficiários CarePlus. RH e medicina ocupacional recebem indicadores agregados e anônimos, sem ferir privacidade individual.
              </p>
              <ul className="space-y-3 text-sm mb-6">
                <Bullet>Indicadores agregados por unidade, departamento e cargo</Bullet>
                <Bullet>Bot nativo no Microsoft Teams para check-in diário</Bullet>
                <Bullet>Encaminhamento automático para a rede CarePlus quando risco é alto</Bullet>
                <Bullet>Prescrições digitais com auditoria SHA-256</Bullet>
              </ul>
              <Link to="/empresa" className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition" style={{ background: 'var(--jade)', color: '#001b18' }}>
                Ver dashboard executivo
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniMetric icon={<Heart className="w-5 h-5" />} label="Colaboradores monitorados" value="247" />
              <MiniMetric icon={<LineChart className="w-5 h-5" />} label="Em risco moderado" value="38" />
              <MiniMetric icon={<ShieldCheck className="w-5 h-5" />} label="Encaminhamentos no mês" value="12" />
              <MiniMetric icon={<Activity className="w-5 h-5" />} label="Tempo médio até intervenção" value="2.4d" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4" style={{ fontFamily: 'Nunito, system-ui, sans-serif', fontWeight: 800 }}>
          Veja como funciona em 60 segundos
        </h2>
        <p className="text-base mb-8" style={{ color: 'var(--text-muted)' }}>
          Abra a demonstração com um colaborador fictício já populado com 90 dias de dados, questionários respondidos e contexto ativo.
        </p>
        <button
          onClick={handleDemo}
          disabled={demoLoading}
          className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-4 text-base"
        >
          {demoLoading ? 'Carregando demo...' : (
            <>
              <PlayCircle className="w-5 h-5" />
              Iniciar demonstração
            </>
          )}
        </button>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-2">
            <MindGuardLogo size={20} />
            <span>MindGuard · FIAP Challenges 2026 · Care Plus</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#como-funciona" className="hover:text-white transition">Como funciona</a>
            <a href="#para-empresas" className="hover:text-white transition">Para empresas</a>
            <Link to="/login" className="hover:text-white transition">Entrar</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Stat({ number, label, source }) {
  return (
    <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(20,30,44,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: 'var(--jade)', fontFamily: 'Nunito, system-ui, sans-serif', fontWeight: 800 }}>
        {number}
      </div>
      <div className="text-sm mb-2" style={{ color: 'var(--text-pri)' }}>{label}</div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{source}</div>
    </div>
  )
}

function FeatureCard({ icon, title, text }) {
  return (
    <div className="rounded-2xl p-6" style={{ background: 'rgba(20,30,44,0.55)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="inline-flex w-11 h-11 items-center justify-center rounded-xl mb-4" style={{ background: 'rgba(45,212,191,0.12)', color: 'var(--jade)' }}>
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{text}</p>
    </div>
  )
}

function MiniMetric({ icon, label, value }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'rgba(10,18,28,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-center justify-between mb-2" style={{ color: 'var(--jade)' }}>
        {icon}
      </div>
      <div className="text-2xl font-bold" style={{ color: 'var(--text-pri)' }}>{value}</div>
      <div className="text-xs mt-1 leading-tight" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </div>
  )
}

function Bullet({ children }) {
  return (
    <li className="flex items-start gap-2.5">
      <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--jade)' }} />
      <span style={{ color: 'var(--text-pri)' }}>{children}</span>
    </li>
  )
}
