import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wind, 
  Heart, 
  Circle, 
  Square, 
  Triangle,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Settings
} from 'lucide-react';

// Breathing patterns with therapeutic benefits
const BREATHING_PATTERNS = {
  '4-7-8': {
    name: '4-7-8 Breathing',
    description: 'Reduces anxiety and helps with sleep',
    inhale: 4,
    hold: 7,
    exhale: 8,
    icon: Wind,
    benefits: ['Anxiety reduction', 'Better sleep', 'Stress relief']
  },
  box: {
    name: 'Box Breathing',
    description: 'Used by Navy SEALs for focus and calm',
    inhale: 4,
    holdIn: 4,
    exhale: 4,
    holdOut: 4,
    icon: Square,
    benefits: ['Enhanced focus', 'Stress management', 'Emotional regulation']
  },
  triangle: {
    name: 'Triangle Breathing',
    description: 'Simple pattern for beginners',
    inhale: 3,
    hold: 3,
    exhale: 3,
    icon: Triangle,
    benefits: ['Easy to learn', 'Quick relief', 'Centering']
  },
  coherent: {
    name: 'Coherent Breathing',
    description: 'Balances the nervous system',
    inhale: 5,
    exhale: 5,
    icon: Heart,
    benefits: ['Heart rate variability', 'Nervous system balance', 'Calm alertness']
  },
  '7-11': {
    name: '7-11 Breathing',
    description: 'Powerful for panic and anxiety',
    inhale: 7,
    exhale: 11,
    icon: Circle,
    benefits: ['Panic relief', 'Deep relaxation', 'Parasympathetic activation']
  }
};

interface BreathingSession {
  pattern: keyof typeof BREATHING_PATTERNS;
  duration: number;
  timestamp: Date;
  completed: boolean;
  stressLevelBefore?: number;
  stressLevelAfter?: number;
}

export const BreathingExercises: React.FC = () => {
  const [selectedPattern, setSelectedPattern] = useState<keyof typeof BREATHING_PATTERNS>('4-7-8');
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'inhale' | 'hold' | 'exhale' | 'holdOut'>('inhale');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [customDuration, setCustomDuration] = useState(5); // minutes
  const [sessions, setSessions] = useState<BreathingSession[]>([]);
  const [stressLevelBefore, setStressLevelBefore] = useState<number | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const sessionStartTime = useRef<Date | null>(null);

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // Load saved sessions
    const savedSessions = localStorage.getItem('breathingSessions');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
  }, []);

  // Play sound for phase transitions
  const playSound = (frequency: number, duration: number) => {
    if (!soundEnabled || !audioContext.current) return;
    
    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.current.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.current.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + duration);
    
    oscillator.start(audioContext.current.currentTime);
    oscillator.stop(audioContext.current.currentTime + duration);
  };

  // Get next phase based on pattern
  const getNextPhase = (pattern: typeof BREATHING_PATTERNS[keyof typeof BREATHING_PATTERNS], current: string) => {
    if ('holdIn' in pattern) {
      // Box breathing pattern
      switch (current) {
        case 'inhale': return 'holdIn';
        case 'holdIn': return 'exhale';
        case 'exhale': return 'holdOut';
        case 'holdOut': return 'inhale';
        default: return 'inhale';
      }
    } else if ('hold' in pattern) {
      // 4-7-8 or triangle pattern
      switch (current) {
        case 'inhale': return 'hold';
        case 'hold': return 'exhale';
        case 'exhale': return 'inhale';
        default: return 'inhale';
      }
    } else {
      // Simple in-out pattern
      return current === 'inhale' ? 'exhale' : 'inhale';
    }
  };

  // Get duration for current phase
  const getPhaseDuration = (pattern: typeof BREATHING_PATTERNS[keyof typeof BREATHING_PATTERNS], phase: string) => {
    switch (phase) {
      case 'inhale': return pattern.inhale;
      case 'hold': return 'hold' in pattern ? pattern.hold : 0;
      case 'holdIn': return 'holdIn' in pattern ? pattern.holdIn : 0;
      case 'exhale': return pattern.exhale;
      case 'holdOut': return 'holdOut' in pattern ? pattern.holdOut : 0;
      default: return 0;
    }
  };

  // Start breathing exercise
  const startExercise = () => {
    setIsActive(true);
    setCycleCount(0);
    setSessionDuration(0);
    sessionStartTime.current = new Date();
    const pattern = BREATHING_PATTERNS[selectedPattern];
    setTimeRemaining(getPhaseDuration(pattern, 'inhale'));
    setCurrentPhase('inhale');
    playSound(440, 0.2); // A4 note
  };

  // Stop breathing exercise
  const stopExercise = () => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Save session if it lasted more than 30 seconds
    if (sessionDuration > 30 && sessionStartTime.current) {
      const session: BreathingSession = {
        pattern: selectedPattern,
        duration: sessionDuration,
        timestamp: sessionStartTime.current,
        completed: true,
        stressLevelBefore: stressLevelBefore || undefined
      };
      
      const updatedSessions = [...sessions, session];
      setSessions(updatedSessions);
      localStorage.setItem('breathingSessions', JSON.stringify(updatedSessions));
    }
    
    setStressLevelBefore(null);
  };

  // Main breathing timer
  useEffect(() => {
    if (!isActive) return;
    
    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0.1) {
          const pattern = BREATHING_PATTERNS[selectedPattern];
          const nextPhase = getNextPhase(pattern, currentPhase) as any;
          const nextDuration = getPhaseDuration(pattern, nextPhase);
          
          // Play sound for phase transition
          const frequencies: Record<string, number> = {
            inhale: 440,   // A4
            hold: 523,     // C5
            holdIn: 523,   // C5
            exhale: 349,   // F4
            holdOut: 392   // G4
          };
          playSound(frequencies[nextPhase], 0.2);
          
          setCurrentPhase(nextPhase);
          
          // Increment cycle count
          if (nextPhase === 'inhale') {
            setCycleCount(c => c + 1);
          }
          
          // Check if session should end
          if (sessionDuration >= customDuration * 60) {
            stopExercise();
            return 0;
          }
          
          return nextDuration;
        }
        return prev - 0.1;
      });
      
      setSessionDuration(prev => prev + 0.1);
    }, 100);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, currentPhase, selectedPattern, sessionDuration, customDuration]);

  // Get phase display text
  const getPhaseText = () => {
    switch (currentPhase) {
      case 'inhale': return 'Breathe In';
      case 'hold':
      case 'holdIn': return 'Hold';
      case 'exhale': return 'Breathe Out';
      case 'holdOut': return 'Hold Empty';
      default: return '';
    }
  };

  // Calculate circle animation scale
  const getCircleScale = () => {
    const pattern = BREATHING_PATTERNS[selectedPattern];
    const totalDuration = getPhaseDuration(pattern, currentPhase);
    const progress = 1 - (timeRemaining / totalDuration);
    
    switch (currentPhase) {
      case 'inhale': return 1 + progress * 0.5;
      case 'hold':
      case 'holdIn': return 1.5;
      case 'exhale': return 1.5 - progress * 0.5;
      case 'holdOut': return 1;
      default: return 1;
    }
  };

  return (
    <div className="breathing-exercises-container p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Breathing Exercises
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Evidence-based breathing techniques for stress relief and emotional regulation
        </p>
      </div>

      {/* Pattern Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {Object.entries(BREATHING_PATTERNS).map(([key, pattern]) => {
          const Icon = pattern.icon;
          return (
            <motion.div
              key={key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => !isActive && setSelectedPattern(key as keyof typeof BREATHING_PATTERNS)}
              className={`p-4 rounded-xl cursor-pointer transition-all ${
                selectedPattern === key
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                  : 'bg-white dark:bg-gray-800 hover:shadow-lg'
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-6 h-6 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{pattern.name}</h3>
                  <p className={`text-sm mb-2 ${
                    selectedPattern === key ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {pattern.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {pattern.benefits.map((benefit, idx) => (
                      <span
                        key={idx}
                        className={`text-xs px-2 py-1 rounded-full ${
                          selectedPattern === key
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Exercise Area */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 mb-8">
        <div className="flex flex-col items-center">
          {/* Breathing Circle */}
          <div className="relative w-64 h-64 mb-8">
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-30"
              animate={{
                scale: isActive ? getCircleScale() : 1,
              }}
              transition={{
                duration: 0.1,
                ease: "linear"
              }}
            />
            <div className="absolute inset-4 rounded-full bg-white dark:bg-gray-800 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                {isActive ? (
                  <motion.div
                    key="active"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center"
                  >
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {getPhaseText()}
                    </h3>
                    <p className="text-4xl font-mono text-blue-500">
                      {Math.ceil(timeRemaining)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Cycle {cycleCount}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="inactive"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center"
                  >
                    <Wind className="w-12 h-12 text-gray-400 mb-2" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Ready to begin
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-4 mb-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={isActive ? stopExercise : startExercise}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-semibold flex items-center gap-2 shadow-lg"
            >
              {isActive ? (
                <>
                  <Pause className="w-5 h-5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Start
                </>
              )}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                stopExercise();
                setCycleCount(0);
                setSessionDuration(0);
              }}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full font-semibold flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(!showSettings)}
              className="p-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Session Timer */}
          {isActive && (
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Session Time: {Math.floor(sessionDuration / 60)}:{String(Math.floor(sessionDuration % 60)).padStart(2, '0')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Target: {customDuration} minutes
              </p>
            </div>
          )}
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="max-w-md mx-auto">
                <label className="block mb-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Session Duration (minutes)
                  </span>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(parseInt(e.target.value))}
                    disabled={isActive}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 min</span>
                    <span>{customDuration} min</span>
                    <span>30 min</span>
                  </div>
                </label>

                {!isActive && (
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Pre-session Stress Level
                    </span>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                        <button
                          key={level}
                          onClick={() => setStressLevelBefore(level)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                            stressLevelBefore === level
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </label>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Recent Sessions
          </h3>
          <div className="space-y-2">
            {sessions.slice(-5).reverse().map((session, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {React.createElement(BREATHING_PATTERNS[session.pattern].icon, {
                    className: "w-5 h-5 text-gray-600 dark:text-gray-400"
                  })}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {BREATHING_PATTERNS[session.pattern].name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {Math.floor(session.duration / 60)} min {Math.floor(session.duration % 60)} sec
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {new Date(session.timestamp).toLocaleDateString()}
                  </p>
                  {session.stressLevelBefore && (
                    <p className="text-xs text-gray-400">
                      Stress: {session.stressLevelBefore}/10
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};