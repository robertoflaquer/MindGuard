-- Corrigir nomes em inglês para português
-- Rodar no DBeaver: F5 ou Ctrl+Enter

UPDATE action_types SET
    name = 'Exercício de Respiração',
    instructions = 'Inspire por 4s, segure 4s, expire por 6s. Repita 5 vezes.'
WHERE code = 'breathing_exercise';

UPDATE action_types SET
    name = 'Meditação Curta',
    instructions = 'Encontre um lugar tranquilo. Foque na respiração por 10 minutos.'
WHERE code = 'meditation_short';

UPDATE action_types SET
    name = 'Caminhada na Natureza',
    instructions = 'Caminhe ao ar livre por pelo menos 20 minutos.'
WHERE code = 'walk_nature';

UPDATE action_types SET
    name = 'Higiene do Sono',
    instructions = 'Evite telas 1h antes de dormir. Durma e acorde no mesmo horário.'
WHERE code = 'sleep_hygiene';

UPDATE action_types SET
    name = 'Exercício Leve',
    instructions = 'Yoga, alongamento ou caminhada leve por 30 minutos.'
WHERE code = 'exercise_light';

UPDATE action_types SET
    name = 'Escrita Terapêutica',
    instructions = 'Escreva sobre seus sentimentos e pensamentos por 15 minutos.'
WHERE code = 'journaling';

UPDATE action_types SET
    name = 'Conexão Social',
    instructions = 'Entre em contato com alguém próximo. Converse ou se encontre.'
WHERE code = 'social_connection';

UPDATE action_types SET
    name = 'Consulta com Psicólogo',
    instructions = 'Recomendamos agendar uma consulta com psicólogo. Fale com a CarePlus.'
WHERE code = 'specialist_psychologist';

UPDATE action_types SET
    name = 'Consulta com Psiquiatra',
    instructions = 'Recomendamos avaliação psiquiátrica com urgência. Fale com a CarePlus.'
WHERE code = 'specialist_psychiatrist';

UPDATE action_types SET
    name = 'Coach de Bem-Estar',
    instructions = 'Sessão com coach de bem-estar da CarePlus.'
WHERE code = 'wellness_coach';

UPDATE action_types SET
    name = 'Suporte de Emergência',
    instructions = 'Ligue 188 (CVV) para suporte imediato. Não está sozinho.'
WHERE code = 'emergency_support';

UPDATE risk_levels SET name = 'Estável'       WHERE code = 'stable';
UPDATE risk_levels SET name = 'Atenção'       WHERE code = 'attention';
UPDATE risk_levels SET name = 'Risco Elevado' WHERE code = 'elevated_risk';
UPDATE risk_levels SET name = 'Risco Alto'    WHERE code = 'high_risk';

-- Corrigir max_score do CBI (escala 0-4 por item, 19 itens = 76 máx)
UPDATE questionnaire_types SET max_score = 76 WHERE code = 'CBI';

-- Verificação final
SELECT *
FROM (
    SELECT 
        'risk_levels' AS tabela,
        code,
        name,
        severity_order::text AS ordem
    FROM risk_levels

    UNION ALL

    SELECT 
        'action_types' AS tabela,
        code,
        name,
        id::text AS ordem
    FROM action_types
) AS t
ORDER BY tabela, ordem;
