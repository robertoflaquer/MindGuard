# Guia de Contribuição

## Como Contribuir ao MindGuard

---

## 1. Setup para Desenvolvimento

### Clonar Repositório (quando existir)
```bash
git clone https://github.com/seu-usuario/mindguard.git
cd mindguard
```

### Estrutura de Branches

```
main (produção)
 └─ dev (desenvolvimento)
     ├─ feature/backend-signals
     ├─ feature/python-ml
     ├─ feature/mobile-app
     └─ fix/postgres-connection
```

### Criar Branch para Feature
```bash
git checkout -b feature/sua-feature
# Exemplo: feature/add-questionnaire-validation
```

---

## 2. Padrões de Código

### JavaScript/Node.js

**Naming**:
```javascript
// ✅ Bom
async function getUserSignals(userId) { }
const calculateBaselineScore = (signals) => { }

// ❌ Evitar
function get_user_signals(uid) { }
const calc = (s) => { }
```

**Error Handling**:
```javascript
// ✅ Bom
try {
  const result = await api.post('/endpoint', data)
  return result.data
} catch (err) {
  logger.error('Operação falhou:', err)
  throw new Error('Mensagem para usuário')
}

// ❌ Evitar
try { ... } catch (err) { console.log(err) }
```

**Validação**:
```javascript
// ✅ Usar Joi schemas
const schema = Joi.object({
  email: Joi.string().email().required(),
  signalValue: Joi.number().positive().required()
})

const { error, value } = schema.validate(req.body)
if (error) return res.status(400).json({ error })

// ❌ Evitar
if (!req.body.email || !req.body.value) { }
```

### Python

**Naming**:
```python
# ✅ Bom
def calculate_baseline(user_id: str, signal_type_id: int):
    pass

class BaselineCalculator:
    def __init__(self):
        pass

# ❌ Evitar
def calc(uid, stid):
    pass

def Calc():
    pass
```

**Type Hints**:
```python
# ✅ Usar sempre
def analyze_deviation(
    user_id: str,
    signal_type_id: int,
    current_value: float
) -> dict:
    result: dict = {}
    return result

# ❌ Evitar
def analyze_deviation(user_id, signal_type_id, current_value):
    pass
```

**Docstrings**:
```python
def calculate_risk(user_id: str) -> dict:
    """
    Calculate comprehensive risk score for a user.
    
    Combines signal correlation, trends, and context to generate
    risk assessment.
    
    Args:
        user_id: UUID of the user
    
    Returns:
        Dictionary with risk_level, risk_score, confidence_level
    
    Raises:
        ValueError: If user_id is invalid
        DatabaseError: If query fails
    """
    pass
```

### React

**Naming Components**:
```javascript
// ✅ Bom (PascalCase)
export function RiskCard({ risk }) { }
export const SignalForm = () => { }

// ❌ Evitar (camelCase)
export function riskCard() { }
export const signal_form = () => { }
```

**Hooks Pattern**:
```javascript
// ✅ Bom
export default function Dashboard() {
  const user = useAuthStore(s => s.user)
  const risk = useRiskStore(s => s.currentRisk)
  const [activeTab, setActiveTab] = useState('overview')
  
  useEffect(() => {
    fetchData()
  }, [])
  
  return <div>...</div>
}

// ❌ Evitar
class Dashboard extends React.Component { }
function dashboard() { }
```

---

## 3. Convenções de Commit

**Format**:
```
<tipo>: <descrição breve>

<corpo detalhado (opcional)>

<rodapé (opcional)>
```

**Tipos**:
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (sem lógica)
- `refactor`: Refatoração (sem alteração de comportamento)
- `test`: Testes
- `chore`: Dependências, configuração

**Exemplos**:
```
feat: add questionnaire submission endpoint

Implemented POST /api/questionnaires/submit that:
- Validates responses against schema
- Calculates score
- Stores in database
- Triggers risk assessment

Closes #42

---

fix: resolve postgres connection timeout

Changed pool timeout from 30s to 60s
Added retry logic with exponential backoff
Logs connection attempts for debugging

Fixes #38

---

docs: update database schema documentation

Added detailed explanation of:
- Signal flow
- Baseline calculation
- Risk assessment triggers

Related to #10
```

---

## 4. Pull Request Process

### 1. Push e Criar PR
```bash
git add .
git commit -m "feat: descrição clara"
git push origin feature/sua-feature
```

### 2. Template de PR
```markdown
## Descrição
Breve descrição do que foi feito

## Tipo de Mudança
- [x] Nova feature
- [ ] Bug fix
- [ ] Breaking change

## Como testar
1. Passo 1
2. Passo 2
3. Resultado esperado

## Checklist
- [x] Código segue padrões do projeto
- [x] Testes passam
- [x] Documentação atualizada
- [x] Sem erros de console
```

### 3. Code Review
- Esperar aprovação de ≥1 mantedor
- Resolver comentários
- Fazer new commits em vez de force push

### 4. Merge
```bash
git checkout dev
git pull origin dev
git merge feature/sua-feature
git push origin dev
```

---

## 5. Testing

### Backend (Jest)

```javascript
// test/auth.test.js
describe('Authentication', () => {
  test('register with valid email', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
        fullName: 'Test User'
      })
    
    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)
    expect(response.body.data.token).toBeDefined()
  })
  
  test('register with invalid email', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'invalid-email',
        password: 'Password123!',
        fullName: 'Test User'
      })
    
    expect(response.status).toBe(400)
  })
})
```

**Rodar testes**:
```bash
npm test
npm test -- --watch
npm test -- --coverage
```

### Python (pytest)

```python
# tests/test_baseline.py
import pytest
from services.baseline_calculator import BaselineCalculator

@pytest.fixture
def calculator():
    return BaselineCalculator()

def test_calculate_baseline_success(calculator, mocker):
    # Mock database
    mocker.patch('config.database.db.execute_query', return_value=[
        {'value': 50},
        {'value': 52},
        {'value': 48}
    ])
    
    result = calculator.calculate_baseline('user-123', 1)
    
    assert result['status'] == 'success'
    assert result['baseline_value'] == 50

def test_calculate_baseline_insufficient_data(calculator, mocker):
    mocker.patch('config.database.db.execute_query', return_value=[])
    
    result = calculator.calculate_baseline('user-123', 1)
    
    assert result['status'] == 'insufficient_data'
```

**Rodar testes**:
```bash
pytest
pytest -v
pytest --cov=services
pytest -k test_baseline
```

### Frontend (Cypress)

```javascript
// cypress/e2e/auth.cy.js
describe('Authentication Flow', () => {
  it('User can register and login', () => {
    cy.visit('http://localhost:3001/register')
    
    cy.get('input[type="email"]').type('newuser@example.com')
    cy.get('input[type="password"]').type('Password123!')
    cy.get('input[placeholder="Full Name"]').type('New User')
    cy.get('button[type="submit"]').click()
    
    cy.url().should('include', '/dashboard')
    cy.get('h1').should('contain', 'MindGuard')
  })
})
```

---

## 6. Documentação

### README Format

```markdown
# Projeto

Breve descrição

## Instalação

```bash
npm install
```

## Uso

```bash
npm run dev
```

## API

### GET /endpoint
Descrição do endpoint

**Parâmetros**:
- param1 (string): descrição

**Response**:
```json
{
  "data": {...}
}
```

## Contribuindo

Ver CONTRIBUTING.md
```

### Manter Atualizado

- ✅ Quando mudar endpoint
- ✅ Quando mudar banco de dados
- ✅ Quando mudar configuração
- ❌ Typos em mensagens de erro (comentário é OK)

---

## 7. Performance

### Checklist antes de PR

**Backend**:
```
[ ] Usar prepared statements (SQL)
[ ] Implementar rate limiting se necessário
[ ] Adicionar índices no banco
[ ] Validar input com Joi
[ ] Logar operações críticas
[ ] Tratar erros adequadamente
```

**Python**:
```
[ ] Usar numpy/scipy corretamente
[ ] Cache de resultados custosos
[ ] Validação com Pydantic
[ ] Type hints em tudo
[ ] Logging de cálculos
```

**Frontend**:
```
[ ] Usar useCallback/useMemo quando apropriado
[ ] Lazy load componentes grandes
[ ] Memoizar stores (Zustand)
[ ] Evitar re-renders desnecessários
[ ] Usar React DevTools Profiler
```

---

## 8. Security

### Checklist

```
[ ] Sem senhas em código
[ ] Sem tokens em localStorage (se possível)
[ ] CORS configurado corretamente
[ ] Rate limiting ativo
[ ] SQL injection prevenido (prepared statements)
[ ] XSS prevenido (sanitize input)
[ ] CSRF token se aplicável
[ ] Validar JWT signature
```

### Secrets em .env

```env
# .env (NUNCA commitar)
DB_PASSWORD=xxx
JWT_SECRET=xxx
CAREPLUS_API_KEY=xxx

# .env.example (OK commitar)
DB_PASSWORD=change_me
JWT_SECRET=change_me
CAREPLUS_API_KEY=change_me
```

---

## 9. Issues & Discussions

### Reportar Bug

```markdown
**Descrição**
O quê está acontecendo incorretamente?

**Como reproduzir**
1. Passo 1
2. Passo 2
3. Resultado incorreto

**Resultado esperado**
O quê deveria acontecer

**Ambiente**
- OS: Windows 10
- Node: v18.2
- Python: 3.11
```

### Sugerir Feature

```markdown
**Descrição**
O quê você gostaria de adicionar?

**Por quê?**
Qual é o benefício?

**Alternativas consideradas**
Outras formas de resolver

**Contexto adicional**
Screenshots, exemplos, etc
```

---

## 10. Releases

### Versionamento (Semantic)

```
MAJOR.MINOR.PATCH

1.0.0 - Primeira versão estável
1.1.0 - Nova feature
1.1.1 - Bug fix
2.0.0 - Breaking change
```

### Checklist de Release

```
[ ] Todas as features completas e testadas
[ ] Documentação atualizada
[ ] CHANGELOG atualizado
[ ] Versão em package.json incrementada
[ ] Tag no Git: v1.2.0
[ ] Release notes no GitHub
```

---

## Contato

- **Issues**: Para bugs e features
- **Discussions**: Para perguntas
- **Email**: Se urgente
- **Discord**: Para chat rápido (se criado)

---

## Código de Conduta

Seja respeitoso com contribuidores. Somos uma comunidade amigável!

[[Arquitetura]] 
[[Setup-Instalacao]]
