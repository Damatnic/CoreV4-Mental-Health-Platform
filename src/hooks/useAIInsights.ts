// AI Insights Data Processing Hook
// Manages AI-powered mental health insights, pattern recognition, and predictions

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  AIInsightsDashboard,
  AIInsight,
  PatternAnalysis,
  PredictiveModel,
  PersonalizedRecommendation,
  TherapeuticIntelligence,
  EnvironmentalInsight,
  ProgressMetrics,
  InsightType,
  InsightCategory,
  ModelType,
  RecommendationType,
  PatternType,
  Prediction,
  CBTAnalysis,
  DBTSkillsAnalysis,
  TherapyProgressAnalysis,
  WellnessMetric,
} from '../types/ai-insights';

// Simulated AI processing functions (would be ML models in production)
const analyzePatterns = (userData: any): PatternAnalysis[] => {
  // Simulate pattern detection algorithm
  const patterns: PatternAnalysis[] = [
    {
      id: 'pattern-1',
      patternType: 'mood_cycle',
      description: 'Your mood tends to dip on Sunday evenings and Monday mornings',
      frequency: {
        type: 'weekly',
        occurrences: 12,
        averageInterval: 168, // hours in a week
        variance: 4,
      },
      strength: 0.78,
      dataPoints: [],
      triggers: [
        {
          id: 'trigger-1',
          triggerType: 'anticipatory_anxiety',
          triggerEvents: ['work_week_start', 'sunday_evening'],
          responseTime: 4,
          responseIntensity: 0.7,
          frequency: 0.85,
          avoidanceStrategies: [
            'Sunday evening relaxation routine',
            'Monday morning preparation on Friday',
            'Weekend accomplishment review',
          ],
        },
      ],
      outcomes: [
        {
          outcome: 'monday_low_mood',
          probability: 0.72,
          averageImpact: -35,
          duration: 24,
          mitigationFactors: ['morning_exercise', 'social_breakfast', 'meditation'],
        },
      ],
      firstDetected: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      lastOccurrence: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      predictiveValue: 0.82,
      clinicalRelevance: {
        isClinicallySignificant: true,
        severityLevel: 'moderate',
        requiresProfessionalReview: false,
        clinicalGuidelines: ['Monitor for signs of anticipatory anxiety'],
        recommendedActions: ['Implement Sunday evening routine', 'Consider CBT for anticipatory anxiety'],
      },
    },
    {
      id: 'pattern-2',
      patternType: 'sleep_pattern',
      description: 'Better mood and energy after 7-8 hours of sleep between 11 PM and 7 AM',
      frequency: {
        type: 'daily',
        occurrences: 45,
        averageInterval: 24,
        variance: 2,
      },
      strength: 0.89,
      dataPoints: [],
      triggers: [
        {
          id: 'trigger-2',
          triggerType: 'sleep_quality',
          triggerEvents: ['consistent_bedtime', 'morning_routine'],
          responseTime: 8,
          responseIntensity: 0.85,
          frequency: 0.9,
          avoidanceStrategies: [],
        },
      ],
      outcomes: [
        {
          outcome: 'improved_mood',
          probability: 0.88,
          averageImpact: 45,
          duration: 16,
          mitigationFactors: [],
        },
      ],
      firstDetected: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      lastOccurrence: new Date(Date.now() - 24 * 60 * 60 * 1000),
      predictiveValue: 0.91,
      clinicalRelevance: {
        isClinicallySignificant: true,
        severityLevel: 'none',
        requiresProfessionalReview: false,
        clinicalGuidelines: ['Sleep hygiene is working well'],
        recommendedActions: ['Maintain current sleep schedule'],
      },
    },
    {
      id: 'pattern-3',
      patternType: 'social_pattern',
      description: 'Mood improvement after social interactions lasting 30+ minutes',
      frequency: {
        type: 'irregular',
        occurrences: 23,
        averageInterval: 72,
        variance: 24,
      },
      strength: 0.71,
      dataPoints: [],
      triggers: [
        {
          id: 'trigger-3',
          triggerType: 'social_interaction',
          triggerEvents: ['friend_meetup', 'family_dinner', 'group_activity'],
          responseTime: 2,
          responseIntensity: 0.75,
          frequency: 0.68,
          avoidanceStrategies: [],
        },
      ],
      outcomes: [
        {
          outcome: 'mood_boost',
          probability: 0.76,
          averageImpact: 32,
          duration: 48,
          mitigationFactors: [],
        },
      ],
      firstDetected: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      lastOccurrence: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      predictiveValue: 0.73,
      clinicalRelevance: {
        isClinicallySignificant: true,
        severityLevel: 'none',
        requiresProfessionalReview: false,
        clinicalGuidelines: ['Social connection is beneficial'],
        recommendedActions: ['Schedule regular social activities', 'Join group activities'],
      },
    },
  ];

  return patterns;
};

const generatePredictions = (patterns: PatternAnalysis[]): PredictiveModel[] => {
  // Simulate predictive modeling
  const models: PredictiveModel[] = [
    {
      id: 'model-1',
      modelType: 'mood_forecast',
      targetVariable: 'mood_score',
      predictions: [
        {
          timeframe: {
            start: new Date(),
            end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            resolution: 'day',
          },
          outcome: 'stable_mood',
          probability: 0.73,
          confidence: 0.81,
          factors: [
            {
              factor: 'sleep_consistency',
              impact: 0.35,
              modifiable: true,
              currentState: 'good',
              optimalState: 'excellent',
              improvementSuggestions: ['Set consistent bedtime alarm', 'Create wind-down routine'],
            },
            {
              factor: 'social_interaction',
              impact: 0.28,
              modifiable: true,
              currentState: 'moderate',
              optimalState: 'high',
              improvementSuggestions: ['Schedule weekly friend meetup', 'Join a support group'],
            },
          ],
          preventiveActions: [
            'Maintain sleep schedule',
            'Plan social activities for mid-week',
            'Continue medication adherence',
          ],
          alternativeScenarios: [
            {
              condition: 'disrupted_sleep',
              probability: 0.27,
              outcome: 'mood_dip',
              recommendations: ['Use sleep hygiene techniques', 'Consider melatonin supplement'],
            },
          ],
        },
      ],
      accuracy: {
        overall: 0.78,
        precision: 0.81,
        recall: 0.75,
        f1Score: 0.78,
        validationMethod: 'cross_validation',
      },
      features: [
        {
          feature: 'sleep_quality',
          importance: 0.32,
          category: 'behavioral',
          description: 'Quality and duration of sleep',
        },
        {
          feature: 'social_interaction_frequency',
          importance: 0.24,
          category: 'social',
          description: 'Number and quality of social interactions',
        },
        {
          feature: 'medication_adherence',
          importance: 0.21,
          category: 'medical',
          description: 'Consistency in taking prescribed medications',
        },
      ],
      lastTrained: new Date(Date.now() - 24 * 60 * 60 * 1000),
      nextUpdate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'model-2',
      modelType: 'crisis_risk',
      targetVariable: 'crisis_probability',
      predictions: [
        {
          timeframe: {
            start: new Date(),
            end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            resolution: 'week',
          },
          outcome: 'low_risk',
          probability: 0.89,
          confidence: 0.92,
          factors: [
            {
              factor: 'support_system',
              impact: -0.41,
              modifiable: true,
              currentState: 'strong',
              optimalState: 'strong',
              improvementSuggestions: ['Maintain regular check-ins'],
            },
            {
              factor: 'coping_skills',
              impact: -0.38,
              modifiable: true,
              currentState: 'developing',
              optimalState: 'strong',
              improvementSuggestions: ['Practice DBT skills daily', 'Review crisis plan monthly'],
            },
          ],
          preventiveActions: [
            'Continue therapy sessions',
            'Maintain support system connections',
            'Practice crisis coping skills',
          ],
          alternativeScenarios: [],
        },
      ],
      accuracy: {
        overall: 0.91,
        precision: 0.93,
        recall: 0.89,
        f1Score: 0.91,
        validationMethod: 'temporal_validation',
      },
      features: [
        {
          feature: 'therapy_engagement',
          importance: 0.41,
          category: 'therapeutic',
          description: 'Engagement and progress in therapy',
        },
        {
          feature: 'support_system_strength',
          importance: 0.35,
          category: 'social',
          description: 'Quality and availability of support network',
        },
      ],
      lastTrained: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      nextUpdate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
  ];

  return models;
};

const generateRecommendations = (
  patterns: PatternAnalysis[],
  predictions: PredictiveModel[]
): PersonalizedRecommendation[] => {
  // Generate personalized recommendations based on patterns and predictions
  const recommendations: PersonalizedRecommendation[] = [
    {
      id: 'rec-1',
      type: 'behavioral',
      priority: 'high',
      title: 'Sunday Evening Relaxation Routine',
      description: 'Create a calming Sunday evening routine to reduce anticipatory anxiety',
      rationale: 'Analysis shows your mood consistently dips on Sunday evenings. A structured relaxation routine can help break this pattern.',
      evidenceStrength: 'strong',
      expectedImpact: {
        metric: 'sunday_evening_mood',
        currentValue: 4.2,
        expectedValue: 6.5,
        timeToImpact: 14,
        confidence: 0.78,
      },
      implementation: {
        steps: [
          {
            order: 1,
            description: 'At 7 PM, begin winding down with light stretching or yoga',
            duration: 15,
            tips: ['Use a guided video if helpful', 'Focus on gentle movements'],
            commonChallenges: ['Forgetting to start', 'Feeling too tired'],
          },
          {
            order: 2,
            description: 'Practice 10 minutes of mindfulness meditation',
            duration: 10,
            tips: ['Use a meditation app', 'Focus on breath awareness'],
            commonChallenges: ['Racing thoughts', 'Difficulty focusing'],
          },
          {
            order: 3,
            description: 'Write three positive reflections from the weekend',
            duration: 10,
            tips: ['Keep it simple', 'Focus on gratitude'],
            commonChallenges: ['Negative thinking patterns', 'Nothing comes to mind'],
          },
          {
            order: 4,
            description: 'Prepare for Monday morning (clothes, breakfast plan)',
            duration: 15,
            tips: ['Keep it simple', 'Prepare the night before'],
            commonChallenges: ['Procrastination', 'Overwhelm'],
          },
        ],
        estimatedTime: 50,
        difficulty: 'moderate',
        requiredResources: ['Quiet space', 'Journal', 'Meditation app'],
        optimalTiming: {
          timeOfDay: ['19:00', '20:00'],
          daysOfWeek: ['Sunday'],
          conditions: ['After dinner', 'Before screen time'],
          avoidWhen: ['Feeling extremely tired', 'Have urgent tasks'],
        },
        successCriteria: ['Complete 4 out of 5 Sundays', 'Mood improvement on Monday mornings'],
      },
      personalizedFor: {
        preferences: [
          { category: 'activity', preference: 'quiet_activities', weight: 0.8 },
          { category: 'timing', preference: 'evening', weight: 0.7 },
        ],
        history: [
          {
            intervention: 'meditation',
            effectiveness: 0.75,
            adherence: 0.68,
            sideEffects: [],
          },
        ],
        constraints: [
          {
            type: 'time',
            description: 'Limited evening time',
            impact: ['Need efficient routine'],
          },
        ],
        goals: ['Reduce anxiety', 'Improve mood stability'],
        culturalConsiderations: [],
      },
      alternativeOptions: [
        {
          title: 'Morning Monday Boost Routine',
          description: 'Focus on Monday morning instead of Sunday evening',
          tradeoffs: ['Requires earlier wake time', 'May feel rushed'],
          suitabilityScore: 0.65,
        },
      ],
      contraindicators: [],
      trackingMetrics: ['Sunday evening mood', 'Monday morning mood', 'Routine completion rate'],
    },
    {
      id: 'rec-2',
      type: 'social',
      priority: 'medium',
      title: 'Weekly Social Connection Goal',
      description: 'Schedule at least two meaningful social interactions per week',
      rationale: 'Your mood improves significantly after social interactions. Regular social connection can provide consistent mood support.',
      evidenceStrength: 'moderate',
      expectedImpact: {
        metric: 'weekly_mood_average',
        currentValue: 5.8,
        expectedValue: 7.1,
        timeToImpact: 21,
        confidence: 0.71,
      },
      implementation: {
        steps: [
          {
            order: 1,
            description: 'Identify 3-4 people you enjoy spending time with',
            duration: 10,
            tips: ['Include both close friends and acquaintances', 'Consider different types of interactions'],
            commonChallenges: ['Limited social circle', 'Social anxiety'],
          },
          {
            order: 2,
            description: 'Schedule two 30+ minute interactions weekly',
            duration: 5,
            tips: ['Mix in-person and virtual', 'Plan activities you both enjoy'],
            commonChallenges: ['Scheduling conflicts', 'Last-minute cancellations'],
          },
          {
            order: 3,
            description: 'Engage in meaningful conversation during interactions',
            duration: 30,
            tips: ['Ask open-ended questions', 'Share authentically'],
            commonChallenges: ['Surface-level conversations', 'Social fatigue'],
          },
        ],
        estimatedTime: 45,
        difficulty: 'easy',
        requiredResources: ['Phone or computer', 'Transportation if in-person'],
        optimalTiming: {
          timeOfDay: ['afternoon', 'early evening'],
          daysOfWeek: ['Wednesday', 'Thursday', 'Saturday'],
          conditions: ['When energy is moderate to high'],
          avoidWhen: ['Feeling overwhelmed', 'During work hours'],
        },
        successCriteria: ['Two interactions per week', 'Mood boost after interactions'],
      },
      personalizedFor: {
        preferences: [
          { category: 'social', preference: 'small_groups', weight: 0.75 },
          { category: 'communication', preference: 'in_person', weight: 0.6 },
        ],
        history: [
          {
            intervention: 'group_therapy',
            effectiveness: 0.82,
            adherence: 0.9,
            sideEffects: ['initial_anxiety'],
          },
        ],
        constraints: [],
        goals: ['Increase social connection', 'Build support network'],
        culturalConsiderations: [],
      },
      alternativeOptions: [
        {
          title: 'Online Community Participation',
          description: 'Engage in online support groups or interest-based communities',
          tradeoffs: ['Less personal', 'Screen time increase'],
          suitabilityScore: 0.58,
        },
      ],
      contraindicators: ['Severe social anxiety requiring gradual exposure'],
      trackingMetrics: ['Social interaction frequency', 'Mood after interactions', 'Connection quality rating'],
    },
  ];

  return recommendations;
};

const analyzeTherapeuticProgress = (): TherapeuticIntelligence => {
  // Simulate therapeutic intelligence analysis
  return {
    cbtAnalysis: {
      thoughtPatterns: [
        {
          pattern: 'Catastrophizing about work performance',
          frequency: 8,
          triggers: ['work deadlines', 'performance reviews', 'Monday mornings'],
          emotionalImpact: -65,
          alternativeThoughts: [
            'I have handled challenges before',
            'One mistake does not define my worth',
            'I can ask for help when needed',
          ],
          evidenceFor: ['Past deadline missed'],
          evidenceAgainst: ['90% success rate', 'Positive feedback from manager'],
        },
      ],
      cognitiveDistortions: [
        {
          type: 'All-or-nothing thinking',
          examples: ['If I\'m not perfect, I\'m a failure', 'Either I do it all or I do nothing'],
          frequency: 12,
          severity: 0.7,
          challengingStrategies: ['Look for the middle ground', 'Rate success on a scale'],
          progress: 0.45,
        },
      ],
      automaticThoughts: [],
      coreBeliefs: [
        {
          belief: 'I must be perfect to be valued',
          strength: 0.68,
          origin: 'Childhood experiences',
          supportingEvidence: ['Past criticism for mistakes'],
          contradictingEvidence: ['Friends value me despite imperfections', 'Partner loves me as I am'],
          alternativeBelief: 'I am valuable as a human being, regardless of performance',
          workInProgress: true,
        },
      ],
      interventionEffectiveness: [],
      homeworkCompletion: 0.75,
      progressIndicators: ['Identifying thoughts more quickly', 'Using thought records regularly'],
    },
    dbtSkillsTracking: {
      moduleProgress: [
        {
          module: 'distress_tolerance',
          completion: 0.65,
          mastery: 0.52,
          practiceFrequency: 4,
          topSkills: ['TIPP', 'Distraction', 'Self-soothing'],
        },
        {
          module: 'emotion_regulation',
          completion: 0.48,
          mastery: 0.35,
          practiceFrequency: 3,
          topSkills: ['PLEASE', 'Opposite action'],
        },
      ],
      skillUsage: [],
      effectivenessRatings: [],
      crisisSkillReadiness: 0.71,
      recommendedSkills: [],
    },
    mindfulnessOptimization: {
      practiceConsistency: 0.68,
      averageDuration: 12,
      preferredTechniques: ['Breath awareness', 'Body scan', 'Walking meditation'],
      optimalTimes: ['Morning', 'Before bed'],
      benefitAreas: [
        {
          area: 'Anxiety reduction',
          improvement: 0.42,
          techniques: ['Breath awareness', '5-4-3-2-1 grounding'],
        },
      ],
      challenges: ['Mind wandering', 'Finding time'],
      recommendations: [],
    },
    behavioralActivation: {
      activityLevels: [],
      moodActivityCorrelation: 0.67,
      pleasurableActivities: [],
      masteryActivities: [],
      schedulingAdherence: 0.72,
      barriers: ['Low energy', 'Lack of motivation'],
      facilitators: ['Social accountability', 'Small steps'],
      recommendations: ['Start with 5-minute activities', 'Schedule activities with friends'],
    },
    therapyProgress: {
      overallProgress: 0.58,
      goalsAchieved: 3,
      totalGoals: 7,
      sessionInsights: [],
      therapeuticAlliance: 0.82,
      readinessForChange: 0.73,
      treatmentAdherence: 0.85,
      areasOfGrowth: ['Emotional awareness', 'Coping skills', 'Self-compassion'],
      areasNeedingFocus: ['Perfectionism', 'Interpersonal effectiveness', 'Core beliefs'],
    },
    therapeuticGoals: [],
  };
};

const generateProgressMetrics = (): ProgressMetrics => {
  // Generate progress metrics
  return {
    overallWellness: {
      score: 68,
      trend: 'improving',
      changeRate: 2.3,
      components: [
        { name: 'Mood', weight: 0.3, score: 65, trend: 'improving' },
        { name: 'Energy', weight: 0.2, score: 58, trend: 'stable' },
        { name: 'Sleep', weight: 0.25, score: 72, trend: 'improving' },
        { name: 'Social', weight: 0.15, score: 70, trend: 'improving' },
        { name: 'Activities', weight: 0.1, score: 75, trend: 'stable' },
      ],
      projectedScore: 74,
    },
    domainMetrics: [
      {
        domain: 'Mental Health',
        currentScore: 67,
        baselineScore: 52,
        targetScore: 80,
        progress: 0.54,
        subMetrics: [
          { name: 'Anxiety Level', value: 4.2, unit: '/10', target: 3, achieved: false },
          { name: 'Depression Score', value: 8, unit: 'PHQ-9', target: 5, achieved: false },
          { name: 'Stress Management', value: 6.5, unit: '/10', target: 7, achieved: false },
        ],
      },
    ],
    trendAnalysis: {
      shortTerm: {
        direction: 'up',
        magnitude: 5,
        confidence: 0.82,
        keyFactors: ['Consistent therapy', 'Improved sleep'],
      },
      mediumTerm: {
        direction: 'up',
        magnitude: 12,
        confidence: 0.75,
        keyFactors: ['Medication adjustment', 'Social support'],
      },
      longTerm: {
        direction: 'up',
        magnitude: 28,
        confidence: 0.68,
        keyFactors: ['Therapy progress', 'Lifestyle changes'],
      },
      volatility: 0.32,
      consistency: 0.71,
    },
    milestoneAchievements: [
      {
        id: 'milestone-1',
        title: '30-Day Mood Tracking Streak',
        description: 'Consistently tracked mood for 30 consecutive days',
        achievedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        category: 'tracking',
        significance: 'moderate',
        celebration: 'Great job maintaining awareness of your emotional patterns!',
        nextMilestone: '60-day streak',
      },
    ],
    comparisonMetrics: [],
  };
};

// Main hook for AI Insights
export function useAIInsights() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedInsightCategory, setSelectedInsightCategory] = useState<InsightCategory | 'all'>('all');
  const [insightTimeRange, setInsightTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Fetch AI insights dashboard
  const {
    data: insightsDashboard,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['ai-insights', user?.id, insightTimeRange],
    queryFn: async (): Promise<AIInsightsDashboard> => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Generate mock AI insights
      const patterns = analyzePatterns(user);
      const predictions = generatePredictions(patterns);
      const recommendations = generateRecommendations(patterns, predictions);
      const therapeuticIntelligence = analyzeTherapeuticProgress();
      const progressMetrics = generateProgressMetrics();

      // Generate main insights
      const insights: AIInsight[] = [
        {
          id: 'insight-1',
          type: 'pattern_detected',
          category: 'mood',
          title: 'Weekly Mood Pattern Identified',
          description: 'Sunday evening anxiety affecting Monday mood',
          naturalLanguageInsight: 'I\'ve noticed your mood tends to dip on Sunday evenings, likely due to anticipation about the upcoming work week. This pattern has been consistent for the past 3 months.',
          severity: 'medium',
          confidence: 0.82,
          evidenceBase: [
            {
              type: 'pattern',
              source: 'mood_tracking',
              description: '12 out of 15 Sundays showed mood decline',
              strength: 'strong',
              relevance: 0.95,
            },
          ],
          actions: [
            {
              id: 'action-1',
              action: 'Implement Sunday evening routine',
              type: 'immediate',
              priority: 'high',
              estimatedImpact: 35,
              difficulty: 'moderate',
              requiredTime: 45,
              resources: ['Meditation app', 'Journal'],
              trackingMethod: 'Mood rating before and after routine',
              successCriteria: 'Mood improvement of 2+ points',
            },
          ],
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActionable: true,
          impactScore: 72,
          tags: ['mood', 'anxiety', 'weekly pattern'],
        },
        {
          id: 'insight-2',
          type: 'correlation',
          category: 'sleep',
          title: 'Sleep Quality Strongly Affects Next-Day Mood',
          description: 'Direct correlation between sleep duration and mood scores',
          naturalLanguageInsight: 'Your data shows a strong connection between sleep quality and next-day mood. When you get 7-8 hours of sleep, your mood is on average 40% better the following day.',
          severity: 'info',
          confidence: 0.89,
          evidenceBase: [
            {
              type: 'correlation',
              source: 'sleep_and_mood_data',
              description: 'Correlation coefficient of 0.73',
              strength: 'strong',
              relevance: 0.92,
            },
          ],
          actions: [
            {
              id: 'action-2',
              action: 'Prioritize consistent sleep schedule',
              type: 'long_term',
              priority: 'high',
              estimatedImpact: 45,
              difficulty: 'moderate',
              requiredTime: 0,
              resources: ['Sleep tracking app', 'Bedtime reminder'],
              trackingMethod: 'Sleep and mood tracking',
              successCriteria: '7-8 hours sleep 5+ nights per week',
            },
          ],
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          isActionable: true,
          impactScore: 85,
          tags: ['sleep', 'mood', 'correlation'],
        },
        {
          id: 'insight-3',
          type: 'milestone',
          category: 'wellness',
          title: 'Significant Progress in Anxiety Management',
          description: 'Your anxiety levels have decreased by 28% over the past month',
          naturalLanguageInsight: 'Congratulations! Your consistent effort with therapy and coping skills has led to a noticeable reduction in anxiety. Your anxiety scores have improved from 7.2 to 5.2 over the past month.',
          severity: 'info',
          confidence: 0.91,
          evidenceBase: [
            {
              type: 'data_point',
              source: 'anxiety_assessments',
              description: 'GAD-7 scores showing consistent improvement',
              strength: 'very_strong',
              relevance: 0.98,
            },
          ],
          actions: [
            {
              id: 'action-3',
              action: 'Continue current strategies',
              type: 'long_term',
              priority: 'medium',
              estimatedImpact: 20,
              difficulty: 'easy',
              requiredTime: 0,
              resources: [],
              trackingMethod: 'Continue regular assessments',
              successCriteria: 'Maintain or improve current levels',
            },
          ],
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          isActionable: false,
          impactScore: 88,
          tags: ['progress', 'anxiety', 'achievement'],
        },
        {
          id: 'insight-4',
          type: 'warning',
          category: 'activity',
          title: 'Decreased Physical Activity This Week',
          description: 'Activity levels 45% below your average',
          naturalLanguageInsight: 'Your physical activity has been lower than usual this week. This might be impacting your energy levels and mood. Even light activity can help maintain your wellness momentum.',
          severity: 'low',
          confidence: 0.95,
          evidenceBase: [
            {
              type: 'data_point',
              source: 'activity_tracker',
              description: 'Step count and exercise logs',
              strength: 'strong',
              relevance: 0.88,
            },
          ],
          actions: [
            {
              id: 'action-4',
              action: 'Schedule 15-minute daily walk',
              type: 'immediate',
              priority: 'medium',
              estimatedImpact: 25,
              difficulty: 'easy',
              requiredTime: 15,
              resources: ['Comfortable shoes', 'Weather app'],
              trackingMethod: 'Activity tracker',
              successCriteria: '15 minutes movement daily',
            },
          ],
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          isActionable: true,
          impactScore: 45,
          tags: ['activity', 'physical health', 'warning'],
        },
      ];

      // Generate environmental insights
      const environmentalInsights: EnvironmentalInsight[] = [
        {
          factor: {
            type: 'weather',
            currentState: 'cloudy',
            optimalState: 'sunny',
            measurement: 20,
            unit: 'percent sunshine',
          },
          impact: {
            direction: 'negative',
            magnitude: 0.25,
            affectedAreas: ['mood', 'energy'],
            timeDelay: 24,
            duration: 48,
          },
          correlations: [
            {
              variable1: 'sunlight_exposure',
              variable2: 'mood_score',
              coefficient: 0.42,
              pValue: 0.03,
              sampleSize: 90,
              confidence: 0.78,
              interpretation: 'Moderate positive correlation between sunlight and mood',
            },
          ],
          recommendations: [
            'Consider light therapy in the morning',
            'Take vitamin D supplement',
            'Spend time near windows during daylight',
          ],
        },
      ];

      return {
        id: `insights-${user?.id}`,
        userId: user?.id || '',
        lastUpdated: new Date(),
        insights,
        patterns,
        predictions,
        recommendations,
        therapeuticIntelligence,
        environmentalCorrelations: environmentalInsights,
        progressMetrics,
        aiConfidence: 0.82,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchInterval: 15 * 60 * 1000, // 15 minutes
  });

  // Filter insights by category
  const filteredInsights = useMemo(() => {
    if (!insightsDashboard?.insights) return [];
    if (selectedInsightCategory === 'all') return insightsDashboard.insights;
    return insightsDashboard.insights.filter(insight => insight.category === selectedInsightCategory);
  }, [insightsDashboard?.insights, selectedInsightCategory]);

  // Mark insight as actioned
  const markInsightActioned = useMutation({
    mutationFn: async (insightId: string) => {
      // In production, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-insights'] });
    },
  });

  // Dismiss insight
  const dismissInsight = useMutation({
    mutationFn: async (insightId: string) => {
      // In production, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-insights'] });
    },
  });

  // Request insight refresh
  const requestRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Get insight statistics
  const insightStats = useMemo(() => {
    if (!insightsDashboard) return null;

    const totalInsights = insightsDashboard.insights.length;
    const actionableInsights = insightsDashboard.insights.filter(i => i.isActionable).length;
    const highPriorityInsights = insightsDashboard.insights.filter(i => i.severity === 'high' || i.severity === 'critical').length;
    const averageConfidence = insightsDashboard.insights.reduce((acc, i) => acc + i.confidence, 0) / totalInsights;

    return {
      totalInsights,
      actionableInsights,
      highPriorityInsights,
      averageConfidence,
      patternCount: insightsDashboard.patterns.length,
      activeModels: insightsDashboard.predictions.length,
      recommendationCount: insightsDashboard.recommendations.length,
    };
  }, [insightsDashboard]);

  return {
    insightsDashboard,
    filteredInsights,
    isLoading,
    error,
    selectedInsightCategory,
    setSelectedInsightCategory,
    insightTimeRange,
    setInsightTimeRange,
    markInsightActioned: markInsightActioned.mutate,
    dismissInsight: dismissInsight.mutate,
    requestRefresh,
    insightStats,
    isMarkingActioned: markInsightActioned.isPending,
    isDismissing: dismissInsight.isPending,
  };
}

// Hook for specific pattern analysis
export function usePatternAnalysis(patternType?: PatternType) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pattern-analysis', user?.id, patternType],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 600));
      const patterns = analyzePatterns(user);
      return patternType 
        ? patterns.filter(p => p.patternType === patternType)
        : patterns;
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
  });
}

// Hook for predictive models
export function usePredictiveModels(modelType?: ModelType) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['predictive-models', user?.id, modelType],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 700));
      const patterns = analyzePatterns(user);
      const models = generatePredictions(patterns);
      return modelType
        ? models.filter(m => m.modelType === modelType)
        : models;
    },
    enabled: !!user?.id,
    staleTime: 15 * 60 * 1000,
  });
}

// Hook for personalized recommendations
export function usePersonalizedRecommendations(type?: RecommendationType) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recommendations', user?.id, type],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 600));
      const patterns = analyzePatterns(user);
      const predictions = generatePredictions(patterns);
      const recommendations = generateRecommendations(patterns, predictions);
      return type
        ? recommendations.filter(r => r.type === type)
        : recommendations;
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
  });
}

// Hook for therapeutic intelligence
export function useTherapeuticIntelligence() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['therapeutic-intelligence', user?.id],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return analyzeTherapeuticProgress();
    },
    enabled: !!user?.id,
    staleTime: 20 * 60 * 1000,
  });
}

// Hook for progress metrics
export function useProgressMetrics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['progress-metrics', user?.id],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
      return generateProgressMetrics();
    },
    enabled: !!user?.id,
    staleTime: 30 * 60 * 1000,
  });
}