-- Migration: add spo2 signal type for Apple Health SpO₂ import
INSERT INTO signal_types (name, category, unit, min_value, max_value, description)
VALUES ('spo2', 'physiological', '%', 80, 100, 'Saturação de Oxigênio (SpO₂)')
ON CONFLICT DO NOTHING;
