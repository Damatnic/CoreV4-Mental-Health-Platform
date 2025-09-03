// Dashboard-specific types for the personal mental health dashboard

import { MoodEntry, WellnessGoal, TherapySession, CrisisResource, Activity, User } from './index';

// Re-export commonly used types
export type { MoodEntry, WellnessGoal, TherapySession, CrisisResource, Activity, User };

// Dashboard Widget Types
export type DashboardWidgetType = 
  | 'crisis_panel'
  | 'wellness_status'
  | 'todays_schedule'
  | 'progress_tracker'
  | 'recent_activity'
  | 'quick_actions'
  | 'professional_care'
  | 'insights'
  | 'environmental_factors'
  | 'mood_tracker'
  | 'medication_reminder'
  | 'journal_prompt'
  // Additional widget types used by components
  | 'mood_trends'
  | 'therapy_progress'
  | 'community_feed'
  | 'goals_progress'
  | 'medication_tracker'
  | 'activity_tracker'
  | 'goal_progress'
  | 'habit_tracker'
  | 'activity_analytics'
  | 'behavioral_activation';

export interface DashboardWidget {
  id: string;
  type: DashboardWidgetType;
  title: string;
  description?: string;
  position: GridPosition;
  size: WidgetSize;
  isCollapsed?: boolean;
  isLoading?: boolean;
  lastUpdated?: Date;
  refreshInterval?: number; // in seconds
  priority: 'critical' | 'high' | 'medium' | 'low';
  accessibility?: AccessibilityConfig;
}

export interface GridPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  width: number; // Grid columns (1-12)
  height: number; // Grid rows
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface AccessibilityConfig {
  ariaLabel?: string;
  ariaDescribedBy?: string;
  keyboardShortcut?: string;
  focusOrder?: number;
}

// Dashboard Data Types
export interface DashboardData {
  user: User;
  widgets: DashboardWidget[];
  wellnessStatus?: WellnessStatus;
  todaySchedule?: ScheduleItem[];
  recentActivity?: ActivityItem[];
  insights?: PersonalInsight[];
  environmentalFactors?: EnvironmentalData;
  notifications?: DashboardNotification[];
  crisisData?: CrisisPanelData;
  quickActions?: QuickAction[];
  lastSync?: Date;
  isOffline?: boolean;
}

export interface WellnessStatus {
  overallScore: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
  lastMoodEntry?: MoodEntry;
  activeGoals: WellnessGoal[];
  streaks: WellnessStreak[];
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  recommendations: string[];
}

export interface WellnessStreak {
  type: 'mood_tracking' | 'meditation' | 'exercise' | 'journaling' | 'medication';
  count: number;
  unit: 'days' | 'weeks' | 'months';
  lastActivity: Date;
}

export interface ScheduleItem {
  id: string;
  type: 'therapy' | 'medication' | 'activity' | 'reminder' | 'appointment';
  title: string;
  time: Date;
  duration?: number; // in minutes
  location?: string;
  isVirtual?: boolean;
  provider?: string;
  notes?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'missed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
}

export interface ActivityItem {
  id: string;
  type: 'mood_entry' | 'journal' | 'exercise' | 'meditation' | 'social' | 'therapy';
  title: string;
  timestamp: Date;
  duration?: number;
  impact?: 'positive' | 'neutral' | 'negative';
  tags?: string[];
  notes?: string;
}

export interface PersonalInsight {
  id: string;
  type: 'pattern' | 'suggestion' | 'achievement' | 'warning' | 'milestone';
  title: string;
  description: string;
  confidence: number; // 0-1
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  actions?: InsightAction[];
  createdAt: Date;
  expiresAt?: Date;
}

export interface InsightAction {
  label: string;
  action: string; // URL or function name
  type: 'primary' | 'secondary' | 'info';
}

export interface EnvironmentalData {
  weather?: WeatherData;
  location?: LocationData;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  season: 'spring' | 'summer' | 'fall' | 'winter';
  lunarPhase?: string;
  airQuality?: number;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  pressure: number;
  uv?: number;
}

export interface LocationData {
  city?: string;
  country?: string;
  timezone: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface DashboardNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'crisis';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  isPersistent: boolean;
  actions?: NotificationAction[];
  priority: 'high' | 'medium' | 'low';
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

// Crisis Panel specific types
export interface CrisisPanelData {
  emergencyContacts: EmergencyContact[];
  hotlines: CrisisHotline[];
  safetyPlan?: SafetyPlan;
  currentRiskLevel: 'low' | 'moderate' | 'high' | 'critical';
  lastCheckIn?: Date;
  triggers?: string[];
  copingStrategies?: CopingStrategy[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isAvailable: boolean;
  preferredContact: 'call' | 'text' | 'both';
  notes?: string;
}

export interface CrisisHotline {
  id: string;
  name: string;
  type: 'hotline' | 'text' | 'chat' | 'video';
  contact: string;
  available247: boolean;
  specialization?: string[];
  languages?: string[];
  description?: string;
  country?: string;
  waitTime?: number; // in minutes
}

export interface SafetyPlan {
  id: string;
  warningSignsText: string;
  copingStrategiesText: string;
  supportPeopleText: string;
  professionalContactsText: string;
  safeEnvironmentText: string;
  reasonsToLiveText: string;
  lastUpdated: Date;
  createdBy?: string;
}

export interface CopingStrategy {
  id: string;
  name: string;
  category: 'breathing' | 'grounding' | 'distraction' | 'social' | 'physical' | 'creative';
  description: string;
  duration?: number; // in minutes
  effectiveness?: number; // 0-5 rating
  lastUsed?: Date;
}

// Quick Actions
export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  description?: string;
  action: string; // URL or function
  color?: string;
  category: 'wellness' | 'tracking' | 'crisis' | 'social' | 'professional';
  isEmergency?: boolean;
  keyboard?: string; // Keyboard shortcut
  badge?: string | number;
  tags?: string[]; // Search tags for categorization
  voiceAlias?: string[]; // Voice command aliases
}

// Performance and Analytics
export interface DashboardMetrics {
  loadTime: number;
  widgetLoadTimes: Record<string, number>;
  interactionCount: number;
  errorCount: number;
  sessionDuration: number;
  lastInteraction: Date;
}

// Feature Flags
export interface DashboardFeatures {
  enableAIInsights: boolean;
  enableRealTimeSync: boolean;
  enableOfflineMode: boolean;
  enableVoiceCommands: boolean;
  enableBiometricAuth: boolean;
  enableAdvancedAnalytics: boolean;
  enableCrisisAutoDetection: boolean;
  maxWidgets: number;
}

// Widget-specific data types
export interface MoodTrackerData {
  currentMood?: number;
  recentMoods: MoodEntry[];
  averageMood: number;
  moodTrend: 'improving' | 'stable' | 'declining';
}

export interface MedicationReminderData {
  medications: Medication[];
  nextDose?: MedicationDose;
  adherenceRate: number;
  missedDoses: number;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  startDate: Date;
  endDate?: Date;
  refillDate?: Date;
  sideEffects?: string[];
  notes?: string;
}

export interface MedicationDose {
  medicationId: string;
  scheduledTime: Date;
  status: 'pending' | 'taken' | 'missed' | 'skipped';
  takenAt?: Date;
  notes?: string;
}

// Progress Tracking
export interface ProgressData {
  goals: GoalProgress[];
  habits: HabitProgress[];
  achievements: Achievement[];
  statistics: UserStatistics;
}

export interface GoalProgress {
  goal: WellnessGoal;
  progress: number; // 0-100
  milestones: Milestone[];
  lastUpdate: Date;
  projectedCompletion?: Date;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
  value?: number;
}

export interface HabitProgress {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  lastCompleted?: Date;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress?: number;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserStatistics {
  totalMoodEntries: number;
  averageMoodScore: number;
  totalActivities: number;
  wellnessScore: number;
  engagementLevel: 'low' | 'medium' | 'high';
  memberSince: Date;
}

// Error handling
export interface DashboardError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: Date;
  widgetId?: string;
  recoverable: boolean;
  retryAction?: () => void;
}

// Type guards
export function isDashboardWidget(obj: unknown): obj is DashboardWidget {
  return obj && typeof obj.id === 'string' && typeof obj.type === 'string';
}

export function isEmergencyContact(obj: unknown): obj is EmergencyContact {
  return obj && typeof obj.name === 'string' && typeof obj.phone === 'string';
}

export function isCrisisHotline(obj: unknown): obj is CrisisHotline {
  return obj && typeof obj.name === 'string' && typeof obj.contact === 'string';
}

