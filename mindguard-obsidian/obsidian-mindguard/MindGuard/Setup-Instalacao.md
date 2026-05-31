# Setup & Instalação

## Pré-requisitos

- Node.js v18+
- Python 3.11+
- PostgreSQL 15+ (porta 5433)
- Git (opcional)

## Estrutura do Projeto

```
mindguard/
├── mindguard-backend/      (Node.js + Express)
├── mindguard-frontend/     (React + Vite)
└── mindguard-python/       (FastAPI)
```

## 1. PostgreSQL - Instalação & Configuração

### Download
- https://www.postgresql.org/download/windows/
- Versão: 15 ou superior
- **Porta: 5433** (importante!)
- **Senha superuser: MindGuard2024!**

### Verificar Instalação
```bash
psql --version
```

### Criar Banco de Dados
1. Abrir DBeaver
2. New Database Connection → PostgreSQL
3. Host: localhost, Port: 5433, User: postgres
4. Test Connection
5. Create → Database: mindguard

### Popular Banco
1. Download `mindguard-backend.zip`
2. Extrair arquivos SQL
3. DBeaver → Open SQL Script → schema.sql
4. Execute
5. Depois seed.sql

### Migration de Agendamentos (rodar após schema.sql)
```bash
cd C:\Users\betof\mindguard\mindguard-backend
node src/database/migrate_appointments.js
```
Cria tabelas: `specialists` (com seed), `appointments`, `prescriptions`

**Status**: ✅ Banco criado com 28+ tabelas

---

## 2. Backend (Node.js + Express)

### Instalação
```bash
cd C:\Users\betof\mindguard\mindguard-backend
npm install
```

### Configuração (.env)
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5433
DB_NAME=mindguard
DB_USER=postgres
DB_PASSWORD=MindGuard2024!
JWT_SECRET=mindguard_super_secret_key_2024_change_in_production
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Rodar
```bash
npm run dev
```

**Esperado**: 
```
🚀 MindGuard API running at http://localhost:3000
✅ Connected to PostgreSQL database
```

**Endpoints base**: `/api/auth`, `/api/signals`, `/api/risk`, `/api/questionnaires`, `/api/contexts`, `/api/appointments`, `/api/prescriptions`

---

## 3. Frontend (React + Vite)

### Instalação
```bash
cd C:\Users\betof\mindguard\mindguard-frontend
npm install
```

### Rodar
```bash
npm run dev
```

**Esperado**: 
```
➜  Local:   http://localhost:3001
```

### Teste de Login
- Email: `teste@mindguard.com`
- Senha: (a que você configurou)

---

## 4. Python Engine (FastAPI)

### Instalação
```bash
cd C:\Users\betof\mindguard\mindguard-python
pip install fastapi uvicorn pydantic psycopg2-binary python-dotenv redis numpy scipy scikit-learn --break-system-packages
```

### Configuração (.env)
```env
PORT=8000
DB_HOST=localhost
DB_PORT=5433
DB_NAME=mindguard
DB_USER=postgres
DB_PASSWORD=MindGuard2024!
```

### Rodar
```bash
python -m uvicorn main:app --reload --port 8000
```

**Esperado**:
```
✅ Connected to PostgreSQL database
🚀 MindGuard Python Engine started!
Uvicorn running on http://127.0.0.1:8000
```

---

## Ordem de Inicialização

1. **PostgreSQL** (sempre primeiro)
   ```bash
   net start postgresql-x64-15
   ```

2. **Backend** (terminal 1)
   ```bash
   npm run dev
   ```

3. **Python Engine** (terminal 2)
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```

4. **Frontend** (terminal 3)
   ```bash
   npm run dev
   ```

---

## Troubleshooting

### PostgreSQL não conecta
- Verificar: `services.msc` → postgresql-x64-15 → Status: Running
- Reiniciar: `net stop postgresql-x64-15` → `net start postgresql-x64-15`
- Senha errada: Resetar via CMD

### Backend dá erro de conexão
- Verificar `.env` → DB_PASSWORD, DB_PORT
- Certifique-se PostgreSQL está rodando

### Frontend não conecta ao Backend
- CORS ativado? Ver `vite.config.js`
- Backend rodando na porta 3000?

### Python Engine não inicia
- NumPy/SciPy instalados? `pip install numpy scipy`
- Banco de dados conectando? Ver `.env`

---

## Verificação Rápida

```bash
# Backend health
curl http://localhost:3000/health

# Python Engine health
curl http://localhost:8000/health

# Frontend
Abrir http://localhost:3001 no navegador
```

Tudo verde = ✅ Sistema pronto!

---

## Deploy em produção

Este guia cobre apenas o ambiente local. Para subir o MindGuard em produção (Railway, com HTTPS e PostgreSQL gerenciado), siga o tutorial em [[RAILWAY]] (arquivo `RAILWAY.md` no raiz do projeto).

Resumo: 1 projeto Railway com 4 serviços (PostgreSQL + Backend + Python + Frontend). O `DATABASE_PRIVATE_URL` é injetado automaticamente entre serviços do mesmo projeto.

[[Backend]]
[[Database]]
[[Arquitetura]]