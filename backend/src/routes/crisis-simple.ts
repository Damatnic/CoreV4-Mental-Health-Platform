import { logger } from '../utils/logger';
/**
 * Simple Crisis Routes for Mental Health Platform
 * Essential crisis intervention endpoints
 */

import express, { Request, Response } from 'express';

const router = express.Router();

// Crisis hotlines and resources
const CRISIS_RESOURCES = {
  hotlines: [
    {
      name: "National Suicide Prevention Lifeline",
      number: "988",
      available24h: true,
      description: "24/7 free and confidential support for people in distress"
    },
    {
      name: "Crisis Text Line",
      text: "741741",
      available24h: true,
      description: "Text HOME to 741741 for 24/7 crisis support"
    },
    {
      name: "National Domestic Violence Hotline",
      number: "1-800-799-7233",
      available24h: true,
      description: "Confidential support for domestic violence survivors"
    }
  ],
  strategies: [
    {
      title: "Deep Breathing",
      description: "Take slow, deep breaths. Inhale for 4 counts, hold for 4, exhale for 6.",
      duration: "2-5 minutes"
    },
    {
      title: "Grounding Technique (5-4-3-2-1)",
      description: "Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.",
      duration: "3-5 minutes"
    },
    {
      title: "Progressive Muscle Relaxation",
      description: "Tense and then relax each muscle group, starting from your toes.",
      duration: "10-15 minutes"
    }
  ]
};

// Get crisis resources
router.get('/resources', (req: Request, res: Response) => {
  res.json({
    success: true,
    resources: CRISIS_RESOURCES,
    timestamp: new Date().toISOString(),
    message: "If you're in immediate danger, call 911 or go to your nearest emergency room"
  });
});

// Get immediate help
router.get('/help', (req: Request, res: Response) => {
  res.json({
    success: true,
    emergency: {
      primary: {
        number: "988",
        text: "Call 988 for immediate crisis support"
      },
      backup: {
        number: "911",
        text: "Call 911 for emergency services"
      },
      textSupport: {
        number: "741741",
        text: "Text HOME to 741741 for crisis text support"
      }
    },
    quickCoping: CRISIS_RESOURCES.strategies.slice(0, 2),
    timestamp: new Date().toISOString()
  });
});

// Log crisis event (for analytics, not personal data)
router.post('/event', (req: Request, res: Response) => {
  try {
    const { type, severity, resolved } = req.body;
    
    // Log crisis event anonymously (no personal data stored)
    const crisisEvent = {
      id: Date.now().toString(),
      type: type || 'general',
      severity: severity || 'medium',
      resolved: resolved || false,
      timestamp: new Date().toISOString(),
      // No user identification stored for privacy
    };

    logger.info('Crisis event logged:', {
      type: crisisEvent.type,
      severity: crisisEvent.severity,
      timestamp: crisisEvent.timestamp
    });

    res.json({
      success: true,
      message: 'Crisis event logged for platform improvement',
      resources: CRISIS_RESOURCES.hotlines[0], // Always return primary hotline
      timestamp: crisisEvent.timestamp
    });

  } catch {
    logger.error('Crisis event logging error: ');
    
    // Even if logging fails, still provide crisis resources
    res.status(200).json({
      success: true,
      message: 'Crisis resources available',
      resources: CRISIS_RESOURCES.hotlines[0],
      timestamp: new Date().toISOString()
    });
  }
});

// Get coping strategies
router.get('/coping', (req: Request, res: Response) => {
  const { urgent } = req.query;
  
  let strategies = CRISIS_RESOURCES.strategies;
  
  if (urgent === 'true') {
    // Return immediate coping strategies
    strategies = strategies.filter(s => 
      s.title.includes('Breathing') || s.title.includes('5-4-3-2-1')
    );
  }

  res.json({
    success: true,
    strategies,
    emergency: CRISIS_RESOURCES.hotlines[0],
    timestamp: new Date().toISOString()
  });
});

// Health check for crisis service
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'crisis',
    resources: {
      hotlines: CRISIS_RESOURCES.hotlines.length,
      strategies: CRISIS_RESOURCES.strategies.length
    },
    timestamp: new Date().toISOString()
  });
});

export default router;