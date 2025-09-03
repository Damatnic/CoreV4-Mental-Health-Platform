import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Phone, MessageCircle, Heart, X, ChevronUp, HelpCircle } from 'lucide-react';
import { useNavigation } from './NavigationContext';
import { useLocation } from 'react-router-dom';

interface CrisisOption {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
  urgent?: boolean;
}

export function FloatingCrisisButton() {
  const location = useLocation();
  const { crisisDetected, setCrisisDetected, mode } = useNavigation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(true);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);

  // Crisis quick actions
  const crisisOptions: CrisisOption[] = [
    {
      id: 'hotline',
      label: 'Call 988',
      sublabel: 'Crisis Hotline',
      icon: <Phone className="h-5 w-5" />,
      action: () => window.location.href = 'tel:988',
      color: 'bg-red-500 hover:bg-red-600',
      urgent: true,
    },
    {
      id: 'text',
      label: 'Text HOME',
      sublabel: 'to 741741',
      icon: <MessageCircle className="h-5 w-5" />,
      action: () => window.location.href = 'sms:741741?body=HOME',
      color: 'bg-orange-500 hover:bg-orange-600',
      urgent: true,
    },
    {
      id: 'breathing',
      label: 'Breathing',
      sublabel: 'Calm down',
      icon: <Heart className="h-5 w-5" />,
      action: () => window.location.href = '/wellness/breathing',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      id: 'resources',
      label: 'Resources',
      sublabel: 'Get help',
      icon: <HelpCircle className="h-5 w-5" />,
      action: () => {
        setCrisisDetected(true);
        window.location.href = '/crisis';
      },
      color: 'bg-purple-500 hover:bg-purple-600',
    },
  ];

  // Handle drag functionality for repositioning
  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (isDragging && !isExpanded) {
      const clientX = 'touches' in e ? (e.touches[0]?.clientX || 0) : e.clientX;
      const clientY = 'touches' in e ? (e.touches[0]?.clientY || 0) : e.clientY;
      
      const newX = Math.max(20, Math.min(window.innerWidth - 80, clientX - 30));
      const newY = Math.max(20, Math.min(window.innerHeight - 80, clientY - 30));
      
      setPosition({ x: window.innerWidth - newX - 60, y: window.innerHeight - newY - 60 });
    }
  }, [isDragging, isExpanded]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isExpanded) {
      setIsDragging(true);
      e.preventDefault();
    }
  };

  // Detect user distress patterns (simplified version)
  useEffect(() => {
    let rapidClickCount = 0;
    let clickTimer: NodeJS.Timeout;

    const detectDistress = () => {
      rapidClickCount++;
      clearTimeout(clickTimer);
      
      // If user clicks rapidly (5+ times in 2 seconds), show expanded view
      if (rapidClickCount >= 5) {
        setIsExpanded(true);
        setPulseAnimation(true);
        rapidClickCount = 0;
      }
      
      clickTimer = setTimeout(() => {
        rapidClickCount = 0;
      }, 2000);
    };

    window.addEventListener('click', detectDistress);
    return () => {
      window.removeEventListener('click', detectDistress);
      clearTimeout(clickTimer);
    };
  }, []);

  // Auto-expand in crisis mode
  useEffect(() => {
    if (mode === 'crisis' || crisisDetected) {
      setIsExpanded(true);
    }
  }, [mode, crisisDetected]);

  // Handle drag events
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Hide on crisis page itself
  if (location.pathname === '/crisis') {
    return null;
  }

  return (
    <div
      className="fixed z-50"
      style={{ 
        right: `${position.x}px`, 
        bottom: `${position.y}px`,
        touchAction: 'none'
      }}
    >
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-16 right-0 bg-white rounded-xl shadow-2xl p-4 mb-2 w-64"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Crisis Support</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close crisis support menu"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Crisis Options */}
            <div className="space-y-2">
              {crisisOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={option.action}
                  className={`w-full p-3 rounded-lg text-white transition-all transform hover:scale-105 ${option.color} ${
                    option.urgent ? 'animate-pulse' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {option.icon}
                    <div className="text-left">
                      <div className="font-semibold">{option.label}</div>
                      {option.sublabel && (
                        <div className="text-xs opacity-90">{option.sublabel}</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Quick Message */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 text-center">
                You&apos;re not alone. Help is available 24/7.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsExpanded(!isExpanded)}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        className={`relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
          mode === 'crisis' || crisisDetected
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-blue-600 hover:bg-blue-700'
        } ${isDragging ? 'cursor-move' : 'cursor-pointer'}`}
        style={{ touchAction: 'none' }}
        aria-label="Open crisis support menu"
      >
        {isExpanded ? (
          <ChevronUp className="h-6 w-6 text-white" />
        ) : (
          <AlertTriangle className="h-6 w-6 text-white" />
        )}

        {/* Pulse indicator for crisis mode */}
        {(mode === 'crisis' || crisisDetected || pulseAnimation) && !isExpanded && (
          <motion.span
            className="absolute -top-1 -right-1 flex h-3 w-3"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </motion.span>
        )}
      </motion.button>

      {/* Tooltip when first loaded */}
      {!isExpanded && pulseAnimation && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute bottom-0 right-16 bg-gray-800 text-white text-xs px-3 py-1 rounded-lg whitespace-nowrap"
        >
          Need help? Click here
        </motion.div>
      )}
    </div>
  );
}