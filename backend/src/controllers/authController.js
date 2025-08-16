import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.js';
import reviewService from '../services/reviewService.js';
import rankService from '../services/rankService.js';

// Register new user
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    console.log('Registration attempt for:', { name, email, role });

    // Validate required fields
    if (!name || !email || !password) {
      console.log('Missing required fields:', { name: !!name, email: !!email, password: !!password });
      return res.status(400).json({
        error: 'Name, email, and password are required.'
      });
    }

    // Validate role
    const validRoles = ['TENANT', 'LANDLORD', 'ADMIN'];
    if (role && !validRoles.includes(role)) {
      console.log('Invalid role provided:', role);
      return res.status(400).json({
        error: 'Role must be either TENANT, LANDLORD, or ADMIN.'
      });
    }

    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({
        error: 'Server configuration error. Please contact administrator.'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('User already exists with email:', email);
      return res.status(409).json({
        error: 'User with this email already exists.'
      });
    }

    console.log('Creating new user with email:', email);

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'TENANT' // Default to TENANT if no role provided
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    console.log('User created successfully:', { id: user.id, email: user.email, role: user.role });

    // 🏆 Initialize 5-star rating for new user
    try {
      await reviewService.initializeUserRating(user.id);
      console.log('✅ 5-star rating initialized for new user:', user.id);
    } catch (reviewError) {
      console.error('⚠️ Failed to initialize user rating:', reviewError);
      // Don't fail registration if rating initialization fails
    }

    // 🏆 Initialize user rank
    try {
      await rankService.calculateUserRank(user.id);
      console.log('✅ User rank initialized for new user:', user.id);
    } catch (rankError) {
      console.error('⚠️ Failed to initialize user rank:', rankError);
      // Set default rank manually if service fails
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            rank: 'NEW_USER',
            rankPoints: 0,
            rankUpdatedAt: new Date()
          }
        });
        console.log('✅ Default rank set manually for new user:', user.id);
      } catch (manualRankError) {
        console.error('⚠️ Failed to set manual default rank:', manualRankError);
      }
    }

    // Generate JWT token for the new user
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
      }
    );

    console.log('JWT token generated for new user:', email);

    res.status(201).json({
      message: 'User registered successfully.',
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      error: 'Internal server error. Please try again later.'
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt for email:', email);

    // Validate required fields
    if (!email || !password) {
      console.log('Missing required fields:', { email: !!email, password: !!password });
      return res.status(400).json({
        error: 'Email and password are required.'
      });
    }

    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({
        error: 'Server configuration error. Please contact administrator.'
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({
        error: 'Invalid email or password.'
      });
    }

    console.log('User found:', { id: user.id, email: user.email, role: user.role });

    // Check if user has a password (social login users might not have passwords)
    if (!user.password) {
      console.log('User has no password (social login user):', email);
      return res.status(401).json({
        error: 'This account was created via social login. Please use the social login option.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({
        error: 'Invalid email or password.'
      });
    }

    console.log('Password verified successfully for user:', email);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
      }
    );

    console.log('JWT token generated successfully for user:', email);

    // Return user info (without password) and token
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful.',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      error: 'Internal server error. Please try again later.'
    });
  }
};

// Get current user info
const getMe = async (req, res) => {
  try {
    // User info is already attached to req.user by the middleware
    res.json({
      user: req.user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Current password and new password are required.'
      });
    }

    // Validate new password length
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'New password must be at least 8 characters long.'
      });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found.'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        error: 'Current password is incorrect.'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    res.json({
      message: 'Password updated successfully.'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

export {
  register,
  login,
  getMe,
  changePassword
}; 