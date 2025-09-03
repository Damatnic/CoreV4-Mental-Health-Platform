import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  _Volume2,
  VolumeX,
  Settings,
  Bell,
  Music,
  Headphones,
  Timer,
  TrendingUp,
  Calendar,
  Award,
  _ChevronLeft,
  _ChevronRight,
  Zap,
  Heart,
  Brain,
  Wind,
  Star
} from 'lucide-react';
import { secureStorage } from '../../services/security/SecureLocalStorage';

// Meditation types and their benefits
const MEDITATION_TYPES = {
  mindfulness: {
    name: 'Mindfulness',
    description: 'Present moment awareness',
    icon: Brain,
    color: 'from-blue-400 to-indigo-500',
    benefits: ['Reduced stress', 'Better focus', 'Emotional regulation'],
    defaultDuration: 10
  },
  loving_kindness: {
    name: 'Loving Kindness',
    description: 'Cultivate compassion',
    icon: Heart,
    color: 'from-pink-400 to-red-500',
    benefits: ['Increased empathy', 'Self-compassion', 'Positive emotions'],
    defaultDuration: 15
  },
  body_scan: {
    name: 'Body Scan',
    description: 'Progressive relaxation',
    icon: Zap,
    color: 'from-green-400 to-emerald-500',
    benefits: ['Physical relaxation', 'Body awareness', 'Tension release'],
    defaultDuration: 20
  },
  breath_focus: {
    name: 'Breath Focus',
    description: 'Anchor to breathing',
    icon: Wind,
    color: 'from-cyan-400 to-blue-500',
    benefits: ['Calming', 'Concentration', 'Anxiety reduction'],
    defaultDuration: 5
  }
};

// Ambient sound options
const AMBIENT_SOUNDS = {
  none: { name: 'Silence', icon: VolumeX },
  rain: { name: 'Rain', icon: Music, frequency: 60, variation: 20 },
  ocean: { name: 'Ocean Waves', icon: Music, frequency: 40, variation: 15 },
  forest: { name: 'Forest', icon: Music, frequency: 80, variation: 30 },
  singing_bowl: { name: 'Singing Bowl', icon: Bell, frequency: 256, variation: 0 },
  white_noise: { name: 'White Noise', icon: Headphones, frequency: 0, variation: 0 }
};

// Bell intervals
const _BELL_INTERVALS = {
  none: 'No bells',
  start_end: 'Start & End only',
  '1': 'Every minute',
  '2': 'Every 2 minutes',
  '5': 'Every 5 minutes',
  '10': 'Every 10 minutes'
};

interface MeditationSession {
  id: string;
  type: keyof typeof MEDITATION_TYPES;
  duration: number;
  completedDuration: number;
  timestamp: Date;
  notes?: string;
  moodBefore?: number;
  moodAfter?: number;
}

interface MeditationStreak {
  current: number;
  longest: number;
  lastSessionDate: string | null;
}

export const MeditationTimer: React.FC = () => {
  const [selectedType, _setSelectedType] = useState<keyof typeof MEDITATION_TYPES>('mindfulness');
  const [duration, setDuration] = useState(10); // minutes
  const [timeRemaining, setTimeRemaining] = useState(0); // seconds
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [ambientSound, _setAmbientSound] = useState<keyof typeof AMBIENT_SOUNDS>('none');
  const [bellInterval, _setBellInterval] = useState<keyof typeof BELL_INTERVALS>('start_end');
  const [volume, _setVolume] = useState(50);
  const [showSettings, _setShowSettings] = useState(false);
  const [sessions, setSessions] = useState<MeditationSession[]>([]);
  const [streak, setStreak] = useState<MeditationStreak>({ current: 0, longest: 0, lastSessionDate: null });
  const [showStats, _setShowStats] = useState(false);
  const [customMessage, _setCustomMessage] = useState('');
  const [preparationTime, _setPreparationTime] = useState(10); // seconds
  const [isPreparing, setIsPreparing] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const ambientOscillator = useRef<OscillatorNode | null>(null);
  const ambientGain = useRef<GainNode | null>(null);
  const sessionStartTime = useRef<Date | null>(null);
  const elapsedTime = useRef(0);

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as unknown).webkitAudioContext)();
    }
    
    // Load saved sessions and streak
    const _savedSessions = secureStorage.getItem('meditationSessions');
    const _savedStreak = secureStorage.getItem('meditationStreak');
    
    if (_savedSessions) {
      const parsed = JSON.parse(_savedSessions);
      setSessions(parsed.map((s: unknown) => ({
        ...s,
        timestamp: new Date(s.timestamp)
      })));
    }
    
    if (_savedStreak) {
      setStreak(JSON.parse(_savedStreak));
    }
    
    return () => {
      stopAmbientSound();
    };
  }, []);

  // Play bell sound
  const playBell = useCallback((type: 'start' | 'end' | 'interval' = 'interval') => {
    if (!audioContext.current) return;
    
    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);
    
    // Different frequencies for different bell types
    const frequencies = {
      start: 528,  // Solfeggio frequency for transformation
      end: 639,    // Solfeggio frequency for harmony
      interval: 432 // Natural frequency
    };
    
    oscillator.frequency.value = frequencies[type];
    oscillator.type = 'sine';
    
    // Envelope for bell-like sound
    const now = audioContext.current.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume / 100 * 0.3, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    
    oscillator.start(_now);
    oscillator.stop(now + 1.5);
  }, []);

  // Start ambient sound
  const startAmbientSound = () => {
    if (!audioContext.current || ambientSound === 'none') return;
    
    const sound = AMBIENT_SOUNDS[ambientSound];
    if (!sound.frequency) {
      // White noise
      const bufferSize = 2 * audioContext.current.sampleRate;
      const noiseBuffer = audioContext.current.createBuffer(1, bufferSize, audioContext.current.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      
      const whiteNoise = audioContext.current.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;
      
      ambientGain.current = audioContext.current.createGain();
      ambientGain.current.gain.value = volume / 100 * 0.1;
      
      whiteNoise.connect(ambientGain.current);
      ambientGain.current.connect(audioContext.current.destination);
      whiteNoise.start();
    } else {
      // Tonal ambient sounds
      ambientOscillator.current = audioContext.current.createOscillator();
      ambientGain.current = audioContext.current.createGain();
      
      ambientOscillator.current.frequency.value = sound.frequency;
      ambientOscillator.current.type = 'sine';
      
      // Add some variation for natural sound
      if (sound.variation > 0) {
        const lfo = audioContext.current.createOscillator();
        const lfoGain = audioContext.current.createGain();
        
        lfo.frequency.value = 0.2; // Slow modulation
        lfoGain.gain.value = sound.variation;
        
        lfo.connect(lfoGain);
        lfoGain.connect(ambientOscillator.current.frequency);
        lfo.start();
      }
      
      ambientGain.current.gain.value = volume / 100 * 0.05;
      
      ambientOscillator.current.connect(ambientGain.current);
      ambientGain.current.connect(audioContext.current.destination);
      ambientOscillator.current.start();
    }
  };

  // Stop ambient sound
  const stopAmbientSound = useCallback(() => {
    if (ambientOscillator.current) {
      ambientOscillator.current.stop();
      ambientOscillator.current = null;
    }
    if (ambientGain.current) {
      ambientGain.current.disconnect();
      ambientGain.current = null;
    }
  }, []);

  // Start meditation
  const startMeditation = () => {
    setIsPreparing(true);
    setTimeRemaining(_preparationTime);
    
    // Start preparation countdown
    const _prepInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(_prepInterval);
          setIsPreparing(false);
          actuallyStartMeditation();
          return duration * 60;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Actually start the meditation after preparation
  const actuallyStartMeditation = () => {
    setIsActive(true);
    setIsPaused(false);
    sessionStartTime.current = new Date();
    elapsedTime.current = 0;
    setTimeRemaining(duration * 60);
    
    playBell('start');
    startAmbientSound();
  };

  // Pause/Resume meditation
  const togglePause = () => {
    setIsPaused(!isPaused);
    if (_isPaused) {
      startAmbientSound();
    } else {
      stopAmbientSound();
    }
  };

  // Stop meditation
  const stopMeditation = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
    setIsPreparing(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    stopAmbientSound();
    
    // Save session if it lasted more than 1 minute
    if (elapsedTime.current > 60 && sessionStartTime.current) {
      const session: MeditationSession = {
        id: Date.now().toString(),
        type: selectedType,
        duration: duration * 60,
        completedDuration: elapsedTime.current,
        timestamp: sessionStartTime.current
      };
      
      const _updatedSessions = [...sessions, session];
      setSessions(_updatedSessions);
      secureStorage.setItem('meditationSessions', JSON.stringify(_updatedSessions));
      
      // Update streak
      updateStreak();
      
      // Play completion bell
      if (elapsedTime.current >= duration * 60 * 0.8) {
        playBell('end');
      }
    }
    
    setTimeRemaining(0);
  }, [duration, sessions, selectedType, stopAmbientSound, updateStreak]);

  // Update meditation streak
  const updateStreak = useCallback(() => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    const newStreak = { ...streak };
    
    if (streak.lastSessionDate === today) {
      // Already meditated today, don't change streak
    } else if (streak.lastSessionDate === yesterday) {
      // Continuing streak
      newStreak.current += 1;
      newStreak.longest = Math.max(newStreak.current, newStreak.longest);
    } else {
      // Starting new streak
      newStreak.current = 1;
      newStreak.longest = Math.max(1, newStreak.longest);
    }
    
    newStreak.lastSessionDate = today;
    setStreak(_newStreak);
    secureStorage.setItem('meditationStreak', JSON.stringify(_newStreak));
  }, [streak]);

  // Main timer effect
  useEffect(() => {
    if (!isActive || isPaused) return;
    
    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          stopMeditation();
          return 0;
        }
        
        elapsedTime.current += 1;
        
        // Check for bell intervals
        if (bellInterval !== 'none' && bellInterval !== 'start_end') {
          const intervalSeconds = parseInt(_bellInterval) * 60;
          if (elapsedTime.current % intervalSeconds === 0) {
            playBell('interval');
          }
        }
        
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, bellInterval, playBell, stopMeditation]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const getProgress = () => {
    if (!isActive || isPreparing) return 0;
    return ((duration * 60 - timeRemaining) / (duration * 60)) * 100;
  };

  // Get total meditation time
  const getTotalMeditationTime = () => {
    const total = sessions.reduce((sum, session) => sum + session.completedDuration, 0);
    return Math.floor(total / 60);
  };

  // Get sessions this week
  const getWeeklySessionCount = () => {
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    return sessions.filter(s => s.timestamp > weekAgo).length;
  };

  // Get achievement badges
  const getAchievements = () => {
    const achievements = [];
    const totalMinutes = getTotalMeditationTime();
    
    if (totalMinutes >= 60) achievements.push({ name: 'First Hour', icon: Award, color: 'text-yellow-500' });
    if (totalMinutes >= 300) achievements.push({ name: '5 Hours', icon: Award, color: 'text-blue-500' });
    if (totalMinutes >= 1000) achievements.push({ name: '1000 Minutes', icon: Award, color: 'text-purple-500' });
    if (streak.current >= 7) achievements.push({ name: 'Week Streak', icon: Zap, color: 'text-orange-500' });
    if (streak.current >= 30) achievements.push({ name: 'Month Streak', icon: Zap, color: 'text-red-500' });
    if (sessions.length >= 10) achievements.push({ name: '10 Sessions', icon: Star, color: 'text-green-500' });
    
    return achievements;
  };

  return (
    <div className="meditation-timer-container max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Meditation Timer
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Cultivate mindfulness and inner peace with guided meditation
            </p>
          </div>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowStats(!showStats)}
              className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
            >
              <TrendingUp className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Streak and Stats Bar */}
        <div className="mt-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-500" />
            <span className="text-gray-700 dark:text-gray-300">
              {streak.current} day streak
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-blue-500" />
            <span className="text-gray-700 dark:text-gray-300">
              {getTotalMeditationTime()} total minutes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-green-500" />
            <span className="text-gray-700 dark:text-gray-300">
              {getWeeklySessionCount()} sessions this week
            </span>
          </div>
        </div>
      </div>

      {/* Meditation Type Selection */}
      {!isActive && !isPreparing && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Choose Your Practice
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(_MEDITATION_TYPES).map(([key, type]) => {
              const Icon = type.icon;
              return (
                <motion.div
                  key={key}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedType(key as keyof typeof MEDITATION_TYPES);
                    setDuration(type.defaultDuration);
                  }}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    selectedType === key
                      ? `bg-gradient-to-r ${  type.color  } text-white shadow-lg`
                      : 'bg-white dark:bg-gray-800 hover:shadow-md'
                  }`}
                >
                  <Icon className="w-8 h-8 mx-auto mb-2" />
                  <h4 className="font-semibold text-center mb-1">{type.name}</h4>
                  <p className={`text-xs text-center ${
                    selectedType === key ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {type.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Timer Area */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 mb-8">
        <div className="max-w-md mx-auto">
          {/* Timer Circle */}
          <div className="relative w-64 h-64 mx-auto mb-8">
            {/* Progress Ring */}
            <svg className="absolute inset-0 transform -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 120}`}
                strokeDashoffset={`${2 * Math.PI * 120 * (1 - getProgress() / 100)}`}
                className="text-blue-500 transition-all duration-1000"
              />
            </svg>
            
            {/* Timer Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                {isPreparing ? (
                  <motion.div
                    key="preparing"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-center"
                  >
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Get ready...
                    </p>
                    <p className="text-4xl font-mono font-bold text-gray-900 dark:text-white">
                      {timeRemaining}
                    </p>
                  </motion.div>
                ) : isActive ? (
                  <motion.div
                    key="active"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-center"
                  >
                    <p className="text-5xl font-mono font-bold text-gray-900 dark:text-white mb-2">
                      {formatTime(_timeRemaining)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {isPaused ? 'Paused' : MEDITATION_TYPES[selectedType].name}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="inactive"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-center"
                  >
                    <p className="text-5xl font-mono font-bold text-gray-900 dark:text-white mb-2">
                      {formatTime(duration * 60)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Ready to begin
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Duration Slider */}
          {!isActive && !isPreparing && (
            <div className="mb-6">
              <label htmlFor="input_bn2mjhgvt" className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span>Duration</span>
                <span className="text-lg">{duration} minutes</span>
              </label>
              <input
                type="range"
                min="1"
                max="60"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 min</span>
                <span>60 min</span>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex justify-center gap-4">
            {!isActive && !isPreparing ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startMeditation}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-semibold flex items-center gap-2 shadow-lg"
              >
                <Play className="w-5 h-5" />
                Begin Session
              </motion.button>
            ) : (
              <>
                {!isPreparing && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={togglePause}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-semibold flex items-center gap-2 shadow-lg"
                  >
                    {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={stopMeditation}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full font-semibold flex items-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  End Session
                </motion.button>
              </>
            )}
          </div>

          {/* Custom Message */}
          {isActive && customMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg text-center"
            >
              <p className="text-gray-700 dark:text-gray-300 italic">
                "{customMessage}"
              </p>
            </motion.div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                {/* Ambient Sound */}
                <div>
                  <label htmlFor="input_o6sdain3o" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Ambient Sound
                  </label>
                  <select
                    value={ambientSound}
                    onChange={(e) => setAmbientSound(e.target.value as keyof typeof AMBIENT_SOUNDS)}
                    disabled={isActive}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(_AMBIENT_SOUNDS).map(([key, sound]) => (
                      <option key={key} value={key}>{sound.name}</option>
                    ))}
                  </select>
                </div>

                {/* Bell Interval */}
                <div>
                  <label htmlFor="input_h1utea24z" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Bell Interval
                  </label>
                  <select
                    value={bellInterval}
                    onChange={(e) => setBellInterval(e.target.value as keyof typeof BELL_INTERVALS)}
                    disabled={isActive}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(_BELL_INTERVALS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Volume */}
                <div>
                  <label htmlFor="input_74lxh2fpk" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Volume: {volume}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Preparation Time */}
                <div>
                  <label htmlFor="input_gkyv95pvz" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Preparation Time: {preparationTime}s
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={preparationTime}
                    onChange={(e) => setPreparationTime(parseInt(e.target.value))}
                    disabled={isActive}
                    className="w-full"
                  />
                </div>

                {/* Custom Message */}
                <div className="md:col-span-2">
                  <label htmlFor="input_ppmdzvirf" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Meditation Intention (_optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 'I am calm and present'"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    disabled={isActive}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats and Achievements */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
          >
            {/* Recent Sessions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Sessions
              </h3>
              <div className="space-y-3">
                {sessions.slice(-5).reverse().map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {React.createElement(MEDITATION_TYPES[session.type].icon, {
                        className: "w-5 h-5 text-gray-600 dark:text-gray-400"
                      })}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {MEDITATION_TYPES[session.type].name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {Math.floor(session.completedDuration / 60)} min
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(session.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Achievements
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {getAchievements().map((achievement, idx) => (
                  <div
                    key={idx}
                    className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <Award className={`w-8 h-8 mx-auto mb-2 ${achievement.color}`} />
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {achievement.name}
                    </p>
                  </div>
                ))}
              </div>
              {getAchievements().length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Keep practicing to unlock achievements!
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};