/**
 * Secure WebSocket Client
 * 
 * Connects to the secure backend WebSocket server for real-time features
 * Handles authentication, reconnection, and secure message transmission
 * Optimized for crisis intervention and wellness features
 */

import { io, Socket } from 'socket.io-client';
import { ApiService } from '../api/ApiService';
import { secureStorage } from '../security/SecureLocalStorage';
import { logger } from '../utils/logger';

export interface WebSocketMessage {
  type: string;
  payload: unknown;
  timestamp: Date;
  id?: string;
}

export interface CrisisMessage {
  roomId: string;
  message: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  userId: string;
  timestamp: Date;
}

export interface WellnessUpdate {
  type: 'mood' | 'activity' | 'journal' | 'assessment';
  data: unknown;
  userId: string;
  timestamp: Date;
}

export class SecureWebSocketClient {
  private static instance: SecureWebSocketClient;
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private heartbeatInterval: NodeJS.Timeout | null = null;

  // Event callbacks
  private onConnectionChange: ((connected: boolean) => void) | null = null;
  private onCrisisMessage: ((message: CrisisMessage) => void) | null = null;
  private onWellnessUpdate: ((update: WellnessUpdate) => void) | null = null;
  private onError: ((error: unknown) => void) | null = null;

  private constructor() {}

  public static getInstance(): SecureWebSocketClient {
    if (!SecureWebSocketClient.instance) {
      SecureWebSocketClient.instance = new SecureWebSocketClient();
    }
    return SecureWebSocketClient.instance;
  }

  /**
   * Connect to secure WebSocket server
   */
  public async connect(): Promise<void> {
    if (this.socket && this.isConnected) {
      logger.debug('WebSocket already connected', 'SecureWebSocketClient');
      return;
    }

    try {
      const wsUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:3001';
      const token = secureStorage.getItem('access_token');

      if (!token) {
        logger.warn('⚠️ No access token found for WebSocket authentication');
        throw new Error('Authentication token required');
      }

      logger.info('Connecting to secure WebSocket server', 'SecureWebSocketClient', { wsUrl });

      this.socket = io(wsUrl, {
        auth: {
          token
        },
        timeout: 20000,
        forceNew: true
      });

      this.setupEventHandlers();
      this.startHeartbeat();

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        if (!this.socket) {
          reject(new Error('Socket not initialized'));
          return;
        }

        this.socket.on('connect', () => {
          logger.info('WebSocket connected successfully', 'SecureWebSocketClient');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          this.onConnectionChange?.(true);
          resolve();
        });

        this.socket.on('connecterror', (error: unknown) => {
          logger.error('❌ WebSocket connection failed:', error);
          this.isConnected = false;
          this.onConnectionChange?.(false);
          this.onError?.(error);
          reject(error);
        });
      });

    } catch (error) {
      logger.error('❌ WebSocket connection error: ');
      this.isConnected = false;
      this.onConnectionChange?.(false);
      this.scheduleReconnect();
      throw undefined;
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('disconnect', (reason: unknown) => {
      logger.warn('🔌 WebSocket disconnected:', reason);
      this.isConnected = false;
      this.onConnectionChange?.(false);
      
      // Automatic reconnection for unexpected disconnections
      if (reason === 'io server disconnect') {
        // Server initiated disconnect - don't reconnect immediately
        logger.info('Server requested disconnect', 'SecureWebSocketClient');
      } else {
        this.scheduleReconnect();
      }
    });

    this.socket.on('error', (error: unknown) => {
      logger.error('❌ WebSocket error:', error);
      this.onError?.(error);
    });

    // Crisis intervention messages
    this.socket.on('crisis:message', (data: CrisisMessage) => {
      logger.crisis('Crisis message received', data.urgency as 'low' | 'medium' | 'high' | 'critical', 'SecureWebSocketClient', data);
      this.onCrisisMessage?.(data);
    });

    this.socket.on('crisis:response', (_data: unknown) => {
      logger.info('Crisis response received', 'SecureWebSocketClient');
      // Handle crisis response (e.g., professional support available)
    });

    this.socket.on('crisis:escalation', (data: unknown) => {
      logger.warn('🚨 Crisis escalation:', data);
      // Handle crisis escalation (emergency services, etc.)
    });

    // Wellness updates
    this.socket.on('wellness:update', (data: WellnessUpdate) => {
      logger.info('Wellness update received', 'SecureWebSocketClient', { type: data.type });
      this.onWellnessUpdate?.(data);
    });

    // Community events
    this.socket.on('community:message', (_data: unknown) => {
      logger.info('Community message received', 'SecureWebSocketClient');
      // Handle community messages
    });

    // System messages
    this.socket.on('system:notification', (data: unknown) => {
      logger.info('System notification', 'SecureWebSocketClient', data);
      // Handle system notifications
    });

    // Authentication errors
    this.socket.on('auth:error', (error: unknown) => {
      logger.error('🔐 Authentication error:', error);
      this.onError?.(error);
      
      // Token might be expired, try to refresh
      this.handleAuthError();
    });
  }

  /**
   * Handle authentication errors
   */
  private async handleAuthError(): Promise<void> {
    try {
      const _apiService = ApiService.getInstance();
      // Try to refresh token
      // await _apiService.refreshToken();
      
      // Reconnect with new token
      this.disconnect();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await this.connect();
    } catch (error) {
      logger.error('❌ Failed to handle auth error: ');
      this.onError?.(_undefined);
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.isConnected) {
        this.socket.emit('heartbeat', { timestamp: Date.now() });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('🚫 Max reconnection attempts reached');
      this.onError?.(new Error('Max reconnection attempts reached'));
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    logger.info(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`, 'SecureWebSocketClient');
    
    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        logger.error('❌ Reconnection failed:');
      }
    }, delay);
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    if (this.socket) {
      logger.info('Disconnecting WebSocket', 'SecureWebSocketClient');
      this.stopHeartbeat();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.onConnectionChange?.(false);
    }
  }

  /**
   * Send crisis message
   */
  public sendCrisisMessage(message: Omit<CrisisMessage, 'timestamp'>): void {
    if (!this.socket || !this.isConnected) {
      logger.warn('⚠️ Cannot send crisis message - WebSocket not connected');
      return;
    }

    const crisisMessage: CrisisMessage = {
      ...message,
      timestamp: new Date()
    };

    logger.crisis('Sending crisis message', crisisMessage.urgency as 'low' | 'medium' | 'high' | 'critical', 'SecureWebSocketClient', crisisMessage);
    this.socket.emit('crisis:message', crisisMessage);
  }

  /**
   * Join crisis room for real-time support
   */
  public joinCrisisRoom(roomId: string): void {
    if (!this.socket || !this.isConnected) {
      logger.warn('⚠️ Cannot join crisis room - WebSocket not connected');
      return;
    }

    logger.info('Joining crisis room', 'SecureWebSocketClient', { roomId });
    this.socket.emit('crisis:join', roomId);
  }

  /**
   * Leave crisis room
   */
  public leaveCrisisRoom(roomId: string): void {
    if (!this.socket || !this.isConnected) return;

    logger.info('Leaving crisis room', 'SecureWebSocketClient', { roomId });
    this.socket.emit('crisis:leave', roomId);
  }

  /**
   * Subscribe to wellness updates
   */
  public subscribeToWellnessUpdates(): void {
    if (!this.socket || !this.isConnected) {
      logger.warn('⚠️ Cannot subscribe to wellness updates - WebSocket not connected');
      return;
    }

    logger.info('Subscribing to wellness updates', 'SecureWebSocketClient');
    this.socket.emit('wellness:subscribe');
  }

  /**
   * Send wellness update
   */
  public sendWellnessUpdate(update: Omit<WellnessUpdate, 'timestamp'>): void {
    if (!this.socket || !this.isConnected) {
      logger.warn('⚠️ Cannot send wellness update - WebSocket not connected');
      return;
    }

    const wellnessUpdate: WellnessUpdate = {
      ...update,
      timestamp: new Date()
    };

    logger.info('Sending wellness update', 'SecureWebSocketClient', { type: wellnessUpdate.type });
    this.socket.emit('wellness:update', wellnessUpdate);
  }

  /**
   * Join community group for real-time chat
   */
  public joinCommunityGroup(groupId: string): void {
    if (!this.socket || !this.isConnected) {
      logger.warn('⚠️ Cannot join community group - WebSocket not connected');
      return;
    }

    logger.info('Joining community group', 'SecureWebSocketClient', { groupId });
    this.socket.emit('community:join', groupId);
  }

  /**
   * Event handler setters
   */
  public onConnectionStatusChange(callback: (connected: boolean) => void): void {
    this.onConnectionChange = callback;
  }

  public onCrisisMessageReceived(callback: (message: CrisisMessage) => void): void {
    this.onCrisisMessage = callback;
  }

  public onWellnessUpdateReceived(callback: (update: WellnessUpdate) => void): void {
    this.onWellnessUpdate = callback;
  }

  public onErrorReceived(callback: (error: unknown) => void): void {
    this.onError = callback;
  }

  /**
   * Get connection status
   */
  public get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Get reconnection attempts
   */
  public get reconnectionAttempts(): number {
    return this.reconnectAttempts;
  }
}

// Export singleton instance
export const __secureWebSocket = SecureWebSocketClient.getInstance();