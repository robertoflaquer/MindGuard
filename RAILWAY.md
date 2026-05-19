# Deploy no Railway — Passo a Passo

## Pré-requisito

Conta no [railway.app](https://railway.app) — faça login com o GitHub.

---

## 1. Criar o projeto

1. Acesse [railway.app/new](https://railway.app/new)
2. Clique em **Deploy from GitHub repo**
3. Selecione **robertoflaquer/MindGuard**
4. Clique em **Add variables later** (vamos configurar depois)

---

## 2. Adicionar o banco de dados PostgreSQL

No projeto criado:
1. Clique em **+ New** → **Database** → **PostgreSQL**
2. Aguarde o banco subir (fica verde)
3. Clique no serviço PostgreSQL → aba **Variables** → anote os valores de:
   - `PGHOST`
   - `PGPORT`
   - `PGDATABASE`
   - `PGUSER`
   - `PGPASSWORD`

---

## 3. Serviço: Backend (Node.js)

1. Clique em **+ New** → **GitHub Repo** → **MindGuard**
2. Em **Root Directory**, coloque: `mindguard-backend`
3. Aguarde o build
4. Vá em **Variables** e adicione:

```
NODE_ENV=production
DB_HOST=           ← valor de PGHOST do PostgreSQL
DB_PORT=           ← valor de PGPORT
DB_NAME=           ← valor de PGDATABASE
DB_USER=           ← valor de PGUSER
DB_PASSWORD=       ← valor de PGPASSWORD
JWT_SECRET=        ← qualquer string longa (ex: mindguard2025fiapcareplusblua)
JWT_EXPIRES_IN=7d
LOG_LEVEL=info
PYTHON_API_URL=    ← preencher depois (URL do serviço python)
CORS_ORIGIN=       ← preencher depois (URL do serviço frontend)
```

5. Clique em **Generate Domain** (aba Settings → Networking)
6. Anote a URL: `https://mindguard-backend-xxxx.up.railway.app`

---

## 4. Serviço: Python Engine (FastAPI)

1. Clique em **+ New** → **GitHub Repo** → **MindGuard**
2. Em **Root Directory**, coloque: `mindguard-python`
3. Em **Variables** adicione:

```
DB_HOST=           ← mesmo do PostgreSQL
DB_PORT=           ← mesmo do PostgreSQL
DB_NAME=           ← mesmo do PostgreSQL
DB_USER=           ← mesmo do PostgreSQL
DB_PASSWORD=       ← mesmo do PostgreSQL
BASELINE_MIN_DAYS=7
BASELINE_MAX_DAYS=14
DEVIATION_THRESHOLD=15.0
HIGH_RISK_THRESHOLD=70
ATTENTION_THRESHOLD=40
```

4. Clique em **Generate Domain**
5. Anote a URL: `https://mindguard-python-xxxx.up.railway.app`

---

## 5. Serviço: Frontend (React)

1. Clique em **+ New** → **GitHub Repo** → **MindGuard**
2. Em **Root Directory**, coloque: `mindguard-frontend`
3. Em **Variables** adicione:

```
VITE_API_URL=https://mindguard-backend-xxxx.up.railway.app
```

4. Clique em **Generate Domain**
5. Anote a URL: `https://mindguard-frontend-xxxx.up.railway.app`

---

## 6. Voltar no Backend e completar as variáveis

No serviço **backend**, edite as variáveis que ficaram em branco:

```
PYTHON_API_URL=https://mindguard-python-xxxx.up.railway.app
CORS_ORIGIN=https://mindguard-frontend-xxxx.up.railway.app
```

O backend vai restartar automaticamente.

---

## 7. Testar

Acesse a URL do frontend e crie uma conta. Se tudo correu bem, o app está rodando na nuvem.

- Frontend: `https://mindguard-frontend-xxxx.up.railway.app`
- API health check: `https://mindguard-backend-xxxx.up.railway.app/health`
- Python health check: `https://mindguard-python-xxxx.up.railway.app/health`

---

## Dica: compartilhar com o grupo

Basta enviar a URL do frontend. Ninguém do grupo precisa instalar nada.
