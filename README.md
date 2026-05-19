# MindGuard

Plataforma de monitoramento preventivo de saúde mental — FIAP Challenges 2025 · Care Plus / Blua.

**Stack:** React + Vite · Node.js + Express · FastAPI (Python) · PostgreSQL 15

---

## Rodar com Docker (recomendado — zero configuração)

> Pré-requisito: [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando.

```bash
# 1. Clone o repositório
git clone https://github.com/SEU_USUARIO/mindguard.git
cd mindguard

# 2. Suba todos os serviços
docker-compose up --build
```

Aguarde o build (primeira vez ~3–5 min). Quando aparecer `backend | MindGuard API running on port 3000`, acesse:

| Serviço | URL |
|---------|-----|
| **Frontend** (app) | http://localhost:3001 |
| **Backend** (API) | http://localhost:3000 |
| **Python Engine** | http://localhost:8000 |

Para parar: `Ctrl+C` e depois `docker-compose down`.

---

## Rodar sem Docker (desenvolvimento local)

### Pré-requisitos

- Node.js 18+
- Python 3.11+
- PostgreSQL 15 rodando na porta **5433**

### 1. Banco de dados

Execute os dois scripts SQL no PostgreSQL:

```bash
psql -U postgres -d mindguard -f mindguard-backend/src/database/schema.sql
psql -U postgres -d mindguard -f mindguard-backend/src/database/add_appointments_prescriptions.sql
```

### 2. Backend

```bash
cd mindguard-backend
cp .env.example .env          # edite o .env com sua senha do PostgreSQL
npm install
npm run dev                    # http://localhost:3000
```

### 3. Python Engine

```bash
cd mindguard-python
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

### 4. Frontend

```bash
cd mindguard-frontend
npm install
npm run dev                    # http://localhost:3001
```

---

## Estrutura do projeto

```
mindguard/
├── mindguard-backend/      # API Node.js + Express
├── mindguard-frontend/     # React + Vite + Tailwind
├── mindguard-python/       # FastAPI — cálculo de risco e baseline
├── mindguard-obsidian/     # Documentação técnica (Obsidian)
├── entrega-sprint3/        # Entrega FIAP Sprint 3
└── docker-compose.yml      # Orquestração de todos os serviços
```

---

## Criar conta de teste

1. Acesse `http://localhost:3001`
2. Clique em **Criar conta**
3. Preencha nome, e-mail e senha
4. Faça login

---

## Dúvidas

Consulte a pasta `mindguard-obsidian/` para documentação detalhada de arquitetura, banco de dados, endpoints e setup.
