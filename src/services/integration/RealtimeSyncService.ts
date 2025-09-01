/**
 * Real-time Synchronization Service
 * Manages WebSocket connections and real-time data updates across components
 */

import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';
import { useWellnessStore } from '../../stores/wellnessStore';
import { useActivityStore } from '../../stores/activityStore';

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
  type: string;
  payload: any;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, any>;
}

// Subscription configuration
interface SubscriptionConfig {
  channel: string;
  events: string[];
  handler: (data: any) => void;
  filter?: (data: any) => boolean;
}

// Connection configuration
interface ConnectionConfig {
  url: string;
  reconnection: boolean;
  reconnectionAttempts: number;
  reconnectionDelay: number;
  timeout: number;
  auth?: {
    token: string;
    userId: string;
  };
}

// Presence information
interface UserPresence {
  userId: string;
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
  private presence: Map<string, UserPresence> = new Map();
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
      timeout: 20000
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
  public async connect(auth?: { token: string; userId: string }): Promise<void> {
    if (this.isConnected) return;
    
    return new Promise((resolve, reject) => {
      try {
        this.config.auth = auth;
        
        this.socket = io(this.config.url, {
          reconnection: this.config.reconnection,
          reconnectionAttempts: this.config.reconnectionAttempts,
          reconnectionDelay: this.config.reconnectionDelay,
          timeout: this.config.timeout,
          auth: auth || {}
        });
        
        this.setupSocketListeners();
        
        // Set connection timeout
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, this.config.timeout);
        
        this.socket.once('connect', () => {
          clearTimeout(timeout);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit(RealtimeEvent.CONNECTED);
          this.startHeartbeat();
          this.flushMessageQueue();
          resolve();
        });
        
        this.socket.once('connect_error', (error: any) => {
          clearTimeout(timeout);
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
      handler: (data) => this.handleCrisisUpdate(data)
    });
    
    // Community channel subscription
    this.subscribe({
      channel: 'community',
      events: ['post_created', 'comment_added', 'user_joined', 'user_left', 'typing'],
      handler: (data) => this.handleCommunityUpdate(data)
    });
    
    // Professional care channel subscription
    this.subscribe({
      channel: 'professional',
      events: ['therapist_available', 'appointment_reminder', 'prescription_update', 'care_team_message'],
      handler: (data) => this.handleProfessionalUpdate(data)
    });
    
    // Wellness channel subscription
    this.subscribe({
      channel: 'wellness',
      events: ['mood_check_reminder', 'goal_milestone', 'insight'],
      handler: (data) => this.handleWellnessUpdate(data)
    });
    
    // Notifications channel subscription
    this.subscribe({
      channel: 'notifications',
      events: ['received', 'read', 'cleared'],
      handler: (data) => this.handleNotificationUpdate(data)
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
    this.socket.on('presence:update', (presence: UserPresence) => {
      this.updatePresence(presence);
    });
    
    // Subscribe to configured channels
    this.subscriptions.forEach((config, key) => {
      config.events.forEach(event => {
        const eventName = `${config.channel}:${event}`;
        this.socket!.on(eventName, (data: any) => {
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
    // Process message based on type
    switch (message.type) {
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
        console.warn('Unknown message type:', message.type);
    }
    
    // Emit generic message event
    this.emit('message', message);
  }
  
  /**
   * Handle crisis updates
   */
  private handleCrisisUpdate(data: any) {
    const { type, payload } = data;
    
    switch (type) {
      case 'alert':
        this.emit(RealtimeEvent.CRISIS_ALERT_RECEIVED, payload);
        // Update wellness store with crisis event
        useWellnessStore.getState().recordCrisisEvent(payload);
        break;
        
      case 'support_connected':
        this.emit(RealtimeEvent.CRISIS_SUPPORT_CONNECTED, payload);
        break;
        
      case 'message':
        this.emit(RealtimeEvent.CRISIS_MESSAGE_RECEIVED, payload);
        break;
        
      case 'status_update':
        this.emit(RealtimeEvent.CRISIS_STATUS_UPDATED, payload);
        break;
    }
  }
  
  /**
   * Handle community updates
   */
  private handleCommunityUpdate(data: any) {
    const { type, payload } = data;
    
    switch (type) {
      case 'post_created':
        this.emit(RealtimeEvent.COMMUNITY_POST_CREATED, payload);
        break;
        
      case 'comment_added':
        this.emit(RealtimeEvent.COMMUNITY_COMMENT_ADDED, payload);
        break;
        
      case 'user_joined':
        this.emit(RealtimeEvent.COMMUNITY_USER_JOINED, payload);
        this.updatePresence({
          userId: payload.userId,
          status: 'online',
          lastSeen: new Date()
        });
        break;
        
      case 'user_left':
        this.emit(RealtimeEvent.COMMUNITY_USER_LEFT, payload);
        this.updatePresence({
          userId: payload.userId,
          status: 'offline',
          lastSeen: new Date()
        });
        break;
        
      case 'typing':
        this.emit(RealtimeEvent.COMMUNITY_TYPING, payload);
        break;
    }
  }
  
  /**
   * Handle professional care updates
   */
  private handleProfessionalUpdate(data: any) {
    const { type, payload } = data;
    
    switch (type) {
      case 'therapist_available':
        this.emit(RealtimeEvent.THERAPIST_AVAILABLE, payload);
        break;
        
      case 'appointment_reminder':
        this.emit(RealtimeEvent.APPOINTMENT_REMINDER, payload);
        // Update activity store with appointment reminder
        useActivityStore.getState().addActivity({
          title: payload.title,
          type: 'appointment',
          category: 'professional',
          scheduledTime: new Date(payload.time),
          completed: false
        });
        break;
        
      case 'prescription_update':
        this.emit(RealtimeEvent.PRESCRIPTION_UPDATE, payload);
        break;
        
      case 'care_team_message':
        this.emit(RealtimeEvent.CARE_TEAM_MESSAGE, payload);
        break;
    }
  }
  
  /**
   * Handle wellness updates
   */
  private handleWellnessUpdate(data: any) {
    const { type, payload } = data;
    
    switch (type) {
      case 'mood_check_reminder':
        this.emit(RealtimeEvent.MOOD_CHECK_REMINDER, payload);
        break;
        
      case 'goal_milestone':
        this.emit(RealtimeEvent.GOAL_MILESTONE_REACHED, payload);
        // Update activity store with milestone
        useActivityStore.getState().updateGoalProgress(
          payload.goalId,
          payload.progress
        );
        break;
        
      case 'insight':
        this.emit(RealtimeEvent.WELLNESS_INSIGHT, payload);
        // Regenerate insights in wellness store
        useWellnessStore.getState().generateInsights();
        break;
    }
  }
  
  /**
   * Handle notification updates
   */
  private handleNotificationUpdate(data: any) {
    const { type, payload } = data;
    
    switch (type) {
      case 'received':
        this.emit(RealtimeEvent.NOTIFICATION_RECEIVED, payload);
        break;
        
      case 'read':
        this.emit(RealtimeEvent.NOTIFICATION_READ, payload);
        break;
        
      case 'cleared':
        this.emit(RealtimeEvent.NOTIFICATION_CLEARED, payload);
        break;
    }
  }
  
  /**
   * Handle crisis messages
   */
  private handleCrisisMessage(message: RealtimeMessage) {
    this.emit(RealtimeEvent.CRISIS_MESSAGE_RECEIVED, message.payload);
  }
  
  /**
   * Handle community messages
   */
  private handleCommunityMessage(message: RealtimeMessage) {
    // Process community messages
    this.emit('community:message', message.payload);
  }
  
  /**
   * Handle professional messages
   */
  private handleProfessionalMessage(message: RealtimeMessage) {
    this.emit('professional:message', message.payload);
  }
  
  /**
   * Handle wellness messages
   */
  private handleWellnessMessage(message: RealtimeMessage) {
    this.emit('wellness:message', message.payload);
  }
  
  /**
   * Handle notification messages
   */
  private handleNotificationMessage(message: RealtimeMessage) {
    this.emit(RealtimeEvent.NOTIFICATION_RECEIVED, message.payload);
  }
  
  /**
   * Update user presence
   */
  private updatePresence(presence: UserPresence) {
    this.presence.set(presence.userId, presence);
    this.emit('presence:updated', presence);
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
        const eventName = `${config.channel}:${event}`;
        this.socket!.on(eventName, (data: any) => {
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
        const eventName = `${config.channel}:${event}`;
        this.socket!.off(eventName);
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
  public send(channel: string, event: string, data: any): void {
    const message: RealtimeMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      type: channel,
      payload: data,
      timestamp: new Date(),
      userId: this.config.auth?.userId,
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
        const { type, metadata, payload } = message;
        this.socket.emit(`${type}:${metadata?.event}`, message);
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
  public getPresence(userId: string): UserPresence | undefined {
    return this.presence.get(userId);
  }
  
  /**
   * Get all online users
   */
  public getOnlineUsers(): UserPresence[] {
    return Array.from(this.presence.values())
      .filter(p => p.status === 'online');
  }
  
  /**
   * Update own presence
   */
  public updateOwnPresence(status: UserPresence['status'], activity?: string) {
    if (!this.socket || !this.isConnected || !this.config.auth?.userId) return;
    
    const presence: UserPresence = {
      userId: this.config.auth.userId,
      status,
      lastSeen: new Date(),
      activity
    };
    
    this.socket.emit('presence:update', presence);
    this.updatePresence(presence);
  }
  
  /**
   * Join a room
   */
  public joinRoom(roomId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join', roomId);
    }
  }
  
  /**
   * Leave a room
   */
  public leaveRoom(roomId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave', roomId);
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
export const realtimeSyncService = RealtimeSyncService.getInstance();

// Export React hook
export function useRealtimeSync() {
  const service = RealtimeSyncService.getInstance();
  
  return {
    connect: (auth?: { token: string; userId: string }) => service.connect(auth),
    disconnect: () => service.disconnect(),
    subscribe: (config: SubscriptionConfig) => service.subscribe(config),
    unsubscribe: (id: string) => service.unsubscribe(id),
    send: (channel: string, event: string, data: any) => service.send(channel, event, data),
    getPresence: (userId: string) => service.getPresence(userId),
    getOnlineUsers: () => service.getOnlineUsers(),
    updatePresence: (status: UserPresence['status'], activity?: string) => 
      service.updateOwnPresence(status, activity),
    joinRoom: (roomId: string) => service.joinRoom(roomId),
    leaveRoom: (roomId: string) => service.leaveRoom(roomId),
    getConnectionState: () => service.getConnectionState(),
    on: (event: string, callback: (...args: any[]) => void) => {
      service.on(event, callback);
      return () => service.off(event, callback);
    }
  };
}