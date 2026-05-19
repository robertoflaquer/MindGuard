// services/appointmentService.js
import { query } from '../config/database.js';
import logger from '../config/logger.js';

class AppointmentService {
  async getSpecialists() {
    const result = await query(
      `SELECT id, name, specialty, crm_crp, avatar_initials, color_hex
       FROM specialists
       WHERE is_active = TRUE
       ORDER BY id`
    );
    return result.rows;
  }

  async createAppointment(userId, { specialistId, scheduledDate, scheduledTime, observations, riskSnapshot }) {
    try {
      const conflict = await query(
        `SELECT id FROM appointments
         WHERE specialist_id = $1
           AND scheduled_date = $2
           AND scheduled_time = $3
           AND status != 'cancelled'`,
        [specialistId, scheduledDate, scheduledTime]
      );

      if (conflict.rows.length > 0) {
        throw Object.assign(new Error('Horário indisponível'), { status: 409 });
      }

      const result = await query(
        `INSERT INTO appointments
           (user_id, specialist_id, scheduled_date, scheduled_time, observations, risk_snapshot)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, specialistId, scheduledDate, scheduledTime, observations || null, riskSnapshot ? JSON.stringify(riskSnapshot) : null]
      );

      return result.rows[0];
    } catch (error) {
      logger.error({ error, userId }, 'Failed to create appointment');
      throw error;
    }
  }

  async getUserAppointments(userId, { upcoming = true } = {}) {
    const result = await query(
      `SELECT a.*, s.name AS specialist_name, s.specialty, s.avatar_initials, s.color_hex
       FROM appointments a
       JOIN specialists s ON a.specialist_id = s.id
       WHERE a.user_id = $1
         AND (${upcoming ? "a.scheduled_date >= CURRENT_DATE" : "a.scheduled_date < CURRENT_DATE"})
       ORDER BY a.scheduled_date ASC, a.scheduled_time ASC`,
      [userId]
    );
    return result.rows;
  }

  async cancelAppointment(userId, appointmentId) {
    const result = await query(
      `UPDATE appointments
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id, status`,
      [appointmentId, userId]
    );
    if (result.rows.length === 0) throw Object.assign(new Error('Consulta não encontrada'), { status: 404 });
    return result.rows[0];
  }

  async getAvailableSlots(specialistId, date) {
    const ALL_SLOTS = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];
    const booked = await query(
      `SELECT scheduled_time::text FROM appointments
       WHERE specialist_id = $1 AND scheduled_date = $2 AND status != 'cancelled'`,
      [specialistId, date]
    );
    const bookedTimes = booked.rows.map((r) => r.scheduled_time.slice(0, 5));
    return ALL_SLOTS.map((t) => ({ time: t, available: !bookedTimes.includes(t) }));
  }
}

export default new AppointmentService();
