/**
 * CoreV4 Mental Health Platform - Minimal Backend Server
 * 
 * Basic working server for immediate deployment
 * Focuses on critical routes: auth and crisis intervention
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import simple working routes
import authRoutes from './routes/auth-simple';
import crisisRoutes from './routes/crisis-simple';
import winston from 'winston';

// Load environment variables
dotenv.config();

// Configure logger for this module
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'server-minimal' },
  transports: [
    new winston.transports.Console()
  ]
});

class MinimalMentalHealthServer {
  private app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3001');
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.FRONTEND_URLS?.split(',') || [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://astralcore1.netlify.app'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Rate limiting - more restrictive for production
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === 'production' ? 100 : 1000,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.app.use(limiter);
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/api/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime()
      });
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/crisis', crisisRoutes);

    // Catch-all for unmatched API routes
    this.app.all('/api/*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'API endpoint not found',
        path: req.path,
        method: req.method
      });
    });

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        message: 'CoreV4 Mental Health Platform API',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
          health: '/api/health',
          auth: '/api/auth',
          crisis: '/api/crisis'
        }
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
      });
    });

    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
      logger.error('Server Error:', {
        error: error?.message || 'Unknown error',
        stack: error?.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
      });

      res.status(error?.status || 500).json({
        error: process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : error?.message || 'Unknown error',
        timestamp: new Date().toISOString()
      });
    });
  }

  public start(): void {
    try {
      this.app.listen(this.port, () => {
        logger.info(`🚀 CoreV4 Mental Health API Server`);
        logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`🔗 Server: http://localhost:${this.port}`);
        logger.info(`🏥 Health: http://localhost:${this.port}/api/health`);
        logger.info(`🔐 Auth: http://localhost:${this.port}/api/auth`);
        logger.info(`🚨 Crisis: http://localhost:${this.port}/api/crisis`);
        
        if (process.env.NODE_ENV === 'development') {
          logger.info(`📝 Logs: Debug mode enabled`);
        }
        
        logger.info('✅ Server ready for mental health platform deployment');
      });
    } catch (error) {
      logger.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new MinimalMentalHealthServer();
  server.start();
}

export default MinimalMentalHealthServer;