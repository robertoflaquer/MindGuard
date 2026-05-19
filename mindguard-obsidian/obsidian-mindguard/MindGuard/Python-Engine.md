# Python Engine (FastAPI)

## Visão Geral

Microserviço responsável por **cálculos matemáticos e lógica de ML** para detecção de risco.

```
Recebe: dados brutos do usuário (sinais recentes)
Processa: baseline, desvios, correlação, scoring
Retorna: score de risco + explicação
```

---

## Estrutura de Pastas

```
mindguard-python/
├── main.py - FastAPI app + endpoints
├── config/
│   ├── __init__.py
│   └── database.py - Conexão PostgreSQL
├── services/
│   ├── __init__.py
│   ├── baseline_calculator.py - Cálculo de baseline
│   ├── deviation_analyzer.py - Análise de desvios
│   ├── correlation_engine.py - Correlação de sinais
│   └── risk_scorer.py - Score final de risco
├── requirements.txt
├── .env
└── .gitignore
```

---

## Endpoints

### Health Check

**GET /health**
```
Response: {
  "status": "healthy",
  "database": "connected"
}
```

### Baseline Calculation

**POST /baseline/calculate**
```javascript
Body: {
  user_id: "uuid-do-usuario"
}

Response: {
  "success": true,
  "data": {
    "HRV": {
      "status": "success",
      "baseline_value": 52.3,
      "baseline_std": 8.2,
      "rolling_7d": 48.5,
      "rolling_14d": 50.1,
      "sample_size": 14,
      "data_quality": 0.92
    },
    "sleep_duration": {...},
    "stress_level": {...}
  }
}
```

**GET /baseline/{user_id}**
```
Response: {
  "success": true,
  "data": [
    {
      "name": "HRV",
      "baseline_value": 52.3,
      "rolling_7d_value": 48.5,
      "updated_at": "2024-05-04T10:00:00Z"
    }
  ]
}
```

### Risk Calculation

**POST /risk/calculate**
```javascript
Body: {
  user_id: "uuid-do-usuario"
}

Response: {
  "success": true,
  "data": {
    "assessment_id": "uuid",
    "risk_level": "attention",
    "risk_score": 45.2,
    "confidence_level": 0.85,
    "convergence_count": 2,
    "primary_explanation": "Detectamos desvios em 2 sinais diferentes.",
    "secondary_factors": [
      "HRV: down 18.5%",
      "sleep_duration: down 12.3%"
    ],
    "recommended_action": "meditation_short",
    "contributing_signals": {
      "HRV": {
        "value": 42.5,
        "baseline": 52.3,
        "percent_change": -18.5,
        "direction": "down",
        "is_significant": true
      },
      "sleep_duration": {
        "value": 6.5,
        "baseline": 7.4,
        "percent_change": -12.3,
        "direction": "down",
        "is_significant": true
      }
    }
  }
}
```

---

## Services

### BaselineCalculator

**Objetivo**: Calcular o padrão normal individual do usuário

```python
def calculate_baseline(user_id: str, signal_type_id: int)
  """
  Processa:
  1. Busca últimos 7-14 dias de sinais
  2. Remove outliers usando método IQR
  3. Calcula mediana (mais robusta que média)
  4. Calcula desvio padrão
  5. Calcula rolling averages (7d, 14d, 30d)
  6. Salva em baselines table
  
  Retorna: {
    status: 'success'|'insufficient_data',
    baseline_value: float,
    baseline_std: float,
    rolling_7d: float,
    sample_size: int,
    data_quality: float (0-1)
  }
  """
```

**Lógica de Outlier Detection**
```
Q1 = percentil 25% dos dados
Q3 = percentil 75% dos dados
IQR = Q3 - Q1
lower_bound = Q1 - 1.5 * IQR
upper_bound = Q3 + 1.5 * IQR

Remover valores fora desse range
```

**Exemplo**
```
Dados: [45, 48, 50, 52, 54, 55, 200] ← outlier
Após remover outlier: [45, 48, 50, 52, 54, 55]
Baseline (mediana): 51
Std dev: 3.7
```

---

### DeviationAnalyzer

**Objetivo**: Detectar quando um sinal desvia significativamente do baseline

```python
def analyze_deviation(user_id: str, signal_type_id: int, current_value: float)
  """
  Processa:
  1. Busca baseline atual do user
  2. Calcula desvio absoluto e percentual
  3. Determina direção (up/down/stable)
  4. Marca se significativo (>15% padrão)
  5. Salva em deviations table
  
  Retorna: {
    status: 'success'|'no_baseline',
    current_value: float,
    baseline_value: float,
    absolute_change: float,
    percent_change: float (-50 a 50),
    is_significant: bool,
    direction: 'up'|'down'|'stable',
    threshold: 15.0
  }
  """
```

**Configurações**
```
DEVIATION_THRESHOLD = 15.0 (%)

Se |percent_change| >= 15% → is_significant = True
```

**Exemplo**
```
Baseline HRV: 50 ms
Valor atual: 40 ms
Desvio: (40-50)/50 * 100 = -20%
Is significant: True (> 15%)
Direction: down
```

---

### CorrelationEngine

**Objetivo**: Correlacionar múltiplos sinais para detectar padrões convergentes

```python
def correlate_signals(user_id: str)
  """
  Processa:
  1. Busca todos sinais das últimas 24h
  2. Para cada sinal, analisa desvio
  3. Conta quantos sinais desviam (convergence_count)
  4. Calcula weighted_score baseado em importância
  5. Retorna análise consolidada
  
  Signal Weights (importância):
    HRV: 1.2 (muito importante para stress)
    stress_level: 1.3 (auto-report direto)
    sleep_duration: 1.1 (importante para recuperação)
    sleep_quality: 1.0
    energy_level: 0.9
    mood: 1.0
    HR_resting: 0.8
    steps: 0.6
  
  Retorna: {
    status: 'success',
    convergence_count: 2,
    contributing_signals: {
      'HRV': {value, baseline, percent_change, is_significant},
      'sleep_duration': {...}
    },
    weighted_score: 18.5
  }
  """
```

**Lógica de Weighted Score**
```
Para cada sinal significativo:
  Se HRV desce → score += |percent_change| * weight[HRV]
  Se stress sobe → score += |percent_change| * weight[stress]
  Se sleep desce → score += |percent_change| * weight[sleep]

Exemplo:
  HRV -20% → 20 * 1.2 = 24
  sleep -15% → 15 * 1.1 = 16.5
  stress +25% → 25 * 1.3 = 32.5
  Total: 73 (antes de normalizar)
```

---

### RiskScorer

**Objetivo**: Gerar score final de risco combinando múltiplas fontes

```python
def calculate_risk(user_id: str)
  """
  Processa:
  1. Chama CorrelationEngine → weighted_score
  2. Converte para base_risk (0-100)
  3. Aplica multiplicador de convergência
  4. Busca contextos do usuário → ajusta score
  5. Determina nível: stable/attention/elevated_risk/high_risk
  6. Gera explicação em português
  7. Recomenda ação
  8. Calcula confidence_level
  9. Salva em risk_assessments
  
  Retorna: {
    assessment_id: uuid,
    risk_level: 'stable'|'attention'|'elevated_risk'|'high_risk',
    risk_score: 0-100,
    confidence_level: 0-1,
    convergence_count: int,
    primary_explanation: str,
    secondary_factors: list,
    recommended_action: str,
    contributing_signals: dict
  }
  """
```

**Thresholds de Risco**
```
risk_score >= 70 → high_risk
risk_score >= 40 → attention
risk_score >= 0  → stable

Boosters:
  Se convergence_count >= 3 → escalate attention → elevated_risk
  Se contexto ativo (doença, stress) → multiplicador 1.2-1.5
```

**Exemplo de Cálculo**
```
Weighted score: 50 (da correlação)
Base risk: 50/2 = 25

Convergence count: 3
Multiplicador: 1 + (3 * 0.2) = 1.6
Risk score: 25 * 1.6 = 40

Contextos: work_deadline (weight 1.1)
Final: 40 * 1.1 = 44

Risk level: attention (40-70)
```

**Context Adjustments**
```
Doença menor → reduce HRV weight (0.5)
Férias → reduce stress_level weight (0.6)
Exercício intenso → reduce HR_resting weight (0.4)
Menstruação → reduce mood weight (0.7)
```

---

## Database Config

```python
class Database:
  def __init__(self):
    self.conn_params = {
      'host': 'localhost',
      'port': '5433',
      'database': 'mindguard',
      'user': 'postgres',
      'password': 'MindGuard2024!'
    }
  
  def connect()
    # Conecta via psycopg2
    # Retorna conexão
  
  def execute_query(query, params)
    # Execute query preparada
    # Retorna results ou rowcount
    # Trata erros
```

---

## Environment Variables

```env
# Server
PORT=8000

# Database
DB_HOST=localhost
DB_PORT=5433
DB_NAME=mindguard
DB_USER=postgres
DB_PASSWORD=MindGuard2024!

# Redis (futuro)
REDIS_HOST=localhost
REDIS_PORT=6379

# Processing Parameters
BASELINE_MIN_DAYS=7
BASELINE_MAX_DAYS=14
DEVIATION_THRESHOLD=15.0

# Risk Scoring
RISK_CONVERGENCE_THRESHOLD=2
HIGH_RISK_THRESHOLD=70
ATTENTION_THRESHOLD=40
```

---

## Fluxo Completo de Risk Assessment

```
1. Backend chama POST /risk/calculate {user_id}
   ↓
2. Python Engine inicia RiskScorer.calculate_risk()
   ↓
3. RiskScorer chama CorrelationEngine.correlate_signals()
   ↓
4. CorrelationEngine:
   - Busca sinais 24h
   - Para cada sinal: chama DeviationAnalyzer
   - DeviationAnalyzer:
     * Busca baseline
     * Calcula % desvio
     * Marca significante
     * Salva em deviations table
   - Agrega resultados
   - Calcula weighted_score
   ↓
5. RiskScorer continua:
   - Converte weighted_score em risk_score
   - Aplica multiplicador convergência
   - Busca contextos ativos
   - Ajusta por contexto
   - Determina nível
   - Busca action_type recomendada
   - Calcula confidence
   ↓
6. RiskScorer.save_risk_assessment()
   - INSERT em risk_assessments
   - Retorna assessment_id
   ↓
7. Retorna resposta ao Backend
   ↓
8. Backend armazena em cache Redis (opcional)
   ↓
9. Frontend recebe e exibe no Dashboard
```

---

## Otimizações

### Cache com Redis
```python
# Após calcular baseline, salvar em Redis
redis.set(f"baseline:{user_id}:{signal_type_id}", 
          json.dumps(baseline_data), 
          ex=86400)  # 24 horas

# Próximo cálculo busca Redis primeiro
cached = redis.get(f"baseline:{user_id}:{signal_type_id}")
if cached:
  return json.loads(cached)
```

### Batch Processing
```python
# Processar múltiplos usuários
for user_id in active_users:
  calculate_risk(user_id)
  # Salvar em queue
```

### Async Processing (futuro)
```python
# Com Celery/RQ
@task
def calculate_risk_async(user_id):
  return risk_scorer.calculate_risk(user_id)

# Chamar: calculate_risk_async.delay(user_id)
```

---

## Testing

### Test Baseline Calculation
```bash
curl -X POST http://localhost:8000/baseline/calculate \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user-uuid"}'
```

### Test Risk Calculation
```bash
curl -X POST http://localhost:8000/risk/calculate \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user-uuid"}'
```

### Monitorar Logs
```bash
# Terminal rodando uvicorn mostra:
✅ Baseline saved for user {id}: value {val}
✅ Risk assessment saved: ID {id}, Level: {level}, Score: {score}
```

---

## Dependências Python

```
fastapi==0.104.1 - Web framework
uvicorn==0.24.0 - ASGI server
pydantic==2.5.0 - Validação
psycopg2-binary==2.9.9 - PostgreSQL
python-dotenv==1.0.0 - .env loader
numpy>=1.24.0 - Cálculos numéricos
scipy>=1.10.0 - Estatísticas avançadas
scikit-learn>=1.3.0 - ML utilities
redis==5.0.1 - Cache (futuro)
```

---

## Troubleshooting

### "No module named numpy"
```bash
pip install numpy scipy scikit-learn --break-system-packages
```

### "connection to server at localhost failed"
```bash
# PostgreSQL caiu
net start postgresql-x64-15
# Esperar 10 segundos
python -m uvicorn main:app --reload --port 8000
```

### "password authentication failed"
```bash
# Senha errada em .env
# Corrigir DB_PASSWORD
```

### Port 8000 já em uso
```bash
# Mudar em main:
python -m uvicorn main:app --reload --port 8001
```

---

## Próximas Melhorias

1. **Cache com Redis** - Armazenar baselines
2. **Async Processing** - Processar com Celery
3. **ML Models** - Adicionar sklearn models para previsão
4. **WebSockets** - Updates em tempo real
5. **Monitoring** - Prometheus/Grafana
6. **Tests** - pytest com fixtures

[[Backend]] [[Database]] [[Arquitetura]] [[Setup-Instalacao]]
