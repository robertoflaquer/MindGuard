// services/signalService.js
import { query, transaction } from '../config/database.js';
import logger from '../config/logger.js';

class SignalService {
  async ingestSignalBatch(userId, signals) {
    try {
      const results = await transaction(async (client) => {
        const insertedSignals = [];

        for (const signal of signals) {
          // Get signal type ID
          const typeResult = await client.query(
            `SELECT id FROM signal_types WHERE name = $1 AND is_active = TRUE`,
            [signal.signalType]
          );

          if (typeResult.rows.length === 0) {
            logger.warn({ signalType: signal.signalType }, 'Unknown signal type');
            continue;
          }

          const signalTypeId = typeResult.rows[0].id;

          // Insert signal
          const insertResult = await client.query(
            `INSERT INTO user_signals 
             (user_id, signal_type_id, value, timestamp, source_metadata, confidence_score)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, value, timestamp, created_at`,
            [
              userId,
              signalTypeId,
              signal.value,
              signal.timestamp,
              signal.metadata ? JSON.stringify(signal.metadata) : null,
              1.0, // default confidence
            ]
          );

          insertedSignals.push({
            id: insertResult.rows[0].id,
            signalType: signal.signalType,
            value: insertResult.rows[0].value,
            timestamp: insertResult.rows[0].timestamp,
          });
        }

        return insertedSignals;
      });

      logger.info(
        { userId, count: results.length },
        'Signals ingested successfully'
      );

      return results;
    } catch (error) {
      logger.error({ error, userId }, 'Signal ingestion failed');
      throw error;
    }
  }

  async getRecentSignals(userId, signalType = null, limit = 30) {
    try {
      let queryText = `
        SELECT 
          us.id,
          st.name AS signal_type,
          us.value,
          us.timestamp,
          us.is_outlier,
          us.confidence_score
        FROM user_signals us
        JOIN signal_types st ON us.signal_type_id = st.id
        WHERE us.user_id = $1
      `;

      const params = [userId];

      if (signalType) {
        queryText += ` AND st.name = $2`;
        params.push(signalType);
      }

      queryText += ` ORDER BY us.timestamp DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await query(queryText, params);

      return result.rows;
    } catch (error) {
      logger.error({ error, userId }, 'Failed to fetch signals');
      throw error;
    }
  }

  async getSignalTypes() {
    const result = await query(
      `SELECT id, name, category, unit, min_value, max_value, description
       FROM signal_types
       WHERE is_active = TRUE
       ORDER BY category, name`
    );

    return result.rows;
  }

  async getSignalStats(userId, signalType, days = 7) {
    try {
      const result = await query(
        `SELECT
          COUNT(*) as count,
          AVG(value) as average,
          MIN(value) as min,
          MAX(value) as max,
          STDDEV(value) as std_dev
         FROM user_signals us
         JOIN signal_types st ON us.signal_type_id = st.id
         WHERE us.user_id = $1
           AND st.name = $2
           AND us.timestamp >= NOW() - ($3 * INTERVAL '1 day')
           AND us.is_outlier = FALSE`,
        [userId, signalType, parseInt(days)]
      );

      return result.rows[0];
    } catch (error) {
      logger.error({ error, userId, signalType }, 'Failed to get signal stats');
      throw error;
    }
  }
}

export default new SignalService();
