// Mock Crisis Chat Server - Simulates real crisis counselor interactions
// CRITICAL: This is for DEMO PURPOSES ONLY - Production requires certified counselors

import { RealtimeMessage } from '../realtime/websocketService';
import { logger } from '../../utils/logger';

// Crisis Counselor Personas with Different Specializations
export interface MockCounselor {
  id: string;
  name: string;
  credentials: string;
  avatar?: string;
  status: 'available' | 'busy' | 'offline';
  specialties: string[];
  responseTime: number; // seconds
  personality: 'empathetic' | 'solution-focused' | 'trauma-informed' | 'cognitive';
  crisisExperience: number; // years
}

export const MOCK_COUNSELORS: MockCounselor[] = [
  {
    id: 'counselor-1',
    name: 'Dr. Sarah Chen',
    credentials: 'LCSW, Crisis Specialist',
    status: 'available',
    specialties: ['Suicide Prevention', 'Depression', 'Anxiety', 'Trauma'],
    responseTime: 30,
    personality: 'empathetic',
    crisisExperience: 8
  },
  {
    id: 'counselor-2',
    name: 'Michael Rodriguez',
    credentials: 'Licensed Crisis Counselor',
    status: 'available',
    specialties: ['Substance Abuse', 'Family Crisis', 'PTSD'],
    responseTime: 45,
    personality: 'solution-focused',
    crisisExperience: 5
  },
  {
    id: 'counselor-3',
    name: 'Dr. Emily Watson',
    credentials: 'PhD, Clinical Psychology',
    status: 'available',
    specialties: ['Bipolar Disorder', 'Panic Disorders', 'Self-Harm'],
    responseTime: 25,
    personality: 'trauma-informed',
    crisisExperience: 12
  },
  {
    id: 'counselor-4',
    name: 'James Thompson',
    credentials: 'MA, Crisis Intervention',
    status: 'available',
    specialties: ['LGBTQ+ Support', 'Teen Crisis', 'Relationship Issues'],
    responseTime: 35,
    personality: 'cognitive',
    crisisExperience: 7
  }
];

// Crisis Response Templates Based on Assessment Level
export interface CrisisResponseTemplate {
  level: 'low' | 'medium' | 'high' | 'critical';
  keywords: string[];
  responses: string[];
  escalationActions: string[];
  followUpQuestions: string[];
}

export const CRISIS_RESPONSE_TEMPLATES: CrisisResponseTemplate[] = [
  {
    level: 'critical',
    keywords: ['suicide', 'kill myself', 'end it all', 'die', 'death', 'hurt myself', 'pills', 'gun', 'bridge', 'rope'],
    responses: [
      "I'm really concerned about what you've shared. Your life has value, and I want to help you stay safe right now. Are you in immediate physical danger?",
      "Thank you for trusting me with this. I can hear how much pain you're in. Let's work together to keep you safe. Do you have access to means to harm yourself right now?",
      "I'm here with you, and I want you to know that these feelings can change. You've reached out, which shows incredible strength. Can you tell me where you are right now?",
      "What you're feeling is temporary, even though it doesn't feel that way. I'm going to stay with you through this. Do you have someone who can be with you right now?"
    ],
    escalationActions: [
      'initiate_emergency_contact',
      'request_location_for_dispatch',
      'connect_to_crisis_specialist',
      'safety_plan_review'
    ],
    followUpQuestions: [
      "What's your current location?",
      "Is there someone you trust who can come be with you?",
      "Have you taken any substances today?",
      "Do you have access to weapons or means to hurt yourself?",
      "What's one small thing that has kept you going until now?"
    ]
  },
  {
    level: 'high',
    keywords: ['hopeless', 'worthless', 'can\'t go on', 'give up', 'no point', 'alone', 'nobody cares', 'trapped'],
    responses: [
      "I can hear how much pain you're in right now. Those feelings of hopelessness are real, but they don't define your worth. Can you tell me more about what's making you feel this way?",
      "It sounds like you're going through something really difficult. I want you to know that you're not alone - I'm here with you. What's been the hardest part of today?",
      "These feelings of being worthless aren't the truth about who you are. Depression and crisis can make us believe things that aren't accurate. What's one thing you used to enjoy?",
      "I hear you saying you feel trapped. That must be overwhelming. Sometimes when we're in crisis, solutions aren't visible. Can we explore what support might be available to you?"
    ],
    escalationActions: [
      'assess_suicide_risk',
      'explore_support_system',
      'safety_planning',
      'resource_referral'
    ],
    followUpQuestions: [
      "How long have you been feeling this way?",
      "Have you had thoughts of hurting yourself?",
      "What usually helps when you're feeling overwhelmed?",
      "Who in your life cares about you?",
      "What's something small that might help you get through tonight?"
    ]
  },
  {
    level: 'medium',
    keywords: ['anxious', 'panic', 'scared', 'overwhelmed', 'stressed', 'crying', 'can\'t cope', 'breaking down'],
    responses: [
      "It sounds like you're feeling really overwhelmed right now. That's a valid response to stress. Let's work together to help you feel more grounded. Can you tell me what's contributing to these feelings?",
      "Panic and anxiety can feel really scary in the moment. You're safe right now, and these feelings will pass. Let's focus on your breathing. Can you take a slow, deep breath with me?",
      "I can hear that you're struggling to cope. That takes courage to reach out. What's been the most stressful part of your situation?",
      "Crying can actually be really helpful - it's your body's way of releasing stress. You don't have to handle everything alone. What kind of support do you need right now?"
    ],
    escalationActions: [
      'breathing_exercise',
      'grounding_technique',
      'coping_strategy_review',
      'stress_management'
    ],
    followUpQuestions: [
      "When did you first start feeling this way?",
      "What usually helps you when you're anxious?",
      "Have you been sleeping and eating regularly?",
      "What's one thing you can do to take care of yourself today?",
      "Who in your support network could you reach out to?"
    ]
  },
  {
    level: 'low',
    keywords: ['sad', 'worried', 'upset', 'confused', 'lonely', 'tired', 'frustrated', 'down'],
    responses: [
      "Thank you for sharing how you're feeling. It's completely normal to have ups and downs. Sometimes talking through what's bothering us can really help. What's been on your mind lately?",
      "I hear that you're going through a difficult time. It's good that you're reaching out for support. What's been the most challenging part of your day?",
      "Feeling sad or worried is part of being human. These _emotions are valid, and they're telling us something important. Can you tell me more about what's troubling you?",
      "It sounds like you might be dealing with some stress or changes in your life. That can be really draining. What's been different or difficult recently?"
    ],
    escalationActions: [
      'active_listening',
      'emotional_validation',
      'coping_resource_sharing',
      'self_care_planning'
    ],
    followUpQuestions: [
      "What's been the highlight of your week?",
      "How has your sleep been?",
      "What activities usually make you feel better?",
      "Who are the people you feel closest to?",
      "What's one thing you're looking forward to?"
    ]
  }
];

// Emergency Protocol Actions
export interface EmergencyProtocol {
  trigger: string;
  action: string;
  message: string;
  immediateResponse: boolean;
}

export const EMERGENCY_PROTOCOLS: EmergencyProtocol[] = [
  {
    trigger: 'imminent_suicide_risk',
    action: 'auto_dial_988',
    message: '🚨 EMERGENCY: I need to connect you with emergency services immediately. I\'m initiating a call to 988 Crisis Lifeline.',
    immediateResponse: true
  },
  {
    trigger: 'substance_overdose',
    action: 'auto_dial_911',
    message: '🚨 MEDICAL EMERGENCY: Based on what you\'ve shared, this is a medical emergency. I\'m calling 911.',
    immediateResponse: true
  },
  {
    trigger: 'domestic_violence',
    action: 'safety_protocol',
    message: '⚠️ SAFETY CONCERN: I\'m concerned about your safety. Let me help you connect with specialized domestic violence support.',
    immediateResponse: true
  },
  {
    trigger: 'child_abuse',
    action: 'mandatory_reporting',
    message: '⚠️ CHILD SAFETY: I\'m required by law to report concerns about child safety. Let me connect you with child protective services.',
    immediateResponse: true
  }
];

// Mock Crisis Server Class
export class MockCrisisServer {
  private static instance: MockCrisisServer;
  private activeSessions: Map<string, MockCrisisSession> = new Map();
  private counselorPool: MockCounselor[] = [...MOCK_COUNSELORS];
  private emergencyCallbacks: ((action: string, data: unknown) => void)[] = [];

  private constructor() {
    this.initializeServer();
  }

  public static getInstance(): MockCrisisServer {
    if (!MockCrisisServer.instance) {
      MockCrisisServer.instance = new MockCrisisServer();
    }
    return MockCrisisServer.instance;
  }

  private initializeServer(): void {
    logger.info('🟢 Mock Crisis Server initialized with', this.counselorPool.length, 'counselors');
  }

  // Register emergency callback for auto-dial functionality
  public onEmergency(callback: (action: string, data: unknown) => void): void {
    this.emergencyCallbacks.push(callback);
  }

  // Create new crisis session
  public createCrisisSession(userId: string, priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'): MockCrisisSession {
    const _sessionId = `crisis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Assign best available counselor
    const counselor = this.assignCounselor(priority);
    
    const session = new MockCrisisSession(_sessionId, userId, counselor, priority);
    this.activeSessions.set(_sessionId, session);

    // Set up emergency protocols
    session.onEmergency((action, data) => {
      this.triggerEmergencyProtocol(action, data);
    });

    logger.crisis(`Crisis session ${_sessionId} created with counselor ${counselor.name}`, 'medium', 'MockCrisisServer', { _sessionId, counselor: counselor.name });
    return session;
  }

  // Assign counselor based on priority and availability
  private assignCounselor(priority: string): MockCounselor {
    const availableCounselors = this.counselorPool.filter(c => c.status === 'available');
    
    if (availableCounselors.length === 0) {
      // Fallback - use first counselor and mark as busy
      logger.warn('⚠️ No available counselors - using fallback');
      return this.counselorPool[0]!;
    }

    // For critical cases, assign most experienced counselor
    if (priority === 'critical') {
      return availableCounselors.reduce((best, current) => 
        current.crisisExperience > best.crisisExperience ? current : best
      );
    }

    // For high priority, prefer trauma-informed or empathetic counselors
    if (priority === 'high') {
      const preferred = availableCounselors.filter(c => 
        c.personality === 'trauma-informed' || c.personality === 'empathetic'
      );
      if (preferred.length > 0) {
        return preferred[Math.floor(Math.random() * preferred.length)]!;
      }
    }

    // Default - assign based on shortest response time
    return availableCounselors.reduce((fastest, current) => 
      current.responseTime < fastest.responseTime ? current : fastest
    );
  }

  // Trigger emergency protocol
  private triggerEmergencyProtocol(action: string, data: unknown): void {
    const protocol = EMERGENCY_PROTOCOLS.find(p => p.action === action);
    if (!protocol) return;

    logger.error('🚨 EMERGENCY PROTOCOL TRIGGERED:', action, data);

    // Execute emergency callbacks
    this.emergencyCallbacks.forEach(callback => {
      try {
        callback(action, { ...data, protocol });
      } catch (error) {
        logger.error('Emergency callback failed:');
      }
    });

    // Immediate response actions
    if (protocol.immediateResponse) {
      if (action === 'auto_dial_988') {
        this.initiateEmergencyCall('988', 'Suicide & Crisis Lifeline');
      } else if (action === 'auto_dial_911') {
        this.initiateEmergencyCall('911', 'Emergency Services');
      }
    }
  }

  // Simulate emergency call initiation
  private initiateEmergencyCall(number: string, service: string): void {
    logger.crisis(`INITIATING EMERGENCY CALL: ${service} (${number})`, 'critical', 'MockCrisisServer', { service, number });
    
    // In production, this would interface with actual emergency services
    // For demo, we simulate the call initiation
    
    setTimeout(() => {
      alert(`🚨 EMERGENCY CALL INITIATED\n\nService: ${service}\nNumber: ${number}\n\nThis is a simulation - in production, real emergency services would be contacted.`);
      
      // Actually trigger the tel: link
      if (typeof window !== 'undefined') {
        window.location.href = `tel:${number}`;
      }
    }, 1000);
  }

  // Get session
  public getSession(_sessionId: string): MockCrisisSession | undefined {
    return this.activeSessions.get(_sessionId);
  }

  // End session
  public endSession(_sessionId: string): void {
    const session = this.activeSessions.get(_sessionId);
    if (session) {
      session.end();
      this.activeSessions.delete(_sessionId);
    }
  }

  // Get server statistics
  public getStats(): {
    activeSessions: number;
    availableCounselors: number;
    totalCounselors: number;
  } {
    return {
      activeSessions: this.activeSessions.size,
      availableCounselors: this.counselorPool.filter(c => c.status === 'available').length,
      totalCounselors: this.counselorPool.length
    };
  }
}

// Mock Crisis Session Class
export class MockCrisisSession {
  private messageCallbacks: ((message: RealtimeMessage) => void)[] = [];
  private emergencyCallbacks: ((action: string, data: unknown) => void)[] = [];
  private typingCallbacks: ((isTyping: boolean) => void)[] = [];
  private messages: RealtimeMessage[] = [];
  private isActive: boolean = true;
  private typingTimeout: NodeJS.Timeout | null = null;
  private responseAnalyzer: CrisisMessageAnalyzer;
  
  constructor(
    public readonly _sessionId: string,
    public readonly userId: string,
    public readonly counselor: MockCounselor,
    public readonly priority: string
  ) {
    this.responseAnalyzer = new CrisisMessageAnalyzer();
    this.startSession();
  }

  private startSession(): void {
    // Send welcome message
    setTimeout(() => {
      const _welcomeMessage = this.generateWelcomeMessage();
      this.sendCounselorMessage(_welcomeMessage);
    }, 1000);
  }

  private generateWelcomeMessage(): string {
    const messages = [
      `Hi, I'm ${this.counselor.name}, a ${this.counselor.credentials}. I'm here to listen and support you. You've taken a brave step by reaching out. How are you feeling right now?`,
      `Hello, my name is ${this.counselor.name}. I'm a crisis counselor with expertise in ${this.counselor.specialties.slice(0, 2).join(' and ')}. I want you to know that this is a safe, confidential space. What brought you here today?`,
      `I'm ${this.counselor.name}, and I'm glad you reached out. It takes courage to ask for help. I have experience with ${this.counselor.specialties[0]?.toLowerCase() || 'crisis counseling'} and I'm here to support you through this. What's going on for you right now?`,
    ];

    return messages[Math.floor(Math.random() * messages.length)]!;
  }

  // Send message to counselor (from user)
  public sendMessage(content: string): void {
    if (!this.isActive) return;

    const _userMessage: RealtimeMessage = {
      id: `msg-${Date.now()}`,
      roomId: this.sessionId,
      userId: this.userId,
      username: 'You',
      content,
      timestamp: new Date(),
      type: 'text'
    };

    this.messages.push(_userMessage);

    // Analyze message for crisis indicators
    const analysis = this.responseAnalyzer.analyzeMessage(_content);
    
    // Trigger emergency protocols if needed
    if (analysis.emergencyLevel === 'critical') {
      this.triggerEmergency(analysis);
    }

    // Generate counselor response with realistic delay
    this.generateCounselorResponse(content, analysis);
  }

  private generateCounselorResponse(_userMessage: string, analysis: unknown): void {
    // Show typing indicator
    this.startTyping();

    // Realistic response delay based on counselor and message complexity
    const baseDelay = this.counselor.responseTime * 1000; // Convert to milliseconds
    const complexityDelay = _userMessage.length * 20; // More complex messages take longer
    const totalDelay = baseDelay + complexityDelay + Math.random() * 2000; // Add some randomness

    setTimeout(() => {
      this.stopTyping();
      
      const response = this.responseAnalyzer.generateResponse(
        _userMessage,
        analysis,
        this.counselor,
        this.messages
      );

      this.sendCounselorMessage(response);

      // Follow up questions for critical situations
      if (analysis.crisisLevel === 'critical' || analysis.crisisLevel === 'high') {
        setTimeout(() => {
          const _followUp = this.responseAnalyzer.generateFollowUp(analysis, this.counselor);
          if (_followUp) {
            this.sendCounselorMessage(_followUp);
          }
        }, 3000);
      }
    }, Math.min(totalDelay, 10000)); // Cap at 10 seconds maximum
  }

  private sendCounselorMessage(content: string): void {
    const _counselorMessage: RealtimeMessage = {
      id: `msg-${Date.now()}`,
      roomId: this.sessionId,
      userId: this.counselor.id,
      username: this.counselor.name,
      content,
      timestamp: new Date(),
      type: 'text'
    };

    this.messages.push(_counselorMessage);
    
    // Notify message callbacks
    this.messageCallbacks.forEach(callback => {
      try {
        callback(_counselorMessage);
      } catch (error) {
        logger.error('Message callback failed:');
      }
    });
  }

  private startTyping(): void {
    this.typingCallbacks.forEach(callback => callback(true));
    
    // Auto-stop typing after a reasonable time
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.stopTyping();
    }, 30000);
  }

  private stopTyping(): void {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
    this.typingCallbacks.forEach(callback => callback(false));
  }

  private triggerEmergency(analysis: unknown): void {
    logger.error('🚨 EMERGENCY TRIGGERED:', analysis);
    
    this.emergencyCallbacks.forEach(callback => {
      callback('crisis_escalation', {
        _sessionId: this._sessionId,
        userId: this.userId,
        counselor: this.counselor,
        analysis,
        timestamp: new Date()
      });
    });

    // Immediate emergency response
    if (analysis.indicators.includes('suicide_plan') || analysis.indicators.includes('immediate_danger')) {
      this.emergencyCallbacks.forEach(callback => {
        callback('auto_dial_988', {
          reason: 'Imminent suicide risk detected',
          _sessionId: this._sessionId
        });
      });
    }
  }

  // Event handlers
  public onMessage(callback: (message: RealtimeMessage) => void): void {
    this.messageCallbacks.push(callback);
  }

  public onEmergency(callback: (action: string, data: unknown) => void): void {
    this.emergencyCallbacks.push(callback);
  }

  public onTyping(callback: (isTyping: boolean) => void): void {
    this.typingCallbacks.push(callback);
  }

  public end(): void {
    this.isActive = false;
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    // Send session end message
    this.sendCounselorMessage(
      "Thank you for sharing with me today. Remember, you can reach out anytime you need support. Take care of yourself, and please don't hesitate to call 988 if you need immediate help."
    );
  }

  public getMessages(): RealtimeMessage[] {
    return [...this.messages];
  }

  public isSessionActive(): boolean {
    return this.isActive;
  }
}

// Crisis Message Analyzer - AI-like response generation
class CrisisMessageAnalyzer {
  public analyzeMessage(content: string): {
    crisisLevel: 'low' | 'medium' | 'high' | 'critical';
    emergencyLevel: 'none' | 'moderate' | 'high' | 'critical';
    indicators: string[];
    _emotions: string[];
    riskFactors: string[];
  } {
    const lowerContent = content.toLowerCase();
    const indicators: string[] = [];
    const _emotions: string[] = [];
    const riskFactors: string[] = [];
    
    // Analyze for crisis keywords
    let crisisScore = 0;
    let emergencyScore = 0;

    // Critical indicators
    const suicideKeywords = ['kill myself', 'want to die', 'end it all', 'suicide', 'not worth living'];
    const planKeywords = ['plan to', 'going to', 'pills', 'gun', 'bridge', 'rope', 'tonight'];
    const immediateKeywords = ['right now', 'can\'t take it', 'goodbye', 'final message'];

    suicideKeywords.forEach(_keyword => {
      if (lowerContent.includes(_keyword)) {
        indicators.push('suicideideation');
        crisisScore += 10;
        emergencyScore += 5;
      }
    });

    planKeywords.forEach(_keyword => {
      if (lowerContent.includes(_keyword) && suicideKeywords.some(_sk => lowerContent.includes(_sk))) {
        indicators.push('suicide_plan');
        crisisScore += 20;
        emergencyScore += 15;
      }
    });

    immediateKeywords.forEach(_keyword => {
      if (lowerContent.includes(_keyword)) {
        indicators.push('immediate_danger');
        crisisScore += 15;
        emergencyScore += 20;
      }
    });

    // Emotional indicators
    const _emotionMap: { [key: string]: { emotion: string; weight: number } } = {
      'hopeless': { emotion: 'hopelessness', weight: 8 },
      'worthless': { emotion: 'low_self_worth', weight: 6 },
      'alone': { emotion: 'isolation', weight: 4 },
      'scared': { emotion: 'fear', weight: 3 },
      'overwhelmed': { emotion: 'overwhelm', weight: 5 },
      'trapped': { emotion: 'trapped', weight: 7 },
      'panic': { emotion: 'panic', weight: 5 }
    };

    Object.entries(_emotionMap).forEach(([_keyword, data]) => {
      if (lowerContent.includes(_keyword)) {
        _emotions.push(data.emotion);
        crisisScore += data.weight;
      }
    });

    // Risk factors
    const _riskFactorMap: { [key: string]: { factor: string; weight: number } } = {
      'drinking': { factor: 'substance_use', weight: 4 },
      'drugs': { factor: 'substance_use', weight: 4 },
      'lost my job': { factor: 'employment_loss', weight: 3 },
      'broke up': { factor: 'relationship_loss', weight: 3 },
      'no friends': { factor: 'socialisolation', weight: 5 },
      'abuse': { factor: 'abuse_history', weight: 6 }
    };

    Object.entries(_riskFactorMap).forEach(([_keyword, data]) => {
      if (lowerContent.includes(_keyword)) {
        riskFactors.push(data.factor);
        crisisScore += data.weight;
      }
    });

    // Determine crisis level
    let crisisLevel: 'low' | 'medium' | 'high' | 'critical';
    if (crisisScore >= 30) crisisLevel = 'critical';
    else if (crisisScore >= 20) crisisLevel = 'high';
    else if (crisisScore >= 10) crisisLevel = 'medium';
    else crisisLevel = 'low';

    // Determine emergency level
    let emergencyLevel: 'none' | 'moderate' | 'high' | 'critical';
    if (emergencyScore >= 25) emergencyLevel = 'critical';
    else if (emergencyScore >= 15) emergencyLevel = 'high';
    else if (emergencyScore >= 5) emergencyLevel = 'moderate';
    else emergencyLevel = 'none';

    return {
      crisisLevel,
      emergencyLevel,
      indicators,
      _emotions,
      riskFactors
    };
  }

  public generateResponse(
    _userMessage: string,
    analysis: unknown,
    counselor: MockCounselor,
    messageHistory: RealtimeMessage[]
  ): string {
    const templates = CRISIS_RESPONSE_TEMPLATES.find(t => t.level === analysis.crisisLevel);
    if (!templates) {
      return "I hear what you're saying. Can you tell me more about how you're feeling?";
    }

    // Personalize response based on counselor personality
    let baseResponse = templates.responses[Math.floor(Math.random() * templates.responses.length)] || 
                      "I hear what you're saying. Can you tell me more about how you're feeling?";

    // Add personality-specific modifications
    if (counselor.personality === 'empathetic') {
      baseResponse = this.addEmpathy(baseResponse, analysis._emotions ?? []);
    } else if (counselor.personality === 'solution-focused') {
      baseResponse = this.addSolutionFocus(_baseResponse);
    } else if (counselor.personality === 'trauma-informed') {
      baseResponse = this.addTraumaAwareness(_baseResponse);
    }

    return baseResponse || 'I understand you are going through a difficult time. Can you tell me more about what you are experiencing?';
  }

  public generateFollowUp(analysis: unknown, _counselor: MockCounselor): string | null {
    const templates = CRISIS_RESPONSE_TEMPLATES.find(t => t.level === analysis.crisisLevel);
    if (!templates || templates.followUpQuestions.length === 0) return null;

    const question = templates.followUpQuestions[Math.floor(Math.random() * templates.followUpQuestions.length)];
    return question || null;
  }

  private addEmpathy(response: string, _emotions: string[]): string {
    const empathyPhrases = [
      "I can really hear the pain in your words.",
      "That sounds incredibly difficult.",
      "I want you to know that your feelings are completely valid.",
      "It takes so much courage to share what you've shared with me."
    ];

    const phrase = empathyPhrases[Math.floor(Math.random() * empathyPhrases.length)];
    return `${phrase} ${response}`;
  }

  private addSolutionFocus(response: string): string {
    const solutionPhrases = [
      "Let's work together to find some steps forward.",
      "I wonder what small step we might take to help you feel a bit better.",
      "What's worked for you in the past when you've felt this way?"
    ];

    const phrase = solutionPhrases[Math.floor(Math.random() * solutionPhrases.length)];
    return `${response} ${phrase}`;
  }

  private addTraumaAwareness(response: string): string {
    const traumaPhrases = [
      "I want you to feel safe in this space.",
      "You have control over how much you share.",
      "Your body and mind have been through a lot."
    ];

    const phrase = traumaPhrases[Math.floor(Math.random() * traumaPhrases.length)];
    return `${phrase} ${response}`;
  }
}

// Export singleton instance
export const __mockCrisisServer = MockCrisisServer.getInstance();