// middleware/validate.js
import Joi from 'joi';
import logger from '../config/logger.js';

export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      logger.warn({ errors }, 'Validation failed');

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    req.validatedBody = value;
    next();
  };
};

// Common validation schemas
export const schemas = {
  // User registration
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    fullName: Joi.string().min(2).max(255).required(),
    dateOfBirth: Joi.date().max('now').optional(),
    gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional(),
  }),

  // User login
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  // Signal ingestion
  signalBatch: Joi.object({
    signals: Joi.array()
      .items(
        Joi.object({
          signalType: Joi.string().required(), // HRV, sleep_duration, etc
          value: Joi.number().required(),
          timestamp: Joi.date().iso().required(),
          source: Joi.string().optional(),
          metadata: Joi.object().optional(),
        })
      )
      .min(1)
      .required(),
  }),

  // Questionnaire response
  questionnaireResponse: Joi.object({
    questionnaireCode: Joi.string().required(), // PSS, CBI, OLBI, DAILY_CHECKIN
    responses: Joi.object().required(), // {q1: 3, q2: 5, ...}
    contextNotes: Joi.string().max(500).allow(null).optional(),
  }),

  // User context
  userContext: Joi.object({
    contextCode: Joi.string().required(), // illness_minor, vacation, work_deadline
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().optional(),
    severity: Joi.string().valid('mild', 'moderate', 'severe').optional(),
    notes: Joi.string().max(1000).optional(),
  }),
};
