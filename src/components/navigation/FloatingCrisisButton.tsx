import React, { useState, useEffect } from 'react';
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

  // Hide on crisis page itself
  if (location.pathname === '/crisis') {
    return null;
  }

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

  // Handle drag functionality for repositioning
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isExpanded) {
      setIsDragging(true);
      e.preventDefault();
    }
  };

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (isDragging && !isExpanded) {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      const newX = Math.max(20, Math.min(window.innerWidth - 80, clientX - 30));
      const newY = Math.max(20, Math.min(window.innerHeight - 80, clientY - 30));
      
      setPosition({ x: window.innerWidth - newX - 60, y: window.innerHeight - newY - 60 });
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

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
  }, [isDragging]);

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
        {isExpanded ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-red-500 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <span className="font-semibold">Crisis Support</span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-red-600 rounded-lg transition-colors"
                aria-label="Minimize crisis support panel"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>
            
            {/* Crisis Options */}
            <div className="p-2">
              <div className="grid grid-cols-2 gap-2">
                {crisisOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={option.action}
                    className={`${option.color} text-white rounded-lg p-3 transition-colors`}
                  >
                    <div className="flex flex-col items-center">
                      {option.icon}
                      <span className="font-semibold text-sm mt-1">{option.label}</span>
                      {option.sublabel && (
                        <span className="text-xs opacity-90">{option.sublabel}</span>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
              
              {/* Safety message */}
              <div className="mt-3 p-2 bg-amber-50 rounded-lg">
                <p className="text-xs text-amber-800 text-center">
                  You're not alone. Help is available 24/7.
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExpanded(true)}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            className={`
              relative group bg-red-500 hover:bg-red-600 text-white rounded-full p-4 shadow-lg transition-all
              ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
              ${pulseAnimation && !isExpanded ? 'animate-pulse' : ''}
            `}
            aria-label="Open crisis support panel"
          >
            {/* Pulsing ring for attention */}
            {pulseAnimation && (
              <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></span>
            )}
            
            <AlertTriangle className="h-6 w-6 relative z-10" />
            
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              Crisis Help Available
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simplified crisis button for mobile
export function MobileCrisisButton() {
  const location = useLocation();
  const [showQuickActions, setShowQuickActions] = useState(false);
  
  if (location.pathname === '/crisis') {
    return null;
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowQuickActions(true)}
        className="fixed right-4 bottom-20 z-40 bg-red-500 text-white rounded-full p-3 shadow-lg md:hidden"
        aria-label="Crisis help"
      >
        <AlertTriangle className="h-5 w-5" />
        <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></span>
      </motion.button>

      {/* Quick actions modal */}
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center md:hidden"
            onClick={() => setShowQuickActions(false)}
          >
            <div className="absolute inset-0 bg-black/50" />
            
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="relative bg-white rounded-t-2xl w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3">
                <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
              </div>
              
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  Crisis Support
                </h2>
              </div>
              
              {/* Actions */}
              <div className="p-4 space-y-2">
                <a
                  href="tel:988"
                  className="flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                >
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-red-600 mr-3" />
                    <div>
                      <div className="font-semibold text-gray-900">Call 988</div>
                      <div className="text-sm text-gray-600">24/7 Crisis Hotline</div>
                    </div>
                  </div>
                  <ChevronUp className="h-5 w-5 text-gray-400 rotate-90" />
                </a>
                
                <a
                  href="sms:741741?body=HOME"
                  className="flex items-center justify-between p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors"
                >
                  <div className="flex items-center">
                    <MessageCircle className="h-5 w-5 text-orange-600 mr-3" />
                    <div>
                      <div className="font-semibold text-gray-900">Text HOME to 741741</div>
                      <div className="text-sm text-gray-600">Crisis Text Line</div>
                    </div>
                  </div>
                  <ChevronUp className="h-5 w-5 text-gray-400 rotate-90" />
                </a>
                
                <button
                  onClick={() => window.location.href = '/crisis'}
                  className="w-full flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
                >
                  <div className="flex items-center">
                    <HelpCircle className="h-5 w-5 text-purple-600 mr-3" />
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">More Resources</div>
                      <div className="text-sm text-gray-600">Coping tools & support</div>
                    </div>
                  </div>
                  <ChevronUp className="h-5 w-5 text-gray-400 rotate-90" />
                </button>
              </div>
              
              {/* Close button */}
              <div className="px-4 pb-4">
                <button
                  onClick={() => setShowQuickActions(false)}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}