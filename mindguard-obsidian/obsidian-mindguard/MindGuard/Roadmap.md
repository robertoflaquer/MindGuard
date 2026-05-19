# Roadmap & Próximas Etapas

## Timeline Geral

```
Fase 1 (Concluída): MVP Web Core
├─ Database design ✅
├─ Backend API ✅
├─ Python Engine ✅
├─ Frontend Web (React) ✅
├─ Design System dark/light ✅
├─ Questionários (PSS, CBI, OLBI, DAILY_CHECKIN, GAD-7) ✅
├─ Contextos de Vida ✅
└─ Tratamento / Agendamento (full backend + frontend) ✅

Fase 1.5 (Concluída): Segurança & Features Extras
├─ XSS sanitization (xss-clean middleware) ✅
├─ SQL injection fix (INTERVAL parameterizado) ✅
├─ Pino logger em database.js ✅
├─ Backend de agendamentos real (specialists, appointments, slots) ✅
├─ Backend de prescrições (SHA-256 auditoria) ✅
├─ Página Prescrições no frontend ✅
├─ Endpoint /api/signals/simulate (Apple Watch / Galaxy Watch) ✅
└─ Botão Simular Wearable no Dashboard ✅

Fase 2 (Atual): Deploy & Qualidade
├─ Deploy Railway/Render ← PRÓXIMO
├─ Limpeza de código (console.log, código morto, README)
└─ Testes end-to-end

Fase 3: Mobile & Wearables Físicos
├─ App iOS (HealthKit + background sync)
├─ App Android (Health Connect)
└─ Notificações push

Fase 4: Prescrição Avançada
├─ Geração de PDF (PDFKit) ← base já existe
├─ Role médico no sistema de auth
└─ Integração CarePlus/Blua

Fase 5: ML & Escalabilidade
├─ Machine Learning para previsão de risco
├─ Redis caching
├─ WebSockets real-time
└─ Kubernetes deployment
```

---

## Fase 2: Deploy & Qualidade (Atual)

### Etapa 1: Deploy
**Status**: 🔴 Não iniciado — **maior prioridade**

**O que fazer**:
1. Testar `docker-compose up --build` localmente com todos os serviços
2. Configurar `.env` de produção (sem valores de desenvolvimento)
3. Criar conta no Railway.app ou Render.com
4. Deploy dos 4 serviços: postgres, backend, python, frontend
5. Configurar variáveis de ambiente como secrets
6. Verificar HTTPS automático

**Critério de conclusão**:
```bash
# Tudo rodando em https://mindguard.railway.app (ou similar)
curl https://api.mindguard.app/api/health → 200 OK
# Frontend carregando e fluxo completo funcionando
```

### Etapa 2: Limpeza de Código
**Status**: 🟡 Em andamento

**O que fazer**:
1. Auditar arquivos `.jsx` sem uso no frontend
2. ~~`console.log` em database.js~~ → **✅ feito** (substituído por pino logger)
3. Remover `console.log` remanescentes no backend (fora do database.js)
4. Remover `print()` de debug no Python Engine
5. Consolidar estilos duplicados no `index.css`
6. Atualizar `README.md` dos 3 projetos

### Etapa 3: Segurança
**Status**: ✅ Concluído

**O que foi feito**:
1. ✅ `xss-clean` middleware adicionado em `server.js` (antes das routes)
2. ✅ SQL injection corrigido em `signalService.getSignalStats` e `riskController.getHistory` — template literals `INTERVAL '${days} days'` substituídos por `$N * INTERVAL '1 day'`
3. HTTPS via Railway/Render — pendente (depende do deploy)

---

## Fase 3: Mobile & Wearables (Próximas 4–6 semanas)

> Pesquisa técnica completa em [[Wearables-Integracao]].

### Opção A: React Native (recomendada para velocidade)

**Estrutura**:
```
mindguard-mobile/
├── src/
│   ├── screens/ (Login, Dashboard, SignalForm, Treatment)
│   ├── components/ (RiskCard, SignalChart)
│   ├── stores/ (Zustand — reaproveitar lógica do web)
│   ├── services/ (api.js — mesmo backend)
│   └── health/ (HealthKit, HealthConnect wrappers)
├── ios/
├── android/
└── package.json
```

**Bibliotecas**:
- `react-native-health` — HealthKit (iOS)
- `react-native-health-connect` — Health Connect (Android)
- `@notifee/react-native` — Notificações push

**HealthKit (iOS) — leitura matinal**:
```javascript
import HealthKit from 'react-native-health'

const permissions = {
  permissions: {
    read: [
      HealthKit.Constants.Permissions.HeartRateVariabilitySDNN,
      HealthKit.Constants.Permissions.RestingHeartRate,
      HealthKit.Constants.Permissions.SleepAnalysis,
    ]
  }
}

await HealthKit.initHealthKit(permissions)

// Sync matinal via BackgroundFetch
const samples = await HealthKit.getHeartRateVariabilitySamples({
  startDate: startOfYesterday.toISOString(),
  endDate: now.toISOString(),
})
```

**Health Connect (Android) — leitura matinal**:
```javascript
import { initialize, requestPermission, readRecords } from 'react-native-health-connect'

await initialize()
await requestPermission([
  { accessType: 'read', recordType: 'HeartRateVariability' },
  { accessType: 'read', recordType: 'SleepSession' },
])

const records = await readRecords('HeartRateVariability', {
  timeRangeFilter: { operator: 'between', startTime, endTime }
})
```

### Opção B: Apps Nativos Separados (mais robusto)

**iOS (Swift)**:
- `HKObserverQuery` com `enableBackgroundDelivery(for: .heartRateVariabilitySDNN, frequency: .daily)`
- `BGProcessingTask` para sync às 6h–7h
- SwiftUI para UI

**Android (Kotlin)**:
- Health Connect SDK nativo: `HealthConnectClient.getOrCreate(context)`
- `WorkManager` com `PeriodicWorkRequest` a cada 24h com janela matinal

### Dados Simulados (demo sem wearable)
```
POST /api/signals/simulate
{
  "days": 7,
  "profile": "stressed"  // ou "healthy", "burnout"
}
→ Gera 7 dias de HRV, FC, sono, estresse simulados com variação realista
```

---

## Fase 4: Teleconsulta & Prescrição

### Backend de Agendamentos

**Novas tabelas**:
```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  specialist_name TEXT NOT NULL,
  specialist_role TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 45,
  modality TEXT DEFAULT 'video',
  notes TEXT,
  status TEXT DEFAULT 'confirmed', -- confirmed, cancelled, completed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id),
  user_id UUID REFERENCES users(id),
  doctor_name TEXT NOT NULL,
  items JSONB NOT NULL, -- [{medication, dosage, frequency, duration}]
  observations TEXT,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  pdf_url TEXT,
  audit_hash TEXT -- SHA-256 do conteúdo para imutabilidade
);
```

**Endpoints**:
```
POST   /api/appointments          → criar agendamento
GET    /api/appointments          → listar (do usuário autenticado)
PATCH  /api/appointments/:id      → atualizar status
POST   /api/prescriptions         → criar prescrição (role: doctor)
GET    /api/prescriptions/:id/pdf → download PDF
```

### Interface de Prescrição

A interface mostrará ao médico, em uma tela unificada:

```
┌─────────────────────────────────────────────────┐
│  Paciente: Roberto Flaquer                      │
│  Consulta: 15/05/2026 · 10:00 – 10:45           │
├──────────────────┬──────────────────────────────┤
│  HISTÓRICO       │  PRESCRIÇÃO                  │
│                  │                              │
│  Risco: 31%      │  Medicamento: ___________    │
│  Estável         │  Dosagem: _______________    │
│                  │  Frequência: ____________    │
│  PSS: 25/40      │  Duração: _______________    │
│  CBI: 35/100     │                              │
│  Humor: 8/10     │  + Adicionar item           │
│                  │                              │
│  HRV: 42ms ↑     │  Observações:               │
│  Sono: 7.2h      │  ______________________     │
│                  │                              │
│                  │  [Gerar Prescrição PDF]      │
└──────────────────┴──────────────────────────────┘
```

**Geração de PDF**:
```javascript
// PDFKit (Node.js)
const PDFDocument = require('pdfkit')

function generatePrescription(prescription, user, risk) {
  const doc = new PDFDocument()
  doc.text('PRESCRIÇÃO MÉDICA DIGITAL', { align: 'center' })
  doc.text(`Paciente: ${user.fullName}`)
  doc.text(`Data: ${formatDate(prescription.issued_at)}`)
  // ... items, assinatura digital, QR code de verificação
  return doc
}
```

---

## Fase 5: ML & Escalabilidade (Semanas 9+)

### Machine Learning — Previsão de Risco

**Objetivo**: Prever risco 1–2 semanas antes com base em tendências

```python
from sklearn.ensemble import GradientBoostingRegressor
import numpy as np

def build_features(signals_7d, questionnaire_scores, active_contexts):
    return {
        'hrv_mean':       np.mean([s.value for s in signals_7d if s.type == 'HRV']),
        'hrv_trend':      np.polyfit(range(7), hrv_values, 1)[0],  # slope
        'sleep_quality':  latest_sleep_quality,
        'stress_trend':   slope(stress_last_7d),
        'pss_score':      questionnaire_scores.get('PSS', 0),
        'context_weight': sum(c.severity_weight for c in active_contexts),
    }

model = GradientBoostingRegressor(n_estimators=200)
model.fit(X_train, y_risk_scores)
```

### Redis — Cache de Baselines

```python
import redis, json

r = redis.Redis(host='redis', port=6379, db=0)

def get_baseline_cached(user_id, signal_type):
    key = f"baseline:{user_id}:{signal_type}"
    cached = r.get(key)
    if cached:
        return json.loads(cached)
    baseline = calculate_baseline(user_id, signal_type)
    r.setex(key, 86400, json.dumps(baseline))  # TTL 24h
    return baseline
```

### WebSockets — Dashboard em Tempo Real

```javascript
// Backend
const io = require('socket.io')(server)
io.on('connection', (socket) => {
  socket.on('subscribe-risk', (userId) => socket.join(`risk:${userId}`))
})

// Após calcular risco:
io.to(`risk:${userId}`).emit('risk-updated', { risk_level, risk_score, timestamp })

// Frontend
const socket = io(API_URL, { auth: { token } })
socket.on('risk-updated', (data) => useRiskStore.getState().setCurrentRisk(data))
```

---

## Integração CarePlus/Blua

**Objetivo**: Encaminhar usuários de alto risco automaticamente

```
1. Risk assessment = high_risk
2. Backend chama CarePlus API
   POST /referrals
   { patient_id, specialist_type: 'psychologist', priority: 'urgent', reason }
3. CarePlus retorna agendamento automático
4. Salva em appointments table
5. Notifica usuário via push notification
```

---

## Estimativas de Tempo

```
Fase 1: ✅ Concluída (~6 semanas)
Fase 2: 1–2 semanas (Deploy + Limpeza)
Fase 3: 4–6 semanas (Mobile + Wearables)
Fase 4: 3–4 semanas (Teleconsulta + Prescrição)
Fase 5: 6+ semanas (ML + Escalabilidade, contínuo)

Total para produção completa: ~20–25 semanas
```

---

## KPIs de Sucesso

```
✅ Usuários podem registrar sinais e ver risco
✅ Questionários calibram o risco (PSS, CBI, OLBI, DAILY_CHECKIN, GAD-7)
✅ Agendamento com backend real (specialists, slots, conflito de horários)
✅ Prescrições com auditoria SHA-256
✅ Simulação de wearable (Apple Watch / Galaxy Watch)
✅ Segurança: XSS, SQL injection, logger estruturado
⬜ App mobile em produção na App Store / Play Store
⬜ Sync automático matinal via wearable físico
⬜ Prescrição em PDF assinado
⬜ Acurácia de detecção de risco > 85%
⬜ Latência < 500ms (risk calc)
⬜ Uptime > 99.5%
```

---

[[Checklist]] [[Arquitetura]] [[Wearables-Integracao]] [[Setup-Instalacao]]
