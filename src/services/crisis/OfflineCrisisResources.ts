// Offline Crisis Resources - Ensures critical crisis support works without internet
// CRITICAL: These resources must be available 24/7 regardless of connectivity

import { secureStorage } from '../security/SecureLocalStorage';
import { logger } from '../../utils/logger';

// Offline Crisis Resource Types
export interface OfflineCrisisResource {
  id: string;
  type: 'hotline' | 'technique' | 'safety_plan' | 'emergency_contact' | 'self_help' | 'breathing' | 'grounding';
  title: string;
  content: string;
  urgency: 'immediate' | 'urgent' | 'important' | 'helpful';
  category: string;
  estimatedTime?: string;
  instructions?: string[];
  audioGuidance?: string; // For offline audio files
  accessibility?: {
    screenReader: boolean;
    keyboardNav: boolean;
    highContrast: boolean;
  };
  lastUpdated: Date;
}

export interface OfflineEmergencyContact {
  id: string;
  name: string;
  phone: string;
  type: 'crisis_line' | 'emergency' | 'personal' | 'professional';
  available24_7: boolean;
  description: string;
  instructions: string;
}

export interface OfflineSafetyPlan {
  id: string;
  userId?: string;
  warningSignals: string[];
  copingStrategies: string[];
  socialContacts: string[];
  professionalContacts: string[];
  environmentSafety: string[];
  emergencyContacts: string[];
  lastUpdated: Date;
  isActive: boolean;
}

// Critical offline resources that must always be available
export const CRITICAL_OFFLINE_RESOURCES: OfflineCrisisResource[] = [
  {
    id: 'emergency-988',
    type: 'hotline',
    title: '988 Suicide & Crisis Lifeline',
    content: 'Available 24/7 for crisis support. Free, confidential, and staffed by trained crisis counselors.',
    urgency: 'immediate',
    category: 'Emergency Support',
    instructions: [
      'Dial 988 from any phone',
      'Wait to be connected (usually under 1 minute)',
      'Speak with a trained crisis counselor',
      'Your call is confidential and free'
    ],
    accessibility: {
      screenReader: true,
      keyboardNav: true,
      highContrast: true
    },
    lastUpdated: new Date()
  },
  {
    id: 'emergency-911',
    type: 'hotline',
    title: '911 Emergency Services',
    content: 'For life-threatening emergencies requiring immediate medical, police, or fire response.',
    urgency: 'immediate',
    category: 'Emergency Services',
    instructions: [
      'Call 911 immediately',
      'State your emergency clearly',
      'Provide your location',
      'Stay on the line until help arrives',
      'Follow dispatcher instructions'
    ],
    accessibility: {
      screenReader: true,
      keyboardNav: true,
      highContrast: true
    },
    lastUpdated: new Date()
  },
  {
    id: 'crisis-text-line',
    type: 'hotline',
    title: 'Crisis Text Line',
    content: 'Text-based crisis support available 24/7. Text HOME to 741741 to connect with a crisis counselor.',
    urgency: 'immediate',
    category: 'Text Support',
    instructions: [
      'Text HOME to 741741',
      'Wait for response (usually 2-3 minutes)',
      'Text with a trained crisis counselor',
      'All conversations are confidential'
    ],
    accessibility: {
      screenReader: true,
      keyboardNav: true,
      highContrast: true
    },
    lastUpdated: new Date()
  },
  {
    id: 'breathing-4-7-8',
    type: 'breathing',
    title: '4-7-8 Breathing Technique',
    content: 'A calming breathing exercise that can help reduce anxiety and panic in crisis moments.',
    urgency: 'urgent',
    category: 'Self-Help Techniques',
    estimatedTime: '2-5 minutes',
    instructions: [
      'Find a comfortable position',
      'Exhale completely',
      'Inhale through nose for 4 counts',
      'Hold breath for 7 counts',
      'Exhale through mouth for 8 counts',
      'Repeat 3-4 times',
      'Focus only on counting and breathing'
    ],
    accessibility: {
      screenReader: true,
      keyboardNav: true,
      highContrast: true
    },
    lastUpdated: new Date()
  },
  {
    id: 'grounding-5-4-3-2-1',
    type: 'grounding',
    title: '5-4-3-2-1 Grounding Technique',
    content: 'A sensory grounding technique to help you stay present and calm during overwhelming moments.',
    urgency: 'urgent',
    category: 'Grounding Techniques',
    estimatedTime: '3-5 minutes',
    instructions: [
      'Look around and name 5 things you can see',
      'Notice 4 things you can touch',
      'Listen for 3 things you can hear',
      'Identify 2 things you can smell',
      'Name 1 thing you can taste',
      'Take slow, deep breaths throughout',
      'Focus on being present in this moment'
    ],
    accessibility: {
      screenReader: true,
      keyboardNav: true,
      highContrast: true
    },
    lastUpdated: new Date()
  },
  {
    id: 'immediate-safety-checklist',
    type: 'safety_plan',
    title: 'Immediate Safety Checklist',
    content: 'Quick safety steps to take when experiencing crisis thoughts or feelings.',
    urgency: 'immediate',
    category: 'Safety Planning',
    instructions: [
      '✓ Remove any means of self-harm from your immediate area',
      '✓ Call someone you trust or a crisis line',
      '✓ Go to a safe place with other people if possible',
      '✓ Use your coping strategies (breathing, grounding)',
      '✓ Remind yourself that these feelings are temporary',
      '✓ If in immediate danger, call 911',
      '✓ Consider going to an emergency room'
    ],
    accessibility: {
      screenReader: true,
      keyboardNav: true,
      highContrast: true
    },
    lastUpdated: new Date()
  },
  {
    id: 'progressive-muscle-relaxation',
    type: 'technique',
    title: 'Progressive Muscle Relaxation',
    content: 'A technique to reduce physical tension and anxiety by systematically relaxing muscle groups.',
    urgency: 'helpful',
    category: 'Relaxation Techniques',
    estimatedTime: '10-15 minutes',
    instructions: [
      'Find a quiet, comfortable place to sit or lie down',
      'Start with your toes - tense for 5 seconds, then relax',
      'Move to your calves - tense and relax',
      'Continue with thighs, abdomen, hands, arms, shoulders',
      'Tense your face muscles, then relax',
      'Notice the contrast between tension and relaxation',
      'End by taking several deep breaths'
    ],
    accessibility: {
      screenReader: true,
      keyboardNav: true,
      highContrast: true
    },
    lastUpdated: new Date()
  },
  {
    id: 'crisis-affirmations',
    type: 'self_help',
    title: 'Crisis Affirmations',
    content: 'Positive statements to help you through difficult moments.',
    urgency: 'helpful',
    category: 'Self-Help',
    instructions: [
      'This feeling is temporary and will pass',
      'I have survived difficult times before',
      'I am stronger than this moment',
      'Help is available and I deserve support',
      'I can take this one moment at a time',
      'My life has value and meaning',
      'I am not alone in this struggle',
      'Recovery and healing are possible'
    ],
    accessibility: {
      screenReader: true,
      keyboardNav: true,
      highContrast: true
    },
    lastUpdated: new Date()
  }
];

// Default emergency contacts available offline
export const DEFAULT_EMERGENCY_CONTACTS: OfflineEmergencyContact[] = [
  {
    id: '988-lifeline',
    name: '988 Suicide & Crisis Lifeline',
    phone: '988',
    type: 'crisis_line',
    available24_7: true,
    description: 'National suicide prevention and crisis support',
    instructions: 'Dial 988 for immediate crisis support. Free and confidential.'
  },
  {
    id: 'crisis-text',
    name: 'Crisis Text Line',
    phone: '741741',
    type: 'crisis_line',
    available24_7: true,
    description: 'Text-based crisis support',
    instructions: 'Text HOME to 741741 for crisis counseling via text message.'
  },
  {
    id: 'emergency-services',
    name: '911 Emergency Services',
    phone: '911',
    type: 'emergency',
    available24_7: true,
    description: 'Emergency medical, police, and fire services',
    instructions: 'Call 911 for life-threatening emergencies only.'
  },
  {
    id: 'nami-helpline',
    name: 'NAMI HelpLine',
    phone: '1-800-950-6264',
    type: 'crisis_line',
    available24_7: false,
    description: 'Mental health information and referrals',
    instructions: 'Call for mental health information, resources, and referrals. Available Mon-Fri 10am-10pm ET.'
  },
  {
    id: 'samhsa-helpline',
    name: 'SAMHSA National Helpline',
    phone: '1-800-662-4357',
    type: 'professional',
    available24_7: true,
    description: 'Treatment referral and information service',
    instructions: 'Free, confidential treatment referral service for substance abuse and mental health.'
  },
  {
    id: 'domestic-violence-hotline',
    name: 'National Domestic Violence Hotline',
    phone: '1-800-799-7233',
    type: 'crisis_line',
    available24_7: true,
    description: 'Support for domestic violence situations',
    instructions: 'Confidential support for those experiencing domestic violence.'
  }
];

// Offline Crisis Resource Manager
export class OfflineCrisisResourceManager {
  private static instance: OfflineCrisisResourceManager;
  private resources: OfflineCrisisResource[] = [];
  private emergencyContacts: OfflineEmergencyContact[] = [];
  private safetyPlans: OfflineSafetyPlan[] = [];
  private isInitialized: boolean = false;

  private constructor() {
    this.initializeOfflineResources();
  }

  public static getInstance(): OfflineCrisisResourceManager {
    if (!OfflineCrisisResourceManager.instance) {
      OfflineCrisisResourceManager.instance = new OfflineCrisisResourceManager();
    }
    return OfflineCrisisResourceManager.instance;
  }

  // Initialize offline resources
  private async initializeOfflineResources(): Promise<void> {
    try {
      // Load critical resources
      this.resources = [...CRITICAL_OFFLINE_RESOURCES];
      
      // Load default emergency contacts
      this.emergencyContacts = [...DEFAULT_EMERGENCY_CONTACTS];
      
      // Load any _saved custom resources
      await this.loadCustomResources();
      
      // Load safety plans
      await this.loadSafetyPlans();
      
      this.isInitialized = true;
      logger.info('Offline crisis resources initialized successfully', 'OfflineCrisisResources');
    } catch {
      logger.error('Failed to initialize offline crisis resources:');
      // Even if loading fails, ensure critical resources are available
      this.resources = [...CRITICAL_OFFLINE_RESOURCES];
      this.emergencyContacts = [...DEFAULT_EMERGENCY_CONTACTS];
      this.isInitialized = true;
    }
  }

  // Load custom resources from storage
  private async loadCustomResources(): Promise<void> {
    try {
      const _saved = secureStorage.getItem('offline_crisis_resources');
      if (_saved) {
        const _customResources = JSON.parse(_saved) as OfflineCrisisResource[];
        this.resources = [...this.resources, ..._customResources];
      }

      const _savedContacts = secureStorage.getItem('offline_emergency_contacts');
      if (_savedContacts) {
        const _customContacts = JSON.parse(_savedContacts) as OfflineEmergencyContact[];
        this.emergencyContacts = [...this.emergencyContacts, ..._customContacts];
      }
    } catch {
      logger.error('Failed to load custom offline resources:');
    }
  }

  // Load safety plans
  private async loadSafetyPlans(): Promise<void> {
    try {
      const _saved = secureStorage.getItem('offline_safety_plans');
      if (_saved) {
        this.safetyPlans = JSON.parse(_saved);
      }
    } catch {
      logger.error('Failed to load safety plans:');
      this.safetyPlans = [];
    }
  }

  // Get all resources by urgency
  public getResourcesByUrgency(urgency: 'immediate' | 'urgent' | 'important' | 'helpful'): OfflineCrisisResource[] {
    return this.resources.filter(resource => resource.urgency === urgency);
  }

  // Get resources by type
  public getResourcesByType(type: OfflineCrisisResource['type']): OfflineCrisisResource[] {
    return this.resources.filter(resource => resource.type === type);
  }

  // Get immediate crisis resources
  public getImmediateCrisisResources(): OfflineCrisisResource[] {
    return this.resources.filter(resource => 
      resource.urgency === 'immediate' || 
      (resource.type === 'hotline' && resource.urgency === 'urgent')
    ).sort((a, b) => {
      const urgencyOrder = { 'immediate': 0, 'urgent': 1, 'important': 2, 'helpful': 3 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
  }

  // Get emergency contacts
  public getEmergencyContacts(): OfflineEmergencyContact[] {
    return this.emergencyContacts.sort((a, b) => {
      if (a.available24_7 && !b.available24_7) return -1;
      if (!a.available24_7 && b.available24_7) return 1;
      const typeOrder = { 'emergency': 0, 'crisis_line': 1, 'professional': 2, 'personal': 3 };
      return typeOrder[a.type] - typeOrder[b.type];
    });
  }

  // Get crisis hotlines only
  public getCrisisHotlines(): OfflineEmergencyContact[] {
    return this.emergencyContacts.filter(contact => 
      contact.type === 'crisis_line' || contact.type === 'emergency'
    );
  }

  // Get breathing exercises
  public getBreathingExercises(): OfflineCrisisResource[] {
    return this.getResourcesByType('breathing');
  }

  // Get grounding techniques
  public getGroundingTechniques(): OfflineCrisisResource[] {
    return this.getResourcesByType('grounding');
  }

  // Search resources
  public searchResources(query: string): OfflineCrisisResource[] {
    const _lowercaseQuery = query.toLowerCase();
    return this.resources.filter(resource =>
      resource.title.toLowerCase().includes(_lowercaseQuery) ||
      resource.content.toLowerCase().includes(_lowercaseQuery) ||
      resource.category.toLowerCase().includes(_lowercaseQuery) ||
      resource.instructions?.some(instruction => 
        instruction.toLowerCase().includes(_lowercaseQuery)
      )
    );
  }

  // Add custom resource
  public addCustomResource(resource: OfflineCrisisResource): void {
    resource.id = `custom-${Date.now()}`;
    resource.lastUpdated = new Date();
    this.resources.push(resource);
    this.saveCustomResources();
  }

  // Add custom emergency contact
  public addCustomEmergencyContact(contact: OfflineEmergencyContact): void {
    contact.id = `custom-${Date.now()}`;
    this.emergencyContacts.push(_contact);
    this.saveCustomResources();
  }

  // Save custom resources to storage
  private saveCustomResources(): void {
    try {
      const _customResources = this.resources.filter(r => r.id.startsWith('custom-'));
      secureStorage.setItem('offline_crisis_resources', JSON.stringify(_customResources));
      
      const _customContacts = this.emergencyContacts.filter(c => c.id.startsWith('custom-'));
      secureStorage.setItem('offline_emergency_contacts', JSON.stringify(_customContacts));
    } catch {
      logger.error('Failed to save custom resources:');
    }
  }

  // Create or update safety plan
  public createSafetyPlan(plan: Partial<OfflineSafetyPlan>): OfflineSafetyPlan {
    const safetyPlan: OfflineSafetyPlan = {
      id: plan.id || `safety-plan-${Date.now()}`,
      userId: plan.userId,
      warningSignals: plan.warningSignals || [],
      copingStrategies: plan.copingStrategies || [],
      socialContacts: plan.socialContacts || [],
      professionalContacts: plan.professionalContacts || [],
      environmentSafety: plan.environmentSafety || [],
      emergencyContacts: plan.emergencyContacts || [],
      lastUpdated: new Date(),
      isActive: plan.isActive !== false
    };

    // Remove existing plan with same id
    this.safetyPlans = this.safetyPlans.filter(p => p.id !== safetyPlan.id);
    
    // Add new plan
    this.safetyPlans.push(_safetyPlan);
    this.saveSafetyPlans();
    
    return safetyPlan;
  }

  // Get active safety plan
  public getActiveSafetyPlan(userId?: string): OfflineSafetyPlan | null {
    const activePlans = this.safetyPlans.filter(plan => 
      plan.isActive && (userId ? plan.userId === userId : true)
    );
    
    // Return most recent active plan
    return activePlans.sort((a, b) => 
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    )[0] || null;
  }

  // Save safety plans to storage
  private saveSafetyPlans(): void {
    try {
      secureStorage.setItem('offline_safety_plans', JSON.stringify(this.safetyPlans));
    } catch {
      logger.error('Failed to save safety plans:');
    }
  }

  // Check if resources are available offline
  public isAvailableOffline(): boolean {
    return this.isInitialized && this.resources.length > 0 && this.emergencyContacts.length > 0;
  }

  // Get connection status
  public getConnectionStatus(): {
    isOnline: boolean;
    hasOfflineResources: boolean;
    resourceCount: number;
    lastUpdated: Date | null;
  } {
    return {
      isOnline: navigator.onLine,
      hasOfflineResources: this.isAvailableOffline(),
      resourceCount: this.resources.length,
      lastUpdated: this.resources.length > 0 ? 
        new Date(Math.max(...this.resources.map(r => r.lastUpdated.getTime()))) : null
    };
  }

  // Update resource cache (when online)
  public async updateResourceCache(): Promise<void> {
    if (!navigator.onLine) {
      logger.warn('Cannot update resource cache - offline');
      return;
    }

    try {
      // In production, this would fetch updated resources from server
      logger.info('Updating offline resource cache...', 'OfflineCrisisResources');
      
      // Update timestamps for existing resources
      this.resources.forEach(resource => {
        if (!resource.id.startsWith('custom-')) {
          resource.lastUpdated = new Date();
        }
      });
      
      this.saveCustomResources();
      logger.info('Offline resource cache updated', 'OfflineCrisisResources');
    } catch {
      logger.error('Failed to update resource cache:');
    }
  }

  // Export safety plan as text (for sharing or backup)
  public exportSafetyPlan(planId: string): string | null {
    const plan = this.safetyPlans.find(p => p.id === planId);
    if (!plan) return null;

    return `
PERSONAL SAFETY PLAN
Last Updated: ${plan.lastUpdated.toLocaleDateString()}

WARNING SIGNALS:
${plan.warningSignals.map(signal => `• ${signal}`).join('\n')}

COPING STRATEGIES:
${plan.copingStrategies.map(strategy => `• ${strategy}`).join('\n')}

SOCIAL SUPPORT CONTACTS:
${plan.socialContacts.map(contact => `• ${contact}`).join('\n')}

PROFESSIONAL CONTACTS:
${plan.professionalContacts.map(contact => `• ${contact}`).join('\n')}

ENVIRONMENT SAFETY STEPS:
${plan.environmentSafety.map(step => `• ${step}`).join('\n')}

EMERGENCY CONTACTS:
${plan.emergencyContacts.map(contact => `• ${contact}`).join('\n')}

CRISIS HOTLINES:
• 988 Suicide & Crisis Lifeline
• Text HOME to 741741 (Crisis Text Line)
• 911 for emergencies

Remember: This feeling is temporary. You have support. Help is available.
    `.trim();
  }
}

// Export singleton instance
export const __offlineCrisisResources = OfflineCrisisResourceManager.getInstance();