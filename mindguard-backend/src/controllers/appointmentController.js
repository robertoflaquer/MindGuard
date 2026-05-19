// controllers/appointmentController.js
import appointmentService from '../services/appointmentService.js';
import logger from '../config/logger.js';

class AppointmentController {
  async getSpecialists(req, res, next) {
    try {
      const specialists = await appointmentService.getSpecialists();
      res.json({ success: true, data: specialists });
    } catch (error) {
      next(error);
    }
  }

  async getSlots(req, res, next) {
    try {
      const { specialistId, date } = req.query;
      if (!specialistId || !date) {
        return res.status(400).json({ success: false, error: 'specialistId e date são obrigatórios' });
      }
      const slots = await appointmentService.getAvailableSlots(parseInt(specialistId), date);
      res.json({ success: true, data: slots });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const userId = req.user.userId;
      const appointment = await appointmentService.createAppointment(userId, req.validatedBody);
      res.status(201).json({ success: true, data: appointment });
    } catch (error) {
      if (error.status === 409) return res.status(409).json({ success: false, error: error.message });
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const userId = req.user.userId;
      const upcoming = req.query.upcoming !== 'false';
      const appointments = await appointmentService.getUserAppointments(userId, { upcoming });
      res.json({ success: true, data: appointments });
    } catch (error) {
      next(error);
    }
  }

  async cancel(req, res, next) {
    try {
      const userId = req.user.userId;
      const result = await appointmentService.cancelAppointment(userId, req.params.id);
      res.json({ success: true, data: result });
    } catch (error) {
      if (error.status === 404) return res.status(404).json({ success: false, error: error.message });
      next(error);
    }
  }
}

export default new AppointmentController();
