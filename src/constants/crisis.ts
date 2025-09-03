/**
 * Unified Crisis Constants and Types
 * Single source of truth for all crisis-related constants across the platform
 */

export interface EmergencyContact {
  id: string;
  name: string;
  number?: string;
  contact: string;
  type: 'phone' | 'text' | 'chat' | 'email';
  priority: number;
  description: string;
  availability: '24/7' | 'limited';
  region?: string;
}

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: '988',
    name: '988 Suicide & Crisis Lifeline',
    number: '988',
    contact: 'tel:988',
    type: 'phone',
    priority: 1,
    description: 'National suicide prevention and crisis intervention',
    availability: '24/7',
    region: 'US'
  },
  {
    id: 'crisis-text',
    name: 'Crisis Text Line',
    contact: 'sms:741741?body=HOME',
    type: 'text',
    priority: 2,
    description: 'Crisis intervention via text message',
    availability: '24/7',
    region: 'US'
  },
  {
    id: '911',
    name: 'Emergency Services',
    number: '911',
    contact: 'tel:911',
    type: 'phone',
    priority: 3,
    description: 'Local emergency services and first responders',
    availability: '24/7',
    region: 'US'
  },
  {
    id: 'samhsa',
    name: 'SAMHSA National Helpline',
    number: '1-800-662-4357',
    contact: 'tel:1-800-662-4357',
    type: 'phone',
    priority: 4,
    description: 'Treatment referral and information service',
    availability: '24/7',
    region: 'US'
  }
];

export interface CrisisKeywords {
  critical: string[];
  high: string[];
  moderate: string[];
  low: string[];
}

export const CRISIS_KEYWORDS: CrisisKeywords = {
  critical: [
    'suicide', 'kill myself', 'end it all', 'die', 'death', 'want to die',
    'take my life', 'hurt myself', 'end my life', 'better off dead',
    'no point living', 'cant take it', 'going to hurt myself'
  ],
  high: [
    'hopeless', 'worthless', 'cant go on', 'give up', 'no hope',
    'trapped', 'unbearable', 'suffering', 'pain', 'alone',
    'nobody cares', 'burden', 'useless', 'hate myself'
  ],
  moderate: [
    'depressed', 'anxious', 'overwhelmed', 'stressed', 'worried',
    'scared', 'confused', 'lost', 'tired', 'exhausted',
    'struggling', 'difficult', 'hard time', 'help me'
  ],
  low: [
    'sad', 'down', 'upset', 'disappointed', 'frustrated',
    'angry', 'annoyed', 'bothered', 'concerned', 'uneasy'
  ]
};

export type CrisisLevel = 'safe' | 'low' | 'moderate' | 'high' | 'critical';

export interface CrisisLevelConfig {
  level: CrisisLevel;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  urgency: number;
  actions: string[];
  autoEscalate: boolean;
  maxResponseTime: number; // in seconds
}

export const CRISIS_LEVELS: Record<CrisisLevel, CrisisLevelConfig> = {
  safe: {
    level: 'safe',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    urgency: 1,
    actions: ['provide resources', 'encourage self-care'],
    autoEscalate: false,
    maxResponseTime: 3600 // 1 hour
  },
  low: {
    level: 'low',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    urgency: 2,
    actions: ['active listening', 'coping strategies', 'resource sharing'],
    autoEscalate: false,
    maxResponseTime: 1800 // 30 minutes
  },
  moderate: {
    level: 'moderate',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    textColor: 'text-yellow-800',
    urgency: 3,
    actions: ['safety planning', 'professional referral', 'close monitoring'],
    autoEscalate: false,
    maxResponseTime: 900 // 15 minutes
  },
  high: {
    level: 'high',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    textColor: 'text-orange-800',
    urgency: 4,
    actions: ['immediate support', 'crisis intervention', 'safety assessment'],
    autoEscalate: true,
    maxResponseTime: 300 // 5 minutes
  },
  critical: {
    level: 'critical',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    textColor: 'text-red-800',
    urgency: 5,
    actions: ['emergency services', 'immediate intervention', 'safety protocol'],
    autoEscalate: true,
    maxResponseTime: 60 // 1 minute
  }
};

export interface CrisisAction {
  id: string;
  label: string;
  icon: string;
  action: string | (() => void);
  color: string;
  urgent?: boolean;
  hapticPattern?: number[];
  description: string;
  level: CrisisLevel[];
}

export const CRISIS_ACTIONS: CrisisAction[] = [
  {
    id: 'call-988',
    label: 'Call 988',
    icon: 'Phone',
    action: 'tel:988',
    color: 'bg-gradient-to-br from-red-500 to-red-600',
    urgent: true,
    hapticPattern: [100, 50, 100],
    description: 'Call the 988 Suicide & Crisis Lifeline for immediate support',
    level: ['high', 'critical']
  },
  {
    id: 'text-home',
    label: 'Text HOME',
    icon: 'MessageSquare',
    action: 'sms:741741?body=HOME',
    color: 'bg-gradient-to-br from-blue-500 to-blue-600',
    urgent: false,
    hapticPattern: [50],
    description: 'Text HOME to 741741 for crisis support via text',
    level: ['moderate', 'high', 'critical']
  },
  {
    id: 'call-911',
    label: 'Call 911',
    icon: 'Shield',
    action: 'tel:911',
    color: 'bg-gradient-to-br from-gray-700 to-gray-800',
    urgent: true,
    hapticPattern: [200, 100, 200],
    description: 'Call emergency services for immediate assistance',
    level: ['critical']
  },
  {
    id: 'breathing',
    label: 'Breathing',
    icon: 'Heart',
    action: '/wellness#breathing',
    color: 'bg-gradient-to-br from-pink-500 to-pink-600',
    urgent: false,
    hapticPattern: [30],
    description: 'Start a guided breathing exercise to help calm down',
    level: ['low', 'moderate', 'high']
  },
  {
    id: 'safety-plan',
    label: 'Safety Plan',
    icon: 'Shield',
    action: '/crisis/safety-plan',
    color: 'bg-gradient-to-br from-purple-500 to-purple-600',
    urgent: false,
    hapticPattern: [40],
    description: 'Access your personal safety plan and coping strategies',
    level: ['moderate', 'high']
  }
];

export const CRISIS_THEMES = {
  therapeutic: {
    primary: 'bg-primary-500',
    secondary: 'bg-secondary-500',
    accent: 'bg-accent-500',
    crisis: 'bg-[#DFA4A0]',
    emergency: 'bg-red-400',
    safe: 'bg-green-400'
  },
  console: {
    primary: 'bg-console-accent',
    secondary: 'bg-blue-500',
    accent: 'bg-cyan-400',
    crisis: 'bg-red-500',
    emergency: 'bg-red-600',
    safe: 'bg-green-500'
  }
} as const;

export type CrisisTheme = keyof typeof CRISIS_THEMES;

export const __HAPTIC_PATTERNS = {
  tap: [30],
  success: [50, 30, 50],
  warning: [100, 50, 100],
  error: [200, 100, 200],
  emergency: [100, 50, 100, 50, 100],
  urgent: [80, 40, 80],
  gentle: [20]
};

export const _CRISIS_STORAGE_KEYS = {
  safetyPlan: 'crisis_safety_plan',
  emergencyContacts: 'crisis_emergency_contacts',
  interactions: 'crisis_interactions',
  preferences: 'crisis_preferences',
  lastAssessment: 'crisis_last_assessment'
} as const;

export const _CRISIS_EVENTS = {
  levelChanged: 'crisis:level:changed',
  actionTaken: 'crisis:action:taken',
  contactCalled: 'crisis:contact:called',
  planUpdated: 'crisis:plan:updated',
  assessmentCompleted: 'crisis:assessment:completed'
} as const;