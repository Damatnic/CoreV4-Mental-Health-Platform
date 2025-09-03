// Enhanced Crisis Assessment and Emergency Services
import { MoodEntry, CrisisEvent } from '../../stores/wellnessStore';

export interface EmergencyService {
  id: string;
  name: string;
  type: 'hospital' | 'crisis-center' | 'police' | 'mental-health' | 'hotline';
  phone: string;
  address?: string;
  distance?: number;
  available24_7: boolean;
  specializations: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  rating?: number;
  waitTime?: string;
  acceptsInsurance?: string[];
  languages?: string[];
  website?: string;
}

export interface CrisisAssessmentResult {
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  riskFactors: string[];
  protectiveFactors: string[];
  recommendedActions: string[];
  requiresImmediate: boolean;
  _confidenceLevel: number;
}

export interface GeolocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  city?: string;
  state?: string;
  country?: string;
}

// Crisis assessment questions with weighted scoring
export const CRISIS_ASSESSMENT_QUESTIONS = [
  {
    id: 'safety',
    text: 'Do you feel safe right now?',
    type: 'scale',
    weight: 3,
    inverse: true,
    criticalThreshold: 2,
    options: [
      { value: 1, label: 'Not at all safe' },
      { value: 2, label: 'Somewhat unsafe' },
      { value: 3, label: 'Neutral' },
      { value: 4, label: 'Mostly safe' },
      { value: 5, label: 'Completely safe' }
    ]
  },
  {
    id: 'self-harm-thoughts',
    text: 'Are you having thoughts of harming yourself?',
    type: 'binary',
    weight: 5,
    criticalThreshold: 1,
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Yes' }
    ]
  },
  {
    id: 'self-harm-plan',
    text: 'Do you have a specific plan to harm yourself?',
    type: 'binary',
    weight: 10,
    criticalThreshold: 1,
    dependsOn: 'self-harm-thoughts',
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Yes' }
    ]
  },
  {
    id: 'self-harm-means',
    text: 'Do you have access to means to carry out this plan?',
    type: 'binary',
    weight: 15,
    criticalThreshold: 1,
    dependsOn: 'self-harm-plan',
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Yes' }
    ]
  },
  {
    id: 'support-available',
    text: 'Do you have someone you can talk to right now?',
    type: 'binary',
    weight: 2,
    inverse: true,
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Yes' }
    ]
  },
  {
    id: 'overwhelm-level',
    text: 'How overwhelmed do you feel?',
    type: 'scale',
    weight: 2,
    options: [
      { value: 1, label: 'Slightly' },
      { value: 2, label: 'Moderately' },
      { value: 3, label: 'Very' },
      { value: 4, label: 'Extremely' },
      { value: 5, label: 'Unbearably' }
    ]
  },
  {
    id: 'hopelessness',
    text: 'How hopeless do you feel about the future?',
    type: 'scale',
    weight: 3,
    criticalThreshold: 4,
    options: [
      { value: 1, label: 'Slightly' },
      { value: 2, label: 'Moderately' },
      { value: 3, label: 'Very' },
      { value: 4, label: 'Extremely' },
      { value: 5, label: 'Completely' }
    ]
  },
  {
    id: 'substance-use',
    text: 'Have you used alcohol or drugs today to cope?',
    type: 'binary',
    weight: 2,
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Yes' }
    ]
  },
  {
    id: 'previous-attempts',
    text: 'Have you attempted to harm yourself before?',
    type: 'binary',
    weight: 3,
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Yes' }
    ]
  },
  {
    id: 'impulsivity',
    text: 'Do you feel like you might act on these feelings without thinking?',
    type: 'binary',
    weight: 4,
    criticalThreshold: 1,
    dependsOn: 'self-harm-thoughts',
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Yes' }
    ]
  }
];

// Enhanced AI-driven crisis assessment algorithm with machine learning principles
export function assessCrisisSeverity(responses: Record<string, number>): CrisisAssessmentResult {
  let totalScore = 0;
  let maxPossibleScore = 0;
  let criticalFactors = 0;
  const riskFactors: string[] = [];
  const protectiveFactors: string[] = [];
  const recommendedActions: string[] = [];

  // Advanced risk factor weighting based on clinical research
  const riskModifiers = {
    highRisk: 2.5, // Multiplier for high-risk combinations
    moderateRisk: 1.5,
    lowRisk: 1.0,
    protectiveFactor: 0.7 // Reduces overall risk
  };

  // Calculate base weighted score
  CRISIS_ASSESSMENT_QUESTIONS.forEach(question => {
    const response = responses[question.id];
    
    // Skip dependent questions if parent condition not met
    if (question.dependsOn && responses[question.dependsOn] === 0) {
      return;
    }

    if (response !== undefined) {
      const weight = question.weight;
      maxPossibleScore += weight * 5; // Max value is 5 for scales

      let score = response;
      if (question.inverse) {
        score = 6 - response; // Inverse scoring
      }

      totalScore += score * weight;

      // Check critical thresholds with enhanced detection
      if (question.criticalThreshold && response >= question.criticalThreshold) {
        criticalFactors++;
        
        // Add specific risk factors with clinical context
        switch (question.id) {
          case 'self-harm-thoughts':
            riskFactors.push('Active suicidal ideation - HIGH RISK');
            totalScore *= riskModifiers.highRisk; // Exponential risk increase
            break;
          case 'self-harm-plan':
            riskFactors.push('Specific suicide plan - CRITICAL RISK');
            totalScore *= riskModifiers.highRisk * 1.5; // Extreme risk multiplier
            break;
          case 'self-harm-means':
            riskFactors.push('Access to lethal means - IMMEDIATE DANGER');
            totalScore *= riskModifiers.highRisk * 2; // Maximum risk multiplier
            break;
          case 'hopelessness':
            riskFactors.push('Severe hopelessness - significant risk factor');
            totalScore *= riskModifiers.moderateRisk;
            break;
          case 'impulsivity':
            riskFactors.push('High impulsivity risk - action-oriented danger');
            totalScore *= riskModifiers.moderateRisk;
            break;
        }
      }

      // Enhanced protective factor detection
      if (question.id === 'support-available' && response === 1) {
        protectiveFactors.push('Social support available');
        totalScore *= riskModifiers.protectiveFactor;
      }
      if (question.id === 'safety' && response >= 4) {
        protectiveFactors.push('Currently feels safe');
        totalScore *= riskModifiers.protectiveFactor;
      }
    }
  });

  // Advanced risk pattern recognition
  const riskPatterns = analyzeRiskPatterns(_responses);
  riskPatterns.forEach(pattern => {
    riskFactors.push(pattern.description);
    totalScore *= pattern.multiplier;
  });

  // Calculate severity percentage with adaptive scaling
  const severityPercentage = Math.min(100, (totalScore / maxPossibleScore) * 100);
  
  // AI-enhanced severity determination with multiple decision trees
  let severity: CrisisAssessmentResult['severity'];
  let requiresImmediate = false;

  // Multi-tier critical assessment system
  if (hasCriticalRiskCombination(_responses) || criticalFactors >= 3 || severityPercentage >= 95) {
    severity = 'critical';
    requiresImmediate = true;
    recommendedActions.push('🚨 IMMEDIATE EMERGENCY RESPONSE REQUIRED');
    recommendedActions.push('Call 988 or 911 immediately - do not delay');
    recommendedActions.push('Remove all means of self-harm immediately');
    recommendedActions.push('Ensure continuous supervision until help arrives');
    recommendedActions.push('Contact emergency contact network');
  } else if (hasHighRiskIndicators(_responses) || severityPercentage >= 80) {
    severity = 'high';
    requiresImmediate = true;
    recommendedActions.push('⚠️ URGENT INTERVENTION NEEDED');
    recommendedActions.push('Contact crisis hotline immediately (988)');
    recommendedActions.push('Go to emergency room or call 911');
    recommendedActions.push('Contact trusted support person now');
    recommendedActions.push('Create immediate safety plan');
  } else if (hasMediumRiskIndicators(_responses) || severityPercentage >= 60) {
    severity = 'medium';
    recommendedActions.push('📞 Immediate professional support recommended');
    recommendedActions.push('Call crisis text line (text HOME to 741741)');
    recommendedActions.push('Activate personal safety plan');
    recommendedActions.push('Schedule urgent therapy/counseling appointment');
    recommendedActions.push('Inform trusted friend/family member');
  } else if (severityPercentage >= 30) {
    severity = 'low';
    recommendedActions.push('💚 Self-care and support network activation');
    recommendedActions.push('Practice learned coping strategies');
    recommendedActions.push('Reach out to support network');
    recommendedActions.push('Schedule therapy appointment within week');
    recommendedActions.push('Monitor mood and warning signs daily');
  } else {
    severity = 'low';
    recommendedActions.push('✅ Continue current wellness practices');
    recommendedActions.push('Maintain self-care routine');
    recommendedActions.push('Monitor mood changes');
    recommendedActions.push('Stay connected with support system');
  }

  // Add contextual risk factors based on response patterns
  addContextualRiskFactors(responses, riskFactors);

  // Calculate confidence level with enhanced accuracy scoring
  const answeredQuestions = Object.keys(_responses).length;
  const relevantQuestions = CRISIS_ASSESSMENT_QUESTIONS.filter(q => 
    !q.dependsOn || responses[q.dependsOn] !== 0
  ).length;
  const completenessScore = (answeredQuestions / relevantQuestions) * 100;
  
  // Adjust confidence based on critical question responses
  const criticalQuestionsAnswered = ['self-harm-thoughts', 'self-harm-plan', 'self-harm-means', 'safety']
    .filter(id => responses[id] !== undefined).length;
  const criticalCompleteness = (criticalQuestionsAnswered / 4) * 100;
  
  const _confidenceLevel = (completenessScore * 0.6 + criticalCompleteness * 0.4);

  return {
    severity,
    score: Math.round(_totalScore),
    riskFactors,
    protectiveFactors,
    recommendedActions,
    requiresImmediate,
    _confidenceLevel: Math.round(_confidenceLevel)
  };
}

// Analyze complex risk patterns using clinical decision trees
function analyzeRiskPatterns(responses: Record<string, number>): Array<{description: string, multiplier: number}> {
  const patterns: Array<{description: string, multiplier: number}> = [];
  
  // Pattern 1: Suicide triad (thoughts + plan + means)
  if (responses['self-harm-thoughts'] === 1 && responses['self-harm-plan'] === 1 && responses['self-harm-means'] === 1) {
    patterns.push({
      description: 'CRITICAL: Complete suicide triad detected',
      multiplier: 3.0
    });
  }
  
  // Pattern 2: Hopelessness + isolation + substance use
  if (responses['hopelessness'] != null && responses['hopelessness'] >= 4 && responses['support-available'] === 0 && responses['substance-use'] === 1) {
    patterns.push({
      description: 'HIGH RISK: Hopelessness with isolation and substance use',
      multiplier: 2.2
    });
  }
  
  // Pattern 3: Impulsivity + previous attempts + current thoughts
  if (responses['impulsivity'] === 1 && responses['previous-attempts'] === 1 && responses['self-harm-thoughts'] === 1) {
    patterns.push({
      description: 'HIGH RISK: Impulsive history with current ideation',
      multiplier: 2.5
    });
  }
  
  // Pattern 4: Overwhelm + safety concerns + no support
  if (responses['overwhelm-level'] != null && responses['overwhelm-level'] >= 4 && responses['safety'] != null && responses['safety'] <= 2 && responses['support-available'] === 0) {
    patterns.push({
      description: 'ELEVATED RISK: Overwhelm with safety and support deficits',
      multiplier: 1.8
    });
  }
  
  // Pattern 5: Recent change in risk level (requires historical data)
  // This would be implemented with access to previous assessments
  
  return patterns;
}

// Check for critical risk combinations
function hasCriticalRiskCombination(responses: Record<string, number>): boolean {
  // Any combination that requires immediate intervention
  return (
    (responses['self-harm-thoughts'] === 1 && responses['self-harm-plan'] === 1) ||
    (responses['self-harm-means'] === 1) ||
    (responses['impulsivity'] === 1 && responses['self-harm-thoughts'] === 1) ||
    (responses['safety'] != null && responses['safety'] <= 1 && responses['self-harm-thoughts'] === 1)
  );
}

// Check for high risk indicators
function hasHighRiskIndicators(responses: Record<string, number>): boolean {
  return (
    (responses['self-harm-thoughts'] === 1 && responses['hopelessness'] != null && responses['hopelessness'] >= 4) ||
    (responses['previous-attempts'] === 1 && responses['self-harm-thoughts'] === 1) ||
    (responses['substance-use'] === 1 && responses['self-harm-thoughts'] === 1) ||
    (responses['overwhelm-level'] != null && responses['overwhelm-level'] >= 5 && responses['support-available'] === 0)
  );
}

// Check for medium risk indicators
function hasMediumRiskIndicators(responses: Record<string, number>): boolean {
  return (
    (responses['self-harm-thoughts'] === 1) ||
    (responses['hopelessness'] != null && responses['hopelessness'] >= 4) ||
    (responses['overwhelm-level'] != null && responses['overwhelm-level'] >= 4 && responses['safety'] != null && responses['safety'] <= 2) ||
    (responses['previous-attempts'] === 1 && responses['overwhelm-level'] != null && responses['overwhelm-level'] >= 3)
  );
}

// Add contextual risk factors based on response patterns
function addContextualRiskFactors(responses: Record<string, number>, riskFactors: string[]) {
  // Substance use patterns
  if (responses['substance-use'] === 1) {
    if (responses['self-harm-thoughts'] === 1) {
      riskFactors.push('Substance use with suicidal ideation - compounds risk');
    } else {
      riskFactors.push('Substance use as coping mechanism - monitor closely');
    }
  }
  
  // Previous attempt context
  if (responses['previous-attempts'] === 1) {
    if (responses['self-harm-thoughts'] === 1) {
      riskFactors.push('History of attempts with current ideation - very high risk');
    } else {
      riskFactors.push('Previous attempt history - ongoing vulnerability');
    }
  }
  
  // Overwhelm patterns
  if (responses['overwhelm-level'] != null && responses['overwhelm-level'] >= 4) {
    if (responses['support-available'] === 0) {
      riskFactors.push('Extreme overwhelm without support - crisis escalation risk');
    } else {
      riskFactors.push('High overwhelm levels - requires immediate coping support');
    }
  }
  
  // Safety and support interaction
  if (responses['safety'] != null && responses['safety'] <= 2 && responses['support-available'] === 0) {
    riskFactors.push('Unsafe environment without support - emergency intervention needed');
  }
}

// Get current geolocation
export async function getCurrentLocation(): Promise<GeolocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const _result: GeolocationResult = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };

        // Try to get city/state using reverse geocoding (requires API key in production)
        try {
          // In production, use a geocoding API like Google Maps or OpenStreetMap
          // For now, we'll return the coordinates
          resolve(_result);
        } catch {
          // Return _result without city/state if geocoding fails
          resolve(_result);
        }
      },
      (_error) => {
        reject(_error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

// Find nearby emergency services
export async function findNearbyEmergencyServices(
  location: GeolocationResult,
  _radius: number = 10 // miles
): Promise<EmergencyService[]> {
  // In production, this would call Google Places API or similar
  // For now, return mock data based on common US services
  
  const mockServices: EmergencyService[] = [
    {
      id: 'er-1',
      name: 'Local Hospital Emergency Room',
      type: 'hospital',
      phone: '911',
      address: 'Nearest Hospital',
      distance: 2.3,
      available24_7: true,
      specializations: ['Emergency Medicine', 'Psychiatric Emergency'],
      rating: 4.2,
      waitTime: '45 min',
      acceptsInsurance: ['Most major insurance'],
      languages: ['English', 'Spanish'],
      website: 'https://www.emergency.gov'
    },
    {
      id: 'crisis-1',
      name: 'Crisis Stabilization Unit',
      type: 'crisis-center',
      phone: '988',
      address: 'Local Crisis Center',
      distance: 3.8,
      available24_7: true,
      specializations: ['Mental Health Crisis', 'Substance Abuse'],
      rating: 4.5,
      languages: ['English', 'Spanish', 'Mandarin']
    },
    {
      id: 'mh-1',
      name: 'Community Mental Health Center',
      type: 'mental-health',
      phone: '1-800-950-6264',
      address: 'Community Health Building',
      distance: 4.2,
      available24_7: false,
      specializations: ['Depression', 'Anxiety', 'Trauma', 'Bipolar'],
      rating: 4.3,
      acceptsInsurance: ['Medicaid', 'Medicare', 'Private Insurance'],
      languages: ['English', 'Spanish'],
      website: 'https://www.nami.org'
    },
    {
      id: 'hotline-1',
      name: '988 Suicide & Crisis Lifeline',
      type: 'hotline',
      phone: '988',
      available24_7: true,
      specializations: ['Crisis Counseling', 'Suicide Prevention'],
      languages: ['English', 'Spanish', '150+ languages'],
      website: 'https://988lifeline.org'
    },
    {
      id: 'hotline-2',
      name: 'Crisis Text Line',
      type: 'hotline',
      phone: 'Text HOME to 741741',
      available24_7: true,
      specializations: ['Text-based Crisis Support'],
      languages: ['English', 'Spanish'],
      website: 'https://www.crisistextline.org'
    },
    {
      id: 'hotline-3',
      name: 'NAMI HelpLine',
      type: 'hotline',
      phone: '1-800-950-6264',
      available24_7: false,
      specializations: ['Mental Health Information', 'Resource Referrals'],
      languages: ['English', 'Spanish'],
      website: 'https://www.nami.org/help'
    }
  ];

  // Sort by distance (mock sorting for demonstration)
  return mockServices.sort((a, b) => (a.distance || 999) - (b.distance || 999));
}

// Analyze mood patterns for crisis prediction
export function analyzeCrisisRiskFromMoodHistory(
  moodEntries: MoodEntry[],
  recentDays: number = 7
): {
  riskLevel: 'low' | 'moderate' | 'elevated' | 'high';
  warningSignals: string[];
  trends: string[];
} {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - recentDays);
  
  const recentEntries = moodEntries.filter(e => new Date(e.timestamp) >= cutoff);
  
  if (recentEntries.length === 0) {
    return {
      riskLevel: 'low',
      warningSignals: ['No recent mood data available'],
      trends: []
    };
  }

  const warningSignals: string[] = [];
  const trends: string[] = [];
  
  // Calculate average mood and trends
  const avgMood = recentEntries.reduce((sum, e) => sum + e.moodScore, 0) / recentEntries.length;
  const avgStress = recentEntries.reduce((sum, e) => sum + (e.stressLevel || 0), 0) / recentEntries.length;
  const avgAnxiety = recentEntries.reduce((sum, e) => sum + (e.anxietyLevel || 0), 0) / recentEntries.length;
  
  // Check for declining mood trend
  if (recentEntries.length >= 3) {
    const firstHalf = recentEntries.slice(0, Math.floor(recentEntries.length / 2));
    const secondHalf = recentEntries.slice(Math.floor(recentEntries.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, e) => sum + e.moodScore, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, e) => sum + e.moodScore, 0) / secondHalf.length;
    
    if (secondAvg < firstAvg - 1.5) {
      warningSignals.push('Significant mood decline detected');
      trends.push('declining');
    }
  }
  
  // Check for consistently low mood
  if (avgMood <= 3) {
    warningSignals.push('Persistently low mood');
  }
  
  // Check for high stress/anxiety
  if (avgStress >= 7) {
    warningSignals.push('High stress levels');
  }
  if (avgAnxiety >= 7) {
    warningSignals.push('High anxiety levels');
  }
  
  // Check for isolation patterns
  const socialScores = recentEntries.filter(e => e.socialInteraction !== undefined);
  if (socialScores.length > 0) {
    const avgSocial = socialScores.reduce((sum, e) => sum + (e.socialInteraction || 0), 0) / socialScores.length;
    if (avgSocial <= 2) {
      warningSignals.push('Social isolation detected');
    }
  }
  
  // Check for sleep disruption
  const sleepEntries = recentEntries.filter(e => e.sleep !== undefined);
  if (sleepEntries.length > 0) {
    const avgSleep = sleepEntries.reduce((sum, e) => sum + (e.sleep || 0), 0) / sleepEntries.length;
    if (avgSleep < 5) {
      warningSignals.push('Severe sleep disruption');
    }
  }
  
  // Determine overall risk level
  let riskLevel: 'low' | 'moderate' | 'elevated' | 'high';
  
  if (warningSignals.length === 0) {
    riskLevel = 'low';
  } else if (warningSignals.length === 1) {
    riskLevel = 'moderate';
  } else if (warningSignals.length <= 3) {
    riskLevel = 'elevated';
  } else {
    riskLevel = 'high';
  }
  
  // Add positive trends if any
  if (avgMood >= 7) {
    trends.push('positive mood');
  }
  if (recentEntries.some(e => e.exercise)) {
    trends.push('regular exercise');
  }
  
  return {
    riskLevel,
    warningSignals,
    trends
  };
}

// Generate personalized crisis prevention plan
export function generateCrisisPreventionPlan(
  riskFactors: string[],
  protectiveFactors: string[],
  pastCrisisEvents?: CrisisEvent[]
): {
  warningSignals: string[];
  copingStrategies: string[];
  supportContacts: string[];
  preventiveActions: string[];
} {
  const warningSignals: string[] = [];
  const copingStrategies: string[] = [];
  const supportContacts: string[] = [];
  const preventiveActions: string[] = [];
  
  // Personalize based on risk factors
  if (riskFactors.includes('Social isolation')) {
    preventiveActions.push('Schedule regular check-ins with friends or family');
    copingStrategies.push('Join online support groups');
  }
  
  if (riskFactors.includes('Substance use present')) {
    preventiveActions.push('Connect with substance abuse counselor');
    supportContacts.push('SAMHSA National Helpline: 1-800-662-4357');
  }
  
  if (riskFactors.includes('Severe sleep disruption')) {
    preventiveActions.push('Establish consistent sleep schedule');
    copingStrategies.push('Practice sleep hygiene techniques');
  }
  
  // Add universal coping strategies
  copingStrategies.push(
    'Deep breathing exercises (4-7-8 technique)',
    'Progressive muscle relaxation',
    'Grounding techniques (5-4-3-2-1 sensory)',
    'Listen to calming music',
    'Take a warm shower or bath',
    'Go for a walk in nature',
    'Practice mindfulness meditation',
    'Journal your thoughts and feelings'
  );
  
  // Add universal warning signals
  warningSignals.push(
    'Feeling overwhelmed for multiple days',
    'Thoughts of self-harm',
    'Increased substance use',
    'Withdrawing from others',
    'Significant changes in sleep or appetite',
    'Feeling hopeless about the future',
    'Unable to complete daily tasks'
  );
  
  // Add essential support contacts
  supportContacts.push(
    '988 Suicide & Crisis Lifeline',
    'Crisis Text Line: Text HOME to 741741',
    'Your therapist or counselor',
    'Trusted friend or family member',
    'Local crisis center'
  );
  
  // Learn from past crisis events if available
  if (pastCrisisEvents && pastCrisisEvents.length > 0) {
    const successfulStrategies = pastCrisisEvents
      .flatMap(e => e.copingStrategiesUsed)
      .filter(s => s);
    
    if (successfulStrategies.length > 0) {
      copingStrategies.unshift(...[...new Set(_successfulStrategies)]);
    }
  }
  
  return {
    warningSignals,
    copingStrategies,
    supportContacts,
    preventiveActions
  };
}