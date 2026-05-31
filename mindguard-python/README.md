# MindGuard Python Engine

Motor de processamento analítico do MindGuard. Calcula baselines personalizadas e pontuações de risco de saúde mental via FastAPI.

## Stack

- **Python 3.11+**
- **FastAPI** + **Uvicorn**
- **psycopg2** para PostgreSQL
- **NumPy** para cálculo estatístico
- **python-dotenv** para configuração

## Pré-requisitos

- Python 3.11+
- PostgreSQL 15 rodando na porta **5433** com o schema do MindGuard aplicado

## Instalação

```bash
cd mindguard-python
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/macOS
pip install -r requirements.txt
```

Copie `.env.example` para `.env`:

```
DB_HOST=localhost
DB_PORT=5433
DB_NAME=mindguard
DB_USER=postgres
DB_PASSWORD=MindGuard!

# Algoritmo de baseline
BASELINE_MIN_DAYS=7
BASELINE_MAX_DAYS=14
DEVIATION_THRESHOLD=15.0

# Thresholds de risco (0–100)
HIGH_RISK_THRESHOLD=70
ATTENTION_THRESHOLD=40
```

## Execução

```bash
# Desenvolvimento (hot reload)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Produção (mesma forma usada no Railway)
python main.py
```

Engine disponível em `http://localhost:8000`.

> Em produção, `main.py` lê `PORT` do ambiente (`os.environ.get("PORT", 8000)`). O Railway injeta essa variável automaticamente.

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Status do serviço |
| GET | `/health` | Health check (usado pelo Railway) |
| POST | `/baseline/calculate` | Calcular baselines do usuário |
| GET | `/baseline/{user_id}` | Consultar baselines atuais |
| POST | `/risk/calculate` | Calcular pontuação de risco |

## Algoritmos

**Baseline** (`services/baseline_calculator.py`):
- Janela de 7–14 dias de dados históricos
- Remoção de outliers via IQR (±1.5×IQR)
- Baseline = mediana dos valores limpos
- Upsert preserva o ID para não quebrar FKs de deviations

**Desvio** (`services/deviation_analyzer.py`):
- Variação percentual em relação à baseline
- Threshold configurável (padrão 15%)
- Direção: `stable` / `up` / `down`

**Risco** (`services/risk_scorer.py`):
- Agrega desvios de todos os tipos de sinal
- Pesos configuráveis por tipo de sinal
- Níveis: `low` / `moderate` / `high` / `critical`
- Salva em `risk_assessments` com explicação textual

## Estrutura

```
config/
├── database.py   # conexão psycopg2 com reconexão automática
└── logger.py     # get_logger() padronizado

services/
├── baseline_calculator.py
├── deviation_analyzer.py
└── risk_scorer.py

main.py           # FastAPI app + rotas
```
