// API Types and Interfaces for Mental Health Platform
// All data structures follow HIPAA compliance standards

// User and Authentication Types
export interface User {
  id: string;
  email: string;
  username: string;
  role: 'patient' | 'therapist' | 'psychiatrist' | 'admin' | 'crisis_counselor';
  profile: UserProfile;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
  lastActive: Date;
  isVerified: boolean;
  twoFactorEnabled: boolean;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  phone?: string;
  emergencyContact?: EmergencyContact;
  location?: Location;
  timezone: string;
  avatarUrl?: string;
  bio?: string;
  pronouns?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface Location {
  country: string;
  state?: string;
  city?: string;
  zipCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  accessibility: AccessibilitySettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  crisisAlerts: boolean;
  appointmentReminders: boolean;
  medicationReminders: boolean;
  communityUpdates: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'connections' | 'private';
  shareDataWithTherapist: boolean;
  anonymousMode: boolean;
  allowResearch: boolean;
}

export interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  highContrast: boolean;
  screenReaderMode: boolean;
  reducedMotion: boolean;
}

// Mental Health Data Types
export interface MoodEntry {
  id: string;
  userId: string;
  timestamp: Date;
  mood: 1 | 2 | 3 | 4 | 5; // 1 = very bad, 5 = very good
  emotions: Emotion[];
  triggers?: string[];
  activities?: string[];
  notes?: string;
  location?: string;
  weather?: WeatherData;
  sleep?: SleepData;
  medication?: MedicationTaken[];
}

export interface Emotion {
  type: string;
  intensity: number; // 0-100
}

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
}

export interface SleepData {
  duration: number; // in minutes
  quality: 1 | 2 | 3 | 4 | 5;
  disturbances: number;
}

export interface MedicationTaken {
  medicationId: string;
  taken: boolean;
  time: Date;
  dosage?: string;
}

// Crisis Support Types
export interface CrisisSession {
  id: string;
  userId: string;
  counselorId?: string;
  startTime: Date;
  endTime?: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'chat' | 'call' | 'video';
  status: 'waiting' | 'active' | 'resolved' | 'escalated';
  transcript?: Message[];
  outcome?: CrisisOutcome;
  followUpRequired: boolean;
}

export interface CrisisOutcome {
  resolved: boolean;
  escalatedToEmergency: boolean;
  referralMade: boolean;
  safetyPlanReviewed: boolean;
  followUpScheduled?: Date;
  notes?: string;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'alert';
  edited?: boolean;
  editedAt?: Date;
}

// Professional Support Types
export interface Therapist {
  id: string;
  userId: string;
  credentials: TherapistCredentials;
  specializations: string[];
  availability: AvailabilitySchedule;
  clients: string[]; // User IDs
  ratings: Rating[];
  verified: boolean;
  acceptingNewClients: boolean;
  languages: string[];
  insuranceAccepted: string[];
  sessionRate: number;
  slidingScale: boolean;
}

export interface TherapistCredentials {
  licenseNumber: string;
  licenseState: string;
  licenseType: string;
  education: Education[];
  certifications: Certification[];
  yearsOfExperience: number;
}

export interface Education {
  degree: string;
  institution: string;
  year: number;
}

export interface Certification {
  name: string;
  issuer: string;
  date: Date;
  expiryDate?: Date;
}

export interface AvailabilitySchedule {
  timezone: string;
  regularHours: WeeklySchedule;
  exceptions: ScheduleException[];
}

export interface WeeklySchedule {
  [day: string]: TimeSlot[];
}

export interface TimeSlot {
  start: string; // HH:MM format
  end: string;   // HH:MM format
}

export interface ScheduleException {
  date: Date;
  available: boolean;
  slots?: TimeSlot[];
  reason?: string;
}

export interface Rating {
  userId: string;
  rating: number; // 1-5
  review?: string;
  date: Date;
}

// Appointment Types
export interface Appointment {
  id: string;
  patientId: string;
  therapistId: string;
  scheduledTime: Date;
  duration: number; // in minutes
  type: 'initial' | 'followup' | 'crisis' | 'group';
  format: 'in-person' | 'video' | 'phone';
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  videoUrl?: string;
  notes?: AppointmentNotes;
  payment?: PaymentInfo;
  reminder?: ReminderSettings;
}

export interface AppointmentNotes {
  preSession?: string;
  postSession?: string;
  treatmentPlan?: string;
  homework?: string[];
  nextSessionGoals?: string[];
}

export interface PaymentInfo {
  amount: number;
  currency: string;
  method: 'insurance' | 'self-pay' | 'sliding-scale';
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  insuranceClaim?: InsuranceClaim;
}

export interface InsuranceClaim {
  claimNumber: string;
  provider: string;
  status: string;
  copay: number;
}

export interface ReminderSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  leadTime: number; // minutes before appointment
}

// Community Types
export interface CommunityPost {
  id: string;
  authorId: string;
  groupId?: string;
  title: string;
  content: string;
  tags: string[];
  type: 'story' | 'question' | 'resource' | 'achievement';
  visibility: 'public' | 'group' | 'connections';
  createdAt: Date;
  updatedAt: Date;
  likes: string[]; // User IDs
  comments: Comment[];
  reported: boolean;
  moderated: boolean;
  pinned: boolean;
}

export interface Comment {
  id: string;
  authorId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  likes: string[];
  replies: Comment[];
  reported: boolean;
  hidden: boolean;
}

export interface SupportGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  moderators: string[]; // User IDs
  members: string[];
  rules: string[];
  isPrivate: boolean;
  requiresApproval: boolean;
  meetingSchedule?: MeetingSchedule;
  resources: Resource[];
  createdAt: Date;
}

export interface MeetingSchedule {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek?: number;
  time: string;
  duration: number;
  meetingUrl?: string;
}

export interface Resource {
  id: string;
  title: string;
  type: 'article' | 'video' | 'pdf' | 'link' | 'exercise';
  url: string;
  description?: string;
  tags: string[];
  addedBy: string;
  addedAt: Date;
}

// Safety Plan Types
export interface SafetyPlan {
  id: string;
  userId: string;
  warningSignals: string[];
  copingStrategies: CopingStrategy[];
  distractions: string[];
  supportContacts: SupportContact[];
  professionalContacts: ProfessionalContact[];
  safeEnvironment: SafeEnvironmentStep[];
  reasonsToLive: string[];
  createdAt: Date;
  updatedAt: Date;
  lastReviewed: Date;
  sharedWith: string[]; // User IDs of therapists/support people
}

export interface CopingStrategy {
  id: string;
  strategy: string;
  effectiveness: number; // 0-10
  lastUsed?: Date;
}

export interface SupportContact {
  name: string;
  relationship: string;
  phone: string;
  availability?: string;
}

export interface ProfessionalContact {
  name: string;
  role: string;
  phone: string;
  afterHours?: string;
  organization?: string;
}

export interface SafeEnvironmentStep {
  item: string;
  action: string;
  completed: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ResponseMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  requestId: string;
}

export interface ResponseMetadata {
  timestamp: Date;
  requestId: string;
  version: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// WebSocket Event Types
export interface WebSocketEvent {
  type: string;
  payload: any;
  timestamp: Date;
  userId?: string;
}

export interface CrisisWebSocketEvent extends WebSocketEvent {
  type: 'crisis_alert' | 'counselor_assigned' | 'message' | 'session_ended' | 'escalation';
  sessionId: string;
}

export interface CommunityWebSocketEvent extends WebSocketEvent {
  type: 'new_post' | 'new_comment' | 'user_typing' | 'user_online' | 'user_offline';
  groupId?: string;
}

export interface NotificationWebSocketEvent extends WebSocketEvent {
  type: 'appointment_reminder' | 'medication_reminder' | 'crisis_check_in' | 'system_alert';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  role: 'patient' | 'therapist';
  acceptedTerms: boolean;
  marketingConsent?: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}