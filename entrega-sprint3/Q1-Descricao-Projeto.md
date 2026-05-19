# Questão 1 – Descrição do Projeto
**BluaDiagnostics: Check-up Digital e Prescrição Inteligente**
**Disciplina: PCP – Pensamento Computacional e Automação com Python**
**Prof. Allan Roberto Molto · 1º Ano Ciência da Computação – 2º Semestre – Sprint 3**

---

## Nome do Projeto

**MindGuard** — Plataforma de monitoramento preventivo de saúde mental integrada ao ecossistema **Blua/CarePlus**, focada em diagnóstico preliminar contínuo e prescrição remota automatizada.

---

## Visão Geral

O MindGuard é uma solução digital de saúde que transforma o Blua em uma plataforma de cuidado remoto **proativo**. Em vez de esperar o paciente buscar ajuda em momento de crise, o sistema monitora continuamente seus sinais fisiológicos e psicológicos, detecta desvios do seu padrão individual e entrega uma avaliação de risco personalizada — antes que a situação se agrave.

A plataforma atende aos três componentes desejados pela Care Plus:
- ✅ **Check-up digital** (questionários validados + sinais fisiológicos + contextos de vida)
- ✅ **Integração com wearables** (Apple Watch via HealthKit, Galaxy Watch via Android Health Connect)
- ✅ **Prescrição remota** pós-teleconsulta (interface integrada ao histórico clínico do paciente)

---

## 1. Dados de Entrada — O que o sistema recebe?

### 1.1 Sinais Fisiológicos via Wearables

O sistema integra automaticamente com os dois wearables mais populares do mercado brasileiro:

| Sinal | Descrição | Apple Watch | Galaxy Watch |
|---|---|---|---|
| **HRV** (ms) | Variabilidade da frequência cardíaca — principal indicador de estresse fisiológico | ✅ HealthKit | ✅ Health Connect |
| **FC em repouso** (bpm) | Frequência cardíaca ao acordar — eleva com estresse crônico | ✅ | ✅ |
| **Duração do sono** (horas) | Total de horas dormidas — sono curto precede burnout | ✅ | ✅ |
| **Qualidade do sono** (score) | Eficiência e fases do sono | ✅ | ✅ |
| **Nível de estresse** (score) | Estresse detectado no relógio | ✅ (Series 6+) | ✅ |
| **Humor** (score) | Humor percebído pelo usuário | ✅ | ✅ |
| **Passos** (contagem) | Atividade física diária | ✅ | ✅ |

**Como os dados chegam ao sistema:**
- **Apple Watch → iPhone (HealthKit) → App iOS (MindGuard) → Backend** via sincronização automática matinal usando `HKObserverQuery` com Background Delivery habilitado
- **Galaxy Watch → Samsung Health → Android Health Connect → App Android → Backend** via `WorkManager` agendado para 7h da manhã

Enquanto o app mobile nativo está em desenvolvimento, o MindGuard já aceita **entrada manual de sinais** pela interface web — garantindo funcionamento completo para demonstração.

### 1.2 Check-up Digital com Questionários Validados (IA de Perguntas)

O componente de check-up digital é implementado com **5 instrumentos psicométricos** validados cientificamente, em português:

| Questionário | O que mede | Perguntas | Escala | Frequência |
|---|---|---|---|---|
| **PSS-10** (Perceived Stress Scale) | Estresse percebido geral | 10 | 0–4 (Nunca a Sempre) | Quinzenal |
| **CBI** (Copenhagen Burnout Inventory) | Burnout em 3 dimensões: pessoal, trabalho e relações | 19 | 0–100 | Mensal |
| **OLBI** (Oldenburg Burnout Inventory) | Exaustão emocional + desengajamento profissional | 16 | 1–4 | Mensal |
| **GAD-7** (Generalized Anxiety Disorder Scale) | Transtorno de ansiedade generalizada | 7 | 0–3 (Nunca a Quase sempre) | Mensal |
| **Check-in Diário** | Auto-avaliação rápida: humor, energia e estresse | 3 | 0–10 | Diária |

O sistema informa ao usuário quando cada questionário está pendente, calcula automaticamente os scores (incluindo reversão de itens) e apresenta o resultado com interpretação visual imediata. O GAD-7 apresenta 5 níveis semânticos: Mínimo (0–4), Leve (5–9), Moderado (10–14), Moderado-Grave (15–18) e Grave (19–21).

### 1.3 Contextos de Vida

O paciente registra situações pessoais que contextualizam os dados fisiológicos:

- **Tipos de contexto**: saúde física, eventos de vida (luto, divórcio), pressão de trabalho, esgotamento físico, situação personalizada
- **Intensidade**: leve / moderado / grave
- **Período**: data de início e fim
- **Notas livres**: até 1.000 caracteres descrevendo a situação em detalhes

Esses contextos ajustam o cálculo de risco — por exemplo, um período de doença física explica uma queda no HRV sem que isso represente risco de burnout.

---

## 2. Análise dos Dados — Como o sistema processa?

O processamento é feito por um **Python Engine (FastAPI)** com 4 serviços especializados que trabalham em sequência:

### 2.1 Baseline Individual — BaselineCalculator

Cada usuário tem seu próprio padrão de referência, calculado a partir dos últimos 7–14 dias de dados:

```
Mediana dos sinais → Remove outliers (método IQR) → Salva como baseline
```

**Por que isso importa?** Um HRV de 45ms pode ser normal para uma pessoa e crítico para outra. O sistema aprende o padrão do usuário antes de avaliar risco — eliminando falsos positivos.

Para usuários novos sem histórico, o sistema usa **thresholds populacionais** como fallback (ex: estresse ≥ 6/10, sono ≤ 5h são preocupantes para a maioria das pessoas).

### 2.2 Detecção de Desvio — DeviationAnalyzer

```
Novo sinal → Comparação com baseline → % de desvio calculado
```

- Desvio > 15% é marcado como **significativo**
- A direção importa: HRV caindo é ruim; qualidade do sono melhorando é positivo
- Sinais bons **não** são relatados como fatores de risco (bug corrigido)

### 2.3 Correlação de Sinais — CorrelationEngine

Quanto mais sinais desviam na mesma direção negativa, maior a evidência de risco:

```
HRV ↓ + Sono ↓ + Estresse ↑ + Humor ↓ → Alta convergência → Score ampliado
```

Isso evita alarmes falsos por variações isoladas — resfriado pode baixar HRV sem significar burnout.

### 2.4 Score de Risco Final — RiskScorer

O score final combina **questionários (70%)** e **sinais fisiológicos (30%)**:

```
Score = (PSS × 38% + CBI × 22% + OLBI × 17% + GAD-7 × 13% + Check-in × 10%) × 0.70
      + (Convergência de sinais fisiológicos) × 0.30
      + Ajuste por contextos de vida ativos
```

**Pesos dos questionários dentro dos 70%:**

| Instrumento | Peso | Por quê |
|---|---|---|
| PSS-10 | 38% | Principal preditor de risco mental clínico |
| CBI | 22% | Burnout laboral — critério direto de afastamento |
| OLBI | 17% | Complementa CBI com perspectiva de desengajamento |
| GAD-7 | 13% | Rastreio clínico de ansiedade — complementa estresse |
| Check-in Diário | 10% | Indicador de tendência de curto prazo |

**Force thresholds**: scores extremos em qualquer questionário (PSS ≥ 33, CBI ≥ 58, OLBI ≥ 54, GAD-7 ≥ 15) elevam automaticamente o nível para `high_risk`, independente dos outros indicadores — para garantir segurança clínica.

---

## 3. Saída dos Dados — O que o paciente recebe?

### 3.1 Status de Risco Visual

O resultado principal é apresentado em um **gauge circular** (0–100%) com 4 níveis semânticos:

| Nível | Score | Cor | Significado |
|---|---|---|---|
| **Estável** | 0–35% | Verde | Sinais dentro do padrão normal |
| **Atenção** | 36–55% | Amarelo | Pequenos desvios, acompanhar |
| **Risco Elevado** | 56–75% | Laranja | Múltiplos desvios convergentes |
| **Risco Alto** | 76–100% | Vermelho | Intervenção profissional recomendada |

### 3.2 Explicação em Linguagem Natural

O sistema gera automaticamente em português:

- **Causa principal**: "Questionários de burnout indicam esgotamento elevado" ou "Variabilidade cardíaca 28% abaixo do seu padrão"
- **Fatores listados**: cada sinal desviante é descrito com contexto humano ("CBI 35/100 — burnout moderado")
- **Confiança da análise**: % de dados disponíveis usados no cálculo

### 3.3 Ação Recomendada

Baseada no nível de risco, o sistema sugere uma ação específica com tempo estimado:

- "Exercício de Respiração 4-7-8 · 5 min" (Estável)
- "Pausa ativa de 10 minutos a cada hora de trabalho" (Atenção)
- "Considere conversar com um profissional de saúde mental" (Risco Elevado)
- "Recomendamos consulta com psiquiatra ou psicólogo esta semana" (Risco Alto)

### 3.4 Agendamento de Teleconsulta ✅

O usuário agenda diretamente pelo app uma **videochamada de 45 minutos** com:

- **Dra. Ana Lima** — Psiquiatra (CRM/SP)
- **Dr. Carlos Mendes** — Psicólogo Clínico (CRP/SP)
- **Dra. Fernanda Costa** — Terapeuta TCC (CRP/SP)

O fluxo inclui: seleção do especialista → calendário de 7 dias → grade de horários → campo de observação → confirmação com detalhes da consulta.

O **backend valida conflitos de horário em tempo real**: caso o horário já esteja ocupado para aquele especialista, o sistema retorna erro 409 e impede o duplo agendamento. Os endpoints `GET /api/appointments/specialists`, `GET /api/appointments/slots`, `POST /api/appointments`, `GET /api/appointments` e `PATCH /api/appointments/:id/cancel` estão implementados e integrados ao frontend via `useAppointmentStore`.

### 3.5 Prescrição Digital Pós-Teleconsulta ✅ (Backend + Interface implementados)

Após a teleconsulta, o paciente acessa a página `/prescriptions` que exibe **todas as prescrições emitidas**, com:

- **Lista de itens**: medicamento, dosagem, frequência e instruções de uso
- **Observações do especialista**: texto livre do médico
- **Hash de auditoria SHA-256**: identificador imutável que garante que a prescrição não foi alterada após emissão — qualquer alteração invalida o hash

```
┌─────────────────────────────────────────────────────────────────────┐
│  PRESCRIÇÕES                                            + Nova      │
│─────────────────────────────────────────────────────────────────────│
│  Dr. Carlos Mendes · Psicólogo Clínico                              │
│  Emitida em 14/05/2026 · Consulta #12                               │
│  ▼ Ver itens                                                        │
│    💊 Sertralina 50mg — 1× ao dia, pela manhã — Tomar com água      │
│    💊 Melatonina 5mg — 1× ao dia, 30 min antes de dormir            │
│  Obs: Manter acompanhamento quinzenal. Evitar cafeína após 14h.     │
│  🔒 a3f2e1d4b9c87a... (SHA-256 auditoria)                           │
└─────────────────────────────────────────────────────────────────────┘
```

O backend implementa os endpoints `POST /api/prescriptions`, `GET /api/prescriptions` e `GET /api/prescriptions/:id`. O hash SHA-256 é calculado automaticamente no momento da criação, sobre o conteúdo completo da prescrição, e armazenado no banco de dados.

**Próximo passo planejado**: geração de PDF com assinatura digital via PDFKit.

### 3.6 Simulação de Wearable ✅

Para demonstração completa sem hardware físico, o sistema implementa o endpoint `POST /api/signals/simulate` que gera **7 sinais fisiológicos com valores realistas** em um único clique:

| Sinal | Faixa simulada | Dispositivo |
|---|---|---|
| HRV | 35–80 ms | Apple Watch / Galaxy Watch |
| Frequência cardíaca em repouso | 55–90 bpm | Apple Watch / Galaxy Watch |
| Duração do sono | 5–9 horas | Apple Watch / Galaxy Watch |
| Qualidade do sono | 40–95 score | Apple Watch / Galaxy Watch |
| Nível de estresse | 1–10 | Apple Watch / Galaxy Watch |
| Humor | 1–10 | Apple Watch / Galaxy Watch |
| Passos | 3.000–12.000 | Apple Watch / Galaxy Watch |

O botão **"Simular Wearable"** aparece na aba "Registrar Sinais" do Dashboard com um seletor de dispositivo. Após a simulação, o backend dispara automaticamente o cálculo de baseline e risco — exatamente como faria com dados reais de wearable.

---

### 3.7 Benefícios ao Paciente

| Benefício | Como o MindGuard entrega |
|---|---|
| **Diagnóstico precoce** | Detecta tendências antes de crise com baseline individual por usuário |
| **Sem consulta para triagem inicial** | Check-up automático via wearables + 5 questionários validados (PSS, CBI, OLBI, GAD-7, Check-in) |
| **Rastreio de ansiedade** | GAD-7 detecta transtorno de ansiedade generalizada, além de burnout e estresse |
| **Continuidade do cuidado** | Histórico completo (sinais + questionários + contextos) acessível na teleconsulta |
| **Agendamento sem atrito** | Fluxo completo de teleconsulta no próprio app, com conflito de horário validado |
| **Prescrição segura e rastreável** | Hash SHA-256 garante imutabilidade; PDF com assinatura em desenvolvimento |
| **Acesso remoto** | Web app funcionando + futuro app mobile (iOS e Android) |
| **Personalização** | Baseline individual — não compara com médias populacionais |
| **Contexto clínico rico** | Médico vê sinais fisiológicos + psicométricos + contextos de vida juntos |
| **Demo sem hardware** | Botão "Simular Wearable" gera dados realistas de Apple Watch ou Galaxy Watch |

---

## Stack Tecnológica

| Camada | Tecnologia | Função |
|---|---|---|
| Frontend | React + Vite + Tailwind CSS | Interface web responsiva com dark/light mode |
| Backend | Node.js + Express | API REST, autenticação JWT, orquestração |
| IA / Engine | Python + FastAPI | Cálculo de baseline, desvio, correlação e risco |
| Banco de dados | PostgreSQL 15 | Persistência de todos os dados clínicos |
| Wearables (futuro) | HealthKit (iOS) + Health Connect (Android) | Coleta automática de sinais fisiológicos |
| Mobile (futuro) | React Native ou Swift/Kotlin | Apps iOS e Android |
| Deploy | Docker + Railway.app | Infraestrutura em nuvem com HTTPS |

---
