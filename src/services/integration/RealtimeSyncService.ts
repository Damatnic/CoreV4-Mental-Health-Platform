/**
 * Real-time Synchronization Service
 * Manages WebSocket connections and real-time data updates across components
 */

import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';
import { useWellnessStore } from '../../stores/wellnessStore';
import { useActivityStore } from '../../stores/activityStore';
import { logger } from '../utils/logger';

// Real-time event types
export enum RealtimeEvent {
  // Connection events
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
  
  // Crisis events
  CRISIS_ALERT_RECEIVED = 'crisis:alert:received',
  CRISIS_SUPPORT_CONNECTED = 'crisis:support:connected',
  CRISIS_MESSAGE_RECEIVED = 'crisis:message:received',
  CRISIS_STATUS_UPDATED = 'crisis:status:updated',
  
  // Community events
  COMMUNITY_POST_CREATED = 'community:post:created',
  COMMUNITY_COMMENT_ADDED = 'community:comment:added',
  COMMUNITY_USER_JOINED = 'community:user:joined',
  COMMUNITY_USER_LEFT = 'community:user:left',
  COMMUNITY_TYPING = 'community:typing',
  
  // Professional care events
  THERAPIST_AVAILABLE = 'therapist:available',
  APPOINTMENT_REMINDER = 'appointment:reminder',
  PRESCRIPTION_UPDATE = 'prescription:update',
  CARE_TEAM_MESSAGE = 'care:team:message',
  
  // Wellness tracking events
  MOOD_CHECK_REMINDER = 'mood:check:reminder',
  GOAL_MILESTONE_REACHED = 'goal:milestone:reached',
  WELLNESS_INSIGHT = 'wellness:insight',
  
  // Notification events
  NOTIFICATION_RECEIVED = 'notification:received',
  NOTIFICATION_READ = 'notification:read',
  NOTIFICATION_CLEARED = 'notification:cleared'
}

// Message types
interface RealtimeMessage {
  id: string;
  _type: string;
  _payload: unknown;
  timestamp: Date;
  _userId?: string;
  metadata?: Record<string, any>;
}

// Subscription configuration
interface SubscriptionConfig {
  channel: string;
  events: string[];
  handler: (data: unknown) => void;
  filter?: (data: unknown) => boolean;
}

// Connection configuration
interface ConnectionConfig {
  url: string;
  reconnection: boolean;
  reconnectionAttempts: number;
  reconnectionDelay: number;
  _timeout: number;
  _auth?: {
    token: string;
    _userId: string;
  };
}

// Presence information
interface UserPresence {
  _userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
  location?: string;
  activity?: string;
}

class RealtimeSyncService extends EventEmitter {
  private static instance: RealtimeSyncService;
  private socket: Socket | null = null;
  private config: ConnectionConfig;
  private subscriptions: Map<string, SubscriptionConfig> = new Map();
  private messageQueue: RealtimeMessage[] = [];
  private _presence: Map<string, UserPresence> = new Map();
  private reconnectAttempts = 0;
  private isConnected = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  
  private constructor() {
    super();
    
    this.config = {
      url: import.meta.env.VITE_WS_URL || 'ws://localhost:3002',
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      _timeout: 20000
    };
    
    this.setupDefaultSubscriptions();
  }
  
  public static getInstance(): RealtimeSyncService {
    if (!RealtimeSyncService.instance) {
      RealtimeSyncService.instance = new RealtimeSyncService();
    }
    return RealtimeSyncService.instance;
  }
  
  /**
   * Connect to WebSocket server
   */
  public async connect(_auth?: { token: string; _userId: string }): Promise<void> {
    if (this.isConnected) return;
    
    return new Promise((resolve, reject) => {
      try {
        this.config._auth = _auth;
        
        this.socket = io(this.config.url, {
          reconnection: this.config.reconnection,
          reconnectionAttempts: this.config.reconnectionAttempts,
          reconnectionDelay: this.config.reconnectionDelay,
          _timeout: this.config._timeout,
          _auth: _auth || {}
        });
        
        this.setupSocketListeners();
        
        // Set connection timeout
        const _timeout = setTimeout(() => {
          reject(new Error('Connection _timeout'));
        }, this.config.timeout);
        
        this.socket.once('connect', () => {
          clearTimeout(_timeout);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit(RealtimeEvent.CONNECTED);
          this.startHeartbeat();
          this.flushMessageQueue();
          resolve();
        });
        
        this.socket.once('connecterror', (error: unknown) => {
          clearTimeout(_timeout);
          this.emit(RealtimeEvent.ERROR, error);
          reject(error);
        });
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Setup default subscriptions
   */
  private setupDefaultSubscriptions() {
    // Crisis channel subscription
    this.subscribe({
      channel: 'crisis',
      events: ['alert', 'support_connected', 'message', 'status_update'],
      handler: (_data) => this.handleCrisisUpdate(data)
    });
    
    // Community channel subscription
    this.subscribe({
      channel: 'community',
      events: ['post_created', 'comment_added', 'user_joined', 'user_left', 'typing'],
      handler: (_data) => this.handleCommunityUpdate(data)
    });
    
    // Professional care channel subscription
    this.subscribe({
      channel: 'professional',
      events: ['therapist_available', 'appointment_reminder', 'prescription_update', 'care_teammessage'],
      handler: (_data) => this.handleProfessionalUpdate(data)
    });
    
    // Wellness channel subscription
    this.subscribe({
      channel: 'wellness',
      events: ['mood_check_reminder', 'goal_milestone', 'insight'],
      handler: (_data) => this.handleWellnessUpdate(data)
    });
    
    // Notifications channel subscription
    this.subscribe({
      channel: 'notifications',
      events: ['received', 'read', 'cleared'],
      handler: (_data) => this.handleNotificationUpdate(data)
    });
  }
  
  /**
   * Setup socket event listeners
   */
  private setupSocketListeners() {
    if (!this.socket) return;
    
    // Connection events
    this.socket.on('disconnect', () => {
      this.isConnected = false;
      this.stopHeartbeat();
      this.emit(RealtimeEvent.DISCONNECTED);
    });
    
    this.socket.on('reconnect', (attempt: number) => {
      this.reconnectAttempts = attempt;
      this.isConnected = true;
      this.emit(RealtimeEvent.RECONNECTING, attempt);
      this.startHeartbeat();
      this.flushMessageQueue();
    });
    
    this.socket.on('error', (error: Error) => {
      this.emit(RealtimeEvent.ERROR, error);
    });
    
    // Message handling
    this.socket.on('message', (message: RealtimeMessage) => {
      this.handleMessage(message);
    });
    
    // Presence updates
    this.socket.on('presence:update', (_presence: UserPresence) => {
      this.updatePresence(_presence);
    });
    
    // Subscribe to configured channels
    this.subscriptions.forEach((_config, _key) => {
      config.events.forEach(event => {
        const _eventName = `${config.channel}:${event}`;
        this.socket!.on(_eventName, (data: unknown) => {
          if (!config.filter || config.filter(data)) {
            config.handler(data);
          }
        });
      });
    });
  }
  
  /**
   * Handle incoming messages
   */
  private handleMessage(message: RealtimeMessage) {
    // Process message based on _type
    switch (message._type) {
      case 'crisis':
        this.handleCrisisMessage(message);
        break;
      case 'community':
        this.handleCommunityMessage(message);
        break;
      case 'professional':
        this.handleProfessionalMessage(message);
        break;
      case 'wellness':
        this.handleWellnessMessage(message);
        break;
      case 'notification':
        this.handleNotificationMessage(message);
        break;
      default:
        logger.warn('Unknown message _type:', message._type);
    }
    
    // Emit generic message event
    this.emit('message', message);
  }
  
  /**
   * Handle crisis updates
   */
  private handleCrisisUpdate(data: unknown) {
    const { _type, _payload } = data;
    
    switch (_type) {
      case 'alert':
        this.emit(RealtimeEvent.CRISIS_ALERT_RECEIVED, _payload);
        // Update wellness store with crisis event
        useWellnessStore.getState().recordCrisisEvent(_payload);
        break;
        
      case 'support_connected':
        this.emit(RealtimeEvent.CRISIS_SUPPORT_CONNECTED, _payload);
        break;
        
      case 'message':
        this.emit(RealtimeEvent.CRISIS_MESSAGE_RECEIVED, _payload);
        break;
        
      case 'status_update':
        this.emit(RealtimeEvent.CRISIS_STATUS_UPDATED, _payload);
        break;
    }
  }
  
  /**
   * Handle community updates
   */
  private handleCommunityUpdate(data: unknown) {
    const { _type, _payload } = data;
    
    switch (_type) {
      case 'post_created':
        this.emit(RealtimeEvent.COMMUNITY_POST_CREATED, _payload);
        break;
        
      case 'comment_added':
        this.emit(RealtimeEvent.COMMUNITY_COMMENT_ADDED, _payload);
        break;
        
      case 'user_joined':
        this.emit(RealtimeEvent.COMMUNITY_USER_JOINED, _payload);
        this.updatePresence({
          _userId: _payload._userId,
          status: 'online',
          lastSeen: new Date()
        });
        break;
        
      case 'user_left':
        this.emit(RealtimeEvent.COMMUNITY_USER_LEFT, _payload);
        this.updatePresence({
          _userId: _payload._userId,
          status: 'offline',
          lastSeen: new Date()
        });
        break;
        
      case 'typing':
        this.emit(RealtimeEvent.COMMUNITY_TYPING, _payload);
        break;
    }
  }
  
  /**
   * Handle professional care updates
   */
  private handleProfessionalUpdate(data: unknown) {
    const { _type, _payload } = data;
    
    switch (_type) {
      case 'therapist_available':
        this.emit(RealtimeEvent.THERAPIST_AVAILABLE, _payload);
        break;
        
      case 'appointment_reminder':
        this.emit(RealtimeEvent.APPOINTMENT_REMINDER, _payload);
        // Update activity store with appointment reminder
        useActivityStore.getState().addActivity({
          title: _payload.title,
          _type: 'appointment',
          category: 'professional',
          scheduledTime: new Date(_payload.time),
          completed: false
        });
        break;
        
      case 'prescription_update':
        this.emit(RealtimeEvent.PRESCRIPTION_UPDATE, _payload);
        break;
        
      case 'care_teammessage':
        this.emit(RealtimeEvent.CARE_TEAM_MESSAGE, _payload);
        break;
    }
  }
  
  /**
   * Handle wellness updates
   */
  private handleWellnessUpdate(data: unknown) {
    const { _type, _payload } = data;
    
    switch (_type) {
      case 'mood_check_reminder':
        this.emit(RealtimeEvent.MOOD_CHECK_REMINDER, _payload);
        break;
        
      case 'goal_milestone':
        this.emit(RealtimeEvent.GOAL_MILESTONE_REACHED, _payload);
        // Update activity store with milestone
        useActivityStore.getState().updateGoalProgress(
          _payload.goalId,
          _payload.progress
        );
        break;
        
      case 'insight':
        this.emit(RealtimeEvent.WELLNESS_INSIGHT, _payload);
        // Regenerate insights in wellness store
        useWellnessStore.getState().generateInsights();
        break;
    }
  }
  
  /**
   * Handle notification updates
   */
  private handleNotificationUpdate(data: unknown) {
    const { _type, _payload } = data;
    
    switch (_type) {
      case 'received':
        this.emit(RealtimeEvent.NOTIFICATION_RECEIVED, _payload);
        break;
        
      case 'read':
        this.emit(RealtimeEvent.NOTIFICATION_READ, _payload);
        break;
        
      case 'cleared':
        this.emit(RealtimeEvent.NOTIFICATION_CLEARED, _payload);
        break;
    }
  }
  
  /**
   * Handle crisis messages
   */
  private handleCrisisMessage(message: RealtimeMessage) {
    this.emit(RealtimeEvent.CRISIS_MESSAGE_RECEIVED, message._payload);
  }
  
  /**
   * Handle community messages
   */
  private handleCommunityMessage(message: RealtimeMessage) {
    // Process community messages
    this.emit('community:message', message._payload);
  }
  
  /**
   * Handle professional messages
   */
  private handleProfessionalMessage(message: RealtimeMessage) {
    this.emit('professional:message', message._payload);
  }
  
  /**
   * Handle wellness messages
   */
  private handleWellnessMessage(message: RealtimeMessage) {
    this.emit('wellness:message', message._payload);
  }
  
  /**
   * Handle notification messages
   */
  private handleNotificationMessage(message: RealtimeMessage) {
    this.emit(RealtimeEvent.NOTIFICATION_RECEIVED, message._payload);
  }
  
  /**
   * Update user presence
   */
  private updatePresence(_presence: UserPresence) {
    this._presence.set(_presence._userId, _presence);
    this.emit('_presence:updated', _presence);
  }
  
  /**
   * Subscribe to a channel
   */
  public subscribe(config: SubscriptionConfig): string {
    const subscriptionId = `${config.channel}-${Date.now()}`;
    this.subscriptions.set(subscriptionId, config);
    
    // If already connected, setup listener immediately
    if (this.socket && this.isConnected) {
      config.events.forEach(event => {
        const _eventName = `${config.channel}:${event}`;
        this.socket!.on(_eventName, (data: unknown) => {
          if (!config.filter || config.filter(data)) {
            config.handler(data);
          }
        });
      });
      
      // Join channel
      this.socket.emit('subscribe', config.channel);
    }
    
    return subscriptionId;
  }
  
  /**
   * Unsubscribe from a channel
   */
  public unsubscribe(subscriptionId: string) {
    const config = this.subscriptions.get(subscriptionId);
    if (!config) return;
    
    // Remove listeners if connected
    if (this.socket) {
      config.events.forEach(event => {
        const _eventName = `${config.channel}:${event}`;
        this.socket!.off(_eventName);
      });
      
      // Leave channel if no other subscriptions
      const hasOtherSubs = Array.from(this.subscriptions.values())
        .some(sub => sub.channel === config.channel && sub !== config);
        
      if (!hasOtherSubs) {
        this.socket.emit('unsubscribe', config.channel);
      }
    }
    
    this.subscriptions.delete(subscriptionId);
  }
  
  /**
   * Send a message
   */
  public send(channel: string, event: string, data: unknown): void {
    const message: RealtimeMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      _type: channel,
      _payload: data,
      timestamp: new Date(),
      _userId: this.config.auth?.userId,
      metadata: { event }
    };
    
    if (this.socket && this.isConnected) {
      this.socket.emit(`${channel}:${event}`, message);
    } else {
      // Queue message for later delivery
      this.messageQueue.push(message);
    }
  }
  
  /**
   * Flush message queue
   */
  private flushMessageQueue() {
    if (!this.socket || !this.isConnected) return;
    
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        const { _type, metadata, _payload } = message;
        this.socket.emit(`${_type}:${metadata?.event}`, message);
      }
    }
  }
  
  /**
   * Start heartbeat
   */
  private startHeartbeat() {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.isConnected) {
        this.socket.emit('heartbeat', { timestamp: Date.now() });
      }
    }, 30000); // Every 30 seconds
  }
  
  /**
   * Stop heartbeat
   */
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  /**
   * Get user presence
   */
  public getPresence(_userId: string): UserPresence | undefined {
    return this._presence.get(_userId);
  }
  
  /**
   * Get all online users
   */
  public getOnlineUsers(): UserPresence[] {
    return Array.from(this._presence.values())
      .filter(p => p.status === 'online');
  }
  
  /**
   * Update own presence
   */
  public updateOwnPresence(status: UserPresence['status'], activity?: string) {
    if (!this.socket || !this.isConnected || !this.config._auth?._userId) return;
    
    const _presence: UserPresence = {
      _userId: this.config._auth._userId,
      status,
      lastSeen: new Date(),
      activity
    };
    
    this.socket.emit('presence:update', _presence);
    this.updatePresence(_presence);
  }
  
  /**
   * Join a room
   */
  public joinRoom(_roomId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join', _roomId);
    }
  }
  
  /**
   * Leave a room
   */
  public leaveRoom(_roomId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave', _roomId);
    }
  }
  
  /**
   * Disconnect from server
   */
  public disconnect() {
    this.stopHeartbeat();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.subscriptions.clear();
    this.messageQueue = [];
    this.presence.clear();
    this.emit(RealtimeEvent.DISCONNECTED);
  }
  
  /**
   * Check if connected
   */
  public get connected(): boolean {
    return this.isConnected;
  }
  
  /**
   * Get connection state
   */
  public getConnectionState() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      onlineUsers: this.getOnlineUsers().length
    };
  }
}

// Export singleton instance
export const __realtimeSyncService = RealtimeSyncService.getInstance();

// Export React hook
export function useRealtimeSync() {
  const service = RealtimeSyncService.getInstance();
  
  return {
    connect: (_auth?: { token: string; _userId: string }) => service.connect(_auth),
    disconnect: () => service.disconnect(),
    subscribe: (config: SubscriptionConfig) => service.subscribe(config),
    unsubscribe: (id: string) => service.unsubscribe(id),
    send: (channel: string, event: string, data: unknown) => service.send(channel, event, data),
    getPresence: (_userId: string) => service.getPresence(_userId),
    getOnlineUsers: () => service.getOnlineUsers(),
    updatePresence: (status: UserPresence['status'], activity?: string) => 
      service.updateOwnPresence(status, activity),
    joinRoom: (_roomId: string) => service.joinRoom(_roomId),
    leaveRoom: (_roomId: string) => service.leaveRoom(_roomId),
    getConnectionState: () => service.getConnectionState(),
    on: (event: string, callback: (...args: unknown[]) => void) => {
      service.on(event, callback);
      return () => service.off(event, callback);
    }
  };
}