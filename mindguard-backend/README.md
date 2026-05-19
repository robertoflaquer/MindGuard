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
DB_PASSWORD=MindGuard!
JWT_SECRET=sua_chave_secreta
```

## Banco de dados

```bash
# Schema principal
npm run migrate

# Tabelas de agendamentos e prescrições
node src/database/migrate_appointments.js
```

## Execução

```bash
npm run dev    # desenvolvimento (nodemon)
npm start      # produção
```

API disponível em `http://localhost:3000`.

## Endpoints principais

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Cadastro |
| GET | `/api/signals` | Listar sinais do usuário |
| POST | `/api/signals` | Registrar sinal |
| POST | `/api/signals/simulate` | Simular wearable |
| GET | `/api/risk/current` | Risco atual |
| GET | `/api/appointments` | Listar agendamentos |
| POST | `/api/appointments` | Criar agendamento |
| GET | `/api/prescriptions` | Listar prescrições |
| POST | `/api/questionnaires` | Enviar questionário |

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
