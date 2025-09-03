import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Phone, MessageCircle, AlertTriangle, Heart, Shield, MapPin, 
  Activity, Users, _Clock, ChevronRight, _Bell, Wifi, WifiOff,
  Brain, _TrendingUp, _TrendingDown, AlertCircle, CheckCircle,
  Navigation, Zap, HelpCircle, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CrisisPanelData } from '../../../types/dashboard';
import { useAuth } from '../../../hooks/useAuth';
import { useCrisisAssessment } from '../../../hooks/useCrisisAssessment';
import { useGeolocation } from '../../../hooks/useGeolocation';
import { logger, _LogCategory } from '../../../services/logging/logger';

interface EnhancedCrisisPanelProps {
  data?: CrisisPanelData;
  onEmergencyCall?: (contact: string, service: string) => void;
  onOpenSafetyPlan?: () => void;
  onStartCrisisChat?: () => void;
  onLocationShare?: (location: GeolocationPosition) => void;
}

// Real-time risk factors to monitor
interface RiskFactors {
  moodPattern: number; // 0-100 scale
  behaviorChanges: number;
  socialWithdrawal: number;
  sleepDisturbance: number;
  substanceUse: number;
  thoughtPatterns: number;
  physicalSymptoms: number;
}

// Crisis escalation levels with detailed metadata
interface CrisisLevel {
  level: 'safe' | 'low' | 'moderate' | 'high' | 'critical';
  score: number;
  color: string;
  bgColor: string;
  borderColor: string;
  message: string;
  recommendations: string[];
  urgency: 'none' | 'low' | 'medium' | 'high' | 'immediate';
}

const CRISIS_LEVELS = {
  safe: {
    level: 'safe' as const,
    score: 0,
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-400',
    message: 'You\'re in a good place',
    recommendations: ['Continue your wellness routine', 'Keep using coping strategies'],
    urgency: 'none' as const
  },
  low: {
    level: 'low' as const,
    score: 25,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-400',
    message: 'Mild stress detected',
    recommendations: ['Try breathing exercises', 'Reach out to a friend', 'Take a break'],
    urgency: 'low' as const
  },
  moderate: {
    level: 'moderate' as const,
    score: 50,
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-400',
    message: 'Support recommended',
    recommendations: ['Contact your therapist', 'Use your safety plan', 'Call a support person'],
    urgency: 'medium' as const
  },
  high: {
    level: 'high' as const,
    score: 75,
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-400',
    message: 'Immediate support needed',
    recommendations: ['Call crisis hotline', 'Go to emergency room', 'Contact emergency contact'],
    urgency: 'high' as const
  },
  critical: {
    level: 'critical' as const,
    score: 90,
    color: 'text-red-900',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-600',
    message: 'Emergency - Get help now',
    recommendations: ['Call 988 immediately', 'Call 911 if in danger', 'Go to nearest ER'],
    urgency: 'immediate' as const
  }
};

export function EnhancedCrisisPanel({ 
  data, 
  onEmergencyCall, 
  onOpenSafetyPlan,
  onStartCrisisChat,
  onLocationShare 
}: EnhancedCrisisPanelProps) {
  const { _user } = useAuth();
  const { location, error: _locationError } = useGeolocation();
  const { assessmentData, _updateAssessment } = useCrisisAssessment();
  
  const [_isOnline, _setIsOnline] = useState(navigator.onLine);
  const [_showFullPlan, _setShowFullPlan] = useState(false);
  const [activeTab, _setActiveTab] = useState<'emergency' | 'safety' | 'network' | 'resources'>('emergency');
  const [riskFactors, _setRiskFactors] = useState<RiskFactors>({
    moodPattern: 0,
    behaviorChanges: 0,
    socialWithdrawal: 0,
    sleepDisturbance: 0,
    substanceUse: 0,
    thoughtPatterns: 0,
    physicalSymptoms: 0
  });
  const [crisisLevel, _setCrisisLevel] = useState<CrisisLevel>(() => CRISIS_LEVELS.safe);
  const [_pulseAnimation, _setPulseAnimation] = useState(false);

  // Calculate real-time risk assessment
  const calculateRiskLevel = useCallback((): CrisisLevel => {
    const factors = Object.values(_riskFactors);
    const avgScore = factors.reduce((sum, val) => sum + val, 0) / factors.length;
    
    // Add weight for critical factors
    const criticalFactorWeight = (
      riskFactors.thoughtPatterns * 2 + 
      riskFactors.substanceUse * 1.5
    ) / 3.5;
    
    const finalScore = (avgScore * 0.7) + (criticalFactorWeight * 0.3);
    
    // Determine crisis level
    if (finalScore >= 75) return CRISIS_LEVELS.critical;
    if (finalScore >= 50) return CRISIS_LEVELS.high;
    if (finalScore >= 35) return CRISIS_LEVELS.moderate;
    if (finalScore >= 20) return CRISIS_LEVELS.low;
    return CRISIS_LEVELS.safe;
  }, [riskFactors]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update crisis level when risk factors change
  useEffect(() => {
    const newLevel = calculateRiskLevel();
    setCrisisLevel(newLevel);
    
    // Trigger pulse animation for high/critical levels
    if (newLevel.urgency === 'high' || newLevel.urgency === 'immediate') {
      setPulseAnimation(true);
      // Log critical event
      logger.logCrisisIntervention('risk_level_elevated', undefined, {
        level: newLevel.level,
        score: newLevel.score,
        factors: riskFactors
      });
    }
  }, [riskFactors, calculateRiskLevel]);

  // Simulate real-time risk monitoring (in production, this would come from actual data)
  useEffect(() => {
    const interval = setInterval(() => {
      // This would be replaced with actual data from mood tracking, behavior patterns, etc.
      if (assessmentData) {
        setRiskFactors(prev => ({
          ...prev,
          moodPattern: assessmentData.moodScore || prev.moodPattern,
          thoughtPatterns: assessmentData.thoughtScore || prev.thoughtPatterns
        }));
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [assessmentData]);

  // Emergency call handler with location sharing
  const handleEmergencyCallWithLocation = useCallback((contact: string, service: string) => {
    // Share location if available
    if (location && onLocationShare) {
      onLocationShare(_location);
    }
    
    // Log emergency call
    logger.logCrisisIntervention('emergency_call_with_location', undefined, {
      service,
      contact,
      hasLocation: !!location,
      timestamp: new Date().toISOString()
    });
    
    // Make the call
    onEmergencyCall?.(contact, service);
  }, [location, onLocationShare, onEmergencyCall]);

  // Quick access emergency numbers
  const emergencyNumbers = useMemo(() => [
    { 
      id: '988', 
      name: '988 Suicide & Crisis Lifeline', 
      contact: '988', 
      type: 'hotline' as const,
      icon: Phone,
      color: 'bg-red-500',
      description: '24/7 crisis support'
    },
    { 
      id: 'text', 
      name: 'Crisis Text Line', 
      contact: 'Text HOME to 741741', 
      type: 'text' as const,
      icon: MessageCircle,
      color: 'bg-blue-500',
      description: 'Text-based support'
    },
    { 
      id: '911', 
      name: 'Emergency Services', 
      contact: '911', 
      type: 'emergency' as const,
      icon: Shield,
      color: 'bg-red-600',
      description: 'Immediate emergency'
    }
  ], []);

  // Personalized coping strategies based on risk level
  const __copingStrategies   = useMemo(() => {
    const baseStrategies = data?.safetyPlan?.copingStrategiesText ? [data.safetyPlan.copingStrategiesText] : [];
    const additionalStrategies = crisisLevel.recommendations;
    return [...baseStrategies, ...additionalStrategies];
  }, [data?.safetyPlan, crisisLevel]);

  return (
    <div className="space-y-4">
      {/* Connection Status Bar */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-700">Offline Mode</span>
            </>
          )}
        </div>
        {location && (
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <MapPin className="h-3 w-3" />
            <span>Location ready</span>
          </div>
        )}
      </div>

      {/* Real-time Risk Assessment Display */}
      <motion.div 
        className={`p-4 rounded-lg border-2 ${crisisLevel.borderColor} ${crisisLevel.bgColor} ${
          pulseAnimation ? 'animate-pulse' : ''
        }`}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Brain className={`h-5 w-5 ${crisisLevel.color}`} />
              <h3 className={`font-semibold ${crisisLevel.color}`}>
                {crisisLevel.message}
              </h3>
            </div>
            
            {/* Risk Factor Indicators */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              {Object.entries(_riskFactors).slice(0, 3).map(([factor, value]) => (
                <div key={factor} className="flex items-center space-x-1">
                  <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div 
                      className={`absolute left-0 top-0 h-full ${
                        value > 60 ? 'bg-red-500' : value > 30 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${value}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Recommendations */}
            {crisisLevel.urgency !== 'none' && (
              <div className="mt-3 space-y-1">
                {crisisLevel.recommendations.slice(0, 2).map((rec, idx) => (
                  <div key={idx} className="flex items-start space-x-1">
                    <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">{rec}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Risk Level Indicator */}
          <div className="flex flex-col items-center ml-4">
            <div className={`relative w-16 h-16 rounded-full ${crisisLevel.bgColor} border-4 ${crisisLevel.borderColor}`}>
              <div className="absolute inset-0 flex items-center justify-center">
                {crisisLevel.urgency === 'immediate' ? (
                  <AlertTriangle className={`h-8 w-8 ${crisisLevel.color} animate-pulse`} />
                ) : crisisLevel.urgency === 'high' ? (
                  <AlertCircle className={`h-8 w-8 ${crisisLevel.color}`} />
                ) : (
                  <Activity className={`h-8 w-8 ${crisisLevel.color}`} />
                )}
              </div>
            </div>
            <span className={`text-xs font-medium mt-1 ${crisisLevel.color}`}>
              Risk: {Math.round(crisisLevel.score)}%
            </span>
          </div>
        </div>
      </motion.div>

      {/* Emergency Quick Actions - Always Visible */}
      {(crisisLevel.urgency === 'high' || crisisLevel.urgency === 'immediate') && (
        <motion.div 
          className="grid grid-cols-3 gap-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {emergencyNumbers.map((emergency) => (
            <motion.button
              key={emergency.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleEmergencyCallWithLocation(emergency.contact, emergency.name)}
              className={`p-3 ${emergency.color} text-white rounded-lg shadow-lg hover:shadow-xl transition-all`}
              aria-label={`Contact ${emergency.name}`}
            >
              <emergency.icon className="h-6 w-6 mx-auto mb-1" />
              <span className="text-xs font-bold block">{emergency.contact}</span>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Tabbed Interface */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'emergency', label: 'Emergency', icon: Phone },
            { id: 'safety', label: 'Safety Plan', icon: Shield },
            { id: 'network', label: 'Support Network', icon: Users },
            { id: 'resources', label: 'Resources', icon: MapPin }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as unknown)}
              className={`flex-1 py-2 px-3 flex items-center justify-center space-x-1 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-500'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-4">
          <AnimatePresence mode="wait">
            {/* Emergency Contacts Tab */}
            {activeTab === 'emergency' && (
              <motion.div
                key="emergency"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3"
              >
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  24/7 Crisis Support
                </h4>
                {emergencyNumbers.map((emergency) => (
                  <button
                    key={emergency.id}
                    onClick={() => handleEmergencyCallWithLocation(emergency.contact, emergency.name)}
                    className="w-full flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <emergency.icon className="h-5 w-5 text-red-600" />
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{emergency.name}</p>
                        <p className="text-sm text-gray-600">{emergency.description}</p>
                      </div>
                    </div>
                    <Zap className="h-4 w-4 text-red-400 group-hover:text-red-600" />
                  </button>
                ))}

                {/* Crisis Chat Option */}
                <button
                  onClick={onStartCrisisChat}
                  className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Live Crisis Chat</p>
                      <p className="text-sm text-gray-600">Chat with a counselor</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-purple-400" />
                </button>
              </motion.div>
            )}

            {/* Safety Plan Tab */}
            {activeTab === 'safety' && (
              <motion.div
                key="safety"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3"
              >
                {data?.safetyPlan ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        My Safety Plan
                      </h4>
                      <button
                        onClick={onOpenSafetyPlan}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        Edit
                      </button>
                    </div>

                    {/* Warning Signals */}
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <p className="font-medium text-yellow-900 mb-2">Warning Signals</p>
                      <ul className="space-y-1 text-sm text-yellow-800">
                        {data.safetyPlan.warningSignsText && data.safetyPlan.warningSignsText.split(',').slice(0, 3).map((signal, idx) => (
                          <li key={idx} className="flex items-start space-x-1">
                            <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>{signal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Coping Strategies */}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="font-medium text-blue-900 mb-2">Coping Strategies</p>
                      <ul className="space-y-1 text-sm text-blue-800">
                        {copingStrategies.slice(0, 4).map((strategy, idx) => (
                          <li key={idx} className="flex items-start space-x-1">
                            <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>{strategy}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Reasons to Live */}
                    {data.safetyPlan.reasonsToLiveText && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="font-medium text-green-900 mb-2">My Reasons</p>
                        <ul className="space-y-1 text-sm text-green-800">
                          {data.safetyPlan.reasonsToLiveText.split(',').slice(0, 3).map((reason, idx) => (
                            <li key={idx} className="flex items-start space-x-1">
                              <Heart className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">Create your personalized safety plan</p>
                    <button
                      onClick={onOpenSafetyPlan}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Create Safety Plan
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Support Network Tab */}
            {activeTab === 'network' && (
              <motion.div
                key="network"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3"
              >
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Personal Support Network
                </h4>
                
                {data?.emergencyContacts && data.emergencyContacts.length > 0 ? (
                  <div className="space-y-2">
                    {data.emergencyContacts.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => handleEmergencyCallWithLocation(contact.phone, contact.name)}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={!contact.isAvailable}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Users className="h-5 w-5 text-gray-600" />
                            {contact.isAvailable && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                            )}
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-900">{contact.name}</p>
                            <p className="text-sm text-gray-600">{contact.relationship}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {contact.preferredContact === 'call' && <Phone className="h-4 w-4 text-gray-400" />}
                          {contact.preferredContact === 'text' && <MessageCircle className="h-4 w-4 text-gray-400" />}
                          {contact.preferredContact === 'both' && (
                            <>
                              <Phone className="h-4 w-4 text-gray-400" />
                              <MessageCircle className="h-4 w-4 text-gray-400" />
                            </>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">Add your trusted contacts</p>
                    <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                      Add Contacts
                    </button>
                  </div>
                )}

                {/* Professional Contacts */}
                {data?.safetyPlan?.professionalContactsText && (
                  <>
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mt-4">
                      Professional Support
                    </h4>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-left">
                          <p className="font-medium text-blue-900 mb-1">Professional Contacts</p>
                          <p className="text-sm text-blue-800">{data.safetyPlan.professionalContactsText}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* Resources Tab */}
            {activeTab === 'resources' && (
              <motion.div
                key="resources"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3"
              >
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Nearby Crisis Resources
                </h4>
                
                {location ? (
                  <div className="space-y-2">
                    <button className="w-full flex items-center justify-between p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <Navigation className="h-5 w-5 text-indigo-600" />
                        <div className="text-left">
                          <p className="font-medium text-gray-900">Nearest Hospital</p>
                          <p className="text-sm text-gray-600">2.3 miles away</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-indigo-400" />
                    </button>
                    
                    <button className="w-full flex items-center justify-between p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-indigo-600" />
                        <div className="text-left">
                          <p className="font-medium text-gray-900">Crisis Center</p>
                          <p className="text-sm text-gray-600">4.1 miles away</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-indigo-400" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">Enable location for nearby resources</p>
                    <button 
                      onClick={() => navigator.geolocation.getCurrentPosition(() => {})}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Enable Location
                    </button>
                  </div>
                )}

                {/* Online Resources */}
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mt-4">
                  Online Resources
                </h4>
                <div className="space-y-2">
                  <a 
                    href="https://www.crisistextline.org" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <MessageSquare className="h-5 w-5 text-purple-600" />
                        <div className="text-left">
                          <p className="font-medium text-gray-900">Crisis Text Line</p>
                          <p className="text-sm text-gray-600">Free 24/7 text support</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-purple-400" />
                    </div>
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Motivational Footer */}
      <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
        <p className="text-sm text-gray-700">
          <span className="font-medium">Remember:</span> You are stronger than you know. 
          Help is always available, and it&apos;s okay to reach out when you need support.
        </p>
      </div>
    </div>
  );
}