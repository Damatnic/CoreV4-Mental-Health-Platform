// Mock WebSocket Adapter - Seamlessly integrates MockCrisisServer with existing WebSocket interface
// Provides realistic demo functionality without requiring backend services

import { RealtimeMessage } from '../realtime/websocketService';
import { mockCrisisServer, MockCrisisSession, MockCounselor } from './MockCrisisServer';
import { toast } from 'react-hot-toast';
import { logger } from '../../utils/logger';

// Mock WebSocket Adapter that mimics the real WebSocketService interface
export class MockWebSocketAdapter {
  private static instance: MockWebSocketAdapter;
  private eventHandlers: Map<string, Set<Function>> = new Map();
  private isConnected: boolean = false;
  private currentUserId: string | null = null;
  private activeSessions: Map<string, MockCrisisSession> = new Map();
  private connectionSimulationTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    this.setupMockCrisisServer();
  }

  public static getInstance(): MockWebSocketAdapter {
    if (!MockWebSocketAdapter.instance) {
      MockWebSocketAdapter.instance = new MockWebSocketAdapter();
    }
    return MockWebSocketAdapter.instance;
  }

  // Setup mock crisis server event handlers
  private setupMockCrisisServer(): void {
    mockCrisisServer.onEmergency((action: string, data: unknown) => {
      this.handleEmergencyProtocol(action, data);
    });
  }

  // Simulate WebSocket connection
  public async connect(userId: string, _token: string): Promise<void> {
    return new Promise((resolve, _reject) => {
      if (this.isConnected) {
        resolve();
        return;
      }

      this.currentUserId = userId;

      // Simulate connection delay
      this.connectionSimulationTimeout = setTimeout(() => {
        this.isConnected = true;
        logger.info('Mock WebSocket connected successfully', 'MockWebSocketAdapter');
        
        this.emit('connection:established', { userId });
        toast.success('Connected to crisis support system');
        
        resolve();
      }, 1000 + Math.random() * 2000); // 1-3 second delay
    });
  }

  // Simulate joining a crisis room
  public async joinRoom(_roomId: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isConnected) {
        throw new Error('Not connected to server');
      }

      // Simulate join delay
      setTimeout(() => {
        this.emit('room:joined', _roomId);
        logger.info(`Joined room: ${_roomId}`, 'MockWebSocketAdapter');
        resolve();
      }, 500);
    });
  }

  // Simulate leaving a room
  public leaveRoom(_roomId: string): void {
    if (!this.isConnected) return;
    
    // End any active crisis sessions
    const session = this.activeSessions.get(_roomId);
    if (session) {
      session.end();
      this.activeSessions.delete(_roomId);
    }

    this.emit('room:left', _roomId);
    logger.info(`Left room: ${_roomId}`, 'MockWebSocketAdapter');
  }

  // Create and join a crisis session
  public async createCrisisSession(priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'): Promise<{
    _sessionId: string;
    counselor: MockCounselor;
  }> {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    // Create crisis session through mock server
    const session = mockCrisisServer.createCrisisSession(this.currentUserId, priority);
    this.activeSessions.set(session.sessionId, session);

    // Setup session event handlers
    session.onMessage((message: RealtimeMessage) => {
      this.emit('message:new', message);
    });

    session.onTyping((_isTyping: boolean) => {
      if (_isTyping) {
        this.emit('typing:start', {
          userId: session.counselor.id,
          username: session.counselor.name,
          _roomId: session._sessionId
        });
      } else {
        this.emit('typing:stop', {
          userId: session.counselor.id,
          username: session.counselor.name,
          _roomId: session._sessionId
        });
      }
    });

    session.onEmergency((action: string, data: unknown) => {
      this.emit('crisis:escalated', { action, data, _sessionId: session._sessionId });
    });

    // Join the room
    await this.joinRoom(session.sessionId);

    // Simulate counselor assignment process
    setTimeout(() => {
      this.emit('counselor:assigned', {
        id: session.counselor.id,
        name: session.counselor.name,
        credentials: session.counselor.credentials,
        specialties: session.counselor.specialties,
        responseTime: session.counselor.responseTime
      });
    }, 2000);

    // Simulate queue position updates
    this.simulateQueueUpdates(session.sessionId);

    return {
      _sessionId: session._sessionId,
      counselor: session.counselor
    };
  }

  // Simulate queue position updates before counselor assignment
  private simulateQueueUpdates(_sessionId: string): void {
    let position = Math.floor(Math.random() * 5) + 1; // 1-5 position
    let estimatedWait = position * 30; // 30 seconds per position

    const updateQueue = () => {
      if (position > 1) {
        this.emit('queue:update', {
          position,
          estimatedWait
        });

        position--;
        estimatedWait = Math.max(30, estimatedWait - 30);

        setTimeout(updateQueue, 2000 + Math.random() * 3000); // 2-5 seconds between updates
      }
    };

    // Start queue simulation only if there's a queue
    if (position > 1) {
      setTimeout(updateQueue, 1000);
    }
  }

  // Send message to crisis session
  public sendMessage(_roomId: string, content: string, _type: 'text' | 'system' = 'text'): void {
    const session = this.activeSessions.get(_roomId);
    if (!session) {
      logger.warn(`No active session found for room: ${_roomId}`);
      return;
    }

    // Send message to mock crisis session
    session.sendMessage(_content);
  }

  // Send typing indicator
  public sendTypingIndicator(_roomId: string, _isTyping: boolean): void {
    // Mock typing indicators are handled automatically by the crisis session
    // This is a no-op in the mock implementation
  }

  // Handle emergency protocols
  private handleEmergencyProtocol(action: string, data: unknown): void {
    logger.error('🚨 EMERGENCY PROTOCOL TRIGGERED:', action, data);

    switch (_action) {
      case 'auto_dial_988':
        this.triggerEmergencyCall('988', 'Suicide & Crisis Lifeline', data);
        break;
      case 'auto_dial_911':
        this.triggerEmergencyCall('911', 'Emergency Services', data);
        break;
      case 'crisis_escalation':
        this.handleCrisisEscalation(data);
        break;
      default:
        logger.warn('Unknown emergency action:', action);
    }

    // Emit crisis event for UI handling
    this.emit('crisis:emergency', { action, data });
  }

  // Trigger emergency call
  private triggerEmergencyCall(number: string, service: string, data: unknown): void {
    // Show immediate emergency modal
    const emergencyMessage = {
      id: `emergency-${Date.now()}`,
      _roomId: data.sessionId || 'system',
      userId: 'system',
      username: 'Emergency System',
      content: `🚨 EMERGENCY PROTOCOL ACTIVATED\n\nI'm initiating an emergency call to ${service} (${number}) based on your situation. This is for your immediate safety.\n\nIf you're in immediate danger, please call ${number} directly or go to your nearest emergency room.`,
      timestamp: new Date(),
      _type: 'crisis-alert' as const
    };

    this.emit('message:new', emergencyMessage);

    // Simulate emergency call initiation after brief delay
    setTimeout(() => {
      // Show browser alert with emergency information
      const _alertMessage = `🚨 EMERGENCY CALL INITIATED\n\nService: ${service}\nNumber: ${number}\n\n⚠️ IMPORTANT: This is a demonstration system.\nIn a real emergency, please call ${number} immediately.\n\nPressing OK will simulate dialing ${number}.`;
      
      if (confirm(_alertMessage)) {
        // Actually initiate the phone call
        if (typeof window !== 'undefined') {
          window.location.href = `tel:${number}`;
        }
      }
    }, 2000);

    // Log emergency event
    logger.error(`📞 EMERGENCY CALL: ${service} (${number}) - Session: ${data._sessionId}`);
  }

  // Handle crisis escalation
  private handleCrisisEscalation(data: unknown): void {
    const escalationMessage = {
      id: `escalation-${Date.now()}`,
      _roomId: data.sessionId || 'system',
      userId: 'system',
      username: 'Crisis Team',
      content: '🆘 CRISIS ESCALATION: Your situation has been escalated to our emergency response team. A crisis specialist is being notified immediately. Please stay on the line.',
      timestamp: new Date(),
      _type: 'crisis-alert' as const
    };

    this.emit('message:new', escalationMessage);

    // Simulate crisis specialist joining
    setTimeout(() => {
      const specialistMessage = {
        id: `specialist-${Date.now()}`,
        _roomId: data.sessionId || 'system',
        userId: 'crisis-specialist',
        username: 'Dr. Crisis Specialist',
        content: 'Hello, I\'m Dr. Martinez, a crisis intervention specialist. I\'ve been notified of your situation and I\'m here to help. Your safety is our absolute priority. Can you tell me your current location?',
        timestamp: new Date(),
        _type: 'text' as const
      };

      this.emit('message:new', specialistMessage);
    }, 3000);
  }

  // Simulate connection loss and recovery
  public simulateConnectionLoss(): void {
    if (!this.isConnected) return;

    this.isConnected = false;
    this.emit('connection:lost', { reason: 'Network disruption' });
    toast.error('Connection lost. Attempting to reconnect...');

    // Simulate reconnection after 3-8 seconds
    setTimeout(() => {
      this.isConnected = true;
      this.emit('connection:established', { userId: this.currentUserId });
      toast.success('Connection restored');
      
      // Re-establish active sessions
      this.activeSessions.forEach((session, _sessionId) => {
        this.emit('room:joined', _sessionId);
      });
    }, 3000 + Math.random() * 5000);
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
  public isConnectedToServer(): boolean {
    return this.isConnected;
  }

  public getSocket(): unknown {
    // Return a mock socket object with limited functionality
    return {
      connected: this.isConnected,
      emit: (event: string, data: unknown, callback?: (...args: unknown[]) => any) => {
        // Handle specific socket events
        switch (event) {
          case 'crisis:request-counselor':
            this.handleCounselorRequest(data);
            break;
          case 'crisis:escalate':
            this.handleCrisisEscalation(data);
            break;
          default:
            logger.debug(`Mock socket emit: ${event}`, 'MockWebSocketAdapter', data);
        }
        
        if (callback) {
          setTimeout(() => callback({ success: true }), 100);
        }
      }
    };
  }

  // Handle counselor request
  private handleCounselorRequest(data: unknown): void {
    logger.crisis('Crisis counselor requested', 'high', 'MockWebSocketAdapter', data);
    
    // This is handled automatically when creating a crisis session
    // The MockCrisisServer manages counselor assignment
  }

  // Disconnect
  public disconnect(): void {
    if (this.connectionSimulationTimeout) {
      clearTimeout(this.connectionSimulationTimeout);
    }

    // End all active sessions
    this.activeSessions.forEach(session => session.end());
    this.activeSessions.clear();

    this.isConnected = false;
    this.currentUserId = null;
    this.eventHandlers.clear();
    
    logger.info('Mock WebSocket disconnected', 'MockWebSocketAdapter');
  }

  // Get current session for a room
  public getSession(_roomId: string): MockCrisisSession | undefined {
    return this.activeSessions.get(_roomId);
  }

  // Get mock server statistics
  public getServerStats(): {
    activeSessions: number;
    availableCounselors: number;
    totalCounselors: number;
  } {
    return mockCrisisServer.getStats();
  }

  // Test emergency protocols (for demo purposes)
  public testEmergencyProtocol(_type: 'suicide_risk' | 'medical_emergency' | 'connection_loss'): void {
    logger.crisis(`Testing emergency protocol: ${_type}`, 'critical', 'MockWebSocketAdapter');
    
    switch (_type) {
      case 'suicide_risk':
        this.handleEmergencyProtocol('auto_dial_988', {
          reason: 'Test suicide risk protocol',
          _sessionId: 'test-session'
        });
        break;
      case 'medical_emergency':
        this.handleEmergencyProtocol('auto_dial_911', {
          reason: 'Test medical emergency protocol',
          _sessionId: 'test-session'
        });
        break;
      case 'connection_loss':
        this.simulateConnectionLoss();
        break;
    }
  }

  // End call functionality for testing
  public endCall(): void {
    logger.info('Ending mock crisis call session', 'MockWebSocketAdapter');
    
    // Clear all active sessions
    for (const [_sessionId, session] of this.activeSessions.entries()) {
      logger.info(`Ending session: ${_sessionId}`, 'MockWebSocketAdapter');
      // Emit session end event
      this.emit('session:ended', {
        _sessionId,
        counselorId: session.counselor.id,
        timestamp: new Date()
      });
    }
    
    // Clear the sessions map
    this.activeSessions.clear();
    
    // Emit call ended event
    this.emit('call:ended', {
      timestamp: new Date(),
      reason: 'user_ended'
    });
  }
}

// Export singleton instance
export const __mockWebSocketAdapter = MockWebSocketAdapter.getInstance();