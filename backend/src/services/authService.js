import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

export class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Object} Created user and token
   */
  static async register(userData) {
    try {
      const { name, email, password, role = 'TENANT' } = userData;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      logger.info(`New user registered: ${user.email} with role: ${user.role}`);

      return { user, token };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   * @param {Object} credentials - User login credentials
   * @returns {Object} User data and token
   */
  static async login(credentials) {
    try {
      const { email, password } = credentials;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      logger.info(`User logged in: ${user.email}`);

      return { user: userWithoutPassword, token };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {boolean} Success status
   */
  static async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      logger.info(`Password changed for user: ${user.email}`);

      return true;
    } catch (error) {
      logger.error('Password change error:', error);
      throw error;
    }
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Object} Decoded token payload
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}
