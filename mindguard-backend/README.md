# MindGuard Backend

API REST em Node.js + Express para o sistema de monitoramento de saúde mental MindGuard.

## Stack

- **Node.js** + **Express** (ESM)
- **PostgreSQL 15** via `pg`
- **Pino** para logging estruturado
- **Joi** para validação de entrada
- **Helmet** + **xss-clean** + **express-rate-limit** para segurança
- **JWT** para autenticação

## Pré-requisitos

- Node.js 18+
- PostgreSQL 15 rodando na porta **5433**
- Redis (opcional — filas Bull)

## Instalação

```bash
cd mindguard-backend
npm install
```

Copie o `.env.example` para `.env` e ajuste as variáveis:

```
PORT=3000
DB_HOST=localhost
DB_PORT=5433
DB_NAME=mindguard
DB_USER=postgres
DB_PASSWORD=troque-pela-sua-senha-local
JWT_SECRET=troque-por-uma-chave-aleatoria-de-32-caracteres
```

## Banco de dados

```bash
# Schema principal (cria todas as tabelas básicas)
npm run migrate
# equivalente a: node src/database/migrate.js

# Tabelas de agendamentos e prescrições
node src/database/migrate_appointments.js
```

> Em produção (Railway), as migrations rodam automaticamente no `startCommand` do `railway.toml`. Se uma tabela já existir, a migration loga um aviso e segue — o servidor sobe normalmente (idempotente).

## Execução

```bash
npm run dev    # desenvolvimento (nodemon, com hot reload)
npm start      # produção (node direto)
```

API disponível em `http://localhost:3000`.

## Health checks

| Rota | O que faz |
|------|-----------|
| `GET /health` | Sempre retorna `200 OK` — usado pelo Railway para saber se o container está vivo |
| `GET /health/db` | Testa conexão com PostgreSQL. Retorna `503` se desconectado |

## Endpoints principais

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Cadastro |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/profile` | Perfil do usuário autenticado |
| POST | `/api/signals/batch` | Registrar lote de sinais |
| POST | `/api/signals/simulate` | Simular dados de wearable |
| GET | `/api/signals/recent` | Sinais recentes do usuário |
| GET | `/api/risk/current` | Risco atual |
| GET | `/api/risk/history` | Histórico de avaliações |
| POST | `/api/questionnaires/submit` | Enviar questionário (PSS, GAD-7, etc.) |
| GET | `/api/contexts/active` | Contextos de vida ativos |
| GET | `/api/appointments` | Listar agendamentos |
| POST | `/api/appointments` | Criar agendamento |
| GET | `/api/prescriptions` | Listar prescrições |

## Deploy

Para subir no Railway, veja [`RAILWAY.md`](../RAILWAY.md) no raiz do projeto. No Railway, o `DATABASE_PRIVATE_URL` é injetado automaticamente quando o PostgreSQL está no mesmo projeto — não precisa configurar `DB_HOST`/`DB_PORT` etc.

A variável `PYTHON_API_URL` aponta para o serviço do Python Engine (ex.: `https://mindguard-python-xxxx.up.railway.app`).

## Estrutura

```
src/
├── config/         # database, logger
├── controllers/    # lógica de cada rota
├── services/       # acesso ao banco
├── routes/         # definição de rotas + validação Joi
├── middleware/      # auth, errorHandler
└── database/       # migrations SQL
```
