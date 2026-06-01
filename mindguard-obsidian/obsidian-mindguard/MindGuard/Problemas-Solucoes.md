# Problemas & Soluções

## Status Atual do Projeto

- ✅ Database PostgreSQL: Completo e rodando
- ✅ Backend Node.js: Completo e funcional
- ✅ Frontend React: Completo e pronto
- ⚠️ Python Engine: Criado, mas com issues de conexão
- ❌ Integração completa: Pendente

---

## Problema 1: Python Engine - Senha PostgreSQL Incorreta

### Sintoma
```
✅ Connected to PostgreSQL database
(mas depois ao usar /risk/calculate)
❌ password authentication failed for user "postgres"
```

### Causa
- `.env` do Python Engine com senha **diferente** do Backend
- Ou senha realmente errada

### Solução

**1. Verificar senha correta:**
```bash
# Abrir CMD como Admin
"C:\Program Files\PostgreSQL\15\bin\psql" -U postgres -h localhost -p 5433
# Digite a senha que você sabe
```

**2. Se conectou:**
```
- Atualizar .env em mindguard-python
- DB_PASSWORD={senha que funcionou}
```

**3. Se não conectou:**
```bash
# Resetar senha PostgreSQL (cmd Admin):
"C:\Program Files\PostgreSQL\15\bin\psql" -U postgres -h localhost -p 5433 -d postgres
# Dentro do psql:
ALTER USER postgres PASSWORD 'troque-pela-sua-senha-local';
\q

# Depois atualizar .env com: DB_PASSWORD=troque-pela-sua-senha-local
```

**4. Reiniciar Python Engine:**
```bash
python -m uvicorn main:app --reload --port 8000
# Deve aparecer:
✅ Connected to PostgreSQL database
🚀 MindGuard Python Engine started!
```

---

## Problema 2: TypeError em deviation_analyzer.py

### Sintoma
```
TypeError: 'int' object is not subscriptable
  File "services/deviation_analyzer.py", line 102
    return result[0]['id']
```

### Causa
- `execute_query()` retorna `int` (rowcount) para INSERT
- Código tentava acessar `result[0]` como array
- Deveria fazer SELECT depois para pegar o ID

### Solução APLICADA

Arquivo corrigido. Agora:
```python
def _save_deviation(...):
  # INSERT
  db.execute_query(insert_query, params)
  
  # SELECT para pegar ID
  select_query = "SELECT id FROM deviations WHERE ... ORDER BY detection_timestamp DESC LIMIT 1"
  result = db.execute_query(select_query, params)
  
  if result and len(result) > 0:
    return result[0]['id']
  return None
```

**Verificar**: Seu `deviation_analyzer.py` tem essa correção?

---

## Problema 3: PostgreSQL Desconecta (Connection Refused)

### Sintoma
```
A conexão com 127.0.0.1 foi recusada
```

### Causa
- PostgreSQL parou de rodar
- Porta 5433 não está acessível

### Solução

**1. Verificar se PostgreSQL está rodando:**
```bash
# CMD (não precisa ser Admin):
tasklist | findstr postgres
# Se não aparecer nada → PostgreSQL parou
```

**2. Reiniciar PostgreSQL (CMD Admin):**
```bash
net stop postgresql-x64-15
# Esperar 5 segundos
net start postgresql-x64-15
# Deve aparecer: The PostgreSQL-x64-15 service was started successfully
```

**3. Testar conexão:**
```bash
"C:\Program Files\PostgreSQL\15\bin\psql" -U postgres -h localhost -p 5433 -d mindguard -c "SELECT 1"
# Se retornar " ?column? = 1" → Está OK
```

**4. Reiniciar aplicações:**
```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Python Engine
python -m uvicorn main:app --reload --port 8000

# Terminal 3: Frontend
npm run dev
```

---

## Problema 4: Port já em uso

### Sintoma
```
Error: listen EADDRINUSE :::3000
ou
OSError: [WinError 10048] Normalmente, apenas uma utilização de cada endereço de socket
```

### Causa
- Backend/Frontend/Python já estão rodando em outro terminal
- Ou aplicação anterior não foi encerrada

### Solução

**1. Matar processo na porta:**

Para **Node.js (3000 ou 3001)**:
```bash
# CMD Admin:
netstat -ano | findstr :3000
# Retorna PID
taskkill /PID {PID} /F
```

Para **Python (8000)**:
```bash
netstat -ano | findstr :8000
taskkill /PID {PID} /F
```

**2. Tentar rodar de novo**

---

## Problema 5: Módulo Python não encontrado

### Sintoma
```
ModuleNotFoundError: No module named 'numpy'
ou 'psycopg2', 'fastapi', etc
```

### Causa
- Dependências não instaladas corretamente
- Python errado (3.14 não compatível com algumas versões)

### Solução

**1. Instalar todas dependências de novo:**
```bash
cd C:\Users\betof\mindguard\mindguard-python

# Remover old packages (opcional)
pip list --user | grep -E 'fastapi|uvicorn|pydantic|psycopg2|numpy|scipy'

# Instalar tudo junto:
pip install fastapi uvicorn pydantic psycopg2-binary python-dotenv redis numpy scipy scikit-learn --break-system-packages
```

**2. Verificar instalação:**
```bash
python -c "import numpy; print(numpy.__version__)"
python -c "import psycopg2; print(psycopg2.__version__)"
python -c "import fastapi; print(fastapi.__version__)"
```

**3. Rodar Python Engine:**
```bash
python -m uvicorn main:app --reload --port 8000
```

---

## Problema 6: CORS Error no Frontend

### Sintoma
```
Access to XMLHttpRequest blocked by CORS policy
```

### Causa
- Backend não ativou CORS para localhost:3001
- Frontend tentando chamar http://localhost:3000

### Solução

**Verificar `vite.config.js`:**
```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
```

**Verificar Backend `server.js`:**
```javascript
const cors = require('cors')
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}))
```

Se CORS ainda não funcionar, **desativar temporariamente para testes**:
```javascript
app.use(cors()) // Aceita todas origens (APENAS para dev!)
```

---

## Problema 7: JWT Token Expirado

### Sintoma
```
401 Unauthorized
No token provided
```

### Causa
- Token não salvo em localStorage
- Token expirou (padrão 7 dias)
- Cabeçalho Authorization mal formatado

### Solução

**Frontend `services/api.js`:**
```javascript
// Verificar se token existe
const token = localStorage.getItem('token')
console.log('Token:', token)

// Verificar se está sendo enviado
api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token
  if (token) {
    console.log('Enviando token:', token.substring(0, 10) + '...')
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

**Se token expirou:**
```javascript
// Fazer logout e re-login
useAuthStore.getState().logout()
window.location.href = '/login'
```

---

## Problema 8: Dashboard vazio (sem dados)

### Sintoma
- Dashboard carrega
- Mas RiskCard não mostra dados
- SignalChart vazio

### Causa
- Nenhum sinal foi registrado ainda
- Baseline não foi calculado
- Risco nunca foi avaliado

### Solução

**1. Registrar sinais manualmente:**
- Go to Dashboard → Registrar Sinais
- Sinal: HRV, Valor: 50
- Click "Registrar Sinal"
- Repetir 5+ vezes com valores diferentes (50, 52, 48, 55, 49)

**2. Calcular baseline:**
```bash
# Via Insomnia/Postman:
POST http://localhost:8000/baseline/calculate
Body: {user_id: "seu-uuid"}
```

**3. Calcular risco:**
```bash
POST http://localhost:8000/risk/calculate
Body: {user_id: "seu-uuid"}
```

**4. Recarregar Frontend:**
```
Refresh page (F5)
Dashboard deve mostrar dados agora
```

---

## Problema 9: Query SQL retorna NULL ou vazio

### Sintoma
```
SELECT * FROM user_signals WHERE user_id = 'xyz'
# Retorna nada
```

### Causa
- User_id não existe
- Sinais não foram salvos
- Tabela vazia

### Solução

**1. Verificar se user existe:**
```sql
SELECT id, email, full_name FROM users LIMIT 5;
```

**2. Listar sinais:**
```sql
SELECT * FROM user_signals LIMIT 10;
```

**3. Verificar signal types:**
```sql
SELECT id, name FROM signal_types;
```

**4. Se tudo vazio, repovoar banco:**
```bash
# No DBeaver:
# Open SQL Script → seed.sql → Execute
```

---

## Problema 10: Integração Backend ↔ Python não funciona

### Sintoma
```
POST /risk/calculate retorna erro
ou
Backend não consegue chamar Python Engine
```

### Causa
- Python Engine não está rodando
- URL incorreta em `.env` do Backend
- Network/firewall bloqueando

### Solução

**1. Verificar se Python está rodando:**
```bash
curl http://localhost:8000/health
# Deve retornar: {"status": "healthy", "database": "connected"}
```

**2. Verificar URL no Backend `.env`:**
```env
PYTHON_API_URL=http://localhost:8000
```

**3. Testar chamada manualmente:**
```bash
curl -X POST http://localhost:8000/risk/calculate \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-user-uuid"}'
```

**4. Se falhar, verificar logs do Python:**
```
Terminal do Python mostra erros?
Erro de conexão com banco de dados?
Erro de timeout?
```

---

## Checklist de Inicialização

```
Antes de rodar qualquer coisa:

[ ] PostgreSQL está rodando? (net start postgresql-x64-15)
[ ] Porta 5433 está acessível? (psql -h localhost -p 5433)
[ ] Senhas iguais em todos .env?
[ ] Node.js instalado? (node -v)
[ ] Python 3.11+ instalado? (python --version)
[ ] npm packages instalados? (npm list)
[ ] Python packages instalados? (pip list)

Iniciar nesta ordem:

1. PostgreSQL (services.msc)
2. Backend (npm run dev)
3. Python Engine (python -m uvicorn main:app --reload --port 8000)
4. Frontend (npm run dev)

Verificar health:

GET http://localhost:3000/health
GET http://localhost:8000/health
GET http://localhost:3001

Tudo verde = OK ✅
```

---

## Logs Importantes

### Backend Esperado
```
🚀 MindGuard API running at http://localhost:3000
✅ Connected to PostgreSQL database
```

### Python Esperado
```
✅ Connected to PostgreSQL database
🚀 MindGuard Python Engine started!
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Frontend Esperado
```
➜  Local:   http://localhost:3001
```

### Se algum não aparecer
```
→ Ver erro acima na consola
→ Encontrar na seção "Problemas"
→ Aplicar solução
```

---

## ✅ Problema 11 — SQL injection em INTERVAL (corrigido)

**Sintoma**: Potencial vulnerabilidade em `signalService.getSignalStats` e `riskController.getHistory`

**Causa**: Template literals interpolando variável diretamente na SQL:
```javascript
// ❌ Vulnerável
AND us.timestamp >= NOW() - INTERVAL '${days} days'
```

**Solução aplicada**:
```javascript
// ✅ Seguro — parameterizado
AND us.timestamp >= NOW() - ($3 * INTERVAL '1 day')
// com params.push(parseInt(days))
```

**Arquivos corrigidos**:
- `src/services/signalService.js` linha `getSignalStats` — parâmetro `$3`
- `src/controllers/riskController.js` linha `getHistory` — parâmetro `$2`, `LIMIT` virou `$3`

**Status**: ✅ Corrigido — nenhuma ação necessária

---

## Contato para Debug

Se nada funcionar:

1. **Screenshot do erro**
2. **Output completo da consola**
3. **Seu `.env` (sem senhas)**
4. **Qual etapa falha?**
   - Instalação?
   - Conexão DB?
   - Cálculo de risco?
   - Exibição no Frontend?

[[Setup-Instalacao]] [[Database]] [[Backend]] [[Frontend]] [[Python-Engine]]
