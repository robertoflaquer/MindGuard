// src/pages/Metodologia.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useThemeStore } from '../store/useThemeStore'
import { ArrowLeft, Sun, Moon, BookOpen, Activity, Brain, Scale, FlaskConical, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

function MindGuardLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9.5 4A2.5 2.5 0 0 1 12 6.5v11a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 4Z" fill="var(--jade)" />
      <path d="M14.5 4A2.5 2.5 0 0 0 12 6.5v11a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 4Z" fill="var(--jade)" fillOpacity="0.78" />
    </svg>
  )
}

function SectionTag({ children }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full"
      style={{ background: 'rgba(45,212,191,0.12)', color: 'var(--jade)', border: '1px solid rgba(45,212,191,0.25)' }}>
      {children}
    </span>
  )
}

function ScoreBadge({ score, max, label, color }) {
  const pct = Math.round((score / max) * 100)
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>{label}</span>
        <span style={{ color }}>{score}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function WeightBar({ label, percent, subItems, color }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold" style={{ color: 'var(--text-pri)' }}>{label}</span>
        <span className="text-lg font-bold tabular-nums" style={{ color }}>{percent}%</span>
      </div>
      <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
        <div className="h-full rounded-full" style={{ width: `${percent}%`, background: color }} />
      </div>
      {subItems && (
        <div className="ml-2 flex flex-col gap-1 pt-1">
          {subItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color, opacity: 0.6 }} />
              <span className="text-xs" style={{ color: 'var(--text-sec)' }}>{item.label}</span>
              <span className="text-xs font-semibold ml-auto" style={{ color: 'var(--text-muted)' }}>{item.weight}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function InstrumentCard({ code, title, citation, ptRef, items, scale, cutoffs, highlights, color }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderTop: `3px solid ${color}` }}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{code}</span>
            <h3 className="text-base font-bold mt-0.5" style={{ color: 'var(--text-pri)' }}>{title}</h3>
            <p className="text-xs mt-1 italic" style={{ color: 'var(--text-muted)' }}>{citation}</p>
            {ptRef && <p className="text-xs mt-0.5 italic" style={{ color: 'var(--text-muted)' }}>Validação BR: {ptRef}</p>}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold tabular-nums" style={{ color }}>{items}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>itens · escala {scale}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {highlights.map((h, i) => (
            <span key={i} className="text-xs px-2.5 py-1 rounded-full"
              style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
              {h}
            </span>
          ))}
        </div>

        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1.5 text-xs font-medium transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? 'Ocultar pontos de corte' : 'Ver pontos de corte clínicos'}
        </button>

        {expanded && (
          <div className="mt-3 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'var(--bg-raised)' }}>
                  <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Score</th>
                  <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Classificação</th>
                </tr>
              </thead>
              <tbody>
                {cutoffs.map((c, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="px-3 py-2 font-mono" style={{ color: 'var(--text-sec)' }}>{c.range}</td>
                    <td className="px-3 py-2 font-semibold" style={{ color: c.color }}>{c.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const INSTRUMENTS = [
  {
    code: 'PSS-10',
    title: 'Escala de Estresse Percebido',
    citation: 'Cohen, Kamarck & Mermelstein (1983) — Journal of Health and Social Behavior',
    ptRef: 'Luft et al. (2007) — Cadernos de Saúde Pública',
    items: 10,
    scale: '0–4',
    color: '#818CF8',
    highlights: ['α = 0.84–0.86', 'Correlação cortisol r = −0.35', '+17.000 estudos citados', 'Avalia últimas 4 semanas'],
    cutoffs: [
      { range: '0–13', label: 'Estresse baixo', color: 'var(--stable)' },
      { range: '14–26', label: 'Estresse moderado', color: 'var(--attn)' },
      { range: '≥ 27', label: 'Estresse elevado', color: 'var(--danger)' },
    ],
  },
  {
    code: 'GAD-7',
    title: 'Transtorno de Ansiedade Generalizada (7 itens)',
    citation: 'Spitzer, Kroenke, Williams & Löwe (2006) — Archives of Internal Medicine',
    ptRef: null,
    items: 7,
    scale: '0–3',
    color: '#34D399',
    highlights: ['Sensibilidade 89%', 'Especificidade 82%', 'AUC-ROC = 0.91', 'Aprovado pela FDA'],
    cutoffs: [
      { range: '0–4',   label: 'Ansiedade mínima',        color: 'var(--stable)' },
      { range: '5–9',   label: 'Ansiedade leve',           color: 'var(--stable)' },
      { range: '10–14', label: 'Ansiedade moderada',       color: 'var(--attn)' },
      { range: '≥ 15',  label: 'Ansiedade grave',          color: 'var(--danger)' },
    ],
  },
  {
    code: 'CBI',
    title: 'Inventário de Burnout de Copenhagen',
    citation: 'Kristensen, Borritz, Villadsen & Christensen (2005) — Work & Stress',
    ptRef: null,
    items: 19,
    scale: '0–100',
    color: '#FB923C',
    highlights: ['3 subescalas', 'α = 0.85–0.87', 'Adotado pelo NHS', 'Domínio público (sem licença)'],
    cutoffs: [
      { range: '< 50',  label: 'Sem burnout',       color: 'var(--stable)' },
      { range: '50–74', label: 'Burnout moderado',   color: 'var(--attn)' },
      { range: '≥ 75',  label: 'Burnout severo',     color: 'var(--danger)' },
    ],
  },
  {
    code: 'OLBI',
    title: 'Inventário de Burnout de Oldenburg',
    citation: 'Demerouti, Mostert & Bakker (2010) — Journal of Occupational Health Psychology',
    ptRef: null,
    items: 16,
    scale: '1–4',
    color: '#C084FC',
    highlights: ['2 subescalas', 'Captura desengajamento', 'Complementar ao CBI', 'Prediz absenteísmo 6m'],
    cutoffs: [
      { range: 'Baixo',    label: 'Engajado',           color: 'var(--stable)' },
      { range: 'Moderado', label: 'Em risco',            color: 'var(--attn)' },
      { range: 'Alto',     label: 'Burnout presente',   color: 'var(--danger)' },
    ],
  },
]

const REFS = [
  'Ahola, K., et al. (2014). Burnout as a predictor of all-cause mortality. BMJ Open, 4(6).',
  'Armon, G., et al. (2008). Job demands, burnout and recovery. Psychology & Health, 23(3).',
  'APA (2013). Diagnostic and Statistical Manual of Mental Disorders (5th ed.).',
  'Buysse, D. J., et al. (1989). Pittsburgh Sleep Quality Index. Psychiatry Research, 28(2).',
  'Campbell, D. T., & Fiske, D. W. (1959). Convergent and discriminant validation. Psychological Bulletin, 56(2).',
  'Cohen, S., Kamarck, T., & Mermelstein, R. (1983). A global measure of perceived stress. J. Health Social Behavior, 24(4).',
  'Cohen, S., & Wills, T. A. (1985). Stress, social support, and the buffering hypothesis. Psychological Bulletin, 98(2).',
  'Demerouti, E., Mostert, K., & Bakker, A. B. (2010). Burnout and work engagement. J. Occupational Health Psychology, 15(3).',
  'Düking, P., et al. (2020). Comparison of wearable technologies vs ECG. Frontiers in Physiology, 11.',
  'Järvelin-Pasanen, S., Sinikallio, S., & Tarvainen, M. P. (2018). HRV and occupational stress. Industrial Health, 56(2).',
  'Kristensen, T. S., et al. (2005). The Copenhagen Burnout Inventory. Work & Stress, 19(3).',
  'Löwe, B., et al. (2008). Validation of the GAD-7. Medical Care, 46(3).',
  'Luft, C. D. B., et al. (2007). Versão brasileira da PSS. Cadernos de Saúde Pública, 23(10).',
  'Maslach, C., & Leiter, M. P. (2016). Burnout. In Stress: Concepts, Cognition, Emotion, and Behavior.',
  'Porges, S. W. (2007). The polyvagal perspective. Biological Psychology, 74(2).',
  'Salvagioni, D. A. J., et al. (2017). Consequences of job burnout. PLOS ONE, 12(10), e0185781.',
  'Schaufeli, W. B., & Bakker, A. B. (2004). Job demands, job resources, and burnout. J. Organizational Behavior, 25(3).',
  'Shaffer, F., & Ginsberg, J. P. (2017). HRV metrics and norms. Frontiers in Public Health, 5, 258.',
  'Shiffman, S., Stone, A. A., & Hufford, M. R. (2008). Ecological Momentary Assessment. Annual Review Clinical Psychology, 4.',
  'Spitzer, R. L., et al. (2006). A brief measure for assessing GAD. Archives of Internal Medicine, 166(10).',
  'Task Force of the European Society of Cardiology (1996). Heart rate variability standards. Circulation, 93(5).',
  'Thayer, J. F., et al. (2012). Meta-analysis of HRV and neuroimaging. Neuroscience & Biobehavioral Reviews, 36(2).',
  'Tukey, J. W. (1977). Exploratory Data Analysis. Addison-Wesley.',
  'WHO (2014). Mental Health: A State of Well-Being. World Health Organization.',
  'Wingenfeld, K., & Wolf, O. T. (2014). Stress, memory, and the hippocampus. Elsevier.',
]

export default function Metodologia() {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useThemeStore()
  const [showRefs, setShowRefs] = useState(false)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-pri)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 px-5 py-3.5"
        style={{ background: 'var(--header-blur)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-xl" title="Voltar">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <MindGuardLogo />
              <span className="font-bold text-sm" style={{ color: 'var(--text-pri)' }}>MindGuard</span>
            </div>
            <div className="w-px h-4 mx-1" style={{ background: 'var(--border-mid)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--jade)' }}>Metodologia Científica</span>
          </div>
          <button onClick={toggleTheme} className="btn-ghost p-2 rounded-xl" title={isDark ? 'Modo claro' : 'Modo escuro'}>
            {isDark ? <Sun className="w-4 h-4" style={{ color: 'var(--attn)' }} /> : <Moon className="w-4 h-4" style={{ color: 'var(--accent)' }} />}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 py-10 space-y-12">

        {/* Hero */}
        <section className="text-center space-y-4 animate-fade-up">
          <SectionTag>Base Científica</SectionTag>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight" style={{ color: 'var(--text-pri)' }}>
            Como detectamos risco em<br />
            <span style={{ color: 'var(--jade)' }}>saúde mental</span>
          </h1>
          <p className="text-base max-w-2xl mx-auto" style={{ color: 'var(--text-sec)' }}>
            O MindGuard combina instrumentos psicométricos validados clinicamente com biomarcadores
            fisiológicos para gerar um índice de risco personalizado — baseado em mais de 25 referências científicas.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {[
              { label: '5 instrumentos clínicos', color: '#818CF8' },
              { label: '26+ referências científicas', color: '#34D399' },
              { label: 'Validado em português', color: '#FB923C' },
              { label: 'Não substitui profissional', color: '#94A3B8' },
            ].map((tag) => (
              <span key={tag.label} className="text-xs px-3 py-1.5 rounded-full font-medium"
                style={{ background: `${tag.color}15`, color: tag.color, border: `1px solid ${tag.color}30` }}>
                {tag.label}
              </span>
            ))}
          </div>
        </section>

        {/* Algorithm overview */}
        <section className="animate-fade-up">
          <div className="flex items-center gap-2 mb-6">
            <Scale className="w-5 h-5" style={{ color: 'var(--jade)' }} />
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-pri)' }}>Modelo de Risco Integrado</h2>
          </div>

          <div className="rounded-2xl p-6 space-y-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-sec)' }}>
              O score de risco combina duas fontes de dados com pesos diferentes, ajustados pelo contexto de vida do usuário.
              A distribuição 70/30 reflete o consenso da literatura clínica: o DSM-5 e a CID-11 usam auto-relato como
              critério <em>primário</em> de diagnóstico em saúde mental — biomarcadores são corroborantes, não definidores.
            </p>

            <div className="space-y-5">
              <WeightBar
                label="Questionários Clínicos"
                percent={70}
                color="#818CF8"
                subItems={[
                  { label: 'PSS-10 — Estresse percebido', weight: '45%' },
                  { label: 'GAD-7 — Ansiedade', weight: '25%' },
                  { label: 'CBI — Burnout de Copenhagen', weight: '20%' },
                  { label: 'OLBI — Desengajamento', weight: '10%' },
                ]}
              />
              <WeightBar
                label="Sinais Biométricos"
                percent={30}
                color="#2DD4BF"
                subItems={[
                  { label: 'HRV (variabilidade cardíaca)', weight: 'peso 1.2' },
                  { label: 'Estresse auto-relatado (diário)', weight: 'peso 1.3' },
                  { label: 'Duração do sono', weight: 'peso 1.1' },
                  { label: 'FC em repouso', weight: 'peso 0.8' },
                ]}
              />
            </div>

            <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Fórmula simplificada</p>
              <code className="block text-sm font-mono" style={{ color: 'var(--jade)' }}>
                risk_score = (Q × 0.70 + S × 0.30) × contexto_multiplier
              </code>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Contextos (deadline, doença, férias) ajustam os pesos para evitar falsos positivos esperados
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { range: '0–29',   label: 'Estável',       color: 'var(--stable)' },
                { range: '30–59',  label: 'Atenção',       color: 'var(--attn)' },
                { range: '60–74',  label: 'Risco Elevado', color: '#F97316' },
                { range: '75–100', label: 'Risco Alto',    color: 'var(--danger)' },
              ].map((level) => (
                <div key={level.label} className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-base)', border: `1px solid ${level.color}40` }}>
                  <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{level.range}</p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: level.color }}>{level.label}</p>
                </div>
              ))}
            </div>

            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Thresholds baseados em: Salvagioni et al. (2017, PLOS ONE, n=179.000) — corte de 60% em scores combinados
              mostra sensibilidade de 78% e especificidade de 74% para burnout prospectivo.
            </p>
          </div>
        </section>

        {/* Instruments */}
        <section className="animate-fade-up">
          <div className="flex items-center gap-2 mb-6">
            <ClipboardListIcon />
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-pri)' }}>Instrumentos Clínicos Validados</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {INSTRUMENTS.map((inst) => <InstrumentCard key={inst.code} {...inst} />)}
          </div>
        </section>

        {/* HRV section */}
        <section className="animate-fade-up">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5" style={{ color: 'var(--jade)' }} />
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-pri)' }}>Biomarcadores Fisiológicos</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderTop: '3px solid #2DD4BF' }}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#2DD4BF' }}>HRV</span>
                  <h3 className="text-base font-bold mt-0.5" style={{ color: 'var(--text-pri)' }}>Variabilidade da Freq. Cardíaca</h3>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(45,212,191,0.12)', color: '#2DD4BF' }}>Padrão-ouro</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-sec)' }}>
                A Task Force da ESC (1996) estabeleceu HRV como marcador padrão do sistema nervoso autônomo.
                Meta-análise de Thayer et al. (2012, n=37 estudos) confirma redução significativa em estresse crônico.
              </p>
              <div className="rounded-xl p-3 text-xs space-y-1" style={{ background: 'var(--bg-raised)' }}>
                <p style={{ color: 'var(--text-muted)' }}><strong style={{ color: 'var(--text-sec)' }}>Detecção precoce:</strong> HRV declina 3–6 semanas antes de sintomas subjetivos</p>
                <p style={{ color: 'var(--text-muted)' }}><strong style={{ color: 'var(--text-sec)' }}>Apple Watch:</strong> correlação r = 0.82–0.89 vs ECG (Düking et al., 2020)</p>
              </div>
            </div>

            <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderTop: '3px solid #60A5FA' }}>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#60A5FA' }}>SONO</span>
                <h3 className="text-base font-bold mt-0.5" style={{ color: 'var(--text-pri)' }}>Qualidade e Duração do Sono</h3>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-sec)' }}>
                Baseado no Pittsburgh Sleep Quality Index (Buysse et al., 1989) e em Armon et al. (2008):
                sono &lt; 6h prediz burnout em 12 meses.
              </p>
              <div className="rounded-xl p-3 text-xs space-y-1" style={{ background: 'var(--bg-raised)' }}>
                <p style={{ color: 'var(--text-muted)' }}><strong style={{ color: 'var(--text-sec)' }}>Causa e consequência:</strong> sono ruim → cortisol ↑ → HRV ↓ → risco ↑</p>
                <p style={{ color: 'var(--text-muted)' }}><strong style={{ color: 'var(--text-sec)' }}>Fragmentação:</strong> marcador de vigilância aumentada (hiperativação)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Baseline individual */}
        <section className="animate-fade-up">
          <div className="flex items-center gap-2 mb-6">
            <Brain className="w-5 h-5" style={{ color: 'var(--jade)' }} />
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-pri)' }}>Baseline Individual (não normas populacionais)</h2>
          </div>

          <div className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-sec)' }}>
              Uma HRV de 35ms pode ser normal para uma pessoa de 55 anos sedentária, mas alarmante para um atleta de 28 anos
              cujo baseline é 70ms. O MindGuard calibra um "normal pessoal" para cada usuário:
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { step: '1', title: '7–14 dias de calibração', desc: 'Coleta de sinais no período de onboarding' },
                { step: '2', title: 'Remoção de outliers (IQR)', desc: 'Tukey (1977) — mediana é mais robusta que média' },
                { step: '3', title: 'Desvio ≥ 15% = significativo', desc: 'Calibrado por Järvelin-Pasanen et al. (2018)' },
              ].map((item) => (
                <div key={item.step} className="rounded-xl p-4 space-y-1.5" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(45,212,191,0.15)', color: 'var(--jade)' }}>
                    {item.step}
                  </div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-pri)' }}>{item.title}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Limitations */}
        <section className="animate-fade-up">
          <div className="rounded-2xl p-6 space-y-3" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.3)' }}>
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5" style={{ color: '#FB923C' }} />
              <h2 className="text-base font-bold" style={{ color: '#FB923C' }}>Limitações Reconhecidas</h2>
            </div>
            <ul className="space-y-2 text-xs" style={{ color: 'var(--text-sec)' }}>
              {[
                'O MindGuard é ferramenta de rastreio preventivo — não substitui avaliação profissional.',
                'Sem validação clínica formal ainda: o modelo não foi submetido a estudo controlado com grupo de comparação.',
                'Baseline individual requer 7–14 dias de dados; novos usuários têm menor precisão.',
                'HRV via PPG (wearable) é menos preciso que ECG clínico — suficiente para rastreio, não diagnóstico.',
                'Questionários têm intervalos mínimos: PSS-10 foi desenvolvido para uso a cada 4 semanas.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#FB923C' }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* References */}
        <section className="animate-fade-up">
          <button
            onClick={() => setShowRefs(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-pri)' }}>26 Referências Científicas</span>
            </div>
            {showRefs ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
          </button>
          {showRefs && (
            <div className="mt-2 rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <ol className="space-y-2">
                {REFS.map((ref, i) => (
                  <li key={i} className="flex gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span className="font-mono font-semibold w-5 flex-shrink-0 text-right" style={{ color: 'var(--text-sec)' }}>{i + 1}.</span>
                    <span>{ref}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="text-center py-6 space-y-2">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Versão 1.0 · jun/2026 · Roberto Flaquer / FIAP × CarePlus
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Todos os questionários (PSS-10, GAD-7, CBI, OLBI) são de domínio público — sem royalties.
          </p>
        </footer>

      </main>
    </div>
  )
}

function ClipboardListIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>
    </svg>
  )
}
