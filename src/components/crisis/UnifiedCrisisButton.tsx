/**
 * Unified Crisis Button Component
 * Consolidates all crisis button implementations with theming, haptic feedback, and accessibility
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MessageSquare, Shield, AlertTriangle, Heart, MapPin } from 'lucide-react';
import { useVibration } from '../../hooks/useVibration';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { 
  handleEmergencyCall, 
  logCrisisInteraction, 
  getEmergencyLocation,
  getRecommendedContacts
} from '../../utils/crisis';
import { 
  CRISIS_ACTIONS, 
  EMERGENCY_CONTACTS, 
  HAPTIC_PATTERNS, 
  CRISIS_THEMES,
  CrisisLevel,
  CrisisTheme
} from '../../constants/crisis';

interface UnifiedCrisisButtonProps {
  variant?: 'primary' | 'floating' | 'quick' | 'emergency';
  theme?: CrisisTheme;
  crisisLevel?: CrisisLevel;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  showSubtext?: boolean;
  disabled?: boolean;
  className?: string;
  onActionTaken?: (action: string) => void;
}

const iconMap = {
  Phone,
  MessageSquare,
  Shield,
  AlertTriangle,
  Heart,
  MapPin
};

export function UnifiedCrisisButton({
  variant = 'primary',
  theme = 'therapeutic',
  crisisLevel = 'moderate',
  size = 'lg',
  showLabel = true,
  showSubtext = true,
  disabled = false,
  className = '',
  onActionTaken
}: UnifiedCrisisButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const { consoleVibrate } = useVibration();
  const { isOnline } = useNetworkStatus();

  // Get location on mount for emergency services
  useEffect(() => {
    if (variant === 'emergency' || crisisLevel === 'critical') {
      getEmergencyLocation()
        .then(setLocation)
        .catch(error => console.warn('Could not get location:', error));
    }
  }, [variant, crisisLevel]);

  const handleAction = useCallback(async (actionId: string) => {
    setIsLoading(true);
    consoleVibrate('activation', HAPTIC_PATTERNS.urgent);

    try {
      const action = CRISIS_ACTIONS.find(a => a.id === actionId);
      if (!action) return;

      // Log the action
      await logCrisisInteraction(actionId, crisisLevel, {
        variant,
        theme,
        location: location ? {
          lat: location.latitude,
          lng: location.longitude
        } : null
      });

      // Handle different action types
      if (typeof action.action === 'string') {
        if (action.action.startsWith('tel:') || action.action.startsWith('sms:')) {
          // Emergency contact
          const contactId = actionId.includes('988') ? '988' : 
                           actionId.includes('911') ? '911' : 
                           actionId.includes('text') ? 'crisis-text' : 'samhsa';
          
          await handleEmergencyCall(contactId, location || undefined);
        } else {
          // Navigate to internal route
          window.location.href = action.action;
        }
      }

      onActionTaken?.(actionId);
    } catch (error) {
      console.error('Crisis action failed:', error);
      consoleVibrate('error', HAPTIC_PATTERNS.error);
    } finally {
      setIsLoading(false);
      setIsExpanded(false);
    }
  }, [crisisLevel, location, variant, theme, consoleVibrate, onActionTaken]);

  const handleLongPressStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      handleAction('call-988'); // Default long press action
    }, 800);
  }, [handleAction]);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const getThemeClasses = () => {
    const themes = CRISIS_THEMES[theme];
    return {
      primary: themes.crisis,
      emergency: themes.emergency,
      safe: themes.safe,
      accent: themes.accent
    };
  };

  const getSizeClasses = () => {
    const sizes = {
      sm: 'w-12 h-12 text-sm',
      md: 'w-16 h-16 text-base',
      lg: 'w-20 h-20 text-lg',
      xl: 'w-24 h-24 text-xl'
    };
    return sizes[size];
  };

  if (variant === 'primary') {
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => handleAction('call-988')}
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
        disabled={disabled || isLoading}
        className={`
          relative w-full p-6 rounded-2xl shadow-lg transition-all duration-300
          ${getThemeClasses().primary} text-white
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:shadow-inner hover:shadow-xl'}
          ${crisisLevel === 'critical' ? 'animate-pulse' : ''}
          ${className}
        `}
        aria-label="Call 988 Suicide & Crisis Lifeline for immediate help"
      >
        <div className="flex flex-col items-center space-y-3">
          <div className="relative">
            <Phone className="h-10 w-10" />
            {isLoading && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-2 border-white/30 border-t-white rounded-full"
              />
            )}
          </div>
          
          {showLabel && (
            <div className="text-center">
              <span className="text-xl font-bold block">Call 988</span>
              {showSubtext && (
                <span className="text-white/80 text-sm block mt-1">
                  Suicide & Crisis Lifeline
                </span>
              )}
            </div>
          )}
        </div>

        {/* Urgent indicator */}
        {(crisisLevel === 'critical' || crisisLevel === 'high') && (
          <div className="absolute top-3 right-3">
            <motion.span 
              className="flex h-4 w-4"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
            </motion.span>
          </div>
        )}
      </motion.button>
    );
  }

  if (variant === 'floating') {
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
              {getRecommendedContacts(crisisLevel).slice(0, 3).map((contact) => {
                const IconComponent = iconMap[contact.type === 'phone' ? 'Phone' : 'MessageSquare'];
                return (
                  <motion.button
                    key={contact.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAction(
                      contact.id === '988' ? 'call-988' : 
                      contact.id === 'crisis-text' ? 'text-home' : 'call-911'
                    )}
                    className={`
                      w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white
                      ${contact.priority === 1 ? getThemeClasses().emergency : getThemeClasses().primary}
                    `}
                    aria-label={`${contact.name}: ${contact.description}`}
                  >
                    <IconComponent className="h-6 w-6" />
                  </motion.button>
                );
              })}
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
          className={`
            ${getSizeClasses()} ${getThemeClasses().emergency} 
            rounded-full shadow-2xl flex items-center justify-center text-white relative
            transition-all duration-300 hover:scale-105
          `}
          aria-label="Emergency crisis support options"
        >
          <AlertTriangle className="h-8 w-8" />
          <motion.span 
            className="absolute -top-1 -right-1 flex h-4 w-4"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-400"></span>
          </motion.span>
        </motion.button>
      </div>
    );
  }

  if (variant === 'quick') {
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => handleAction('call-988')}
        disabled={disabled || isLoading}
        className={`
          relative ${getSizeClasses()} ${getThemeClasses().primary}
          rounded-xl shadow-lg flex items-center justify-center text-white
          transition-all duration-300 
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
          ${className}
        `}
        aria-label="Quick crisis support"
      >
        <AlertTriangle className={`${size === 'sm' ? 'h-5 w-5' : 'h-6 w-6'}`} />
        
        {!isOnline && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white" />
        )}
      </motion.button>
    );
  }

  if (variant === 'emergency') {
    return (
      <div className="space-y-4">
        {/* Primary Emergency Actions */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => handleAction('call-988')}
          disabled={disabled}
          className={`
            w-full p-6 rounded-2xl shadow-lg transition-all
            ${getThemeClasses().emergency} text-white
            ${crisisLevel === 'critical' ? 'animate-pulse' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:shadow-inner'}
          `}
          aria-label="Call 988 Suicide & Crisis Lifeline - Primary emergency contact"
        >
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <Phone className="h-10 w-10" />
            </div>
            <div className="text-left">
              <div className="text-xl font-bold">Call 988</div>
              <div className="text-white/80 text-sm">Suicide & Crisis Lifeline • Available 24/7</div>
            </div>
          </div>
        </motion.button>

        {/* Secondary Actions Grid */}
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAction('text-home')}
            disabled={disabled}
            className={`
              p-4 rounded-xl shadow transition-all
              ${getThemeClasses().primary} text-white
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}
            `}
            aria-label="Text HOME to 741741 for crisis support"
          >
            <MessageSquare className="h-8 w-8 mx-auto mb-2" />
            <div className="text-sm font-semibold">Text Help</div>
            <div className="text-xs text-white/80">741741</div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAction('call-911')}
            disabled={disabled}
            className={`
              p-4 rounded-xl shadow transition-all
              ${getThemeClasses().emergency} text-white
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}
            `}
            aria-label="Call 911 for emergency services"
          >
            <Shield className="h-8 w-8 mx-auto mb-2" />
            <div className="text-sm font-semibold">Call 911</div>
            <div className="text-xs text-white/80">Emergency</div>
          </motion.button>
        </div>

        {/* Location Status */}
        {location && (
          <div className="text-xs text-gray-600 text-center">
            📍 Location available for emergency services
          </div>
        )}
      </div>
    );
  }

  return null;
}