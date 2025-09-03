// User types
export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  avatar?: string;
  role: 'user' | 'professional' | 'admin' | 'moderator';
  token?: string;
  createdAt: Date;
  updatedAt: Date;
  profile?: UserProfile;
}

export interface UserProfile {
  bio?: string;
  dateOfBirth?: Date;
  phone?: string;
  emergencyContact?: EmergencyContact;
  preferences: UserPreferences;
  mentalHealthProfile?: MentalHealthProfile;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  reminders: boolean;
  crisisAlerts: boolean;
}

export interface PrivacySettings {
  shareData: boolean;
  publicProfile: boolean;
  showMoodHistory: boolean;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  type: 'terms' | 'privacy' | 'data_processing' | 'marketing' | 'data_sharing' | 'analytics' | 'cookies' | 'health_data' | 'crisis_intervention' | 'emergency_contact' | 'therapist_access' | 'research' | 'third_party';
  version: string;
  consentGiven: boolean;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  purpose?: string;
  dataCategories?: string[];
  expiresAt?: Date;
  withdrawable?: boolean;
}

// Mental Health types
export interface MentalHealthProfile {
  conditions?: string[];
  medications?: Medication[];
  therapist?: Professional;
  emergencyPlan?: EmergencyPlan;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
}

export interface Professional {
  id: string;
  name: string;
  title: string;
  specialty: string[];
  contact: ContactInfo;
  availability?: Availability[];
}

export interface ContactInfo {
  email: string;
  phone: string;
  address?: string;
}

export interface Availability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

// Crisis Support types
export interface CrisisResource {
  id: string;
  name: string;
  type: 'hotline' | 'text' | 'chat' | 'emergency';
  contact: string;
  available247: boolean;
  description: string;
  country: string;
}

export interface EmergencyPlan {
  id: string;
  userId: string;
  warningSignals: string[];
  copingStrategies: string[];
  supportContacts: EmergencyContact[];
  safeEnvironment: string[];
  professionalContacts: Professional[];
  createdAt: Date;
  updatedAt: Date;
}

// Mood Tracking types
export interface MoodEntry {
  id: string;
  userId: string;
  mood: MoodLevel;
  emotions: Emotion[];
  activities?: Activity[];
  notes?: string;
  timestamp: Date;
  triggers?: string[];
  copingStrategies?: string[];
}

export type MoodLevel = 1 | 2 | 3 | 4 | 5; // 1 = Very Low, 5 = Excellent

export interface Emotion {
  name: string;
  intensity: number; // 1-10
}

export interface Activity {
  name: string;
  duration: number; // in minutes
  category: ActivityCategory;
}

export type ActivityCategory = 
  | 'exercise'
  | 'social'
  | 'work'
  | 'leisure'
  | 'selfcare'
  | 'sleep'
  | 'meditation'
  | 'therapy';

// Wellness types
export interface WellnessGoal {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: WellnessCategory;
  targetDate: Date;
  progress: number; // 0-100
  milestones: Milestone[];
  status: 'active' | 'completed' | 'paused';
  createdAt: Date;
  updatedAt: Date;
}

export type WellnessCategory = 
  | 'physical'
  | 'mental'
  | 'emotional'
  | 'social'
  | 'spiritual'
  | 'occupational';

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
}

// Community types
export interface CommunityPost {
  id: string;
  authorId: string;
  author: User;
  title: string;
  content: string;
  tags: string[];
  likes: number;
  comments: Comment[];
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: User;
  content: string;
  likes: number;
  isAnonymous: boolean;
  createdAt: Date;
}

export interface SupportGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  isPrivate: boolean;
  moderators: User[];
  rules: string[];
  createdAt: Date;
}

// Session types
export interface TherapySession {
  id: string;
  patientId: string;
  professionalId: string;
  scheduledAt: Date;
  duration: number; // in minutes
  type: 'video' | 'audio' | 'chat' | 'inPerson';
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  notes?: string;
  recording?: string;
}

// Analytics types
export interface AnalyticsData {
  userId: string;
  period: 'day' | 'week' | 'month' | 'year';
  moodTrends: MoodTrend[];
  activitySummary: ActivitySummary;
  wellnessProgress: WellnessProgress;
}

export interface MoodTrend {
  date: Date;
  averageMood: number;
  moodCount: number;
}

export interface ActivitySummary {
  totalActivities: number;
  byCategory: Record<ActivityCategory, number>;
  totalDuration: number;
}

export interface WellnessProgress {
  goalsCompleted: number;
  goalsActive: number;
  overallProgress: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ResponseMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ResponseMetadata {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio';
  required?: boolean;
  placeholder?: string;
  options?: SelectOption[];
  validation?: ValidationRule[];
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface ValidationRule {
  type: 'required' | 'email' | 'min' | 'max' | 'pattern';
  value?: unknown;
  message: string;
}