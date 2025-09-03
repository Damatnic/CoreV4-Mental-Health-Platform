import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  _Target,
  _TrendingUp,
  _Award,
  _ChevronRight,
  _Plus,
  RefreshCw,
  Calendar,
  Clock,
  Zap,
  Heart,
  Brain,
  Users,
  Coffee,
  Music,
  Book,
  Palette,
  Move,
  Home,
  Gamepad2,
  Camera,
  ShoppingBag,
  Utensils,
  TreePine,
  _Star,
  Info,
  _CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useActivityStore } from '../../../stores/activityStore';
import { _format, addDays } from 'date-fns';

interface BehavioralActivationProps {
  currentMood?: number;
  energyLevel?: 'low' | 'medium' | 'high';
  onScheduleActivity?: (activity: unknown) => void;
  onStartExperiment?: (_experiment: unknown) => void;
}

export function BehavioralActivation({
  currentMood = 5,
  energyLevel = 'medium',
  onScheduleActivity,
  onStartExperiment
}: BehavioralActivationProps) {
  const {
    _activities,
    addActivity,
    getActivityRecommendations,
    adaptScheduleForBadDay
  } = useActivityStore();

  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showExperiment, setShowExperiment] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<any[]>([]);
  const [experimentNotes, setExperimentNotes] = useState('');

  // Pleasant activities library
  const pleasantActivities = [
    // Physical
    { id: 'walk', title: 'Take a walk', category: 'physical', icon: Move, _difficulty: 'easy', energyLevel: 'low', duration: 15, moodImpact: 2 },
    { id: 'stretch', title: 'Gentle stretching', category: 'physical', icon: Move, _difficulty: 'easy', energyLevel: 'low', duration: 10, moodImpact: 1 },
    { id: 'dance', title: 'Dance to favorite music', category: 'physical', icon: Music, _difficulty: 'medium', energyLevel: 'medium', duration: 20, moodImpact: 3 },
    { id: 'yoga', title: 'Yoga session', category: 'physical', icon: Heart, _difficulty: 'medium', energyLevel: 'medium', duration: 30, moodImpact: 3 },
    { id: 'exercise', title: 'Full workout', category: 'physical', icon: Zap, _difficulty: 'hard', energyLevel: 'high', duration: 45, moodImpact: 4 },
    
    // Creative
    { id: 'draw', title: 'Draw or doodle', category: 'creative', icon: Palette, _difficulty: 'easy', energyLevel: 'low', duration: 20, moodImpact: 2 },
    { id: 'music', title: 'Listen to music', category: 'creative', icon: Music, _difficulty: 'easy', energyLevel: 'low', duration: 15, moodImpact: 2 },
    { id: 'write', title: 'Creative writing', category: 'creative', icon: Book, _difficulty: 'medium', energyLevel: 'medium', duration: 30, moodImpact: 3 },
    { id: 'photo', title: 'Take photos', category: 'creative', icon: Camera, _difficulty: 'easy', energyLevel: 'medium', duration: 20, moodImpact: 2 },
    { id: 'craft', title: 'Arts and crafts', category: 'creative', icon: Palette, _difficulty: 'medium', energyLevel: 'medium', duration: 45, moodImpact: 3 },
    
    // Social
    { id: 'call', title: 'Call a friend', category: 'social', icon: Users, _difficulty: 'easy', energyLevel: 'low', duration: 20, moodImpact: 3 },
    { id: 'text', title: 'Send caring messages', category: 'social', icon: Heart, _difficulty: 'easy', energyLevel: 'low', duration: 10, moodImpact: 2 },
    { id: 'coffee', title: 'Coffee with friend', category: 'social', icon: Coffee, _difficulty: 'medium', energyLevel: 'medium', duration: 60, moodImpact: 4 },
    { id: 'game', title: 'Play online game with friends', category: 'social', icon: Gamepad2, _difficulty: 'medium', energyLevel: 'medium', duration: 45, moodImpact: 3 },
    { id: 'volunteer', title: 'Volunteer activity', category: 'social', icon: Heart, _difficulty: 'hard', energyLevel: 'high', duration: 120, moodImpact: 5 },
    
    // Self-care
    { id: 'bath', title: 'Relaxing bath', category: 'self-care', icon: Home, _difficulty: 'easy', energyLevel: 'low', duration: 30, moodImpact: 3 },
    { id: 'tea', title: 'Make favorite tea/coffee', category: 'self-care', icon: Coffee, _difficulty: 'easy', energyLevel: 'low', duration: 10, moodImpact: 1 },
    { id: 'read', title: 'Read a book', category: 'self-care', icon: Book, _difficulty: 'easy', energyLevel: 'low', duration: 30, moodImpact: 2 },
    { id: 'meditate', title: 'Meditation', category: 'self-care', icon: Brain, _difficulty: 'medium', energyLevel: 'low', duration: 15, moodImpact: 3 },
    { id: 'nature', title: 'Time in nature', category: 'self-care', icon: TreePine, _difficulty: 'easy', energyLevel: 'medium', duration: 30, moodImpact: 4 },
    
    // Productive
    { id: 'organize', title: 'Organize one small area', category: 'productive', icon: Home, _difficulty: 'easy', energyLevel: 'low', duration: 15, moodImpact: 2 },
    { id: 'cook', title: 'Cook favorite meal', category: 'productive', icon: Utensils, _difficulty: 'medium', energyLevel: 'medium', duration: 45, moodImpact: 3 },
    { id: 'shop', title: 'Browse favorite shop', category: 'productive', icon: ShoppingBag, _difficulty: 'medium', energyLevel: 'medium', duration: 30, moodImpact: 2 },
    { id: 'learn', title: 'Learn something new', category: 'productive', icon: Brain, _difficulty: 'medium', energyLevel: 'medium', duration: 30, moodImpact: 3 },
    { id: 'plan', title: 'Plan something exciting', category: 'productive', icon: Calendar, _difficulty: 'easy', energyLevel: 'low', duration: 20, moodImpact: 2 },
  ];

  // Filter activities based on current state
  const filteredActivities = pleasantActivities.filter(activity => {
    const difficultyMatch = selectedDifficulty === 'easy' ? activity._difficulty === 'easy' :
                           selectedDifficulty === 'medium' ? activity._difficulty !== 'hard' :
                           true;
    
    const energyMatch = energyLevel === 'low' ? activity.energyLevel === 'low' :
                        energyLevel === 'medium' ? activity.energyLevel !== 'high' :
                        true;
    
    const categoryMatch = selectedCategory === 'all' || activity.category === selectedCategory;
    
    return difficultyMatch && energyMatch && categoryMatch;
  });

  // Get mastery and pleasure ratings
  const getMasteryLevel = (_difficulty: string) => {
    switch (_difficulty) {
      case 'easy': return 1;
      case 'medium': return 2;
      case 'hard': return 3;
      default: return 1;
    }
  };

  const getPleasureLevel = (moodImpact: number) => {
    if (moodImpact >= 4) return 3;
    if (moodImpact >= 2) return 2;
    return 1;
  };

  // Activity experiment setup
  const createExperiment = () => {
    if (selectedActivities.length === 0) return;
    
    const _experiment = {
      id: `exp-${Date.now()}`,
      _activities: selectedActivities,
      hypothesis: `Testing if these activities improve mood from ${currentMood}/10`,
      startMood: currentMood,
      startEnergy: energyLevel,
      notes: experimentNotes,
      date: new Date()
    };
    
    onStartExperiment?.(_experiment);
    setShowExperiment(false);
    setSelectedActivities([]);
    setExperimentNotes('');
  };

  // Schedule activity
  const scheduleActivity = (activity: unknown) => {
    const _newActivity = {
      ...activity,
      scheduledTime: addDays(new Date(), 0), // Today
      flexibility: 'flexible',
      behavioralActivation: true
    };
    
    addActivity(_newActivity);
    onScheduleActivity?.(_newActivity);
  };

  // Toggle activity selection for experiment
  const toggleActivitySelection = (activity: unknown) => {
    setSelectedActivities(prev => {
      const _exists = prev.find(a => a.id === activity.id);
      if (_exists) {
        return prev.filter(a => a.id !== activity.id);
      }
      return [...prev, activity];
    });
  };

  // Get motivational message based on mood
  const getMotivationalMessage = () => {
    if (currentMood <= 3) {
      return "Starting small is still starting. Every activity counts!";
    } else if (currentMood <= 6) {
      return "You're doing great! Let's build on this momentum.";
    } else {
      return "Fantastic mood! Let's keep it going with engaging _activities.";
    }
  };

  // Get activity recommendations
  const _recommendations = getActivityRecommendations(energyLevel, currentMood);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Behavioral Activation</h3>
              <p className="text-sm text-gray-600">Pleasant activity scheduling</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowExperiment(!showExperiment)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Start experiment"
          >
            <Brain className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Motivational Message */}
        <div className="p-3 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg mb-3">
          <div className="flex items-start space-x-2">
            <Info className="h-4 w-4 text-primary-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700">{getMotivationalMessage()}</p>
              <div className="flex items-center space-x-3 mt-1 text-xs text-gray-600">
                <span>Mood: {currentMood}/10</span>
                <span>Energy: {energyLevel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="flex space-x-2 mb-3">
          <button
            onClick={() => setSelectedDifficulty('easy')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedDifficulty === 'easy'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Easy Start
          </button>
          <button
            onClick={() => setSelectedDifficulty('medium')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedDifficulty === 'medium'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Moderate
          </button>
          <button
            onClick={() => setSelectedDifficulty('hard')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedDifficulty === 'hard'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Challenge
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Activities
          </button>
          {['physical', 'creative', 'social', 'self-care', 'productive'].map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(_category)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Experiment Mode */}
      <AnimatePresence>
        {showExperiment && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <h4 className="font-medium text-blue-900 mb-2">Activity Experiment</h4>
            <p className="text-sm text-blue-700 mb-3">
              Select activities to test their impact on your mood
            </p>
            
            <div className="mb-3">
              <label className="text-sm font-medium text-blue-800">Hypothesis/Notes</label>
              <textarea
                value={experimentNotes}
                onChange={(e) => setExperimentNotes(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-blue-300 rounded-lg text-sm resize-none"
                rows={2}
                placeholder="What do you expect to happen?"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedActivities.length} activities selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setShowExperiment(false);
                    setSelectedActivities([]);
                    setExperimentNotes('');
                  }}
                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  Cancel
                </button>
                <button
                  onClick={createExperiment}
                  disabled={selectedActivities.length === 0}
                  className={`px-3 py-1 text-sm rounded-lg ${
                    selectedActivities.length > 0
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Start Experiment
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activities Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 gap-2">
          <AnimatePresence mode="popLayout">
            {filteredActivities.map((activity, index) => {
              const Icon = activity.icon;
              const mastery = getMasteryLevel(activity._difficulty);
              const pleasure = getPleasureLevel(activity.moodImpact);
              const isSelected = selectedActivities.find(a => a.id === activity.id);
              
              return (
                <motion.div
                  key={activity.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    p-3 rounded-lg border transition-all cursor-pointer
                    ${isSelected ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500' : 'bg-white border-gray-200 hover:border-primary-300'}
                  `}
                  onClick={() => {
                    if (_showExperiment) {
                      toggleActivitySelection(_activity);
                    } else {
                      scheduleActivity(_activity);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        isSelected ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Icon className={`h-4 w-4 ${
                          isSelected ? 'text-blue-600' : 'text-gray-600'
                        }`} />
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{activity.title}</h4>
                        <div className="flex items-center space-x-3 mt-1 text-xs">
                          <span className="text-gray-500">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {activity.duration} min
                          </span>
                          
                          <span className={`px-2 py-0.5 rounded-full ${
                            activity.energyLevel === 'low' ? 'bg-blue-100 text-blue-700' :
                            activity.energyLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {activity.energyLevel} energy
                          </span>
                          
                          <span className="text-gray-500">
                            +{activity.moodImpact} mood
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {/* Mastery & Pleasure Ratings */}
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-gray-500">M:</span>
                          {[1, 2, 3].map(level => (
                            <div
                              key={level}
                              className={`w-2 h-2 rounded-full ${
                                level <= mastery ? 'bg-purple-500' : 'bg-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-gray-500">P:</span>
                          {[1, 2, 3].map(level => (
                            <div
                              key={level}
                              className={`w-2 h-2 rounded-full ${
                                level <= pleasure ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {!showExperiment && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            scheduleActivity(_activity);
                          }}
                          className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Schedule
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-t pt-3 mt-3">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              adaptScheduleForBadDay();
            }}
            className="py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium flex items-center justify-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Adapt for Low Energy</span>
          </button>
          
          <button
            onClick={() => {
              const _randomActivity = filteredActivities[Math.floor(Math.random() * filteredActivities.length)];
              if (_randomActivity) {
                scheduleActivity(_randomActivity);
              }
            }}
            className="py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm font-medium flex items-center justify-center space-x-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>Surprise Me!</span>
          </button>
        </div>
        
        {/* Procrastination Breakthrough */}
        {currentMood <= 4 && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <p className="text-xs text-yellow-800">
                Feeling stuck? Try the 2-minute rule: Do any activity for just 2 minutes!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}