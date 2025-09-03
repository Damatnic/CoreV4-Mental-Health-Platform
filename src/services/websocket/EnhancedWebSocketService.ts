/**
 * Enhanced WebSocket Service for Mental Health Platform
 * Implements comprehensive real-time communication with HIPAA compliance
 * Features: Crisis support, community interaction, notifications, peer support
 */

import { io, Socket } from 'socket.io-client';
import { secureStorage } from '../security/SecureLocalStorage';
import { logger } from '../../utils/logger';

// Connection state interface
interface ConnectionState {
  isConnected: boolean;
  reconnectAttempts: number;
  latency: number;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  lastSuccessfulMessage: Date;
  lastError?: Error;
  messagesQueued: number;
  dataUsage: {
    sent: number;
    received: number;
    session: number;
  };
}

// Enhanced WebSocket Configuration
const WS_CONFIG = {
  url: import.meta.env.VITE_WS_URL || 'ws://localhost:3002',
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 10,
  timeout: 20000,
  transports: ['websocket', 'polling'],
  auth: {
    token: ''
  },
  secure: true,
  compress: true,
  forceNew: false
};

// Comprehensive WebSocket Event Types for Mental Health Platform
export enum WSEventType {
  // Connection Events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  RECONNECT = 'reconnect',
  ERROR = 'error',
  CONNECTION_QUALITY = 'connection:quality',
  
  // Authentication Events
  AUTH_SUCCESS = 'auth:success',
  AUTH_FAILURE = 'auth:failure',
  SESSION_REFRESH = 'session:refresh',
  
  // Crisis Events
  CRISIS_ALERT = 'crisis:alert',
  CRISIS_COUNSELOR_ASSIGNED = 'crisis:counselor_assigned',
  CRISIS_MESSAGE = 'crisis:message',
  CRISIS_SESSION_ENDED = 'crisis:session_ended',
  CRISIS_ESCALATION = 'crisis:escalation',
  CRISIS_TYPING = 'crisis:typing',
  CRISIS_INTERVENTION = 'crisis:intervention',
  CRISIS_FOLLOW_UP = 'crisis:follow_up',
  
  // Community Events
  COMMUNITY_POST_NEW = 'community:post_new',
  COMMUNITY_POST_UPDATED = 'community:post_updated',
  COMMUNITY_POST_LIKED = 'community:post_liked',
  COMMUNITY_COMMENT_NEW = 'community:comment_new',
  COMMUNITY_USER_TYPING = 'community:user_typing',
  COMMUNITY_USER_ONLINE = 'community:user_online',
  COMMUNITY_USER_OFFLINE = 'community:user_offline',
  COMMUNITY_MODERATION = 'community:moderation',
  
  // Peer Support Events
  PEER_SUPPORT_REQUEST = 'peer_support:request',
  PEER_SUPPORT_MATCHED = 'peer_support:matched',
  PEER_SUPPORT_MESSAGE = 'peer_support:message',
  PEER_SUPPORT_ENDED = 'peer_support:ended',
  
  // Notification Events
  NOTIFICATION_APPOINTMENT = '_notification:appointment',
  NOTIFICATION_MEDICATION = '_notification:medication',
  NOTIFICATION_CRISIS_CHECK = '_notification:crisis_check',
  NOTIFICATION_SYSTEM = '_notification:system',
  NOTIFICATION_WELLNESS = '_notification:wellness',
  NOTIFICATION_ACHIEVEMENT = '_notification:achievement',
  NOTIFICATION_REMINDER = '_notification:reminder',
  
  // Presence Events
  PRESENCE_UPDATE = 'presence:update',
  PRESENCE_REQUEST = 'presence:request',
  PRESENCE_MOOD_CHANGE = 'presence:mood_change',
  
  // Therapist Events
  THERAPIST_AVAILABLE = 'therapist:available',
  THERAPIST_BUSY = 'therapist:busy',
  THERAPIST_MESSAGE = 'therapist:message',
  THERAPIST_SESSION_START = 'therapist:session_start',
  THERAPIST_HOMEWORK_ASSIGNED = 'therapist:homework_assigned',
  
  // Group Session Events
  GROUP_SESSION_START = 'group:session_start',
  GROUP_SESSION_END = 'group:session_end',
  GROUP_USER_JOIN = 'group:user_join',
  GROUP_USER_LEAVE = 'group:user_leave',
  GROUP_MESSAGE = 'group:message',
  GROUP_ACTIVITY_START = 'group:activity_start',
  
  // Wellness and Progress Events
  WELLNESS_GOAL_UPDATE = 'wellness:goal_update',
  WELLNESS_MILESTONE = 'wellness:milestone',
  MOOD_PATTERN_ALERT = 'mood:pattern_alert',
  HABIT_STREAK_UPDATE = 'habit:streak_update',
  
  // Real-time Analytics
  ANALYTICS_UPDATE = 'analytics:update',
  INSIGHTS_AVAILABLE = 'insights:available',
  
  // System Events
  MAINTENANCE_MODE = 'system:maintenance',
  FEATURE_UPDATE = 'system:feature_update',
  SECURITY_ALERT = 'system:security_alert'
}

// Enhanced notification types for mental health platform
export enum NotificationType {
  // Wellness notifications
  MOOD_REMINDER = 'mood_reminder',
  MEDICATION_REMINDER = 'medication_reminder',
  HYDRATION_REMINDER = 'hydration_reminder',
  EXERCISE_REMINDER = 'exercise_reminder',
  SLEEP_REMINDER = 'sleep_reminder',
  THERAPY_HOMEWORK = 'therapy_homework',
  
  // Crisis and safety
  CRISIS_ALERT = 'crisis_alert',
  SAFETY_CHECK = 'safety_check',
  EMERGENCY_CONTACT = 'emergency_contact',
  PROFESSIONAL_REFERRAL = 'professional_referral',
  
  // Community and social
  NEW_COMMUNITY_POST = 'new_community_post',
  POST_REPLY = 'post_reply',
  POST_LIKED = 'post_liked',
  SUPPORT_GROUP_INVITATION = 'support_group_invitation',
  GROUP_EVENT_REMINDER = 'group_event_reminder',
  PEER_SUPPORT_REQUEST = 'peer_support_request',
  
  // Progress and achievements
  GOAL_MILESTONE = 'goal_milestone',
  STREAK_ACHIEVEMENT = 'streak_achievement',
  WEEKLY_PROGRESS = 'weekly_progress',
  INSIGHT_AVAILABLE = 'insight_available',
  
  // System and updates
  APP_UPDATE = 'app_update',
  FEATURE_ANNOUNCEMENT = 'feature_announcement',
  MAINTENANCE_NOTICE = 'maintenance_notice',
  SECURITY_ALERT = 'security_alert'
}

// Enhanced interfaces for comprehensive mental health communication
export interface EnhancedMessage {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
  messageType: 'text' | 'image' | 'audio' | 'file' | 'emoji' | 'sticker' | 'poll' | 'crisis_alert';
  metadata?: {
    moodContext?: number;
    isEncrypted?: boolean;
    requiresResponse?: boolean;
    expiresAt?: Date;
    supportLevel?: 'low' | 'medium' | 'high' | 'crisis';
    therapeuticCategory?: 'cbt' | 'dbt' | 'mindfulness' | 'behavioral' | 'emotional';
  };
  reactions?: {
    userId: string;
    reaction: string;
    timestamp: Date;
  }[];
  threadId?: string;
  parentMessageId?: string;
}

export interface UserPresence {
  userId: string;
  username: string;
  status: 'online' | 'away' | 'busy' | 'invisible' | 'in-crisis' | 'in-therapy';
  lastSeen: Date;
  currentActivity?: {
    type: 'browsing' | 'journaling' | 'community' | 'therapy' | 'crisis-support';
    details?: string;
  };
  moodStatus?: {
    level: number;
    emoji?: string;
    isPrivate: boolean;
  };
  supportAvailability?: {
    isPeerSupporter: boolean;
    isAvailable: boolean;
    expertiseAreas?: string[];
  };
}

export interface PeerSupportSession {
  id: string;
  type: 'crisis' | 'general' | 'specific';
  startTime: Date;
  endTime?: Date;
  participants: string[];
  status: 'seeking-support' | 'matched' | 'in-progress' | 'completed' | 'cancelled';
  metadata?: unknown;
  feedback?: {
    helpful: boolean;
    rating: number;
    comment?: string;
  };
}

export interface TypingUser {
  userId: string;
  username: string;
  timestamp: number;
}


export interface QueuedMessage {
  event: string;
  data: unknown;
  timestamp: number;
  retries: number;
}

export interface NotificationOptions {
  icon?: string;
  _priority?: 'low' | 'normal' | 'high' | 'critical';
  actions?: { _action: string; title: string }[];
  requireInteraction?: boolean;
  celebrationEffect?: boolean;
  soundType?: 'gentle' | 'urgent' | 'success' | 'none';
  vibrationPattern?: number[];
}

/**
 * Enhanced WebSocket Service Class
 * Provides comprehensive real-time communication for mental health platform
 */
export class EnhancedWebSocketService {
  private static instance: EnhancedWebSocketService;
  private socket: Socket | null = null;
  private connectionState: ConnectionState = {
    isConnected: false,
    reconnectAttempts: 0,
    latency: 0,
    connectionQuality: 'poor',
    lastSuccessfulMessage: new Date(),
    messagesQueued: 0,
    dataUsage: {
      sent: 0,
      received: 0,
      session: 0,
    },
  };
  private eventHandlers: Map<string, Set<Function>> = new Map();
  private typingUsers: Map<string, TypingUser> = new Map();
  private messageQueue: QueuedMessage[] = [];
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private currentUser: unknown = null;
  private activeRooms: Set<string> = new Set();
  
  // Enhanced real-time features
  private userPresences: Map<string, UserPresence> = new Map();
  private notificationQueue: Notification[] = [];
  private activeNotifications: Map<string, Notification> = new Map();
  private messageThreads: Map<string, EnhancedMessage[]> = new Map();
  private peerSupportSessions: Map<string, PeerSupportSession> = new Map();
  private realTimeAnalytics = {
    messagesExchanged: 0,
    supportSessionsInitiated: 0,
    crisisAlertsHandled: 0,
    communityInteractions: 0,
  };
  
  // Notification system
  private notificationPermission: NotificationPermission = 'default';
  private serviceWorker: ServiceWorker | null = null;
// @ts-expect-error - PushSubscription is a global API
  private pushSubscription: PushSubscription | null = null;

  private constructor() {
    this.initializeConnectionState();
    this.loadQueuedMessages();
    this.initializeNotificationSystem();
  }

  // Singleton pattern
  public static getInstance(): EnhancedWebSocketService {
    if (!EnhancedWebSocketService.instance) {
      EnhancedWebSocketService.instance = new EnhancedWebSocketService();
    }
    return EnhancedWebSocketService.instance;
  }

  private initializeConnectionState(): void {
    this.connectionState = {
      isConnected: false,
      reconnectAttempts: 0,
      latency: 0,
      connectionQuality: 'good',
      lastSuccessfulMessage: new Date(),
      messagesQueued: 0,
      dataUsage: {
        sent: 0,
        received: 0,
        session: 0
      }
    };
  }
  
  private initializeNotificationSystem(): void {
    // Initialize _notification permissions
    if ('Notification' in window) {
      this.notificationPermission = Notification.permission;
      
      if (this.notificationPermission === 'default') {
        Notification.requestPermission().then(permission => {
          this.notificationPermission = permission;
        });
      }
    }
    
    this.loadNotificationPreferences();
  }
  
  private loadNotificationPreferences(): void {
    try {
      const _prefs = secureStorage.getItem('notification_preferences');
      if (_prefs) {
        const preferences = JSON.parse(_prefs);
        logger.debug('Loaded _notification preferences', 'EnhancedWebSocket', preferences);
      }
    } catch {
      logger.error('Failed to load _notification preferences:');
    }
  }

  // Initialize WebSocket connection with enhanced monitoring
  public connect(token: string, user: unknown): void {
    if (this.socket?.connected) {
      logger.debug('WebSocket already connected', 'EnhancedWebSocket');
      return;
    }

    this.currentUser = user;
    WS_CONFIG.auth.token = token;

    // Create socket connection with enhanced configuration
    this.socket = io(WS_CONFIG.url, {
      ...WS_CONFIG,
      auth: WS_CONFIG.auth,
      forceNew: false
    });

    this.setupEventListeners();
    this.startHeartbeat();
    this.startConnectionMonitoring();
    
    // Initialize user presence
    this.updateUserPresence({
      status: 'online',
      currentActivity: {
        type: 'browsing',
        details: 'Connected to platform'
      }
    });
  }

  // Disconnect WebSocket
  public disconnect(): void {
    if (this.socket) {
      this.stopHeartbeat();
      this.socket.disconnect();
      this.socket = null;
      this.connectionState.isConnected = false;
      this.activeRooms.clear();
      this.typingUsers.clear();
      
      // Update presence to offline
      if (this.currentUser) {
        this.updateUserPresence({ status: 'invisible' });
      }
    }
  }

  private startConnectionMonitoring(): void {
    setInterval(() => {
      if (this.socket?.connected) {
        const now = Date.now();
        const timeSinceLastMessage = now - this.connectionState.lastSuccessfulMessage.getTime();
        
        // Update connection quality based on latency and recent activity
        if (this.connectionState.latency < 100 && timeSinceLastMessage < 30000) {
          this.connectionState.connectionQuality = 'excellent';
        } else if (this.connectionState.latency < 300 && timeSinceLastMessage < 60000) {
          this.connectionState.connectionQuality = 'good';
        } else if (this.connectionState.latency < 1000) {
          this.connectionState.connectionQuality = 'fair';
        } else {
          this.connectionState.connectionQuality = 'poor';
        }
        
        this.emit(WSEventType.CONNECTION_QUALITY, {
          quality: this.connectionState.connectionQuality,
          latency: this.connectionState.latency,
          messagesQueued: this.messageQueue.length
        });
      }
    }, 10000); // Check every 10 seconds
  }

  // Setup comprehensive event listeners for mental health platform
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events with enhanced monitoring
    this.socket.on(WSEventType.CONNECT, () => {
      logger.info('WebSocket connected', 'EnhancedWebSocket');
      this.connectionState.isConnected = true;
      this.connectionState.reconnectAttempts = 0;
      this.connectionState.lastSuccessfulMessage = new Date();
      this.processQueuedMessages();
      this.emit(WSEventType.CONNECT, { timestamp: new Date() });
      
      // Rejoin rooms after reconnection
      this.activeRooms.forEach(room => {
        this.joinRoom(_room);
      });
      
      // Restore user presence after reconnection
      if (this.currentUser) {
        this.updateUserPresence({ status: 'online' });
      }
      
      // Send any queued notifications
      this.processQueuedNotifications();
    });

    this.socket.on(WSEventType.DISCONNECT, (reason: unknown) => {
      logger.info('WebSocket disconnected', 'EnhancedWebSocket', { reason });
      this.connectionState.isConnected = false;
      this.emit(WSEventType.DISCONNECT, { reason, timestamp: new Date() });
    });

    this.socket.on(WSEventType.ERROR, (error: unknown) => {
      logger.error('WebSocket error:', error);
      this.connectionState.lastError = error;
      this.emit(WSEventType.ERROR, { error, timestamp: new Date() });
    });

    // Setup all event type listeners
    this.setupAuthenticationEventListeners();
    this.setupCrisisEventListeners();
    this.setupCommunityEventListeners();
    this.setupNotificationEventListeners();
    this.setupPresenceEventListeners();
    this.setupPeerSupportEventListeners();
    this.setupTherapistEventListeners();
    this.setupGroupEventListeners();
    this.setupWellnessEventListeners();
  }

  private setupAuthenticationEventListeners(): void {
    if (!this.socket) return;

    this.socket.on(WSEventType.AUTH_SUCCESS, (data: unknown) => {
      logger.info('WebSocket authentication successful', 'EnhancedWebSocket');
      this.emit(WSEventType.AUTH_SUCCESS, data);
    });

    this.socket.on(WSEventType.AUTH_FAILURE, (data: unknown) => {
      logger.error('WebSocket authentication failed:', data);
      this.emit(WSEventType.AUTH_FAILURE, data);
      this.disconnect();
    });
  }

  // Crisis event listeners with comprehensive support
  private setupCrisisEventListeners(): void {
    if (!this.socket) return;

    this.socket.on(WSEventType.CRISIS_ALERT, (data: unknown) => {
      logger.crisis('Crisis alert received', 'high', 'EnhancedWebSocket', data);
      this.emit(WSEventType.CRISIS_ALERT, data);
      
      // Auto-join crisis _room if it's for current user
      if (data.userId === this.currentUser?.id) {
        this.joinCrisisSession(data.sessionId);
      }
      
      // Show critical crisis notification
      this.showNotification('Crisis Support Activated', 'Immediate support is available', {
        icon: '🚨',
        _priority: 'critical',
        requireInteraction: true,
        actions: [
          { _action: 'emergency', title: 'Emergency Services' },
          { _action: 'crisis-chat', title: 'Crisis Chat' },
          { _action: 'support', title: 'Find Support' }
        ]
      });
    });

    this.socket.on(WSEventType.CRISIS_ESCALATION, (data: unknown) => {
      logger.crisis('Crisis escalated', 'critical', 'EnhancedWebSocket', data);
      this.emit(WSEventType.CRISIS_ESCALATION, data);
      this.handleCrisisEscalation(data);
    });

    this.socket.on(WSEventType.CRISIS_INTERVENTION, (data: unknown) => {
      this.showNotification('Professional Support', 'A crisis counselor is joining your session', {
        icon: '👨⚕️',
        _priority: 'high',
        requireInteraction: true
      });
      this.emit(WSEventType.CRISIS_INTERVENTION, data);
    });
  }

  // Community event listeners with real-time updates
  private setupCommunityEventListeners(): void {
    if (!this.socket) return;

    this.socket.on(WSEventType.COMMUNITY_POST_NEW, (data: unknown) => {
      this.emit(WSEventType.COMMUNITY_POST_NEW, data);
      this.realTimeAnalytics.communityInteractions++;
      
      this.showNotification('New Community Post', `${data.author}: "${data.preview}"`, {
        icon: '💬',
        actions: [
          { _action: 'view', title: 'View Post' },
          { _action: 'react', title: 'Send Support' }
        ]
      });
    });

    this.socket.on(WSEventType.COMMUNITY_POST_LIKED, (data: unknown) => {
      if (data.authorId === this.currentUser?.id) {
        this.showNotification('Post Appreciated', 'Someone found your post helpful', {
          icon: '❤️',
          soundType: 'success'
        });
      }
    });

    this.socket.on(WSEventType.COMMUNITY_MODERATION, (data: unknown) => {
      if (data.userId === this.currentUser?.id) {
        this.showNotification('Community Guidelines', data.message, {
          icon: '⚠️',
          _priority: 'high',
          requireInteraction: true
        });
      }
    });
  }

  // Enhanced notification event listeners
  private setupNotificationEventListeners(): void {
    if (!this.socket) return;

    // Wellness notifications
    this.socket.on(WSEventType.NOTIFICATION_MEDICATION, (data: unknown) => {
      this.emit(WSEventType.NOTIFICATION_MEDICATION, data);
      this.showNotification('Medication Reminder', data.payload.message, {
        icon: '💊',
        actions: [
          { _action: 'taken', title: 'Taken' },
          { _action: 'skip', title: 'Skip' },
          { _action: 'snooze', title: 'Remind in 15m' }
        ],
        requireInteraction: true
      });
    });

    this.socket.on(WSEventType.NOTIFICATION_WELLNESS, (_data: unknown) => {
      this.showNotification('Wellness Check-In', 'How are you feeling right now?', {
        icon: '🌈',
        actions: [
          { _action: 'great', title: '😄 Great' },
          { _action: 'good', title: '😊 Good' },
          { _action: 'okay', title: '😐 Okay' },
          { _action: 'low', title: '😔 Low' }
        ]
      });
    });

    this.socket.on(WSEventType.NOTIFICATION_ACHIEVEMENT, (data: unknown) => {
      this.showNotification('Achievement Unlocked!', data.title, {
        icon: data.icon || '🏆',
        _celebrationEffect: true,
        soundType: 'success',
        actions: [
          { _action: 'view', title: 'View Progress' },
          { _action: 'share', title: 'Share Achievement' }
        ]
      });
    });
  }

  // Presence event listeners
  private setupPresenceEventListeners(): void {
    if (!this.socket) return;

    this.socket.on(WSEventType.PRESENCE_UPDATE, (data: UserPresence) => {
      this.userPresences.set(data.userId, data);
      this.emit(WSEventType.PRESENCE_UPDATE, data);
    });

    this.socket.on(WSEventType.PRESENCE_MOOD_CHANGE, (data: unknown) => {
      const presence = this.userPresences.get(data.userId);
      if (presence) {
        presence.moodStatus = data.moodStatus;
        this.emit(WSEventType.PRESENCE_MOOD_CHANGE, data);
      }
    });
  }

  // Peer support event listeners
  private setupPeerSupportEventListeners(): void {
    if (!this.socket) return;

    this.socket.on(WSEventType.PEER_SUPPORT_REQUEST, (data: unknown) => {
      this.showNotification('Peer Support Request', 'Someone nearby needs support', {
        icon: '🤝',
        _priority: 'high',
        requireInteraction: true,
        actions: [
          { _action: 'accept', title: 'Offer Support' },
          { _action: 'refer', title: 'Refer Professional' }
        ]
      });
      this.emit(WSEventType.PEER_SUPPORT_REQUEST, data);
    });

    this.socket.on(WSEventType.PEER_SUPPORT_MATCHED, (data: unknown) => {
      const session = this.peerSupportSessions.get(data.sessionId);
      if (session) {
        session.status = 'matched';
        session.participants = data.participants;
      }
      this.emit(WSEventType.PEER_SUPPORT_MATCHED, data);
    });
  }

  // Therapist event listeners
  private setupTherapistEventListeners(): void {
    if (!this.socket) return;

    this.socket.on(WSEventType.THERAPIST_HOMEWORK_ASSIGNED, (data: unknown) => {
      this.showNotification('New Therapy Homework', `Your therapist assigned: ${data.title}`, {
        icon: '📚',
        actions: [
          { _action: 'view', title: 'View Assignment' },
          { _action: 'schedule', title: 'Schedule Time' }
        ]
      });
    });

    this.socket.on(WSEventType.THERAPIST_SESSION_START, (_data: unknown) => {
      this.showNotification('Therapy Session Starting', 'Your therapist is ready', {
        icon: '👨⚕️',
        _priority: 'high',
        requireInteraction: true,
        actions: [{ _action: 'join', title: 'Join Session' }]
      });
    });
  }

  // Group session event listeners
  private setupGroupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on(WSEventType.GROUP_SESSION_START, (data: unknown) => {
      this.showNotification('Group Session Starting', `${data.groupName} session is beginning`, {
        icon: '👥',
        actions: [{ _action: 'join', title: 'Join Now' }]
      });
      this.joinGroupSession(data.groupId, data.sessionId);
    });

    this.socket.on(WSEventType.GROUP_ACTIVITY_START, (data: unknown) => {
      this.showNotification('Group Activity', `${data.activityName} is starting in your group`, {
        icon: '🎯',
        actions: [{ _action: 'participate', title: 'Participate' }]
      });
    });
  }

  // Wellness event listeners
  private setupWellnessEventListeners(): void {
    if (!this.socket) return;

    this.socket.on(WSEventType.WELLNESS_MILESTONE, (data: unknown) => {
      this.showNotification('Wellness Milestone!', `You've reached ${data.milestone}!`, {
        icon: '🎉',
        _celebrationEffect: true,
        soundType: 'success'
      });
    });

    this.socket.on(WSEventType.MOOD_PATTERN_ALERT, (data: unknown) => {
      this.showNotification('Mood Pattern Insight', data.insight, {
        icon: '📈',
        actions: [
          { _action: 'view-insights', title: 'View Insights' },
          { _action: 'adjust-goals', title: 'Adjust Goals' }
        ]
      });
    });

    this.socket.on(WSEventType.HABIT_STREAK_UPDATE, (data: unknown) => {
      this.showNotification(`${data.habitName} Streak!`, `${data.streakCount} days strong! 🔥`, {
        icon: '🔥',
        soundType: 'success'
      });
    });
  }

  // Enhanced notification handling
  private showNotification(title: string, message: string, options: NotificationOptions = {}): void {
    const { icon = '🔔', _priority = 'normal', actions = [], requireInteraction = false, _celebrationEffect = false, soundType = 'gentle', vibrationPattern } = options;

    if (!this.shouldShowNotification(_priority)) return;

    const notificationId = `notification-${Date.now()}`;
    const notificationData = {
      id: notificationId,
      title,
      message,
      timestamp: new Date(),
      _priority,
      actions,
      isRead: false,
      category: this.categorizeNotification(title, message)
    };

    this.activeNotifications.set(notificationId, notificationData as unknown);
    this.saveNotificationHistory(_notificationData);

    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(title, {
        body: message,
        icon: this.getNotificationIcon(icon),
        badge: '/icon-72x72.png',
        tag: notificationId,
        requireInteraction: requireInteraction || _priority === 'critical',
        silent: _priority === 'low' || soundType === 'none',
        data: { notificationId, category: notificationData.category }
      });

      browserNotification.onclick = (event) => {
        this.handleNotificationClick(notificationId, 'click', event);
      };

      const autoCloseDelay = this.getAutoCloseDelay(_priority);
      if (autoCloseDelay > 0) {
        setTimeout(() => {
          browserNotification.close();
          this.markNotificationAsRead(_notificationId);
        }, autoCloseDelay);
      }
    }

    if (_celebrationEffect) {
      this.triggerCelebrationEffect();
    }

    if (vibrationPattern && 'vibrate' in navigator) {
      navigator.vibrate(_vibrationPattern);
    } else {
      const defaultPattern = this.getVibrationPattern(_priority);
      if (defaultPattern && 'vibrate' in navigator) {
        navigator.vibrate(_defaultPattern);
      }
    }

    this.playNotificationSound(_soundType);
    this.emit('notification:new', notificationData);
  }

  // Helper methods for notification system
  private shouldShowNotification(_priority: string): boolean {
    if (this.notificationPermission !== 'granted') return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const quietStart = 22 * 60;
    const quietEnd = 7 * 60;

    const isQuietHours = currentTime >= quietStart || currentTime <= quietEnd;
    if (isQuietHours && _priority !== 'critical') {
      this.queueNotificationForLater({ _priority } as unknown);
      return false;
    }

    return true;
  }

  private categorizeNotification(title: string, _message: string): string {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('crisis') || lowerTitle.includes('emergency')) return 'crisis';
    if (lowerTitle.includes('medication') || lowerTitle.includes('pill')) return 'medication';
    if (lowerTitle.includes('appointment') || lowerTitle.includes('therapy')) return 'healthcare';
    if (lowerTitle.includes('mood') || lowerTitle.includes('feeling')) return 'wellness';
    if (lowerTitle.includes('community') || lowerTitle.includes('post')) return 'social';
    if (lowerTitle.includes('achievement') || lowerTitle.includes('goal')) return 'progress';
    return 'general';
  }

  private getNotificationIcon(icon: string): string {
    const iconMap: Record<string, string> = {
      '💊': '/icons/medication.png',
      '📅': '/icons/calendar.png',
      '🫂': '/icons/support.png',
      '💬': '/icons/community.png',
      '🏆': '/icons/achievement.png',
      '🌈': '/icons/mood.png',
      '🚨': '/icons/crisis.png',
    };
    return iconMap[icon] || '/icon-192x192.png';
  }

  private getAutoCloseDelay(_priority: string): number {
    switch (_priority) {
      case 'low': return 3000;
      case 'normal': return 5000;
      case 'high': return 10000;
      case 'critical': return 0;
      default: return 5000;
    }
  }

  private getVibrationPattern(_priority: string): number[] | null {
    switch (_priority) {
      case 'low': return [100];
      case 'normal': return [200, 100, 200];
      case 'high': return [300, 100, 300, 100, 300];
      case 'critical': return [500, 200, 500, 200, 500, 200, 500];
      default: return null;
    }
  }

  private playNotificationSound(soundType: string): void {
    logger.debug(`Playing _notification sound: ${soundType}`, 'EnhancedWebSocket');
  }

  private triggerCelebrationEffect(): void {
    this.emit('_notification:celebration', { type: 'achievement' });
  }

  private handleNotificationClick(notificationId: string, _action: string, _event: unknown): void {
    const _notification = this.activeNotifications.get(_notificationId);
    if (!_notification) return;

    this.markNotificationAsRead(_notificationId);

    switch (_action) {
      case 'click':
        window.focus();
        this.emit('_notification:clicked', { notificationId, _notification });
        break;
      case 'taken':
        this.emit('medication:taken', { notificationId, timestamp: new Date() });
        break;
      case 'support':
        this.emit('support:requested', { notificationId, urgency: (_notification as unknown)._priority });
        break;
    }
  }

  private markNotificationAsRead(notificationId: string): void {
    const _notification = this.activeNotifications.get(_notificationId);
    if (_notification) {
      (_notification as unknown).isRead = true;
      this.emit('_notification:read', { notificationId });
    }
  }

  private queueNotificationForLater(_notification: Notification): void {
    this.notificationQueue.push(_notification);
  }

  private saveNotificationHistory(_notification: unknown): void {
    try {
      const history = JSON.parse(secureStorage.getItem('notification_history') || '[]');
      history.push(_notification);
      
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }
      
      secureStorage.setItem('notification_history', JSON.stringify(_history));
    } catch {
      logger.error('Failed to save _notification to history:');
    }
  }

  // Core WebSocket functionality
  private processQueuedNotifications(): void {
    const queuedNotifications = [...this.notificationQueue];
    this.notificationQueue = [];
    
    queuedNotifications.forEach(_notification => {
      if (this.shouldShowNotification((_notification as unknown)._priority)) {
        this.showNotification(
          (_notification as unknown).title,
          (_notification as unknown).body,
          { _priority: (_notification as unknown)._priority }
        );
      }
    });
  }

  // Heartbeat for connection monitoring
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        const start = Date.now();
        this.socket.emit('ping', null, () => {
          this.connectionState.latency = Date.now() - start;
        });
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Message queue management
  private queueMessage(event: string, data: unknown): void {
    const _queuedMessage: QueuedMessage = {
      event,
      data,
      timestamp: Date.now(),
      retries: 0
    };

    this.messageQueue.push(_queuedMessage);
    this.connectionState.messagesQueued = this.messageQueue.length;
    this.saveQueuedMessages();
  }

  private async processQueuedMessages(): Promise<void> {
    if (!this.socket?.connected || this.messageQueue.length === 0) return;

    const messages = [...this.messageQueue];
    this.messageQueue = [];

    for (const message of messages) {
      try {
        this.socket.emit(message.event, message.data);
        this.connectionState.lastSuccessfulMessage = new Date();
      } catch {
        logger.error('Failed to send queued message:');
        
        if (Date.now() - message.timestamp < 86400000 && message.retries < 3) {
          message.retries++;
          this.messageQueue.push(message);
        }
      }
    }

    this.connectionState.messagesQueued = this.messageQueue.length;
    this.saveQueuedMessages();
  }

  private saveQueuedMessages(): void {
    try {
      secureStorage.setItem('ws_message_queue', JSON.stringify(this.messageQueue));
    } catch {
      logger.error('Failed to save message queue:');
    }
  }

  private loadQueuedMessages(): void {
    try {
      const _saved = secureStorage.getItem('ws_message_queue');
      if (_saved) {
        this.messageQueue = JSON.parse(_saved);
        this.connectionState.messagesQueued = this.messageQueue.length;
      }
    } catch {
      logger.error('Failed to load message queue:');
      this.messageQueue = [];
    }
  }

  // Room management
  public joinRoom(_room: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join:_room', { _room });
      this.activeRooms.add(_room);
    }
  }

  public leaveRoom(_room: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave:_room', { _room });
      this.activeRooms.delete(_room);
    }
  }

  // Crisis session management
  public joinCrisisSession(sessionId: string): void {
    const _room = `crisis:${sessionId}`;
    this.joinRoom(_room);
    this.emit('crisis:joined', { sessionId });
  }

  public escalateCrisisAlert(sessionId: string, escalationLevel: 'professional' | 'emergency' | 'immediate'): void {
    const escalationData = {
      sessionId,
      escalationLevel,
      timestamp: new Date(),
      userId: this.currentUser?.id,
      context: 'user_initiated_escalation'
    };
    
    if (this.socket?.connected) {
      this.socket.emit('crisis:escalate', escalationData);
    }
    
    this.realTimeAnalytics.crisisAlertsHandled++;
    this.logCriticalEvent('crisis_escalation_initiated', escalationData);
    
    this.showNotification('Crisis Support Activated', 'Professional help is being contacted', {
      icon: '🚨',
      _priority: 'critical',
      requireInteraction: true,
      actions: [
        { _action: 'emergency', title: 'Call Emergency' },
        { _action: 'chat', title: 'Crisis Chat' }
      ]
    });
    
    this.emit('crisis:escalated', escalationData);
  }

  // Peer support session management
  public initiatePeerSupportSession(supportType: 'crisis' | 'general' | 'specific', metadata?: unknown): void {
    const sessionId = `peer-support-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const session: PeerSupportSession = {
      id: sessionId,
      type: supportType,
      startTime: new Date(),
      participants: [this.currentUser?.id || 'anonymous'],
      status: 'seeking-support',
      metadata
    };
    
    this.peerSupportSessions.set(sessionId, session);
    
    if (this.socket?.connected) {
      this.socket.emit('peer_support:initiate', {
        sessionId,
        supportType,
        userProfile: {
          preferredSupport: supportType,
          experience: metadata?.experience || 'beginner',
          topics: metadata?.topics || []
        }
      });
    }
    
    this.realTimeAnalytics.supportSessionsInitiated++;
    this.emit('peer_support:session_initiated', { sessionId, session });
  }

  // Real-time presence management
  public updateUserPresence(presence: Partial<UserPresence>): void {
    if (!this.currentUser) return;
    
    const currentPresence = this.userPresences.get(this.currentUser.id) || {
      userId: this.currentUser.id,
      username: this.currentUser.username || 'Anonymous',
      status: 'online',
      lastSeen: new Date()
    };
    
    const updatedPresence = { ...currentPresence, ...presence, lastSeen: new Date() };
    this.userPresences.set(this.currentUser.id, updatedPresence);
    
    if (this.socket?.connected) {
      this.socket.emit('presence:update', updatedPresence);
    }
    
    this.emit('presence:updated', updatedPresence);
  }

  // Group session management
  public joinGroupSession(groupId: string, sessionId: string): void {
    const _room = `group:${groupId}:${sessionId}`;
    this.joinRoom(_room);
  }

  // Event emitter methods
  public on(event: string, handler: (...args: unknown[]) => any): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  public off(event: string, handler: (...args: unknown[]) => any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  public emit(event: string, data: unknown): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch {
          logger.error(`Error in event handler for ${event}`);
        }
      });
    }
  }

  // Utility methods
  public getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public getRealTimeAnalytics(): typeof this.realTimeAnalytics {
    return { ...this.realTimeAnalytics };
  }

  // Crisis escalation handling
  private handleCrisisEscalation(event: unknown): void {
    logger.error('CRISIS ESCALATION:', event);
    
    this.showNotification(
      'Emergency Alert',
      'Crisis situation requires immediate attention',
      {
        icon: '🚨',
        _priority: 'critical',
        requireInteraction: true
      }
    );

    this.emit('crisis:escalation:local', event);
    this.logCriticalEvent('crisis_escalation', event);
  }

  // Critical event logging
  private logCriticalEvent(type: string, data: unknown): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      userId: this.currentUser?.id,
      data: JSON.stringify(data)
    };

    logger.crisis('Critical Event Log', 'high', 'EnhancedWebSocket', logEntry);
    
    try {
      const logs = JSON.parse(secureStorage.getItem('critical_events') || '[]');
      logs.push(_logEntry);
      
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      secureStorage.setItem('critical_events', JSON.stringify(_logs));
    } catch {
      logger.error('Failed to log critical event:');
    }
  }
}

// Export singleton instance
export const __enhancedWsService = EnhancedWebSocketService.getInstance();