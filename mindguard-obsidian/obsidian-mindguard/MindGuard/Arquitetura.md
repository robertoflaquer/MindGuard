# Arquitetura MindGuard

## Visão Geral

MindGuard é um sistema de **monitoramento preventivo de saúde mental** que integra dados fisiológicos, psicológicos e contextuais para detecção precoce de risco.

```
┌─────────────────────────────────────────────────────────┐
│              Frontend (React - Port 3001)               │
│  Login · Register · Dashboard · Questionnaires         │
│  Contexts · Treatment · (Mobile futuramente)           │
│  Design System: dark/light · Nunito · CSS Variables    │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP/JSON (JWT)
┌───────────────────────▼─────────────────────────────────┐
│           Backend (Node.js - Port 3000)                 │
│  Auth · Signals · Risk · Questionnaires · Contexts     │
└───────────────────────┬─────────────────────────────────┘
                        │ SQL + HTTP
          ┌─────────────┴─────────────┐
          │                           │
┌─────────▼──────────┐    ┌──────────▼──────────┐
│   PostgreSQL       │    │   Python Engine     │
│   (Port 5433)      │    │   (Port 8000)       │
│                    │    │                     │
│ - users            │    │ - BaselineCalculator│
│ - user_signals     │    │ - DeviationAnalyzer │
│ - baselines        │    │ - CorrelationEngine │
│ - risk_assessments │    │ - RiskScorer        │
│ - questionnaire_*  │    │   (PSS/CBI/OLBI/DC) │
│ - contexts         │    └─────────────────────┘
│ - context_types    │
└────────────────────┘

FUTURO (Fase 3+):
┌────────────────────┐    ┌──────────────────────┐
│  App iOS (Swift)   │    │  App Android (Kotlin)│
│  HealthKit +       │    │  Health Connect +    │
│  Background Sync   │    │  WorkManager         │
└────────────────────┘    └──────────────────────┘
          │                           │
          └─────────────┬─────────────┘
                        │ POST /api/signals/batch
                   (mesmo backend)
```

---

## Fluxo de Dados

### 1. Usuário registra sinais (HRV, sleep, stress)

```
Frontend → Backend (/api/signals/batch)
         ↓
Backend valida → PostgreSQL (user_signals)
         ↓
Backend → Python Engine (/baseline/calculate)
         ↓
Python calcula baseline → PostgreSQL (baselines)
```

### 2. Sistema avalia risco (automático ou manual)

```
Backend → Python Engine (/risk/calculate)
       ↓
Python:
  - Correlaciona sinais (DeviationAnalyzer)
  - Detecta desvios do baseline
  - Calcula score de risco (RiskScorer)
       ↓
Python → PostgreSQL (risk_assessments)
       ↓
Backend → Frontend (exibe risco em tempo real)
```

### 3. Usuário vê resultado no Dashboard

```
Frontend:
  - Card com nível de risco (cores)
  - Explicação do que mudou
  - Ações recomendadas (exercícios, contato profissional)
  - Gráfico de sinais históricos
```

---

## Componentes Principais

### Frontend (React)
**Responsável**: Apresentar dados, coletar inputs

- **Pages**:
  - `Login.jsx` — Autenticação com rings animados
  - `Register.jsx` — Cadastro de novo usuário
  - `Dashboard.jsx` — Abas: Visão Geral / Registrar Sinais + botão Simular Wearable
  - `Questionnaires.jsx` — Lista pendentes + formulários + histórico
  - `Contexts.jsx` — Contextos de vida ativos + cadastro
  - `Treatment.jsx` — Agendamento real (especialista, data, hora) integrado ao backend
  - `Prescriptions.jsx` — Prescrições com accordion + hash SHA-256

- **Componentes**:
  - `RiskCard` — Gauge circular SVG + nível + fatores + ação recomendada
  - `SignalForm` — Multi-sinais em lote com nomes em português
  - `SignalChart` — Grid de cards com sparklines por tipo de sinal
  - `PSSForm` — Formulário PSS-10 (10 perguntas, escala 0–4)
  - `CBIForm` — Copenhagen Burnout Inventory (19 itens, 3 seções)
  - `OLBIForm` — Oldenburg Burnout Inventory (16 itens, subscalas)
  - `DailyCheckinForm` — Check-in diário (3 perguntas, escala 0–10)
  - `GAD7Form` — Escala de Ansiedade GAD-7 (7 perguntas, escala 0–3, score 0–21)
  - `Toast` — Notificações globais (success/error/info) com auto-dismiss
  - `ErrorBoundary` — Fallback visual para crashes inesperados

- **State Management** (Zustand):
  - `useAuthStore` — User, token, login/logout, init
  - `useSignalStore` — Sinais, tipos de sinais, ingestão
  - `useRiskStore` — Risco atual e histórico
  - `useQuestionnaireStore` — Due, history, submit
  - `useThemeStore` — dark/light mode, persistência localStorage
  - `useToastStore` — Fila de notificações globais
  - `useAppointmentStore` — specialists, appointments, createAppointment, getSlots

- **Design System**:
  - CSS Variables com `data-theme="dark"` / `"light"` no `<html>`
  - Fonte Nunito (CarePlus-inspired)
  - Paleta: azul royal (`--accent`), jade (`--jade` alias), semânticas (`--stable`, `--attn`, `--danger`)
  - Classes utilitárias: `.card`, `.btn-primary`, `.btn-ghost`, `.input-field`, `.label`

### Backend (Node.js + Express)
**Responsável**: API REST, autenticação, orquestração

- **Routes**:
  - `/api/auth` - Login, registro, perfil
  - `/api/signals` - Ingestão de sinais + simulação de wearable
  - `/api/risk` - Avaliação de risco
  - `/api/questionnaires` - Questionários (PSS, CBI, OLBI, DAILY_CHECKIN, GAD-7)
  - `/api/contexts` - Contextos (doença, férias, deadline)
  - `/api/appointments` - Agendamentos + especialistas + slots
  - `/api/prescriptions` - Prescrições com auditoria SHA-256

- **Services**:
  - `authService` - JWT, hash de senha
  - `signalService` - Ingestão e recuperação
  - Chamadas ao Python Engine

- **Middleware**:
  - `auth.js` - Validação de token
  - `validate.js` - Validação de schemas (Joi)
  - `errorHandler.js` - Tratamento de erros global

### Python Engine (FastAPI)
**Responsável**: Cálculos matemáticos e ML

- **Services**:
  - `BaselineCalculator` - Calcula padrão individual
  - `DeviationAnalyzer` - Detecta desvios
  - `CorrelationEngine` - Correlaciona sinais
  - `RiskScorer` - Gera score final

- **Endpoints**:
  - `POST /baseline/calculate` - Recalcula baseline
  - `POST /risk/calculate` - Calcula risco
  - `GET /baseline/{user_id}` - Vê baselines atuais
  - `GET /health` - Saúde do engine

### Database (PostgreSQL)
**Responsável**: Persistência de dados

**25+ tabelas**:
- Users, Signals, SignalTypes
- Baselines, Deviations, Trends
- RiskAssessments, RiskLevels
- Questionnaires, Contexts
- CarePoints Referrals, Notifications

---

## Fluxo de Autenticação

```
1. Usuário clica "Entrar" no Frontend
   ↓
2. Frontend → Backend POST /api/auth/login
   {email, password}
   ↓
3. Backend:
   - Busca user por email
   - Valida password com bcrypt
   - Gera JWT token
   - Retorna {user, token}
   ↓
4. Frontend:
   - Salva token em localStorage
   - Redireciona para /dashboard
   ↓
5. Frontend → Todas requisições incluem:
   Authorization: Bearer {token}
```

---

## Fluxo de Cálculo de Risco

```
1. Usuário registra sinais
   ↓
2. Backend valida e salva em user_signals
   ↓
3. Backend chama Python Engine:
   POST /risk/calculate {user_id}
   ↓
4. Python Engine:
   
   a) BaselineCalculator:
      - Busca últimos 7-14 dias de sinais
      - Remove outliers (IQR method)
      - Calcula mediana = baseline
      - Salva em baselines table
   
   b) DeviationAnalyzer:
      - Para cada sinal recente
      - Compara com baseline
      - Calcula % de desvio
      - Marca se significativo (>15%)
   
   c) CorrelationEngine:
      - Correlaciona múltiplos sinais
      - Conta quantos desviam
      - Calcula weighted score
   
   d) RiskScorer:
      - Considera convergência (quantos sinais concordam)
      - Busca contextos (doença, stress, etc)
      - Ajusta score
      - Determina nível: stable/attention/high_risk
      - Gera explicação
      - Recomenda ação
   
   e) Salva em risk_assessments table
   ↓
5. Backend retorna resultado ao Frontend
   ↓
6. Frontend exibe no Dashboard:
   - Nível de risco (cor + nome)
   - Score (0-100)
   - Explicação
   - Ações recomendadas
```

---

## Tecnologias

| Camada | Tecnologia | Versão | Porta |
|--------|-----------|--------|-------|
| Frontend | React + Vite | 18.2 | 3001 |
| Backend | Node.js + Express | 18+ | 3000 |
| Python | FastAPI | 0.104 | 8000 |
| Database | PostgreSQL | 15+ | 5433 |
| Cache | Redis | 5.0 | 6379 |

---

## Dependências Principais

### Frontend
- react-router-dom (navegação)
- zustand (state management)
- recharts (gráficos)
- axios (HTTP)
- tailwindcss (styling)

### Backend
- express (web framework)
- pg (PostgreSQL)
- bcrypt (password hashing)
- jsonwebtoken (JWT)
- joi (validação)
- bull (task queue)

### Python
- fastapi (web framework)
- psycopg2 (PostgreSQL)
- numpy/scipy/scikit-learn (cálculos)
- pydantic (validação)

---

## Padrões de Código

### Estado no Frontend
```javascript
const user = useAuthStore(state => state.user)
const signals = useSignalStore(state => state.signals)
```

### API Calls
```javascript
const response = await api.post('/api/signals/batch', {signals})
```

### Estrutura de Erro
```json
{
  "success": false,
  "error": "mensagem de erro",
  "details": {...}
}
```

### Estrutura de Sucesso
```json
{
  "success": true,
  "data": {...}
}
```

---

## Segurança

- **Senhas**: Bcrypt com salt=10
- **JWT**: Expira em 7 dias
- **CORS**: Limitado a localhost:3001
- **Rate Limiting**: 100 req/15min
- **Validação**: Joi schemas em todos endpoints
- **SQL Injection**: Prepared statements com psycopg2

---

## Escalabilidade Futura

- **Mobile**: App iOS (HealthKit) + Android (Health Connect) — ver [[Wearables-Integracao]]
- **Wearables**: Sync automático matinal de HRV, sono, FC via Apple Watch / Galaxy Watch
- **Teleconsulta**: Backend de agendamentos real + prescrição digital em PDF
- **Redis**: Cache de baselines (TTL 24h) para reduzir latência
- **WebSockets**: Updates do RiskCard em tempo real sem polling
- **ML models**: Previsão de risco 1–2 semanas antes com Gradient Boosting
- **Integração CarePlus/Blua**: Encaminhamento automático ao detectar high_risk

[[Backend]]
[[Database]]
[[Setup-Instalacao]]
[[Python-Engine]]