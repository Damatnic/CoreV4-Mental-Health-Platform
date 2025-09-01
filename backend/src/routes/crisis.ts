/**
 * Crisis Intervention Routes
 * 
 * Handles crisis intervention, emergency contacts, safety plans
 * LIFE-CRITICAL: Maximum reliability and response time
 */

import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { CrisisService } from '../services/CrisisService';
import { AuditService } from '../services/AuditService';
import { NotificationService } from '../services/NotificationService';
import { EncryptionService } from '../services/EncryptionService';

const router = express.Router();
const crisisService = new CrisisService();
const audit = new AuditService();
const notification = new NotificationService();
const encryption = new EncryptionService();

// Validation rules
const crisisAssessmentValidation = [
  body('riskLevel').isIn(['low', 'moderate', 'high', 'severe']),
  body('suicidalIdeation').isBoolean(),
  body('planSpecificity').optional().isIn(['none', 'vague', 'specific', 'detailed']),
  body('means').optional().isArray(),
  body('protectiveFactors').optional().isArray(),
  body('immediateNeeds').isArray(),
  body('responses').isObject()
];

const safetyPlanValidation = [
  body('warningSigns').isArray(),
  body('copingStrategies').isArray(),
  body('supportPeople').isArray(),
  body('professionalContacts').isArray(),
  body('environmentSafety').isArray(),
  body('reasonsForLiving').isArray()
];

const emergencyContactValidation = [
  body('name').isLength({ min: 1, max: 100 }),
  body('phone').isMobilePhone(),
  body('relationship').isLength({ min: 1, max: 50 }),
  body('isPrimary').isBoolean(),
  body('availableHours').optional().isString()
];

/**
 * POST /api/crisis/assessment
 * Submit crisis assessment
 */
router.post('/assessment', crisisAssessmentValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await audit.logEvent(req.ip, 'crisis', 'assessment_validation_failed', {
        userId: req.user?.id,
        errors: errors.array()
      });
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user!.id;
    const assessmentData = req.body;

    // Process crisis assessment
    const result = await crisisService.processAssessment(userId, assessmentData);

    // Log critical event
    await audit.logEvent(req.ip, 'crisis', 'assessment_submitted', {
      userId,
      riskLevel: assessmentData.riskLevel,
      suicidalIdeation: assessmentData.suicidalIdeation,
      assessmentId: result.id
    }, true); // Mark as PHI access

    // Handle high-risk assessments
    if (['high', 'severe'].includes(assessmentData.riskLevel)) {
      // Immediate notifications
      await notification.sendCrisisAlert(userId, result);
      
      // Log emergency intervention
      await audit.logEvent(req.ip, 'crisis', 'emergency_intervention_triggered', {
        userId,
        riskLevel: assessmentData.riskLevel,
        assessmentId: result.id
      }, true);
    }

    res.json({
      success: true,
      assessment: {
        id: result.id,
        riskLevel: result.riskLevel,
        recommendations: result.recommendations,
        resources: result.resources,
        followUpRequired: result.followUpRequired,
        nextSteps: result.nextSteps
      },
      message: 'Crisis assessment completed'
    });

  } catch (error) {
    await audit.logEvent(req.ip, 'crisis', 'assessment_error', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/crisis/assessment/latest
 * Get latest crisis assessment
 */
router.get('/assessment/latest', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    
    const assessment = await crisisService.getLatestAssessment(userId);
    
    if (!assessment) {
      return res.json({
        assessment: null,
        message: 'No previous assessments found'
      });
    }

    await audit.logEvent(req.ip, 'crisis', 'assessment_retrieved', {
      userId,
      assessmentId: assessment.id
    }, true);

    res.json({
      assessment: {
        id: assessment.id,
        riskLevel: assessment.riskLevel,
        createdAt: assessment.createdAt,
        recommendations: assessment.recommendations,
        resources: assessment.resources
      }
    });

  } catch (error) {
    await audit.logEvent(req.ip, 'crisis', 'assessment_retrieval_error', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * POST /api/crisis/safety-plan
 * Create or update safety plan
 */
router.post('/safety-plan', safetyPlanValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user!.id;
    const planData = req.body;

    // Encrypt sensitive plan data
    const encryptedPlan = await crisisService.createSafetyPlan(userId, planData);

    await audit.logEvent(req.ip, 'crisis', 'safety_plan_created', {
      userId,
      planId: encryptedPlan.id,
      hasWarningSigns: planData.warningSigns.length > 0,
      hasCopingStrategies: planData.copingStrategies.length > 0,
      hasSupportPeople: planData.supportPeople.length > 0
    }, true);

    res.json({
      success: true,
      plan: {
        id: encryptedPlan.id,
        createdAt: encryptedPlan.createdAt,
        updatedAt: encryptedPlan.updatedAt
      },
      message: 'Safety plan saved successfully'
    });

  } catch (error) {
    await audit.logEvent(req.ip, 'crisis', 'safety_plan_error', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/crisis/safety-plan
 * Get user's safety plan
 */
router.get('/safety-plan', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    
    const plan = await crisisService.getSafetyPlan(userId);
    
    if (!plan) {
      return res.json({
        plan: null,
        message: 'No safety plan found'
      });
    }

    await audit.logEvent(req.ip, 'crisis', 'safety_plan_retrieved', {
      userId,
      planId: plan.id
    }, true);

    res.json({
      plan: {
        id: plan.id,
        warningSigns: plan.warningSigns,
        copingStrategies: plan.copingStrategies,
        supportPeople: plan.supportPeople,
        professionalContacts: plan.professionalContacts,
        environmentSafety: plan.environmentSafety,
        reasonsForLiving: plan.reasonsForLiving,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt
      }
    });

  } catch (error) {
    await audit.logEvent(req.ip, 'crisis', 'safety_plan_retrieval_error', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * POST /api/crisis/emergency-contact
 * Add emergency contact
 */
router.post('/emergency-contact', emergencyContactValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user!.id;
    const contactData = req.body;

    const contact = await crisisService.addEmergencyContact(userId, contactData);

    await audit.logEvent(req.ip, 'crisis', 'emergency_contact_added', {
      userId,
      contactId: contact.id,
      isPrimary: contactData.isPrimary
    }, true);

    res.json({
      success: true,
      contact: {
        id: contact.id,
        name: contact.name,
        relationship: contact.relationship,
        isPrimary: contact.isPrimary,
        availableHours: contact.availableHours
      },
      message: 'Emergency contact added successfully'
    });

  } catch (error) {
    await audit.logEvent(req.ip, 'crisis', 'emergency_contact_error', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/crisis/emergency-contacts
 * Get user's emergency contacts
 */
router.get('/emergency-contacts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    
    const contacts = await crisisService.getEmergencyContacts(userId);

    await audit.logEvent(req.ip, 'crisis', 'emergency_contacts_retrieved', {
      userId,
      contactCount: contacts.length
    }, true);

    res.json({
      contacts: contacts.map(contact => ({
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
        relationship: contact.relationship,
        isPrimary: contact.isPrimary,
        availableHours: contact.availableHours,
        createdAt: contact.createdAt
      }))
    });

  } catch (error) {
    await audit.logEvent(req.ip, 'crisis', 'emergency_contacts_retrieval_error', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * POST /api/crisis/chat
 * Start crisis chat session
 */
router.post('/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { message, urgencyLevel } = req.body;

    const chatSession = await crisisService.startChatSession(userId, {
      message,
      urgencyLevel: urgencyLevel || 'moderate'
    });

    await audit.logEvent(req.ip, 'crisis', 'chat_session_started', {
      userId,
      sessionId: chatSession.id,
      urgencyLevel: urgencyLevel || 'moderate'
    }, true);

    res.json({
      success: true,
      session: {
        id: chatSession.id,
        status: chatSession.status,
        estimatedWaitTime: chatSession.estimatedWaitTime,
        supportType: chatSession.supportType
      },
      message: 'Crisis chat session started'
    });

  } catch (error) {
    await audit.logEvent(req.ip, 'crisis', 'chat_session_error', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/crisis/resources
 * Get crisis intervention resources
 */
router.get('/resources', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { location, type } = req.query;

    const resources = await crisisService.getCrisisResources({
      location: location as string,
      type: type as string,
      userId
    });

    await audit.logEvent(req.ip, 'crisis', 'resources_retrieved', {
      userId,
      location: location as string,
      type: type as string,
      resourceCount: resources.length
    });

    res.json({
      resources: resources.map(resource => ({
        id: resource.id,
        name: resource.name,
        type: resource.type,
        phone: resource.phone,
        website: resource.website,
        address: resource.address,
        description: resource.description,
        availability: resource.availability,
        languages: resource.languages,
        specialties: resource.specialties
      }))
    });

  } catch (error) {
    await audit.logEvent(req.ip, 'crisis', 'resources_retrieval_error', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * POST /api/crisis/panic-button
 * Emergency panic button activation
 */
router.post('/panic-button', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { location, additionalInfo } = req.body;

    // Immediate crisis response
    const response = await crisisService.handlePanicButton(userId, {
      location,
      additionalInfo,
      timestamp: new Date()
    });

    // Log emergency event
    await audit.logEvent(req.ip, 'crisis', 'panic_button_activated', {
      userId,
      location,
      responseId: response.id
    }, true);

    res.json({
      success: true,
      response: {
        id: response.id,
        emergencyContacts: response.emergencyContacts,
        resources: response.immediateResources,
        nextSteps: response.nextSteps,
        supportAvailable: response.supportAvailable
      },
      message: 'Emergency response activated'
    });

  } catch (error) {
    await audit.logEvent(req.ip, 'crisis', 'panic_button_error', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

export default router;