import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Phone, 
  MessageSquare, 
  Shield, 
  Heart, 
  AlertTriangle, 
  MapPin,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useBatteryStatus } from '../../hooks/useBatteryStatus';
import { useVibration } from '../../hooks/useVibration';

// Mobile-optimized crisis button with haptic feedback
interface CrisisButtonProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  color: string;
  onClick: () => void;
  urgent?: boolean;
  disabled?: boolean;
}

function CrisisButton({ icon, label, sublabel, color, onClick, urgent, disabled }: CrisisButtonProps) {
  const vibrate = useVibration();
  
  const handleClick = () => {
    // Haptic feedback for mobile devices
    vibrate([50]);
    onClick();
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      className={`
        relative w-full p-6 rounded-2xl shadow-lg transition-all
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:shadow-inner'}
        ${urgent ? 'animate-pulse' : ''}
        ${color}
      `}
      onClick={handleClick}
      disabled={disabled}
      aria-label={`${label} ${sublabel || ''}`}
    >
      <div className="flex flex-col items-center space-y-2">
        <div className="text-white">{icon}</div>
        <span className="text-white font-bold text-lg">{label}</span>
        {sublabel && (
          <span className="text-white/80 text-sm">{sublabel}</span>
        )}
      </div>
      {urgent && (
        <div className="absolute top-2 right-2">
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
        </div>
      )}
    </motion.button>
  );
}

// Quick access floating action button for crisis
function CrisisFloatingButton({ onClick }: { onClick: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const vibrate = useVibration();
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleMainClick = () => {
    vibrate([100, 50, 100]); // Strong haptic pattern for emergency
    onClick();
  };

  const handleLongPressStart = () => {
    longPressTimer.current = setTimeout(() => {
      handleMainClick();
    }, 500); // 500ms for long press
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <div className="fixed bottom-20 right-4 z-50">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-16 right-0 space-y-2 mb-2"
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = 'tel:988'}
              className="w-14 h-14 bg-red-500 rounded-full shadow-lg flex items-center justify-center text-white"
            >
              <Phone className="h-6 w-6" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = 'sms:741741?body=HOME'}
              className="w-14 h-14 bg-blue-500 rounded-full shadow-lg flex items-center justify-center text-white"
            >
              <MessageSquare className="h-6 w-6" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsExpanded(!isExpanded)}
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
        className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full shadow-2xl flex items-center justify-center text-white relative"
      >
        <AlertTriangle className="h-8 w-8" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-400"></span>
        </span>
      </motion.button>
    </div>
  );
}

// Status bar showing connection and battery for crisis situations
function CrisisStatusBar() {
  const { isOnline, effectiveType } = useNetworkStatus();
  const { level, charging } = useBatteryStatus();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-gray-600">{effectiveType || 'Connected'}</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-red-500" />
              <span className="text-red-600">Offline Mode</span>
            </>
          )}
        </div>
        
        {level !== null && (
          <div className="flex items-center space-x-2">
            {level < 20 ? (
              <BatteryLow className="h-4 w-4 text-red-500" />
            ) : (
              <Battery className="h-4 w-4 text-gray-500" />
            )}
            <span className={level < 20 ? 'text-red-600' : 'text-gray-600'}>
              {Math.round(level * 100)}%
              {charging && ' ⚡'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Main mobile crisis interface
export function MobileCrisisInterface() {
  const [activeView, setActiveView] = useState<'main' | 'chat' | 'resources' | 'safety'>('main');
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const { isOnline } = useNetworkStatus();
  const vibrate = useVibration();

  // Get location for emergency services
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => setLocation(position.coords),
        (error) => console.error('Location error:', error),
        { 
          enableHighAccuracy: false, // Save battery
          timeout: 10000,
          maximumAge: 300000 // Cache for 5 minutes
        }
      );
    }
  }, []);

  // Emergency call handler with location sharing
  const handleEmergencyCall = useCallback((number: string, service: string) => {
    vibrate([200, 100, 200]); // Strong vibration pattern
    
    // Store crisis interaction in IndexedDB for offline sync
    if ('indexedDB' in window) {
      const timestamp = new Date().toISOString();
      const data = {
        action: 'emergency_call',
        service,
        number,
        timestamp,
        location: location ? {
          lat: location.latitude,
          lng: location.longitude
        } : null,
        online: isOnline
      };
      
      // Store for later sync
      storeCrisisInteraction(data);
    }
    
    // Make the call
    window.location.href = `tel:${number}`;
  }, [location, isOnline, vibrate]);

  // Store crisis interactions for offline sync
  const storeCrisisInteraction = async (data: any) => {
    try {
      const db = await openCrisisDB();
      const tx = db.transaction('interactions', 'readwrite');
      await tx.objectStore('interactions').add(data);
    } catch (error) {
      console.error('Failed to store crisis interaction:', error);
    }
  };

  // Open IndexedDB for crisis data
  const openCrisisDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CrisisDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('interactions')) {
          db.createObjectStore('interactions', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
        }
        if (!db.objectStoreNames.contains('safetyPlans')) {
          db.createObjectStore('safetyPlans', { 
            keyPath: 'id' 
          });
        }
      };
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pb-20">
      <CrisisStatusBar />
      
      {/* Main Crisis View */}
      <AnimatePresence mode="wait">
        {activeView === 'main' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="pt-16 px-4 pb-4"
          >
            {/* Emergency Header */}
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-8 w-8 text-red-500 flex-shrink-0" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Crisis Support
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Help is available 24/7. You're not alone.
                  </p>
                </div>
              </div>
            </div>

            {/* Primary Crisis Actions - Large Touch Targets */}
            <div className="space-y-4 mb-6">
              <CrisisButton
                icon={<Phone className="h-10 w-10" />}
                label="Call 988"
                sublabel="Suicide & Crisis Lifeline"
                color="bg-gradient-to-br from-red-500 to-red-600"
                onClick={() => handleEmergencyCall('988', 'Crisis Lifeline')}
                urgent={true}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <CrisisButton
                  icon={<MessageSquare className="h-8 w-8" />}
                  label="Text Help"
                  sublabel="741741"
                  color="bg-gradient-to-br from-blue-500 to-blue-600"
                  onClick={() => window.location.href = 'sms:741741?body=HOME'}
                />
                
                <CrisisButton
                  icon={<Shield className="h-8 w-8" />}
                  label="Call 911"
                  sublabel="Emergency"
                  color="bg-gradient-to-br from-gray-700 to-gray-800"
                  onClick={() => handleEmergencyCall('911', 'Emergency Services')}
                />
              </div>
            </div>

            {/* Quick Access Tools */}
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Immediate Help Tools
              </h2>
              
              <div className="grid grid-cols-2 gap-3">
                <QuickToolButton
                  icon={<Heart className="h-6 w-6" />}
                  label="Breathing"
                  onClick={() => window.location.href = '/wellness#breathing'}
                  color="text-pink-500"
                />
                <QuickToolButton
                  icon={<MapPin className="h-6 w-6" />}
                  label="Near Me"
                  onClick={() => setActiveView('resources')}
                  color="text-green-500"
                  badge={!isOnline ? 'Offline' : null}
                />
                <QuickToolButton
                  icon={<Shield className="h-6 w-6" />}
                  label="Safety Plan"
                  onClick={() => setActiveView('safety')}
                  color="text-purple-500"
                />
                <QuickToolButton
                  icon={<MessageSquare className="h-6 w-6" />}
                  label="Chat"
                  onClick={() => setActiveView('chat')}
                  color="text-blue-500"
                  disabled={!isOnline}
                />
              </div>
            </div>

            {/* Offline Mode Notice */}
            {!isOnline && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <WifiOff className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">
                      Offline Mode Active
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Emergency calls still work. Your safety plan and coping tools are available offline.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Crisis Button */}
      <CrisisFloatingButton onClick={() => handleEmergencyCall('988', 'Quick Access')} />
    </div>
  );
}

// Quick tool button component
function QuickToolButton({ 
  icon, 
  label, 
  onClick, 
  color, 
  disabled = false,
  badge = null 
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: string;
  disabled?: boolean;
  badge?: string | null;
}) {
  const vibrate = useVibration();
  
  const handleClick = () => {
    if (!disabled) {
      vibrate([30]);
      onClick();
    }
  };

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative bg-gray-50 rounded-xl p-4 flex flex-col items-center space-y-2
        transition-all border-2 border-transparent
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:bg-gray-100 active:border-gray-300'
        }
      `}
    >
      <div className={disabled ? 'text-gray-400' : color}>{icon}</div>
      <span className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
        {label}
      </span>
      {badge && (
        <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </motion.button>
  );
}