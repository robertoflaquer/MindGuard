// src/pages/Enterprise.jsx — Visão executiva B2B do MindGuard
// Página de DEMONSTRAÇÃO com dados mockados — mostra como o produto pode
// servir RH/saúde corporativa em uma futura iteração B2B.
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Users, AlertTriangle, TrendingDown, TrendingUp,
  Activity, Building2, Sparkles, Shield, MessageSquare,
  BellRing, ChevronRight, CheckCircle2, Clock
} from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, BarChart, Bar
} from 'recharts'

function MindGuardLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9.5 4A2.5 2.5 0 0 1 12 6.5v11a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 4Z" fill="var(--jade)" />
      <path d="M14.5 4A2.5 2.5 0 0 0 12 6.5v11a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 4Z" fill="var(--jade)" fillOpacity="0.78" />
    </svg>
  )
}

// ============ MOCK DATA ============
const COMPANY = { name: 'Vértice Tecnologia S.A.', plan: 'CarePlus Empresarial Premium' }

const OVERVIEW = [
  { label: 'Colaboradores monitorados',     value: 247, delta: '+12 este mês', icon: <Users className="w-5 h-5" />,        tone: 'jade'   },
  { label: 'Em risco moderado',             value: 38,  delta: '15,4% do total', icon: <Activity className="w-5 h-5" />,   tone: 'attn'   },
  { label: 'Em risco alto',                 value: 7,   delta: '↓ 3 vs mês ant.', icon: <AlertTriangle className="w-5 h-5"/>, tone: 'danger' },
  { label: 'Aderência semanal',             value: '89%', delta: '+4% vs meta',  icon: <CheckCircle2 className="w-5 h-5"/>, tone: 'jade'   },
]

const DEPARTMENTS = [
  { name: 'Vendas',        count: 52, risk: 28, color: '#ef4444' },
  { name: 'Financeiro',    count: 15, risk: 33, color: '#ef4444' },
  { name: 'TI',            count: 47, risk: 22, color: '#f97316' },
  { name: 'Marketing',     count: 31, risk: 19, color: '#f59e0b' },
  { name: 'Operações',     count: 84, risk: 18, color: '#f59e0b' },
  { name: 'RH',            count: 18, risk: 11, color: '#22c55e' },
]

const TREND = [
  { mes: 'Dez', score: 28 },
  { mes: 'Jan', score: 31 },
  { mes: 'Fev', score: 36 },
  { mes: 'Mar', score: 41 },
  { mes: 'Abr', score: 34 },
  { mes: 'Mai', score: 28 },
]

const ACTIVE_ALERTS = [
  { id: 'COLAB-#038', dept: 'Vendas',     level: 'Alto',     days: 6, action: 'Encaminhado · aguardando consulta' },
  { id: 'COLAB-#142', dept: 'Financeiro', level: 'Alto',     days: 3, action: 'Consulta agendada · 02/06' },
  { id: 'COLAB-#201', dept: 'TI',         level: 'Elevado',  days: 9, action: 'Check-in semanal pelo Teams' },
]

const INTEGRATIONS = [
  { name: 'Microsoft Teams',  status: 'Em desenvolvimento', icon: <MessageSquare className="w-5 h-5" />, desc: 'Check-in diário pelo chat + alertas automáticos' },
  { name: 'Slack',            status: 'Roadmap Q3',         icon: <MessageSquare className="w-5 h-5" />, desc: 'Mesmo fluxo do Teams, para empresas no Slack' },
  { name: 'Google Workspace', status: 'Roadmap Q4',         icon: <Building2 className="w-5 h-5" />,     desc: 'SSO + sincronia de organograma e departamentos' },
  { name: 'Workday HR',       status: 'Roadmap 2027',       icon: <Building2 className="w-5 h-5" />,     desc: 'Sincronia de cargos, tempo de casa e licenças' },
]

// ============ COMPONENTS ============
export default function Enterprise() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-deep)', color: 'var(--text-pri)' }}>
      {/* HEADER */}
      <header className="sticky top-0 z-30" style={{ background: 'var(--header-blur)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MindGuardLogo />
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold" style={{ fontFamily: 'Nunito, system-ui, sans-serif', fontWeight: 800 }}>
                MindGuard
              </span>
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md" style={{ background: 'rgba(45,212,191,0.15)', color: 'var(--jade)' }}>
                for Business
              </span>
            </div>
          </div>

          <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-1.5 text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8 sm:py-12">
        {/* PREVIEW BANNER */}
        <div className="mb-8 rounded-2xl p-5 flex items-center gap-4" style={{ background: 'rgba(45,212,191,0.07)', border: '1px solid rgba(45,212,191,0.25)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(45,212,191,0.18)', color: 'var(--jade)' }}>
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold mb-0.5">Preview · MindGuard for Business</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Visão executiva do produto B2B em desenvolvimento. Dados desta tela são demonstrativos. Em produção, virão da base CarePlus de beneficiários com anonimização por departamento.
            </div>
          </div>
        </div>

        {/* TITLE */}
        <div className="mb-8">
          <div className="text-xs font-semibold tracking-wider mb-2" style={{ color: 'var(--jade)' }}>
            {COMPANY.plan.toUpperCase()}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-1" style={{ fontFamily: 'Nunito, system-ui, sans-serif', fontWeight: 800 }}>
            {COMPANY.name}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Painel da medicina ocupacional · Atualizado hoje · Maio/2026
          </p>
        </div>

        {/* OVERVIEW CARDS */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
          {OVERVIEW.map((m) => (
            <OverviewCard key={m.label} {...m} />
          ))}
        </section>

        {/* GRID: tendência + departamentos */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
          {/* Tendência */}
          <div className="lg:col-span-2 rounded-2xl p-5 sm:p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-start justify-between mb-1">
              <div>
                <h2 className="text-lg font-bold">Risco médio organizacional</h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Últimos 6 meses · escala 0–100</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: 'rgba(34,197,94,0.10)', color: 'var(--stable)' }}>
                <TrendingDown className="w-3.5 h-3.5" />
                −31% desde março
              </div>
            </div>
            <div className="h-56 mt-4 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={TREND}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} domain={[0, 60]} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-deep)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: 'var(--text-muted)' }}
                    formatter={(v) => [v, 'Score']}
                  />
                  <Line type="monotone" dataKey="score" stroke="var(--jade)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--jade)' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
              💡 Pico em <strong style={{ color: 'var(--text-pri)' }}>março</strong> coincidiu com o fechamento trimestral. Após programa interno de wellness em abril, a curva retornou ao patamar de dezembro.
            </p>
          </div>

          {/* Por departamento */}
          <div className="rounded-2xl p-5 sm:p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-bold mb-1">Por departamento</h2>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>% em risco moderado ou alto</p>
            <div className="space-y-3">
              {DEPARTMENTS.map((d) => (
                <div key={d.name}>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-medium">{d.name}</span>
                    <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                      {d.count} pessoas · <strong style={{ color: d.color }}>{d.risk}%</strong>
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-raised)' }}>
                    <div className="h-full rounded-full" style={{ width: `${d.risk * 2.5}%`, background: d.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ALERTAS ATIVOS */}
        <section className="rounded-2xl p-5 sm:p-6 mb-10" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <BellRing className="w-5 h-5" style={{ color: 'var(--danger)' }} />
                Alertas ativos
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Colaboradores em risco elevado/alto · anônimos por padrão</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
              {ACTIVE_ALERTS.length} ativos
            </span>
          </div>

          <div className="space-y-2.5">
            {ACTIVE_ALERTS.map((a) => (
              <div key={a.id} className="flex items-center gap-4 rounded-xl p-3.5" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: a.level === 'Alto' ? 'var(--danger-bg)' : 'rgba(249,115,22,0.12)', color: a.level === 'Alto' ? 'var(--danger)' : '#f97316' }}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <span className="text-sm font-bold tabular-nums">{a.id}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.dept}</span>
                    <span className="text-xs font-semibold" style={{ color: a.level === 'Alto' ? 'var(--danger)' : '#f97316' }}>
                      Risco {a.level}
                    </span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{a.action}</div>
                </div>
                <div className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  <Clock className="w-3.5 h-3.5" />
                  <span className="tabular-nums">{a.days}d</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-start gap-3 p-3.5 rounded-xl" style={{ background: 'rgba(45,212,191,0.05)', border: '1px solid rgba(45,212,191,0.20)' }}>
            <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--jade)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-pri)' }}>Privacidade por design.</strong> RH visualiza apenas IDs anônimos e métricas agregadas. Apenas médicos da rede CarePlus, com autorização específica, têm acesso a dados clínicos individuais.
            </p>
          </div>
        </section>

        {/* INTEGRAÇÃO TEAMS — DESTAQUE */}
        <section className="rounded-2xl p-6 sm:p-10 mb-10 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(45,212,191,0.08), rgba(20,30,44,0.6))', border: '1px solid rgba(45,212,191,0.30)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
            <div>
              <div className="text-xs font-semibold tracking-wider mb-3" style={{ color: 'var(--jade)' }}>
                INTEGRAÇÃO PRINCIPAL · EM DESENVOLVIMENTO
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4" style={{ fontFamily: 'Nunito, system-ui, sans-serif', fontWeight: 800 }}>
                MindGuard chega aonde o colaborador já está
              </h2>
              <p className="text-sm sm:text-base leading-relaxed mb-5" style={{ color: 'var(--text-muted)' }}>
                Bot nativo do <strong style={{ color: 'var(--text-pri)' }}>Microsoft Teams</strong> faz o check-in diário direto no chat. Sem instalar app novo, sem aderência baixa. A saúde mental entra no fluxo de trabalho existente.
              </p>

              <ol className="space-y-3 text-sm">
                <FlowStep n="1" title="Check-in pelo Teams" desc="Bot manda 3 perguntas curtas (humor, energia, estresse) no início do dia." />
                <FlowStep n="2" title="Score processado" desc="Algoritmo cruza com sinais de wearable e contexto, gera score 0–100." />
                <FlowStep n="3" title="Painel agregado para o RH" desc="RH vê só números coletivos por departamento. Privacidade preservada." />
                <FlowStep n="4" title="Encaminhamento automático" desc="Risco alto? Sistema marca consulta na rede CarePlus sem ação do RH." />
              </ol>
            </div>

            <div className="rounded-xl p-5" style={{ background: 'rgba(10,18,28,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: '#5059C9' }}>
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div className="text-sm">
                  <div className="font-bold">MindGuard Bot</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Microsoft Teams · hoje 09:00</div>
                </div>
              </div>
              <ChatBubble side="bot">Oi Roberto! 3 perguntas rápidas pro check-in de hoje 👇</ChatBubble>
              <ChatBubble side="bot">Como está seu humor? <span style={{ color: 'var(--jade)' }}>(1–10)</span></ChatBubble>
              <ChatBubble side="user">5</ChatBubble>
              <ChatBubble side="bot">E a energia hoje?</ChatBubble>
              <ChatBubble side="user">4</ChatBubble>
              <ChatBubble side="bot">Nível de estresse?</ChatBubble>
              <ChatBubble side="user">8</ChatBubble>
              <ChatBubble side="bot">
                Anotado, obrigado 🌿 Notei que vc está com sono curto há 5 dias. Quer que eu agende uma conversa de 30min com a Dra. Renata (psicóloga · rede CarePlus)?
              </ChatBubble>
              <div className="flex gap-2 mt-2">
                <button className="text-xs font-semibold px-3 py-2 rounded-lg" style={{ background: 'var(--jade)', color: '#001b18' }}>Sim, agendar</button>
                <button className="text-xs font-semibold px-3 py-2 rounded-lg" style={{ background: 'var(--bg-raised)', color: 'var(--text-pri)' }}>Agora não</button>
              </div>
              <a
                href="/teams-preview"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold hover:opacity-80 transition"
                style={{ color: 'var(--jade)' }}
              >
                Ver mockup completo da interface Teams →
              </a>
            </div>
          </div>
        </section>

        {/* INTEGRAÇÕES — LISTA */}
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-1">Roadmap de integrações</h2>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Conectores nativos com ferramentas corporativas</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {INTEGRATIONS.map((i) => (
              <div key={i.name} className="rounded-xl p-4 flex items-center gap-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(45,212,191,0.10)', color: 'var(--jade)' }}>
                  {i.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-sm font-bold">{i.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)' }}>{i.status}</span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{i.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="rounded-2xl p-8 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h3 className="text-xl font-bold mb-2">Quer trazer o MindGuard for Business para a sua empresa?</h3>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
            Em discussão com o time CarePlus para piloto com 3 empresas no segundo semestre de 2026.
          </p>
          <Link to="/" className="btn-ghost inline-flex items-center gap-2 text-sm">
            Voltar à página inicial
            <ChevronRight className="w-4 h-4" />
          </Link>
        </section>
      </main>

      <footer className="border-t mt-12" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-5 py-6 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          MindGuard for Business · Preview · FIAP × CarePlus 2026
        </div>
      </footer>
    </div>
  )
}

// ============ HELPERS ============
function OverviewCard({ label, value, delta, icon, tone }) {
  const colorMap = {
    jade:   { bg: 'rgba(45,212,191,0.10)',  fg: 'var(--jade)'  },
    attn:   { bg: 'rgba(245,158,11,0.10)',  fg: 'var(--attn)'  },
    danger: { bg: 'rgba(239,68,68,0.10)',   fg: 'var(--danger)' },
  }
  const c = colorMap[tone] || colorMap.jade
  return (
    <div className="rounded-2xl p-4 sm:p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: c.bg, color: c.fg }}>
          {icon}
        </div>
      </div>
      <div className="text-2xl sm:text-3xl font-bold tabular-nums" style={{ color: 'var(--text-pri)' }}>{value}</div>
      <div className="text-xs mt-1 leading-tight" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-xs mt-2 font-medium" style={{ color: c.fg }}>{delta}</div>
    </div>
  )
}

function FlowStep({ n, title, desc }) {
  return (
    <li className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: 'var(--jade)', color: '#001b18' }}>
        {n}
      </div>
      <div>
        <div className="font-semibold leading-tight">{title}</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</div>
      </div>
    </li>
  )
}

function ChatBubble({ side, children }) {
  const isBot = side === 'bot'
  return (
    <div className={`flex mb-2 ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div
        className="text-sm px-3.5 py-2 rounded-2xl max-w-[85%]"
        style={{
          background: isBot ? 'var(--bg-raised)' : 'var(--jade)',
          color: isBot ? 'var(--text-pri)' : '#001b18',
          borderTopLeftRadius:  isBot ? 4 : 16,
          borderTopRightRadius: isBot ? 16 : 4,
        }}
      >
        {children}
      </div>
    </div>
  )
}
