import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Smile, Heart, Brain, Shield, Clock, 
  MoreVertical, X, ArrowLeft, MessageCircle,
  Sparkles, Activity, User
} from 'lucide-react';
import { Therapist } from './TherapistSelector';
import { useAITherapist, TherapistMessage } from '../../hooks/useAITherapist';

interface TherapistChatProps {
  therapist: Therapist;
  onBack?: () => void;
  sessionId?: string;
  fullScreen?: boolean;
}

const TherapistChat: React.FC<TherapistChatProps> = ({ 
  therapist, 
  onBack, 
  sessionId,
  fullScreen = true 
}) => {
  const { session, isTyping, isConnected, sendMessage, endSession } = useAITherapist({ therapist, sessionId });
  const [inputText, setInputText] = useState('');
  const [showSessionInfo, setShowSessionInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages, isTyping]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isTyping) return;
    
    await sendMessage(inputText);
    setInputText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const renderMessage = (message: TherapistMessage, index: number) => {
    const isTherapist = message.sender === 'therapist';
    const showAvatar = index === 0 || 
      session?.messages[index - 1]?.sender !== message.sender;

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex items-start space-x-3 mb-4 ${!isTherapist ? 'flex-row-reverse space-x-reverse' : ''}`}
      >
        {/* Avatar */}
        {showAvatar && (
          <div className={`flex-shrink-0 ${isTherapist ? '' : 'hidden'}`}>
            <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${therapist.color} flex items-center justify-center text-white text-lg`}>
              {therapist.avatar}
            </div>
          </div>
        )}
        
        {/* Message bubble */}
        <div className={`flex-1 max-w-[80%] ${showAvatar ? '' : isTherapist ? 'ml-13' : 'mr-13'}`}>
          <div className={`rounded-2xl px-4 py-3 ${
            isTherapist 
              ? 'bg-gray-100 text-gray-900' 
              : 'bg-gradient-to-r from-console-accent to-blue-500 text-white'
          }`}>
            <p className="text-sm leading-relaxed">{message.text}</p>
            
            {/* Techniques used (for therapist messages) */}
            {isTherapist && message.techniques && message.techniques.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex flex-wrap gap-1">
                  {message.techniques.map(technique => (
                    <span 
                      key={technique}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                    >
                      {technique}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Timestamp */}
          <p className={`text-xs text-gray-500 mt-1 ${isTherapist ? 'text-left' : 'text-right'}`}>
            {formatTime(new Date(message.timestamp))}
          </p>
        </div>
      </motion.div>
    );
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-console-accent border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white text-lg">Connecting to {therapist.name}...</p>
          <p className="text-gray-300 text-sm mt-2">Preparing your therapy session</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 ${fullScreen ? '' : 'rounded-2xl overflow-hidden'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800/95 to-gray-700/95 backdrop-blur-md border-b border-gray-700/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            
            <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${therapist.color} flex items-center justify-center text-white text-xl`}>
              {therapist.avatar}
            </div>
            
            <div>
              <h2 className="text-white font-semibold">{therapist.name}</h2>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-gray-300">Online</span>
                </div>
                <span className="text-gray-400 text-xs">•</span>
                <span className="text-xs text-gray-300">{therapist.specialty}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSessionInfo(!showSessionInfo)}
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Session Info Panel */}
      <AnimatePresence>
        {showSessionInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-800/50 border-b border-gray-700/50 px-4 py-3"
          >
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-white">{session?.messages.length || 0}</div>
                <div className="text-xs text-gray-400">Messages</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-white">{session?.techniques.length || 0}</div>
                <div className="text-xs text-gray-400">Techniques</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-white">
                  {session ? Math.floor((Date.now() - session.startTime.getTime()) / 60000) : 0}m
                </div>
                <div className="text-xs text-gray-400">Duration</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {session?.messages.map((message, index) => renderMessage(message, index))}
        
        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-start space-x-3"
            >
              <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${therapist.color} flex items-center justify-center text-white text-lg`}>
                {therapist.avatar}
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="bg-gray-800/50 border-t border-gray-700/50 p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share your thoughts..."
              disabled={isTyping}
              className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-console-accent disabled:opacity-50"
            />
            
            {/* Quick reactions */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-1">
              <button className="text-gray-400 hover:text-yellow-400 transition-colors">
                <Smile className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping}
            className="bg-gradient-to-r from-console-accent to-blue-500 text-white p-3 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-console-glow transition-all duration-200"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>

        {/* Helpful suggestions */}
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            "I'm feeling anxious about...",
            "I've been struggling with...",
            "Can you help me understand...",
            "I'm worried about..."
          ].map(suggestion => (
            <button
              key={suggestion}
              onClick={() => setInputText(suggestion)}
              className="text-xs bg-gray-700/50 text-gray-300 hover:text-white hover:bg-gray-600/50 px-3 py-1 rounded-full transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Privacy notice */}
      <div className="bg-gray-900/50 px-4 py-2 text-center">
        <div className="flex items-center justify-center space-x-2">
          <Shield className="h-4 w-4 text-gray-400" />
          <span className="text-xs text-gray-400">
            Your conversation is private and secure • AI Therapeutic Support
          </span>
        </div>
      </div>
    </div>
  );
};

export default TherapistChat;