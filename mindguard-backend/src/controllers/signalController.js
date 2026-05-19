// controllers/signalController.js
import signalService from '../services/signalService.js';
import logger from '../config/logger.js';
import { triggerRiskCalculation, triggerBaselineCalculation } from '../services/pythonService.js';

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
        .catch(() => {})
        .finally(() => triggerRiskCalculation(userId).catch(() => {}));
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
