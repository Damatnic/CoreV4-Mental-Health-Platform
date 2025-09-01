/**
 * Voice Navigation Component
 * Advanced accessibility feature for hands-free navigation
 * Especially critical for users in crisis situations or with motor impairments
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccessibilityStore } from '../../stores/accessibilityStore';

interface VoiceCommand {
  phrase: string;
  action: () => void;
  priority: 'high' | 'medium' | 'low';
  description: string;
}

export const VoiceNavigation: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useAccessibilityStore();
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [confidence, setConfidence] = useState(0);
  
  // Voice commands with crisis-focused priority
  const commands: VoiceCommand[] = [
    // CRISIS COMMANDS - HIGHEST PRIORITY
    {
      phrase: 'crisis help',
      action: () => navigate('/crisis'),
      priority: 'high',
      description: 'Navigate to crisis intervention resources'
    },
    {
      phrase: 'emergency',
      action: () => navigate('/crisis'),
      priority: 'high', 
      description: 'Access emergency mental health support'
    },
    {
      phrase: 'call nine eight eight',
      action: () => window.location.href = 'tel:988',
      priority: 'high',
      description: 'Call crisis lifeline'
    },
    {
      phrase: 'help me now',
      action: () => navigate('/crisis'),
      priority: 'high',
      description: 'Immediate crisis assistance'
    },
    
    // NAVIGATION COMMANDS
    {
      phrase: 'go home',
      action: () => navigate('/'),
      priority: 'medium',
      description: 'Navigate to home dashboard'
    },
    {
      phrase: 'dashboard',
      action: () => navigate('/dashboard'),
      priority: 'medium',
      description: 'Navigate to main dashboard'
    },
    {
      phrase: 'wellness',
      action: () => navigate('/wellness'),
      priority: 'medium',
      description: 'Navigate to wellness tracking'
    },
    {
      phrase: 'community',
      action: () => navigate('/community'),
      priority: 'medium',
      description: 'Navigate to community support'
    },
    {
      phrase: 'professional',
      action: () => navigate('/professional'),
      priority: 'medium',
      description: 'Navigate to professional resources'
    },
    
    // ACCESSIBILITY COMMANDS
    {
      phrase: 'high contrast',
      action: () => useAccessibilityStore.getState().toggleHighContrast(),
      priority: 'low',
      description: 'Toggle high contrast mode'
    },
    {
      phrase: 'larger text',
      action: () => useAccessibilityStore.getState().increaseFontSize(),
      priority: 'low',
      description: 'Increase text size'
    },
    {
      phrase: 'smaller text',
      action: () => useAccessibilityStore.getState().decreaseFontSize(),
      priority: 'low',
      description: 'Decrease text size'
    },
    {
      phrase: 'stop voice',
      action: () => setIsListening(false),
      priority: 'medium',
      description: 'Stop voice recognition'
    }
  ];

  // Initialize speech recognition
  useEffect(() => {
    if (!settings.voiceNavigation || !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = 'en-US';
    recognitionInstance.maxAlternatives = 3;

    recognitionInstance.onresult = (event: any) => {
      const lastResult = event.results[event.results.length - 1];
      if (lastResult.isFinal) {
        const transcript = lastResult[0].transcript.toLowerCase().trim();
        const confidence = lastResult[0].confidence;
        
        setConfidence(confidence);
        
        // Find matching command (prioritize high-priority commands)
        const sortedCommands = commands.sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
        
        for (const command of sortedCommands) {
          if (transcript.includes(command.phrase)) {
            // Higher confidence threshold for crisis commands for safety
            const requiredConfidence = command.priority === 'high' ? 0.7 : 0.6;
            
            if (confidence >= requiredConfidence) {
              // Announce what action is being taken
              announceAction(command.description);
              command.action();
              break;
            }
          }
        }
      }
    };

    recognitionInstance.onstart = () => {
      setIsListening(true);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
      // Auto-restart for continuous listening if enabled
      if (settings.voiceNavigation) {
        setTimeout(() => {
          try {
            recognitionInstance.start();
          } catch (error) {
            console.warn('Voice recognition restart failed:', error);
          }
        }, 1000);
      }
    };

    recognitionInstance.onerror = (event: any) => {
      console.warn('Voice recognition error:', event.error);
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        // These are expected errors, don't show to user
        return;
      }
      setIsListening(false);
    };

    setRecognition(recognitionInstance);

    return () => {
      recognitionInstance.stop();
    };
  }, [settings.voiceNavigation, navigate]);

  // Announce actions using speech synthesis
  const announceAction = useCallback((message: string) => {
    if ('speechSynthesis' in window && settings.voiceFeedback) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 0.7;
      speechSynthesis.speak(utterance);
    }
  }, [settings.voiceFeedback]);

  // Start/stop voice recognition
  const toggleVoiceRecognition = useCallback(() => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      announceAction('Voice navigation stopped');
    } else {
      try {
        recognition.start();
        announceAction('Voice navigation started. Say "crisis help" for emergency assistance.');
      } catch (error) {
        console.error('Failed to start voice recognition:', error);
      }
    }
  }, [recognition, isListening, announceAction]);

  // Don't render if voice navigation is disabled
  if (!settings.voiceNavigation) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={toggleVoiceRecognition}
        className={`
          flex items-center justify-center w-14 h-14 rounded-full shadow-lg
          transition-all duration-200 transform hover:scale-105 focus:scale-105
          ${isListening 
            ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
            : 'bg-blue-600 hover:bg-blue-700'
          }
          text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        `}
        aria-label={isListening ? 'Stop voice navigation' : 'Start voice navigation'}
        title={isListening ? 'Voice navigation active - click to stop' : 'Click to start voice navigation'}
      >
        {isListening ? (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        )}
      </button>
      
      {/* Voice recognition status indicator */}
      {isListening && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
          <div className="bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm whitespace-nowrap">
            Listening... {confidence > 0 && `(${Math.round(confidence * 100)}%)`}
          </div>
        </div>
      )}
      
      {/* Available commands help */}
      <div className="absolute bottom-16 right-0 hidden group-hover:block">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-xs">
          <h3 className="font-semibold text-sm mb-2">Voice Commands</h3>
          <div className="space-y-1 text-xs">
            <div className="text-red-600 font-medium">Crisis Commands:</div>
            <div>"crisis help", "emergency", "help me now"</div>
            <div className="text-blue-600 font-medium mt-2">Navigation:</div>
            <div>"dashboard", "wellness", "community"</div>
            <div className="text-gray-600 font-medium mt-2">Accessibility:</div>
            <div>"high contrast", "larger text", "stop voice"</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Type declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Speech Recognition interfaces
interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}