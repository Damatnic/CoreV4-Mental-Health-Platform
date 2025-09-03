import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Phone, MessageSquare, MapPin, Heart, Shield } from 'lucide-react';
import { EmergencyContactsLazy, SafetyPlanLazy } from '../../utils/bundleOptimization/lazyLoading';
import { CrisisResources } from './CrisisResources';
import { CrisisChatLazy } from '../../utils/bundleOptimization/lazyLoading';
import { ConsoleFocusable } from '../console/ConsoleFocusable';
import { logger, LogCategory } from '../../services/logging/logger';

interface CrisisLevel {
  level: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  color: string;
  glowColor: string;
  priority: number;
}

const _CONSOLE_CRISIS_LEVELS: Record<string, CrisisLevel> = {
  low: {
    level: 'low',
    description: 'Feeling stressed or overwhelmed',
    color: 'from-yellow-500 to-orange-500',
    glowColor: 'shadow-yellow-500/30',
    priority: 1
  },
  medium: {
    level: 'medium',
    description: 'Experiencing distress or anxiety',
    color: 'from-orange-500 to-red-500',
    glowColor: 'shadow-orange-500/40',
    priority: 2
  },
  high: {
    level: 'high',
    description: 'In significant emotional pain',
    color: 'from-red-500 to-pink-600',
    glowColor: 'shadow-red-500/50',
    priority: 3
  },
  critical: {
    level: 'critical',
    description: 'In immediate danger or crisis',
    color: 'from-red-600 to-red-800',
    glowColor: 'shadow-red-600/60',
    priority: 4
  }
};

export function ConsoleCrisisSystem() {
  const [currentCrisisLevel, _setCurrentCrisisLevel] = useState<CrisisLevel | null>(null);
  const [_showEmergencyDialog, _setShowEmergencyDialog] = useState(false);
  const [userLocation, setUserLocation] = useState<GeolocationPosition | null>(null);
  const [activeTab, setActiveTab] = useState<'emergency' | 'resources' | 'safety' | 'chat'>('emergency');
  const [responseTime, setResponseTime] = useState(0);
  const [pulseIntensity, setPulseIntensity] = useState(1);

  // Enhanced pulse effect for critical situations
  useEffect(() => {
    if (currentCrisisLevel?.level === 'critical') {
      const _interval = setInterval(() => {
        setPulseIntensity(prev => prev === 1 ? 1.2 : 1);
      }, 800);
      return () => clearInterval(_interval);
    }
  }, [currentCrisisLevel]);

  // Track response time
  useEffect(() => {
    const startTime = performance.now();
    setResponseTime(performance.now() - startTime);
  }, []);

  // Get location for emergency services
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (_position) => setUserLocation(_position),
        (error) => logger.error('Location access denied', new Error(error.message), { category: LogCategory.CRISIS }),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // Emergency handlers
  const handleEmergencyCall = useCallback((number: string, service: string) => {
    const timestamp = new Date().toISOString();
    logger.logCrisisIntervention('emergency_call_initiated', undefined, {
      service,
      timestamp,
      responseTime
    });
    
    window.location.href = `tel:${number}`;
  }, [responseTime]);

  const handleCrisisText = useCallback((number: string, keyword: string) => {
    const smsUrl = `sms:${number}${keyword ? `?&body=${encodeURIComponent(_keyword)}` : ''}`;
    window.location.href = smsUrl;
    
    logger.logCrisisIntervention('crisis_text_initiated', undefined, {
      number,
      keyword,
      timestamp: new Date().toISOString()
    });
  }, []);

  const tabs = [
    { id: 'emergency', label: 'Emergency Help', icon: AlertTriangle, urgent: true },
    { id: 'resources', label: 'Crisis Resources', icon: Shield, urgent: false },
    { id: 'safety', label: 'Safety Plan', icon: Heart, urgent: false },
    { id: 'chat', label: 'Crisis Chat', icon: MessageSquare, urgent: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-gray-900 to-black relative overflow-hidden">
      {/* Emergency Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          animate={{
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute inset-0 bg-gradient-radial from-red-500/20 via-transparent to-transparent"
        />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8 relative z-10">
        {/* Emergency Header - Always Visible */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-8 rounded-2xl bg-gradient-to-r from-red-600/90 to-pink-600/90 border-2 border-red-400/50 backdrop-blur-md shadow-console-depth relative overflow-hidden"
          style={{ transform: `scale(${pulseIntensity})` }}
        >
          {/* Emergency glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-transparent to-pink-500/20 animate-pulse" />
          
          <div className="relative z-10 text-center">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity 
              }}
              className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6"
            >
              <AlertTriangle className="h-12 w-12 text-white" />
            </motion.div>
            
            <h1 className="text-5xl font-bold text-white mb-4">
              🆘 EMERGENCY SUPPORT
            </h1>
            <p className="text-xl text-red-100 mb-6">
              Immediate help available 24/7 • You are not alone
            </p>

            {/* Immediate Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <ConsoleFocusable
                id="emergency-call-988"
                group="emergency-actions"
                priority={100}
                onActivate={() => handleEmergencyCall('988', 'National Crisis Line')}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleEmergencyCall('988', 'National Crisis Line')}
                  className="group flex items-center space-x-3 bg-white/90 hover:bg-white text-red-600 px-8 py-4 rounded-console-lg font-bold text-lg shadow-console-depth hover:shadow-console-hover transition-all duration-300"
                >
                  <Phone className="h-6 w-6" />
                  <span>CALL 988 - Crisis Line</span>
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                </motion.button>
              </ConsoleFocusable>

              <ConsoleFocusable
                id="emergency-text-741741"
                group="emergency-actions"
                priority={99}
                onActivate={() => handleCrisisText('741741', 'HOME')}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCrisisText('741741', 'HOME')}
                  className="group flex items-center space-x-3 bg-red-500/20 hover:bg-red-500/30 text-white border-2 border-white/50 hover:border-white px-8 py-4 rounded-console-lg font-bold text-lg backdrop-blur-md transition-all duration-300"
                >
                  <MessageSquare className="h-6 w-6" />
                  <span>TEXT HOME to 741741</span>
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                </motion.button>
              </ConsoleFocusable>
            </div>
          </div>

          {/* Animated emergency border */}
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-red-400"
            animate={{
              borderColor: ['rgb(248 113 113)', 'rgb(239 68 68)', 'rgb(248 113 113)'],
              boxShadow: [
                '0 0 20px rgba(248, 113, 113, 0.5)',
                '0 0 40px rgba(239, 68, 68, 0.7)',
                '0 0 20px rgba(248, 113, 113, 0.5)',
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>

        {/* Console Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <nav className="flex flex-wrap gap-3">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              return (
                <ConsoleFocusable
                  key={tab.id}
                  id={`crisis-tab-${tab.id}`}
                  group="crisis-navigation"
                  priority={tab.urgent ? 90 : 70}
                  onActivate={() => setActiveTab(tab.id as 'emergency' | 'resources' | 'safety' | 'chat')}
                >
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    onClick={() => setActiveTab(tab.id as 'emergency' | 'resources' | 'safety' | 'chat')}
                    className={`group flex items-center space-x-3 py-4 px-6 rounded-console-lg transition-all duration-300 relative overflow-hidden ${
                      activeTab === tab.id
                        ? `bg-gradient-to-r ${tab.urgent ? 'from-red-500/30 to-pink-500/30' : 'from-blue-500/20 to-purple-500/20'} text-white border ${tab.urgent ? 'border-red-400/50' : 'border-blue-400/30'} ${tab.urgent ? 'shadow-red-500/30' : 'shadow-console-glow'}`
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/30 border border-gray-700/50 hover:border-gray-600/50'
                    }`}
                  >
                    {/* Tab background effect */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${tab.urgent ? 'from-red-500/5 to-pink-500/5' : 'from-blue-500/5 to-purple-500/5'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    
                    <div className={`p-2 rounded-console transition-all duration-300 ${
                      activeTab === tab.id 
                        ? `${tab.urgent ? 'bg-red-500/20' : 'bg-blue-500/20'}` 
                        : 'bg-gray-700/50 group-hover:bg-gray-600/50'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium relative z-10">{tab.label}</span>
                    
                    {tab.urgent && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-2 h-2 bg-red-400 rounded-full"
                      />
                    )}
                  </motion.button>
                </ConsoleFocusable>
              );
            })}
          </nav>
        </motion.div>

        {/* Console Content Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/50 rounded-2xl p-8 backdrop-blur-md shadow-console-depth"
        >
          <AnimatePresence mode="wait">
            {activeTab === 'emergency' && (
              <motion.div
                key="emergency"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Suspense fallback={<div className="animate-pulse bg-gray-800 h-24 rounded border border-cyan-500/20"></div>}>
                  <EmergencyContactsLazy />
                </Suspense>
              </motion.div>
            )}
            {activeTab === 'resources' && (
              <motion.div
                key="resources"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CrisisResources />
              </motion.div>
            )}
            {activeTab === 'safety' && (
              <motion.div
                key="safety"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Suspense fallback={<div className="animate-pulse bg-gray-800 h-32 rounded border border-cyan-500/20"></div>}>
                  <SafetyPlanLazy />
                </Suspense>
              </motion.div>
            )}
            {activeTab === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Suspense fallback={<div className="animate-pulse bg-gray-800 h-32 rounded border border-cyan-500/20"></div>}>
                  <CrisisChatLazy />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Location Status (if available) */}
        {userLocation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-6 p-4 bg-green-500/10 border border-green-400/30 rounded-console-lg backdrop-blur-md"
          >
            <div className="flex items-center space-x-3 text-green-300">
              <MapPin className="h-5 w-5" />
              <span className="text-sm">
                Location enabled for emergency services • Coordinates available for first responders
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}