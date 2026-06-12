# Deploy no Railway — Tutorial Completo

> Baseado nos problemas reais encontrados durante o deploy. Siga **na ordem**.

---

## Pré-requisitos

- Conta em [railway.app](https://railway.app) — faça login com o GitHub
- Repositório MindGuard no GitHub (public ou private)

---

## Visão geral

Você vai criar **1 projeto** no Railway com **4 serviços**:

```
Projeto Railway
├── PostgreSQL   (banco de dados — plugin nativo)
├── Backend      (Node.js — root: mindguard-backend)
├── Python       (FastAPI  — root: mindguard-python)
└── Frontend     (React    — root: mindguard-frontend)
```

---

## Passo 1 — Criar o Projeto

1. Acesse [railway.app/new](https://railway.app/new)
2. Clique em **Empty Project**
3. Dê o nome `MindGuard` ao projeto

---

## Passo 2 — Adicionar o PostgreSQL

1. Dentro do projeto, clique em **+ New** → **Database** → **Add PostgreSQL**
2. Aguarde ficar **verde** (30-60 segundos)
3. Clique no serviço PostgreSQL → aba **Variables**
4. Anote esses valores — você vai usar no Python:

   | Variável | Para quê |
   |----------|----------|
   | `PGHOST` | `DB_HOST` do Python |
   | `PGPORT` | `DB_PORT` do Python |
   | `PGDATABASE` | `DB_NAME` do Python |
   | `PGUSER` | `DB_USER` do Python |
   | `PGPASSWORD` | `DB_PASSWORD` do Python |

> **Dica Railway**: O PostgreSQL também expõe `DATABASE_PRIVATE_URL` — o Backend Node.js usa isso automaticamente. Você não precisa copiar essa variável manualmente para o backend.

---

## Passo 3 — Serviço: Backend (Node.js)

### 3.1 Criar o serviço

1. Clique em **+ New** → **GitHub Repo** → selecione **MindGuard**
2. Em **Root Directory**, coloque: `mindguard-backend`
3. Aguarde o build (usa Nixpacks — **não deve haver Dockerfile** na pasta)

> **Importante**: Se aparecer erro de build com Dockerfile, veja a seção de Troubleshooting.

### 3.2 Configurar variáveis de ambiente

Vá em **Variables** e adicione:

```
NODE_ENV=production
JWT_SECRET=<gere-uma-string-aleatoria-de-32-caracteres-ex-com-openssl-rand-hex-32>
JWT_EXPIRES_IN=7d
LOG_LEVEL=info
PYTHON_API_URL=    ← deixar em branco por enquanto
CORS_ORIGIN=       ← deixar em branco por enquanto
```

> **Não** adicione `DB_HOST`, `DB_PORT` etc. O backend detecta automaticamente o `DATABASE_PRIVATE_URL` que o Railway injeta quando há PostgreSQL no mesmo projeto.

### 3.3 Gerar domínio

1. Vá em **Settings** → **Networking** → clique em **Generate Domain**
2. Anote a URL: `https://mindguard-backend-xxxx.up.railway.app`

---

## Passo 4 — Serviço: Python Engine (FastAPI)

### 4.1 Criar o serviço

1. Clique em **+ New** → **GitHub Repo** → selecione **MindGuard**
2. Em **Root Directory**, coloque: `mindguard-python`
3. Aguarde o build

### 4.2 Configurar variáveis de ambiente

Vá em **Variables** e adicione (usando os valores do PostgreSQL do Passo 2):

```
DB_HOST=       ← valor de PGHOST
DB_PORT=       ← valor de PGPORT
DB_NAME=       ← valor de PGDATABASE
DB_USER=       ← valor de PGUSER
DB_PASSWORD=   ← valor de PGPASSWORD
BASELINE_MIN_DAYS=7
BASELINE_MAX_DAYS=14
DEVIATION_THRESHOLD=15.0
HIGH_RISK_THRESHOLD=70
ATTENTION_THRESHOLD=40
```

> O `PORT` **não** precisa ser definido — o Railway injeta automaticamente e o `main.py` lê com `os.environ.get("PORT", 8000)`.

### 4.3 Gerar domínio

1. **Settings** → **Networking** → **Generate Domain**
2. Anote: `https://mindguard-python-xxxx.up.railway.app`

---

## Passo 5 — Serviço: Frontend (React)

### 5.1 Criar o serviço

1. Clique em **+ New** → **GitHub Repo** → selecione **MindGuard**
2. Em **Root Directory**, coloque: `mindguard-frontend`
3. Aguarde o build (compila o React com `npm run build`)

### 5.2 Configurar variáveis de ambiente

```
VITE_API_URL=https://mindguard-backend-xxxx.up.railway.app
```

> Use a URL do backend anotada no Passo 3.3. Sem barra no final.

> **Importante**: Essa variável é usada no **build** do React (`import.meta.env.VITE_API_URL`). Se você mudar depois, precisa fazer redeploy do frontend.

### 5.3 Fazer redeploy após configurar a variável

1. Vá em **Deployments**
2. Clique nos três pontinhos do último deploy → **Redeploy**
3. Aguarde o novo build com a variável correta

### 5.4 Gerar domínio

1. **Settings** → **Networking** → **Generate Domain**
2. Anote: `https://mindguard-frontend-xxxx.up.railway.app`

---

## Passo 6 — Completar as variáveis do Backend

Volte no serviço **Backend** → **Variables** e preencha o que ficou em branco:

```
PYTHON_API_URL=https://mindguard-python-xxxx.up.railway.app
CORS_ORIGIN=https://mindguard-frontend-xxxx.up.railway.app
```

O backend vai **restartar automaticamente** ao salvar.

---

## Passo 7 — Verificar se está tudo online

Acesse cada URL no navegador ou via `curl`:

```bash
# Backend deve retornar {"status":"ok"}
curl https://mindguard-backend-xxxx.up.railway.app/health

# Python deve retornar {"status":"healthy"}
curl https://mindguard-python-xxxx.up.railway.app/health

# Frontend: abrir no navegador
https://mindguard-frontend-xxxx.up.railway.app
```

Se os três retornarem OK, o sistema está operacional. Crie uma conta e faça login.

---

## Compartilhar com o grupo

Basta enviar a URL do frontend. Ninguém precisa instalar nada.

```
https://mindguard-frontend-xxxx.up.railway.app
```

---

## Troubleshooting — Problemas conhecidos

### ❌ Build falha com "Dockerfile found"

**Causa**: O Railway prioriza Dockerfile sobre `railway.toml`. Se ainda existir um `Dockerfile` em `mindguard-backend/`, o Railway usa o Docker em vez do Nixpacks e pode usar cache desatualizado.

**Solução**: Confirme que **não há** `Dockerfile` em `mindguard-backend/`. Apenas `railway.toml` deve existir. O `Dockerfile.local` (para uso com `docker-compose` local) pode ficar.

---

### ❌ Backend não conecta ao banco

**Causa**: Faltando variáveis de banco ou o PostgreSQL não está no mesmo projeto Railway.

**Verificação**: Nos logs do backend, procure por `Connected to PostgreSQL database`. Se não aparecer:

1. Confirme que o PostgreSQL está no **mesmo projeto** Railway
2. O backend detecta automaticamente `DATABASE_PRIVATE_URL` que o Railway injeta — não precisa de configuração manual
3. Se usar um banco externo, defina `DATABASE_URL=postgres://user:pass@host:port/db` manualmente

---

### ❌ Python não sobe / erro de PORT

**Causa**: Versão antiga usava `$PORT` diretamente no `startCommand` do `railway.toml`, que não expande variáveis shell.

**Verificação**: O `railway.toml` do python deve ter:
```toml
[deploy]
startCommand = "python main.py"
```

E o `main.py` deve ler a porta assim (já está correto):
```python
if __name__ == "__main__":
    import uvicorn, os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
```

---

### ❌ Frontend não consegue chamar a API (CORS error)

**Causa**: `CORS_ORIGIN` no backend não inclui a URL do frontend.

**Solução**:
1. No serviço Backend → Variables, confirme:
   ```
   CORS_ORIGIN=https://mindguard-frontend-xxxx.up.railway.app
   ```
2. A URL deve ser **exatamente** igual à URL do frontend (sem barra no final)
3. Salve e aguarde o restart do backend

---

### ❌ Frontend mostra dados do localhost em produção

**Causa**: `VITE_API_URL` não foi definido antes do build, então o frontend usou `''` (chamadas relativas ao próprio domínio).

**Solução**:
1. No serviço Frontend → Variables, defina:
   ```
   VITE_API_URL=https://mindguard-backend-xxxx.up.railway.app
   ```
2. Vá em **Deployments** → faça **Redeploy** (não basta salvar a variável — precisa rebuildar)

---

### ❌ Risco não aparece no dashboard

**Causa**: Python Engine não está respondendo ou não conecta ao banco.

**Verificação**:
1. Acesse `https://mindguard-python-xxxx.up.railway.app/health` — deve retornar `{"status":"healthy"}`
2. Nos logs do backend, confirme que `PYTHON_API_URL` está correto
3. Nos logs do Python, verifique se conectou ao banco

---

## Referências rápidas

| Arquivo | Para quê |
|---------|----------|
| `mindguard-backend/railway.toml` | Build/start do backend |
| `mindguard-python/railway.toml` | Build/start do Python |
| `mindguard-frontend/railway.toml` | Build do frontend |
| `mindguard-frontend/start.sh` | Serve o build React com `serve` na porta `$PORT` |
| `mindguard-backend/src/config/database.js` | Lógica de conexão (DATABASE_PRIVATE_URL → DATABASE_URL → PG* → DB_*) |
| `mindguard-python/config/database.py` | Conexão Python (DB_HOST etc.) |
