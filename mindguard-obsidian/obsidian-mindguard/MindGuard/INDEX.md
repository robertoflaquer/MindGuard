# MindGuard Knowledge Base - Índice Completo

## 📚 Visão Geral

Base de conhecimento estruturada do projeto MindGuard — plataforma de monitoramento preventivo de saúde mental integrada ao ecossistema Blua/CarePlus.

**Última atualização**: 2026-06-09
**Status do projeto**: MVP Web ✅ · Deploy Railway ✅ · Sprint Final Fase 2.5 🔄 · Apresentação 15/jun/2026
**Time**: Roberto (Lead Dev)

---

## 📖 Documentos Principais

### 1️⃣ [[Setup-Instalacao]]
**Para**: Pessoas que querem **rodar o projeto**
**Contém**:
- Pré-requisitos
- Instalação PostgreSQL, Node.js, Python
- Configuração de variáveis de ambiente
- Como iniciar Backend, Frontend, Python Engine
- Troubleshooting de instalação

**Leia se**: Está começando do zero

---

### 2️⃣ [[Arquitetura]]
**Para**: Entender **como o sistema funciona**
**Contém**:
- Diagrama de fluxo de dados
- Componentes principais (Frontend, Backend, Python, DB)
- Fluxo de autenticação
- Fluxo de cálculo de risco
- Tecnologias utilizadas
- Padrões de código

**Leia se**: Quer entender design geral do projeto

---

### 3️⃣ [[Database]]
**Para**: Trabalhar com **dados e banco de dados**
**Contém**:
- Schema completo (25+ tabelas)
- Definição de cada tabela
- Tipos de dados
- Relacionamentos
- Índices
- Views úteis
- Queries importantes

**Leia se**: Precisa entender estrutura de dados ou adicionar/modificar tabelas

---

### 4️⃣ [[Backend]]
**Para**: Desenvolver a **API REST (Node.js)**
**Contém**:
- Estrutura de pastas
- Todos os endpoints
- Services e Controllers
- Middleware (auth, validação, erros)
- Database config
- Fluxo de requisição
- Environment variables
- Testing com Insomnia

**Leia se**: Quer adicionar endpoints, corrigir bugs, ou entender API

---

### 5️⃣ [[Frontend]]
**Para**: Desenvolver a **UI (React)**
**Contém**:
- Estrutura de pastas
- Stores Zustand (auth, signals, risk)
- API service com interceptors
- Pages (Login, Register, Dashboard)
- Componentes principais (RiskCard, SignalForm, SignalChart)
- App.jsx (Router)
- Configuração Vite

**Leia se**: Quer modificar interface, adicionar páginas, ou implementar features

---

### 6️⃣ [[Python-Engine]]
**Para**: Entender **cálculos de risco (FastAPI)**
**Contém**:
- Visão geral do microserviço
- Endpoints (baseline, risk, health)
- Services (BaselineCalculator, DeviationAnalyzer, CorrelationEngine, RiskScorer)
- Lógica de cálculos matemáticos
- Database config
- Environment variables
- Fluxo completo
- Otimizações

**Leia se**: Quer entender/modificar algoritmos de risco ou processar dados

---

### 7️⃣ [[Problemas-Solucoes]]
**Para**: **Debugar e resolver issues**
**Contém**:
- 10 problemas mais comuns
- Sintomas, causas, soluções
- Comandos para debug
- Logs esperados
- Checklist de inicialização

**Leia se**: Está com erro ou algo não está funcionando

---

### 8️⃣ [[Roadmap]]
**Para**: Ver **plano futuro do projeto**
**Contém**:
- Timeline geral (5 fases)
- Fase 2: Deploy & Qualidade (atual)
- Fase 3: Mobile & Wearables
- Fase 4: Teleconsulta & Prescrição
- Fase 5: ML & Escalabilidade
- Estimativas de tempo e KPIs

**Leia se**: Quer entender direção do projeto ou planejar novas features

---

### 9️⃣ [[Guia-Contribuicao]]
**Para**: Contribuir ao projeto **corretamente**
**Contém**:
- Setup para desenvolvimento
- Padrões de código (JS, Python, React)
- Convenções de commit
- Pull Request process
- Testing (Jest, pytest, Cypress)
- Documentação
- Security checklist
- Como reportar bugs

**Leia se**: Quer contribuir ou colaborar no projeto

---

### 1️⃣1️⃣ [[METODOLOGIA]]
**Para**: Embasamento científico do modelo de risco
**Contém**:
- Validação dos instrumentos PSS-10, GAD-7, CBI, OLBI
- HRV como biomarcador de estresse (referências Task Force, Shaffer 2017)
- Justificativa para pesos 70% questionários / 30% sinais
- Ajuste contextual, thresholds, limitações
- 26 referências científicas completas

**Leia se**: Banca pergunta sobre metodologia ou validação científica

---

### 1️⃣2️⃣ [[Fase2-Sprint-Final]]
**Para**: Plano de execução do Sprint Final (9–15/jun/2026)
**Contém**:
- 4 etapas detalhadas com arquivos a criar/modificar
- Estimativas de tempo por etapa
- Ordem de execução recomendada
- Checklist de deploy final

**Leia se**: Precisa saber o que construir e em que ordem

---

### 🔟 [[Wearables-Integracao]]
**Para**: Planejar e implementar **integração com Apple Watch e Galaxy Watch**
**Contém**:
- Comparação Apple HealthKit vs Android Health Connect vs Samsung Health SDK
- Processo de autorização Samsung (partnership)
- Como funciona a sincronização matinal automática
- Plataformas de integração: Open Wearables (gratuito), Terra API (pago)
- Tabela de custos e complexidade
- Próximos passos

**Leia se**: Vai implementar coleta automática de sinais via wearable

---

## 🗺️ Mapa Mental

```
MindGuard/
│
├─ Setup & Instalação
│  └─ [[Setup-Instalacao]]
│
├─ Entender o Projeto
│  ├─ [[Arquitetura]] (visão geral)
│  └─ [[Roadmap]] (futuro)
│
├─ Desenvolvimento
│  ├─ [[Database]] (dados)
│  ├─ [[Backend]] (API)
│  ├─ [[Frontend]] (UI)
│  └─ [[Python-Engine]] (cálculos)
│
├─ Troubleshooting
│  └─ [[Problemas-Solucoes]] (debugging)
│
└─ Colaboração
   └─ [[Guia-Contribuicao]] (como contribuir)
```

---

## 🔍 Encontrar Informação Rápido

### "Como faço para..."

**...rodar o projeto?**
→ [[Setup-Instalacao]]

**...entender como funciona?**
→ [[Arquitetura]]

**...adicionar um novo endpoint?**
→ [[Backend]]

**...modificar a interface?**
→ [[Frontend]]

**...adicionar campos ao banco?**
→ [[Database]]

**...alterar algoritmo de risco?**
→ [[Python-Engine]]

**...meu código não está funcionando**
→ [[Problemas-Solucoes]]

**...posso contribuir?**
→ [[Guia-Contribuicao]]

**...qual é o plano futuro?**
→ [[Roadmap]]

---

## 📊 Estatísticas da Base

| Métrica | Valor |
|---------|-------|
| Total de documentos | 11 |
| Total de seções | 70+ |
| Endpoints documentados | 35+ |
| Tabelas no banco | 28+ |
| Páginas React | 7 (Login, Register, Dashboard, Questionnaires, Contexts, Treatment, Prescriptions) |
| Componentes React | 11 |
| Stores Zustand | 7 (auth, signal, risk, questionnaire, theme, toast, appointment) |
| Serviços Python | 4 |
| Problemas comuns | 10 |

---

## ✅ Checklist de Onboarding

Novo no projeto? Siga isto:

```
[ ] Ler [[Arquitetura]] (30 min)
[ ] Fazer [[Setup-Instalacao]] (60 min)
[ ] Explorar Backend em [[Backend]] (45 min)
[ ] Explorar Frontend em [[Frontend]] (45 min)
[ ] Executar teste end-to-end simples
[ ] Ler [[Guia-Contribuicao]] (30 min)
[ ] Estar pronto para contribuir! ✨

Total: ~3-4 horas de onboarding
```

---

## 🔗 Conexões Documentadas

```
[[Setup-Instalacao]] ←→ [[Arquitetura]]
                   ←→ [[Problemas-Solucoes]]

[[Arquitetura]] ←→ [[Database]]
             ←→ [[Backend]]
             ←→ [[Frontend]]
             ←→ [[Python-Engine]]

[[Backend]] ←→ [[Database]]
          ←→ [[Python-Engine]]
          ←→ [[Guia-Contribuicao]]

[[Frontend]] ←→ [[Backend]]
           ←→ [[Guia-Contribuicao]]

[[Python-Engine]] ←→ [[Database]]
                ←→ [[Backend]]
                ←→ [[Roadmap]]

[[Problemas-Solucoes]] ←→ [[Setup-Instalacao]]
                      ←→ [[Database]]
                      ←→ [[Backend]]

[[Roadmap]] ←→ [[Arquitetura]]
          ←→ [[Python-Engine]]

[[Guia-Contribuicao]] ←→ [[Backend]]
                    ←→ [[Frontend]]
                    ←→ [[Python-Engine]]
```

---

## 🎯 Quick Links por Role

### 👨‍💼 Product Manager
- [[Arquitetura]] - Entender sistema
- [[Roadmap]] - Ver plano
- [[Problemas-Solucoes]] - Status de issues

### 🛠️ Backend Developer
- [[Setup-Instalacao]] - Setup
- [[Backend]] - Desenvolver API
- [[Database]] - Entender dados
- [[Python-Engine]] - Integração
- [[Guia-Contribuicao]] - Padrões

### 🎨 Frontend Developer
- [[Setup-Instalacao]] - Setup
- [[Frontend]] - Desenvolver UI
- [[Backend]] - Entender API
- [[Guia-Contribuicao]] - Padrões

### 🔬 Data Scientist (futuro)
- [[Python-Engine]] - Entender cálculos
- [[Database]] - Explorar dados
- [[Roadmap]] - Planos ML

### 🚀 DevOps/Infrastructure (futuro)
- [[Setup-Instalacao]] - Deploy
- [[Arquitetura]] - Arch
- [[Roadmap]] - Docker/K8s plans

---

## 📝 Como Manter Atualizado

**Atualizar documentação quando**:
- ✅ Novo endpoint é adicionado
- ✅ Schema do banco muda
- ✅ Novo componente é criado
- ✅ Bug comum é descoberto
- ✅ Processo muda

**NÃO é necessário**:
- ❌ Typos em logs
- ❌ Mudanças internas sem efeito externo
- ❌ Refactoring puro (sem mudança de API)

---

## 🤝 Contribuir à Base de Conhecimento

**Como adicionar informação**:
1. Editar documento relevante
2. Adicionar seção com detalhes
3. Atualizar índice se for novo documento
4. Criar link bidireccional

**Qualidade esperada**:
- Claro e conciso
- Exemplos práticos
- Links para documentos relacionados
- Estrutura com headings
- Código formatado

---

## 📞 Contato Rápido

**Dúvida sobre**:
- **Setup**: Ver [[Setup-Instalacao]] primeiro, depois [[Problemas-Solucoes]]
- **Código**: Ver documento do componente (Backend/Frontend/Python)
- **Bugs**: Abrir issue com detalhes
- **Features**: Abrir discussion ou issue

---

## 🎓 Recursos Externos

Complementar à documentação:

**PostgreSQL**:
- https://www.postgresql.org/docs/ (oficial)
- https://www.postgresql.org/docs/15/ (v15 docs)

**Node.js/Express**:
- https://expressjs.com/ (oficial)
- https://nodejs.org/docs/ (Node docs)

**React**:
- https://react.dev (nova documentação)
- https://zustand-demo.vercel.app (Zustand)

**Python/FastAPI**:
- https://fastapi.tiangolo.com/ (oficial)
- https://docs.python.org/ (Python)

**SQL**:
- https://sqlzoo.net/ (interativo)
- https://www.sql-tutorial.com/ (tutorial)

---

## 📈 Evolução da Base

```
v1.0 (Atual)
├─ 9 documentos
├─ Setup, Arquitetura, Database
├─ Backend, Frontend, Python
├─ Problemas, Roadmap, Guia
└─ Índice

v2.0 (Planejado)
├─ Mobile app docs
├─ ML/IA docs
├─ Deployment docs
├─ API Reference (auto-gerada)
└─ Video tutorials

v3.0 (Futuro)
├─ Interactive playground
├─ API testing interface
├─ Search full-text
└─ Community contributions
```

---

## ✨ Dica Final

**Para aprender MindGuard rapidamente**:

1. Comece por [[Arquitetura]] (30 min)
2. Depois [[Setup-Instalacao]] (1 hora)
3. Escolha uma área: [[Backend]], [[Frontend]] ou [[Python-Engine]]
4. Mergulhe nos detalhes daquela área (2 horas)
5. Quando preso, consulte [[Problemas-Solucoes]]
6. Pronto para contribuir? Leia [[Guia-Contribuicao]]

**Tempo total para proficiência**: 1-2 semanas de estudo dedicado

---

Última atualização: 2026-05-14
Próxima revisão: após deploy (Fase 2)
Responsável: Roberto Flaquer

[[Arquitetura]] [[Setup-Instalacao]] [[Roadmap]] [[Checklist]]
