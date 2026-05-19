// controllers/questionnaireController.js
import { query } from '../config/database.js';
import logger from '../config/logger.js';
import { triggerRiskCalculation } from '../services/pythonService.js';

// Questões com pontuação positiva (revertida) por questionário
const REVERSED_ITEMS = {
  PSS:           new Set([4, 5, 7, 8]),
  CBI:           new Set([10]),                           // WB4: "energia para família/amigos"
  OLBI:          new Set([1, 5, 7, 10, 13, 14, 15, 16]), // itens positivos/protetores
  DAILY_CHECKIN: new Set([1, 2]),                         // humor e energia: valor alto = bom
};

// Valor máximo por item em cada escala (usado na fórmula de reversão: max - val)
const ITEM_SCALE_MAX = {
  PSS:           4,
  CBI:           4,
  OLBI:          4,
  DAILY_CHECKIN: 10,
};

function calculateScore(questionnaireCode, responses) {
  const reversed = REVERSED_ITEMS[questionnaireCode] ?? new Set();
  const maxVal   = ITEM_SCALE_MAX[questionnaireCode] ?? 4;
  return Object.entries(responses).reduce((sum, [key, val]) => {
    const qNum  = parseInt(key, 10);
    const score = reversed.has(qNum) ? maxVal - val : val;
    return sum + (Number.isFinite(score) ? score : 0);
  }, 0);
}

class QuestionnaireController {
  async getDue(req, res, next) {
    try {
      const userId = req.user.userId;

      // Retorna questionários ativos cuja última resposta é mais antiga
      // que frequency_days, ou que nunca foram respondidos
      const result = await query(
        `SELECT
           qt.id,
           qt.code,
           qt.name,
           qt.description,
           qt.frequency_days,
           qt.question_count,
           qt.max_score,
           MAX(qr.completed_at) AS last_completed,
           CASE
             WHEN MAX(qr.completed_at) IS NULL THEN TRUE
             WHEN MAX(qr.completed_at) < NOW() - (qt.frequency_days || ' days')::INTERVAL THEN TRUE
             ELSE FALSE
           END AS is_due,
           CASE
             WHEN MAX(qr.completed_at) IS NULL THEN NULL
             ELSE MAX(qr.completed_at) + (qt.frequency_days || ' days')::INTERVAL
           END AS next_due_at
         FROM questionnaire_types qt
         LEFT JOIN questionnaire_responses qr
           ON qr.questionnaire_type_id = qt.id
           AND qr.user_id = $1
           AND qr.is_valid = TRUE
         WHERE qt.is_active = TRUE
         GROUP BY qt.id
         ORDER BY is_due DESC, qt.frequency_days ASC`,
        [userId]
      );

      res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
      next(error);
    }
  }

  async submitResponse(req, res, next) {
    try {
      const userId = req.user.userId;
      const { questionnaireCode, responses, contextNotes } = req.validatedBody;

      const typeResult = await query(
        `SELECT id, max_score FROM questionnaire_types WHERE code = $1 AND is_active = TRUE`,
        [questionnaireCode]
      );

      if (typeResult.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Tipo de questionário não encontrado' });
      }

      const { id: questionnaireTypeId, max_score: maxScore } = typeResult.rows[0];

      // Calcula score com reversão correta das questões positivas
      const totalScore = calculateScore(questionnaireCode, responses);

      const result = await query(
        `INSERT INTO questionnaire_responses
         (user_id, questionnaire_type_id, responses, total_score, started_at, completed_at, context_notes)
         VALUES ($1, $2, $3, $4, NOW(), NOW(), $5)
         RETURNING id, total_score, completed_at`,
        [userId, questionnaireTypeId, JSON.stringify(responses), totalScore, contextNotes || null]
      );

      logger.info({ userId, questionnaireCode, totalScore, maxScore }, 'Questionnaire submitted');

      res.status(201).json({
        success: true,
        data: {
          id: result.rows[0].id,
          questionnaireCode,
          totalScore: Number(result.rows[0].total_score),
          maxScore,
          completedAt: result.rows[0].completed_at,
        },
      });

      // Recalcular risco após questionário (fire-and-forget)
      triggerRiskCalculation(userId).catch((err) =>
        logger.warn({ userId, err: err.message }, 'Risk calc after questionnaire failed')
      );
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req, res, next) {
    try {
      const userId = req.user.userId;
      const { code, limit = 10 } = req.query;

      let queryText = `
        SELECT
          qr.id,
          qt.code,
          qt.name,
          qt.max_score,
          qr.total_score,
          qr.completed_at,
          qr.context_notes
        FROM questionnaire_responses qr
        JOIN questionnaire_types qt ON qr.questionnaire_type_id = qt.id
        WHERE qr.user_id = $1 AND qr.is_valid = TRUE
      `;
      const params = [userId];

      if (code) {
        queryText += ` AND qt.code = $2`;
        params.push(code);
      }

      queryText += ` ORDER BY qr.completed_at DESC LIMIT $${params.length + 1}`;
      params.push(parseInt(limit, 10));

      const result = await query(queryText, params);

      res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
      next(error);
    }
  }

  async getTypes(req, res, next) {
    try {
      const result = await query(
        `SELECT id, code, name, description, frequency_days, question_count, max_score
         FROM questionnaire_types WHERE is_active = TRUE ORDER BY frequency_days ASC`
      );
      res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
      next(error);
    }
  }
}

export default new QuestionnaireController();
