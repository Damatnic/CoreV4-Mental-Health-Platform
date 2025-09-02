// AI-Powered Insights System Types
// Advanced mental health pattern recognition and predictive analytics

export interface CrisisProfile {
  userId: string;
  riskLevel: 'stable' | 'elevated' | 'high' | 'critical';
  indicators: string[];
  patterns: any[];
  recommendations: any[];
  lastUpdated: Date;
}

export interface AIInsightsDashboard {
  id: string;
  userId: string;
  lastUpdated: Date;
  insights: AIInsight[];
  patterns: PatternAnalysis[];
  predictions: PredictiveModel[];
  recommendations: PersonalizedRecommendation[];
  therapeuticIntelligence: TherapeuticIntelligence;
  environmentalCorrelations: EnvironmentalInsight[];
  progressMetrics: ProgressMetrics;
  aiConfidence: number; // 0-1 confidence in insights
  crisisRiskPrediction?: CrisisProfile; // Optional crisis risk prediction data
  moodAnalysis?: any; // Optional mood analysis data  
  personalizedInterventions?: any; // Optional personalized interventions
  therapeuticContent?: any; // Optional therapeutic content
}

// Core AI Insight Types
export interface AIInsight {
  id: string;
  type: InsightType;
  category: InsightCategory;
  title: string;
  description: string;
  naturalLanguageInsight: string; // Human-readable insight
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  evidenceBase: Evidence[];
  actions: RecommendedAction[];
  validFrom: Date;
  validUntil: Date;
  isActionable: boolean;
  impactScore: number; // 0-100
  tags: string[];
}

export type InsightType = 
  | 'pattern_detected'
  | 'trend_analysis'
  | 'prediction'
  | 'anomaly'
  | 'milestone'
  | 'warning'
  | 'opportunity'
  | 'correlation'
  | 'recommendation'
  | 'therapeutic_insight';

export type InsightCategory =
  | 'mood'
  | 'behavior'
  | 'sleep'
  | 'social'
  | 'activity'
  | 'medication'
  | 'therapy'
  | 'crisis'
  | 'wellness'
  | 'environmental';

// Pattern Recognition Types
export interface PatternAnalysis {
  id: string;
  patternType: PatternType;
  description: string;
  frequency: PatternFrequency;
  strength: number; // 0-1
  dataPoints: DataPoint[];
  triggers: TriggerPattern[];
  outcomes: OutcomePattern[];
  firstDetected: Date;
  lastOccurrence: Date;
  predictiveValue: number; // 0-1
  clinicalRelevance: ClinicalRelevance;
}

export type PatternType =
  | 'mood_cycle'
  | 'sleep_pattern'
  | 'activity_rhythm'
  | 'social_pattern'
  | 'trigger_response'
  | 'medication_response'
  | 'seasonal_pattern'
  | 'crisis_precursor'
  | 'recovery_pattern'
  | 'behavioral_loop'
  | 'circadian_rhythm'
  | 'environmental_correlation';

export interface PatternFrequency {
  type: 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'irregular';
  occurrences: number;
  averageInterval: number; // in hours
  variance: number; // standard deviation
}

export interface TriggerPattern {
  id: string;
  triggerType: string;
  triggerEvents: string[];
  responseTime: number; // hours until effect
  responseIntensity: number; // 0-1
  frequency: number;
  avoidanceStrategies: string[];
}

export interface OutcomePattern {
  outcome: string;
  probability: number; // 0-1
  averageImpact: number; // -100 to 100
  duration: number; // hours
  mitigationFactors: string[];
}

// Predictive Modeling Types
export interface PredictiveModel {
  id: string;
  modelType: ModelType;
  targetVariable: string;
  predictions: Prediction[];
  accuracy: ModelAccuracy;
  features: FeatureImportance[];
  lastTrained: Date;
  nextUpdate: Date;
}

export type ModelType =
  | 'crisis_risk'
  | 'mood_forecast'
  | 'treatment_response'
  | 'recovery_trajectory'
  | 'relapse_risk'
  | 'wellness_optimization'
  | 'medication_effectiveness'
  | 'therapy_readiness';

export interface Prediction {
  timeframe: PredictionTimeframe;
  outcome: string;
  probability: number; // 0-1
  confidence: number; // 0-1
  factors: ContributingFactor[];
  preventiveActions: string[];
  alternativeScenarios: AlternativeScenario[];
}

export interface PredictionTimeframe {
  start: Date;
  end: Date;
  resolution: 'hour' | 'day' | 'week' | 'month';
}

export interface ContributingFactor {
  factor: string;
  impact: number; // -1 to 1
  modifiable: boolean;
  currentState: string;
  optimalState: string;
  improvementSuggestions: string[];
}

export interface AlternativeScenario {
  condition: string;
  probability: number;
  outcome: string;
  recommendations: string[];
}

export interface ModelAccuracy {
  overall: number; // 0-1
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix?: number[][];
  validationMethod: string;
}

export interface FeatureImportance {
  feature: string;
  importance: number; // 0-1
  category: string;
  description: string;
}

// Personalized Recommendation Types
export interface PersonalizedRecommendation {
  id: string;
  type: RecommendationType;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  rationale: string;
  evidenceStrength: 'weak' | 'moderate' | 'strong' | 'very_strong';
  expectedImpact: ImpactEstimate;
  implementation: ImplementationGuide;
  personalizedFor: PersonalizationFactors;
  alternativeOptions: AlternativeRecommendation[];
  contraindicators: string[];
  trackingMetrics: string[];
}

export type RecommendationType =
  | 'activity'
  | 'behavioral'
  | 'therapeutic'
  | 'medical'
  | 'lifestyle'
  | 'social'
  | 'environmental'
  | 'crisis_prevention'
  | 'skill_development'
  | 'professional_care';

export interface ImpactEstimate {
  metric: string;
  currentValue: number;
  expectedValue: number;
  timeToImpact: number; // days
  confidence: number; // 0-1
}

export interface ImplementationGuide {
  steps: ImplementationStep[];
  estimatedTime: number; // minutes
  difficulty: 'easy' | 'moderate' | 'challenging';
  requiredResources: string[];
  optimalTiming: OptimalTiming;
  successCriteria: string[];
}

export interface ImplementationStep {
  order: number;
  description: string;
  duration: number; // minutes
  tips: string[];
  commonChallenges: string[];
}

export interface OptimalTiming {
  timeOfDay: string[];
  daysOfWeek: string[];
  conditions: string[];
  avoidWhen: string[];
}

export interface PersonalizationFactors {
  preferences: UserPreference[];
  history: HistoricalResponse[];
  constraints: PersonalConstraint[];
  goals: string[];
  culturalConsiderations: string[];
}

export interface UserPreference {
  category: string;
  preference: string;
  weight: number; // 0-1
}

export interface HistoricalResponse {
  intervention: string;
  effectiveness: number; // 0-1
  adherence: number; // 0-1
  sideEffects: string[];
}

export interface PersonalConstraint {
  type: string;
  description: string;
  impact: string[];
}

export interface AlternativeRecommendation {
  title: string;
  description: string;
  tradeoffs: string[];
  suitabilityScore: number; // 0-1
}

// Therapeutic Intelligence Types
export interface TherapeuticIntelligence {
  cbtAnalysis: CBTAnalysis;
  dbtSkillsTracking: DBTSkillsAnalysis;
  mindfulnessOptimization: MindfulnessAnalysis;
  behavioralActivation: BehavioralActivationAnalysis;
  therapyProgress: TherapyProgressAnalysis;
  therapeuticGoals: TherapeuticGoal[];
}

export interface CBTAnalysis {
  thoughtPatterns: ThoughtPattern[];
  cognitiveDistortions: CognitiveDistortion[];
  automaticThoughts: AutomaticThought[];
  coreBeliefs: CoreBelief[];
  interventionEffectiveness: InterventionEffectiveness[];
  homeworkCompletion: number; // 0-1
  progressIndicators: string[];
}

export interface InterventionEffectiveness {
  intervention: string;
  effectiveness: number; // 0-100
  completionRate: number; // 0-1
  userFeedback: number; // 1-5
  timeToEffect: number; // hours
  sideEffects: string[];
  recommendedFrequency: string;
}

export interface ThoughtPattern {
  pattern: string;
  frequency: number;
  triggers: string[];
  emotionalImpact: number; // -100 to 100
  alternativeThoughts: string[];
  evidenceFor: string[];
  evidenceAgainst: string[];
}

export interface CognitiveDistortion {
  type: string;
  examples: string[];
  frequency: number;
  severity: number; // 0-1
  challengingStrategies: string[];
  progress: number; // 0-1
}

export interface AutomaticThought {
  thought: string;
  situation: string;
  emotion: string;
  intensity: number; // 0-10
  balancedThought: string;
  outcome: string;
}

export interface CoreBelief {
  belief: string;
  strength: number; // 0-1
  origin: string;
  supportingEvidence: string[];
  contradictingEvidence: string[];
  alternativeBelief: string;
  workInProgress: boolean;
}

export interface DBTSkillsAnalysis {
  moduleProgress: DBTModuleProgress[];
  skillUsage: SkillUsagePattern[];
  effectivenessRatings: EffectivenessRating[];
  crisisSkillReadiness: number; // 0-1
  recommendedSkills: DBTSkill[];
}

export interface DBTModuleProgress {
  module: 'mindfulness' | 'distress_tolerance' | 'emotion_regulation' | 'interpersonal_effectiveness';
  completion: number; // 0-1
  mastery: number; // 0-1
  practiceFrequency: number;
  topSkills: string[];
}

export interface SkillUsagePattern {
  skill: string;
  frequency: number;
  situations: string[];
  effectiveness: number; // 0-1
  barriers: string[];
  facilitators: string[];
}

export interface EffectivenessRating {
  skill: string;
  situation: string;
  rating: number; // 0-10
  date: Date;
  notes: string;
}

export interface DBTSkill {
  name: string;
  module: string;
  description: string;
  whenToUse: string[];
  steps: string[];
  practiceExercises: string[];
}

export interface MindfulnessAnalysis {
  practiceConsistency: number; // 0-1
  averageDuration: number; // minutes
  preferredTechniques: string[];
  optimalTimes: string[];
  benefitAreas: BenefitArea[];
  challenges: string[];
  recommendations: MindfulnessRecommendation[];
}

export interface BenefitArea {
  area: string;
  improvement: number; // 0-1
  techniques: string[];
}

export interface MindfulnessRecommendation {
  technique: string;
  duration: number;
  timing: string;
  rationale: string;
  guidedResource: string;
}

export interface BehavioralActivationAnalysis {
  activityLevels: ActivityLevel[];
  moodActivityCorrelation: number; // -1 to 1
  pleasurableActivities: PleasurableActivity[];
  masteryActivities: MasteryActivity[];
  schedulingAdherence: number; // 0-1
  barriers: string[];
  facilitators: string[];
  recommendations: string[];
}

export interface ActivityLevel {
  date: Date;
  level: number; // 0-10
  activities: string[];
  mood: number; // 0-10
  energy: number; // 0-10
}

export interface PleasurableActivity {
  activity: string;
  pleasureRating: number; // 0-10
  frequency: number;
  barriers: string[];
  scheduledNext: Date;
}

export interface MasteryActivity {
  activity: string;
  masteryRating: number; // 0-10
  difficultyLevel: number; // 0-10
  completionRate: number; // 0-1
  skillsGained: string[];
}

export interface TherapyProgressAnalysis {
  overallProgress: number; // 0-1
  goalsAchieved: number;
  totalGoals: number;
  sessionInsights: SessionInsight[];
  therapeuticAlliance: number; // 0-1
  readinessForChange: number; // 0-1
  treatmentAdherence: number; // 0-1
  areasOfGrowth: string[];
  areasNeedingFocus: string[];
}

export interface SessionInsight {
  sessionDate: Date;
  keyThemes: string[];
  breakthroughs: string[];
  homework: string[];
  homeworkCompletion: number; // 0-1
  sessionRating: number; // 0-10
  nextSessionFocus: string[];
}

export interface TherapeuticGoal {
  id: string;
  goal: string;
  category: string;
  targetDate: Date;
  progress: number; // 0-1
  milestones: Milestone[];
  barriers: string[];
  strategies: string[];
  measurableOutcomes: string[];
}

export interface Milestone {
  description: string;
  completed: boolean;
  completionDate?: Date;
  evidence: string[];
}

// Environmental & Lifestyle Insights
export interface EnvironmentalInsight {
  factor: EnvironmentalFactor;
  impact: Impact;
  correlations: Correlation[];
  recommendations: string[];
  seasonalPattern?: SeasonalPattern;
}

export interface EnvironmentalFactor {
  type: 'weather' | 'season' | 'daylight' | 'temperature' | 'air_quality' | 'noise' | 'social_environment';
  currentState: string;
  optimalState: string;
  measurement: number;
  unit: string;
}

export interface Impact {
  direction: 'positive' | 'negative' | 'neutral';
  magnitude: number; // 0-1
  affectedAreas: string[];
  timeDelay: number; // hours
  duration: number; // hours
}

export interface Correlation {
  variable1: string;
  variable2: string;
  coefficient: number; // -1 to 1
  pValue: number;
  sampleSize: number;
  confidence: number; // 0-1
  interpretation: string;
}

export interface SeasonalPattern {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  typicalMood: number; // 0-10
  typicalEnergy: number; // 0-10
  challenges: string[];
  copingStrategies: string[];
  preventiveMeasures: string[];
}

// Progress Metrics
export interface ProgressMetrics {
  overallWellness: WellnessMetric;
  domainMetrics: DomainMetric[];
  trendAnalysis: TrendAnalysis;
  milestoneAchievements: MilestoneAchievement[];
  comparisonMetrics: ComparisonMetric[];
}

export interface WellnessMetric {
  score: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
  changeRate: number; // percentage per week
  components: WellnessComponent[];
  projectedScore: number; // 30-day projection
}

export interface WellnessComponent {
  name: string;
  weight: number; // 0-1
  score: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
}

export interface DomainMetric {
  domain: string;
  currentScore: number; // 0-100
  baselineScore: number; // 0-100
  targetScore: number; // 0-100
  progress: number; // 0-1
  subMetrics: SubMetric[];
}

export interface SubMetric {
  name: string;
  value: number;
  unit: string;
  target: number;
  achieved: boolean;
}

export interface TrendAnalysis {
  shortTerm: TrendData; // 7 days
  mediumTerm: TrendData; // 30 days
  longTerm: TrendData; // 90 days
  volatility: number; // 0-1
  consistency: number; // 0-1
}

export interface TrendData {
  direction: 'up' | 'down' | 'stable';
  magnitude: number;
  confidence: number; // 0-1
  keyFactors: string[];
}

export interface MilestoneAchievement {
  id: string;
  title: string;
  description: string;
  achievedDate: Date;
  category: string;
  significance: 'minor' | 'moderate' | 'major';
  celebration: string;
  nextMilestone: string;
}

export interface ComparisonMetric {
  metric: string;
  userValue: number;
  averageValue: number;
  percentile: number;
  interpretation: string;
  isPositive: boolean;
}

// Evidence and Supporting Data
export interface Evidence {
  type: 'data_point' | 'pattern' | 'correlation' | 'research' | 'clinical';
  source: string;
  description: string;
  strength: 'weak' | 'moderate' | 'strong' | 'very_strong';
  relevance: number; // 0-1
  dataPoints?: DataPoint[];
  reference?: string;
}

export interface DataPoint {
  timestamp: Date;
  value: number;
  metric: string;
  unit: string;
  context?: string;
  quality: 'low' | 'medium' | 'high';
}

export interface ClinicalRelevance {
  isClinicallySignificant: boolean;
  severityLevel: 'none' | 'mild' | 'moderate' | 'severe';
  requiresProfessionalReview: boolean;
  clinicalGuidelines: string[];
  recommendedActions: string[];
}

// Recommended Actions
export interface RecommendedAction {
  id: string;
  action: string;
  type: 'immediate' | 'short_term' | 'long_term';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedImpact: number; // 0-100
  difficulty: 'easy' | 'moderate' | 'challenging';
  requiredTime: number; // minutes
  resources: string[];
  trackingMethod: string;
  successCriteria: string;
}

// AI Model Configuration
export interface AIModelConfig {
  modelVersion: string;
  lastTrainingDate: Date;
  dataWindowDays: number;
  updateFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  privacyMode: 'full' | 'limited' | 'anonymous';
  consentedFeatures: string[];
  excludedData: string[];
  biasDetection: boolean;
  explainabilityLevel: 'none' | 'basic' | 'detailed' | 'full';
}

// Privacy and Ethics
export interface PrivacySettings {
  dataRetention: number; // days
  sharingPermissions: SharingPermission[];
  anonymization: boolean;
  encryptionLevel: 'standard' | 'enhanced' | 'maximum';
  auditLog: boolean;
  rightToForget: boolean;
  dataPortability: boolean;
}

export interface SharingPermission {
  entity: string;
  dataTypes: string[];
  purpose: string;
  expires: Date;
  revocable: boolean;
}

// Integration Points
export interface IntegrationPoint {
  system: string;
  dataFlow: 'inbound' | 'outbound' | 'bidirectional';
  dataTypes: string[];
  frequency: string;
  lastSync: Date;
  status: 'active' | 'paused' | 'error';
}

// Notification Preferences
export interface InsightNotificationPreferences {
  enabledCategories: InsightCategory[];
  minimumSeverity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  deliveryChannels: ('app' | 'email' | 'sms' | 'push')[];
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  quietHours: QuietHours;
  emergencyOverride: boolean;
}

export interface QuietHours {
  enabled: boolean;
  start: string; // HH:mm format
  end: string; // HH:mm format
  daysOfWeek: number[]; // 0-6, Sunday-Saturday
}