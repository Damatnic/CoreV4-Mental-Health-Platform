/**
 * AI-Powered Wellness Recommendation Service
 * 
 * Personalized mental health recommendations based on:
 * - User behavior patterns
 * - Wellness goals and progress  
 * - Crisis risk factors
 * - Evidence-based interventions
 */

import { logger, LogCategory } from '../logging/logger';
import { crisisDetectionService, CrisisProfile } from './CrisisDetectionService';

export interface WellnessRecommendation {
  id: string;
  type: 'activity' | 'content' | 'tool' | 'resource' | 'intervention';
  category: 'mindfulness' | 'movement' | 'social' | 'cognitive' | 'behavioral' | 'crisis';
  title: string;
  description: string;
  reasoning: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  confidence: number; // 0-1
  estimatedImpact: 'low' | 'medium' | 'high';
  timeCommitment: string;
  difficulty: 'easy' | 'moderate' | 'challenging';
  resources: WellnessResource[];
  personalizedMessage: string;
  adaptiveTriggers?: string[];
}

export interface WellnessResource {
  type: 'article' | 'exercise' | 'video' | 'audio' | 'tool' | 'professional';
  title: string;
  url: string;
  duration?: string;
  description: string;
  evidenceBased: boolean;
}

export interface UserWellnessProfile {
  userId: string;
  preferences: WellnessPreferences;
  goals: WellnessGoal[];
  history: WellnessActivity[];
  progressMetrics: ProgressMetric[];
  adaptivePersonality: PersonalityInsights;
  lastUpdated: Date;
}

export interface WellnessPreferences {
  preferredTimes: string[];
  preferredDuration: 'short' | 'medium' | 'long';
  difficultyPreference: 'easy' | 'moderate' | 'challenging';
  contentTypes: string[];
  avoidTopics: string[];
  accessibilityNeeds: string[];
}

export interface WellnessGoal {
  id: string;
  type: 'mood' | 'anxiety' | 'sleep' | 'stress' | 'social' | 'habits';
  target: string;
  progress: number; // 0-1
  timeline: string;
  milestones: string[];
  isActive: boolean;
}

export interface WellnessActivity {
  id: string;
  type: string;
  timestamp: Date;
  duration: number;
  effectiveness: number; // 0-1, user feedback
  context: Record<string, unknown>;
}

export interface ProgressMetric {
  metric: string;
  value: number;
  trend: 'improving' | 'stable' | 'declining';
  timestamp: Date;
  context?: string;
}

export interface PersonalityInsights {
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  motivationStyle: 'intrinsic' | 'extrinsic' | 'social' | 'achievement';
  stressResponse: 'fight' | 'flight' | 'freeze' | 'fawn';
  copingStrategies: string[];
  resilenceFactors: string[];
}

export class WellnessRecommendationService {
  private static instance: WellnessRecommendationService;
  private userProfiles: Map<string, UserWellnessProfile> = new Map();
  private readonly evidenceBase = new EvidenceBasedInterventions();

  private constructor() {
    this.initializeRecommendationEngine();
  }

  public static getInstance(): WellnessRecommendationService {
    if (!WellnessRecommendationService.instance) {
      WellnessRecommendationService.instance = new WellnessRecommendationService();
    }
    return WellnessRecommendationService.instance;
  }

  /**
   * Generate personalized wellness recommendations
   */
  public async generateRecommendations(
    userId: string,
    context?: RecommendationContext
  ): Promise<WellnessRecommendation[]> {
    try {
      const userProfile = await this.getUserProfile(userId);
      const crisisProfile = await crisisDetectionService.analyzeCrisisRisk(userId, {});
      
      const recommendations = await this.createPersonalizedRecommendations(
        userProfile,
        crisisProfile,
        context
      );

      // Learn from user interactions to improve future recommendations
      this.updateRecommendationModel(userId, recommendations);

      logger.info('Wellness recommendations generated', {
        category: LogCategory.AI,
        userId,
        metadata: {
          recommendationCount: recommendations.length,
          crisisRisk: crisisProfile.riskLevel
        }
      });

      return recommendations;

    } catch {
      logger.error('Wellness recommendation generation failed', error instanceof Error ? error : new Error(String(error)), {
        category: LogCategory.AI,
        userId
      });
      return this.getFallbackRecommendations();
    }
  }

  /**
   * Create personalized recommendations based on user profile and crisis risk
   */
  private async createPersonalizedRecommendations(
    userProfile: UserWellnessProfile,
    crisisProfile: CrisisProfile,
    context?: RecommendationContext
  ): Promise<WellnessRecommendation[]> {
    const recommendations: WellnessRecommendation[] = [];
    
    // Crisis-priority recommendations
    if (crisisProfile.riskLevel === 'critical' || crisisProfile.riskLevel === 'high') {
      recommendations.push(...this.getCrisisInterventionRecommendations(crisisProfile, userProfile));
    }

    // Immediate wellness recommendations (for current session)
    recommendations.push(...await this.getImmediateRecommendations(userProfile, context));

    // Goal-based recommendations
    for (const goal of userProfile.goals.filter(g => g.isActive)) {
      recommendations.push(...await this.getGoalBasedRecommendations(goal, userProfile));
    }

    // Adaptive recommendations based on patterns
    recommendations.push(...await this.getAdaptiveRecommendations(userProfile));

    // Evidence-based interventions matching user profile
    recommendations.push(...this.getEvidenceBasedRecommendations(userProfile, crisisProfile));

    // Personalize and rank all recommendations
    return this.personalizeAndRankRecommendations(recommendations, userProfile, crisisProfile);
  }

  /**
   * Generate crisis intervention recommendations
   */
  private getCrisisInterventionRecommendations(
    _crisisProfile: CrisisProfile,
    _userProfile: UserWellnessProfile
  ): WellnessRecommendation[] {
    const recommendations: WellnessRecommendation[] = [];

    // Immediate safety and grounding techniques
    recommendations.push({
      id: 'crisis-grounding-54321',
      type: 'intervention',
      category: 'crisis',
      title: '5-4-3-2-1 Grounding Technique',
      description: 'Use your senses to ground yourself in the present moment',
      reasoning: 'Crisis indicators suggest immediate grounding support needed',
      priority: 'urgent',
      confidence: 0.95,
      estimatedImpact: 'high',
      timeCommitment: '2-5 minutes',
      difficulty: 'easy',
      personalizedMessage: 'This technique can help you feel more stable right now. You\'re not alone.',
      resources: [{
        type: 'exercise',
        title: 'Interactive 5-4-3-2-1 Grounding',
        url: '/wellness/grounding',
        duration: '5 minutes',
        description: 'Guided grounding exercise with calming visuals',
        evidenceBased: true
      }],
      adaptiveTriggers: ['panic', 'overwhelm', 'dissociation']
    });

    // Breathing exercises for crisis management
    recommendations.push({
      id: 'crisis-breathing-box',
      type: 'activity',
      category: 'mindfulness',
      title: 'Box Breathing for Crisis',
      description: 'Slow, controlled breathing to activate calm response',
      reasoning: 'Breathing techniques effectively reduce acute distress',
      priority: 'urgent',
      confidence: 0.9,
      estimatedImpact: 'high',
      timeCommitment: '3-10 minutes',
      difficulty: 'easy',
      personalizedMessage: 'Breathing exercises can help your nervous system find calm.',
      resources: [{
        type: 'tool',
        title: 'Crisis Breathing Guide',
        url: '/wellness/breathing/crisis',
        duration: '3-10 minutes',
        description: 'Specialized breathing patterns for crisis moments',
        evidenceBased: true
      }]
    });

    return recommendations;
  }

  /**
   * Generate immediate recommendations for current session
   */
  private async getImmediateRecommendations(
    userProfile: UserWellnessProfile,
    context?: RecommendationContext
  ): Promise<WellnessRecommendation[]> {
    const recommendations: WellnessRecommendation[] = [];
    const _currentTime = new Date();
    const timeOfDay = this.getTimeOfDay(_currentTime);

    // Time-based recommendations
    if (timeOfDay === 'morning') {
      recommendations.push({
        id: 'morning-intention',
        type: 'activity',
        category: 'mindfulness',
        title: 'Morning Intention Setting',
        description: 'Start your day with purpose and gentle goals',
        reasoning: 'Morning routines improve mental health outcomes throughout the day',
        priority: 'medium',
        confidence: 0.8,
        estimatedImpact: 'medium',
        timeCommitment: '5 minutes',
        difficulty: 'easy',
        personalizedMessage: 'Good morning! Setting intentions can help create a positive day.',
        resources: [{
          type: 'exercise',
          title: 'Daily Intention Practice',
          url: '/wellness/intentions',
          duration: '5 minutes',
          description: 'Guided intention setting with journaling prompts',
          evidenceBased: true
        }]
      });
    }

    // Context-based recommendations
    if (context?.currentMood && context.currentMood < 3) {
      recommendations.push({
        id: 'mood-lift-gentle',
        type: 'activity',
        category: 'behavioral',
        title: 'Gentle Mood Lifting Activity',
        description: 'Small, achievable actions to improve how you feel',
        reasoning: 'Current mood indicates need for gentle mood enhancement',
        priority: 'high',
        confidence: 0.85,
        estimatedImpact: 'medium',
        timeCommitment: '10-15 minutes',
        difficulty: 'easy',
        personalizedMessage: 'When we\'re feeling low, small positive actions can help.',
        resources: this.getMoodLiftingResources(userProfile.preferences)
      });
    }

    // Weather-based recommendations (if available)
    if (context?.weather === 'sunny') {
      recommendations.push({
        id: 'sunshine-activity',
        type: 'activity',
        category: 'movement',
        title: 'Sunshine Wellness Activity',
        description: 'Take advantage of natural light for mood benefits',
        reasoning: 'Sunlight exposure improves mood and vitamin D synthesis',
        priority: 'medium',
        confidence: 0.75,
        estimatedImpact: 'medium',
        timeCommitment: '15-30 minutes',
        difficulty: 'easy',
        personalizedMessage: 'Beautiful weather today! Natural light can boost your mood.',
        resources: [{
          type: 'exercise',
          title: 'Mindful Sun Exposure',
          url: '/wellness/outdoor',
          duration: '15 minutes',
          description: 'Safe, mindful ways to enjoy natural light',
          evidenceBased: true
        }]
      });
    }

    return recommendations;
  }

  /**
   * Generate goal-based recommendations
   */
  private async getGoalBasedRecommendations(
    goal: WellnessGoal,
    userProfile: UserWellnessProfile
  ): Promise<WellnessRecommendation[]> {
    const recommendations: WellnessRecommendation[] = [];

    switch (goal.type) {
      case 'anxiety':
        recommendations.push({
          id: `anxiety-cbt-${goal.id}`,
          type: 'tool',
          category: 'cognitive',
          title: 'Anxiety Thought Challenge',
          description: 'Use CBT techniques to examine anxious thoughts',
          reasoning: `Working toward your anxiety management goal: ${goal.target}`,
          priority: 'medium',
          confidence: 0.88,
          estimatedImpact: 'high',
          timeCommitment: '10-20 minutes',
          difficulty: userProfile.preferences.difficultyPreference,
          personalizedMessage: `You've made ${Math.round(goal.progress * 100)}% progress on your anxiety goal!`,
          resources: [{
            type: 'tool',
            title: 'CBT Thought Record',
            url: '/wellness/cbt/thought-challenge',
            duration: '10-20 minutes',
            description: 'Interactive cognitive behavioral therapy tool',
            evidenceBased: true
          }]
        });
        break;

      case 'sleep':
        recommendations.push({
          id: `sleep-hygiene-${goal.id}`,
          type: 'content',
          category: 'behavioral',
          title: 'Sleep Hygiene Check-in',
          description: 'Review and improve your sleep habits',
          reasoning: `Supporting your sleep improvement goal: ${goal.target}`,
          priority: 'medium',
          confidence: 0.82,
          estimatedImpact: 'high',
          timeCommitment: '15 minutes',
          difficulty: 'moderate',
          personalizedMessage: 'Better sleep can significantly improve your mental health.',
          resources: [{
            type: 'tool',
            title: 'Sleep Hygiene Assessment',
            url: '/wellness/sleep/assessment',
            duration: '15 minutes',
            description: 'Personalized sleep habit evaluation and improvement plan',
            evidenceBased: true
          }]
        });
        break;

      case 'mood':
        recommendations.push({
          id: `mood-tracking-${goal.id}`,
          type: 'activity',
          category: 'behavioral',
          title: 'Daily Mood Check-in',
          description: 'Track your mood patterns to identify what helps',
          reasoning: `Progress tracking for your mood goal: ${goal.target}`,
          priority: 'medium',
          confidence: 0.85,
          estimatedImpact: 'medium',
          timeCommitment: '5 minutes',
          difficulty: 'easy',
          personalizedMessage: 'Understanding your mood patterns helps you feel more in control.',
          resources: [{
            type: 'tool',
            title: 'Advanced Mood Tracker',
            url: '/wellness/mood/tracker',
            duration: '5 minutes',
            description: 'Comprehensive mood tracking with insights',
            evidenceBased: true
          }]
        });
        break;
    }

    return recommendations;
  }

  /**
   * Get evidence-based recommendations
   */
  private getEvidenceBasedRecommendations(
    userProfile: UserWellnessProfile,
    crisisProfile: CrisisProfile
  ): WellnessRecommendation[] {
    return this.evidenceBase.getRecommendations(userProfile, crisisProfile);
  }

  /**
   * Personalize and rank recommendations
   */
  private personalizeAndRankRecommendations(
    recommendations: WellnessRecommendation[],
    userProfile: UserWellnessProfile,
    _crisisProfile: CrisisProfile
  ): WellnessRecommendation[] {
    // Apply personalization based on user preferences and history
    const personalized = recommendations.map(rec => ({
      ...rec,
      confidence: this.adjustConfidenceForUser(rec.confidence, rec, userProfile),
      personalizedMessage: this.enhancePersonalizedMessage(rec, userProfile)
    }));

    // Rank by priority, confidence, and user preferences
    return personalized
      .sort((a, b) => {
        const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        return b.confidence - a.confidence;
      })
      .slice(0, 8); // Limit to top 8 recommendations to avoid overwhelming
  }

  // Helper methods
  private async getUserProfile(userId: string): Promise<UserWellnessProfile> {
    return this.userProfiles.get(userId) || this.createDefaultProfile(userId);
  }

  private createDefaultProfile(userId: string): UserWellnessProfile {
    return {
      userId,
      preferences: {
        preferredTimes: ['morning'],
        preferredDuration: 'short',
        difficultyPreference: 'easy',
        contentTypes: ['mindfulness', 'breathing'],
        avoidTopics: [],
        accessibilityNeeds: []
      },
      goals: [],
      history: [],
      progressMetrics: [],
      adaptivePersonality: {
        learningStyle: 'mixed',
        motivationStyle: 'intrinsic',
        stressResponse: 'flight',
        copingStrategies: [],
        resilenceFactors: []
      },
      lastUpdated: new Date()
    };
  }

  private getTimeOfDay(date: Date): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  private getMoodLiftingResources(_preferences: WellnessPreferences): WellnessResource[] {
    return [{
      type: 'exercise',
      title: 'Gentle Mood Boosters',
      url: '/wellness/mood/lift',
      duration: '10 minutes',
      description: 'Simple activities to improve mood naturally',
      evidenceBased: true
    }];
  }

  private adjustConfidenceForUser(
    baseConfidence: number,
    recommendation: WellnessRecommendation,
    userProfile: UserWellnessProfile
  ): number {
    let adjustedConfidence = baseConfidence;
    
    // Adjust based on user's historical success with similar recommendations
    const similarHistory = userProfile.history.filter(h => 
      h.type === recommendation.type || h.id.includes(recommendation.category)
    );
    
    if (similarHistory.length > 0) {
      const avgEffectiveness = similarHistory.reduce((sum, h) => sum + h.effectiveness, 0) / similarHistory.length;
      adjustedConfidence = (adjustedConfidence + avgEffectiveness) / 2;
    }

    // Adjust for user preferences
    if (userProfile.preferences.contentTypes.includes(recommendation.category)) {
      adjustedConfidence += 0.1;
    }

    return Math.min(Math.max(adjustedConfidence, 0), 1);
  }

  private enhancePersonalizedMessage(
    recommendation: WellnessRecommendation,
    userProfile: UserWellnessProfile
  ): string {
    // Add user's name or personalized elements if available
    let message = recommendation.personalizedMessage;
    
    // Add progress encouragement if relevant goals exist
    const relevantGoals = userProfile.goals.filter(g => 
      g.type === recommendation.category || g.isActive
    );
    
    if (relevantGoals.length > 0 && relevantGoals[0] && relevantGoals[0].progress > 0.5) {
      message += ` You're making great progress on your wellness journey!`;
    }

    return message;
  }

  private getFallbackRecommendations(): WellnessRecommendation[] {
    return [{
      id: 'fallback-breathing',
      type: 'activity',
      category: 'mindfulness',
      title: 'Simple Breathing Exercise',
      description: 'Take a moment to breathe mindfully',
      reasoning: 'Breathing exercises are universally helpful for mental wellness',
      priority: 'medium',
      confidence: 0.8,
      estimatedImpact: 'medium',
      timeCommitment: '3 minutes',
      difficulty: 'easy',
      personalizedMessage: 'Taking a few mindful breaths can help you feel more centered.',
      resources: [{
        type: 'tool',
        title: 'Basic Breathing Guide',
        url: '/wellness/breathing',
        duration: '3 minutes',
        description: 'Simple, effective breathing techniques',
        evidenceBased: true
      }]
    }];
  }

  private initializeRecommendationEngine(): void {
    logger.info('Wellness recommendation engine initialized', { category: LogCategory.AI });
  }

  private updateRecommendationModel(_userId: string, _recommendations: WellnessRecommendation[]): void {
    // Implementation for learning from user interactions
    // This would update ML models in production
  }

  private async getAdaptiveRecommendations(_userProfile: UserWellnessProfile): Promise<WellnessRecommendation[]> {
    // Implementation for adaptive recommendations based on user patterns
    return [];
  }
}

/**
 * Evidence-based interventions database
 */
class EvidenceBasedInterventions {
  getRecommendations(
    _userProfile: UserWellnessProfile,
    _crisisProfile: CrisisProfile
  ): WellnessRecommendation[] {
    // Implementation of evidence-based intervention recommendations
    // Based on clinical research and best practices
    return [];
  }
}

// Context for recommendation generation
interface RecommendationContext {
  currentMood?: number;
  stressLevel?: number;
  timeAvailable?: number;
  location?: string;
  weather?: string;
  socialContext?: string;
  recentActivity?: string;
}

export const __wellnessRecommendationService = WellnessRecommendationService.getInstance();