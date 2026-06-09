// controllers/riskController.js
import { query } from '../config/database.js';
import logger from '../config/logger.js';

class RiskController {
  async getCurrentRisk(req, res, next) {
    try {
      const userId = req.user.userId;

      const result = await query(
        `SELECT
          ra.id,
          rl.code AS risk_level,
          rl.name AS risk_level_name,
          rl.color_code,
          ra.risk_score,
          ra.confidence_level,
          ra.assessment_date,
          ra.assessment_timestamp,
          ra.primary_explanation,
          ra.secondary_factors,
          ra.contributing_signals,
          ra.persistence_days,
          ra.requires_professional_review,
          at.name AS recommended_action,
          at.instructions AS action_instructions,
          at.duration_minutes AS action_duration
         FROM risk_assessments ra
         JOIN risk_levels rl ON ra.risk_level_id = rl.id
         LEFT JOIN action_types at ON ra.recommended_action_id = at.id
         WHERE ra.user_id = $1
         ORDER BY ra.assessment_timestamp DESC
         LIMIT 1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(200).json({
          success: true,
          data: null,
          message: 'No risk assessment yet. Keep logging your data!',
        });
      }

      res.status(200).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req, res, next) {
    try {
      const userId = req.user.userId;
      const { limit = 30, days = 30 } = req.query;

      const result = await query(
        `SELECT
          ra.id,
          rl.code AS risk_level,
          rl.name AS risk_level_name,
          rl.color_code,
          ra.risk_score,
          ra.assessment_date,
          ra.assessment_timestamp,
          ra.primary_explanation
         FROM risk_assessments ra
         JOIN risk_levels rl ON ra.risk_level_id = rl.id
         WHERE ra.user_id = $1
           AND ra.assessment_timestamp >= NOW() - ($2 * INTERVAL '1 day')
         ORDER BY ra.assessment_timestamp DESC
         LIMIT $3`,
        [userId, parseInt(days), parseInt(limit)]
      );

      res.status(200).json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRiskLevels(req, res, next) {
    try {
      const result = await query(
        `SELECT id, code, name, severity_order, color_code, description
         FROM risk_levels
         ORDER BY severity_order`
      );

      res.status(200).json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBreakdown(req, res, next) {
    try {
      const userId = req.user.userId;

      // Last questionnaire score per type
      const qResult = await query(
        `SELECT DISTINCT ON (qt.code)
           qt.code, qt.name, qt.max_score, qr.total_score, qr.completed_at
         FROM questionnaire_responses qr
         JOIN questionnaire_types qt ON qr.questionnaire_type_id = qt.id
         WHERE qr.user_id = $1 AND qr.is_valid = TRUE
         ORDER BY qt.code, qr.completed_at DESC`,
        [userId]
      );

      // 7-day average vs 7–21 day average — works without baselines table
      const signalTrendResult = await query(
        `SELECT
           st.name,
           AVG(CASE WHEN us.timestamp >= NOW() - INTERVAL '7 days' THEN us.value END)   AS recent_7d,
           AVG(CASE WHEN us.timestamp >= NOW() - INTERVAL '21 days'
                    AND us.timestamp  <  NOW() - INTERVAL '7 days'  THEN us.value END) AS baseline_14d,
           COUNT(*) AS total_readings
         FROM user_signals us
         JOIN signal_types st ON us.signal_type_id = st.id
         WHERE us.user_id = $1
           AND us.timestamp >= NOW() - INTERVAL '21 days'
           AND us.is_outlier = FALSE
         GROUP BY st.name
         HAVING COUNT(*) >= 2`,
        [userId]
      );

      // Active contexts
      const ctxResult = await query(
        `SELECT ct.code, ct.name, uc.severity
         FROM user_contexts uc
         JOIN context_types ct ON uc.context_type_id = ct.id
         WHERE uc.user_id = $1 AND uc.is_active = TRUE`,
        [userId]
      );

      // Build signal deviations
      const SIGNAL_DISPLAY = {
        HRV:            'Variabilidade Cardíaca (HRV)',
        HR_resting:     'FC em Repouso',
        sleep_duration: 'Duração do Sono',
        sleep_quality:  'Qualidade do Sono',
        stress_level:   'Nível de Estresse',
        energy_level:   'Nível de Energia',
        mood:           'Humor',
        steps:          'Passos Diários',
      };
      // For these signals, "higher is worse" (direction inverted)
      const INVERTED = new Set(['stress_level', 'HR_resting']);

      const signalDeviations = signalTrendResult.rows
        .filter(r => r.recent_7d != null && r.baseline_14d != null && parseFloat(r.baseline_14d) > 0)
        .map(r => {
          const recent   = parseFloat(r.recent_7d);
          const baseline = parseFloat(r.baseline_14d);
          const pctRaw   = ((recent - baseline) / baseline) * 100;
          const pct      = Math.round(pctRaw * 10) / 10;
          const isInverted = INVERTED.has(r.name);
          const isBad = isInverted ? pct > 10 : pct < -10;
          return {
            name:            r.name,
            display_name:    SIGNAL_DISPLAY[r.name] || r.name,
            current_value:   Math.round(recent * 10) / 10,
            baseline_value:  Math.round(baseline * 10) / 10,
            percent_change:  pct,
            direction:       pct > 1 ? 'up' : pct < -1 ? 'down' : 'stable',
            is_significant:  Math.abs(pct) >= 15,
            is_bad:          isBad,
          };
        })
        .sort((a, b) => Math.abs(b.percent_change) - Math.abs(a.percent_change))
        .slice(0, 6);

      // Build questionnaire details
      const Q_WEIGHTS  = { PSS: 0.45, GAD7: 0.25, CBI: 0.20, OLBI: 0.10 };
      const qMap = {};
      qResult.rows.forEach(q => { qMap[q.code] = q; });

      let qWeightedSum = 0;
      let qWeightTotal = 0;
      const qDetails = [];
      for (const [code, weight] of Object.entries(Q_WEIGHTS)) {
        const q = qMap[code];
        if (!q) continue;
        const normalized = (parseFloat(q.total_score) / parseFloat(q.max_score)) * 100;
        qWeightedSum += normalized * weight;
        qWeightTotal += weight;
        qDetails.push({
          code,
          name:         q.name,
          score:        parseFloat(q.total_score),
          max_score:    parseFloat(q.max_score),
          normalized:   Math.round(normalized),
          weight:       Math.round(weight * 100),
          completed_at: q.completed_at,
        });
      }

      const qScore = qWeightTotal > 0 ? Math.round(qWeightedSum / qWeightTotal) : null;

      res.status(200).json({
        success: true,
        data: {
          questionnaire_score: qScore,
          questionnaire_details: qDetails,
          signal_deviations: signalDeviations,
          active_contexts: ctxResult.rows,
          algorithm_weights: { questionnaires: 70, signals: 30 },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getJobStatus(req, res, next) {
    try {
      const { jobId } = req.params;
      res.status(200).json({
        success: true,
        data: { jobId, status: 'pending', message: 'Job queue not yet connected.' },
      });
    } catch (error) {
      next(error);
    }
  }

  // Simulate a risk assessment (for testing before Python engine is ready)
  async triggerAssessment(req, res, next) {
    try {
      const userId = req.user.userId;

      // Get recent signals
      const signalsResult = await query(
        `SELECT st.name, us.value, us.timestamp
         FROM user_signals us
         JOIN signal_types st ON us.signal_type_id = st.id
         WHERE us.user_id = $1 AND us.is_outlier = FALSE
           AND us.timestamp >= NOW() - INTERVAL '24 hours'
         ORDER BY us.timestamp DESC`,
        [userId]
      );

      if (signalsResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Not enough data for assessment. Please log some signals first.',
        });
      }

      // Simple mock assessment (Python engine will do this properly)
      const stableLevel = await query(
        `SELECT id FROM risk_levels WHERE code = 'stable'`
      );

      const result = await query(
        `INSERT INTO risk_assessments 
         (user_id, risk_level_id, assessment_date, risk_score, confidence_level,
          primary_explanation, signal_convergence_count)
         VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6)
         RETURNING id, assessment_date`,
        [
          userId,
          stableLevel.rows[0].id,
          25.0,
          0.7,
          'Initial assessment based on available signals.',
          signalsResult.rows.length,
        ]
      );

      logger.info({ userId }, 'Risk assessment triggered');

      res.status(201).json({
        success: true,
        data: {
          id: result.rows[0].id,
          assessmentDate: result.rows[0].assessment_date,
          message: 'Assessment created. Python engine will process full analysis.',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new RiskController();
