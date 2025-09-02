import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wind,
  BookOpen,
  Timer,
  Home,
  Settings,
  HelpCircle,
  ChevronLeft,
  Heart,
  Brain,
  Activity,
  Moon,
  Sun,
  Sparkles
} from 'lucide-react';

// Import all wellness components
import { BreathingExercises } from './BreathingExercises';
import { TherapeuticJournal } from './TherapeuticJournal';
import { MeditationTimer } from './MeditationTimer';
import { WellnessDashboard } from './WellnessDashboard';
import MoodTracker from './MoodTracker';

// Navigation items
const WELLNESS_TOOLS = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: Home,
    description: 'Overview of your wellness journey',
    color: 'from-purple-400 to-violet-500',
    component: WellnessDashboard
  },
  {
    id: 'mood',
    name: 'Mood Tracker',
    icon: Heart,
    description: 'Track and understand your emotions',
    color: 'from-pink-400 to-red-500',
    component: MoodTracker
  },
  {
    id: 'breathing',
    name: 'Breathing',
    icon: Wind,
    description: 'Guided breathing exercises',
    color: 'from-cyan-400 to-blue-500',
    component: BreathingExercises
  },
  {
    id: 'meditation',
    name: 'Meditation',
    icon: Timer,
    description: 'Mindfulness meditation timer',
    color: 'from-indigo-400 to-purple-500',
    component: MeditationTimer
  },
  {
    id: 'journal',
    name: 'Journal',
    icon: BookOpen,
    description: 'Therapeutic journaling',
    color: 'from-green-400 to-emerald-500',
    component: TherapeuticJournal
  }
];

// Wellness tips and insights
const WELLNESS_TIPS = [
  {
    category: 'Mindfulness',
    tip: 'Take 3 deep breaths before starting any task to center yourself',
    icon: Brain
  },
  {
    category: 'Physical',
    tip: 'Stand up and stretch every hour to improve circulation',
    icon: Activity
  },
  {
    category: 'Emotional',
    tip: 'Name your emotions without judgment to build emotional awareness',
    icon: Heart
  },
  {
    category: 'Sleep',
    tip: 'Create a consistent bedtime routine for better sleep quality',
    icon: Moon
  },
  {
    category: 'Nutrition',
    tip: 'Stay hydrated - aim for 8 glasses of water throughout the day',
    icon: Sun
  }
];

interface WellnessToolsSuiteProps {
  initialTool?: string;
  onToolChange?: (toolId: string) => void;
  showNavigation?: boolean;
  compactMode?: boolean;
}

export const WellnessToolsSuite: React.FC<WellnessToolsSuiteProps> = ({
  initialTool = 'dashboard',
  onToolChange,
  showNavigation = true,
  compactMode = false
}) => {
  const [selectedTool, setSelectedTool] = useState(initialTool);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(compactMode);
  const [showTips, setShowTips] = useState(true);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Get current tool component
  const currentToolData = WELLNESS_TOOLS.find(tool => tool.id === selectedTool) || WELLNESS_TOOLS[0];
  const CurrentComponent = currentToolData?.component || (() => null);

  // Handle tool selection
  const handleToolSelect = (toolId: string) => {
    setSelectedTool(toolId);
    if (onToolChange) {
      onToolChange(toolId);
    }
  };

  // Navigate to next tip
  const nextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % WELLNESS_TIPS.length);
  };

  // Navigate to previous tip
  const prevTip = () => {
    setCurrentTipIndex((prev) => (prev - 1 + WELLNESS_TIPS.length) % WELLNESS_TIPS.length);
  };

  return (
    <div className={`wellness-tools-suite flex h-screen bg-gray-50 dark:bg-gray-900 ${theme}`}>
      {/* Sidebar Navigation */}
      {showNavigation && (
        <motion.aside
          initial={false}
          animate={{ width: sidebarCollapsed ? 80 : 280 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col"
        >
          {/* Logo/Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                {!sidebarCollapsed && (
                  <div>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                      Wellness Suite
                    </h1>
                    <p className="text-xs text-gray-500">Your mental health toolkit</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <ChevronLeft className={`w-5 h-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-2">
            {WELLNESS_TOOLS.map((tool) => {
              const Icon = tool.icon;
              const isSelected = selectedTool === tool.id;
              
              return (
                <motion.button
                  key={tool.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleToolSelect(tool.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isSelected
                      ? `bg-gradient-to-r ${  tool.color  } text-white shadow-lg`
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                  title={sidebarCollapsed ? tool.name : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <div className="text-left">
                      <p className="font-medium">{tool.name}</p>
                      <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                        {tool.description}
                      </p>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <button
              className={`w-full flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              <Settings className="w-5 h-5" />
              {!sidebarCollapsed && <span>Settings</span>}
            </button>
            <button
              className={`w-full flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              <HelpCircle className="w-5 h-5" />
              {!sidebarCollapsed && <span>Help & Support</span>}
            </button>
          </div>
        </motion.aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar with Tips */}
        {showTips && !compactMode && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                {WELLNESS_TIPS[currentTipIndex] && React.createElement(WELLNESS_TIPS[currentTipIndex].icon, {
                  className: "w-5 h-5 text-blue-500"
                })}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {WELLNESS_TIPS[currentTipIndex]?.category} Tip
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {WELLNESS_TIPS[currentTipIndex]?.tip}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevTip}
                  className="p-1 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded"
                >
                  ←
                </button>
                <button
                  onClick={nextTip}
                  className="p-1 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded"
                >
                  →
                </button>
                <button
                  onClick={() => setShowTips(false)}
                  className="p-1 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded text-gray-500"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Component Content */}
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedTool}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <CurrentComponent />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Quick Stats Footer */}
        {!compactMode && (
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-600 dark:text-gray-400">Active Session</span>
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Today's Wellness Score: <span className="font-semibold text-gray-900 dark:text-white">85/100</span>
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Streak: <span className="font-semibold text-orange-500">7 days</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main export
export default WellnessToolsSuite;

// Export individual components for standalone use
export { BreathingExercises } from './BreathingExercises';
export { TherapeuticJournal } from './TherapeuticJournal';
export { MeditationTimer } from './MeditationTimer';
export { WellnessDashboard } from './WellnessDashboard';
export { default as MoodTracker } from './MoodTracker';

// Named export for compatibility (already exported above as const)