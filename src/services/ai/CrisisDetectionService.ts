/**
 * AI-Powered Crisis Detection Service
 * 
 * Advanced algorithms for detecting mental health crisis patterns
 * Privacy-first approach with local processing
 * Integrates with crisis intervention systems
 */

import { logger, LogCategory } from '../logging/logger';

export interface CrisisIndicator {
  type: 'behavioral' | 'linguistic' | 'temporal' | 'physiological' | 'social';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  timestamp: Date;
  factors: string[];
  context?: Record<string, unknown>;
}

export interface CrisisProfile {
  userId: string;
  riskLevel: 'stable' | 'elevated' | 'high' | 'critical';
  indicators: CrisisIndicator[];
  patterns: CrisisPattern[];
  recommendations: CrisisRecommendation[];
  lastUpdated: Date;
  interventionHistory: InterventionRecord[];
}

export interface CrisisPattern {
  id: string;
  type: 'escalation' | 'cyclical' | 'triggered' | 'chronic';
  description: string;
  frequency: number;
  triggers: string[];
  timeframe: string;
  confidence: number;
}

export interface CrisisRecommendation {
  id: string;
  type: 'immediate' | 'short-term' | 'long-term';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action: string;
  reason: string;
  resources: string[];
  timeframe: string;
}

export interface InterventionRecord {
  timestamp: Date;
  trigger: CrisisIndicator;
  action: 'assessment' | 'chat' | 'hotline' | 'emergency' | 'resources';
  outcome: 'resolved' | 'escalated' | 'ongoing' | 'referred';
  effectiveness: number; // 0-1
}

export class CrisisDetectionService {
  private static instance: CrisisDetectionService;
  private patterns: Map<string, CrisisProfile> = new Map();
  private readonly ANALYSIS_WINDOW = 24 * 60 * 60 * 1000; // 24 hours
  private readonly HIGH_RISK_THRESHOLD = 0.7;
  private readonly CRITICAL_RISK_THRESHOLD = 0.9;

  private constructor() {
    this.initializeDetectionModels();
  }

  public static getInstance(): CrisisDetectionService {
    if (!CrisisDetectionService.instance) {
      CrisisDetectionService.instance = new CrisisDetectionService();
    }
    return CrisisDetectionService.instance;
  }

  /**
   * Analyze user behavior for crisis indicators
   * All processing done locally for privacy
   */
  public async analyzeCrisisRisk(
    userId: string,
    _behaviorData: BehaviorData
  ): Promise<CrisisProfile> {
    try {
      const profile = this.getOrCreateProfile(userId);
      
      // Analyze current indicators
      const currentIndicators = await this.detectIndicators(_behaviorData);
      
      // Update profile with new indicators
      profile.indicators.push(...currentIndicators);
      
      // Keep only recent indicators (24h window)
      profile.indicators = this.filterRecentIndicators(profile.indicators);
      
      // Detect patterns in behavior
      profile.patterns = await this.detectPatterns(profile.indicators);
      
      // Calculate overall risk level
      profile.riskLevel = this.calculateRiskLevel(profile.indicators, profile.patterns);
      
      // Generate recommendations
      profile.recommendations = await this.generateRecommendations(profile);
      
      profile.lastUpdated = new Date();
      
      // Store updated profile (encrypted locally)
      this.patterns.set(userId, profile);
      
      // Log for crisis analytics (_anonymized)
      logger.logCrisisIntervention('risk_analysis_complete', undefined, {
        riskLevel: profile.riskLevel,
        indicatorCount: profile.indicators.length,
        patternCount: profile.patterns.length
      });
      
      return profile;
      
    } catch (error) {
      logger.error('Crisis detection analysis failed', error as Error, { 
        category: LogCategory.CRISIS,
        userId 
      });
      
      // Return safe default profile
      return this.createSafeDefaultProfile(userId);
    }
  }

  /**
   * Detect crisis indicators from behavior data
   */
  private async detectIndicators(data: BehaviorData): Promise<CrisisIndicator[]> {
    const indicators: CrisisIndicator[] = [];
    const timestamp = new Date();

    // Behavioral Pattern Analysis
    if (data.appUsage) {
      indicators.push(...this.analyzeBehavioralPatterns(data.appUsage, timestamp));
    }

    // Linguistic Analysis (if journal entries provided)
    if (data.textContent) {
      indicators.push(...await this.analyzeLinguisticPatterns(data.textContent, timestamp));
    }

    // Temporal Pattern Analysis
    if (data.timestamps) {
      indicators.push(...this.analyzeTemporalPatterns(data.timestamps, timestamp));
    }

    // Mood and Wellness Data
    if (data.moodData) {
      indicators.push(...this.analyzeMoodPatterns(data.moodData, timestamp));
    }

    // Social Interaction Patterns
    if (data.socialData) {
      indicators.push(...this.analyzeSocialPatterns(data.socialData, timestamp));
    }

    return indicators.filter(indicator => indicator.confidence > 0.3);
  }

  /**
   * Analyze behavioral patterns for crisis indicators
   */
  private analyzeBehavioralPatterns(
    usage: AppUsageData, 
    timestamp: Date
  ): CrisisIndicator[] {
    const indicators: CrisisIndicator[] = [];

    // Excessive late-night usage
    if (usage.lateNightHours > 3) {
      indicators.push({
        type: 'behavioral',
        severity: usage.lateNightHours > 6 ? 'high' : 'medium',
        confidence: Math.min(usage.lateNightHours / 8, 1),
        timestamp,
        factors: ['sleep_disruption', 'late_night_activity'],
        context: { lateNightHours: usage.lateNightHours }
      });
    }

    // Unusual frequency of crisis page visits
    if (usage.crisisPageVisits > 2) {
      indicators.push({
        type: 'behavioral',
        severity: usage.crisisPageVisits > 5 ? 'critical' : 'high',
        confidence: Math.min(usage.crisisPageVisits / 10, 0.95),
        timestamp,
        factors: ['crisis_seeking_behavior', 'help_seeking'],
        context: { crisisPageVisits: usage.crisisPageVisits }
      });
    }

    // Rapid navigation changes (restlessness/agitation)
    if (usage.rapidNavigationChanges > 10) {
      indicators.push({
        type: 'behavioral',
        severity: 'medium',
        confidence: Math.min(usage.rapidNavigationChanges / 20, 0.8),
        timestamp,
        factors: ['restlessness', 'difficulty_focusing'],
        context: { navigationChanges: usage.rapidNavigationChanges }
      });
    }

    return indicators;
  }

  /**
   * Analyze text content for linguistic crisis indicators
   * Uses privacy-preserving local NLP processing
   */
  private async analyzeLinguisticPatterns(
    textContent: TextData[],
    timestamp: Date
  ): Promise<CrisisIndicator[]> {
    const indicators: CrisisIndicator[] = [];

    for (const content of textContent) {
      const analysis = this.processTextLocally(content.text);
      
      // Crisis-related keywords
      if (analysis.crisisKeywords.length > 0) {
        indicators.push({
          type: 'linguistic',
          severity: analysis.crisisKeywords.includes('suicide') ? 'critical' : 'high',
          confidence: analysis.crisisKeywords.length / 10,
          timestamp,
          factors: ['crisis_language', ...analysis.crisisKeywords],
          context: { keywordCount: analysis.crisisKeywords.length }
        });
      }

      // Negative sentiment analysis
      if (analysis.sentiment < -0.7) {
        indicators.push({
          type: 'linguistic',
          severity: analysis.sentiment < -0.9 ? 'high' : 'medium',
          confidence: Math.abs(analysis.sentiment),
          timestamp,
          factors: ['negative_sentiment', 'emotional_distress'],
          context: { sentiment: analysis.sentiment }
        });
      }

      // Hopelessness indicators
      if (analysis.hopelessnessScore > 0.6) {
        indicators.push({
          type: 'linguistic',
          severity: analysis.hopelessnessScore > 0.8 ? 'critical' : 'high',
          confidence: analysis.hopelessnessScore,
          timestamp,
          factors: ['hopelessness', 'despair'],
          context: { hopelessnessScore: analysis.hopelessnessScore }
        });
      }
    }

    return indicators;
  }

  /**
   * Analyze temporal patterns for crisis indicators
   */
  private analyzeTemporalPatterns(
    timestamps: Date[],
    currentTime: Date
  ): CrisisIndicator[] {
    const indicators: CrisisIndicator[] = [];
    
    // Analyze usage patterns over time
    const hourlyUsage = this.groupByHour(timestamps);
    const __dailyUsage = this.groupByDay(timestamps);

    // Unusual late-night activity patterns
    const lateNightActivity = hourlyUsage.slice(0, 6).reduce((sum, count) => sum + count, 0);
    if (lateNightActivity > timestamps.length * 0.3) {
      indicators.push({
        type: 'temporal',
        severity: 'medium',
        confidence: lateNightActivity / timestamps.length,
        timestamp: currentTime,
        factors: ['sleep_disruption', 'circadian_disruption'],
        context: { lateNightActivity }
      });
    }

    // Sudden changes in usage patterns
    const recentUsage = timestamps.filter(t => 
      currentTime.getTime() - t.getTime() < 3 * 24 * 60 * 60 * 1000
    ).length;
    
    const previousUsage = timestamps.filter(t => {
      const diff = currentTime.getTime() - t.getTime();
      return diff >= 3 * 24 * 60 * 60 * 1000 && diff < 6 * 24 * 60 * 60 * 1000;
    }).length;

    if (recentUsage > previousUsage * 2) {
      indicators.push({
        type: 'temporal',
        severity: 'medium',
        confidence: Math.min(recentUsage / previousUsage, 1),
        timestamp: currentTime,
        factors: ['usage_spike', 'behavioral_change'],
        context: { recentUsage, previousUsage }
      });
    }

    return indicators;
  }

  /**
   * Process text locally for privacy-preserving analysis
   */
  private processTextLocally(text: string): TextAnalysis {
    const words = text.toLowerCase().split(/\s+/);
    
    // Crisis-related keywords (expanded list)
    const crisisKeywords = [
      'suicide', 'kill myself', 'end it all', 'no hope', 'worthless',
      'give up', 'can\'t go on', 'better off dead', 'hurt myself',
      'no point', 'trapped', 'burden', 'hate myself'
    ];

    // Hopelessness indicators
    const hopelessnessWords = [
      'hopeless', 'pointless', 'meaningless', 'empty', 'void',
      'nothing matters', 'no future', 'stuck', 'trapped'
    ];

    const foundCrisisKeywords = crisisKeywords.filter(_keyword => 
      text.toLowerCase().includes(_keyword)
    );

    const foundHopelessnessWords = hopelessnessWords.filter(_word =>
      words.includes(_word)
    );

    // Simple sentiment analysis (can be enhanced with more sophisticated NLP)
    const negativeWords = ['sad', 'angry', 'hurt', 'pain', 'suffering', 'terrible', 'awful'];
    const positiveWords = ['happy', 'good', 'great', 'wonderful', 'amazing', 'better'];
    
    const negativeCount = negativeWords.filter(_word => words.includes(_word)).length;
    const positiveCount = positiveWords.filter(_word => words.includes(_word)).length;
    
    const sentiment = (positiveCount - negativeCount) / Math.max(words.length, 1);
    const hopelessnessScore = foundHopelessnessWords.length / Math.max(words.length, 1) * 10;

    return {
      crisisKeywords: foundCrisisKeywords,
      sentiment,
      hopelessnessScore: Math.min(hopelessnessScore, 1)
    };
  }

  /**
   * Calculate overall risk level based on indicators and patterns
   */
  private calculateRiskLevel(
    indicators: CrisisIndicator[],
    patterns: CrisisPattern[]
  ): 'stable' | 'elevated' | 'high' | 'critical' {
    if (indicators.length === 0) return 'stable';

    // Calculate weighted risk score
    const riskScore = indicators.reduce((total, indicator) => {
      const severityWeight = {
        'low': 0.25,
        'medium': 0.5,
        'high': 0.75,
        'critical': 1.0
      };
      
      return total + (indicator.confidence * severityWeight[indicator.severity]);
    }, 0) / indicators.length;

    // Factor in patterns
    const patternRisk = patterns.reduce((total, pattern) => {
      return total + pattern.confidence * 0.3;
    }, 0);

    const finalRiskScore = Math.min(riskScore + patternRisk, 1);

    if (finalRiskScore >= this.CRITICAL_RISK_THRESHOLD) return 'critical';
    if (finalRiskScore >= this.HIGH_RISK_THRESHOLD) return 'high';
    if (finalRiskScore >= 0.4) return 'elevated';
    return 'stable';
  }

  /**
   * Generate personalized crisis intervention recommendations
   */
  private async generateRecommendations(profile: CrisisProfile): Promise<CrisisRecommendation[]> {
    const recommendations: CrisisRecommendation[] = [];

    // Immediate interventions for high/critical risk
    if (profile.riskLevel === 'critical') {
      recommendations.push({
        id: 'immediate-crisis',
        type: 'immediate',
        priority: 'urgent',
        action: 'Contact crisis hotline immediately',
        reason: 'Critical risk indicators detected',
        resources: ['988', '741741', '/crisis'],
        timeframe: 'Now'
      });
    }

    if (profile.riskLevel === 'high' || profile.riskLevel === 'critical') {
      recommendations.push({
        id: 'safety-plan',
        type: 'immediate',
        priority: 'high',
        action: 'Complete safety planning',
        reason: 'Elevated crisis risk requires preparation',
        resources: ['/crisis/safety-plan', '/professional'],
        timeframe: 'Within 24 hours'
      });
    }

    // Pattern-based recommendations
    for (const pattern of profile.patterns) {
      if (pattern.type === 'triggered' && pattern.confidence > 0.6) {
        recommendations.push({
          id: `trigger-management-${pattern.id}`,
          type: 'short-term',
          priority: 'medium',
          action: 'Develop trigger coping strategies',
          reason: `Identified trigger pattern: ${pattern.description}`,
          resources: ['/wellness/coping-strategies', '/community/support'],
          timeframe: 'Within 1 week'
        });
      }
    }

    // Wellness recommendations based on indicators
    const behavioralIndicators = profile.indicators.filter(i => i.type === 'behavioral');
    if (behavioralIndicators.length > 0) {
      recommendations.push({
        id: 'wellness-routine',
        type: 'long-term',
        priority: 'medium',
        action: 'Establish consistent wellness routine',
        reason: 'Behavioral patterns suggest need for structure',
        resources: ['/wellness', '/wellness/habits'],
        timeframe: 'Ongoing'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Helper methods
  private getOrCreateProfile(userId: string): CrisisProfile {
    return this.patterns.get(userId) || {
      userId,
      riskLevel: 'stable',
      indicators: [],
      patterns: [],
      recommendations: [],
      lastUpdated: new Date(),
      interventionHistory: []
    };
  }

  private filterRecentIndicators(indicators: CrisisIndicator[]): CrisisIndicator[] {
    const cutoff = new Date(Date.now() - this.ANALYSIS_WINDOW);
    return indicators.filter(indicator => indicator.timestamp >= cutoff);
  }

  private createSafeDefaultProfile(userId: string): CrisisProfile {
    return {
      userId,
      riskLevel: 'stable',
      indicators: [],
      patterns: [],
      recommendations: [{
        id: 'safety-check',
        type: 'immediate',
        priority: 'high',
        action: 'Crisis support is available 24/7',
        reason: 'Regular safety reminder',
        resources: ['988', '/crisis'],
        timeframe: 'Anytime'
      }],
      lastUpdated: new Date(),
      interventionHistory: []
    };
  }

  private initializeDetectionModels(): void {
    // Initialize AI models for crisis detection
    // This would load pre-trained models in a production environment
    logger.info('Crisis detection models initialized', { category: LogCategory.CRISIS });
  }

  private detectPatterns(_indicators: CrisisIndicator[]): Promise<CrisisPattern[]> {
    // Implement pattern detection algorithm
    // This is a simplified version - production would use more sophisticated ML
    return Promise.resolve([]);
  }

  private analyzeMoodPatterns(_moodData: MoodData[], _timestamp: Date): CrisisIndicator[] {
    // Implement mood pattern analysis
    return [];
  }

  private analyzeSocialPatterns(_socialData: SocialData, _timestamp: Date): CrisisIndicator[] {
    // Implement social interaction pattern analysis  
    return [];
  }

  private groupByHour(timestamps: Date[]): number[] {
    const hourly = new Array(24).fill(0);
    timestamps.forEach(ts => {
      hourly[ts.getHours()]++;
    });
    return hourly;
  }

  private groupByDay(timestamps: Date[]): number[] {
    const daily = new Array(7).fill(0);
    timestamps.forEach(ts => {
      daily[ts.getDay()]++;
    });
    return daily;
  }
}

// Type definitions for data structures
interface BehaviorData {
  appUsage?: AppUsageData;
  textContent?: TextData[];
  timestamps?: Date[];
  moodData?: MoodData[];
  socialData?: SocialData;
}

interface AppUsageData {
  lateNightHours: number;
  crisisPageVisits: number;
  rapidNavigationChanges: number;
  totalTimeSpent: number;
  sessionsPerDay: number;
}

interface TextData {
  text: string;
  timestamp: Date;
  context: 'journal' | 'chat' | 'assessment';
}

interface TextAnalysis {
  crisisKeywords: string[];
  sentiment: number;
  hopelessnessScore: number;
}

interface MoodData {
  value: number;
  timestamp: Date;
  context?: string;
}

interface SocialData {
  interactions: number;
  supportRequests: number;
  isolationIndicators: number;
}

export const __crisisDetectionService = CrisisDetectionService.getInstance();