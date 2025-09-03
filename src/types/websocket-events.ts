/**
 * WebSocket Event Type Definitions
 * Comprehensive type definitions for all WebSocket events in the mental health platform
 */

// Base event structure
export interface BaseEventPayload {
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

// Crisis Event Payloads
export interface CrisisAlertPayload extends BaseEventPayload {
  severity: 'low' | 'moderate' | 'high' | 'critical';
  location?: GeolocationPosition;
  message: string;
  contactMethod: 'chat' | 'voice' | 'video';
  isFirstTime: boolean;
}

export interface CrisisCounselorAssignedPayload extends BaseEventPayload {
  counselorId: string;
  counselorName: string;
  estimatedWaitTime: number;
  specializations: string[];
}

export interface CrisisMessagePayload extends BaseEventPayload {
  messageId: string;
  senderId: string;
  content: string;
  isFromCounselor: boolean;
  attachments?: Array<{
    type: 'image' | 'document' | 'audio';
    url: string;
    name: string;
  }>;
}

export interface CrisisEscalationPayload extends BaseEventPayload {
  previousLevel: string;
  newLevel: string;
  reason: string;
  recommendedActions: string[];
  emergencyContacts?: Array<{
    name: string;
    phone: string;
    relationship: string;
  }>;
}

export interface CrisisInterventionPayload extends BaseEventPayload {
  interventionType: 'breathing' | 'grounding' | 'safety_plan' | 'emergency_contact';
  interventionId: string;
  effectiveness?: number;
  duration?: number;
}

// Community Event Payloads
export interface CommunityPostPayload extends BaseEventPayload {
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  tags: string[];
  supportLevel?: 'seeking' | 'offering' | 'sharing';
}

export interface CommunityLikePayload extends BaseEventPayload {
  postId: string;
  likerId: string;
  likerName: string;
  totalLikes: number;
}

export interface CommunityModerationPayload extends BaseEventPayload {
  action: 'flag' | 'remove' | 'warn' | 'approve';
  targetId: string;
  targetType: 'post' | 'comment' | 'user';
  reason: string;
  moderatorId: string;
}

// Notification Event Payloads
export interface NotificationMedicationPayload extends BaseEventPayload {
  medicationName: string;
  dosage: string;
  scheduledTime: Date;
  isUrgent: boolean;
  instructions?: string;
}

export interface NotificationWellnessPayload extends BaseEventPayload {
  activityType: 'mood_check' | 'exercise' | 'meditation' | 'journal';
  reminderText: string;
  suggestedDuration?: number;
  streakCount?: number;
}

export interface NotificationAchievementPayload extends BaseEventPayload {
  achievementId: string;
  achievementName: string;
  description: string;
  category: 'wellness' | 'therapy' | 'community' | 'crisis_management';
  points?: number;
  badge?: string;
}

// Presence Event Payloads
export interface PresenceMoodChangePayload extends BaseEventPayload {
  previousMood: number;
  currentMood: number;
  trigger?: string;
  isSignificantChange: boolean;
}

// Peer Support Event Payloads
export interface PeerSupportRequestPayload extends BaseEventPayload {
  requestId: string;
  topic: string;
  preferredLanguage?: string;
  urgency: 'low' | 'medium' | 'high';
}

export interface PeerSupportMatchedPayload extends BaseEventPayload {
  matchId: string;
  peerId: string;
  peerName: string;
  commonInterests: string[];
  matchScore: number;
}

// Authentication Event Payloads
export interface AuthSuccessPayload extends BaseEventPayload {
  token: string;
  refreshToken?: string;
  expiresIn: number;
  permissions: string[];
}

export interface AuthFailurePayload extends BaseEventPayload {
  reason: string;
  attemptNumber: number;
  lockoutTime?: number;
}

// Connection Event Payloads
export interface ConnectionQualityPayload extends BaseEventPayload {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  latency: number;
  packetLoss: number;
  bandwidth: {
    upload: number;
    download: number;
  };
}

// User data structure
export interface WebSocketUser {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'therapist' | 'counselor' | 'admin' | 'peer_supporter';
  avatar?: string;
  status?: 'online' | 'away' | 'busy' | 'offline';
  lastActive?: Date;
}

// Message metadata structure
export interface MessageMetadata {
  encrypted: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  retryCount?: number;
  acknowledgmentRequired?: boolean;
  expiresAt?: Date;
}

// Comprehensive event map
export interface WebSocketEventMap {
  // Connection events
  'connect': void;
  'disconnect': { reason: string };
  'reconnect': { attempt: number };
  'error': Error;
  'connection:quality': ConnectionQualityPayload;
  
  // Authentication events
  'auth:success': AuthSuccessPayload;
  'auth:failure': AuthFailurePayload;
  'session:refresh': { newToken: string };
  
  // Crisis events
  'crisis:alert': CrisisAlertPayload;
  'crisis:counselor_assigned': CrisisCounselorAssignedPayload;
  'crisis:message': CrisisMessagePayload;
  'crisis:session_ended': { sessionId: string; duration: number; summary?: string };
  'crisis:escalation': CrisisEscalationPayload;
  'crisis:typing': { userId: string; isTyping: boolean };
  'crisis:intervention': CrisisInterventionPayload;
  'crisis:follow_up': { scheduledTime: Date; type: string };
  
  // Community events
  'community:post_new': CommunityPostPayload;
  'community:post_updated': CommunityPostPayload & { editedAt: Date };
  'community:post_liked': CommunityLikePayload;
  'community:comment_new': { postId: string; comment: string; authorId: string };
  'community:user_typing': { channelId: string; userId: string; isTyping: boolean };
  'community:user_online': { userId: string; status: string };
  'community:user_offline': { userId: string; lastSeen: Date };
  'community:moderation': CommunityModerationPayload;
  
  // Peer support events
  'peer_support:request': PeerSupportRequestPayload;
  'peer_support:matched': PeerSupportMatchedPayload;
  'peer_support:message': { matchId: string; message: string; senderId: string };
  'peer_support:ended': { matchId: string; reason: string; rating?: number };
  
  // Notification events
  'notification:appointment': { appointmentId: string; time: Date; therapistName: string };
  'notification:medication': NotificationMedicationPayload;
  'notification:crisis_check': { checkType: string; urgency: string };
  'notification:system': { message: string; type: 'info' | 'warning' | 'error' };
  'notification:wellness': NotificationWellnessPayload;
  'notification:achievement': NotificationAchievementPayload;
  'notification:reminder': { reminderId: string; text: string; actionUrl?: string };
  
  // Presence events
  'presence:update': { userId: string; status: string; activity?: string };
  'presence:request': { targetUserId: string };
  'presence:mood_change': PresenceMoodChangePayload;
  
  // Therapist events
  'therapist:available': { therapistId: string; availableSlots: Date[] };
  'therapist:busy': { therapistId: string; nextAvailable: Date };
  'therapist:message': { therapistId: string; patientId: string; message: string };
  'therapist:session_started': { sessionId: string; therapistId: string; patientId: string };
  'therapist:session_ended': { sessionId: string; duration: number; notes?: string };
}

// Type helper for event handlers
export type WebSocketEventHandler<K extends keyof WebSocketEventMap> = (
  payload: WebSocketEventMap[K]
) => void | Promise<void>;