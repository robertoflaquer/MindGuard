-- Migration: appointments and prescriptions tables

-- Specialists reference table
CREATE TABLE IF NOT EXISTS specialists (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    specialty   VARCHAR(100) NOT NULL,
    crm_crp     VARCHAR(50),
    avatar_initials VARCHAR(5),
    color_hex   VARCHAR(7),
    is_active   BOOLEAN DEFAULT TRUE
);

INSERT INTO specialists (name, specialty, crm_crp, avatar_initials, color_hex) VALUES
  ('Dra. Ana Lima',      'Psiquiatra',        'CRM/SP 123456', 'AL', '#818CF8'),
  ('Dr. Carlos Mendes',  'Psicólogo Clínico', 'CRP/SP 654321', 'CM', '#2DD4BF'),
  ('Dra. Fernanda Costa','Terapeuta TCC',     'CRP/SP 112233', 'FC', '#FB923C')
ON CONFLICT DO NOTHING;

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specialist_id   INTEGER NOT NULL REFERENCES specialists(id),
    scheduled_date  DATE NOT NULL,
    scheduled_time  TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 45,
    status          VARCHAR(50) DEFAULT 'confirmed',
    observations    TEXT,
    risk_snapshot   JSONB,
    meeting_url     VARCHAR(500),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(scheduled_date);

-- Prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id  UUID REFERENCES appointments(id) ON DELETE SET NULL,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specialist_id   INTEGER NOT NULL REFERENCES specialists(id),
    items           JSONB NOT NULL DEFAULT '[]',
    observations    TEXT,
    audit_hash      VARCHAR(64),
    issued_at       TIMESTAMP DEFAULT NOW(),
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id ON prescriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_appointment_id ON prescriptions(appointment_id);
