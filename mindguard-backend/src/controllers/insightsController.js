// controllers/insightsController.js
import insightsService from '../services/insightsService.js';
import logger from '../config/logger.js';

class InsightsController {
  async getInsights(req, res, next) {
    try {
      const userId = req.user.userId;
      const data = await insightsService.generateInsights(userId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      logger.error({ error }, 'Insights generation failed');
      next(error);
    }
  }
}

export default new InsightsController();
