// controllers/authController.js
import authService from '../services/authService.js';
import logger from '../config/logger.js';

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.validatedBody);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          error: 'Email already registered',
        });
      }
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const result = await authService.login(req.validatedBody);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
      }

      if (error.message === 'Account is disabled') {
        return res.status(403).json({
          success: false,
          error: 'Account is disabled',
        });
      }

      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const user = await authService.getUserById(req.user.userId);

      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          dateOfBirth: user.date_of_birth,
          gender: user.gender,
          baselineStatus: user.baseline_status,
          careplusMemberId: user.careplus_member_id,
          careplusPlanType: user.careplus_plan_type,
          createdAt: user.created_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
