import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, Shield, Zap } from 'lucide-react';
import { useConsoleSound } from '../../services/console/ConsoleSoundSystem';

interface ConsoleBootSequenceProps {
  onBootComplete: () => void;
  skipBoot?: boolean;
}

export function ConsoleBootSequence({ onBootComplete, skipBoot = false }: ConsoleBootSequenceProps) {
  const [bootStage, _setBootStage] = useState(0);
  const [showSkip, _setShowSkip] = useState(false);
  const { playSound } = useConsoleSound();

  // Boot sequence stages - wrapped in useMemo to prevent recreating on every render
  const bootStages = useMemo(() => [
    { id: 0, duration: 1500, name: 'initializing' },
    { id: 1, duration: 2000, name: 'logo' },
    { id: 2, duration: 1500, name: 'loading' },
    { id: 3, duration: 1000, name: 'ready' },
  ], []);

  useEffect(() => {
    if (skipBoot) {
      onBootComplete();
      return;
    }

    // Show skip button after 2 seconds
    const _skipTimer = setTimeout(() => {
      _setShowSkip(true);
    }, 2000);

    // Play startup sound
    playSound('startup');

    // Progress through boot stages
    const _timer = setTimeout(() => {
      if (bootStage < bootStages.length - 1) {
        _setBootStage(bootStage + 1);
      } else {
        // Boot complete
        setTimeout(onBootComplete, 500);
      }
    }, bootStages[bootStage]?.duration || 1000);

    return () => {
      clearTimeout(_timer);
      clearTimeout(_skipTimer);
    };
  }, [bootStage, onBootComplete, skipBoot, playSound, bootStages]);

  const handleSkip = () => {
    onBootComplete();
  };

  if (skipBoot) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden"
      >
        {/* Dynamic background */}
        <div className="absolute inset-0">
          <motion.div
            animate={{
              background: [
                'radial-gradient(circle at 30% 40%, #1a1a1a 0%, #000000 70%)',
                'radial-gradient(circle at 70% 60%, #1e3a8a 0%, #000000 70%)',
                'radial-gradient(circle at 50% 50%, #7c3aed 0%, #000000 70%)',
                'radial-gradient(circle at 50% 50%, #059669 0%, #000000 70%)',
              ]
            }}
            transition={{
              duration: 6,
              ease: 'easeInOut',
            }}
            className="w-full h-full"
          />
          
          {/* Animated particles */}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                opacity: 0,
              }}
              animate={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 4 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
              className="absolute w-1 h-1 bg-blue-400 rounded-full blur-sm"
            />
          ))}
        </div>

        {/* Boot sequence content */}
        <div className="relative z-10 text-center">
          {bootStage === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 1 }}
            >
              <div className="text-white font-mono text-sm mb-4 opacity-60">
                INITIALIZING ASTRAL CORE SYSTEM...
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full mx-auto"
              />
            </motion.div>
          )}

          {bootStage === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              {/* Logo animation */}
              <motion.div
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 20,
                  delay: 0.2
                }}
                className="mb-8"
              >
                <div className="relative">
                  <motion.div
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(59, 130, 246, 0.5)',
                        '0 0 40px rgba(139, 92, 246, 0.7)',
                        '0 0 20px rgba(59, 130, 246, 0.5)',
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <Sparkles className="w-12 h-12 text-white" />
                  </motion.div>
                  
                  {/* Orbital rings */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 w-32 h-32 -m-4 mx-auto"
                  >
                    <div className="w-full h-full border border-blue-400/30 rounded-full" />
                  </motion.div>
                  
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 w-40 h-40 -m-8 mx-auto"
                  >
                    <div className="w-full h-full border border-purple-400/20 rounded-full" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <h1 className="text-4xl font-bold text-white mb-2">
                  ASTRAL CORE
                </h1>
                <p className="text-blue-300 text-lg font-light tracking-wide">
                  Mental Health Console
                </p>
              </motion.div>
            </motion.div>
          )}

          {bootStage === 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="text-white text-2xl font-bold mb-6">
                Loading Your Wellness Profile
              </div>
              
              {/* Progress indicators */}
              <div className="space-y-4 mb-8">
                {[
                  { icon: <Heart className="w-5 h-5" />, label: 'Wellness Data', delay: 0 },
                  { icon: <Shield className="w-5 h-5" />, label: 'Security Protocols', delay: 0.5 },
                  { icon: <Zap className="w-5 h-5" />, label: 'System Ready', delay: 1 },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: item.delay }}
                    className="flex items-center justify-center space-x-3 text-gray-300"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ 
                        delay: item.delay + 0.5,
                        duration: 0.5
                      }}
                      className="text-green-400"
                    >
                      {item.icon}
                    </motion.div>
                    <span>{item.label}</span>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: item.delay + 0.8 }}
                      className="text-green-400 font-bold"
                    >
                      ✓
                    </motion.div>
                  </motion.div>
                ))}
              </div>

              {/* Loading bar */}
              <div className="w-80 h-2 bg-gray-800 rounded-full mx-auto overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.2, ease: 'easeInOut' }}
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                />
              </div>
            </motion.div>
          )}

          {bootStage === 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="text-center"
            >
              <motion.div
                animate={{
                  textShadow: [
                    '0 0 10px rgba(34, 197, 94, 0.5)',
                    '0 0 20px rgba(34, 197, 94, 0.8)',
                    '0 0 10px rgba(34, 197, 94, 0.5)',
                  ]
                }}
                transition={{ duration: 1, repeat: 3 }}
                className="text-6xl font-bold text-green-400 mb-4"
              >
                READY
              </motion.div>
              <p className="text-white text-xl">
                Welcome to your mental wellness console
              </p>
            </motion.div>
          )}
        </div>

        {/* Skip button */}
        <AnimatePresence>
          {showSkip && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={handleSkip}
              className="fixed bottom-8 right-8 px-4 py-2 bg-gray-800/80 hover:bg-gray-700/80 text-white rounded-lg border border-gray-600/50 hover:border-gray-500/50 transition-all duration-200 backdrop-blur-md text-sm"
            >
              Press SPACE to skip
            </motion.button>
          )}
        </AnimatePresence>

        {/* Handle spacebar skip */}
        <div
          role="button"
          aria-label="Press spacebar to skip"
          className="fixed inset-0 z-0"
          onKeyDown={(e) => {
            if (e.code === 'Space' && showSkip) {
              e.preventDefault();
              handleSkip();
            }
          }}
          tabIndex={-1}
        />
      </motion.div>
    </AnimatePresence>
  );
}