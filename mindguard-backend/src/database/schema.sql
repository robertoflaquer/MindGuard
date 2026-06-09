-- MindGuard - Schema Completo
-- Executar: node src/database/migrate.js

-- ============================================
-- EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABELAS DE REFERÊNCIA (sem FK externas)
-- ============================================

CREATE TABLE IF NOT EXISTS signal_types (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) UNIQUE NOT NULL,
    category    VARCHAR(50),
    unit        VARCHAR(50),
    min_value   NUMERIC,
    max_value   NUMERIC,
    description TEXT,
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS risk_levels (
    id             SERIAL PRIMARY KEY,
    code           VARCHAR(50) UNIQUE NOT NULL,
    name           VARCHAR(100),
    severity_order INTEGER,
    color_code     VARCHAR(20),
    description    TEXT
);

CREATE TABLE IF NOT EXISTS action_types (
    id               SERIAL PRIMARY KEY,
    code             VARCHAR(100) UNIQUE NOT NULL,
    name             VARCHAR(255),
    description      TEXT,
    instructions     TEXT,
    duration_minutes INTEGER,
    is_active        BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS questionnaire_types (
    id                   SERIAL PRIMARY KEY,
    code                 VARCHAR(50) UNIQUE NOT NULL,
    name                 VARCHAR(255),
    description          TEXT,
    frequency_days       INTEGER,
    question_count       INTEGER,
    max_score            INTEGER,
    interpretation_ranges JSONB,
    is_active            BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS context_types (
    id                       SERIAL PRIMARY KEY,
    code                     VARCHAR(100) UNIQUE NOT NULL,
    name                     VARCHAR(255),
    category                 VARCHAR(100),
    impact_description       TEXT,
    default_weight_adjustment JSONB,
    is_active                BOOLEAN DEFAULT TRUE
);

-- ============================================
-- USUÁRIOS
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email              VARCHAR(255) UNIQUE NOT NULL,
    password_hash      VARCHAR(255) NOT NULL,
    full_name          VARCHAR(255),
    date_of_birth      DATE,
    gender             VARCHAR(50),
    careplus_member_id VARCHAR(100),
    careplus_plan_type VARCHAR(100),
    baseline_status    VARCHAR(50) DEFAULT 'collecting',
    timezone           VARCHAR(100) DEFAULT 'America/Sao_Paulo',
    is_active          BOOLEAN DEFAULT TRUE,
    last_login         TIMESTAMP,
    created_at         TIMESTAMP DEFAULT NOW(),
    updated_at         TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- SINAIS
-- ============================================

CREATE TABLE IF NOT EXISTS data_sources (
    id                VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_type       VARCHAR(50),
    source_identifier VARCHAR(255),
    is_primary        BOOLEAN DEFAULT FALSE,
    connected_at      TIMESTAMP DEFAULT NOW(),
    last_sync         TIMESTAMP,
    is_active         BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS user_signals (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    signal_type_id   INTEGER NOT NULL REFERENCES signal_types(id),
    value            NUMERIC NOT NULL,
    timestamp        TIMESTAMPTZ NOT NULL,
    source_metadata  JSONB,
    confidence_score NUMERIC DEFAULT 1.0,
    is_outlier       BOOLEAN DEFAULT FALSE,
    processed        BOOLEAN DEFAULT FALSE,
    created_at       TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- BASELINES
-- ============================================

CREATE TABLE IF NOT EXISTS baselines (
    id                  SERIAL PRIMARY KEY,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    signal_type_id      INTEGER NOT NULL REFERENCES signal_types(id),
    baseline_value      NUMERIC,
    baseline_std_dev    NUMERIC,
    rolling_7d_value    NUMERIC,
    rolling_14d_value   NUMERIC,
    rolling_30d_value   NUMERIC,
    calculation_method  VARCHAR(50) DEFAULT 'median',
    sample_size         INTEGER,
    data_quality_score  NUMERIC,
    period_start        DATE,
    period_end          DATE,
    is_current          BOOLEAN DEFAULT TRUE,
    next_update_date    DATE,
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- DESVIOS
-- ============================================

CREATE TABLE IF NOT EXISTS deviations (
    id                     SERIAL PRIMARY KEY,
    user_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    signal_type_id         INTEGER NOT NULL REFERENCES signal_types(id),
    baseline_id            INTEGER REFERENCES baselines(id),
    current_value          NUMERIC,
    baseline_value         NUMERIC,
    absolute_change        NUMERIC,
    percent_change         NUMERIC,
    is_significant         BOOLEAN DEFAULT FALSE,
    significance_threshold NUMERIC,
    direction              VARCHAR(20),
    detection_date         DATE DEFAULT CURRENT_DATE,
    detection_timestamp    TIMESTAMP DEFAULT NOW(),
    adjusted_for_context   BOOLEAN DEFAULT FALSE,
    context_ids            JSONB
);

CREATE TABLE IF NOT EXISTS trends (
    id             SERIAL PRIMARY KEY,
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    signal_type_id INTEGER NOT NULL REFERENCES signal_types(id),
    trend_type     VARCHAR(50),
    direction      VARCHAR(50),
    slope          NUMERIC,
    confidence     NUMERIC,
    start_date     DATE,
    end_date       DATE,
    r_squared      NUMERIC,
    data_points    INTEGER,
    created_at     TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- QUESTIONÁRIOS
-- ============================================

CREATE TABLE IF NOT EXISTS questionnaire_responses (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    questionnaire_type_id INTEGER NOT NULL REFERENCES questionnaire_types(id),
    responses             JSONB,
    total_score           NUMERIC,
    started_at            TIMESTAMP,
    completed_at          TIMESTAMP,
    duration_seconds      INTEGER,
    context_notes         TEXT,
    is_valid              BOOLEAN DEFAULT TRUE,
    created_at            TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CONTEXTOS
-- ============================================

CREATE TABLE IF NOT EXISTS user_contexts (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    context_type_id  INTEGER NOT NULL REFERENCES context_types(id),
    start_date       DATE NOT NULL,
    end_date         DATE,
    severity         VARCHAR(50),
    notes            TEXT,
    is_active        BOOLEAN DEFAULT TRUE,
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- RISCO
-- ============================================

CREATE TABLE IF NOT EXISTS risk_assessments (
    id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    risk_level_id              INTEGER NOT NULL REFERENCES risk_levels(id),
    assessment_date            DATE DEFAULT CURRENT_DATE,
    assessment_timestamp       TIMESTAMP DEFAULT NOW(),
    risk_score                 NUMERIC,
    confidence_level           NUMERIC,
    contributing_signals       JSONB,
    signal_convergence_count   INTEGER,
    primary_explanation        TEXT,
    secondary_factors          JSONB,
    recommended_action_id      INTEGER REFERENCES action_types(id),
    requires_professional_review BOOLEAN DEFAULT FALSE,
    escalation_triggered       BOOLEAN DEFAULT FALSE,
    persistence_days           INTEGER,
    created_at                 TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- AÇÕES DO USUÁRIO
-- ============================================

CREATE TABLE IF NOT EXISTS user_actions (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    risk_assessment_id UUID REFERENCES risk_assessments(id),
    action_type_id     INTEGER NOT NULL REFERENCES action_types(id),
    recommended_at     TIMESTAMP DEFAULT NOW(),
    started_at         TIMESTAMP,
    completed_at       TIMESTAMP,
    user_rating        INTEGER,
    user_notes         TEXT,
    was_helpful        BOOLEAN,
    status             VARCHAR(50) DEFAULT 'pending'
);

-- ============================================
-- CAREPLUS
-- ============================================

CREATE TABLE IF NOT EXISTS careplus_referrals (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    risk_assessment_id   UUID REFERENCES risk_assessments(id),
    referral_type        VARCHAR(100),
    priority             VARCHAR(50) DEFAULT 'routine',
    status               VARCHAR(50) DEFAULT 'pending',
    careplus_referral_id VARCHAR(255),
    careplus_response    JSONB,
    scheduled_date       DATE,
    completed_date       DATE,
    created_at           TIMESTAMP DEFAULT NOW(),
    updated_at           TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- SISTEMA
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type                VARCHAR(100),
    title               VARCHAR(255),
    message             TEXT,
    priority            VARCHAR(50) DEFAULT 'normal',
    sent_at             TIMESTAMP,
    read_at             TIMESTAMP,
    dismissed_at        TIMESTAMP,
    channels            JSONB DEFAULT '{"push": true, "email": false}',
    related_entity_type VARCHAR(100),
    related_entity_id   VARCHAR(255),
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS processing_logs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
    process_type VARCHAR(100),
    status       VARCHAR(50),
    started_at   TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    duration_ms  INTEGER,
    input_data   JSONB,
    output_data  JSONB,
    error_message TEXT,
    created_at   TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_signals_user_time    ON user_signals (user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_signals_type         ON user_signals (signal_type_id);
CREATE INDEX IF NOT EXISTS idx_baselines_user_current    ON baselines (user_id) WHERE is_current = TRUE;
CREATE INDEX IF NOT EXISTS idx_deviations_user_date      ON deviations (user_id, detection_date DESC);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_user_date ON risk_assessments (user_id, assessment_date DESC);
CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_user ON questionnaire_responses (user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_contexts_active      ON user_contexts (user_id, is_active);

-- ============================================
-- SEED DATA
-- ============================================

INSERT INTO signal_types (name, category, unit, min_value, max_value, description) VALUES
    ('HRV',            'physiological', 'ms',      0,    200,  'Heart Rate Variability'),
    ('HR_resting',     'physiological', 'bpm',     30,   220,  'Frequência Cardíaca em Repouso'),
    ('sleep_duration', 'sleep',         'hours',   0,    24,   'Duração do Sono'),
    ('sleep_quality',  'sleep',         'score',   0,    100,  'Qualidade do Sono (0-100)'),
    ('stress_level',   'psychological', '1-10',    1,    10,   'Nível de Estresse (auto-report)'),
    ('energy_level',   'psychological', '1-10',    1,    10,   'Nível de Energia (auto-report)'),
    ('mood',           'psychological', '1-10',    1,    10,   'Humor (auto-report)'),
    ('steps',          'physical',      'count',   0,    100000, 'Passos por Dia'),
    ('spo2',           'physiological', '%',       80,   100,  'Saturação de Oxigênio (SpO₂)')
ON CONFLICT DO NOTHING;

INSERT INTO risk_levels (code, name, severity_order, color_code, description) VALUES
    ('stable',        'Estável',         1, '#22c55e', 'Todos os sinais dentro do padrão normal'),
    ('attention',     'Atenção',         2, '#f59e0b', 'Alguns desvios detectados — fique atento'),
    ('elevated_risk', 'Risco Elevado',   3, '#f97316', 'Múltiplos sinais alterados — ação recomendada'),
    ('high_risk',     'Risco Alto',      4, '#ef4444', 'Risco significativo — revisão profissional necessária')
ON CONFLICT (code) DO UPDATE SET
    name        = EXCLUDED.name,
    color_code  = EXCLUDED.color_code,
    description = EXCLUDED.description;

INSERT INTO action_types (code, name, instructions, duration_minutes) VALUES
    ('breathing_exercise',     'Exercício de Respiração',     'Inspire por 4s, segure 4s, expire por 6s. Repita 5 vezes.', 5),
    ('meditation_short',       'Meditação Curta',             'Encontre um lugar tranquilo. Foque na respiração por 10 minutos.', 10),
    ('walk_nature',            'Caminhada na Natureza',       'Caminhe ao ar livre por pelo menos 20 minutos.', 20),
    ('sleep_hygiene',          'Higiene do Sono',             'Evite telas 1h antes de dormir. Durma e acorde no mesmo horário.', NULL),
    ('exercise_light',         'Exercício Leve',              'Yoga, alongamento ou caminhada leve por 30 minutos.', 30),
    ('journaling',             'Escrita Terapêutica',         'Escreva sobre seus sentimentos e pensamentos por 15 minutos.', 15),
    ('social_connection',      'Conexão Social',              'Entre em contato com alguém próximo. Converse ou se encontre.', NULL),
    ('specialist_psychologist','Consulta com Psicólogo',      'Recomendamos agendar uma consulta com psicólogo. Fale com a CarePlus.', NULL),
    ('specialist_psychiatrist','Consulta com Psiquiatra',     'Recomendamos avaliação psiquiátrica com urgência. Fale com a CarePlus.', NULL),
    ('wellness_coach',         'Coach de Bem-Estar',          'Sessão com coach de bem-estar da CarePlus.', 60),
    ('emergency_support',      'Suporte de Emergência',       'Ligue 188 (CVV) para suporte imediato. Não está sozinho.', NULL)
ON CONFLICT (code) DO UPDATE SET
    name         = EXCLUDED.name,
    instructions = EXCLUDED.instructions;

INSERT INTO questionnaire_types (code, name, description, frequency_days, question_count, max_score) VALUES
    ('DAILY_CHECKIN', 'Check-in Diário',                'Avaliação rápida diária de humor, energia e estresse', 1,  3,  30),
    ('PSS',           'Escala de Estresse Percebido',   'Perceived Stress Scale — avalia estresse do último mês', 7,  10, 40),
    ('CBI',           'Copenhagen Burnout Inventory',   'Avalia burnout pessoal, profissional e relacionado ao trabalho', 14, 19, 76),
    ('OLBI',          'Oldenburg Burnout Inventory',    'Mede exaustão e desengajamento no trabalho', 14, 16, 64),
    ('GAD7',          'Escala de Ansiedade Generalizada','Rastreamento de transtorno de ansiedade generalizada', 14, 7,  21)
ON CONFLICT DO NOTHING;

INSERT INTO context_types (code, name, category, impact_description, default_weight_adjustment) VALUES
    ('illness_minor',        'Doença Leve',          'health',      'Resfriado, gripe — pode afetar HRV e sono temporariamente',      '{"HRV": 0.7, "sleep_duration": 0.8}'),
    ('illness_major',        'Doença Grave',          'health',      'Doença séria — sinais fisiológicos significativamente alterados', '{"HRV": 0.5, "sleep_duration": 0.6}'),
    ('medical_leave',        'Atestado Médico',       'health',      'Afastamento médico — contexto de recuperação',                   '{"HRV": 0.6}'),
    ('vacation',             'Férias',                'life_event',  'Férias — alterações de rotina esperadas e saudáveis',            '{"stress_level": 0.8}'),
    ('intense_exercise',     'Exercício Intenso',     'physical',    'Treino pesado — HRV reduzida é normal pós-exercício',            '{"HRV": 0.7, "HR_resting": 0.8}'),
    ('life_event_positive',  'Evento Positivo',       'life_event',  'Casamento, promoção, nascimento — estresse positivo',            '{"stress_level": 0.9}'),
    ('life_event_negative',  'Evento Negativo',       'life_event',  'Luto, separação, demissão — impacto emocional esperado',         '{"mood": 0.7, "stress_level": 1.2}'),
    ('work_deadline',        'Deadline de Trabalho',  'work',        'Prazo crítico — estresse elevado é contextual',                  '{"stress_level": 0.9}'),
    ('travel',               'Viagem',                'life_event',  'Viagem e jet lag — alterações de sono esperadas',                '{"sleep_duration": 0.8, "sleep_quality": 0.8}'),
    ('menstruation',         'Ciclo Menstrual',       'health',      'Ciclo menstrual — variações fisiológicas normais',               '{"HRV": 0.8, "energy_level": 0.9}')
ON CONFLICT DO NOTHING;
