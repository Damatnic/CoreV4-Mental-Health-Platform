import { QuickAction } from '../../../../types/dashboard';

interface RecommendationContext {
  userId: string;
  currentMood?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  location?: { lat: number; lng: number };
  recentActivity?: string[];
  actionHistory?: string[];
  weatherCondition?: string;
  dayOfWeek?: number;
  stressLevel?: number;
  sleepQuality?: number;
  socialInteraction?: number;
}

interface ActionScore {
  action: QuickAction;
  score: number;
  reasons: string[];
}

export class ActionRecommendationEngine {
  private context: RecommendationContext;
  private actionWeights: Map<string, number>;
  private contextualRules: Map<string, (context: RecommendationContext) => number>;

  constructor(context: RecommendationContext) {
    this.context = context;
    this.actionWeights = new Map();
    this.contextualRules = new Map();
    this.initializeRules();
  }

  private initializeRules() {
    // Time-based rules
    this.contextualRules.set('morning_meditation', (ctx) => {
      if (ctx.timeOfDay === 'morning') return 0.8;
      return 0.2;
    });

    this.contextualRules.set('evening_journal', (ctx) => {
      if (ctx.timeOfDay === 'evening') return 0.9;
      if (ctx.timeOfDay === 'night') return 0.7;
      return 0.3;
    });

    // Mood-based rules
    this.contextualRules.set('crisis_low_mood', (ctx) => {
      const moodScore = this.getMoodScore(ctx.currentMood);
      if (moodScore < 3) return 1.0; // High priority for crisis actions
      return 0.1;
    });

    this.contextualRules.set('breathing_anxiety', (ctx) => {
      if (ctx.currentMood?.toLowerCase().includes('anxious') ||
          ctx.currentMood?.toLowerCase().includes('stressed')) {
        return 0.9;
      }
      return 0.4;
    });

    // Activity pattern rules
    this.contextualRules.set('medication_reminder', (ctx) => {
      const hour = new Date().getHours();
      // Common medication times: 8am, 12pm, 6pm, 10pm
      if ([8, 12, 18, 22].includes(hour)) return 0.8;
      return 0.2;
    });

    // Social connection rules
    this.contextualRules.set('social_isolation', (ctx) => {
      if (ctx.socialInteraction && ctx.socialInteraction < 3) return 0.7;
      return 0.3;
    });

    // Sleep-based rules
    this.contextualRules.set('sleep_hygiene', (ctx) => {
      if (ctx.timeOfDay === 'night' && ctx.sleepQuality && ctx.sleepQuality < 5) {
        return 0.8;
      }
      return 0.2;
    });

    // Weather-based rules
    this.contextualRules.set('indoor_activities', (ctx) => {
      if (ctx.weatherCondition === 'rainy' || ctx.weatherCondition === 'stormy') {
        return 0.7;
      }
      return 0.4;
    });

    // Stress-based rules
    this.contextualRules.set('stress_relief', (ctx) => {
      if (ctx.stressLevel && ctx.stressLevel > 7) return 0.9;
      return 0.3;
    });
  }

  private getMoodScore(mood?: string): number {
    if (!mood) return 5;
    
    const moodScores: Record<string, number> = {
      'very_bad': 1,
      'bad': 2,
      'low': 3,
      'neutral': 5,
      'okay': 6,
      'good': 7,
      'very_good': 8,
      'excellent': 9
    };
    
    return moodScores[mood.toLowerCase()] || 5;
  }

  private calculateBaseScore(action: QuickAction): number {
    let score = 0.5; // Base score

    // Emergency actions always have high priority
    if (action.isEmergency || action.category === 'crisis') {
      score = 0.9;
    }

    // Boost frequently used actions
    if (this.context.actionHistory?.includes(action.id)) {
      const frequency = this.context.actionHistory.filter(id => id === action.id).length;
      score += Math.min(0.2, frequency * 0.05);
    }

    // Category-based scoring
    const categoryScores: Record<string, number> = {
      'crisis': 0.9,
      'wellness': 0.7,
      'tracking': 0.6,
      'therapy': 0.7,
      'social': 0.5,
      'professional': 0.6
    };

    if (action.category && categoryScores[action.category] !== undefined) {
      score = (score + categoryScores[action.category]!) / 2;
    }

    return score;
  }

  private applyContextualBoosts(action: QuickAction, baseScore: number): ActionScore {
    let score = baseScore;
    const reasons: string[] = [];

    // Time-based boosts
    if (this.context.timeOfDay === 'morning' && 
        ['meditation', 'mood', 'medication'].includes(action.icon)) {
      score += 0.2;
      reasons.push('Recommended for morning routine');
    }

    if (this.context.timeOfDay === 'evening' && 
        ['journal', 'breathe', 'sleep'].includes(action.icon)) {
      score += 0.2;
      reasons.push('Good for evening wind-down');
    }

    // Mood-based boosts
    const moodScore = this.getMoodScore(this.context.currentMood);
    
    if (moodScore < 4) {
      if (['emergency', 'crisis', 'grounding', 'breathe'].includes(action.icon)) {
        score += 0.3;
        reasons.push('Helpful for current mood');
      }
    }

    if (this.context.currentMood?.includes('anxious')) {
      if (['breathe', 'meditation', 'grounding', 'music'].includes(action.icon)) {
        score += 0.25;
        reasons.push('Can help with anxiety');
      }
    }

    // Recent activity patterns
    if (this.context.recentActivity) {
      const lastActivity = this.context.recentActivity[this.context.recentActivity.length - 1];
      
      // Suggest complementary activities
      if (lastActivity === 'exercise' && action.icon === 'meditation') {
        score += 0.15;
        reasons.push('Great after exercise');
      }
      
      if (lastActivity === 'therapy' && action.icon === 'journal') {
        score += 0.15;
        reasons.push('Process therapy insights');
      }
    }

    // Apply custom contextual rules
    for (const [ruleName, ruleFunc] of this.contextualRules) {
      const ruleScore = ruleFunc(this.context);
      if (ruleScore > 0.5) {
        // Check if rule applies to this action
        if (this.doesRuleApply(ruleName, action)) {
          score += ruleScore * 0.3;
          reasons.push(this.getRuleReason(ruleName));
        }
      }
    }

    // Stress-based recommendations
    if (this.context.stressLevel && this.context.stressLevel > 6) {
      if (['breathe', 'meditation', 'music', 'grounding'].includes(action.icon)) {
        score += 0.2;
        reasons.push('Stress relief activity');
      }
    }

    // Sleep quality recommendations
    if (this.context.sleepQuality && this.context.sleepQuality < 5) {
      if (this.context.timeOfDay === 'night' && 
          ['sleep', 'meditation', 'breathe'].includes(action.icon)) {
        score += 0.2;
        reasons.push('May improve sleep');
      }
    }

    return {
      action,
      score: Math.min(1.0, score),
      reasons
    };
  }

  private doesRuleApply(ruleName: string, action: QuickAction): boolean {
    const ruleActionMap: Record<string, string[]> = {
      'morning_meditation': ['meditation', 'breathe', 'mindfulness'],
      'evening_journal': ['journal', 'reflection', 'gratitude'],
      'crisis_low_mood': ['emergency', 'crisis', 'help'],
      'breathing_anxiety': ['breathe', 'grounding', 'calm'],
      'medication_reminder': ['medication', 'pill', 'reminder'],
      'social_isolation': ['community', 'connect', 'social'],
      'sleep_hygiene': ['sleep', 'relax', 'wind-down'],
      'indoor_activities': ['meditation', 'journal', 'breathe'],
      'stress_relief': ['breathe', 'meditation', 'music', 'grounding']
    };

    const applicableActions = ruleActionMap[ruleName] || [];
    return applicableActions.some(actionType => 
      action.icon === actionType || 
      action.label.toLowerCase().includes(actionType)
    );
  }

  private getRuleReason(ruleName: string): string {
    const reasonMap: Record<string, string> = {
      'morning_meditation': 'Start your day mindfully',
      'evening_journal': 'Reflect on your day',
      'crisis_low_mood': 'Support available',
      'breathing_anxiety': 'Calm your mind',
      'medication_reminder': 'Medication time',
      'social_isolation': 'Connect with others',
      'sleep_hygiene': 'Prepare for better sleep',
      'indoor_activities': 'Indoor activity',
      'stress_relief': 'Reduce stress'
    };

    return reasonMap[ruleName] || 'Contextually relevant';
  }

  public getRecommendations(actions: QuickAction[], limit: number = 5): QuickAction[] {
    const scoredActions: ActionScore[] = actions.map(action => {
      const baseScore = this.calculateBaseScore(action);
      return this.applyContextualBoosts(action, baseScore);
    });

    // Sort by score and return top recommendations
    scoredActions.sort((a, b) => b.score - a.score);
    
    // Add recommendation metadata to actions
    return scoredActions.slice(0, limit).map(scored => ({
      ...scored.action,
      recommendationScore: scored.score,
      recommendationReasons: scored.reasons
    }));
  }

  public updateContext(newContext: Partial<RecommendationContext>) {
    this.context = { ...this.context, ...newContext };
  }

  public getActionInsights(actionId: string): {
    bestTimes: string[];
    complementaryActions: string[];
    frequency: number;
    effectiveness: number;
  } {
    // Analyze historical data for the action
    const frequency = this.context.actionHistory?.filter(id => id === actionId).length || 0;
    
    return {
      bestTimes: this.getBestTimesForAction(actionId),
      complementaryActions: this.getComplementaryActions(actionId),
      frequency,
      effectiveness: this.calculateEffectiveness(actionId)
    };
  }

  private getBestTimesForAction(actionId: string): string[] {
    // Simplified logic - in real implementation, this would analyze historical success
    const timeMap: Record<string, string[]> = {
      'meditation': ['morning', 'evening'],
      'journal': ['evening', 'night'],
      'exercise': ['morning', 'afternoon'],
      'breathe': ['anytime'],
      'medication': ['morning', 'evening']
    };

    return timeMap[actionId] || ['anytime'];
  }

  private getComplementaryActions(actionId: string): string[] {
    const complementMap: Record<string, string[]> = {
      'meditation': ['journal', 'breathe'],
      'exercise': ['meditation', 'hydration'],
      'therapy': ['journal', 'mood'],
      'journal': ['mood', 'meditation'],
      'crisis': ['breathe', 'grounding', 'contact']
    };

    return complementMap[actionId] || [];
  }

  private calculateEffectiveness(actionId: string): number {
    // Simplified effectiveness calculation
    // In real implementation, this would analyze mood improvements after action usage
    const frequency = this.context.actionHistory?.filter(id => id === actionId).length || 0;
    return Math.min(1.0, 0.5 + (frequency * 0.1));
  }
}