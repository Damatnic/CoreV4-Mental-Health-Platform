/**
 * CoreV4 Mental Health Platform Backend Server
 * 
 * HIPAA-compliant, secure API server for mental health data
 * Features: Authentication, Crisis Intervention, Wellness Tracking, Community Support
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import winston from 'winston';

// Import routes
import authRoutes from './routes/auth';
import crisisRoutes from './routes/crisis';
import wellnessRoutes from './routes/wellness';
import communityRoutes from './routes/community';
import professionalRoutes from './routes/professional';
import auditRoutes from './routes/audit';

// Import middleware
import { authenticateToken } from './middleware/auth';
import { auditMiddleware } from './middleware/audit';
import { errorHandler } from './middleware/errorHandler';
import { securityHeaders } from './middleware/security';

// Import services
import { DatabaseService } from './services/DatabaseService';
import { CrisisService } from './services/CrisisService';
// import { EncryptionService } from './services/EncryptionService'; // Not currently used

// Load environment variables
dotenv.config();

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'corev4-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

class CoreV4Server {
  private app: Application;
  private server: unknown;
  private io: Server;
  private port: number;
  private databaseService: DatabaseService;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3001');
    this.databaseService = new DatabaseService();
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeSocketIO();
    this.initializeErrorHandling();
  }

  /**
   * Initialize security and utility middleware
   */
  private initializeMiddleware(): void {
    // Security headers
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "ws:"],
          scriptSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false
    }));

    // Compression
    this.app.use(compression());

    // CORS
    this.app.use(cors({
      origin: process.env.FRONTEND_URLS?.split(',') || ['http://localhost:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Rate limiting
    this.app.use(rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP
      message: {
        error: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false,
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Custom security middleware
    this.app.use(securityHeaders);

    // Audit middleware for HIPAA compliance
    this.app.use(auditMiddleware);

    // Health check endpoint (no auth required)
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // API documentation
    this.app.get('/api', (req: Request, res: Response) => {
      res.json({
        name: 'CoreV4 Mental Health Platform API',
        version: '1.0.0',
        description: 'HIPAA-compliant mental health support API',
        endpoints: {
          auth: '/api/auth',
          crisis: '/api/crisis',
          wellness: '/api/wellness',
          community: '/api/community',
          professional: '/api/professional',
          audit: '/api/audit'
        },
        documentation: 'https://docs.corev4.health/api'
      });
    });
  }

  /**
   * Initialize API routes
   */
  private initializeRoutes(): void {
    // Public routes (no authentication required)
    this.app.use('/api/auth', authRoutes);

    // Protected routes (authentication required)
    this.app.use('/api/crisis', authenticateToken, crisisRoutes);
    this.app.use('/api/wellness', authenticateToken, wellnessRoutes);
    this.app.use('/api/community', authenticateToken, communityRoutes);
    this.app.use('/api/professional', authenticateToken, professionalRoutes);
    this.app.use('/api/audit', authenticateToken, auditRoutes);

    // 404 handler for unmatched routes
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Resource not found',
        code: 'NOT_FOUND',
        path: req.originalUrl
      });
    });
  }

  /**
   * Initialize Socket.IO for real-time features
   */
  private initializeSocketIO(): void {
    this.server = createServer(this.app);
    
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.FRONTEND_URLS?.split(',') || ['http://localhost:5173'],
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    // Socket.IO middleware for authentication
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
        if (!token) {
          throw new Error('No authentication token');
        }

        // Verify token (implement your token verification logic)
        // const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // socket.userId = decoded.userId;
        
        next();
      } catch (_error)   {
        logger.error('Socket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Socket.IO connection handling
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Crisis intervention real-time support
      socket.on('crisis:join', (roomId: string) => {
        socket.join(`crisis:${roomId}`);
        logger.info(`Client ${socket.id} joined crisis room: ${roomId}`);
      });

      socket.on('crisis:message', async (data) => {
        try {
          // Process crisis message through CrisisService
          const crisisService = new CrisisService();
          const response = await crisisService.processMessage(data);
          
          // Broadcast to crisis room
          socket.to(`crisis:${data.roomId}`).emit('crisis:message', response);
          
          // Log for audit
          logger.info('Crisis message processed', { socketId: socket.id, roomId: data.roomId });
        } catch (_error)   {
          logger.error('Crisis message processing failed:', error);
          socket.emit('crisis:error', { message: 'Failed to process message' });
        }
      });

      // Wellness real-time updates
      socket.on('wellness:subscribe', () => {
        socket.join('wellness');
        logger.info(`Client ${socket.id} subscribed to wellness updates`);
      });

      // Community real-time features
      socket.on('community:join', (groupId: string) => {
        socket.join(`community:${groupId}`);
        logger.info(`Client ${socket.id} joined community group: ${groupId}`);
      });

      // Disconnect handling
      socket.on('disconnect', (reason) => {
        logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
      });

      // Error handling
      socket.on('error', (error) => {
        logger.error('Socket error:', error);
      });
    });

    logger.info('Socket.IO initialized for real-time features');
  }

  /**
   * Initialize error handling
   */
  private initializeErrorHandling(): void {
    this.app.use(errorHandler);

    // Global error handlers
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      this.shutdown();
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      this.shutdown();
    });
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      // Initialize database
      await this.databaseService.initialize();
      logger.info('Database initialized successfully');

      // Start HTTP server
      this.server.listen(this.port, () => {
        logger.info(`🏥 CoreV4 Mental Health Platform API`);
        logger.info(`🚀 Server running on port ${this.port}`);
        logger.info(`🔒 HIPAA-compliant security enabled`);
        logger.info(`⚡ Real-time features active`);
        logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        
        if (process.env.NODE_ENV === 'development') {
          logger.info(`📖 API Documentation: http://localhost:${this.port}/api`);
          logger.info(`❤️  Health Check: http://localhost:${this.port}/health`);
        }
      });

    } catch (_error)   {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  private async shutdown(): Promise<void> {
    logger.info('Initiating graceful shutdown...');

    try {
      // Close HTTP server
      if (this.server) {
        await new Promise<void>((resolve) => {
          this.server.close(() => {
            logger.info('HTTP server closed');
            resolve();
          });
        });
      }

      // Close Socket.IO
      if (this.io) {
        this.io.close(() => {
          logger.info('Socket.IO server closed');
        });
      }

      // Close database connections
      await this.databaseService.close();
      logger.info('Database connections closed');

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (_error)   {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Get Express app instance (for testing)
   */
  public getApp(): Application {
    return this.app;
  }

  /**
   * Get Socket.IO instance
   */
  public getIO(): Server {
    return this.io;
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new CoreV4Server();
  server.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export default CoreV4Server;