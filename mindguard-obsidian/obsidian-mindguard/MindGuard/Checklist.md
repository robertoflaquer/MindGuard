# MindGuard - Checklist do Projeto

## Status Geral: MVP Web ✅ · Agendamentos ✅ · Prescrições ✅ · Mobile 🔜 · Deploy 🔜
*Última atualização: 2026-05-14*

---

## 1. INFRAESTRUTURA ✅ 90%

- [x] PostgreSQL 15 instalado e rodando (porta 5433)
- [x] Banco `mindguard` criado com schema completo
- [x] Seed data completo (signal_types, questionnaire_types, risk_levels, action_types, context_types)
- [x] Índices otimizados
- [x] Migrations via `schema.sql` + `migrate.js`
- [x] Docker setup (Dockerfiles + docker-compose para deploy)
- [ ] Deploy em Railway/Render com HTTPS

---

## 2. BACKEND (Node.js) ✅ 100%

### Auth
- [x] POST /api/auth/register
- [x] POST /api/auth/login
- [x] GET /api/auth/profile
- [x] JWT (7 dias), bcrypt, rate limiting
- [x] Persistência de sessão no frontend (localStorage)

### Signals API
- [x] POST /api/signals/batch
- [x] GET /api/signals/recent
- [x] GET /api/signals/types
- [x] GET /api/signals/stats
- [x] POST /api/signals/simulate ← dados fictícios de wearable (novo)
- [x] Trigger automático baseline → risco após ingestão (fire-and-forget)

### Risk API
- [x] GET /api/risk/current
- [x] GET /api/risk/history
- [x] POST /api/risk/assess
- [x] GET /api/risk/levels

### Questionnaires API
- [x] GET /api/questionnaires/types
- [x] POST /api/questionnaires/submit (com cálculo de score PSS + reversão de itens)
- [x] GET /api/questionnaires/history
- [x] GET /api/questionnaires/due

### Contexts API
- [x] GET /api/contexts/types
- [x] GET /api/contexts/active
- [x] POST /api/contexts
- [x] PATCH /api/contexts/:id/close

### Appointments API (novo)
- [x] GET /api/appointments/specialists — lista especialistas do banco
- [x] GET /api/appointments/slots — horários disponíveis por especialista e data
- [x] GET /api/appointments — lista agendamentos do usuário
- [x] POST /api/appointments — criar agendamento (valida conflito de horário)
- [x] PATCH /api/appointments/:id/cancel — cancelar agendamento

### Prescriptions API (novo)
- [x] GET /api/prescriptions — listar prescrições do usuário
- [x] GET /api/prescriptions/:id — detalhes de uma prescrição
- [x] POST /api/prescriptions — criar prescrição com hash SHA-256 de auditoria

---

## 3. FRONTEND (React) ✅ 100%

### Auth & Navegação
- [x] Login funcional
- [x] Registro funcional
- [x] Token persistido no localStorage

### Design System
- [x] Tema dark/light com CSS Variables (`data-theme`)
- [x] `useThemeStore` com persistência em localStorage e sem flash
- [x] Fonte Nunito (CarePlus-inspired)
- [x] Paleta azul royal (dark: `#4A9EFF`, light: `#1565C0`)
- [x] Classes reutilizáveis: `.card`, `.btn-primary`, `.btn-ghost`, `.input-field`, `.label`
- [x] Animações: `fade-up`, `breathe`, `ring-breathe`, `pulse-dark`

### Dashboard
- [x] RiskCard com gauge circular SVG em português
- [x] Gráfico de sinais (grid de cards com sparklines Recharts)
- [x] Banner alertando questionários pendentes
- [x] Auto-refresh do risco ao voltar para aba Overview
- [x] Seção "Questionários Recentes" (último resultado por tipo)
- [x] Loading skeleton no RiskCard (`animate-pulse`)
- [x] Toast system global (success/error/info) com auto-dismiss
- [x] Error boundary — fallback visual para crashes
- [x] Card de acesso rápido para agendamento de consulta
- [x] Card de acesso rápido para Prescrições
- [x] Botão "Tratamento", "Prescrições" e "Contextos" no header
- [x] Botão "Simular Wearable" na aba Registrar Sinais (Apple Watch / Galaxy Watch)

### Questionários
- [x] Página `/questionnaires` completa
- [x] Formulário PSS-10 (10 perguntas, escala 0-4)
- [x] Formulário CBI (19 perguntas, 3 seções: Pessoal/Trabalho/Pessoas)
- [x] Formulário OLBI (16 perguntas, subscalas Exaustão/Desengajamento)
- [x] Formulário DAILY_CHECKIN (3 perguntas, escala 0-10)
- [x] Formulário GAD-7 (7 perguntas, escala 0-3, score 0–21)
- [x] Histórico com barra de progresso e nível
- [x] Indicadores "pendente" × "em dia" com próxima data

### Contextos de Vida
- [x] Página `/contexts` completa
- [x] 10 tipos pré-definidos + personalizado livre
- [x] Campo de notas livre (1000 chars)
- [x] Datas início/fim + intensidade (leve/moderado/grave)
- [x] Encerrar contexto ativo

### Tratamento / Agendamento
- [x] Página `/treatment` completa
- [x] Seleção de especialista (psiquiatra, psicólogo, terapeuta TCC)
- [x] Calendário de 7 dias com seleção de data
- [x] Grade de horários (com alguns bloqueados por realismo)
- [x] Formulário de observação antes da confirmação
- [x] Tela de confirmação do agendamento
- [x] Integração real com backend (`POST /api/appointments`) com fallback gracioso
- [x] `useAppointmentStore` — Zustand store dedicado para agendamentos

### Prescrições (novo)
- [x] Página `/prescriptions` completa
- [x] Lista de prescrições com accordion expandível
- [x] Exibição de itens: medicamento, dosagem, frequência, instruções
- [x] Hash SHA-256 de auditoria exibido visualmente
- [x] Estado vazio com CTA para agendar consulta

### Registro de Sinais
- [x] Nomes dos sinais traduzidos para português (sem `_` e sem inglês)
- [x] Múltiplos sinais em lote
- [x] Feedback via toast após envio
- [x] Simulação de wearable (Apple Watch / Galaxy Watch) no dashboard

---

## 4. PYTHON ENGINE (FastAPI) ✅ 95%

### Core funcionando
- [x] POST /risk/calculate
- [x] POST /baseline/calculate
- [x] GET /baseline/{user_id}
- [x] GET /health

### Integração Questionários
- [x] PSS integrado no RiskScorer (peso 45%)
- [x] CBI integrado no RiskScorer (peso 27%)
- [x] OLBI integrado no RiskScorer (peso 20%)
- [x] DAILY_CHECKIN integrado no RiskScorer (peso 10%)
- [x] Force thresholds por questionário
- [x] Explicação primária e fatores secundários em português
- [x] GAD-7 

### Algoritmos
- [x] Baseline: Mediana + IQR
- [x] Deviation: % change vs baseline
- [x] Fallback absoluto: thresholds populacionais sem baseline
- [x] Correlation: Weighted score + convergence
- [x] Bug fix: `mood` e `sleep_quality` contribuem corretamente
- [x] Risk scoring: questionários (70%) + sinais (30%) + ajuste de contexto

---

## 5. SEGURANÇA ✅ 90%

- [x] Bcrypt, JWT, prepared statements
- [x] Rate limiting, CORS, Helmet.js
- [x] Input sanitization XSS — `xss-clean` middleware em server.js
- [x] SQL injection corrigido — `INTERVAL` parameterizado com `$N * INTERVAL '1 day'`
- [x] `console.log` em database.js substituído por pino logger estruturado
- [ ] HTTPS (via Railway/Render no deploy)

---

## 6. BUGS ATIVOS 🟡

| Bug | Arquivo | Prioridade |
| --- | ------- | ---------- |
| Nenhum crítico conhecido | — | — |

---

## 7. BUGS CORRIGIDOS (histórico)

- [x] `import * as controller` → default import
- [x] `RealDictCursor` retorna dicts, não tuplas
- [x] `INSERT...RETURNING` nunca retornava
- [x] `INTERVAL '%s days'` → substituído por `timedelta`
- [x] FK violation: `baseline DELETE+INSERT` → UPSERT
- [x] `elevated_risk` ausente do banco
- [x] `set.fetchCurrentRisk()` → `get().fetchCurrentRisk()` (Zustand)
- [x] `baseURL` absoluto → `VITE_API_URL || ''`
- [x] Query ordenava por `assessment_date` → `assessment_timestamp`
- [x] Token perdido ao F5 → `useAuthStore.init()` + `App.jsx`
- [x] RiskCard em inglês → `LEVEL_CONFIG` pt-BR
- [x] Gráfico de sinais quebrado → reescrito com Recharts
- [x] `secondary_factors TEXT[]` recebia `json.dumps(list)` → "malformed array literal"
- [x] `convergence_count` contava melhorias como riscos
- [x] Sinais bons apareciam como "fatores de risco"
- [x] Header modo claro com fundo escuro fixo → agora usa `var(--header-blur)`
- [x] Nomes dos sinais com `_` e em inglês no dropdown → traduzidos com mapa pt-BR
- [x] SQL injection em `signalService.getSignalStats` — template literal `INTERVAL '${days} days'` → `$3 * INTERVAL '1 day'`
- [x] SQL injection em `riskController.getHistory` — mesmo padrão corrigido
- [x] `console.log` em `database.js` (4 ocorrências) → pino logger estruturado

---

## 8. DEPLOY 🚀 30%

- [x] Dockerfiles prontos (backend, frontend, python)
- [x] docker-compose.yml completo
- [ ] `.env` de produção configurado
- [ ] `docker-compose up --build` testado localmente
- [ ] Deploy em Railway.app ou Render.com
- [ ] HTTPS configurado automaticamente
- [ ] Variáveis de ambiente sensíveis em secrets do Railway/Render
- [ ] Domínio personalizado (opcional)

---

## 9. MOBILE 📱 0% — Planejado

> Ver [[Wearables-Integracao]] para decisões de SDK e plataforma.

### iOS (Swift / SwiftUI)
- [ ] Criar projeto Xcode com capability HealthKit
- [ ] Tela de login consumindo o mesmo backend
- [ ] Dashboard nativo com RiskCard
- [ ] `HKObserverQuery` + Background Delivery para sync matinal
- [ ] Push notifications (APNs)
- [ ] Publicar na App Store (requer conta Apple Developer $99/ano)

### Android (Kotlin + Jetpack Compose)
- [ ] Criar projeto Android Studio
- [ ] Health Connect SDK: leitura de HRV, sono, FC
- [ ] `WorkManager` para sync diário agendado
- [ ] Push notifications (FCM)
- [ ] Publicar na Google Play Store

### Alternativa Cross-Platform
- [ ] Avaliar React Native + `react-native-health` + Health Connect SDK
- [ ] Avaliar Flutter + Open Wearables SDK (ver [[Wearables-Integracao]])

---

## 10. WEARABLES 🔗 20% — Simulação funcionando

> Pesquisa completa em [[Wearables-Integracao]].

### Apple Watch (HealthKit)
- [ ] Definir estratégia: app nativo iOS ou Open Wearables SDK
- [ ] Implementar leitura de HRV, FC, sono, SpO₂
- [ ] Configurar sync automático matinal via Background Delivery
- [ ] Mapear dados HealthKit → `/api/signals/batch`

### Galaxy Watch (Health Connect)
- [ ] Implementar leitura via Android Health Connect (gratuito, sem aprovação)
- [ ] WorkManager com sync diário às 7h
- [ ] Mapear dados → `/api/signals/batch`
- [ ] Avaliar Samsung Health Data SDK partnership (para dados proprietários de estresse)

### Dados Simulados ✅
- [x] Endpoint `POST /api/signals/simulate` implementado — gera HRV, FC, sono, estresse, passos, humor com valores realistas
- [x] Suporta `device: "apple_watch"` e `device: "galaxy_watch"` como parâmetro
- [x] Botão "Simular Wearable" com seletor de device no Dashboard (aba Registrar Sinais)
- [x] Trigger automático de baseline → risco após simulação

---

## 11. TELECONSULTA & PRESCRIÇÃO 💊 75% — Backend + Frontend implementados

### Agendamento ✅
- [x] Página `/treatment` com fluxo completo de agendamento
- [x] Seleção de especialista + data + horário + observação
- [x] Tela de confirmação visual
- [x] Tabela `specialists` com seed data (3 especialistas)
- [x] Tabela `appointments` com colunas: id, user_id, specialist_id, scheduled_date, scheduled_time, duration_minutes, status, observations, risk_snapshot
- [x] `GET /api/appointments/specialists` — lista especialistas do banco
- [x] `GET /api/appointments/slots` — horários disponíveis (com detecção de conflitos reais)
- [x] `POST /api/appointments` — cria agendamento com validação de conflito
- [x] `GET /api/appointments` — lista agendamentos do usuário
- [x] `PATCH /api/appointments/:id/cancel` — cancelar agendamento
- [x] `useAppointmentStore` (Zustand) integrado ao Treatment.jsx

### Prescrição Remota ✅ (base implementada)
- [x] Tabela `prescriptions` (id, appointment_id, user_id, specialist_id, items JSONB, observations, audit_hash SHA-256, issued_at)
- [x] `POST /api/prescriptions` — criar prescrição com hash SHA-256 automático
- [x] `GET /api/prescriptions` — listar prescrições do usuário
- [x] `GET /api/prescriptions/:id` — detalhes de uma prescrição
- [x] Página `/prescriptions` — lista com accordion, exibe itens, observações e hash de auditoria
- [ ] Geração de PDF (PDFKit) — fase futura
- [ ] Controle de acesso por role médico — fase futura
- [ ] Envio por e-mail/WhatsApp — fase futura

---

## 12. LIMPEZA DE CÓDIGO 🧹 100% ✅

- [x] `console.log` em `database.js` substituído por pino logger (4 ocorrências)
- [x] `print()` de debug no Python Engine substituídos por `logging` estruturado — `baseline_calculator.py`, `deviation_analyzer.py`, `risk_scorer.py`, `main.py`, `config/database.py`
- [x] `README.md` criado nos 3 projetos (backend, frontend, python)
- [x] Imports não usados removidos do `Treatment.jsx` (`Clock`, `useToastStore`, `addToast`)
- [x] Auditoria de arquivos não utilizados no frontend — todos os arquivos têm uso, nenhum removido
- [x] `console.error` remanescentes em stores Zustand convertidos para `set({ error: ... })` — `useContextStore`, `useSignalStore`
- [x] Auditoria de comentários obsoletos em `.jsx` — nenhum encontrado, todos são úteis
- [x] Código morto removido dos stores Zustand — `useRiskStore`: removidos `fetchRiskLevels`, `fetchRiskHistory`, `triggerAssessment`, `riskLevels`, `riskHistory`; `useSignalStore`: removido `getStats`
- [x] Auditoria de estilos duplicados em `index.css` — nenhuma duplicata real, variantes de tema são intencionais
- [x] Backend: `optionalAuth` (middleware não usado) removido de `auth.js`; `getTotalSignalCount` (função não usada) removida de `signalService.js`

---

## O QUE FUNCIONA HOJE (2026-05-14)

✅ Backend Node.js (porta 3000) — todos endpoints incluindo appointments e prescriptions  
✅ PostgreSQL conectado + seed data completo (incluindo tabela specialists)  
✅ Auth (register, login, JWT, sessão persiste no F5)  
✅ Ingestão de sinais + trigger automático baseline → risco  
✅ Simulação de wearable (`POST /api/signals/simulate`) com Apple Watch e Galaxy Watch  
✅ Python Engine: baseline + risco calculados e salvos  
✅ Risco funciona mesmo sem baseline (fallback por thresholds populacionais)  
✅ Design system dark/light com CSS Variables + Nunito font  
✅ RiskCard com gauge circular SVG em português  
✅ Gráfico de sinais: grid de cards com sparklines  
✅ Questionários: PSS, CBI, OLBI, DAILY_CHECKIN e GAD-7 funcionais  
✅ Contextos de Vida com 10 tipos + personalizado  
✅ Agendamento: fluxo completo com backend real (especialistas, slots, conflitos)  
✅ Prescrições: CRUD completo com hash SHA-256 de auditoria  
✅ Nomes de sinais traduzidos para português no dropdown  
✅ Botão Simular Wearable no Dashboard (seletor Apple Watch / Galaxy Watch)  
✅ XSS sanitization + SQL injection corrigido + logs estruturados  
⚠️ Mobile: não iniciado  
⚠️ Wearables físicos: pesquisa feita, implementação não iniciada (dados simulados funcionam)  
⚠️ Prescrição PDF: base implementada, geração de PDF pendente  
⚠️ Deploy: não realizado  

---

## PRÓXIMAS PRIORIDADES

### Sprint 1 — Deploy
1. [ ] Rodar `node src/database/migrate_appointments.js` em produção
2. [ ] Testar `docker-compose up --build` localmente
3. [ ] Configurar `.env` de produção
4. [ ] Deploy Railway/Render
5. [ ] Testar fluxo end-to-end em produção

### Sprint 2 — Prescrição PDF
1. [ ] Integrar PDFKit para gerar prescrição como PDF
2. [ ] Adicionar role `doctor` ao sistema de autenticação
3. [ ] Interface médica de prescrição integrada ao histórico do paciente
4. [ ] Envio por e-mail (nodemailer)

### Sprint 3 — Mobile MVP
1. [ ] Definir plataforma (React Native ou nativo)
2. [ ] App iOS com HealthKit + sync matinal
3. [ ] App Android com Health Connect

### Sprint 4 — Wearables Físicos
1. [ ] Integrar Health Connect (Android) — sem aprovação necessária
2. [ ] Integrar HealthKit (iOS) — background delivery via HKObserverQuery

---

[[Arquitetura]] | [[Backend]] | [[Database]] | [[Frontend]] | [[Python-Engine]] | [[Roadmap]] | [[Wearables-Integracao]]
