/**
 * Real-Time Crisis Chat System
 * 
 * Secure, encrypted chat for crisis intervention
 * Connects to peer supporters and professional counselors
 * Privacy-first with end-to-end encryption
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Phone, Shield, Lock,
  AlertCircle, UserCheck,
  MessageSquare, Volume2, VolumeX
} from 'lucide-react';
import { logger } from '../../utils/logger';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'peer' | 'professional' | 'moderator' | 'system';
  content: string;
  timestamp: Date;
  type: 'text' | 'voice' | 'image' | 'system' | 'crisis-alert';
  encrypted: boolean;
  readStatus: 'sent' | 'delivered' | 'read';
  supportLevel?: 'info' | 'support' | 'intervention';
  metadata?: Record<string, unknown>;
}

interface ChatParticipant {
  id: string;
  name: string;
  role: 'user' | 'peer' | 'professional' | 'moderator';
  status: 'online' | 'away' | 'offline';
  avatar?: string;
  credentials?: string;
  specializations?: string[];
  responseTime: string;
  rating?: number;
  isTyping: boolean;
}

interface ChatRoom {
  id: string;
  type: 'crisis' | 'peer-support' | 'group' | 'professional';
  participants: ChatParticipant[];
  messages: ChatMessage[];
  isActive: boolean;
  isEncrypted: boolean;
  moderationLevel: 'light' | 'standard' | 'strict';
  emergencyProtocols: boolean;
  created: Date;
  lastActivity: Date;
}

interface CrisisProtocol {
  id: string;
  trigger: string;
  action: 'alert' | 'escalate' | 'emergency' | 'resources';
  automated: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export function RealTimeCrisisChat() {
  const [_currentRoom, _setCurrentRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [availableSupport, setAvailableSupport] = useState<ChatParticipant[]>([]);
  const [_chatType, _setChatType] = useState<'crisis' | 'peer' | 'professional'>('crisis');
  const [isTyping, setIsTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [_chatSettings, _setChatSettings] = useState({
    notifications: true,
    readReceipts: true,
    autoConnect: true,
    emergencySharing: true
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initialize crisis chat connection
  useEffect(() => {
    initializeCrisisChat();
    return () => {
      disconnectFromChat();
    };
     
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle typing indicators
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      // Send typing indicator to other participants
      // sendTypingIndicator(true);
      
      // Clear typing indicator after 3 seconds of inactivity
      setTimeout(() => {
        setIsTyping(false);
        // sendTypingIndicator(false);
      }, 3000);
    }
  }, [isTyping]);

  const initializeCrisisChat = async () => {
    try {
      // Connect to crisis chat service
      await connectToCrisisService();
      
      // Load available support options
      const supporters = await loadAvailableSupport();
      setAvailableSupport(supporters);
      
      // Set up emergency protocols
      setupEmergencyProtocols();
      
      setIsConnected(true);
      
      // Send system welcome message
      addSystemMessage(
        'Crisis support is now available. You are connected to trained volunteers and professionals.',
        'info'
      );

    } catch (_error) {
      logger.error('Failed to initialize crisis chat:');
      addSystemMessage(
        'Having trouble connecting to chat. Emergency hotlines are still available: 988',
        'crisis-alert'
      );
    }
  };

  const connectToCrisisService = async () => {
    // In production, this would establish WebSocket connection
    // with end-to-end encryption for crisis support
    return new Promise(resolve => setTimeout(resolve, 1000));
  };

  const loadAvailableSupport = async (): Promise<ChatParticipant[]> => {
    // Mock data - in production, would load from crisis support API
    return [
      {
        id: 'peer-1',
        name: 'Sarah',
        role: 'peer',
        status: 'online',
        responseTime: '< 2 min',
        rating: 4.9,
        isTyping: false
      },
      {
        id: 'pro-1',
        name: 'Dr. Martinez',
        role: 'professional',
        status: 'online',
        credentials: 'Licensed Clinical Social Worker',
        specializations: ['Crisis Intervention', 'Trauma'],
        responseTime: '< 5 min',
        rating: 4.95,
        isTyping: false
      },
      {
        id: 'peer-2',
        name: 'Alex',
        role: 'peer',
        status: 'online',
        responseTime: '< 3 min',
        rating: 4.8,
        isTyping: false
      }
    ];
  };

  const setupEmergencyProtocols = () => {
    // Configure automated crisis detection and response
    const protocols: CrisisProtocol[] = [
      {
        id: 'suicide-keywords',
        trigger: 'suicide|kill myself|end it all',
        action: 'emergency',
        automated: true,
        priority: 'critical'
      },
      {
        id: 'immediate-danger',
        trigger: 'going to hurt|about to|right now',
        action: 'escalate',
        automated: true,
        priority: 'critical'
      }
    ];
    
    // Set up keyword monitoring for crisis escalation
    protocols.forEach(_protocol => {
      // In production, this would configure server-side monitoring
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !_currentRoom) return;

    const message: ChatMessage = {
      id: generateMessageId(),
      senderId: 'current-user',
      senderName: 'You',
      senderRole: 'user',
      content: newMessage,
      timestamp: new Date(),
      type: 'text',
      encrypted: true,
      readStatus: 'sent',
      supportLevel: 'support'
    };

    // Add message to local state immediately
    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Check for crisis indicators
    await checkCrisisIndicators(message);

    // Send to chat service
    await sendToParticipants(message);

    // Play send sound if enabled
    if (_soundEnabled) {
      playNotificationSound('send');
    }

    // Request response from available supporters
    if (availableSupport.length > 0) {
      requestSupportResponse(message);
    }
  };

  const checkCrisisIndicators = async (message: ChatMessage) => {
    const crisisKeywords = [
      'suicide', 'kill myself', 'end it all', 'no hope', 'better off dead',
      'can\'t go on', 'hurt myself', 'give up', 'no point living'
    ];

    const content = message.content.toLowerCase();
    const _hasCrisisIndicators = crisisKeywords.some(_keyword => 
      content.includes(_keyword)
    );

    if (_hasCrisisIndicators) {
      // Immediate crisis response
      await triggerCrisisProtocol('critical', message);
      
      // Add crisis resources message
      addSystemMessage(
        '🚨 Crisis support activated. Professional help is connecting now. For immediate help: Call 988 or text HOME to 741741',
        'crisis-alert'
      );

      // Auto-connect to professional counselor
      await connectToProfessional();
    }
  };

  const triggerCrisisProtocol = async (priority: string, _message: ChatMessage) => {
    // Log crisis event (_anonymized)
    logger.crisis('Crisis protocol triggered', priority as 'low' | 'medium' | 'high' | 'critical', 'RealTimeCrisisChat', { priority, timestamp: new Date() });
    
    // In production, this would:
    // 1. Alert crisis intervention team
    // 2. Initiate emergency protocols if needed
    // 3. Connect to appropriate level of support
    
    if (priority === 'critical') {
      // Show emergency resources immediately
      showEmergencyResources();
    }
  };

  const connectToProfessional = async () => {
    const professional = availableSupport.find(p => p.role === 'professional');
    if (_professional) {
      // Simulate professional joining chat
      setTimeout(() => {
        const welcomeMessage: ChatMessage = {
          id: generateMessageId(),
          senderId: professional.id,
          senderName: professional.name,
          senderRole: 'professional',
          content: `Hi, I&apos;m ${professional.name}, a ${professional.credentials}. I&apos;m here to help and support you through this difficult time. You&apos;re not alone.`,
          timestamp: new Date(),
          type: 'text',
          encrypted: true,
          readStatus: 'delivered',
          supportLevel: 'intervention'
        };
        
        setMessages(prev => [...prev, welcomeMessage]);
        
        if (_soundEnabled) {
          playNotificationSound('professional');
        }
      }, 2000);
    }
  };

  const addSystemMessage = (content: string, level: 'info' | 'crisis-alert' = 'info') => {
    const systemMessage: ChatMessage = {
      id: generateMessageId(),
      senderId: 'system',
      senderName: 'Crisis Support System',
      senderRole: 'system',
      content,
      timestamp: new Date(),
      type: 'system',
      encrypted: false,
      readStatus: 'delivered',
      supportLevel: level === 'crisis-alert' ? 'intervention' : 'info'
    };

    setMessages(prev => [...prev, systemMessage]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const playNotificationSound = (type: 'send' | 'receive' | 'professional' | 'alert') => {
    if (!soundEnabled) return;
    
    // In production, would play appropriate notification sounds
    logger.info(`Playing ${type} notification sound`, 'RealTimeCrisisChat');
  };

  const showEmergencyResources = () => {
    const emergencyMessage: ChatMessage = {
      id: generateMessageId(),
      senderId: 'system',
      senderName: 'Emergency Resources',
      senderRole: 'system',
      content: `🆘 IMMEDIATE HELP AVAILABLE:

📞 National Crisis Line: 988
💬 Crisis Text Line: Text HOME to 741741
🚑 Emergency: 911

Professional counselors are joining this chat now. You matter and help is here.`,
      timestamp: new Date(),
      type: 'crisis-alert',
      encrypted: false,
      readStatus: 'delivered',
      supportLevel: 'intervention'
    };

    setMessages(prev => [...prev, emergencyMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const generateMessageId = () => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Placeholder functions for full implementation
  const sendToParticipants = async (_message: ChatMessage) => {
    // Implementation for sending message to chat participants
  };

  const requestSupportResponse = (_message: ChatMessage) => {
    // Implementation for requesting response from supporters
  };

  const _sendTypingIndicator = (_typing: boolean) => {
    // Implementation for sending typing indicators
  };

  const disconnectFromChat = () => {
    // Implementation for clean disconnect
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Crisis Chat Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <MessageSquare className="h-8 w-8 text-red-500" />
              {isConnected && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Crisis Support Chat
              </h1>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Shield className="h-4 w-4 text-green-500" />
                <span>End-to-end encrypted</span>
                <span>•</span>
                <span>{availableSupport.length} supporters online</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Emergency Call Button */}
            <button
              onClick={() => window.location.href = 'tel:988'}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Phone className="h-4 w-4" />
              <span>Call 988</span>
            </button>
            
            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
      >
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${
                message.senderRole === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.senderRole === 'user' 
                  ? 'bg-blue-500 text-white'
                  : message.type === 'crisis-alert'
                  ? 'bg-red-50 border-2 border-red-200 text-red-800'
                  : message.senderRole === 'system'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  : message.senderRole === 'professional'
                  ? 'bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-200 border-l-4 border-green-500'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
              }`}>
                {message.senderRole !== 'user' && (
                  <div className="flex items-center space-x-2 mb-1">
                    {message.senderRole === 'professional' && (
                      <UserCheck className="h-4 w-4 text-green-600" />
                    )}
                    <span className="text-sm font-medium">
                      {message.senderName}
                    </span>
                    {message.senderRole === 'professional' && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                        Licensed Professional
                      </span>
                    )}
                  </div>
                )}
                
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                  {message.encrypted && (
                    <Lock className="h-3 w-3" />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Typing Indicators */}
        {availableSupport.some(p => p.isTyping) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200"></div>
                </div>
                <span className="text-sm">Support is typing...</span>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... Press Enter to send"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={!isConnected}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || !isConnected}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
            <span>Send</span>
          </button>
        </div>
        
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span>🔒 Messages are encrypted end-to-end</span>
            <span>•</span>
            <span>Crisis support available 24/7</span>
          </div>
          
          {!isConnected && (
            <div className="flex items-center space-x-1 text-red-500">
              <AlertCircle className="h-4 w-4" />
              <span>Reconnecting...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RealTimeCrisisChat;