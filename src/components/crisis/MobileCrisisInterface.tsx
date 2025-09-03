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
import { logger } from '@/utils/logger';
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
  const { vibrate } = useVibration();
  
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
  const { vibrate } = useVibration();
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
  const [_activeView, setActiveView] = useState<'main' | 'chat' | 'resources' | 'safety'>('main');
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const { isOnline } = useNetworkStatus();
  const { vibrate } = useVibration();

  // Get location for emergency services
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => setLocation(position.coords),
        (error) => console.error('Location error:', error)
      );
    }
  }, []);

  const handleEmergencyCall = useCallback(() => {
    vibrate([100, 50, 100]);
    if (location) {
      const coords = `${location.latitude},${location.longitude}`;
      logger.info('Emergency call with location', 'MobileCrisisInterface', { coords });
    }
    window.location.href = 'tel:988';
  }, [location, vibrate]);

  const handleTextCrisis = useCallback(() => {
    vibrate([50]);
    window.location.href = 'sms:741741?body=HOME';
  }, [vibrate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <CrisisStatusBar />
      
      <div className="pt-16 px-4 pb-24">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Crisis Support</h1>
            <p className="text-gray-600">Immediate help is available 24/7</p>
          </div>

          <div className="grid gap-4">
            <CrisisButton
              icon={<Phone className="h-8 w-8" />}
              label="Call 988"
              sublabel="Suicide & Crisis Lifeline"
              color="bg-gradient-to-br from-red-500 to-red-600"
              onClick={handleEmergencyCall}
              urgent={true}
            />

            <CrisisButton
              icon={<MessageSquare className="h-8 w-8" />}
              label="Text HOME to 741741"
              sublabel="Crisis Text Line"
              color="bg-gradient-to-br from-blue-500 to-blue-600"
              onClick={handleTextCrisis}
            />

            <CrisisButton
              icon={<Shield className="h-8 w-8" />}
              label="Safety Plan"
              sublabel="Create your personal plan"
              color="bg-gradient-to-br from-green-500 to-green-600"
              onClick={() => setActiveView('safety')}
            />

            <CrisisButton
              icon={<Heart className="h-8 w-8" />}
              label="Resources"
              sublabel="Coping strategies & tools"
              color="bg-gradient-to-br from-purple-500 to-purple-600"
              onClick={() => setActiveView('resources')}
              disabled={!isOnline}
            />
          </div>

          {location && (
            <div className="mt-6 p-4 bg-white rounded-xl shadow-sm">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>Location ready for emergency services</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <CrisisFloatingButton onClick={handleEmergencyCall} />
    </div>
  );
}
