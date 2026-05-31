# Backend (Node.js + Express)

## Estrutura de Pastas

```
mindguard-backend/
├── src/
│   ├── config/
│   │   ├── database.js         — Pool PostgreSQL + pino logger (sem console.log)
│   │   └── logger.js           — Pino logger estruturado
│   ├── middleware/
│   │   ├── auth.js             — JWT validation
│   │   ├── validate.js         — Joi schemas
│   │   └── errorHandler.js     — Global error handler
│   ├── services/
│   │   ├── authService.js      — Login/Register/bcrypt
│   │   ├── signalService.js    — Ingestão, stats (SQL injection corrigido)
│   │   ├── appointmentService.js — CRUD agendamentos + validação de conflitos
│   │   ├── prescriptionService.js — CRUD prescrições + SHA-256 audit hash
│   │   └── pythonService.js    — Bridge para Python Engine
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── signalController.js — inclui simulateWearable()
│   │   ├── riskController.js   — SQL injection corrigido no getHistory()
│   │   ├── questionnaireController.js
│   │   ├── contextController.js
│   │   ├── appointmentController.js
│   │   └── prescriptionController.js
│   ├── routes/
│   │   ├── auth.js             — /api/auth
│   │   ├── signals.js          — /api/signals (inclui /simulate)
│   │   ├── risk.js             — /api/risk
│   │   ├── questionnaires.js   — /api/questionnaires
│   │   ├── contexts.js         — /api/contexts
│   │   ├── appointments.js     — /api/appointments
│   │   └── prescriptions.js   — /api/prescriptions
│   ├── database/
│   │   ├── schema.sql          — Schema principal
│   │   ├── add_appointments_prescriptions.sql — Migration: specialists, appointments, prescriptions
│   │   ├── migrate.js          — Runner do schema.sql
│   │   └── migrate_appointments.js — Runner do migration de agendamentos
│   └── server.js               — Ponto de entrada + xss-clean middleware
├── .env
└── package.json
```

---

## Health Checks

| Rota | Comportamento | Uso |
|------|---------------|-----|
| `GET /health` | Sempre retorna `200 OK` (não depende do banco) | Railway healthcheck — evita derrubar o container quando o banco está reiniciando |
| `GET /health/db` | `200 OK` se conectar, `503` se desconectar | Diagnóstico real da conexão PostgreSQL |

> A separação foi feita após problemas no Railway: o healthcheck antigo retornava `503` quando o banco demorava a subir, e o Railway interpretava isso como container morto e cancelava o deploy.

---

## Endpoints Principais

### Auth (`/api/auth`)

**POST /register**
```javascript
Body: {
  email: "user@email.com",
  password: "Senha123!",
  fullName: "Nome Completo"
}
Response: {
  success: true,
  data: {
    user: {id, email, fullName, createdAt},
    token: "eyJ..."
  }
}
```

**POST /login**
```javascript
Body: {
  email: "user@email.com",
  password: "Senha123!"
}
Response: {
  success: true,
  data: {user, token}
}
```

**GET /profile** (autenticado)
```javascript
Headers: Authorization: Bearer {token}
Response: {
  success: true,
  data: {id, email, fullName, baselineStatus, ...}
}
```

---

### Signals (`/api/signals`)

**POST /batch** (enviar sinais)
```javascript
Body: {
  signals: [
    {
      signalType: "HRV",
      value: 45,
      timestamp: "2024-05-04T18:00:00Z"
    },
    {
      signalType: "sleep_duration",
      value: 7.5,
      timestamp: "2024-05-04T08:00:00Z"
    }
  ]
}
Response: {
  success: true,
  data: {
    inserted: 2,
    signals: [...]
  }
}
```

**GET /recent**
```javascript
Query: ?type=HRV&limit=30
Response: {
  success: true,
  data: [
    {id, signal_type, value, timestamp, is_outlier, confidence_score}
  ]
}
```

**GET /types**
```javascript
Response: {
  success: true,
  data: [
    {id, name: "HRV", category: "physiological", unit: "ms"}
  ]
}
```

**GET /stats**
```javascript
Query: ?type=HRV&days=7
Response: {
  success: true,
  data: {
    count: 10,
    average: 52.3,
    min: 42,
    max: 65,
    std_dev: 8.2
  }
}
```

---

### Risk (`/api/risk`)

**GET /current** (risco atual)
```javascript
Response: {
  success: true,
  data: {
    id,
    risk_level: "attention",
    risk_level_name: "Atenção",
    risk_score: 45.2,
    confidence_level: 0.85,
    assessment_date,
    primary_explanation: "...",
    secondary_factors: ["..."],
    recommended_action: "breathing_exercise"
  }
}
```

**GET /history**
```javascript
Query: ?limit=30&days=30
Response: {
  success: true,
  data: [
    {id, risk_level, risk_score, assessment_date, primary_explanation}
  ]
}
```

**POST /assess** (trigger avaliação manual)
```javascript
Response: {
  success: true,
  data: {
    id,
    assessmentDate,
    message: "Assessment created"
  }
}
```

---

### Questionnaires (`/api/questionnaires`)

**GET /types**
```javascript
Response: [
  {id, code: "PSS", name: "Perceived Stress Scale", ...}
]
```

**POST /submit**
```javascript
Body: {
  questionnaireCode: "DAILY_CHECKIN",
  responses: {
    q1: 5,
    q2: 6,
    q3: 7
  },
  contextNotes: "Dia normal"
}
Response: {
  success: true,
  data: {id, questionnaireCode, totalScore, completedAt}
}
```

**GET /history**
```javascript
Query: ?code=PSS&limit=10
Response: [
  {id, code, name, total_score, completed_at}
]
```

---

### Contexts (`/api/contexts`)

**GET /types**
```javascript
Response: [
  {id, code: "work_deadline", name: "Work Deadline", category: "work"}
]
```

**POST /** (adicionar contexto)
```javascript
Body: {
  contextCode: "work_deadline",
  startDate: "2024-05-04",
  endDate: "2024-05-10",
  severity: "moderate",
  notes: "Projeto importante"
}
Response: {
  success: true,
  data: {id, contextCode, startDate, endDate, severity}
}
```

**GET /active**
```javascript
Response: [
  {id, code, name, category, start_date, end_date, severity}
]
```

**PATCH /:id/close**
```javascript
Response: {
  success: true,
  message: "Context closed successfully"
}
```

---

### Signals — Simulate (`/api/signals/simulate`)

**POST /simulate** (simular leitura de wearable)
```javascript
Body: {
  device: "apple_watch"  // ou "galaxy_watch"
}
Response: {
  success: true,
  message: "Dados simulados de Apple Watch importados",
  data: { inserted: 7, device: "apple_watch" }
}
// Sinais gerados: HRV, HR_resting, sleep_duration, sleep_quality,
//                stress_level, mood, steps — valores realistas aleatórios
// Após inserção: dispara baseline → risco automaticamente
```

---

### Appointments (`/api/appointments`)

**GET /specialists**
```javascript
Response: {
  success: true,
  data: [
    { id, name, specialty, crm_crp, avatar_initials, color_hex }
  ]
}
```

**GET /slots**
```javascript
Query: ?specialistId=1&date=2026-05-20
Response: {
  success: true,
  data: [
    { time: "08:00", available: true },
    { time: "09:00", available: false },
    ...
  ]
}
```

**POST /** (criar agendamento)
```javascript
Body: {
  specialistId: 1,
  scheduledDate: "2026-05-20",
  scheduledTime: "10:00",
  observations: "Estresse no trabalho",
  riskSnapshot: { risk_score: 45, risk_level: "attention" }  // opcional
}
Response: {
  success: true,
  data: { id, user_id, specialist_id, scheduled_date, scheduled_time, status: "confirmed" }
}
// Retorna 409 se horário já ocupado
```

**GET /**
```javascript
Query: ?upcoming=true  // default: true
Response: {
  success: true,
  data: [
    { id, scheduled_date, scheduled_time, specialist_name, specialty, status }
  ]
}
```

**PATCH /:id/cancel**
```javascript
Response: {
  success: true,
  data: { id, status: "cancelled" }
}
```

---

### Prescriptions (`/api/prescriptions`)

**GET /**
```javascript
Response: {
  success: true,
  data: [
    { id, specialist_name, specialty, items, observations, audit_hash, issued_at }
  ]
}
```

**GET /:id**
```javascript
Response: {
  success: true,
  data: { id, specialist_name, crm_crp, items, observations, audit_hash, issued_at, scheduled_date }
}
```

**POST /**
```javascript
Body: {
  specialistId: 1,
  appointmentId: "uuid",         // opcional
  items: [
    { medication: "Escitalopram", dosage: "10mg", frequency: "1x ao dia" }
  ],
  observations: "Retornar em 30 dias"
}
Response: {
  success: true,
  data: { id, audit_hash, issued_at }
}
// audit_hash = SHA-256 de {userId, specialistId, appointmentId, items, observations, issuedAt}
```

---

## Services

### authService

```javascript
register(email, password, fullName)
// Hash password com bcrypt, criar user, gerar token

login(email, password)
// Buscar user, validar password, gerar token

generateToken(userId, email)
// Criar JWT com expiração 7d

getUserById(userId)
// Buscar dados do user
```

### signalService

```javascript
ingestSignalBatch(userId, signals)
// Validar, converter para signal_type_id, salvar

getRecentSignals(userId, signalType, limit)
// Buscar últimos N sinais

getSignalTypes()
// Listar todos os tipos

getSignalStats(userId, signalType, days)
// Calcular: count, avg, min, max, std_dev
```

---

## Middleware

### auth.js

```javascript
authenticate(req, res, next)
// Validar Bearer token
// Salvar user info em req.user
// Se inválido, retornar 401

optionalAuth(req, res, next)
// Tentar validar, mas continuar mesmo se falhar
```

### validate.js

```javascript
validate(schema)
// Middleware factory
// Validar req.body contra schema Joi
// Se inválido, retornar 400 com detalhes

// Schemas pré-definidos:
schemas.register
schemas.login
schemas.signalBatch
schemas.questionnaireResponse
schemas.userContext
```

### errorHandler.js

```javascript
errorHandler(err, req, res, next)
// Capturar erros globais
// Se erro de DB (23505), retornar 409 (conflict)
// Se erro de FK (23503), retornar 400
// Logar stack trace

notFound(req, res)
// 404 para rotas não encontradas
```

---

## Database Config

```javascript
const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'mindguard',
  user: 'postgres',
  password: 'MindGuard2024!',
  max: 20,
  idleTimeoutMillis: 30000
})

query(text, params)
// Executar query com timeout
// Log timing
// Retornar results ou throw erro

transaction(callback)
// BEGIN, executar callback, COMMIT/ROLLBACK
```

---

## Logger Config

```javascript
const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    colorize: true
  }
})

// Uso:
logger.info({userId}, 'User authenticated')
logger.error({error}, 'Database error')
```

---

## Validação com Joi

```javascript
schemas.signalBatch = Joi.object({
  signals: Joi.array()
    .items(
      Joi.object({
        signalType: Joi.string().required(),
        value: Joi.number().required(),
        timestamp: Joi.date().iso().required(),
        source: Joi.string().optional(),
        metadata: Joi.object().optional()
      })
    )
    .min(1)
    .required()
})

// Uso:
router.post('/batch', validate(schemas.signalBatch), controller)
```

---

## Fluxo de Requisição

```
1. Cliente envia POST /api/signals/batch
   Headers: Authorization: Bearer token
   Body: {signals: [...]}

2. Express → middleware CORS
3. Express → middleware rate limit
4. Express → middleware parse JSON
5. Express → router encontra /api/signals
6. Router → authenticate middleware
   - Valida token JWT
   - Salva req.user
   - next()

7. Router → validate middleware
   - Valida Body contra schema
   - Salva req.validatedBody
   - next()

8. Router → controller signalController.ingestBatch
   - Acessa req.user.userId
   - Acessa req.validatedBody
   - Chama signalService.ingestSignalBatch()

9. signalService
   - Para cada sinal
   - Query: SELECT id FROM signal_types WHERE name = ?
   - Query: INSERT INTO user_signals (...)
   - Retorna inserted signals

10. Controller retorna resposta
    res.status(201).json({success: true, data: {...}})

11. Se erro em qualquer lugar → errorHandler
    - Log do erro
    - Resposta com status apropriado
```

---

## Environment Variables

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5433
DB_NAME=mindguard
DB_USER=postgres
DB_PASSWORD=MindGuard2024!

JWT_SECRET=mindguard_super_secret_key_2024_change_in_production
JWT_EXPIRES_IN=7d

REDIS_HOST=localhost
REDIS_PORT=6379

PYTHON_API_URL=http://localhost:8000

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

CORS_ORIGIN=http://localhost:3001

LOG_LEVEL=info
```

---

## Testing com Insomnia/Postman

### Fluxo Completo

1. **Register**
   ```
   POST http://localhost:3000/api/auth/register
   Body: {email, password, fullName}
   → Salva token
   ```

2. **Login**
   ```
   POST http://localhost:3000/api/auth/login
   Body: {email, password}
   → Salva novo token
   ```

3. **Enviar Sinais**
   ```
   POST http://localhost:3000/api/signals/batch
   Headers: Authorization: Bearer {token}
   Body: {signals: [{signalType, value, timestamp}]}
   ```

4. **Ver Sinais**
   ```
   GET http://localhost:3000/api/signals/recent
   Headers: Authorization: Bearer {token}
   ```

5. **Calcular Risco** (manual)
   ```
   POST http://localhost:3000/api/risk/assess
   Headers: Authorization: Bearer {token}
   ```

6. **Ver Risco Atual**
   ```
   GET http://localhost:3000/api/risk/current
   Headers: Authorization: Bearer {token}
   ```

---

## Integração com Python Engine

Quando usuário envia sinais, Backend pode opcionalmente chamar Python:

```javascript
// Em signalService.ingestSignalBatch()
// Após salvar sinais
const response = await axios.post(
  'http://localhost:8000/risk/calculate',
  {user_id: userId}
)
// Salvar resultado em risk_assessments
```

---

## Rate Limiting

```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máx 100 requests por janela
  message: {success: false, error: 'Too many requests'}
})

app.use('/api/', limiter) // Aplicado a todos /api/*
```

---

## Boas Práticas

1. **Sempre autenticar** endpoints que acessem dados do user
2. **Sempre validar** input com schemas
3. **Sempre logar** operações importantes
4. **Sempre usar** prepared statements (params como array)
5. **Sempre retornar** responses estruturadas (success + data/error)
6. **Nunca salvar** senhas em plain text (sempre bcrypt)
7. **Nunca expor** detalhes internos de erro para cliente

[[Database]]
[[Arquitetura]]
[[Setup-Instalacao]]