// controllers/contextController.js
import { query } from '../config/database.js';
import logger from '../config/logger.js';

class ContextController {
  async addContext(req, res, next) {
    try {
      const userId = req.user.userId;
      const { contextCode, startDate, endDate, severity, notes } = req.validatedBody;

      // Get context type
      const typeResult = await query(
        `SELECT id FROM context_types WHERE code = $1 AND is_active = TRUE`,
        [contextCode]
      );

      if (typeResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Context type not found',
        });
      }

      const contextTypeId = typeResult.rows[0].id;

      // Insert context
      const result = await query(
        `INSERT INTO user_contexts (user_id, context_type_id, start_date, end_date, severity, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, start_date, end_date, severity, created_at`,
        [userId, contextTypeId, startDate, endDate || null, severity || null, notes || null]
      );

      logger.info({ userId, contextCode }, 'Context added');

      res.status(201).json({
        success: true,
        data: {
          id: result.rows[0].id,
          contextCode,
          startDate: result.rows[0].start_date,
          endDate: result.rows[0].end_date,
          severity: result.rows[0].severity,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveContexts(req, res, next) {
    try {
      const userId = req.user.userId;

      const result = await query(
        `SELECT 
          uc.id,
          ct.code,
          ct.name,
          ct.category,
          uc.start_date,
          uc.end_date,
          uc.severity,
          uc.notes
         FROM user_contexts uc
         JOIN context_types ct ON uc.context_type_id = ct.id
         WHERE uc.user_id = $1 
           AND uc.is_active = TRUE
           AND (uc.end_date IS NULL OR uc.end_date >= CURRENT_DATE)
         ORDER BY uc.start_date DESC`,
        [userId]
      );

      res.status(200).json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      next(error);
    }
  }

  async getContextTypes(req, res, next) {
    try {
      // Garante que o tipo "custom" existe para bancos criados antes desse tipo ser adicionado
      await query(`
        INSERT INTO context_types (code, name, category, impact_description, default_weight_adjustment)
        VALUES ('custom', 'Outra Situação', 'custom', 'Situação personalizada descrita pelo usuário nas notas', '{}')
        ON CONFLICT (code) DO NOTHING
      `);

      const result = await query(
        `SELECT id, code, name, category, impact_description
         FROM context_types
         WHERE is_active = TRUE
         ORDER BY category, name`
      );

      res.status(200).json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      next(error);
    }
  }

  async closeContext(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      const result = await query(
        `UPDATE user_contexts 
         SET end_date = CURRENT_DATE, is_active = FALSE
         WHERE id = $1 AND user_id = $2
         RETURNING id`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Context not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Context closed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ContextController();
