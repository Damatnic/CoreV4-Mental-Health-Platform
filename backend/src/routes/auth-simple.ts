/**
 * Simple Auth Routes for Mental Health Platform
 * Minimal implementation for immediate deployment
 */

import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../../src/utils/logger';

const router = express.Router();

// Simple in-memory storage (replace with database in production)
interface User {
  id: string;
  isAnonymous: boolean;
  createdAt: string;
  lastActive: string;
  preferences: {
    theme: string;
    notifications: boolean;
  };
}

const users = new Map<string, User>();

// Helper function to get JWT secret
const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET || 'development-secret-change-in-production';
  if (secret === 'development-secret-change-in-production' && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  return secret;
};

// Anonymous registration
router.post('/register/anonymous', async (req: Request, res: Response) => {
  try {
    const userId = uuidv4();
    const anonymousUser = {
      id: userId,
      isAnonymous: true,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      preferences: {
        theme: 'light',
        notifications: false
      }
    };

    users.set(userId, anonymousUser);

    const token = jwt.sign(
      { userId, isAnonymous: true },
      getJWTSecret(),
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      user: {
        id: userId,
        isAnonymous: true,
        createdAt: anonymousUser.createdAt
      },
      token,
      message: 'Anonymous user registered successfully'
    });

  } catch (_error) /* eslint-disable-line @typescript-eslint/no-unused-vars */ {
    logger.error('Anonymous registration error: ', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: 'Unable to create anonymous user'
    });
  }
});

// Token validation
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token required'
      });
    }

    const decoded = jwt.verify(token, getJWTSecret()) as { userId: string; isAnonymous: boolean };
    const user = users.get(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update last active
    user.lastActive = new Date().toISOString();
    users.set(user.id, user);

    res.json({
      success: true,
      user: {
        id: user.id,
        isAnonymous: user.isAnonymous,
        lastActive: user.lastActive
      },
      valid: true
    });

  } catch (_error) /* eslint-disable-line @typescript-eslint/no-unused-vars */ {
    logger.error('Token validation error: ', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token',
      valid: false
    });
  }
});

// Get current user
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No authorization header'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getJWTSecret()) as { userId: string; isAnonymous: boolean };
    const user = users.get(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        isAnonymous: user.isAnonymous,
        createdAt: user.createdAt,
        lastActive: user.lastActive,
        preferences: user.preferences
      }
    });

  } catch (_error) /* eslint-disable-line @typescript-eslint/no-unused-vars */ {
    logger.error('Get user error: ', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
});

// Health check for auth service
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'auth',
    users: users.size,
    timestamp: new Date().toISOString()
  });
});

export default router;