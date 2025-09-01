/**
 * Crisis System Integration Service
 * Manages crisis detection, response, and coordination across all crisis-related components
 * SECURITY: Updated to use secure storage for sensitive crisis data
 */

import { EventEmitter } from 'events';
import { secureStorage } from '../security/SecureLocalStorage';
import { useWellnessStore } from '../../stores/wellnessStore';
import { useActivityStore } from '../../stores/activityStore';
import { realtimeSyncService } from './RealtimeSyncService';
import { dataIntegrationService } from './DataIntegrationService';

// Crisis severity levels
export enum CrisisSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Crisis event types
export enum CrisisEventType {
  RISK_DETECTED = 'risk:detected',
  ASSESSMENT_COMPLETED = 'assessment:completed',
  SUPPORT_REQUESTED = 'support:requested',
  COUNSELOR_CONNECTED = 'counselor:connected',
  SAFETY_PLAN_ACTIVATED = 'safety:plan:activated',
  EMERGENCY_CONTACT_NOTIFIED = 'emergency:contact:notified',
  CRISIS_RESOLVED = 'crisis:resolved',
  FOLLOW_UP_SCHEDULED = 'follow:up:scheduled'
}

// Crisis assessment data
interface CrisisAssessment {
  id: string;
  userId: string;
  timestamp: Date;
  severity: CrisisSeverity;
  riskFactors: string[];
  protectiveFactors: string[];
  suicidalIdeation: boolean;
  selfHarmRisk: boolean;
  hasplan: boolean;
  hasIntent: boolean;
  hasMeans: boolean;
  previousAttempts: number;
  substanceUse: boolean;
  socialSupport: boolean;
  recommendations: string[];
}

// Safety plan
interface SafetyPlan {
  id: string;
  userId: string;
  warningSignals: string[];
  copingStrategies: string[];
  distractionActivities: string[];
  supportPeople: ContactPerson[];
  safePlaces: string[];
  professionalContacts: ProfessionalContact[];
  reasonsToLive: string[];
  emergencyContacts: EmergencyContact[];
  createdAt: Date;
  lastUpdated: Date;
  activationCount: number;
}

// Contact interfaces
interface ContactPerson {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  availability: string;
}

interface ProfessionalContact {
  id: string;
  name: string;
  role: string;
  organization: string;
  phone: string;
  email?: string;
  emergencyAvailable: boolean;
}

interface EmergencyContact {
  id: string;
  name: string;
  type: 'hotline' | 'emergency' | 'hospital';
  phone: string;
  available247: boolean;
}

// Crisis session
interface CrisisSession {
  id: string;
  userId: string;
  counselorId?: string;
  startTime: Date;
  endTime?: Date;
  severity: CrisisSeverity;
  status: 'waiting' | 'connected' | 'escalated' | 'resolved';
  messages: CrisisMessage[];
  assessment?: CrisisAssessment;
  safetyPlanActivated: boolean;
  emergencyServicesContacted: boolean;
  followUpScheduled?: Date;
}

interface CrisisMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'resource';
  metadata?: any;
}

// Crisis trigger analysis
interface CrisisTrigger {
  type: string;
  source: string;
  timestamp: Date;
  data: any;
  confidence: number;
}

class CrisisIntegrationService extends EventEmitter {
  private static instance: CrisisIntegrationService;
  private currentSession: CrisisSession | null = null;
  private safetyPlan: SafetyPlan | null = null;
  private riskMonitors: Map<string, NodeJS.Timeout> = new Map();
  private assessmentQueue: CrisisAssessment[] = [];
  private isMonitoring = false;
  
  // Risk thresholds
  private readonly RISK_THRESHOLDS = {
    moodScore: 2,
    stressLevel: 8,
    anxietyLevel: 8,
    negativeTriggers: ['suicidal', 'self-harm', 'hopeless', 'worthless'],
    inactivityDays: 3,
    missedMedications: 2,
    isolationHours: 48
  };
  
  private constructor() {
    super();
    this.initializeMonitoring();
    this.loadSafetyPlan();
  }
  
  public static getInstance(): CrisisIntegrationService {
    if (!CrisisIntegrationService.instance) {
      CrisisIntegrationService.instance = new CrisisIntegrationService();
    }
    return CrisisIntegrationService.instance;
  }
  
  /**
   * Initialize crisis monitoring
   */
  private initializeMonitoring() {
    // Monitor wellness store for crisis indicators
    useWellnessStore.subscribe((state) => {
      if (state.moodEntries.length > 0) {
        this.analyzeMoodForCrisis(state.moodEntries[state.moodEntries.length - 1]);
      }
    });
    
    // Monitor activity patterns
    useActivityStore.subscribe((state) => {
      this.analyzeActivityPatterns(state.activities);
    });
    
    // Setup real-time crisis alerts
    realtimeSyncService.subscribe({
      channel: 'crisis',
      events: ['alert', 'trigger', 'escalation'],
      handler: (data) => this.handleRealtimeCrisisEvent(data)
    });
    
    // Start periodic risk assessment
    this.startPeriodicAssessment();
    this.isMonitoring = true;
  }
  
  /**
   * Analyze mood entries for crisis indicators
   */
  private analyzeMoodForCrisis(moodEntry: any) {
    const triggers: CrisisTrigger[] = [];
    
    // Check mood score threshold
    if (moodEntry.moodScore <= this.RISK_THRESHOLDS.moodScore) {
      triggers.push({
        type: 'low_mood',
        source: 'mood_tracker',
        timestamp: new Date(),
        data: { score: moodEntry.moodScore },
        confidence: 0.8
      });
    }
    
    // Check stress and anxiety levels
    if (moodEntry.stressLevel >= this.RISK_THRESHOLDS.stressLevel) {
      triggers.push({
        type: 'high_stress',
        source: 'mood_tracker',
        timestamp: new Date(),
        data: { level: moodEntry.stressLevel },
        confidence: 0.7
      });
    }
    
    if (moodEntry.anxietyLevel >= this.RISK_THRESHOLDS.anxietyLevel) {
      triggers.push({
        type: 'high_anxiety',
        source: 'mood_tracker',
        timestamp: new Date(),
        data: { level: moodEntry.anxietyLevel },
        confidence: 0.7
      });
    }
    
    // Check for negative triggers in notes
    const notes = moodEntry.notes?.toLowerCase() || '';
    const emotions = moodEntry.emotions || [];
    
    for (const trigger of this.RISK_THRESHOLDS.negativeTriggers) {
      if (notes.includes(trigger) || emotions.includes(trigger)) {
        triggers.push({
          type: 'crisis_keyword',
          source: 'mood_tracker',
          timestamp: new Date(),
          data: { keyword: trigger },
          confidence: 0.9
        });
      }
    }
    
    // Assess combined risk
    if (triggers.length > 0) {
      this.assessCrisisRisk(triggers);
    }
  }
  
  /**
   * Analyze activity patterns for crisis indicators
   */
  private analyzeActivityPatterns(activities: any[]) {
    const now = new Date();
    const recentActivities = activities.filter(a => {
      const activityDate = new Date(a.completedAt || a.scheduledTime);
      const daysDiff = (now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    });
    
    // Check for inactivity
    const lastActivityDate = recentActivities
      .filter(a => a.completed)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0]?.completedAt;
    
    if (lastActivityDate) {
      const inactiveDays = (now.getTime() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24);
      
      if (inactiveDays >= this.RISK_THRESHOLDS.inactivityDays) {
        this.assessCrisisRisk([{
          type: 'inactivity',
          source: 'activity_tracker',
          timestamp: now,
          data: { days: inactiveDays },
          confidence: 0.6
        }]);
      }
    }
    
    // Check medication adherence
    const medicationActivities = recentActivities.filter(a => a.type === 'medication');
    const missedMedications = medicationActivities.filter(a => !a.completed && new Date(a.scheduledTime) < now);
    
    if (missedMedications.length >= this.RISK_THRESHOLDS.missedMedications) {
      this.assessCrisisRisk([{
        type: 'missed_medications',
        source: 'medication_tracker',
        timestamp: now,
        data: { count: missedMedications.length },
        confidence: 0.7
      }]);
    }
  }
  
  /**
   * Assess crisis risk based on triggers
   */
  private assessCrisisRisk(triggers: CrisisTrigger[]) {
    // Calculate overall risk score
    const riskScore = triggers.reduce((sum, trigger) => sum + trigger.confidence, 0) / triggers.length;
    const highConfidenceTriggers = triggers.filter(t => t.confidence >= 0.8);
    
    let severity: CrisisSeverity;
    
    if (highConfidenceTriggers.some(t => t.type === 'crisis_keyword')) {
      severity = CrisisSeverity.CRITICAL;
    } else if (riskScore >= 0.8 || highConfidenceTriggers.length >= 2) {
      severity = CrisisSeverity.HIGH;
    } else if (riskScore >= 0.6) {
      severity = CrisisSeverity.MEDIUM;
    } else {
      severity = CrisisSeverity.LOW;
    }
    
    // Create assessment
    const assessment: CrisisAssessment = {
      id: `assessment-${Date.now()}`,
      userId: 'current-user', // Get from auth context
      timestamp: new Date(),
      severity,
      riskFactors: triggers.map(t => t.type),
      protectiveFactors: this.identifyProtectiveFactors(),
      suicidalIdeation: triggers.some(t => t.data?.keyword?.includes('suicidal')),
      selfHarmRisk: triggers.some(t => t.data?.keyword?.includes('self-harm')),
      hasplan: false, // Would need direct assessment
      hasIntent: false, // Would need direct assessment
      hasMeans: false, // Would need direct assessment
      previousAttempts: 0, // From user history
      substanceUse: false, // From user data
      socialSupport: true, // From community engagement
      recommendations: this.generateRecommendations(severity, triggers)
    };
    
    // Queue assessment
    this.assessmentQueue.push(assessment);
    
    // Emit event
    this.emit(CrisisEventType.RISK_DETECTED, assessment);
    
    // Take action based on severity
    this.handleCrisisDetection(assessment);
  }
  
  /**
   * Identify protective factors
   */
  private identifyProtectiveFactors(): string[] {
    const factors: string[] = [];
    
    // Check recent positive activities
    const wellnessStore = useWellnessStore.getState();
    const activityStore = useActivityStore.getState();
    
    if (wellnessStore.moodEntries.some(e => e.moodScore >= 4)) {
      factors.push('recent_positive_moods');
    }
    
    if (activityStore.activities.filter(a => a.completed).length > 5) {
      factors.push('active_engagement');
    }
    
    if (this.safetyPlan) {
      factors.push('has_safety_plan');
    }
    
    // Check social connections
    factors.push('community_support');
    
    return factors;
  }
  
  /**
   * Generate recommendations based on assessment
   */
  private generateRecommendations(severity: CrisisSeverity, triggers: CrisisTrigger[]): string[] {
    const recommendations: string[] = [];
    
    switch (severity) {
      case CrisisSeverity.CRITICAL:
        recommendations.push('Immediate crisis support recommended');
        recommendations.push('Contact emergency services if in immediate danger');
        recommendations.push('Activate safety plan');
        recommendations.push('Reach out to emergency contact');
        break;
        
      case CrisisSeverity.HIGH:
        recommendations.push('Connect with crisis counselor');
        recommendations.push('Review and update safety plan');
        recommendations.push('Contact support person');
        recommendations.push('Use crisis coping strategies');
        break;
        
      case CrisisSeverity.MEDIUM:
        recommendations.push('Practice coping strategies');
        recommendations.push('Reach out to support network');
        recommendations.push('Schedule therapy session');
        recommendations.push('Engage in self-care activities');
        break;
        
      case CrisisSeverity.LOW:
        recommendations.push('Continue monitoring mood');
        recommendations.push('Maintain wellness routines');
        recommendations.push('Stay connected with support network');
        break;
    }
    
    // Add trigger-specific recommendations
    if (triggers.some(t => t.type === 'high_stress')) {
      recommendations.push('Try stress reduction techniques');
    }
    
    if (triggers.some(t => t.type === 'inactivity')) {
      recommendations.push('Engage in gentle activities');
    }
    
    return recommendations;
  }
  
  /**
   * Handle crisis detection
   */
  private async handleCrisisDetection(assessment: CrisisAssessment) {
    // Log crisis event
    console.log('Crisis detected:', assessment);
    
    // Update stores
    useWellnessStore.getState().recordCrisisEvent({
      severity: assessment.severity === CrisisSeverity.CRITICAL ? 'critical' : 
                assessment.severity === CrisisSeverity.HIGH ? 'high' : 
                assessment.severity === CrisisSeverity.MEDIUM ? 'medium' : 'low',
      triggers: [],
      copingStrategiesUsed: [],
      supportContactsReached: [],
      outcome: 'in_progress',
      duration: 0,
      followUpNeeded: true,
      notes: `Crisis assessment detected: ${assessment.severity}`
    });
    
    // Send real-time alert
    if (assessment.severity === CrisisSeverity.CRITICAL || assessment.severity === CrisisSeverity.HIGH) {
      realtimeSyncService.send('crisis', 'alert', {
        assessment,
        requiresImmediate: true
      });
      
      // Auto-activate safety plan for critical severity
      if (assessment.severity === CrisisSeverity.CRITICAL && this.safetyPlan) {
        this.activateSafetyPlan();
      }
    }
    
    // Update data integration service
    dataIntegrationService.emit('crisis:detected', assessment);
  }
  
  /**
   * Start crisis support session
   */
  public async startCrisisSession(severity: CrisisSeverity = CrisisSeverity.HIGH): Promise<CrisisSession> {
    // End existing session if any
    if (this.currentSession && this.currentSession.status !== 'resolved') {
      await this.endCrisisSession('new_session_started');
    }
    
    // Create new session
    this.currentSession = {
      id: `session-${Date.now()}`,
      userId: 'current-user',
      startTime: new Date(),
      severity,
      status: 'waiting',
      messages: [],
      safetyPlanActivated: false,
      emergencyServicesContacted: false
    };
    
    // Emit event
    this.emit(CrisisEventType.SUPPORT_REQUESTED, this.currentSession);
    
    // Request counselor connection
    realtimeSyncService.send('crisis', 'request_support', {
      sessionId: this.currentSession.id,
      severity,
      userId: this.currentSession.userId
    });
    
    // Add system message
    this.addSessionMessage({
      id: `msg-${Date.now()}`,
      senderId: 'system',
      content: 'Connecting you with crisis support. You are not alone.',
      timestamp: new Date(),
      type: 'system'
    });
    
    return this.currentSession;
  }
  
  /**
   * Add message to crisis session
   */
  public addSessionMessage(message: CrisisMessage) {
    if (!this.currentSession) return;
    
    this.currentSession.messages.push(message);
    
    // Send via real-time if connected
    if (this.currentSession.status === 'connected') {
      realtimeSyncService.send('crisis', 'message', {
        sessionId: this.currentSession.id,
        message
      });
    }
  }
  
  /**
   * Connect counselor to session
   */
  public connectCounselor(counselorId: string) {
    if (!this.currentSession) return;
    
    this.currentSession.counselorId = counselorId;
    this.currentSession.status = 'connected';
    
    this.emit(CrisisEventType.COUNSELOR_CONNECTED, {
      sessionId: this.currentSession.id,
      counselorId
    });
    
    this.addSessionMessage({
      id: `msg-${Date.now()}`,
      senderId: 'system',
      content: 'A crisis counselor has joined the session.',
      timestamp: new Date(),
      type: 'system'
    });
  }
  
  /**
   * Activate safety plan
   */
  public activateSafetyPlan() {
    if (!this.safetyPlan) {
      console.warn('No safety plan available');
      return;
    }
    
    this.safetyPlan.activationCount++;
    this.safetyPlan.lastUpdated = new Date();
    
    // Mark in current session
    if (this.currentSession) {
      this.currentSession.safetyPlanActivated = true;
    }
    
    this.emit(CrisisEventType.SAFETY_PLAN_ACTIVATED, this.safetyPlan);
    
    // Send notification
    realtimeSyncService.send('crisis', 'safety_plan_activated', {
      planId: this.safetyPlan.id,
      userId: this.safetyPlan.userId,
      timestamp: new Date()
    });
  }
  
  /**
   * Contact emergency services
   */
  public async contactEmergencyServices(contactId: string) {
    const contact = this.safetyPlan?.emergencyContacts.find(c => c.id === contactId);
    
    if (!contact) {
      console.error('Emergency contact not found');
      return;
    }
    
    // Mark in session
    if (this.currentSession) {
      this.currentSession.emergencyServicesContacted = true;
    }
    
    this.emit(CrisisEventType.EMERGENCY_CONTACT_NOTIFIED, {
      contact,
      timestamp: new Date()
    });
    
    // In real implementation, would trigger actual contact
    console.log('Contacting emergency services:', contact);
  }
  
  /**
   * End crisis session
   */
  public async endCrisisSession(reason: string = 'resolved') {
    if (!this.currentSession) return;
    
    this.currentSession.endTime = new Date();
    this.currentSession.status = 'resolved';
    
    // Schedule follow-up if needed
    if (this.currentSession.severity === CrisisSeverity.HIGH || 
        this.currentSession.severity === CrisisSeverity.CRITICAL) {
      const followUpDate = new Date();
      followUpDate.setHours(followUpDate.getHours() + 24); // 24 hours later
      this.currentSession.followUpScheduled = followUpDate;
      
      this.emit(CrisisEventType.FOLLOW_UP_SCHEDULED, {
        sessionId: this.currentSession.id,
        followUpDate
      });
    }
    
    this.emit(CrisisEventType.CRISIS_RESOLVED, {
      sessionId: this.currentSession.id,
      reason,
      duration: this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime()
    });
    
    // Store session for history
    this.storeSessionHistory(this.currentSession);
    
    this.currentSession = null;
  }
  
  /**
   * Store session history - SECURITY: Using secure storage
   */
  private storeSessionHistory(session: CrisisSession) {
    // Store in secure storage (encrypted for sensitive crisis data)
    const history = JSON.parse(secureStorage.getItem('crisis_sessions') || '[]');
    history.push(session);
    secureStorage.setItem('crisis_sessions', JSON.stringify(history));
  }
  
  /**
   * Load safety plan - SECURITY: Using secure storage
   */
  private loadSafetyPlan() {
    // Load from secure storage (crisis safety plans are sensitive data)
    const stored = secureStorage.getItem('safety_plan');
    if (stored) {
      this.safetyPlan = JSON.parse(stored);
    }
  }
  
  /**
   * Update safety plan
   */
  public updateSafetyPlan(plan: Partial<SafetyPlan>) {
    this.safetyPlan = {
      ...this.safetyPlan,
      ...plan,
      lastUpdated: new Date()
    } as SafetyPlan;
    
    // Persist to secure storage (safety plans contain sensitive crisis data)
    secureStorage.setItem('safety_plan', JSON.stringify(this.safetyPlan));
  }
  
  /**
   * Start periodic assessment
   */
  private startPeriodicAssessment() {
    // Run assessment every hour
    const assessmentTimer = setInterval(() => {
      this.runPeriodicAssessment();
    }, 60 * 60 * 1000); // 1 hour
    
    this.riskMonitors.set('periodic_assessment', assessmentTimer);
  }
  
  /**
   * Run periodic assessment
   */
  private runPeriodicAssessment() {
    // Gather recent data
    const wellnessStore = useWellnessStore.getState();
    const activityStore = useActivityStore.getState();
    
    // Analyze patterns
    const recentMoods = wellnessStore.moodEntries.slice(-10);
    const recentActivities = activityStore.activities.filter(a => {
      const date = new Date(a.completedAt || a.scheduledTime || Date.now());
      const hoursDiff = (Date.now() - date.getTime()) / (1000 * 60 * 60);
      return hoursDiff <= 24;
    });
    
    // Check for concerning patterns
    const triggers: CrisisTrigger[] = [];
    
    // Declining mood pattern
    if (recentMoods.length >= 3) {
      const trend = this.calculateMoodTrend(recentMoods);
      if (trend < -0.5) {
        triggers.push({
          type: 'declining_mood_trend',
          source: 'periodic_assessment',
          timestamp: new Date(),
          data: { trend },
          confidence: 0.7
        });
      }
    }
    
    // Social isolation
    const socialActivities = recentActivities.filter(a => a.category === 'social');
    if (socialActivities.length === 0) {
      triggers.push({
        type: 'social_isolation',
        source: 'periodic_assessment',
        timestamp: new Date(),
        data: { hours: 24 },
        confidence: 0.5
      });
    }
    
    if (triggers.length > 0) {
      this.assessCrisisRisk(triggers);
    }
  }
  
  /**
   * Calculate mood trend
   */
  private calculateMoodTrend(moods: any[]): number {
    if (moods.length < 2) return 0;
    
    const scores = moods.map(m => m.moodScore);
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length;
    
    return secondAvg - firstAvg;
  }
  
  /**
   * Handle real-time crisis event
   */
  private handleRealtimeCrisisEvent(data: any) {
    const { type, payload } = data;
    
    switch (type) {
      case 'counselor_available':
        if (this.currentSession && this.currentSession.status === 'waiting') {
          this.connectCounselor(payload.counselorId);
        }
        break;
        
      case 'message_received':
        if (this.currentSession) {
          this.currentSession.messages.push(payload.message);
        }
        break;
        
      case 'escalation_required':
        if (this.currentSession) {
          this.currentSession.status = 'escalated';
          this.contactEmergencyServices(payload.contactId);
        }
        break;
    }
  }
  
  /**
   * Get current crisis status
   */
  public getCrisisStatus() {
    const latestAssessment = this.assessmentQueue[this.assessmentQueue.length - 1];
    
    return {
      isInCrisis: this.currentSession !== null,
      currentSession: this.currentSession,
      latestAssessment,
      safetyPlanAvailable: this.safetyPlan !== null,
      isMonitoring: this.isMonitoring
    };
  }
  
  /**
   * Cleanup
   */
  public cleanup() {
    // Clear timers
    this.riskMonitors.forEach(timer => clearInterval(timer));
    this.riskMonitors.clear();
    
    // End session if active
    if (this.currentSession) {
      this.endCrisisSession('service_cleanup');
    }
    
    this.removeAllListeners();
  }
}

// Export singleton instance
export const crisisIntegrationService = CrisisIntegrationService.getInstance();

// Export React hook
export function useCrisisIntegration() {
  const service = CrisisIntegrationService.getInstance();
  
  return {
    startSession: (severity?: CrisisSeverity) => service.startCrisisSession(severity),
    endSession: (reason?: string) => service.endCrisisSession(reason),
    activateSafetyPlan: () => service.activateSafetyPlan(),
    updateSafetyPlan: (plan: Partial<SafetyPlan>) => service.updateSafetyPlan(plan),
    contactEmergency: (contactId: string) => service.contactEmergencyServices(contactId),
    sendMessage: (message: CrisisMessage) => service.addSessionMessage(message),
    getStatus: () => service.getCrisisStatus(),
    on: (event: CrisisEventType, callback: (...args: any[]) => void) => {
      service.on(event, callback);
      return () => service.off(event, callback);
    }
  };
}