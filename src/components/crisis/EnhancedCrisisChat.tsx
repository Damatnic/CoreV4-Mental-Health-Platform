import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Bot, User, Heart, AlertCircle, Clock, Phone, Shield, Wifi, WifiOff, Users } from 'lucide-react';
import { RealtimeMessage } from '../../services/realtime/websocketService';
import { mockWebSocketAdapter } from '../../services/crisis/MockWebSocketAdapter';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { logger } from '@/utils/logger';

interface CrisisLevel {
  level: 'low' | 'medium' | 'high' | 'critical';
  keywords: string[];
}

const CRISIS_KEYWORDS: CrisisLevel[] = [
  {
    level: 'critical',
    keywords: ['suicide', 'kill myself', 'end it all', 'die', 'death', 'hurt myself', 'self harm']
  },
  {
    level: 'high',
    keywords: ['hopeless', 'worthless', 'cant go on', 'give up', 'no point', 'alone', 'nobody cares']
  },
  {
    level: 'medium',
    keywords: ['anxious', 'panic', 'scared', 'overwhelmed', 'stressed', 'crying', 'cant cope']
  },
  {
    level: 'low',
    keywords: ['sad', 'worried', 'upset', 'confused', 'lonely', 'tired', 'frustrated']
  }
];

interface CounselorInfo {
  id: string;
  name: string;
  credentials: string;
  avatar?: string;
  status: 'available' | 'busy' | 'offline';
  specialties: string[];
  responseTime: number; // average in seconds
}

export function EnhancedCrisisChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [counselorInfo, setCounselorInfo] = useState<CounselorInfo | null>(null);
  const [__counselorTyping, setCounselorTyping] = useState(false);
  const [detectedCrisisLevel, _setDetectedCrisisLevel] = useState<'low' | 'medium' | 'high' | 'critical' | null>(null);
  const [__showEmergencyPrompt, setShowEmergencyPrompt] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const _chatContainerRef  = useRef<HTMLDivElement>(null);
  const roomId = useRef<string>(`crisis-${Date.now()}`);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (user) {
      initializeWebSocket();
    }

    return () => {
      if (isConnected) {
        mockWebSocketAdapter.leaveRoom(roomId.current);
      }
    };
  }, [user, initializeWebSocket, isConnected]);

  const initializeWebSocket = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      await mockWebSocketAdapter.connect(user?.id || 'anonymous', user?.token || '');
      setConnectionStatus('connected');
      setupWebSocketListeners();
      
      // Add welcome message
      const welcomeMessage: RealtimeMessage = {
        id: 'welcome',
        roomId: roomId.current,
        userId: 'system',
        username: 'System',
        content: "Welcome to Crisis Chat. Your safety and well-being are our top priority. Everything you share here is confidential and encrypted.",
        timestamp: new Date(),
        type: 'system',
      };
      setMessages([welcomeMessage]);
    } catch (error) {
      logger.error('Failed to connect to chat service', 'EnhancedCrisisChat', error);
      setConnectionStatus('disconnected');
      toast.error('Unable to connect to chat service. Please check your connection.');
    }
  }, [user, setupWebSocketListeners]);

  const setupWebSocketListeners = useCallback(() => {
    // Message events
    mockWebSocketAdapter.on('message:new', handleNewMessage);
    mockWebSocketAdapter.on('typing:start', handleCounselorTypingStart);
    mockWebSocketAdapter.on('typing:stop', handleCounselorTypingStop);
    
    // Counselor events
    mockWebSocketAdapter.on('counselor:assigned', handleCounselorAssigned);
    mockWebSocketAdapter.on('counselor:disconnected', handleCounselorDisconnected);
    
    // Queue events
    mockWebSocketAdapter.on('queue:update', handleQueueUpdate);
    
    // Crisis events
    mockWebSocketAdapter.on('crisis:escalated', handleCrisisEscalated);
    
    // Connection events
    mockWebSocketAdapter.on('connection:lost', handleConnectionLost);
    mockWebSocketAdapter.on('connection:established', handleConnectionRestored);
  }, [
    handleNewMessage,
    handleCounselorTypingStart,
    handleCounselorTypingStop,
    handleCounselorAssigned,
    handleCounselorDisconnected,
    handleQueueUpdate,
    handleCrisisEscalated,
    handleConnectionLost,
    handleConnectionRestored
  ]);

  const handleNewMessage = useCallback((message: RealtimeMessage) => {
    if (message.roomId === roomId.current) {
      setMessages(prev => [...prev, message]);
      
      // Check if it's a counselor message and stop typing indicator
      if (message.userId !== user?.id && message.type !== 'system') {
        setCounselorTyping(false);
      }
    }
  }, [user]);

  const handleCounselorTypingStart = useCallback((data: { roomId: string; userId: string }) => {
    if (data.roomId === roomId.current && data.userId !== user?.id) {
      setCounselorTyping(true);
    }
  }, [user]);

  const handleCounselorTypingStop = useCallback((data: { roomId: string; userId: string }) => {
    if (data.roomId === roomId.current && data.userId !== user?.id) {
      setCounselorTyping(false);
    }
  }, [user]);

  const handleCounselorAssigned = useCallback((counselor: CounselorInfo) => {
    setCounselorInfo(counselor);
    setQueuePosition(null);
    setEstimatedWaitTime(null);
    setIsConnected(true);
    setIsConnecting(false);
    
    const message: RealtimeMessage = {
      id: `msg-${Date.now()}`,
      roomId: roomId.current,
      userId: 'system',
      username: 'System',
      content: `You're now connected with ${counselor.name}, ${counselor.credentials}. They specialize in ${counselor.specialties.join(', ')}.`,
      timestamp: new Date(),
      type: 'system',
    };
    setMessages(prev => [...prev, message]);
    
    toast.success('Connected to a crisis counselor');
  }, []);

  const handleCounselorDisconnected = useCallback(() => {
    setCounselorInfo(null);
    setIsConnected(false);
    
    const message: RealtimeMessage = {
      id: `msg-${Date.now()}`,
      roomId: roomId.current,
      userId: 'system',
      username: 'System',
      content: 'Your counselor has disconnected. We\'re connecting you with another counselor...',
      timestamp: new Date(),
      type: 'system',
    };
    setMessages(prev => [...prev, message]);
    
    // Automatically try to reconnect
    handleConnect();
  }, [handleConnect]);

  const handleQueueUpdate = useCallback((data: { position: number; estimatedWait: number }) => {
    setQueuePosition(data.position);
    setEstimatedWaitTime(data.estimatedWait);
  }, []);

  const handleCrisisEscalated = useCallback(() => {
    const message: RealtimeMessage = {
      id: `msg-${Date.now()}`,
      roomId: roomId.current,
      userId: 'system',
      username: 'System',
      content: '🆘 A crisis specialist has been notified and will join this conversation immediately.',
      timestamp: new Date(),
      type: 'crisis-alert',
    };
    setMessages(prev => [...prev, message]);
  }, []);

  const handleConnectionLost = useCallback(() => {
    setConnectionStatus('disconnected');
    toast.error('Connection lost. Attempting to reconnect...');
  }, []);

  const handleConnectionRestored = useCallback(() => {
    setConnectionStatus('connected');
    toast.success('Connection restored');
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Detect crisis level in messages
  const detectCrisisLevel = (text: string): 'low' | 'medium' | 'high' | 'critical' | null => {
    const lowerText = text.toLowerCase();
    
    for (const crisis of CRISIS_KEYWORDS) {
      for (const keyword of crisis.keywords) {
        if (lowerText.includes(keyword)) {
          return crisis.level as 'low' | 'medium' | 'high' | 'critical';
        }
      }
    }
    return null;
  };

  // Handle connecting to counselor
  const handleConnect = useCallback(async () => {
    if (connectionStatus !== 'connected') {
      toast.error('Please wait for connection to establish');
      return;
    }
    
    setIsConnecting(true);
    
    try {
      // Create crisis session with mock server
      const session = await mockWebSocketAdapter.createCrisisSession(detectedCrisisLevel || 'medium');
      roomId.current = session.sessionId;
      
      // Join crisis room
      await mockWebSocketAdapter.joinRoom(roomId.current);
      
      // Show queue position
      const queueMessage: RealtimeMessage = {
        id: `msg-${Date.now()}`,
        roomId: roomId.current,
        userId: 'system',
        username: 'System',
        content: 'Connecting you with a trained crisis counselor. All counselors are certified professionals. You are being prioritized based on your needs.',
        timestamp: new Date(),
        type: 'system',
      };
      setMessages(prev => [...prev, queueMessage]);
    } catch (error) {
      logger.error('Failed to connect to counselor', 'EnhancedCrisisChat', error);
      setIsConnecting(false);
      toast.error('Failed to connect. Please try again.');
    }
  }, [connectionStatus, detectedCrisisLevel]);

  // Handle sending message
  const handleSendMessage = () => {
    if (!inputMessage.trim() || !isConnected) return;

    // Check for crisis keywords
    const crisisLevel = detectCrisisLevel(inputMessage);
    if (crisisLevel) {
      setDetectedCrisisLevel(crisisLevel);
      if (crisisLevel === 'critical') {
        setShowEmergencyPrompt(true);
        // Immediately escalate to crisis team
        mockWebSocketAdapter.getSocket()?.emit('crisis:escalate', {
          roomId: roomId.current,
          userId: user?.id,
          message: inputMessage,
          level: crisisLevel,
        });
      }
    }

    // Send message via Mock WebSocket
    mockWebSocketAdapter.sendMessage(roomId.current, inputMessage, 'text');
    
    // Add to local messages immediately for better UX
    const userMessage: RealtimeMessage = {
      id: `msg-${Date.now()}`,
      roomId: roomId.current,
      userId: user?.id || 'anonymous',
      username: user?.name || 'You',
      content: inputMessage,
      timestamp: new Date(),
      type: 'text',
      metadata: crisisLevel ? { crisisLevel: crisisLevel as 'low' | 'medium' | 'high' | 'critical' } : undefined,
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input
    setInputMessage('');
    
    // Stop typing indicator
    handleUserTypingStop();
  };

  // Handle typing indicator
  const handleUserTypingStart = () => {
    if (!isConnected) return;
    
    mockWebSocketAdapter.sendTypingIndicator(roomId.current, true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Auto-stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      handleUserTypingStop();
    }, 3000);
  };

  const handleUserTypingStop = () => {
    if (!isConnected) return;
    
    mockWebSocketAdapter.sendTypingIndicator(roomId.current, false);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  // Handle emergency prompt response
  const handleEmergencyResponse = (action: 'call' | 'continue' | 'dismiss') => {
    setShowEmergencyPrompt(false);
    
    if (action === 'call') {
      window.location.href = 'tel:988';
    } else if (action === 'continue') {
      const message: RealtimeMessage = {
        id: `msg-${Date.now()}`,
        roomId: roomId.current,
        userId: counselorInfo?.id || 'counselor',
        username: counselorInfo?.name || 'Crisis Counselor',
        content: "I'm staying here with you. Your safety is my top priority. Remember, you can always call 988 or text HOME to 741741 if you need immediate support. Let's focus on keeping you safe right now. What would help you feel a bit safer in this moment?",
        timestamp: new Date(),
        type: 'text',
      };
      setMessages(prev => [...prev, message]);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-purple-600 text-white rounded-t-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              {counselorInfo ? (
                <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center font-semibold">
                  {counselorInfo.name.charAt(0)}
                </div>
              ) : (
                <Bot className="h-8 w-8" />
              )}
              {isConnected && (
                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              )}
            </div>
            <div>
              <h3 className="font-semibold">
                {counselorInfo ? counselorInfo.name : 'Crisis Chat Support'}
              </h3>
              <div className="flex items-center space-x-2 text-sm opacity-90">
                {connectionStatus === 'connected' ? (
                  <>
                    <Wifi className="h-3 w-3" />
                    <span>{isConnected ? 'Connected' : queuePosition ? `Queue position: ${queuePosition}` : 'Ready to connect'}</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3" />
                    <span>Reconnecting...</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {detectedCrisisLevel && (
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                detectedCrisisLevel === 'critical' ? 'bg-red-500' :
                detectedCrisisLevel === 'high' ? 'bg-orange-500' :
                detectedCrisisLevel === 'medium' ? 'bg-yellow-500' :
                'bg-green-500'
              }`}>
                Priority Support
              </div>
            )}
            <Shield className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.userId === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-2 max-w-[70%] ${
              message.userId === user?.id ? 'flex-row-reverse space-x-reverse' : ''
            }`}>
              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                message.userId === user?.id ? 'bg-blue-100' :
                message.type === 'system' ? 'bg-gray-100' :
                message.type === 'crisis-alert' ? 'bg-red-100' :
                'bg-purple-100'
              }`}>
                {message.userId === user?.id ? (
                  <User className="h-5 w-5 text-blue-600" />
                ) : message.type === 'system' ? (
                  <AlertCircle className="h-5 w-5 text-gray-600" />
                ) : message.type === 'crisis-alert' ? (
                  <Shield className="h-5 w-5 text-red-600" />
                ) : (
                  <Heart className="h-5 w-5 text-purple-600" />
                )}
              </div>
              <div>
                <div className={`rounded-lg px-4 py-2 ${
                  message.userId === user?.id ? 'bg-blue-600 text-white' :
                  message.type === 'system' ? 'bg-yellow-50 text-gray-700 border border-yellow-200' :
                  message.type === 'crisis-alert' ? 'bg-red-50 text-red-700 border border-red-200' :
                  'bg-white text-gray-900 shadow-sm'
                }`}>
                  {message.content}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {message.metadata?.edited && ' (edited)'}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {counselorTyping && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 bg-white rounded-lg px-4 py-2 shadow-sm">
              <div className="flex space-x-1">
                <div className="h-2 w-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="h-2 w-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="h-2 w-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-xs text-gray-500">Counselor is typing...</span>
            </div>
          </div>
        )}
        
        {/* Queue Status */}
        {queuePosition && (
          <div className="flex justify-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700">
                  Position in queue: {queuePosition}
                  {estimatedWaitTime && ` • Est. wait: ${Math.ceil(estimatedWaitTime / 60)} min`}
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {!isConnected ? (
        <div className="p-4 border-t border-gray-200 bg-white rounded-b-xl">
          {connectionStatus !== 'connected' ? (
            <div className="text-center py-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Establishing secure connection...</p>
            </div>
          ) : (
            <>
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isConnecting ? (
                  <>
                    <Clock className="h-5 w-5 animate-spin" />
                    <span>Connecting to counselor...</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5" />
                    <span>Connect with Crisis Counselor</span>
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Free, confidential, and available 24/7 • Encrypted connection
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="p-4 border-t border-gray-200 bg-white rounded-b-xl">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                if (e.target.value) handleUserTypingStart();
                else handleUserTypingStop();
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500 flex items-center space-x-1">
              <Shield className="h-3 w-3" />
              <span>End-to-end encrypted • Your privacy is protected</span>
            </p>
            <button
              onClick={() => window.location.href = 'tel:988'}
              className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center space-x-1"
            >
              <Phone className="h-3 w-3" />
              <span>Call 988</span>
            </button>
          </div>
        </div>
      )}

      {/* Emergency Prompt Modal */}
      {showEmergencyPrompt && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 rounded-xl z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="h-8 w-8 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">Immediate Support Available</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Based on what you've shared, I want to make sure you get the best support possible. 
              Would you like to speak with someone on the phone right now?
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleEmergencyResponse('call')}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Call 988 Now
              </button>
              <button
                onClick={() => handleEmergencyResponse('continue')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Continue Chatting
              </button>
              <button
                onClick={() => handleEmergencyResponse('dismiss')}
                className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                I'm Okay For Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}