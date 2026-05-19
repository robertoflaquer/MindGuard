# Database - PostgreSQL Schema

## Estrutura Geral

28+ tabelas em 5 categorias principais

---

## 1. Autenticação & Usuários

### users
```sql
id (UUID) - PK
email - UNIQUE
password_hash
full_name
date_of_birth
gender
careplus_member_id - FK para operadora
careplus_plan_type
baseline_status - 'collecting', 'ready', 'active'
timezone - 'America/Sao_Paulo'
created_at, updated_at
last_login
is_active
```

---

## 2. Sinais (Dados Fisiológicos)

### signal_types
Referência de tipos de sinais disponíveis

```
HRV (Heart Rate Variability) - ms
HR_resting (Frequência Cardíaca) - bpm
sleep_duration - horas
sleep_quality - score 0-100
stress_level - 1-10 (auto-report)
energy_level - 1-10 (auto-report)
mood - 1-10 (auto-report)
steps - count
```

### data_sources
Rastreia de onde vêm os sinais

```sql
user_id - FK
source_type - 'apple_health', 'google_fit', 'fitbit', 'manual'
source_identifier - device ID
is_primary
connected_at
last_sync
is_active
```

### user_signals
Sinais brutos do usuário

```sql
user_id, signal_type_id (FK)
value - número do sinal
timestamp - quando foi coletado
source_id (FK) - qual dispositivo
is_outlier - marcado como erro?
confidence_score - 0-1
processed - já foi analisado?
created_at
```

---

## 3. Baselines (Padrão Individual)

### baselines
Padrão normal de cada usuário para cada sinal

```sql
user_id, signal_type_id (FK)
baseline_value - a mediana normal
baseline_std_dev - desvio padrão
rolling_7d_value - média dos últimos 7 dias
rolling_14d_value - média dos últimos 14 dias
rolling_30d_value - média dos últimos 30 dias
calculation_method - 'median'
sample_size - quantas amostras usou
data_quality_score - 0-1 (qualidade dos dados)
period_start, period_end - período calculado
is_current - TRUE para o baseline ativo
next_update_date
updated_at
```

---

## 4. Análises (Desvios & Tendências)

### deviations
Quando um sinal desvia do baseline

```sql
user_id, signal_type_id, baseline_id (FK)
current_value - valor atual
baseline_value - valor esperado
absolute_change - diferença em unidade
percent_change - % de diferença
is_significant - TRUE se > 15%
direction - 'up', 'down', 'stable'
detection_date
adjusted_for_context - levou contexto em conta?
context_ids - quais contextos ajustaram
```

### trends
Padrões temporais detectados

```sql
user_id, signal_type_id (FK)
trend_type - 'short_term' (3d), 'medium_term' (7d), 'long_term' (14d)
direction - 'improving', 'declining', 'stable'
slope - taxa de mudança
confidence - 0-1
start_date, end_date
r_squared - qualidade do fit
data_points - quantos pontos usou
```

---

## 5. Questionários (Avaliação Psicológica)

### questionnaire_types
Tipos de questionários disponíveis

```
DAILY_CHECKIN - 3 perguntas, todos os dias
PSS (Perceived Stress Scale) - 10 perguntas, semanal
CBI (Copenhagen Burnout) - 19 perguntas, bi-semanal
OLBI (Oldenburg Burnout) - 16 perguntas, bi-semanal
GAD7 (Anxiety) - 7 perguntas, conforme necessário
```

### questionnaire_responses
Respostas do usuário aos questionários

```sql
user_id, questionnaire_type_id (FK)
responses - JSON {q1: 5, q2: 3, ...}
total_score - score final
started_at, completed_at
duration_seconds
context_notes - anotações do usuário
is_valid - resposta válida?
created_at
```

---

## 6. Contextos (Eventos da Vida)

### context_types
Tipos de contextos que afetam interpretação

```
illness_minor - resfriado, gripe
illness_major - doença séria
medical_leave - atestado médico
vacation - férias
intense_exercise - treinamento pesado
life_event_positive - casamento, promoção
life_event_negative - morte, separação
work_deadline - deadline do trabalho
travel - viagem, jet lag
menstruation - ciclo menstrual
```

### user_contexts
Contextos ativo do usuário

```sql
user_id, context_type_id (FK)
start_date, end_date
severity - 'mild', 'moderate', 'severe'
notes - detalhes do contexto
weight_adjustment - JSON {HRV: 0.5} - ajusta interpretação
is_active
created_at, updated_at
```

---

## 7. Avaliação de Risco (Output Principal)

### risk_levels
Classificações de risco

```
stable - tudo normal
attention - alguns desvios
elevated_risk - risco moderado
high_risk - risco elevado
```

### risk_assessments
**TABELA MAIS IMPORTANTE** - Resultado final do sistema

```sql
user_id, risk_level_id (FK)
assessment_date, assessment_timestamp
risk_score - 0-100
confidence_level - 0-1
contributing_signals - JSON detalhe de cada sinal
signal_convergence_count - quantos sinais concordam
trend_contribution - JSON tendências
persistence_days - há quantos dias dura
active_contexts - JSON contextos aplicáveis
context_adjusted - foi ajustado por contexto?
primary_explanation - explicação em português
secondary_factors - lista de fatores secundários
recommended_action_id (FK)
requires_professional_review - TRUE se high risk
escalation_triggered - TRUE se alertar CarePlus
created_at
```

---

## 8. Ações Recomendadas

### action_types
Ações que o sistema recomenda

```
breathing_exercise - exercício respiratório
meditation_short - meditação curta
walk_nature - caminhada na natureza
sleep_hygiene - melhorar sono
exercise_light - exercício leve
journaling - escrita terapêutica
social_connection - contato social
specialist_psychologist - encaminhar psicólogo
specialist_psychiatrist - encaminhar psiquiatra
wellness_coach - coach de bem-estar
emergency_support - suporte de emergência (188)
```

### user_actions
Rastreamento de ações do usuário

```sql
user_id, risk_assessment_id, action_type_id (FK)
recommended_at
started_at, completed_at
user_rating - 1-5 (útil?)
user_notes
was_helpful
status - 'pending', 'started', 'completed', 'skipped'
```

---

## 9. Integração CarePlus

### careplus_referrals
Encaminhamentos para a operadora de saúde

```sql
user_id, risk_assessment_id (FK)
referral_type - tipo de profissional
priority - 'routine', 'urgent', 'emergency'
status - 'pending', 'scheduled', 'completed'
careplus_referral_id - ID no sistema CarePlus
careplus_response - JSON resposta da CarePlus
scheduled_date, completed_date
created_at, updated_at
```

---

## 10. Sistema

### notifications
Notificações para o usuário

```sql
user_id (FK)
type - 'risk_alert', 'action_reminder', 'baseline_ready'
title, message
priority - 'low', 'normal', 'high', 'urgent'
sent_at, read_at, dismissed_at
channels - JSON {push: true, email: false}
related_entity_type, related_entity_id
created_at
```

### processing_logs
Log de cada processamento executado

```sql
user_id, process_type - 'baseline_calculation', 'risk_assessment'
status - 'success', 'failed', 'partial'
started_at, completed_at, duration_ms
input_data, output_data - JSON
error_message - se falhou
created_at
```

---

## Índices Principais

```sql
-- Queries frequentes
idx_user_signals_user_time - (user_id, timestamp)
idx_baselines_user_current - (user_id) WHERE is_current
idx_risk_assessments_user_date - (user_id, assessment_date)
idx_questionnaire_responses_user - (user_id, completed_at)
idx_user_contexts_active - (user_id, is_active)
```

---

## Views Úteis

### user_current_state
Estado atual do usuário (risco, nome, baseline_status)

### user_active_contexts
Contextos ativos agora

### user_latest_signals
Último sinal de cada tipo para cada usuário

---

## Relacionamentos Principais

```
users
  ├─ user_signals (1:N)
  ├─ baselines (1:N)
  ├─ risk_assessments (1:N)
  ├─ questionnaire_responses (1:N)
  ├─ user_contexts (1:N)
  ├─ user_actions (1:N)
  └─ notifications (1:N)

signal_types ─ user_signals (1:N)
baselines ─ deviations (1:N)
risk_assessments ─ user_actions (1:N)
action_types ─ user_actions (1:N)
```

---

## Query Importantes

### Último risco do usuário
```sql
SELECT * FROM risk_assessments
WHERE user_id = '{id}'
ORDER BY assessment_date DESC LIMIT 1
```

### Baseline atual
```sql
SELECT * FROM baselines
WHERE user_id = '{id}' AND is_current = TRUE
```

### Sinais recentes (24h)
```sql
SELECT st.name, us.value
FROM user_signals us
JOIN signal_types st ON us.signal_type_id = st.id
WHERE us.user_id = '{id}'
  AND us.timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY us.timestamp DESC
```

### Contextos ativos
```sql
SELECT ct.name, uc.severity
FROM user_contexts uc
JOIN context_types ct ON uc.context_type_id = ct.id
WHERE uc.user_id = '{id}' AND uc.is_active = TRUE
```

---

## 5. Teleconsulta & Prescrição

> Migration: `node src/database/migrate_appointments.js`

### specialists
Tabela de referência — seed data com 3 especialistas

```sql
id (SERIAL) - PK
name              — "Dra. Ana Lima"
specialty         — "Psiquiatra"
crm_crp           — "CRM/SP 123456"
avatar_initials   — "AL"
color_hex         — "#818CF8"
is_active         — BOOLEAN DEFAULT TRUE
```

### appointments

```sql
id (UUID) - PK
user_id           — FK users(id)
specialist_id     — FK specialists(id)
scheduled_date    — DATE
scheduled_time    — TIME
duration_minutes  — INTEGER DEFAULT 45
status            — 'confirmed' | 'cancelled' | 'completed'
observations      — TEXT
risk_snapshot     — JSONB  (risco do paciente no momento do agendamento)
meeting_url       — VARCHAR(500)
created_at, updated_at
```

Índices: `idx_appointments_user_id`, `idx_appointments_date`

### prescriptions

```sql
id (UUID) - PK
appointment_id    — FK appointments(id) ON DELETE SET NULL
user_id           — FK users(id)
specialist_id     — FK specialists(id)
items             — JSONB  [{medication, dosage, frequency, instructions}]
observations      — TEXT
audit_hash        — VARCHAR(64)  SHA-256 para imutabilidade
issued_at         — TIMESTAMP DEFAULT NOW()
created_at
```

Índices: `idx_prescriptions_user_id`, `idx_prescriptions_appointment_id`

---

## Query Importantes — Teleconsulta

### Agendamentos futuros do usuário
```sql
SELECT a.*, s.name AS specialist_name, s.specialty
FROM appointments a
JOIN specialists s ON a.specialist_id = s.id
WHERE a.user_id = '{id}'
  AND a.scheduled_date >= CURRENT_DATE
  AND a.status != 'cancelled'
ORDER BY a.scheduled_date, a.scheduled_time
```

### Verificar conflito de horário
```sql
SELECT id FROM appointments
WHERE specialist_id = $1
  AND scheduled_date = $2
  AND scheduled_time = $3
  AND status != 'cancelled'
```

### Prescrições do usuário com dados do especialista
```sql
SELECT p.*, s.name AS specialist_name, s.crm_crp,
       a.scheduled_date, a.scheduled_time
FROM prescriptions p
JOIN specialists s ON p.specialist_id = s.id
LEFT JOIN appointments a ON p.appointment_id = a.id
WHERE p.user_id = '{id}'
ORDER BY p.issued_at DESC
```

[[Backend]]
[[Arquitetura]]
[[Setup-Instalacao]]
