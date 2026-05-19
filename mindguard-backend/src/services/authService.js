// services/authService.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import logger from '../config/logger.js';

class AuthService {
  async register({ email, password, fullName, dateOfBirth, gender }) {
    try {
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Insert user
      const result = await query(
        `INSERT INTO users (email, password_hash, full_name, date_of_birth, gender, baseline_status)
         VALUES ($1, $2, $3, $4, $5, 'collecting')
         RETURNING id, email, full_name, created_at`,
        [email, passwordHash, fullName, dateOfBirth || null, gender || null]
      );

      const user = result.rows[0];

      logger.info({ userId: user.id, email }, 'User registered');

      // Generate token
      const token = this.generateToken(user.id, user.email);

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          createdAt: user.created_at,
        },
        token,
      };
    } catch (error) {
      logger.error({ error, email }, 'Registration failed');
      throw error;
    }
  }

  async login({ email, password }) {
    try {
      // Find user
      const result = await query(
        `SELECT id, email, password_hash, full_name, baseline_status, is_active
         FROM users
         WHERE email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        throw new Error('Invalid credentials');
      }

      const user = result.rows[0];

      if (!user.is_active) {
        throw new Error('Account is disabled');
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash);

      if (!isValid) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      await query(
        `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1`,
        [user.id]
      );

      logger.info({ userId: user.id, email }, 'User logged in');

      // Generate token
      const token = this.generateToken(user.id, user.email);

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          baselineStatus: user.baseline_status,
        },
        token,
      };
    } catch (error) {
      logger.error({ error, email }, 'Login failed');
      throw error;
    }
  }

  generateToken(userId, email) {
    return jwt.sign(
      { userId, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  async getUserById(userId) {
    const result = await query(
      `SELECT id, email, full_name, date_of_birth, gender, baseline_status, 
              careplus_member_id, careplus_plan_type, created_at
       FROM users
       WHERE id = $1 AND is_active = TRUE`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }
}

export default new AuthService();
