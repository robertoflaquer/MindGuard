---
tags: [sprint, planning, fase3]
data: 2026-06-09
status: concluído
---

# Fase 3 — UX, Responsivo e Engajamento

> Sprint iniciado em 09/jun/2026 após auditoria pós-Fase 2.5.
> Foco: corrigir bugs encontrados pelo usuário, melhorar experiência mobile e adicionar features de engajamento e surpresa.

---

## SUMÁRIO RÁPIDO (leitura em 2 min se contexto compactado)

| # | Tipo | Item | Arquivo(s) | Status |
|---|------|------|-----------|--------|
| 1 | 🔴 Bug | Apple Health 185MB (limite 50MB) | `appleHealthParser.js`, `wearables.js` | ✅ a3565c0 |
| 2 | 🔴 Bug | Modo claro não funciona na Metodologia | `Metodologia.jsx`, `index.css` | ✅ a3565c0 |
| 3 | 🔴 Bug | `--bg-base` CSS var não existe | `index.css` | ✅ a3565c0 |
| 4 | 🟡 UX | Botão Relatório Semanal não visível | `Dashboard.jsx` | ✅ a3565c0 |
| 5 | 🟡 UX | Aba "Registrar Sinais" reorganizada | `Dashboard.jsx` | ✅ a3565c0 |
| 6 | 🟠 Feature | Responsivo iPhone (16px inputs, 44px targets, header) | todos os `.jsx` | ✅ 722d82f |
| 7 | 🟢 Feature | Área do Médico | `MedicoView.jsx`, rota `/medico` | ✅ 722d82f |
| 8 | 🟢 Feature | Streak diário | backend `created_at` + Dashboard badge | ✅ 722d82f + 2d946ec |
| 9 | ⭐ Surpresa | Mood Calendar (heatmap 90 dias) | `MoodCalendar.jsx` | ✅ 722d82f |
| 10 | ⭐ Surpresa | Exercício de respiração interativo | `BreathingExercise.jsx` | ✅ 722d82f |
| 11 | ⭐ Surpresa | Tendência preditiva (risco em X dias) | `Dashboard.jsx`, `riskController.js` | ✅ 4cb4f41 |
| 12 | 🔴 Fix | Streak mostrava 90 dias (dados do demo) | `signalController.js` (created_at) | ✅ 2d946ec |
| 13 | 🟡 Fix | Trend banner — layout visual melhorado | `Dashboard.jsx` | ✅ 2d946ec |
| 14 | 🟡 Fix | Apple Health card removido da Overview | `Dashboard.jsx` | ✅ 2d946ec |
| 15 | 🟡 Fix | Médico movido para nav header (como Empresa) | `Dashboard.jsx` | ✅ 2d946ec |
| 16 | 🟡 Fix | Risk score com muitas casas decimais | `MedicoView.jsx` Math.round() | ✅ 2d946ec |
| 17 | ⭐ Fix | Média 7 dias por sinal na Área do Médico | `MedicoView.jsx` | ✅ 2d946ec |
| 18 | 🔴 Bug | Streak mostrando 90 (timestamp era data histórica) | `signalController.js` (created_at + UNION questionnaire_responses) | ✅ e66ed59 |
| 19 | 🟢 Feature | Demo 30 daily check-ins + 30 risk_assessments | `demoController.js` | ✅ e66ed59 |
| 20 | 🟡 UX | BreathingExercise contagem 3-2-1 antes de iniciar | `BreathingExercise.jsx` | ✅ e66ed59 |
| 21 | 🟡 UX | Ícones Apple Health + Galaxy Watch SVG Lucide-style | `Dashboard.jsx`, `Connect.jsx` | ✅ e66ed59 |
| 22 | 🟡 UX | Streak badge roxo `#A78BFA` com chama preenchida | `Dashboard.jsx` | ✅ e66ed59 |
| 23 | 🔴 Bug | MedicoView valores não arredondados (DB retorna numeric como string) | `MedicoView.jsx` (`formatSignal` com parseFloat) | ✅ e66ed59 |
| 24 | 🟡 UX | Travessões em prosa removidos (regra: manter em separadores) | Welcome, Enterprise, Connect, Metodologia | ✅ e66ed59 |
| 25 | 🔴 Bug | MoodCalendar quase vazio — getHistory filtro com tipo ambíguo | `riskController.js` (assessment_date >= CURRENT_DATE - $2::int) | ✅ d96774d |
| 26 | 🔴 Bug | Demo podia falhar silenciosamente se seed risk_levels não rodou | `demoController.js` (upsert defensivo + throw explícito) | ✅ d96774d |
| 27 | ⭐ Feature | Insights expandidos: 13 tipos de recomendação (era 5) | `insightsService.js` | ✅ d96774d |

---

## 🏁 CHECKPOINT — `checkpoint-2026-06-11-pre-features` (commit `d96774d`)

Marco antes de implementar features F1-F5 da Apresentacao-Estrategia. Tudo acima funcionando em produção. Detalhes completos em [[Apresentacao-Estrategia#🏁 CHECKPOINT — 11/jun/2026 (qui à noite)]].

**Próximas features**: F1 Insights card → F5 Push notification → F2 Login médico → F2.5 Teams mock → F3 PDF export → F4 QR Code.

---

## BUGS CRÍTICOS (resolver antes de tudo)

### BUG 1 — Apple Health 185MB
**Sintoma**: upload falha com erro de arquivo muito pesado
**Causa raiz**: `multer({ limits: { fileSize: 50 * 1024 * 1024 } })` + `fast-xml-parser` carrega DOM inteiro na memória
**Impacto**: exports reais de Apple Health são tipicamente 100–500MB (anos de dados)

**Solução escolhida**: substituir `fast-xml-parser` por parser SAX streaming (`sax` npm)
- Processa um elemento de cada vez → memória constante, independente do tamanho
- Filtrar apenas registros dos **últimos 365 dias** para reduzir processamento
- Aumentar limite multer para `250MB`
- Adicionar timeout de 3 minutos no endpoint

**Arquivos a modificar**:
```
mindguard-backend/src/services/appleHealthParser.js  ← rewrite com sax
mindguard-backend/src/routes/wearables.js            ← limit: 250MB
mindguard-backend/package.json                       ← npm install sax
```

**Exemplo de lógica SAX**:
```javascript
import sax from 'sax'
// parser.write(chunk) em vez de carregar tudo na memória
// filtro: só processa records com startDate >= hoje - 365 dias
```

---

### BUG 2 — Modo claro não funciona na Metodologia
**Causa raiz**: `Metodologia.jsx` usa `const { isDark, toggleTheme } = useThemeStore()` mas o store exporta `toggle`, não `toggleTheme`. O botão chama `undefined()`.

**Fix**: linha 220 do Metodologia.jsx
```javascript
// ERRADO (atual):
const { isDark, toggleTheme } = useThemeStore()

// CORRETO:
const { isDark, toggle: toggleTheme } = useThemeStore()
```

---

### BUG 3 — `--bg-base` não definida no CSS
**Causa raiz**: `Connect.jsx`, `WeeklyReport.jsx`, `Metodologia.jsx` usam `var(--bg-base)` mas essa variável nunca foi adicionada ao `index.css`. O fundo fica transparente (mostra `--bg-deep` do body).

**Fix**: adicionar em `index.css` nas seções dark e light:
```css
/* dark */
--bg-base: #0A1524;   /* entre bg-deep e bg-card */

/* light */  
--bg-base: #EFF4FC;   /* mesmo que bg-deep no light */
```

---

## UX IMPROVEMENTS

### UX 4 — Botão "Relatório Semanal" sempre visível
**Problema**: o link "Ver relatório semanal" só aparece dentro da seção "Próximos Passos", que só renderiza se `recommendations.length > 0`. Usuário não consegue encontrar o relatório.

**Solução**: adicionar card dedicado permanente no Dashboard Overview
```jsx
// Novo card sempre visível após a seção de questionários
<section>
  <button onClick={() => navigate('/relatorio-semanal')}>
    📊 Relatório Semanal
    <p>Análise detalhada da semana com recomendações personalizadas</p>
  </button>
</section>
```

Também adicionar `WeeklyReport` no header de navegação como link.

---

### UX 5 — Reorganizar aba "Registrar Sinais"
**Problema atual**: aba tem `SimulateWearableButton` (dropdown Apple Watch / Galaxy Watch) que chama `/api/signals/simulate` — útil apenas para dev/demo, confuso para usuário real.

**Nova estrutura proposta**:
```
Aba "Registrar Sinais"
├── Seção: "Wearables Conectados"
│   ├── Card: Apple Health
│   │   ├── Se conectado (tem dados apple_health): mostra "✓ Conectado · última sync X"
│   │   └── Se não: botão "Conectar" → navega para /conectar
│   └── Card: Galaxy Watch (futuro)
│       └── "Em breve"
│
└── Seção: "Registro Manual"
    └── SignalForm (existente) — mas com label "Adicionar leitura manual"
```

Remover `SimulateWearableButton` do modo de produção (ou esconder como feature de dev).

**Como detectar se Apple Health está conectado**: 
- Nova query: `SELECT COUNT(*) FROM user_signals WHERE user_id=$1 AND source_metadata->>'source' = 'apple_health' AND timestamp >= NOW() - INTERVAL '30 days'`
- Se > 0 → "Conectado"

**Novo endpoint**: `GET /api/wearables/status` → `{ apple_health: { connected: bool, last_sync: date, total_records: number } }`

---

## RESPONSIVO MOBILE (iPhone prioridade)

### Análise dos problemas conhecidos

**Dashboard**:
- Header com 6+ botões → overflow horizontal no iPhone
- Cards de questionários: `grid-cols-2 sm:grid-cols-4` → ok no mobile
- RiskCard com gauge + info panel lado a lado → pode quebrar em 375px
- Seção "Próximos Passos" → ok
- CTAs → ok (full width)

**Questionnaires** (`/questionnaires`):
- Formulários provavelmente ok, mas verificar padding lateral
- Escalas Likert (radio buttons) → touch targets < 44px (Apple guideline)

**Contexts, Treatment, Prescriptions**: verificar individualmente

**Connect** (`/conectar`):
- Upload drag-and-drop → no mobile não tem drag, apenas tap → ok (tem `onClick`)

**WeeklyReport**, **Metodologia**:
- `max-w-2xl` e `max-w-4xl` → ok, mas verificar padding lateral
- Tabelas de referências → podem overflow

**Estratégia de fix**:
1. Header: colapsar botões em mobile → hamburger menu ou ícones apenas
2. RiskCard: stack vertical em telas < 480px
3. Touch targets: todos os botões com `min-h-[44px]` em mobile
4. Tabelas: `overflow-x-auto` com scroll horizontal
5. Formulários: `font-size: 16px` nos inputs (previne zoom automático do iOS)

**Breakpoints usados** (Tailwind padrão):
- `sm`: 640px (iPhone SE landscape / iPhone 12)
- `md`: 768px (iPad)
- sem prefixo: mobile-first (< 640px)

---

## NOVAS FEATURES

### FEATURE 7 — Área do Médico (preview)

**Objetivo**: mostrar para a banca e para os especialistas CarePlus o que um médico/psicólogo veria ao receber um encaminhamento.

**Rota**: `/medico/:userId` (ou `/medico` para demo, mostra o usuário demo)

**Conteúdo**:
- Resumo do paciente (nome, risco atual, tendência)
- Histórico de risco (gráfico 30 dias)
- Questionários respondidos (tabela com scores)
- Sinais biométricos recentes (HRV, sono, FC)
- Contextos ativos
- Flag `requires_professional_review`
- Botão "Agendar retorno" (mock)
- Notas clínicas (campo de texto livre, mock)

**Nota de implementação**: usar dados do usuário demo (`demo@careplus.com`). Não requer novo backend — usa endpoints existentes com o token do médico.

**Arquivos a criar**:
```
mindguard-frontend/src/pages/MedicoView.jsx
```

**Rota em App.jsx**: `/medico` (pública para demo, em produção seria protegida por role)

---

### FEATURE 8 — Streak + Gamificação

**Objetivo**: aumentar retenção e engajamento diário.

**Componentes**:

**a) Streak diário**:
- Conta consecutivos dias com pelo menos 1 sinal registrado
- Exibido no Dashboard como badge animado
- "🔥 7 dias seguidos!"
- Reseta se pular um dia

**Backend**:
- Nova query em `signalService`: `SELECT COUNT(DISTINCT DATE(timestamp)) FROM user_signals WHERE user_id=$1 AND timestamp >= NOW() - INTERVAL '60 days'` — calcula sequência consecutiva
- Ou: adicionar coluna `current_streak` e `longest_streak` à tabela `users` (mais performático)
- Endpoint: `GET /api/signals/streak` → `{ current: 7, longest: 14, last_active: '2026-06-09' }`

**c) Mini achievements** (badges):
- 🌱 Primeira semana (7 dias de dados)
- 🔥 Consistente (30 dias de streak)
- 📊 Analítico (5 questionários respondidos)
- 🍎 Conectado (importou Apple Health)

**Arquivos**:
```
mindguard-backend/src/routes/signals.js      ← GET /streak
mindguard-frontend/src/components/StreakBadge.jsx
mindguard-frontend/src/store/useStreakStore.js
```

---

### FEATURE 9 — Mood Calendar (heatmap) ⭐ SURPRESA

**Objetivo**: mostrar de forma visual e impactante o padrão emocional do usuário nos últimos 90 dias. Inspirado no GitHub contributions graph.

**Visual**:
```
Jun
[■][■][□][■][■][■][□][■]...
[cores: verde=ok, amarelo=atenção, vermelho=risco, cinza=sem dados]
```

**Dados**: usar `risk_assessments.risk_score` por dia ou, se não houver avaliação, usar média dos sinais do dia.

**Componente**: `MoodCalendar.jsx`
- 13 semanas × 7 dias = 91 células
- Tooltip em hover: "3 jun · Risco 68% · HRV 42ms"
- Legenda de cores

**Onde exibir**: nova seção no Dashboard após o gráfico de sinais

---

### FEATURE 10 — Exercício de Respiração Interativo ⭐ SURPRESA

**Objetivo**: feature de valor imediato para o usuário + demonstra que o app vai além do monitoramento.

**Visual**: círculo animado que expande/contrai com instrução de texto:
```
"Inspire" [círculo expande: 4s]
"Segure"  [círculo parado: 4s]
"Expire"  [círculo contrai: 6s]
```

**Técnica**: Box Breathing (4-4-6) — reduz cortisol, aumenta HRV

**Integração**: ao final de um ciclo de 3 minutos, perguntar "Como você está se sentindo?" → registra um `mood` e `energy_level` automaticamente → conta para o streak

**Arquivo**: `mindguard-frontend/src/components/BreathingExercise.jsx`
**Acesso**: botão "Respiração" no card de recomendações quando tipo = 'breathing', ou botão fixo no Dashboard

---

### FEATURE 11 — Tendência Preditiva ⭐ SURPRESA

**Objetivo**: mostrar direção do risco, não apenas o estado atual. "A que velocidade você está indo?"

**Visual no RiskCard** (abaixo do score):
```
📈 Tendência: ↑ +8pts em 7 dias
   "No ritmo atual, você pode atingir Risco Alto em ~5 dias"
```

**Cálculo**:
- Busca os últimos 7 `risk_assessments` do usuário
- Calcula regressão linear simples (slope) nos scores
- Se slope > +2pts/dia → alerta preditivo
- Exibe "estável", "melhorando" ou "deteriorando"

**Backend**: `GET /api/risk/trend` → `{ slope: 2.3, direction: 'up', days_to_high_risk: 5, trend_label: 'deteriorando' }`

**Arquivos**:
```
mindguard-backend/src/controllers/riskController.js  ← getTrend()
mindguard-backend/src/routes/risk.js                 ← GET /trend
mindguard-frontend/src/pages/Dashboard.jsx           ← exibe tendência no RiskCard area
```

---

## ORDEM DE EXECUÇÃO

```
Dia 1 (09/jun):
  ✅ Escrever este plano no Obsidian
  ✅ BUG 1: Apple Health 185MB (sax + limit 250MB) — commit a3565c0
  ✅ BUG 2: Metodologia toggle fix — commit a3565c0
  ✅ BUG 3: --bg-base CSS var — commit a3565c0
  ✅ UX 4: Botão relatório semanal sempre visível — commit a3565c0
  ✅ UX 5: Reorganizar aba Registrar Sinais + /api/wearables/status — commit a3565c0
  ✅ FEATURE 6: Responsivo iPhone (header, 44px targets, iOS zoom fix 16px) — commit 722d82f
  ✅ FEATURE 7: Área do Médico (MedicoView.jsx + /medico route) — commit 722d82f
  ✅ FEATURE 8: Streak badge + GET /api/signals/streak — commit 722d82f
  ✅ FEATURE 9: Mood Calendar heatmap 90 dias — commit 722d82f
  ✅ FEATURE 10: Exercício de Respiração (BreathingExercise.jsx) — commit 722d82f

Antes de 15/jun às 19h:
  ✅ FEATURE 11: Tendência Preditiva — commit 4cb4f41
  ✅ Fix streak (created_at) — commit 2d946ec
  ✅ Fix trend banner layout — commit 2d946ec
  ✅ Fix Apple Health na overview removido — commit 2d946ec
  ✅ Fix MedicoView score + médias 7d — commit 2d946ec
  ⬜ Testes end-to-end em produção com conta demo
  ⬜ Verificar deploy Railway (backend + frontend OK)
```

---

## ARQUIVOS CRIADOS / MODIFICADOS (resumo técnico)

### Backend (novos):
- `GET /api/wearables/status` → wearableController.getStatus()
- `GET /api/risk/trend` → riskController.getTrend()
- `GET /api/signals/streak` → signalController.getStreak()

### Backend (modificados):
- `appleHealthParser.js` → rewrite com SAX streaming + filtro 365 dias
- `routes/wearables.js` → limit 250MB

### Frontend (novos):
- `src/pages/MedicoView.jsx`
- `src/components/BreathingExercise.jsx`
- `src/components/MoodCalendar.jsx`
- `src/components/StreakBadge.jsx`
- `src/store/useStreakStore.js`

### Frontend (modificados):
- `src/index.css` → `--bg-base` dark + light
- `src/pages/Metodologia.jsx` → fix toggleTheme
- `src/pages/Dashboard.jsx` → botão relatório, streak, tendência, mood calendar
- `src/App.jsx` → rota `/medico`
- Todos os `.jsx` → responsivo mobile

---

## CRITÉRIOS DE SUCESSO

- [ ] Upload de arquivo 185MB do Apple Health funciona sem erro
- [ ] Clicar no sol/lua na página Metodologia muda o tema corretamente
- [ ] Background de Connect, WeeklyReport e Metodologia aparece corretamente no modo claro
- [ ] Card "Relatório Semanal" visível no Dashboard mesmo sem recomendações
- [ ] Aba "Registrar Sinais" mostra status da conexão Apple Health
- [ ] Dashboard carrega perfeitamente no iPhone 12 (375px) sem scroll horizontal
- [ ] Área do médico acessível em `/medico` com dados do usuário demo
- [ ] Streak exibido no Dashboard ("🔥 X dias")
- [ ] Mood Calendar visível no Dashboard
- [ ] Exercício de respiração interativo funciona
- [ ] Tendência preditiva exibida no RiskCard

---

[[Checklist]] | [[Fase2-Sprint-Final]] | [[Roadmap]]
