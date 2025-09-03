// WebSocket Service for Real-time Features
// Implements secure, HIPAA-compliant real-time communication

import { io, Socket } from 'socket.io-client';
import {
  _WebSocketEvent,
  CrisisWebSocketEvent,
  CommunityWebSocketEvent,
  NotificationWebSocketEvent,
  Message,
  User
} from '../api/types';
import { secureStorage } from '../security/SecureLocalStorage';
import { logger } from '../../utils/logger';

// WebSocket Configuration
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
  }
};

// WebSocket Event Types
export enum WSEventType {
  // Connection Events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  RECONNECT = 'reconnect',
  ERROR = 'error',
  
  // Authentication Events
  AUTH_SUCCESS = 'auth:success',
  AUTH_FAILURE = 'auth:failure',
  
  // Crisis Events
  CRISIS_ALERT = 'crisis:alert',
  CRISIS_COUNSELOR_ASSIGNED = 'crisis:counselor_assigned',
  CRISIS_MESSAGE = 'crisis:message',
  CRISIS_SESSION_ENDED = 'crisis:session_ended',
  CRISIS_ESCALATION = 'crisis:escalation',
  CRISIS_TYPING = 'crisis:typing',
  
  // Community Events
  COMMUNITY_POST_NEW = 'community:post_new',
  COMMUNITY_COMMENT_NEW = 'community:comment_new',
  COMMUNITY_USER_TYPING = 'community:user_typing',
  COMMUNITY_USER_ONLINE = 'community:user_online',
  COMMUNITY_USER_OFFLINE = 'community:user_offline',
  
  // Notification Events
  NOTIFICATION_APPOINTMENT = 'notification:appointment',
  NOTIFICATION_MEDICATION = 'notification:medication',
  NOTIFICATION_CRISIS_CHECK = 'notification:crisis_check',
  NOTIFICATION_SYSTEM = 'notification:system',
  
  // Presence Events
  PRESENCE_UPDATE = 'presence:update',
  PRESENCE_REQUEST = 'presence:request',
  
  // Therapist Events
  THERAPIST_AVAILABLE = 'therapist:available',
  THERAPIST_BUSY = 'therapist:busy',
  THERAPIST_MESSAGE = 'therapist:message',
  
  // Group Session Events
  GROUP_SESSION_START = 'group:session_start',
  GROUP_SESSION_END = 'group:session_end',
  GROUP_USER_JOIN = 'group:user_join',
  GROUP_USER_LEAVE = 'group:user_leave',
  GROUP_MESSAGE = 'group:message'
}

// Typing indicator management
interface TypingUser {
  userId: string;
  username: string;
  timestamp: number;
}

// Connection state management
interface ConnectionState {
  isConnected: boolean;
  reconnectAttempts: number;
  lastError?: Error;
  latency: number;
}

// Message queue for offline support
interface QueuedMessage {
  event: string;
  data: unknown;
  timestamp: number;
  retries: number;
}

// WebSocket Service Class
export class WebSocketService {
  private static instance: WebSocketService;
  private socket: Socket | null = null;
  private connectionState: ConnectionState = {
    isConnected: false,
    reconnectAttempts: 0,
    latency: 0
  };
  private eventHandlers: Map<string, Set<Function>> = new Map();
  private typingUsers: Map<string, TypingUser> = new Map();
  private messageQueue: QueuedMessage[] = [];
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private currentUser: User | null = null;
  private activeRooms: Set<string> = new Set();

  private constructor() {
    this.loadQueuedMessages();
  }

  // Singleton pattern
  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  // Initialize WebSocket connection
  public connect(token: string, user: User): void {
    if (this.socket?.connected) {
      logger.debug('WebSocket already connected', 'WebSocketService');
      return;
    }

    this.currentUser = user;
    WS_CONFIG.auth.token = token;

    // Create socket connection
    this.socket = io(WS_CONFIG.url, {
      ...WS_CONFIG,
      auth: WS_CONFIG.auth
    });

    this.setupEventListeners();
    this.startHeartbeat();
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
    }
  }

  // Setup core event listeners
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on(WSEventType.CONNECT, () => {
      logger.info('WebSocket connected', 'WebSocketService');
      this.connectionState.isConnected = true;
      this.connectionState.reconnectAttempts = 0;
      this.processQueuedMessages();
      this.emit(WSEventType.CONNECT, { timestamp: new Date() });
      
      // Rejoin rooms after reconnection
      this.activeRooms.forEach(_room => {
        this.joinRoom(_room);
      });
    });

    this.socket.on(WSEventType.DISCONNECT, (reason: unknown) => {
      logger.info('WebSocket disconnected', 'WebSocketService', { reason });
      this.connectionState.isConnected = false;
      this.emit(WSEventType.DISCONNECT, { reason, timestamp: new Date() });
    });

    this.socket.on(WSEventType.ERROR, (error: unknown) => {
      logger.error('WebSocket error:', error);
      this.connectionState.lastError = error;
      this.emit(WSEventType.ERROR, { error, timestamp: new Date() });
    });

    // Authentication events
    this.socket.on(WSEventType.AUTH_SUCCESS, (data: unknown) => {
      logger.info('WebSocket authentication successful', 'WebSocketService');
      this.emit(WSEventType.AUTH_SUCCESS, data);
    });

    this.socket.on(WSEventType.AUTH_FAILURE, (data: unknown) => {
      logger.error('WebSocket authentication failed:', data);
      this.emit(WSEventType.AUTH_FAILURE, data);
      this.disconnect();
    });

    // Setup all event type listeners
    this.setupCrisisEventListeners();
    this.setupCommunityEventListeners();
    this.setupNotificationEventListeners();
    this.setupPresenceEventListeners();
    this.setupTherapistEventListeners();
    this.setupGroupEventListeners();
  }

  // Crisis event listeners
  private setupCrisisEventListeners(): void {
    if (!this.socket) return;

    this.socket.on(WSEventType.CRISIS_ALERT, (data: CrisisWebSocketEvent) => {
      logger.crisis('Crisis alert received', 'high', 'WebSocketService', data);
      this.emit(WSEventType.CRISIS_ALERT, data);
      
      // Auto-join crisis _room if it's for current user
      if (data.userId === this.currentUser?.id) {
        this.joinCrisisSession(data.sessionId);
      }
    });

    this.socket.on(WSEventType.CRISIS_COUNSELOR_ASSIGNED, (data: CrisisWebSocketEvent) => {
      logger.crisis('Counselor assigned to crisis session', 'medium', 'WebSocketService', data);
      this.emit(WSEventType.CRISIS_COUNSELOR_ASSIGNED, data);
    });

    this.socket.on(WSEventType.CRISIS_MESSAGE, (data: CrisisWebSocketEvent) => {
      this.emit(WSEventType.CRISIS_MESSAGE, data);
    });

    this.socket.on(WSEventType.CRISIS_SESSION_ENDED, (data: CrisisWebSocketEvent) => {
      logger.info('Crisis session ended', 'WebSocketService', data);
      this.emit(WSEventType.CRISIS_SESSION_ENDED, data);
      this.leaveCrisisSession(data.sessionId);
    });

    this.socket.on(WSEventType.CRISIS_ESCALATION, (data: CrisisWebSocketEvent) => {
      logger.crisis('Crisis escalated', 'critical', 'WebSocketService', data);
      this.emit(WSEventType.CRISIS_ESCALATION, data);
      
      // Trigger emergency protocols
      this.handleCrisisEscalation(data);
    });

    this.socket.on(WSEventType.CRISIS_TYPING, (data: { sessionId: string; userId: string; isTyping: boolean }) => {
      this.handleTypingIndicator(data.sessionId, data.userId, data.isTyping);
    });
  }

  // Community event listeners
  private setupCommunityEventListeners(): void {
    if (!this.socket) return;

    this.socket.on(WSEventType.COMMUNITY_POST_NEW, (data: CommunityWebSocketEvent) => {
      this.emit(WSEventType.COMMUNITY_POST_NEW, data);
    });

    this.socket.on(WSEventType.COMMUNITY_COMMENT_NEW, (data: CommunityWebSocketEvent) => {
      this.emit(WSEventType.COMMUNITY_COMMENT_NEW, data);
    });

    this.socket.on(WSEventType.COMMUNITY_USER_TYPING, (data: { groupId: string; user: TypingUser }) => {
      this.handleTypingIndicator(data.groupId, data.user.userId, true, data.user.username);
    });

    this.socket.on(WSEventType.COMMUNITY_USER_ONLINE, (data: CommunityWebSocketEvent) => {
      this.emit(WSEventType.COMMUNITY_USER_ONLINE, data);
    });

    this.socket.on(WSEventType.COMMUNITY_USER_OFFLINE, (data: CommunityWebSocketEvent) => {
      this.emit(WSEventType.COMMUNITY_USER_OFFLINE, data);
    });
  }

  // Notification event listeners
  private setupNotificationEventListeners(): void {
    if (!this.socket) return;

    this.socket.on(WSEventType.NOTIFICATION_APPOINTMENT, (data: NotificationWebSocketEvent) => {
      this.emit(WSEventType.NOTIFICATION_APPOINTMENT, data);
      this.showNotification('Appointment Reminder', data.payload.message);
    });

    this.socket.on(WSEventType.NOTIFICATION_MEDICATION, (data: NotificationWebSocketEvent) => {
      this.emit(WSEventType.NOTIFICATION_MEDICATION, data);
      this.showNotification('Medication Reminder', data.payload.message);
    });

    this.socket.on(WSEventType.NOTIFICATION_CRISIS_CHECK, (data: NotificationWebSocketEvent) => {
      this.emit(WSEventType.NOTIFICATION_CRISIS_CHECK, data);
      this.showNotification('Wellness Check-In', data.payload.message);
    });

    this.socket.on(WSEventType.NOTIFICATION_SYSTEM, (data: NotificationWebSocketEvent) => {
      this.emit(WSEventType.NOTIFICATION_SYSTEM, data);
      if (data.priority === 'critical') {
        this.showNotification('System Alert', data.payload.message, 'critical');
      }
    });
  }

  // Presence event listeners
  private setupPresenceEventListeners(): void {
    if (!this.socket) return;

    this.socket.on(WSEventType.PRESENCE_UPDATE, (data: { userId: string; status: string; lastSeen: Date }) => {
      this.emit(WSEventType.PRESENCE_UPDATE, data);
    });
  }

  // Therapist event listeners
  private setupTherapistEventListeners(): void {
    if (!this.socket) return;

    this.socket.on(WSEventType.THERAPIST_AVAILABLE, (data: { therapistId: string; available: boolean }) => {
      this.emit(WSEventType.THERAPIST_AVAILABLE, data);
    });

    this.socket.on(WSEventType.THERAPIST_MESSAGE, (data: { therapistId: string; message: Message }) => {
      this.emit(WSEventType.THERAPIST_MESSAGE, data);
    });
  }

  // Group session event listeners
  private setupGroupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on(WSEventType.GROUP_SESSION_START, (data: { groupId: string; sessionId: string }) => {
      this.emit(WSEventType.GROUP_SESSION_START, data);
      this.joinGroupSession(data.groupId, data.sessionId);
    });

    this.socket.on(WSEventType.GROUP_SESSION_END, (data: { groupId: string; sessionId: string }) => {
      this.emit(WSEventType.GROUP_SESSION_END, data);
      this.leaveGroupSession(data.groupId, data.sessionId);
    });

    this.socket.on(WSEventType.GROUP_MESSAGE, (data: { groupId: string; message: Message }) => {
      this.emit(WSEventType.GROUP_MESSAGE, data);
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
    }, 30000); // Every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
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

  public leaveCrisisSession(sessionId: string): void {
    const _room = `crisis:${sessionId}`;
    this.leaveRoom(_room);
    this.typingUsers.delete(_room);
  }

  public sendCrisisMessage(sessionId: string, message: string): void {
    const event = {
      type: WSEventType.CRISIS_MESSAGE,
      sessionId,
      payload: {
        content: message,
        timestamp: new Date(),
        senderId: this.currentUser?.id
      }
    };

    if (this.socket?.connected) {
      this.socket.emit(WSEventType.CRISIS_MESSAGE, event);
    } else {
      this.queueMessage(WSEventType.CRISIS_MESSAGE, event);
    }
  }

  // Group session management
  public joinGroupSession(groupId: string, sessionId: string): void {
    const _room = `group:${groupId}:${sessionId}`;
    this.joinRoom(_room);
  }

  public leaveGroupSession(groupId: string, sessionId: string): void {
    const _room = `group:${groupId}:${sessionId}`;
    this.leaveRoom(_room);
  }

  // Typing indicators
  public sendTypingIndicator(_room: string, isTyping: boolean): void {
    if (this.socket?.connected) {
      this.socket.emit('typing', {
        _room,
        userId: this.currentUser?.id,
        username: this.currentUser?.username,
        isTyping
      });
    }
  }

  private handleTypingIndicator(_room: string, userId: string, isTyping: boolean, username?: string): void {
    if (isTyping && userId !== this.currentUser?.id) {
      this.typingUsers.set(`${_room}:${userId}`, {
        userId,
        username: username || 'User',
        timestamp: Date.now()
      });
    } else {
      this.typingUsers.delete(`${_room}:${userId}`);
    }

    // Clean up old typing indicators (> 5 seconds)
    const now = Date.now();
    this.typingUsers.forEach((user, key) => {
      if (now - user.timestamp > 5000) {
        this.typingUsers.delete(key);
      }
    });

    this.emit('typing:update', {
      _room,
      typingUsers: Array.from(this.typingUsers.values()).filter(u => 
        u.userId !== this.currentUser?.id
      )
    });
  }

  // Crisis escalation handling
  private handleCrisisEscalation(event: CrisisWebSocketEvent): void {
    // Trigger emergency protocols
    logger.error('CRISIS ESCALATION:', event);
    
    // Show critical notification
    this.showNotification(
      'Emergency Alert',
      'Crisis situation requires immediate attention',
      'critical'
    );

    // Emit escalation event for UI handling
    this.emit('crisis:escalation:local', event);

    // Log for audit trail
    this.logCriticalEvent('crisis_escalation', event);
  }

  // Message queue management for offline support
  private queueMessage(event: string, data: unknown): void {
    const _queuedMessage: QueuedMessage = {
      event,
      data,
      timestamp: Date.now(),
      retries: 0
    };

    this.messageQueue.push(_queuedMessage);
    this.saveQueuedMessages();
  }

  private async processQueuedMessages(): Promise<void> {
    if (!this.socket?.connected || this.messageQueue.length === 0) return;

    const messages = [...this.messageQueue];
    this.messageQueue = [];

    for (const message of messages) {
      try {
        this.socket.emit(message.event, message.data);
      } catch (error) {
        logger.error('Failed to send queued message:');
        
        // Re-queue if not expired (24 hours) and under retry limit
        if (Date.now() - message.timestamp < 86400000 && message.retries < 3) {
          message.retries++;
          this.messageQueue.push(message);
        }
      }
    }

    this.saveQueuedMessages();
  }

  private saveQueuedMessages(): void {
    try {
      secureStorage.setItem('ws_message_queue', JSON.stringify(this.messageQueue));
    } catch (error) {
      logger.error('Failed to save message queue:');
    }
  }

  private loadQueuedMessages(): void {
    try {
      const _saved = secureStorage.getItem('ws_message_queue');
      if (_saved) {
        this.messageQueue = JSON.parse(_saved);
      }
    } catch (error) {
      logger.error('Failed to load message queue:');
      this.messageQueue = [];
    }
  }

  // Notification handling
  private showNotification(title: string, message: string, priority: string = 'normal'): void {
    // Check if browser supports notifications
    if (!('Notification' in window)) return;

    // Request permission if needed
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Show notification if permitted
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: message,
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: `${priority}-${Date.now()}`,
        requireInteraction: priority === 'critical',
        silent: priority === 'low'
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close non-critical notifications
      if (priority !== 'critical') {
        setTimeout(() => notification.close(), 5000);
      }
    }
  }

  // Event emitter methods
  public on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  public off(event: string, handler: Function): void {
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
        } catch (error) {
          logger.error(`Error in event handler for ${event}`);
        }
      });
    }
  }

  // Utility methods
  public getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  public getTypingUsers(_room: string): TypingUser[] {
    const users: TypingUser[] = [];
    this.typingUsers.forEach((user, key) => {
      if (key.startsWith(`${_room}:`)) {
        users.push(_user);
      }
    });
    return users;
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public getLatency(): number {
    return this.connectionState.latency;
  }

  // Critical event logging for audit trail
  private logCriticalEvent(type: string, data: unknown): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      userId: this.currentUser?.id,
      data: JSON.stringify(data)
    };

    // In production, send to secure logging service
    logger.crisis('Critical Event Log', 'high', 'WebSocketService', logEntry);
    
    // Also store locally for offline access
    try {
      const logs = JSON.parse(secureStorage.getItem('critical_events') || '[]');
      logs.push(_logEntry);
      
      // Keep only last 100 events
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      secureStorage.setItem('critical_events', JSON.stringify(_logs));
    } catch (error) {
      logger.error('Failed to log critical event:');
    }
  }
}

// Export singleton instance
export const _wsService = WebSocketService.getInstance();