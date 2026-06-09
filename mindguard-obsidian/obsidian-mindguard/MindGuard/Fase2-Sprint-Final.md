# Fase 2 — Sprint Final (9–15/jun/2026)

> Preparação para apresentação presencial — **15/jun/2026 às 19h**
> Banca: FIAP × CarePlus
> Feedback recebido na Fase 1 → 4 itens a corrigir

---

## Contexto

O projeto passou para a fase final. A banca levantou quatro pontos:

1. **Q1** — Transparência do risco: "como é distribuído o peso? por que esse risco está nesse valor?"
2. **Q2** — Recomendações: "precisa melhorar muito a parte de recomendações"
3. **Q3** — Metodologia científica: "querem um documento mostrando que essa divisão de pesos é embasada"
4. **Q4** — Integração real com wearable: "dados simulados não são suficientes para a fase final"

**Decisão**: Implementar todos os 4 itens (Plano B completo).
**Wearable escolhido**: Apple Health XML export (Opção A).

---

## Restrições de Tempo

```
Hoje (seg 09/jun): disponível a partir das ~15h
Ter 10/jun: 15h–21h (6h)
Qua 11/jun: 15h–21h (6h)
Qui 12/jun: 15h–21h (6h)
Sex 13/jun: 15h–21h (6h)
Sáb 14/jun: viagem — sem dev
Dom 14/jun: viagem — sem dev
Seg 15/jun: ajustes finais + apresentação às 19h

Total disponível: ~26–30h de dev
```

---

## Etapas de Execução

### Etapa 1 — METODOLOGIA.md + Página /metodologia ✅ (doc criado)

**Status**: Documento científico criado em [[METODOLOGIA.md]]

**O que falta**:
- [ ] Criar página `/metodologia` no frontend (React)
- [ ] Adicionar link "Metodologia" no header do Dashboard
- [ ] Rota em App.jsx

**Arquivos a criar/modificar**:
```
mindguard-frontend/src/pages/Metodologia.jsx  (NOVO)
mindguard-frontend/src/App.jsx                (adicionar rota)
mindguard-frontend/src/pages/Dashboard.jsx    (link no header)
```

**Estimativa**: 3h

---

### Etapa 2 — Transparência do Risco ("Por que esse risco?") 🔴 PRIORITÁRIO

**O que entregar**: Ao clicar no RiskCard, o usuário vê:
```
┌─────────────────────────────────────────────┐
│  Por que seu risco está em 68%?             │
│                                             │
│  QUESTIONÁRIOS (70%)           ████████ 71% │
│    PSS-10: 28/40 — Elevado                  │
│    GAD-7: 14/21 — Moderado-Severo           │
│                                             │
│  SINAIS BIOMÉTRICOS (30%)      ████▌    45% │
│    HRV: 38ms (baseline: 61ms, −38%)         │
│    Sono: 5.8h (baseline: 7.5h, −23%)        │
│                                             │
│  CONTEXTOS ATIVOS              [+10%]       │
│    • Deadline de trabalho (moderado)        │
│                                             │
│  [Ver metodologia científica →]             │
└─────────────────────────────────────────────┘
```

**Arquivos a criar/modificar**:
```
mindguard-frontend/src/components/RiskExplanationModal.jsx  (NOVO)
mindguard-frontend/src/pages/Dashboard.jsx                  (botão "Por que?")
mindguard-backend/src/controllers/riskController.js         (enriquecer /current)
```

**O que o backend já retorna** (verificar se suficiente):
- `primary_explanation` ✅
- `secondary_factors` ✅ (array)
- `contributing_signals` ✅ (JSON com valor/baseline/%)
- `risk_score` ✅
- `confidence_level` ✅

**Provavelmente falta no backend**: decomposição explícita Q_score vs S_score
→ Adicionar campo `score_breakdown: { questionnaires: X, signals: Y, context_multiplier: Z }` no risk_assessment

**Estimativa**: 5h (backend 1.5h + frontend modal 2h + integração 1.5h)

---

### Etapa 3 — Recomendações + Mini-relatório Semanal

**O que entregar**:

**No Dashboard** — seção "Próximos Passos":
```
┌─────────────────────────────────────────────┐
│  O que fazer agora                          │
│                                             │
│  🧘 Respiração guiada (5 min)              │
│     HRV baixa sugere ativação do simpático  │
│     [Iniciar] [Já fiz isso ✓]              │
│                                             │
│  😴 Priorize o sono esta semana             │
│     Média dos últimos 7 dias: 5.8h          │
│     [Registrar sono de ontem]              │
│                                             │
│  📋 Refaça o PSS-10                         │
│     Última vez: 5 dias atrás (score: 28)   │
│     [Ir para questionários]                │
└─────────────────────────────────────────────┘
```

**Página `/relatorio-semanal`** — narrativa automática:
```
"Sua semana, 3–9 de junho"

Você teve uma semana difícil. Seu HRV médio foi 15% abaixo 
do seu normal, e você dormiu em média 5.8 horas — bem abaixo 
das 7.5h do seu baseline.

O bom: você completou 2 questionários e registrou contexto 
de deadline, o que nos ajuda a entender melhor sua situação.

Para a próxima semana, recomendamos focar em sono primeiro. 
Pequenas melhorias de 30 minutos já têm impacto mensurável na HRV.
```

**Arquivos a criar/modificar**:
```
Backend:
  mindguard-backend/src/services/insightsService.js     (NOVO)
  mindguard-backend/src/controllers/insightsController.js (NOVO)
  mindguard-backend/src/routes/insights.js              (NOVO)
  mindguard-backend/src/server.js                       (registrar rota)

Frontend:
  mindguard-frontend/src/store/useInsightsStore.js      (NOVO)
  mindguard-frontend/src/pages/Dashboard.jsx            (seção "Próximos Passos")
  mindguard-frontend/src/pages/WeeklyReport.jsx         (NOVO)
  mindguard-frontend/src/App.jsx                        (rota /relatorio-semanal)
```

**Endpoint**:
```javascript
GET /api/insights
Response: {
  recommendations: [
    { type: "breathing", title, reason, action, priority },
    { type: "sleep", title, reason, action, priority },
    { type: "questionnaire", title, reason, action, priority }
  ],
  weekly_narrative: {
    period: "3–9 jun",
    summary: "...",
    highlights: ["..."],
    next_week_focus: "..."
  }
}
```

**Estimativa**: 8h (backend 3h + frontend 5h)

---

### Etapa 4 — Apple Health XML Import

**Status**: aguardando `export.xml` do usuário

**O que entregar**: Página `/conectar` com:
1. Instruções passo a passo para exportar do iPhone
2. Upload de arquivo ZIP ou XML
3. Parser que extrai: HRV, FC repouso, sono, passos, variáveis respiratórias
4. Preview antes de importar
5. Botão "Importar X registros"

**Sinais a extrair do export.xml**:
```
HKQuantityTypeIdentifierHeartRateVariabilitySDNN → HRV
HKQuantityTypeIdentifierRestingHeartRate         → HR_resting
HKCategoryTypeIdentifierSleepAnalysis            → sleep_duration, sleep_quality
HKQuantityTypeIdentifierStepCount                → steps
HKQuantityTypeIdentifierOxygenSaturation         → spo2 (futuro)
```

**Arquivos a criar/modificar**:
```
Backend:
  mindguard-backend/src/services/appleHealthParser.js    (NOVO)
  mindguard-backend/src/controllers/wearableController.js (NOVO)
  mindguard-backend/src/routes/wearables.js              (NOVO)
  mindguard-backend/src/server.js                        (registrar rota)

Frontend:
  mindguard-frontend/src/pages/Connect.jsx               (NOVO)
  mindguard-frontend/src/App.jsx                         (rota /conectar)
  mindguard-frontend/src/pages/Dashboard.jsx             (link/card para /conectar)
```

**Endpoint**:
```javascript
POST /api/wearables/apple-health/import
Content-Type: multipart/form-data
Body: { file: export.xml }

Response: {
  success: true,
  data: {
    imported: 247,
    signals: { HRV: 45, sleep: 31, steps: 31, HR: 45 },
    date_range: "2026-04-10 → 2026-06-09",
    message: "247 registros importados com sucesso"
  }
}
```

**Estimativa**: 7h (parser XML 3h + backend 1.5h + frontend 2.5h)
**Bloqueio**: precisa do export.xml para testar e calibrar o parser

---

## Ordem de Execução Recomendada

```
Seg 09/jun (tarde/noite):
  ✅ Obsidian atualizado (este doc + METODOLOGIA)
  → Etapa 1: Página /metodologia no frontend (3h)

Ter 10/jun:
  → Etapa 2: Transparência do risco — backend + modal (5h)
  → Início Etapa 3: insightsService.js + endpoint (1h)

Qua 11/jun:
  → Etapa 3: Completar recommendations + seção Dashboard (5h)
  → Etapa 3: WeeklyReport page (2h) [se tempo permitir]

Qui 12/jun:
  → Etapa 4: Apple Health parser (quando XML chegar)
  → Etapa 4: Frontend /conectar
  → Buffer: polimento, bugs, deploy

Sex 13/jun:
  → Deploy de todas as mudanças no Railway
  → Testes end-to-end no site em produção
  → Preparar roteiro de apresentação atualizado
```

---

## Checklist de Deploy Final

```
[ ] Todas as 4 etapas implementadas e testadas localmente
[ ] git commit + git push para main
[ ] Railway faz auto-deploy (verificar no dashboard)
[ ] Testar demo user em produção: POST /api/auth/demo
[ ] Testar /metodologia page em produção
[ ] Testar modal "Por que esse risco?" em produção
[ ] Testar seção recomendações em produção
[ ] Testar import Apple Health em produção
[ ] APRESENTACAO.md atualizado com novos URLs e roteiro
```

---

## Notas Importantes

- **Não quebrar o MVP**: todas as mudanças são aditivas (novas páginas/endpoints) ou modificações cirúrgicas nos existentes
- **Demo user**: o endpoint `/api/auth/demo` deve continuar funcionando perfeitamente — é a âncora da apresentação
- **Fallback gracioso**: se qualquer nova feature não carregar, o dashboard principal deve continuar funcionando
- **Mobile first**: as novas páginas devem funcionar bem no iPhone (apresentação pode ser feita pelo celular)

---

[[METODOLOGIA]] [[Roadmap]] [[Checklist]] [[Backend]] [[Frontend]]
