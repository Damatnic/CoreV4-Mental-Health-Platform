import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Heart, AlertCircle, Clock, Phone, Shield } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'counselor' | 'system';
  timestamp: Date;
  isTyping?: boolean;
}

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

export function CrisisChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [counselorTyping, setCounselorTyping] = useState(false);
  const [detectedCrisisLevel, setDetectedCrisisLevel] = useState<string | null>(null);
  const [showEmergencyPrompt, setShowEmergencyPrompt] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initialize chat with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      text: "Welcome to Crisis Chat. You can connect with a trained crisis counselor for support. Everything you share here is confidential and anonymous.",
      sender: 'system',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Detect crisis level in messages
  const detectCrisisLevel = (text: string): string | null => {
    const lowerText = text.toLowerCase();
    
    for (const crisis of CRISIS_KEYWORDS) {
      for (const _keyword of crisis.keywords) {
        if (lowerText.includes(_keyword)) {
          return crisis.level;
        }
      }
    }
    return null;
  };

  // Handle connecting to counselor
  const handleConnect = async () => {
    setIsConnecting(true);
    
    // Simulate connection delay
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      
      const connectMessage: Message = {
        id: `msg-${Date.now()}`,
        text: "You&apos;re now connected with a crisis counselor. How can I support you today?",
        sender: 'counselor',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, connectMessage]);
    }, 2000);
  };

  // Handle sending message
  const handleSendMessage = () => {
    if (!inputMessage.trim() || !isConnected) return;

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Check for crisis keywords
    const crisisLevel = detectCrisisLevel(_inputMessage);
    if (_crisisLevel) {
      setDetectedCrisisLevel(_crisisLevel);
      if (crisisLevel === 'critical') {
        setShowEmergencyPrompt(true);
      }
    }

    // Clear input
    setInputMessage('');

    // Simulate counselor typing
    setCounselorTyping(true);
    setTimeout(() => {
      setCounselorTyping(false);
      generateCounselorResponse(inputMessage, crisisLevel);
    }, 2000 + Math.random() * 2000);
  };

  // Generate automated counselor response (in production, this would connect to real counselors)
  const generateCounselorResponse = (userMessage: string, crisisLevel: string | null) => {
    let responseText = '';

    if (crisisLevel === 'critical') {
      responseText = "I&apos;m very concerned about what you&apos;ve shared. Your life has value and meaning. Would you like me to connect you with the 988 Suicide & Crisis Lifeline right now? They have trained counselors available 24/7. You can also call 988 directly or text HOME to 741741.";
    } else if (crisisLevel === 'high') {
      responseText = "I hear that you&apos;re going through a really difficult time. You don&apos;t have to face this alone. Let&apos;s talk about what&apos;s happening and explore some ways to help you feel safer. What&apos;s been the hardest part for you?";
    } else if (crisisLevel === 'medium') {
      responseText = "It sounds like you&apos;re feeling overwhelmed right now. That&apos;s completely understandable. Would you like to try some coping strategies together, or would you prefer to talk more about what&apos;s causing these feelings?";
    } else {
      // Context-aware responses based on keywords
      const lower = userMessage.toLowerCase();
      if (lower.includes('help')) {
        responseText = "I&apos;m here to help you. Can you tell me more about what you&apos;re experiencing right now?";
      } else if (lower.includes('alone')) {
        responseText = "You&apos;re not alone. I&apos;m here with you, and there are people who care about you. Let&apos;s talk about building your support network.";
      } else if (lower.includes('scared') || lower.includes('afraid')) {
        responseText = "It&apos;s okay to feel scared. You&apos;re safe here. Can you tell me what&apos;s making you feel afraid?";
      } else {
        responseText = "Thank you for sharing that with me. How long have you been feeling this way?";
      }
    }

    const counselorMessage: Message = {
      id: `msg-${Date.now()}`,
      text: responseText,
      sender: 'counselor',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, counselorMessage]);
  };

  // Handle emergency prompt response
  const handleEmergencyResponse = (action: 'call' | 'continue' | 'dismiss') => {
    setShowEmergencyPrompt(false);
    
    if (action === 'call') {
      window.location.href = 'tel:988';
    } else if (action === 'continue') {
      const message: Message = {
        id: `msg-${Date.now()}`,
        text: "I&apos;m staying here with you. Remember, you can always call 988 or text HOME to 741741 if you need immediate support. Let&apos;s focus on keeping you safe right now. What would help you feel a bit safer in this moment?",
        sender: 'counselor',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, message]);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Bot className="h-8 w-8" />
              {isConnected && (
                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white"></div>
              )}
            </div>
            <div>
              <h3 className="font-semibold">Crisis Chat Support</h3>
              <p className="text-sm opacity-90">
                {isConnected ? 'Connected to counselor' : 'Click below to connect'}
              </p>
            </div>
          </div>
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
        </div>
      </div>

      {/* Messages Area */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-2 max-w-[70%] ${
              message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}>
              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                message.sender === 'user' ? 'bg-blue-100' :
                message.sender === 'counselor' ? 'bg-purple-100' :
                'bg-gray-100'
              }`}>
                {message.sender === 'user' ? (
                  <User className="h-5 w-5 text-blue-600" />
                ) : message.sender === 'counselor' ? (
                  <Heart className="h-5 w-5 text-purple-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-gray-600" />
                )}
              </div>
              <div>
                <div className={`rounded-lg px-4 py-2 ${
                  message.sender === 'user' ? 'bg-blue-600 text-white' :
                  message.sender === 'counselor' ? 'bg-gray-100 text-gray-900' :
                  'bg-yellow-50 text-gray-700 border border-yellow-200'
                }`}>
                  {message.text}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {counselorTyping && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {!isConnected ? (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? (
              <span className="flex items-center justify-center space-x-2">
                <Clock className="h-5 w-5 animate-spin" />
                <span>Connecting...</span>
              </span>
            ) : (
              'Connect with Crisis Counselor'
            )}
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Free, confidential, and available 24/7
          </p>
        </div>
      ) : (
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">
              End-to-end encrypted • Your privacy is protected
            </p>
            <button
              onClick={() => window.location.href = 'tel:988'}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
            >
              <Phone className="h-3 w-3" />
              <span>Call 988</span>
            </button>
          </div>
        </div>
      )}

      {/* Emergency Prompt Modal */}
      {showEmergencyPrompt && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 rounded-xl">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="h-8 w-8 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">Immediate Support Available</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Based on what you&apos;ve shared, I want to make sure you get the best support possible. 
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
                I&apos;m Okay For Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}