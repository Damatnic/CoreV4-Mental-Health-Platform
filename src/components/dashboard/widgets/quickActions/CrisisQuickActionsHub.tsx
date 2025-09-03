import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, MessageSquare, MapPin, Shield, Heart, Users,
  AlertCircle, Activity, Brain, _Headphones, _Navigation,
  _Clock, CheckCircle, _XCircle, ChevronRight, _Volume2,
  _Zap, _Send, _Copy, Share2, ExternalLink, _Wifi, WifiOff, X
} from 'lucide-react';
import { useCrisisAssessment } from '../../../../hooks/useCrisisAssessment';
import { useGeolocation } from '../../../../hooks/useGeolocation';

interface CrisisQuickActionsHubProps {
  _userId: string;
  onActionTaken?: (action: string, details?: unknown) => void;
  emergencyContacts?: EmergencyContact[];
  safetyPlan?: SafetyPlan;
}

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isAvailable?: boolean;
  isPrimary?: boolean;
}

interface SafetyPlan {
  warningSignals: string[];
  copingStrategies: string[];
  safetyContacts: EmergencyContact[];
  professionalContacts: ProfessionalContact[];
  safeLocations: string[];
  reasonsToLive: string[];
}

interface ProfessionalContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  available247?: boolean;
}

export function CrisisQuickActionsHub({
  _userId,
  onActionTaken,
  emergencyContacts = [],
  safetyPlan
}: CrisisQuickActionsHubProps) {
  const { assessmentData, _isAssessing, _updateAssessment } = useCrisisAssessment();
  const { location, _error: _locationError, loading } = useGeolocation();
  
  const [___activeAction, _setActiveAction] = useState<string | null>(null);
  const [showSafetyPlan, _setShowSafetyPlan] = useState(false);
  const [___showGroundingExercise, _setShowGroundingExercise] = useState(false);
  const [___breathingActive, _setBreathingActive] = useState(false);
  const [___emergencyCallInProgress, _setEmergencyCallInProgress] = useState(false);
  const [___copiedToClipboard, _setCopiedToClipboard] = useState<string | null>(null);
  const [___offlineMode, _setOfflineMode] = useState(!navigator.onLine);

  // Emergency hotlines
  const emergencyHotlines = [
    {
      id: '988',
      name: '988 Suicide & Crisis Lifeline',
      number: '988',
      description: '24/7 crisis support',
      type: 'crisis',
      available247: true
    },
    {
      id: 'crisis-text',
      name: 'Crisis Text Line',
      number: '741741',
      description: 'Text HOME to 741741',
      type: 'text',
      available247: true
    },
    {
      id: '911',
      name: 'Emergency Services',
      number: '911',
      description: 'Immediate emergency help',
      type: 'emergency',
      available247: true
    }
  ];

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setOfflineMode(false);
    const handleOffline = () => setOfflineMode(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle emergency call
  const handleEmergencyCall = useCallback((number: string, name: string) => {
    setEmergencyCallInProgress(true);
    setActiveAction('calling');
    
    // Attempt to make call
    window.location.href = `tel:${number}`;
    
    // Log action
    onActionTaken?.('emergency_call', {
      number,
      name,
      timestamp: new Date().toISOString(),
      location
    });
    
    // Reset after delay
    setTimeout(() => {
      setEmergencyCallInProgress(false);
      setActiveAction(null);
    }, 3000);
  }, [location, onActionTaken]);

  // Handle text crisis line
  const __handleCrisisText   = useCallback((number: string) => {
    setActiveAction('texting');
    
    // Attempt to open SMS
    window.location.href = `sms:${number}?body=HOME`;
    
    onActionTaken?.('crisis_text', {
      number,
      timestamp: new Date().toISOString()
    });
    
    setTimeout(() => setActiveAction(null), 3000);
  }, [onActionTaken]);

  // Share location for emergency
  const __shareEmergencyLocation   = useCallback(async () => {
    if (location) {
      const googleMapsUrl = `https://www.google.com/maps?q=${location.coords.latitude},${location.coords.longitude}`;
      const _message = `Emergency: I need help. My location: ${googleMapsUrl}`;
      
      // Copy to clipboard
      navigator.clipboard.writeText(_message);
      setCopiedToClipboard('location');
      
      onActionTaken?.('location_shared', {
        location,
        timestamp: new Date().toISOString()
      });
      
      setTimeout(() => setCopiedToClipboard(null), 3000);
    }
  }, [location, onActionTaken]);

  // Start grounding exercise
  const __startGroundingExercise   = useCallback(() => {
    setShowGroundingExercise(true);
    setActiveAction('grounding');
    
    onActionTaken?.('grounding_started', {
      timestamp: new Date().toISOString()
    });
  }, [onActionTaken]);

  // Start breathing exercise
  const __startBreathingExercise   = useCallback(() => {
    setBreathingActive(true);
    setActiveAction('breathing');
    
    onActionTaken?.('breathing_started', {
      timestamp: new Date().toISOString()
    });
  }, [onActionTaken]);

  // Get crisis level color based on assessment data
  const getCrisisLevelColor = () => {
    if (!assessmentData?.overallRisk) return 'blue';
    
    if (assessmentData.overallRisk >= 8) return 'red';      // Critical
    if (assessmentData.overallRisk >= 6) return 'orange';   // High
    if (assessmentData.overallRisk >= 4) return 'yellow';   // Moderate
    return 'green';                                         // Low
  };

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden">
      {/* Crisis Level Header */}
      <div className={`bg-gradient-to-r from-${getCrisisLevelColor()}-500 to-${getCrisisLevelColor()}-600 p-4 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-6 w-6 animate-pulse" />
            <div>
              <h2 className="text-lg font-bold">Crisis Support Hub</h2>
              <p className="text-sm opacity-90">Immediate help available 24/7</p>
            </div>
          </div>
          
          {offlineMode && (
            <div className="flex items-center space-x-1 px-2 py-1 bg-white bg-opacity-20 rounded-lg">
              <WifiOff className="h-4 w-4" />
              <span className="text-xs">Offline Mode</span>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Hotlines - Always Visible */}
      <div className="p-4 bg-red-50 border-b border-red-200">
        <h3 className="text-sm font-semibold text-red-900 mb-3">Emergency Hotlines</h3>
        <div className="space-y-2">
          {emergencyHotlines.map(hotline => (
            <motion.button
              key={hotline.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (hotline.type === 'text') {
                  handleCrisisText(hotline.number);
                } else {
                  handleEmergencyCall(hotline.number, hotline.name);
                }
              }}
              className={`
                w-full p-3 rounded-lg flex items-center justify-between
                ${hotline.type === 'emergency' 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-white border border-red-300 hover:border-red-400 text-gray-900'
                }
                transition-all shadow-sm hover:shadow-md
              `}
              disabled={emergencyCallInProgress}
            >
              <div className="flex items-center space-x-3">
                {hotline.type === 'text' ? (
                  <MessageSquare className="h-5 w-5" />
                ) : (
                  <Phone className="h-5 w-5" />
                )}
                <div className="text-left">
                  <div className="font-semibold">{hotline.name}</div>
                  <div className={`text-xs ${hotline.type === 'emergency' ? 'text-red-100' : 'text-gray-500'}`}>
                    {hotline.description}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg">{hotline.number}</span>
                {hotline.available247 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    hotline.type === 'emergency' 
                      ? 'bg-red-700 text-red-100' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    24/7
                  </span>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Quick Crisis Actions */}
      <div className="p-4 space-y-3">
        {/* GPS Location Sharing */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={shareEmergencyLocation}
          disabled={loading}
          className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <MapPin className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Share Emergency Location</div>
              <div className="text-xs text-blue-100">Send GPS coordinates to contacts</div>
            </div>
          </div>
          
          {copiedToClipboard === 'location' ? (
            <CheckCircle className="h-5 w-5" />
          ) : loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          ) : (
            <Share2 className="h-5 w-5" />
          )}
        </motion.button>

        {/* Crisis Buddy Contact */}
        {emergencyContacts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">Crisis Buddies</h4>
            {emergencyContacts.slice(0, 2).map(contact => (
              <motion.button
                key={contact.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleEmergencyCall(contact.phone, contact.name)}
                className="w-full p-3 bg-white border border-gray-300 rounded-lg hover:border-blue-400 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div className="text-left">
                      <div className="font-medium">{contact.name}</div>
                      <div className="text-xs text-gray-500">{contact.relationship}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {contact.isAvailable && (
                      <span className="w-2 h-2 bg-green-500 rounded-full" />
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {/* Safety Plan Access */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowSafetyPlan(!showSafetyPlan)}
          className="w-full p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <Shield className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Safety Plan</div>
              <div className="text-xs text-purple-100">Access your personalized safety plan</div>
            </div>
          </div>
          <ChevronRight className={`h-5 w-5 transform transition-transform ${showSafetyPlan ? 'rotate-90' : ''}`} />
        </motion.button>

        {/* Grounding Techniques */}
        <div className="grid grid-cols-2 gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGroundingExercise}
            className="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
          >
            <Brain className="h-5 w-5 mx-auto mb-1" />
            <div className="text-xs font-semibold">Grounding</div>
            <div className="text-xs opacity-80">5-4-3-2-1</div>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startBreathingExercise}
            className="p-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-all"
          >
            <Activity className="h-5 w-5 mx-auto mb-1" />
            <div className="text-xs font-semibold">Breathe</div>
            <div className="text-xs opacity-80">4-7-8 Pattern</div>
          </motion.button>
        </div>

        {/* Crisis Chat */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            onActionTaken?.('crisis_chat_opened', { timestamp: new Date().toISOString() });
          }}
          className="w-full p-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <MessageSquare className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Crisis Chat</div>
              <div className="text-xs text-indigo-100">Connect with a counselor online</div>
            </div>
          </div>
          <ExternalLink className="h-4 w-4" />
        </motion.button>
      </div>

      {/* Safety Plan Expansion */}
      <AnimatePresence>
        {showSafetyPlan && safetyPlan && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 space-y-3"
          >
            <div className="p-3 bg-yellow-50 rounded-lg">
              <h4 className="text-sm font-semibold text-yellow-900 mb-2">Warning Signals</h4>
              <ul className="text-xs text-yellow-700 space-y-1">
                {safetyPlan.warningSignals.slice(0, 3).map((signal, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{signal}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="text-sm font-semibold text-green-900 mb-2">Coping Strategies</h4>
              <ul className="text-xs text-green-700 space-y-1">
                {safetyPlan.copingStrategies.slice(0, 3).map((strategy, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{strategy}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Reasons to Live</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                {safetyPlan.reasonsToLive.slice(0, 3).map((reason, idx) => (
                  <li key={idx} className="flex items-start">
                    <Heart className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0 text-red-500" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grounding Exercise Modal */}
      {showGroundingExercise && (
        <GroundingExerciseModal
          onClose={() => {
            setShowGroundingExercise(false);
            setActiveAction(null);
          }}
          onComplete={() => {
            onActionTaken?.('grounding_completed', { timestamp: new Date().toISOString() });
          }}
        />
      )}

      {/* Breathing Exercise Overlay */}
      {breathingActive && (
        <BreathingExerciseOverlay
          onClose={() => {
            setBreathingActive(false);
            setActiveAction(null);
          }}
          onComplete={() => {
            onActionTaken?.('breathing_completed', { timestamp: new Date().toISOString() });
          }}
        />
      )}
    </div>
  );
}

// Grounding Exercise Modal Component
function GroundingExerciseModal({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [step, _setStep] = useState(0);
  const steps = [
    { sense: 'See', count: 5, instruction: 'Name 5 things you can see around you' },
    { sense: 'Touch', count: 4, instruction: 'Name 4 things you can touch' },
    { sense: 'Hear', count: 3, instruction: 'Name 3 things you can hear' },
    { sense: 'Smell', count: 2, instruction: 'Name 2 things you can smell' },
    { sense: 'Taste', count: 1, instruction: 'Name 1 thing you can taste' }
  ];

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl p-6 max-w-md w-full"
      >
        <h3 className="text-xl font-bold mb-4">5-4-3-2-1 Grounding Exercise</h3>
        
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 flex-1 mx-0.5 rounded-full ${
                  idx <= step ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          
          <div className="text-center py-8">
            {steps[step] && (
              <>
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {steps[step].count}
                </div>
                <div className="text-lg font-semibold mb-2">{steps[step].sense}</div>
                <p className="text-gray-600">{steps[step].instruction}</p>
              </>
            )}
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={nextStep}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            {step < steps.length - 1 ? 'Next' : 'Complete'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Breathing Exercise Overlay Component
function BreathingExerciseOverlay({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [phase, _setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [count, _setCount] = useState(0);
  const [cycles, _setCycles] = useState(0);

  useEffect(() => {
    const phases = {
      inhale: { duration: 4, next: 'hold' as const },
      hold: { duration: 7, next: 'exhale' as const },
      exhale: { duration: 8, next: 'inhale' as const }
    };

    const _timer = setInterval(() => {
      setCount(prev => {
        if (prev >= phases[phase].duration - 1) {
          const nextPhase = phases[phase].next;
          setPhase(_nextPhase);
          
          if (nextPhase === 'inhale') {
            setCycles(c => c + 1);
            if (cycles >= 3) {
              onComplete();
              onClose();
            }
          }
          
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(_timer);
  }, [phase, cycles, onComplete, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <motion.div
        animate={{
          scale: phase === 'inhale' ? 1.2 : phase === 'hold' ? 1.2 : 0.8
        }}
        transition={{ duration: phase === 'inhale' ? 4 : phase === 'hold' ? 0 : 8 }}
        className="relative"
      >
        <div className="w-48 h-48 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="text-3xl font-bold mb-2 capitalize">{phase}</div>
            <div className="text-5xl font-bold">{count + 1}</div>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
      
      <div className="absolute bottom-8 text-white text-center">
        <p className="text-sm opacity-80">Cycle {cycles + 1} of 4</p>
      </div>
    </div>
  );
}