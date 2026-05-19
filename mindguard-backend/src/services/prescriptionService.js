// services/prescriptionService.js
import { query } from '../config/database.js';
import { createHash } from 'crypto';
import logger from '../config/logger.js';

class PrescriptionService {
  async createPrescription(userId, specialistId, { appointmentId, items, observations }) {
    try {
      const content = JSON.stringify({ userId, specialistId, appointmentId, items, observations, issuedAt: new Date().toISOString() });
      const auditHash = createHash('sha256').update(content).digest('hex');

      const result = await query(
        `INSERT INTO prescriptions (user_id, specialist_id, appointment_id, items, observations, audit_hash)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, specialistId, appointmentId || null, JSON.stringify(items), observations || null, auditHash]
      );

      return result.rows[0];
    } catch (error) {
      logger.error({ error, userId }, 'Failed to create prescription');
      throw error;
    }
  }

  async getUserPrescriptions(userId) {
    const result = await query(
      `SELECT p.*, s.name AS specialist_name, s.specialty,
              a.scheduled_date, a.scheduled_time
       FROM prescriptions p
       JOIN specialists s ON p.specialist_id = s.id
       LEFT JOIN appointments a ON p.appointment_id = a.id
       WHERE p.user_id = $1
       ORDER BY p.issued_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async getPrescriptionById(userId, prescriptionId) {
    const result = await query(
      `SELECT p.*, s.name AS specialist_name, s.specialty, s.crm_crp,
              a.scheduled_date, a.scheduled_time
       FROM prescriptions p
       JOIN specialists s ON p.specialist_id = s.id
       LEFT JOIN appointments a ON p.appointment_id = a.id
       WHERE p.id = $1 AND p.user_id = $2`,
      [prescriptionId, userId]
    );
    if (result.rows.length === 0) throw Object.assign(new Error('Prescrição não encontrada'), { status: 404 });
    return result.rows[0];
  }
}

export default new PrescriptionService();
