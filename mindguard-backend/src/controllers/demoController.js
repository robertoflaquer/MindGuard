// controllers/demoController.js
// Cria (ou repõe) um usuário demo populado com 30 dias de dados realistas
// para apresentações ao vivo. Idempotente: pode ser chamado várias vezes.
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query, transaction } from '../config/database.js';
import logger from '../config/logger.js';

const DEMO_EMAIL = 'demo@careplus.com';
const DEMO_PASSWORD = 'Demo2026!';
const DEMO_NAME = 'Roberto (Demo)';

// Gera um número entre min e max com pequena variação aleatória
const jitter = (base, range) => base + (Math.random() - 0.5) * range;

// Curva de degradação: dia 0 (hoje) = pior, dia 30 = melhor.
// progress vai de 0 (saudável) até 1 (crítico).
const degradation = (dayIndex) => {
  if (dayIndex > 21) return 0;            // baseline saudável
  if (dayIndex > 14) return (21 - dayIndex) / 7 * 0.3;  // leve sinal
  if (dayIndex > 7)  return 0.3 + (14 - dayIndex) / 7 * 0.4;  // moderado
  return 0.7 + (7 - dayIndex) / 7 * 0.3;  // alta degradação
};

function generateSignals(userId, signalTypeIds) {
  const signals = [];
  const now = new Date();

  for (let dayIndex = 30; dayIndex >= 0; dayIndex--) {
    const date = new Date(now);
    date.setDate(date.getDate() - dayIndex);
    date.setHours(7, 30, 0, 0);
    const d = degradation(dayIndex);

    signals.push({ typeId: signalTypeIds.HRV,            value: jitter(60 - d * 22, 6),  ts: new Date(date) });
    signals.push({ typeId: signalTypeIds.HR_resting,     value: jitter(62 + d * 14, 4),  ts: new Date(date) });
    signals.push({ typeId: signalTypeIds.sleep_duration, value: jitter(7.5 - d * 2.0, 0.6), ts: new Date(date) });
    signals.push({ typeId: signalTypeIds.sleep_quality,  value: jitter(82 - d * 30, 8), ts: new Date(date) });

    const eveningDate = new Date(date);
    eveningDate.setHours(20, 0, 0, 0);
    signals.push({ typeId: signalTypeIds.stress_level,   value: Math.min(10, Math.max(1, Math.round(jitter(3 + d * 6, 1)))),  ts: new Date(eveningDate) });
    signals.push({ typeId: signalTypeIds.energy_level,   value: Math.min(10, Math.max(1, Math.round(jitter(8 - d * 4, 1)))),  ts: new Date(eveningDate) });
    signals.push({ typeId: signalTypeIds.mood,           value: Math.min(10, Math.max(1, Math.round(jitter(8 - d * 4, 1)))),  ts: new Date(eveningDate) });
    signals.push({ typeId: signalTypeIds.steps,          value: Math.round(jitter(8500 - d * 3500, 1200)),  ts: new Date(date) });
  }

  return signals;
}

// PSS-10: respostas com score alto (28/40 = estresse percebido elevado)
const PSS_RESPONSES = {
  q1: 3, q2: 3, q3: 2, q4: 1, q5: 1, q6: 3, q7: 3, q8: 2, q9: 4, q10: 3
};
const PSS_SCORE = 28;

// GAD-7: 14/21 = ansiedade moderada-severa
const GAD7_RESPONSES = {
  q1: 2, q2: 2, q3: 2, q4: 2, q5: 2, q6: 2, q7: 2
};
const GAD7_SCORE = 14;

class DemoController {
  async loginOrCreate(req, res, next) {
    try {
      const result = await transaction(async (client) => {
        // 1. Garante usuário demo
        let userResult = await client.query(
          `SELECT id FROM users WHERE email = $1`,
          [DEMO_EMAIL]
        );

        let userId;
        if (userResult.rows.length === 0) {
          const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
          const insertResult = await client.query(
            `INSERT INTO users (email, password_hash, full_name, gender, baseline_status, careplus_member_id, careplus_plan_type)
             VALUES ($1, $2, $3, 'M', 'active', 'CP-DEMO-2026', 'Empresarial Premium')
             RETURNING id`,
            [DEMO_EMAIL, passwordHash, DEMO_NAME]
          );
          userId = insertResult.rows[0].id;
          logger.info({ userId }, 'Demo user created');
        } else {
          userId = userResult.rows[0].id;
          // Limpa dados anteriores para repopular fresco
          await client.query(`DELETE FROM user_signals       WHERE user_id = $1`, [userId]);
          await client.query(`DELETE FROM questionnaire_responses WHERE user_id = $1`, [userId]);
          await client.query(`DELETE FROM user_contexts      WHERE user_id = $1`, [userId]);
          await client.query(`DELETE FROM risk_assessments   WHERE user_id = $1`, [userId]);
          await client.query(`DELETE FROM baselines          WHERE user_id = $1`, [userId]);
          await client.query(`DELETE FROM deviations         WHERE user_id = $1`, [userId]);
          logger.info({ userId }, 'Demo user data cleared');
        }

        // 2. Resolve IDs dos signal_types
        const typesResult = await client.query(`SELECT id, name FROM signal_types WHERE is_active = TRUE`);
        const signalTypeIds = {};
        typesResult.rows.forEach((r) => { signalTypeIds[r.name] = r.id; });

        // 3. Popula 30 dias de sinais
        const signals = generateSignals(userId, signalTypeIds);
        for (const s of signals) {
          await client.query(
            `INSERT INTO user_signals (user_id, signal_type_id, value, timestamp, confidence_score)
             VALUES ($1, $2, $3, $4, 1.0)`,
            [userId, s.typeId, s.value, s.ts]
          );
        }

        // 4. Popula questionários (PSS há 5 dias, GAD-7 há 3 dias)
        const qTypes = await client.query(`SELECT id, code FROM questionnaire_types`);
        const qTypeIds = {};
        qTypes.rows.forEach((r) => { qTypeIds[r.code] = r.id; });

        const pssDate = new Date(); pssDate.setDate(pssDate.getDate() - 5);
        const gadDate = new Date(); gadDate.setDate(gadDate.getDate() - 3);

        if (qTypeIds.PSS) {
          await client.query(
            `INSERT INTO questionnaire_responses (user_id, questionnaire_type_id, responses, total_score, started_at, completed_at, duration_seconds)
             VALUES ($1, $2, $3, $4, $5, $5, 180)`,
            [userId, qTypeIds.PSS, JSON.stringify(PSS_RESPONSES), PSS_SCORE, pssDate]
          );
        }
        if (qTypeIds.GAD7) {
          await client.query(
            `INSERT INTO questionnaire_responses (user_id, questionnaire_type_id, responses, total_score, started_at, completed_at, duration_seconds)
             VALUES ($1, $2, $3, $4, $5, $5, 90)`,
            [userId, qTypeIds.GAD7, JSON.stringify(GAD7_RESPONSES), GAD7_SCORE, gadDate]
          );
        }

        // 5. Contexto ativo: deadline de trabalho nos últimos 14 dias
        const ctxResult = await client.query(`SELECT id FROM context_types WHERE code = 'work_deadline'`);
        if (ctxResult.rows.length > 0) {
          const startDate = new Date(); startDate.setDate(startDate.getDate() - 14);
          await client.query(
            `INSERT INTO user_contexts (user_id, context_type_id, start_date, severity, notes, is_active)
             VALUES ($1, $2, $3, 'moderate', 'Entrega de projeto crítico — sprint final', TRUE)`,
            [userId, ctxResult.rows[0].id, startDate]
          );
        }

        // 6. Snapshot inicial de risco (Risco Elevado) para o dashboard ter algo a mostrar de imediato
        const riskLevel = await client.query(
          `SELECT id FROM risk_levels WHERE code = 'elevated_risk' LIMIT 1`
        );
        if (riskLevel.rows.length > 0) {
          await client.query(
            `INSERT INTO risk_assessments
              (user_id, risk_level_id, assessment_date, risk_score, confidence_level,
               contributing_signals, signal_convergence_count, primary_explanation, secondary_factors,
               requires_professional_review)
             VALUES ($1, $2, CURRENT_DATE, 68, 0.85, $3, 3,
                     'Estresse percebido elevado (PSS 28/40) combinado com queda de HRV (-32%) e sono fragmentado nas últimas 2 semanas',
                     $4, TRUE)`,
            [
              userId,
              riskLevel.rows[0].id,
              JSON.stringify(['HRV', 'sleep_quality', 'stress_level', 'mood']),
              JSON.stringify(['PSS-10: 28/40', 'GAD-7: 14/21', 'Contexto: deadline ativo'])
            ]
          );
        }

        return userId;
      });

      // 7. Gera token (mesma lógica do AuthService)
      const token = jwt.sign(
        { userId: result, email: DEMO_EMAIL },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      logger.info({ userId: result }, 'Demo user populated successfully');

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: result,
            email: DEMO_EMAIL,
            fullName: DEMO_NAME,
            baselineStatus: 'active',
          },
          token,
          message: '30 dias de dados populados para demonstração',
        },
      });
    } catch (error) {
      logger.error({ error }, 'Demo population failed');
      next(error);
    }
  }
}

export default new DemoController();
