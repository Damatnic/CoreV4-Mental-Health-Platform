import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Heart, Phone, Calendar, MessageSquare, Activity,
  Pill, Book, Users, Sparkles, Music, Shield, AlertCircle,
  Mic, Keyboard, Eye, Settings, _ChevronRight, Search,
  Zap, Clock, MapPin, Volume2, Edit3, Home, HelpCircle,
  Smartphone, Headphones, Wind, Coffee, Moon, Sun
} from 'lucide-react';
import { useQuickActionsContext } from '../../../../hooks/useQuickActionsContext';
import { useAccessibilityStore } from '../../../../stores/accessibilityStore';
import { useUserPreferences } from '../../../../hooks/useUserPreferences';
import { QuickAction } from '../../../../types/dashboard';
import { VoiceCommandInterface } from './VoiceCommandInterface';
import { GestureHandler } from './GestureHandler';
import { KeyboardNavigator } from './KeyboardNavigator';
import { ActionRecommendationEngine } from './ActionRecommendationEngine';

interface SmartQuickActionsWidgetProps {
  userId: string;
  currentMood?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  location?: { lat: number; lng: number };
  recentActivity?: string[];
  crisisMode?: boolean;
  onActionExecute?: (action: QuickAction) => void;
}

export function SmartQuickActionsWidget({
  userId,
  currentMood,
  timeOfDay,
  location,
  recentActivity = [],
  crisisMode = false,
  onActionExecute
}: SmartQuickActionsWidgetProps) {
  const { actions, executeAction, _addCustomAction, getFrequentActions } = useQuickActionsContext();
  const { settings: accessibilitySettings } = useAccessibilityStore();
  const { _preferences, _updatePreference } = useUserPreferences(_userId);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [voiceCommandActive, setVoiceCommandActive] = useState(false);
  const [showCustomizationPanel, setShowCustomizationPanel] = useState(false);
  const [actionHistory, setActionHistory] = useState<string[]>([]);
  const [contextualActions, setContextualActions] = useState<QuickAction[]>([]);

  // Action recommendation engine
  const recommendationEngine = useMemo(() => 
    new ActionRecommendationEngine({
      userId,
      currentMood,
      timeOfDay,
      location,
      recentActivity,
      actionHistory
    }), [userId, currentMood, timeOfDay, location, recentActivity, actionHistory]);

  // Get recommended actions based on context
  useEffect(() => {
    const _recommendations = recommendationEngine.getRecommendations(_actions);
    setContextualActions(_recommendations);
  }, [actions, recommendationEngine]);

  // Enhanced action categories with crisis priority
  const categories = useMemo(() => {
    if (_crisisMode) {
      return [
        { id: 'crisis', label: 'Emergency', icon: AlertCircle, color: 'red' },
        { id: 'grounding', label: 'Grounding', icon: Shield, color: 'purple' },
        { id: 'contact', label: 'Contact', icon: Phone, color: 'blue' }
      ];
    }
    
    return [
      { id: 'all', label: 'All Actions', icon: Zap, color: 'gray' },
      { id: 'wellness', label: 'Wellness', icon: Heart, color: 'pink' },
      { id: 'tracking', label: 'Track', icon: Edit3, color: 'blue' },
      { id: 'therapy', label: 'Therapy', icon: Brain, color: 'purple' },
      { id: 'social', label: 'Connect', icon: Users, color: 'green' },
      { id: 'crisis', label: 'Crisis', icon: AlertCircle, color: 'red' }
    ];
  }, [crisisMode]);

  // Filter actions based on search and category
  const filteredActions = useMemo(() => {
    let filtered = crisisMode 
      ? actions.filter(a => a.category === 'crisis' || a.isEmergency)
      : actions;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }

    if (searchQuery) {
      const _query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.label.toLowerCase().includes(_query) ||
        a.description?.toLowerCase().includes(_query) ||
        a.tags?.some(tag => tag.toLowerCase().includes(_query))
      );
    }

    return filtered;
  }, [actions, selectedCategory, searchQuery, crisisMode]);

  // Handle action execution with tracking
  const handleActionClick = useCallback((action: QuickAction) => {
    setActionHistory(prev => [...prev, action.id].slice(-20)); // Keep last 20 actions
    executeAction(action);
    onActionExecute?.(action);
    
    // Announce action for screen readers
    if (accessibilitySettings.screenReaderMode) {
      const _announcement = new SpeechSynthesisUtterance(`Executing ${action.label}`);
      window.speechSynthesis.speak(_announcement);
    }
  }, [executeAction, onActionExecute, accessibilitySettings.screenReaderMode]);

  // Voice command handler
  const handleVoiceCommand = useCallback((command: string) => {
    const _matchedAction = actions.find(a => 
      a.label.toLowerCase().includes(command.toLowerCase()) ||
      a.voiceAlias?.some(alias => alias.toLowerCase() === command.toLowerCase())
    );
    
    if (_matchedAction) {
      handleActionClick(_matchedAction);
    }
  }, [actions, handleActionClick]);

  // Keyboard navigation handler
  const handleKeyboardNavigation = useCallback((key: string) => {
    // Handle keyboard shortcuts for actions
    const _actionWithShortcut = actions.find(a => a.keyboard === key);
    if (_actionWithShortcut) {
      handleActionClick(_actionWithShortcut);
    }
  }, [actions, handleActionClick]);

  // Get icon component
  const getIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      brain: Brain, heart: Heart, phone: Phone, calendar: Calendar,
      message: MessageSquare, activity: Activity, pill: Pill, book: Book,
      users: Users, sparkles: Sparkles, music: Music, shield: Shield,
      alert: AlertCircle, mic: Mic, keyboard: Keyboard, eye: Eye,
      settings: Settings, search: Search, zap: Zap, clock: Clock,
      map: MapPin, volume: Volume2, edit: Edit3, home: Home, help: HelpCircle,
      smartphone: Smartphone, headphones: Headphones, wind: Wind,
      coffee: Coffee, moon: Moon, sun: Sun
    };
    return iconMap[iconName.toLowerCase()] || Brain;
  };

  return (
    <div className={`
      relative rounded-xl shadow-lg overflow-hidden
      ${crisisMode ? 'bg-red-50 border-2 border-red-500' : 'bg-white'}
      ${accessibilitySettings.highContrast ? 'border-4 border-black' : ''}
    `}>
      {/* Crisis Mode Alert Banner */}
      {crisisMode && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          className="bg-red-600 text-white p-3 flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 animate-pulse" />
            <span className="font-semibold">Crisis Mode Active</span>
          </div>
          <button
            onClick={() => handleActionClick(actions.find(a => a.id === 'emergency-hotline')!)}
            className="bg-white text-red-600 px-3 py-1 rounded-full text-sm font-semibold hover:bg-red-100"
            aria-label="Call emergency hotline"
          >
            Call 988
          </button>
        </motion.div>
      )}

      {/* Header with Search and Voice Controls */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-lg font-semibold ${crisisMode ? 'text-red-900' : 'text-gray-900'}`}>
            Quick Actions
          </h3>
          
          <div className="flex items-center space-x-2">
            {/* Voice Command Toggle */}
            <button
              onClick={() => setVoiceCommandActive(!voiceCommandActive)}
              className={`p-2 rounded-lg transition-colors ${
                voiceCommandActive 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              aria-label="Toggle voice commands"
              title="Voice Commands (Alt+V)"
            >
              <Mic className="h-4 w-4" />
            </button>
            
            {/* Keyboard Navigation Help */}
            <button
              onClick={() => setShowCustomizationPanel(!showCustomizationPanel)}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
              aria-label="Keyboard shortcuts"
              title="Keyboard Shortcuts (Alt+K)"
            >
              <Keyboard className="h-4 w-4" />
            </button>
            
            {/* Settings */}
            <button
              onClick={() => setShowCustomizationPanel(!showCustomizationPanel)}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
              aria-label="Customize actions"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {!crisisMode && (
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search actions..."
              className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Search quick actions"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>

      {/* Category Tabs */}
      {!crisisMode && (
        <div className="px-4 py-2 border-b border-gray-200 overflow-x-auto">
          <div className="flex space-x-2">
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`
                    flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium
                    transition-all whitespace-nowrap
                    ${selectedCategory === category.id
                      ? `bg-${category.color}-100 text-${category.color}-700 ring-2 ring-${category.color}-500`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                  aria-label={`Filter by ${category.label}`}
                  aria-pressed={selectedCategory === category.id}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{category.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Contextual Recommendations */}
      {contextualActions.length > 0 && !crisisMode && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-blue-900">Recommended for you</h4>
            <span className="text-xs text-blue-600">Based on your current context</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {contextualActions.slice(0, 3).map(action => {
              const Icon = getIcon(action.icon);
              return (
                <motion.button
                  key={action.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleActionClick(action)}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-white rounded-lg shadow-sm hover:shadow-md transition-all"
                >
                  <Icon className={`h-4 w-4 ${action.color?.replace('bg-', 'text-')}`} />
                  <span className="text-sm font-medium">{action.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Actions Grid */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory + searchQuery}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`grid gap-3 ${
              crisisMode 
                ? 'grid-cols-1' 
                : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
            }`}
          >
            {filteredActions.map((action, index) => {
              const Icon = getIcon(action.icon);
              const isEmergency = action.isEmergency || action.category === 'crisis';
              
              return (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleActionClick(action)}
                  className={`
                    relative group p-3 rounded-lg transition-all
                    ${isEmergency
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl'
                      : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }
                    ${accessibilitySettings.highContrast ? 'border-2 border-black' : ''}
                    focus:outline-none focus:ring-2 focus:ring-offset-2 
                    ${isEmergency ? 'focus:ring-red-500' : 'focus:ring-blue-500'}
                  `}
                  aria-label={`${action.label}: ${action.description}`}
                  data-keyboard-shortcut={action.keyboard}
                >
                  {/* Emergency pulse animation */}
                  {isEmergency && (
                    <div className="absolute inset-0 rounded-lg">
                      <div className="absolute inset-0 bg-red-400 opacity-20 animate-ping rounded-lg" />
                    </div>
                  )}
                  
                  <div className="relative flex flex-col items-center space-y-2">
                    {/* Icon */}
                    <div className={`
                      p-2 rounded-lg transition-all
                      ${isEmergency 
                        ? 'bg-red-700 bg-opacity-20' 
                        : `${action.color} bg-opacity-10 group-hover:bg-opacity-20`
                      }
                    `}>
                      <Icon className={`
                        h-5 w-5
                        ${isEmergency ? 'text-white' : action.color?.replace('bg-', 'text-')}
                      `} />
                    </div>
                    
                    {/* Label */}
                    <span className={`
                      text-sm font-medium
                      ${isEmergency ? 'text-white' : 'text-gray-900'}
                    `}>
                      {action.label}
                    </span>
                    
                    {/* Description */}
                    {action.description && (
                      <span className={`
                        text-xs text-center line-clamp-2
                        ${isEmergency ? 'text-red-100' : 'text-gray-500'}
                      `}>
                        {action.description}
                      </span>
                    )}
                    
                    {/* Keyboard shortcut badge */}
                    {action.keyboard && (
                      <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs bg-gray-800 text-white px-1.5 py-0.5 rounded">
                          {action.keyboard}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Empty state */}
        {filteredActions.length === 0 && (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No actions found</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Frequent Actions Footer */}
      {!crisisMode && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Your frequent actions
            </span>
            <div className="flex space-x-1">
              {getFrequentActions().slice(0, 5).map(action => {
                const Icon = getIcon(action.icon);
                return (
                  <button
                    key={action.id}
                    onClick={() => handleActionClick(action)}
                    className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                    aria-label={action.label}
                  >
                    <Icon className="h-3.5 w-3.5 text-gray-600" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Voice Command Interface */}
      {voiceCommandActive && (
        <VoiceCommandInterface
          isActive={voiceCommandActive}
          onCommand={handleVoiceCommand}
          onClose={() => setVoiceCommandActive(false)}
        />
      )}

      {/* Keyboard Navigator */}
      <KeyboardNavigator
        actions={filteredActions}
        onActionSelect={handleActionClick}
        onKeyPress={handleKeyboardNavigation}
        isActive={!voiceCommandActive}
      />

      {/* Gesture Handler for mobile */}
      <GestureHandler
        onSwipeLeft={() => {/* Navigate to next category */}}
        onSwipeRight={() => {/* Navigate to previous category */}}
        onDoubleTap={() => {/* Open voice commands */}}
        onLongPress={() => {/* Show action customization */}}
      />
    </div>
  );
}