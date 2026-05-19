// controllers/prescriptionController.js
import prescriptionService from '../services/prescriptionService.js';

class PrescriptionController {
  async list(req, res, next) {
    try {
      const userId = req.user.userId;
      const prescriptions = await prescriptionService.getUserPrescriptions(userId);
      res.json({ success: true, data: prescriptions });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const userId = req.user.userId;
      const prescription = await prescriptionService.getPrescriptionById(userId, req.params.id);
      res.json({ success: true, data: prescription });
    } catch (error) {
      if (error.status === 404) return res.status(404).json({ success: false, error: error.message });
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const userId = req.user.userId;
      const { specialistId, appointmentId, items, observations } = req.body;
      const prescription = await prescriptionService.createPrescription(userId, specialistId, { appointmentId, items, observations });
      res.status(201).json({ success: true, data: prescription });
    } catch (error) {
      next(error);
    }
  }
}

export default new PrescriptionController();
