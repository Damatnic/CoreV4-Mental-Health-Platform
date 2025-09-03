import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { logger } from '../../utils/logger';

// Types for real-time events
export interface UserPresence {
  userId: string;
  username: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
  currentRoom?: string;
}

export interface TypingIndicator {
  userId: string;
  username: string;
  roomId: string;
  _isTyping: boolean;
}

export interface RealtimeMessage {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'crisis-alert' | 'moderation';
  metadata?: {
    crisisLevel?: 'low' | 'medium' | 'high' | 'critical';
    edited?: boolean;
    editedAt?: Date;
    reactions?: { [emoji: string]: string[] };
  };
}

export interface NotificationEvent {
  id: string;
  type: 'message' | 'mention' | 'reply' | 'group-invite' | 'crisis-support' | 'achievement';
  title: string;
  content: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

// WebSocket service configuration
const WEBSOCKET_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
const RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private eventHandlers: Map<string, Set<Function>> = new Map();
  private presenceCache: Map<string, UserPresence> = new Map();
  private typingTimers: Map<string, NodeJS.Timeout> = new Map();

  // Initialize WebSocket connection
  connect(userId: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      try {
        // Create socket connection with authentication
        this.socket = io(WEBSOCKET_URL, {
          auth: { token, userId },
          reconnection: true,
          reconnectionDelay: RECONNECT_DELAY,
          reconnectionAttempts: RECONNECT_ATTEMPTS,
          timeout: 10000,
        });

        // Connection event handlers
        this.socket.on('connect', () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          logger.info('WebSocket connected successfully', 'RealtimeWebSocket');
          this.emit('connection:established', { userId });
          resolve();
        });

        this.socket.on('disconnect', (reason: unknown) => {
          this.isConnected = false;
          logger.warn('WebSocket disconnected:', reason);
          this.emit('connection:lost', { reason });
          this.handleReconnection();
        });

        this.socket.on('connect_error', (error: unknown) => {
          logger.error('WebSocket connection error:', error);
          this.emit('connection:error', { error: error.message });
          reject(error);
        });

        // Set up core event listeners
        this.setupCoreEventListeners();
      } catch {
        logger.error('Failed to initialize WebSocket:');
        reject(_undefined);
      }
    });
  }

  // Set up core event listeners for real-time features
  private setupCoreEventListeners(): void {
    if (!this.socket) return;

    // User presence events
    this.socket.on('presence:update', (data: UserPresence) => {
      this.presenceCache.set(data.userId, data);
      this.emit('presence:update', data);
    });

    this.socket.on('presence:bulk', (users: UserPresence[]) => {
      users.forEach(user => this.presenceCache.set(user.userId, user));
      this.emit('presence:bulk', users);
    });

    // Typing indicators
    this.socket.on('typing:start', (data: TypingIndicator) => {
      this.emit('typing:start', data);
    });

    this.socket.on('typing:stop', (data: TypingIndicator) => {
      this.emit('typing:stop', data);
    });

    // Real-time messages
    this.socket.on('message:new', (message: RealtimeMessage) => {
      // Check for crisis keywords and handle appropriately
      if (this.detectCrisisContent(message.content)) {
        this.handleCrisisMessage(message);
      }
      this.emit('message:new', message);
    });

    this.socket.on('message:update', (message: RealtimeMessage) => {
      this.emit('message:update', message);
    });

    this.socket.on('message:delete', (messageId: string) => {
      this.emit('message:delete', messageId);
    });

    // Notifications
    this.socket.on('notification:new', (notification: NotificationEvent) => {
      this.handleNotification(notification);
      this.emit('notification:new', notification);
    });

    // Room events
    this.socket.on('room:joined', (roomId: string) => {
      this.emit('room:joined', roomId);
    });

    this.socket.on('room:left', (roomId: string) => {
      this.emit('room:left', roomId);
    });

    // Crisis support events
    this.socket.on('crisis:alert', (data: unknown) => {
      this.handleCrisisAlert(data);
    });

    this.socket.on('support:request', (data: unknown) => {
      this.emit('support:request', data);
    });
  }

  // Send a message to a room
  sendMessage(roomId: string, content: string, type: 'text' | 'system' = 'text'): void {
    if (!this.socket?.connected) {
      toast.error('Not connected to chat server');
      return;
    }

    const message = {
      roomId,
      content,
      type,
      timestamp: new Date(),
    };

    this.socket.emit('message:send', message);
  }

  // Join a room (support group, chat room, etc.)
  joinRoom(roomId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected to server'));
        return;
      }

      this.socket.emit('room:join', roomId, (response: unknown) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to join room'));
        }
      });
    });
  }

  // Leave a room
  leaveRoom(roomId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('room:leave', roomId);
  }

  // Update user presence status
  updatePresence(status: 'online' | 'away' | 'busy'): void {
    if (!this.socket?.connected) return;
    this.socket.emit('presence:update', { status });
  }

  // Send typing indicator
  sendTypingIndicator(roomId: string, _isTyping: boolean): void {
    if (!this.socket?.connected) return;

    // Clear existing timer for this room
    const _timerId = this.typingTimers.get(_roomId);
    if (_timerId) {
      clearTimeout(_timerId);
      this.typingTimers.delete(_roomId);
    }

    if (_isTyping) {
      this.socket.emit('typing:start', { roomId });
      
      // Auto-stop typing after 5 seconds
      const timer = setTimeout(() => {
        this.sendTypingIndicator(roomId, false);
      }, 5000);
      this.typingTimers.set(roomId, timer);
    } else {
      this.socket.emit('typing:stop', { roomId });
    }
  }

  // React to a message
  addReaction(messageId: string, emoji: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('message:react', { messageId, emoji });
  }

  // Request peer support
  requestPeerSupport(topic: string, urgency: 'low' | 'medium' | 'high'): void {
    if (!this.socket?.connected) {
      toast.error('Unable to request support. Please check your connection.');
      return;
    }

    this.socket.emit('support:request', { topic, urgency });
    toast.success('Support request sent. A peer counselor will connect with you soon.');
  }

  // Report content for moderation
  reportContent(contentId: string, contentType: 'message' | 'post' | 'comment', reason: string): void {
    if (!this.socket?.connected) return;
    
    this.socket.emit('moderation:report', {
      contentId,
      contentType,
      reason,
      timestamp: new Date(),
    });
    
    toast.success('Content reported. Our moderation team will review it promptly.');
  }

  // Crisis content detection
  private detectCrisisContent(content: string): boolean {
    const crisisKeywords = [
      'suicide', 'kill myself', 'end it all', 'self harm',
      'hurt myself', 'die', 'death wish', 'not worth living'
    ];
    
    const lowerContent = content.toLowerCase();
    return crisisKeywords.some(_keyword => lowerContent.includes(_keyword));
  }

  // Handle crisis messages
  private handleCrisisMessage(message: RealtimeMessage): void {
    // Alert moderators and crisis counselors
    this.socket?.emit('crisis:detected', {
      messageId: message.id,
      userId: message.userId,
      roomId: message.roomId,
      content: message.content,
      timestamp: message.timestamp,
    });

    // Update message metadata with crisis flag
    message.metadata = {
      ...message.metadata,
      crisisLevel: this.assessCrisisLevel(message.content),
    };
  }

  // Assess crisis level based on content
  private assessCrisisLevel(content: string): 'low' | 'medium' | 'high' | 'critical' {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('suicide') || lowerContent.includes('kill myself')) {
      return 'critical';
    } else if (lowerContent.includes('hurt myself') || lowerContent.includes('self harm')) {
      return 'high';
    } else if (lowerContent.includes('hopeless') || lowerContent.includes('worthless')) {
      return 'medium';
    }
    
    return 'low';
  }

  // Handle crisis alerts
  private handleCrisisAlert(data: unknown): void {
    // Show urgent notification to available crisis counselors
    toast.error(`Crisis support needed in ${data.roomName || 'chat'}`, {
      duration: 10000,
      icon: '🚨',
    });
    
    this.emit('crisis:alert', data);
  }

  // Handle notifications
  private handleNotification(notification: NotificationEvent): void {
    // Show toast based on priority
    const options = {
      duration: notification.priority === 'urgent' ? 10000 : 5000,
    };

    switch (notification.priority) {
      case 'urgent':
        toast.error(notification.content, options);
        break;
      case 'high':
        toast.success(notification.content, options);
        break;
      default:
        toast(notification.content, options);
    }

    // Play notification sound for high priority
    if (notification.priority === 'high' || notification.priority === 'urgent') {
      this.playNotificationSound();
    }
  }

  // Play notification sound - DISABLED: Sound was too annoying for users
  private playNotificationSound(): void {
    // DISABLED: Sound muted per user feedback - all notification sounds are off
    return;
    
    // Original code kept for reference but disabled:
    // const audioContext = new (window.AudioContext || (window as unknown).webkitAudioContext)();
    // const __oscillator = audioContext.createOscillator();
    // const __gainNode = audioContext.createGain();
    // ... rest of sound generation code disabled
  }

  // Handle reconnection
  private handleReconnection(): void {
    if (this.reconnectTimer) return;
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts <= RECONNECT_ATTEMPTS) {
        logger.info(`Attempting to reconnect... (${this.reconnectAttempts}/${RECONNECT_ATTEMPTS})`, 'RealtimeWebSocket');
        this.socket?.connect();
      } else {
        toast.error('Connection lost. Please refresh the page to reconnect.');
      }
      
      this.reconnectTimer = null;
    }, RECONNECT_DELAY);
  }

  // Event emitter methods
  on(event: string, handler: (...args: unknown[]) => any): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)?.add(handler);
  }

  off(event: string, handler: (...args: unknown[]) => any): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  private emit(event: string, data?: unknown): void {
    this.eventHandlers.get(event)?.forEach(handler => handler(data));
  }

  // Get current presence for a user
  getUserPresence(userId: string): UserPresence | undefined {
    return this.presenceCache.get(userId);
  }

  // Get all online users
  getOnlineUsers(): UserPresence[] {
    return Array.from(this.presenceCache.values()).filter(
      user => user.status === 'online'
    );
  }

  // Disconnect from WebSocket
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.typingTimers.forEach(timer => clearTimeout(timer));
    this.typingTimers.clear();
    
    this.socket?.disconnect();
    this.socket = null;
    this.isConnected = false;
    this.presenceCache.clear();
    this.eventHandlers.clear();
  }

  // Check connection status
  isConnectedToServer(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Get socket instance (for advanced usage)
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
export const _websocketService = new WebSocketService();