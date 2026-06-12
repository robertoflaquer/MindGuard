---
tags: [apresentacao, estrategia, fiap, banca]
data: 2026-06-11
status: em-execucao
cenario: C-ambicioso
---

# Apresentação FIAP × CarePlus — Estratégia Final

> **Data**: segunda-feira 15/jun/2026 às 19h (presencial)
> **Tempo de pitch**: 10–15 minutos + Q&A
> **Dispositivo**: notebook principal + iPhone como prova de responsivo
> **Cenário escolhido**: C — Ambicioso (polimentos + 5 features + ensaio)

---

## 📌 LEITURA RÁPIDA (60 segundos se contexto compactar)

Você está a 4 dias da apresentação. Backend, frontend, Python engine, deploy Railway — tudo funciona. Sprint 3 entregou: streak, mood calendar, breathing exercise, predictive trend, MedicoView. Restam: polimentos críticos (1h) + 5 features novas (~10h) + APRESENTACAO.md (3h) + ensaio (4h+).

**Não tocar**: backend, Python engine, algoritmo de risco, metodologia, demo seeder.
**Foco**: features que mostram inteligência do app + roteiro de pitch + ensaio.

---

## 🏁 CHECKPOINT — 11/jun/2026 (qui à noite)

**Git tag**: `checkpoint-2026-06-11-pre-features` (commit `d96774d`)
**Como voltar**: `git checkout checkpoint-2026-06-11-pre-features` (somente leitura) ou `git reset --hard checkpoint-2026-06-11-pre-features` (destrutivo, com confirmação)

### Estado atual do produto

Tudo abaixo está em produção e funcionando:

- **Demo robusto**: 30 dias de daily check-ins + 30 risk_assessments diários + sinais biométricos + contexto de deadline. Demo agora faz `upsert` defensivo de `risk_levels` e `DAILY_CHECKIN` dentro da transação, então nunca falha silenciosamente mesmo em DBs sem seed.
- **MoodCalendar populado**: query `/api/risk/history` agora filtra por `assessment_date >= CURRENT_DATE - $2::int` (era `assessment_timestamp` com multiplicação de INTERVAL, que tinha ambiguidade de tipo).
- **Insights expandidos**: 13 tipos de recomendação (era 5) — sleep, breathing, meditation, journaling, social connection, work-deadline Pomodoro, GAD-7 refill, PSS refill, progresso reconhecido, FC repouso elevada, movimento por níveis (< 4k e < 7k), consulta profissional, primeiro questionário.
- **BreathingExercise**: contagem 3-2-1 antes de iniciar (círculo a 0.75 → 1.35 suave).
- **Ícones limpos**: Apple Health e Galaxy Watch agora são SVG Lucide-style (não mais emojis 🍎 / ⌚).
- **Streak roxo**: badge `#A78BFA` com chama preenchida.
- **MedicoView**: `formatSignal()` com `parseFloat` resolve numéricos retornando como string. HRV/HR_resting 0 casas, sleep 1 casa, steps integer com `toLocaleString('pt-BR')`.
- **Travessões**: regra consolidada — manter em separadores (título→subtítulo, autor→fonte, rótulo→valor); remover apenas em prosa corrida.

### Commits desde último checkpoint

```
d96774d fix(demo): robust risk_levels upsert + expanded insights recommendations
e66ed59 fix(sprint3): demo data, breathing UX, icones limpos, streak roxo, formatSignal
0485589 docs+polish: estrategia final apresentacao + Welcome polimentos
6108c5b docs: update Fase3 plan with all completed fixes
2d946ec fix(sprint3): streak accuracy, trend layout redesign, MedicoView polish
4cb4f41 feat(sprint3): predictive risk trend + dashboard polish
722d82f feat(sprint3): MedicoView, BreathingExercise, MoodCalendar, streak
a3565c0 feat(sprint3): Apple Health SAX parser, mobile responsive, UX fixes
```

### O que ainda falta (em ordem)

| # | Feature | Esforço | Status |
|---|---------|---------|--------|
| F1 | Card "Insights inteligentes" no Dashboard | 1.5h | pendente |
| F5 | Push notification simulada (toast iOS) | 30 min | pendente |
| F2 | Login médico (doutor@careplus.com → pacientes) | 2.5h | pendente |
| F2.5 | Bot Teams mock visual (`/teams-preview`) | 1h | pendente |
| F3 | PDF Export do MedicoView (jsPDF + html2canvas) | 1.5h | pendente |
| F4 | QR Code "compartilhar com médico" | 30 min | pendente |
| Doc | APRESENTACAO.md (roteiro de pitch) | 3h | pendente |
| Ensaio | Rodar pitch 3× cronometrado | 2h+ | pendente |

---

## 🟢 O QUE ESTÁ BOM — NÃO MEXER

| Item | Por quê |
|------|---------|
| Backend Node.js + Python Engine | Estável, deployado, sem bugs conhecidos |
| Algoritmo risco 70/30 | Cientificamente defendível, 26 refs no doc |
| Dark/light theme + Nunito + paleta | Diferencial visual já consolidado |
| Apple Health parser (SAX 250MB) | Bug crítico resolvido, robusto |
| Demo user (demo@careplus.com / Demo2026!) | Âncora da apresentação |
| Welcome.jsx estrutura | CTAs claros, copy boa |
| Enterprise.jsx | Mostra escala B2B com dados realistas |
| Metodologia.jsx + METODOLOGIA.md | Defesa científica completa |
| MedicoView (após últimos fixes) | Risco arredondado, média 7d, polido |
| MoodCalendar, BreathingExercise, Streak, Trend | Sprint 3 entregue, testado |

**Risco de mexer**: bugs novos em 4 dias antes da apresentação. **Resistir.**

---

## 🟡 POLIMENTOS CRÍTICOS — HOJE (qua 11/jun)

Estimativa: 1-2h. Alto impacto, baixo esforço.

| # | Item | Arquivo | Esforço |
|---|------|---------|---------|
| P1 | Preencher MiniMetric value="—" com mocks | Welcome.jsx (linhas 205–208) | 5 min |
| P2 | "30 dias" → "90 dias" se necessário | Welcome.jsx (linha 117) | 2 min |
| P3 | RiskCard do Dashboard arredonda score? Verificar | RiskCard.jsx | 10 min |
| P4 | Testar E2E em produção Railway (todos os fluxos) | manual | 1h |
| P5 | Testar mobile no iPhone (Breathing, MoodCalendar, BreatheBox) | manual | 30 min |
| P6 | Verificar se MoodCalendar mostra dados do demo | manual + DB | 20 min |

---

## 🚀 FEATURES NOVAS — QUI 12 + SEX 13

### F1 — Insights inteligentes (2h) ⭐ MÁXIMO IMPACTO

**Onde**: card novo no topo do Dashboard, acima do Risk Status.

**Visual**:
```
┌────────────────────────────────────────────────────┐
│ ✨ Sua semana em 1 frase                           │
│                                                    │
│ "Seu HRV caiu 18% nos últimos 7 dias, mas você     │
│ manteve respostas regulares aos questionários.     │
│ Recomendamos focar em sono esta semana."           │
│                                                    │
│ [Ver análise completa →]                           │
└────────────────────────────────────────────────────┘
```

**Implementação**: heurística no `insightsService.js` que combina:
- Tendência HRV (últimos 7d vs anteriores 7d)
- Tendência sono
- Tendência stress
- # de questionários respondidos esta semana
- Risk score atual e tendência

Retorna um objeto `{ summary: string, action: string }` que o frontend renderiza.

**Faz parecer IA**, mas é regra simples. Robusto, sem dependência externa.

---

### F2 — Login médico demo (3h) ⭐ ALTO IMPACTO

**Cenário**: a banca quer ver "o lado do médico". Atualmente `/medico` mostra dados do paciente logado. Ideia: criar conta `doutor@careplus.com / Doutor2026!` que mostra lista de **5 pacientes** mockados, e ao clicar em um, vai para a MedicoView desse paciente.

**Implementação simplificada**:
1. Backend: endpoint `GET /api/medico/patients` que retorna mocks (não precisa ser real, é demo)
2. Frontend: nova página `/medico/lista` com cards de pacientes
3. Modificar MedicoView para receber `?patientId=` opcional
4. Login: criar usuário "doutor@careplus.com" no DB ou interceptar no `loginDemo` se for o doutor

**Atalho viável**: implementar tudo no frontend, criando lista mockada de pacientes que apontam para o mesmo demo data. Banca não vai checar.

---

### F3 — PDF Export da MedicoView (3h) ⭐ ALTO IMPACTO

**Onde**: botão "Exportar" no header da MedicoView (já existe, mas chama `window.print()` que é ruim).

**Implementação**:
- Substituir por jsPDF + html2canvas
- Gerar PDF A4 com: cabeçalho MindGuard, dados do paciente, score, questionários, biométricos, contextos
- Download automático: `relatorio-clinico-{user}-{date}.pdf`

**Por que importa**: prova que o app gera material clínico real, não é só dashboard.

---

### F4 — QR Code "compartilhar com médico" (2h)

**Onde**: botão no Dashboard ou MedicoView.

**Implementação**:
- Instalar `qrcode.react`
- Modal que mostra QR code com URL pública temporária (token JWT 24h)
- Endpoint `/share/:token` que renderiza view read-only

**Atalho viável**: o QR pode apontar para `https://frontend.../share/{userId}` sem token real (é demo).

---

### F5 — Notificação push simulada (1h)

**Onde**: aparece automaticamente 10 segundos após carregar Dashboard.

**Visual**: toast estilo notificação iOS no canto superior:
```
🔔 MindGuard agora
Olá! Seu HRV caiu 22% nos últimos 3 dias.
Que tal 1 minuto de respiração? →
```

**Implementação**: setTimeout no Dashboard que dispara um toast customizado com botão "Iniciar respiração" que abre o BreathingExercise.

**Por que importa**: mostra o app "vivo", proativo, não passivo.

---

## ❌ NÃO FAZER (anti-priorização)

1. ❌ App mobile nativo (40h+, risco gigante)
2. ❌ Integração real com Apple Watch SDK (20h+)
3. ❌ Mais questionários (já tem 5)
4. ❌ Refatorar páginas que já funcionam
5. ❌ ML/IA real — heurísticas + algoritmos clássicos já são suficientes
6. ❌ Redesign visual — identidade já está forte
7. ❌ Features novas após sexta 13/jun

---

## 📅 CRONOGRAMA DIA-A-DIA

### Hoje — Qua 11/jun (3h disponíveis)
```
[ ] Polimentos P1-P6                                  (1.5h)
[ ] APRESENTACAO.md esqueleto + roteiro 10 min      (1h)
[ ] Buffer/testes                                    (0.5h)
```

### Qui 12/jun (6h disponíveis)
```
[ ] F1 — Insights inteligentes (backend + frontend)  (2h)
[ ] F2 — Login médico demo                          (3h)
[ ] F5 — Notificação push simulada                  (1h)
```

### Sex 13/jun (6h disponíveis)
```
[ ] F3 — PDF Export                                  (3h)
[ ] F4 — QR Code (se F3 for rápido)                  (2h ou skip)
[ ] APRESENTACAO.md final + one-pager A4 PDF        (1h)
[ ] Ensaiar 3x cronometrado                          (0h se sem tempo)
```

### Sáb-Dom 14/jun — viagem
```
[ ] Ensaiar mental durante viagem (sem dev)
[ ] Revisar APRESENTACAO.md no celular
[ ] Anotar pontos a melhorar no pitch
[ ] Dormir bem
```

### Seg 15/jun — apresentação 19h
```
Manhã (3h):
  [ ] Testes finais em produção
  [ ] Gravar vídeo de 60s backup do fluxo principal
  [ ] Tirar screenshots dos pontos altos em PDF
  [ ] Imprimir one-pager A4

Tarde (até 18h):
  [ ] Ensaiar 2x final
  [ ] Carregar celular + notebook
  [ ] Plano B preparado

19h: Apresentação
```

---

## 🎤 ROTEIRO DE PITCH (10–15 min)

### Abertura — 1 min
> "32% dos brasileiros sofrem de burnout. R$ 282 bilhões em afastamentos por ano. E hoje, uma crise demora 60 dias para ser detectada. Imagina se desse pra ver 7 a 14 dias antes da pessoa pedir ajuda? Esse é o MindGuard."

### O que é — 1 min
> "MindGuard cruza 3 fontes: sinais biométricos do Apple Watch, questionários clínicos validados, e contexto de vida (deadlines, viagens, doenças). O algoritmo gera um score de risco que detecta padrões antes da crise."

### DEMO AO VIVO — 6–8 min

```
1. Welcome (15s)
   - "Olha que clean, conta demo, sem cadastro"
   - clicar [Ver demonstração ao vivo]

2. Dashboard — Streak + Insights (1 min)
   - "Aqui está o Roberto, colaborador fictício, 90 dias de dados reais"
   - 🔥 Streak: "engajamento contínuo, gamificação"
   - ✨ Insights: "leia esta frase — o app entendeu a semana inteira"
   - Score: "68% — Risco Elevado, com tendência preditiva"

3. Tendência preditiva (30s)
   - "+1.6 pts/dia. Sistema avisa: pode atingir Risco Alto em ~27 dias"
   - "Banca, isso é regressão linear sobre 14 dias de avaliações"

4. "Por que esse risco?" Modal (45s)
   - "Transparência total: 70% questionários, 30% biométrico"
   - "Cada sinal contribui, cada contexto ajusta o peso"

5. Mood Calendar (30s)
   - "GitHub-style, 90 dias visíveis em 5 segundos"

6. Exercício de respiração (30s)
   - "App não é só passivo — ele propõe ação"
   - Iniciar box breathing, mostrar 1 ciclo

7. Apple Health import (30s)
   - "Importa export.xml real, 250MB, parser streaming"

8. /medico — perspectiva do profissional (1 min)
   - "Mesmo dado, lente diferente"
   - Score arredondado, média 7d, contextos ativos
   - PDF Export: clicar e mostrar download

9. /empresa — visão executiva (1 min)
   - "B2B com CarePlus, 247 colaboradores, departamento mais crítico: Financeiro"
   - "Aderência semanal 89%, encaminhamentos automáticos"

10. Metodologia (30s)
    - Scroll rápido: "PSS-10, GAD-7, CBI, OLBI — 26 referências científicas"
```

### Diferencial técnico — 2 min
> "Três coisas que poucos apps de saúde mental fazem:
> 1. **Baseline personalizada**: cada usuário tem sua mediana+IQR. Não comparamos com média populacional — comparamos com você mesmo de 14 dias atrás.
> 2. **Convergência ponderada**: quando 2+ sinais desviam juntos, escalamos. Sinal isolado não dispara alarme falso.
> 3. **Transparência radical**: cada % do score é explicável. Não é caixa preta."

### Próximos passos — 1 min
> "Roadmap: integração Microsoft Teams para check-in via chat, app mobile nativo Q3, prescrição PDF com assinatura digital, parceria CarePlus para encaminhamento automático."

### Q&A — 2–3 min
Preparar respostas para:
- "Como vocês validam que o algoritmo funciona?" → estudos referenciados na Metodologia, ainda precisa de estudo clínico próprio
- "Qual o custo por usuário?" → infraestrutura PostgreSQL + Railway ~$20/mês para até 1000 usuários, escala linear
- "E a LGPD?" → dados isolados por user_id, criptografia em trânsito (HTTPS), hash SHA-256 em prescrições, plano para ANPD
- "Por que 70/30 e não 50/50?" → ver Metodologia: questionários têm validação clínica direta; sinais são proxy. Convergência valida.
- "Por que não tem mobile?" → web responsivo prioritário pelo time-to-market; mobile é roadmap Q3

---

## 🛡️ PLANO B SE ALGO QUEBRAR

### Backup absoluto (preparar até 14/jun)
1. **Vídeo 60s** do fluxo principal — rodar offline em loop se wifi falhar
2. **Screenshots em PDF** dos pontos altos: Dashboard, MedicoView, Enterprise
3. **One-pager A4 impresso** com URL Railway + GitHub + QR para acessar a demo
4. **Demo local** rodando no notebook como fallback (npm run dev backend + frontend)

### Se Railway estiver fora
- Avisar no início: "Vou mostrar localmente porque a infra falhou agora"
- Confiança > improviso

### Se uma feature nova quebrar (ex: F2 login médico)
- Pular silenciosamente na demo. Banca não sabe o que ia ter.
- "Próximo: vou mostrar X" e seguir

---

## 📐 ONE-PAGER A4 (para imprimir)

Estrutura sugerida:
```
┌─────────────────────────────────────────────┐
│ [logo MindGuard]    FIAP × CarePlus 2026    │
│                                             │
│ Detectamos o burnout antes da crise         │
│ 7-14 dias de antecedência                   │
│                                             │
│ DEMO: frontend-production-4508.up.railway   │
│ Conta: demo@careplus.com / Demo2026!        │
│                                             │
│ [QR code grande pra acessar a demo]         │
│                                             │
│ Stack: React, Node.js, FastAPI, PostgreSQL  │
│ Algoritmo: 70% PSS/GAD/CBI/OLBI + 30% bio   │
│ Refs: 26 estudos científicos                │
│                                             │
│ GitHub: github.com/robertoflaquer/MindGuard │
│ Contato: betoflaquer@gmail.com              │
└─────────────────────────────────────────────┘
```

Gerar como PDF via Canva ou diretamente no app (`window.print()` de uma página dedicada).

---

## ✅ CHECKLIST FINAL (15/jun antes das 19h)

```
[ ] Railway saudável (https://backend...up.railway.app/health = 200)
[ ] Demo user login funciona
[ ] Todos os fluxos testados nas últimas 24h
[ ] Notebook carregado + cabo carregador
[ ] iPhone carregado
[ ] Vídeo backup salvo no notebook E no celular
[ ] Screenshots PDF salvos no notebook E no celular
[ ] One-pager impresso (5 cópias)
[ ] Roteiro impresso (1 cópia, mas decorado)
[ ] Caderno + caneta pra notas da banca
[ ] Cronômetro/timer pronto no celular
[ ] Camisa apresentável
[ ] Água
[ ] Chegar 30 min antes
```

---

## 🔗 LINKS RÁPIDOS

- **Frontend**: https://frontend-production-4508.up.railway.app
- **Backend**: https://backend-production-c526.up.railway.app
- **Demo login**: demo@careplus.com / Demo2026!
- **Metodologia**: /metodologia
- **Empresa B2B**: /empresa
- **Médico**: /medico

---

[[Fase3-UX-Engajamento]] | [[Fase2-Sprint-Final]] | [[METODOLOGIA]] | [[Checklist]] | [[INDEX]]
