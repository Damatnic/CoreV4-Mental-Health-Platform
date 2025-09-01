import { useState, useEffect, useCallback, useMemo } from 'react';
import { QuickAction } from '../types/dashboard';
import { useNavigate } from 'react-router-dom';

interface QuickActionsContext {
  actions: QuickAction[];
  executeAction: (action: QuickAction) => void;
  addCustomAction: (action: Omit<QuickAction, 'id'>) => void;
  removeAction: (actionId: string) => void;
  updateAction: (actionId: string, updates: Partial<QuickAction>) => void;
  getFrequentActions: () => QuickAction[];
  getRecentActions: () => QuickAction[];
  searchActions: (query: string) => QuickAction[];
  actionHistory: string[];
  customActions: QuickAction[];
}

export function useQuickActionsContext(): QuickActionsContext {
  const navigate = useNavigate();
  
  // Default quick actions
  const defaultActions: QuickAction[] = [
    {
      id: 'mood-log',
      label: 'Log Mood',
      icon: 'brain',
      description: 'Track how you\'re feeling',
      action: '/wellness/mood',
      color: 'bg-purple-500',
      category: 'tracking',
      keyboard: 'alt+m',
      tags: ['mood', 'tracking', 'wellness']
    },
    {
      id: 'meditation',
      label: 'Meditate',
      icon: 'heart',
      description: '5-minute guided session',
      action: '/wellness/meditation',
      color: 'bg-blue-500',
      category: 'wellness',
      keyboard: 'alt+d',
      voiceAlias: 'meditation',
      tags: ['meditation', 'mindfulness', 'relaxation']
    },
    {
      id: 'journal',
      label: 'Journal',
      icon: 'edit',
      description: 'Write your thoughts',
      action: '/wellness/journal',
      color: 'bg-green-500',
      category: 'tracking',
      keyboard: 'alt+j',
      tags: ['journal', 'writing', 'reflection']
    },
    {
      id: 'emergency-hotline',
      label: 'Crisis Help',
      icon: 'phone',
      description: 'Get immediate support',
      action: 'tel:988',
      color: 'bg-red-500',
      category: 'crisis',
      isEmergency: true,
      keyboard: 'alt+h',
      tags: ['crisis', 'emergency', 'help', '988']
    },
    {
      id: 'breathing',
      label: 'Breathe',
      icon: 'activity',
      description: 'Breathing exercise',
      action: '/wellness/breathe',
      color: 'bg-cyan-500',
      category: 'wellness',
      keyboard: 'alt+b',
      tags: ['breathing', 'calm', 'anxiety', 'relax']
    },
    {
      id: 'grounding',
      label: 'Grounding',
      icon: 'shield',
      description: '5-4-3-2-1 technique',
      action: '/wellness/grounding',
      color: 'bg-purple-500',
      category: 'wellness',
      tags: ['grounding', 'anxiety', 'panic', 'calm']
    },
    {
      id: 'community',
      label: 'Connect',
      icon: 'users',
      description: 'Join support group',
      action: '/community',
      color: 'bg-indigo-500',
      category: 'social',
      tags: ['community', 'support', 'social', 'connect']
    },
    {
      id: 'therapy-session',
      label: 'Therapy',
      icon: 'calendar',
      description: 'Schedule or join session',
      action: '/therapy',
      color: 'bg-green-500',
      category: 'professional',
      keyboard: 'alt+t',
      tags: ['therapy', 'professional', 'counseling']
    },
    {
      id: 'medication',
      label: 'Medication',
      icon: 'pill',
      description: 'Track medication',
      action: '/wellness/medication',
      color: 'bg-orange-500',
      category: 'tracking',
      keyboard: 'alt+p',
      tags: ['medication', 'pills', 'medicine', 'tracking']
    },
    {
      id: 'safety-plan',
      label: 'Safety Plan',
      icon: 'shield',
      description: 'Access your safety plan',
      action: '/crisis/safety-plan',
      color: 'bg-red-500',
      category: 'crisis',
      tags: ['safety', 'crisis', 'plan', 'emergency']
    },
    {
      id: 'sleep-log',
      label: 'Sleep',
      icon: 'moon',
      description: 'Log sleep quality',
      action: '/wellness/sleep',
      color: 'bg-indigo-500',
      category: 'tracking',
      tags: ['sleep', 'rest', 'tracking']
    },
    {
      id: 'exercise',
      label: 'Exercise',
      icon: 'activity',
      description: 'Log physical activity',
      action: '/wellness/exercise',
      color: 'bg-green-500',
      category: 'tracking',
      tags: ['exercise', 'fitness', 'activity', 'movement']
    },
    {
      id: 'gratitude',
      label: 'Gratitude',
      icon: 'heart',
      description: 'Practice gratitude',
      action: '/wellness/gratitude',
      color: 'bg-pink-500',
      category: 'wellness',
      tags: ['gratitude', 'thankful', 'positive']
    },
    {
      id: 'music-therapy',
      label: 'Music',
      icon: 'music',
      description: 'Therapeutic music',
      action: '/wellness/music',
      color: 'bg-purple-500',
      category: 'wellness',
      tags: ['music', 'audio', 'relaxation', 'therapy']
    },
    {
      id: 'crisis-text',
      label: 'Crisis Text',
      icon: 'message',
      description: 'Text HOME to 741741',
      action: 'sms:741741?body=HOME',
      color: 'bg-red-500',
      category: 'crisis',
      isEmergency: true,
      tags: ['crisis', 'text', 'chat', 'help']
    }
  ];

  const [actions, setActions] = useState<QuickAction[]>(defaultActions);
  const [customActions, setCustomActions] = useState<QuickAction[]>([]);
  const [actionHistory, setActionHistory] = useState<string[]>([]);

  // Load custom actions and history from localStorage
  useEffect(() => {
    const savedCustomActions = localStorage.getItem('customQuickActions');
    const savedHistory = localStorage.getItem('actionHistory');
    
    if (savedCustomActions) {
      try {
        const parsed = JSON.parse(savedCustomActions);
        setCustomActions(parsed);
        setActions([...defaultActions, ...parsed]);
      } catch (error) {
        console.error('Error loading custom actions:', error);
      }
    }
    
    if (savedHistory) {
      try {
        setActionHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading action history:', error);
      }
    }
  }, []);

  // Save custom actions to localStorage
  useEffect(() => {
    if (customActions.length > 0) {
      localStorage.setItem('customQuickActions', JSON.stringify(customActions));
    }
  }, [customActions]);

  // Save action history to localStorage
  useEffect(() => {
    if (actionHistory.length > 0) {
      localStorage.setItem('actionHistory', JSON.stringify(actionHistory.slice(-100))); // Keep last 100
    }
  }, [actionHistory]);

  // Execute an action
  const executeAction = useCallback((action: QuickAction) => {
    // Add to history
    setActionHistory(prev => [...prev, action.id]);
    
    // Handle different action types
    if (action.action.startsWith('http')) {
      // External URL
      window.open(action.action, '_blank');
    } else if (action.action.startsWith('tel:')) {
      // Phone call
      window.location.href = action.action;
    } else if (action.action.startsWith('sms:')) {
      // SMS
      window.location.href = action.action;
    } else if (action.action.startsWith('mailto:')) {
      // Email
      window.location.href = action.action;
    } else if (action.action.startsWith('/')) {
      // Internal route
      navigate(action.action);
    } else if (action.action.startsWith('function:')) {
      // Custom function (would need to be implemented based on your app's needs)
      const functionName = action.action.replace('function:', '');
      console.log(`Executing function: ${functionName}`);
    }
    
    // Log analytics
    console.log('Action executed:', {
      id: action.id,
      label: action.label,
      category: action.category,
      timestamp: new Date().toISOString()
    });
  }, [navigate]);

  // Add custom action
  const addCustomAction = useCallback((action: Omit<QuickAction, 'id'>) => {
    const newAction: QuickAction = {
      ...action,
      id: `custom-${Date.now()}`
    };
    
    setCustomActions(prev => [...prev, newAction]);
    setActions(prev => [...prev, newAction]);
  }, []);

  // Remove action
  const removeAction = useCallback((actionId: string) => {
    if (actionId.startsWith('custom-')) {
      setCustomActions(prev => prev.filter(a => a.id !== actionId));
      setActions(prev => prev.filter(a => a.id !== actionId));
    }
  }, []);

  // Update action
  const updateAction = useCallback((actionId: string, updates: Partial<QuickAction>) => {
    const updateFn = (action: QuickAction) => 
      action.id === actionId ? { ...action, ...updates } : action;
    
    setActions(prev => prev.map(updateFn));
    
    if (actionId.startsWith('custom-')) {
      setCustomActions(prev => prev.map(updateFn));
    }
  }, []);

  // Get frequent actions based on history
  const getFrequentActions = useCallback((): QuickAction[] => {
    const frequency = actionHistory.reduce((acc, id) => {
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const sortedIds = Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .map(([id]) => id);
    
    return sortedIds
      .map(id => actions.find(a => a.id === id))
      .filter(Boolean) as QuickAction[];
  }, [actionHistory, actions]);

  // Get recent actions
  const getRecentActions = useCallback((): QuickAction[] => {
    const recentIds = [...new Set(actionHistory.slice(-10).reverse())];
    
    return recentIds
      .map(id => actions.find(a => a.id === id))
      .filter(Boolean) as QuickAction[];
  }, [actionHistory, actions]);

  // Search actions
  const searchActions = useCallback((query: string): QuickAction[] => {
    const lowerQuery = query.toLowerCase();
    
    return actions.filter(action => 
      action.label.toLowerCase().includes(lowerQuery) ||
      action.description?.toLowerCase().includes(lowerQuery) ||
      action.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      action.category.toLowerCase().includes(lowerQuery)
    );
  }, [actions]);

  return {
    actions,
    executeAction,
    addCustomAction,
    removeAction,
    updateAction,
    getFrequentActions,
    getRecentActions,
    searchActions,
    actionHistory,
    customActions
  };
}