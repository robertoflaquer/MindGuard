// controllers/signalController.js
import signalService from '../services/signalService.js';
import logger from '../config/logger.js';
import { triggerRiskCalculation, triggerBaselineCalculation } from '../services/pythonService.js';
import { query } from '../config/database.js';

class SignalController {
  async ingestBatch(req, res, next) {
    try {
      const userId = req.user.userId;
      const { signals } = req.validatedBody;

      const result = await signalService.ingestSignalBatch(userId, signals);

      res.status(201).json({
        success: true,
        data: {
          inserted: result.length,
          signals: result,
        },
      });

      // Baseline primeiro, depois risco com os dados atualizados
      triggerBaselineCalculation(userId)
        .catch((err) => logger.warn({ userId, err: err.message }, 'Baseline calc failed'))
        .finally(() => {
          triggerRiskCalculation(userId).catch((err) =>
            logger.warn({ userId, err: err.message }, 'Risk calc failed')
          );
        });
    } catch (error) {
      next(error);
    }
  }

  async getRecent(req, res, next) {
    try {
      const userId = req.user.userId;
      const { type, limit = 30 } = req.query;

      const signals = await signalService.getRecentSignals(userId, type, parseInt(limit));

      res.status(200).json({
        success: true,
        data: signals,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTypes(req, res, next) {
    try {
      const types = await signalService.getSignalTypes();

      res.status(200).json({
        success: true,
        data: types,
      });
    } catch (error) {
      next(error);
    }
  }

  async simulateWearable(req, res, next) {
    try {
      const userId = req.user.userId;
      const { device = 'apple_watch' } = req.body;

      const now = new Date().toISOString();
      // Generate realistic-ish random values
      const rand = (min, max, dec = 1) => parseFloat((Math.random() * (max - min) + min).toFixed(dec));

      const signals = [
        { signalType: 'HRV',            value: rand(35, 80),     timestamp: now, source: device, metadata: { simulated: true } },
        { signalType: 'HR_resting',     value: rand(55, 90),     timestamp: now, source: device, metadata: { simulated: true } },
        { signalType: 'sleep_duration', value: rand(5, 9),       timestamp: now, source: device, metadata: { simulated: true } },
        { signalType: 'sleep_quality',  value: rand(40, 95),     timestamp: now, source: device, metadata: { simulated: true } },
        { signalType: 'stress_level',   value: rand(1, 10),      timestamp: now, source: device, metadata: { simulated: true } },
        { signalType: 'mood',           value: rand(1, 10),      timestamp: now, source: device, metadata: { simulated: true } },
        { signalType: 'steps',          value: rand(3000, 12000, 0), timestamp: now, source: device, metadata: { simulated: true } },
      ];

      const result = await signalService.ingestSignalBatch(userId, signals);

      res.status(201).json({
        success: true,
        message: `Dados simulados de ${device === 'galaxy_watch' ? 'Galaxy Watch' : 'Apple Watch'} importados`,
        data: { inserted: result.length, device },
      });

      triggerBaselineCalculation(userId)
        .catch((err) => logger.warn({ userId, err: err.message }, 'Baseline calc failed'))
        .finally(() => {
          triggerRiskCalculation(userId).catch((err) =>
            logger.warn({ userId, err: err.message }, 'Risk calc failed')
          );
        });
    } catch (error) {
      next(error);
    }
  }

  async getStreak(req, res, next) {
    try {
      const userId = req.user.userId;
      // Use created_at (insertion date) so that bulk imports (Apple Health, demo seeder)
      // only count as 1 day, not as historical consecutive days.
      // Also count days with questionnaire responses as active days.
      const r = await query(
        `SELECT day FROM (
           SELECT DISTINCT DATE(created_at AT TIME ZONE 'UTC') AS day
           FROM user_signals
           WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '90 days'
           UNION
           SELECT DISTINCT DATE(completed_at AT TIME ZONE 'UTC')
           FROM questionnaire_responses
           WHERE user_id = $1 AND is_valid = TRUE AND completed_at >= NOW() - INTERVAL '90 days'
         ) AS active_days
         ORDER BY day DESC`,
        [userId]
      );

      const dayStrs = new Set(r.rows.map((row) => new Date(row.day).toISOString().slice(0, 10)));
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const todayStr = today.toISOString().slice(0, 10);

      // Start from today; if no activity today, allow starting from yesterday
      const startOffset = dayStrs.has(todayStr) ? 0 : 1;
      let streak = 0;
      for (let i = startOffset; i < 90; i++) {
        const d = new Date(today);
        d.setUTCDate(d.getUTCDate() - i);
        if (dayStrs.has(d.toISOString().slice(0, 10))) streak++;
        else break;
      }

      res.status(200).json({ success: true, data: { streak } });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const userId = req.user.userId;
      const { type, days = 7 } = req.query;

      if (!type) {
        return res.status(400).json({
          success: false,
          error: 'Signal type is required',
        });
      }

      const stats = await signalService.getSignalStats(userId, type, parseInt(days));

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SignalController();
