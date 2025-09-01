/**
 * Authentication Routes
 * 
 * Handles user authentication, registration, and session management
 * HIPAA-compliant with audit logging
 */

import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../services/DatabaseService';
import { AuditService } from '../services/AuditService';
import { EncryptionService } from '../services/EncryptionService';

const router = express.Router();
const db = new DatabaseService();
const audit = new AuditService();
const encryption = new EncryptionService();

// CRITICAL SECURITY: Ensure JWT secret is properly configured
const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'fallback-secret' || secret.length < 32) {
    throw new Error('🚨 CRITICAL SECURITY ERROR: JWT_SECRET must be set to a secure value (minimum 32 characters)');
  }
  return secret;
};

// CRITICAL SECURITY: Validate JWT secret on startup
try {
  getJWTSecret();
  console.log('✅ JWT Secret validation passed');
} catch (error) {
  console.error('❌ JWT Secret validation failed:', error);
  process.exit(1); // Prevent insecure startup
}

// Validation rules
const registerValidation = [
  body('email').optional().isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  body('isAnonymous').isBoolean(),
  body('dateOfBirth').optional().isISO8601(),
  body('emergencyContact').optional().isMobilePhone()
];

const loginValidation = [
  body('email').optional().isEmail().normalizeEmail(),
  body('password').optional().isLength({ min: 1 }),
  body('isAnonymous').isBoolean(),
  body('anonymousId').optional().isUUID()
];

/**
 * POST /api/auth/register
 * Register new user (anonymous or authenticated)
 */
router.post('/register', registerValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await audit.logEvent(req.ip, 'auth', 'register_validation_failed', {
        errors: errors.array()
      });
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, isAnonymous, dateOfBirth, emergencyContact } = req.body;

    if (isAnonymous) {
      // Create anonymous user
      const userId = uuidv4();
      const anonymousUser = {
        id: userId,
        isAnonymous: true,
        createdAt: new Date(),
        lastActive: new Date(),
        preferences: {}
      };

      // Store in database (encrypted)
      await db.createUser(anonymousUser);

      // Generate JWT token
      const token = jwt.sign(
        { userId, isAnonymous: true },
        getJWTSecret(),
        { expiresIn: '30d' }
      );

      await audit.logEvent(req.ip, 'auth', 'anonymous_register_success', {
        userId
      });

      res.json({
        success: true,
        token,
        user: {
          id: userId,
          isAnonymous: true,
          createdAt: anonymousUser.createdAt
        },
        message: 'Anonymous account created successfully'
      });

    } else {
      // Create authenticated user
      if (!email || !password) {
        await audit.logEvent(req.ip, 'auth', 'register_missing_credentials', {
          hasEmail: !!email,
          hasPassword: !!password
        });

        return res.status(400).json({
          error: 'Email and password required for authenticated accounts'
        });
      }

      // Check if user already exists
      const existingUser = await db.getUserByEmail(email);
      if (existingUser) {
        await audit.logEvent(req.ip, 'auth', 'register_user_exists', {
          email: encryption.hashPII(email)
        });

        return res.status(400).json({
          error: 'User already exists'
        });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const userId = uuidv4();
      const user = {
        id: userId,
        email: encryption.encryptPII(email),
        password: hashedPassword,
        isAnonymous: false,
        dateOfBirth: dateOfBirth ? encryption.encryptPII(dateOfBirth) : null,
        emergencyContact: emergencyContact ? encryption.encryptPII(emergencyContact) : null,
        createdAt: new Date(),
        lastActive: new Date(),
        preferences: {},
        emailVerified: false
      };

      await db.createUser(user);

      // Generate JWT token
      const token = jwt.sign(
        { userId, isAnonymous: false, email },
        getJWTSecret(),
        { expiresIn: '7d' }
      );

      await audit.logEvent(req.ip, 'auth', 'register_success', {
        userId,
        email: encryption.hashPII(email)
      });

      res.json({
        success: true,
        token,
        user: {
          id: userId,
          email,
          isAnonymous: false,
          createdAt: user.createdAt,
          emailVerified: false
        },
        message: 'Account created successfully'
      });
    }

  } catch (error) {
    await audit.logEvent(req.ip, 'auth', 'register_error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Login user (anonymous or authenticated)
 */
router.post('/login', loginValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await audit.logEvent(req.ip, 'auth', 'login_validation_failed', {
        errors: errors.array()
      });
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, isAnonymous, anonymousId } = req.body;

    if (isAnonymous) {
      // Anonymous login with existing ID
      if (!anonymousId) {
        await audit.logEvent(req.ip, 'auth', 'anonymous_login_missing_id');
        
        return res.status(400).json({
          error: 'Anonymous ID required for anonymous login'
        });
      }

      const user = await db.getUserById(anonymousId);
      if (!user || !user.isAnonymous) {
        await audit.logEvent(req.ip, 'auth', 'anonymous_login_user_not_found', {
          anonymousId
        });
        
        return res.status(401).json({
          error: 'Invalid anonymous user'
        });
      }

      // Update last active
      await db.updateUserLastActive(anonymousId);

      // Generate new token
      const token = jwt.sign(
        { userId: anonymousId, isAnonymous: true },
        getJWTSecret(),
        { expiresIn: '30d' }
      );

      await audit.logEvent(req.ip, 'auth', 'anonymous_login_success', {
        userId: anonymousId
      });

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          isAnonymous: true,
          lastActive: new Date()
        },
        message: 'Anonymous login successful'
      });

    } else {
      // Authenticated login
      if (!email || !password) {
        await audit.logEvent(req.ip, 'auth', 'login_missing_credentials');
        
        return res.status(400).json({
          error: 'Email and password required'
        });
      }

      // Find user by email
      const user = await db.getUserByEmail(email);
      if (!user || user.isAnonymous) {
        await audit.logEvent(req.ip, 'auth', 'login_user_not_found', {
          email: encryption.hashPII(email)
        });
        
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }

      // Verify password
      const passwordValid = await bcrypt.compare(password, user.password);
      if (!passwordValid) {
        await audit.logEvent(req.ip, 'auth', 'login_invalid_password', {
          userId: user.id,
          email: encryption.hashPII(email)
        });
        
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }

      // Update last active
      await db.updateUserLastActive(user.id);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, isAnonymous: false, email },
        getJWTSecret(),
        { expiresIn: '7d' }
      );

      await audit.logEvent(req.ip, 'auth', 'login_success', {
        userId: user.id,
        email: encryption.hashPII(email)
      });

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: encryption.decryptPII(user.email),
          isAnonymous: false,
          lastActive: new Date(),
          emailVerified: user.emailVerified
        },
        message: 'Login successful'
      });
    }

  } catch (error) {
    await audit.logEvent(req.ip, 'auth', 'login_error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Token required'
      });
    }

    // Verify existing token (even if expired)
    try {
      const decoded = jwt.verify(token, getJWTSecret(), { ignoreExpiration: true }) as any;
      
      // Generate new token
      const newToken = jwt.sign(
        { userId: decoded.userId, isAnonymous: decoded.isAnonymous, email: decoded.email },
        getJWTSecret(),
        { expiresIn: decoded.isAnonymous ? '30d' : '7d' }
      );

      await audit.logEvent(req.ip, 'auth', 'token_refresh_success', {
        userId: decoded.userId
      });

      res.json({
        success: true,
        token: newToken,
        message: 'Token refreshed successfully'
      });

    } catch (jwtError) {
      await audit.logEvent(req.ip, 'auth', 'token_refresh_invalid');
      
      res.status(401).json({
        error: 'Invalid token'
      });
    }

  } catch (error) {
    await audit.logEvent(req.ip, 'auth', 'token_refresh_error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Logout user (invalidate token)
 */
router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In a production system, you'd maintain a blacklist of invalidated tokens
    // or use short-lived tokens with refresh tokens stored in database

    await audit.logEvent(req.ip, 'auth', 'logout_success');

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    await audit.logEvent(req.ip, 'auth', 'logout_error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        error: 'No authorization header'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getJWTSecret()) as any;

    const user = await db.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: 'User not found'
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email ? encryption.decryptPII(user.email) : null,
        isAnonymous: user.isAnonymous,
        createdAt: user.createdAt,
        lastActive: user.lastActive,
        emailVerified: user.emailVerified
      }
    });

  } catch (error) {
    res.status(401).json({
      error: 'Invalid token'
    });
  }
});

export default router;