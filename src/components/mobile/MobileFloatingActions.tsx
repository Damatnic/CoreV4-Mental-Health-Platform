import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Zap, 
  Heart, 
  Wind, 
  MessageCircle, 
  Calendar, 
  Camera,
  Mic,
  X,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMobileFeatures } from '../../hooks/useMobileFeatures';

interface FloatingAction {
  id: string;
  icon: React.ElementType;
  label: string;
  color: string;
  path?: string;
  action?: () => void;
  urgent?: boolean;
}

interface MobileFloatingActionsProps {
  showCrisisButton?: boolean;
}

export function MobileFloatingActions({ showCrisisButton = true }: MobileFloatingActionsProps) {
  const navigate = useNavigate();
  const { canVibrate, canShare } = useMobileFeatures();
  const [isExpanded, setIsExpanded] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });

  const actions: FloatingAction[] = [
    {
      id: 'mood',
      icon: Heart,
      label: 'Quick Mood',
      color: 'from-pink-500 to-rose-500',
      path: '/wellness/mood-tracker'
    },
    {
      id: 'breathe',
      icon: Wind,
      label: 'Breathing',
      color: 'from-cyan-500 to-blue-500',
      path: '/wellness/breathing'
    },
    {
      id: 'voice',
      icon: Mic,
      label: 'Voice Note',
      color: 'from-purple-500 to-indigo-500',
      action: () => startVoiceRecording()
    },
    {
      id: 'photo',
      icon: Camera,
      label: 'Photo Journal',
      color: 'from-green-500 to-emerald-500',
      action: () => takePhoto()
    },
    {
      id: 'chat',
      icon: MessageCircle,
      label: 'AI Chat',
      color: 'from-violet-500 to-purple-500',
      path: '/ai-therapy'
    }
  ];

  const startVoiceRecording = async () => {
    try {
      if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Voice recording logic would go here
        console.log('Voice recording started');
        if (canVibrate) navigator.vibrate([100, 50, 100]);
        stream.getTracks().forEach(track => track.stop()); // Stop for demo
      }
    } catch (error) {
      console.error('Voice recording failed:', error);
    }
  };

  const takePhoto = async () => {
    try {
      if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        });
        // Camera logic would go here
        console.log('Camera opened');
        if (canVibrate) navigator.vibrate(50);
        stream.getTracks().forEach(track => track.stop()); // Stop for demo
      }
    } catch (error) {
      console.error('Camera access failed:', error);
    }
  };

  const handleActionClick = (action: FloatingAction) => {
    if (canVibrate) {
      navigator.vibrate(action.urgent ? [100, 50, 100] : 30);
    }
    
    if (action.path) {
      navigate(action.path);
    } else if (action.action) {
      action.action();
    }
    
    setIsExpanded(false);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (canVibrate) {
      navigator.vibrate(isExpanded ? 50 : [50, 50, 100]);
    }
  };

  // Crisis button that appears when needed
  const CrisisFloatingButton = () => (
    <motion.button
      className="fixed bottom-28 right-6 z-50 w-14 h-14 bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-lg flex items-center justify-center"
      style={{ 
        marginBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 8px 32px rgba(239, 68, 68, 0.4)'
      }}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ 
        scale: 1, 
        rotate: 0,
        boxShadow: [
          '0 8px 32px rgba(239, 68, 68, 0.4)',
          '0 8px 40px rgba(239, 68, 68, 0.6)',
          '0 8px 32px rgba(239, 68, 68, 0.4)'
        ]
      }}
      exit={{ scale: 0, rotate: -180 }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 25,
        boxShadow: { duration: 2, repeat: Infinity }
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => {
        if (canVibrate) navigator.vibrate([100, 50, 100, 50, 200]);
        navigate('/crisis');
      }}
    >
      <AlertTriangle className="w-6 h-6 text-white" />
    </motion.button>
  );

  return (
    <>
      {/* Crisis Button - Always visible when enabled */}
      {showCrisisButton && <CrisisFloatingButton />}

      {/* Main FAB */}
      <motion.div
        className="fixed bottom-6 right-6 z-40"
        style={{ 
          marginBottom: 'env(safe-area-inset-bottom, 0px)',
          x: dragPosition.x,
          y: dragPosition.y
        }}
        drag
        dragConstraints={{
          left: -window.innerWidth + 80,
          right: 0,
          top: -window.innerHeight + 200,
          bottom: 0
        }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          setDragPosition({
            x: info.offset.x,
            y: info.offset.y
          });
        }}
        whileDrag={{ scale: 1.1 }}
      >
        {/* Action Buttons */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="absolute bottom-16 right-0 flex flex-col space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {actions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.id}
                    className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-full shadow-lg flex items-center justify-center backdrop-blur-sm`}
                    initial={{ 
                      scale: 0, 
                      y: 20,
                      rotate: -90
                    }}
                    animate={{ 
                      scale: 1, 
                      y: 0,
                      rotate: 0
                    }}
                    exit={{ 
                      scale: 0, 
                      y: 20,
                      rotate: -90
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 25,
                      delay: index * 0.05
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleActionClick(action)}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB Button */}
        <motion.button
          className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center backdrop-blur-sm"
          style={{
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)'
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleExpanded}
          animate={{
            rotate: isExpanded ? 45 : 0,
            backgroundColor: isExpanded 
              ? ['#3b82f6', '#8b5cf6'] 
              : ['#3b82f6', '#9333ea']
          }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            animate={{ rotate: isExpanded ? 45 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {isExpanded ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Plus className="w-6 h-6 text-white" />
            )}
          </motion.div>
        </motion.button>

        {/* Expanded backdrop */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpanded(false)}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Action Labels */}
      <AnimatePresence>
        {isExpanded && (
          <div className="fixed bottom-6 right-24 z-30">
            {actions.map((action, index) => (
              <motion.div
                key={`label-${action.id}`}
                className="absolute bg-black/80 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-sm whitespace-nowrap"
                style={{ 
                  bottom: `${72 + (index * 48)}px`,
                  right: 8
                }}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: index * 0.05 }}
              >
                {action.label}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default MobileFloatingActions;