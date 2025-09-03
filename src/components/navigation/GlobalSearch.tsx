import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, Star, TrendingUp, Command, ArrowRight, Heart, Users, Brain, Calendar, FileText, HelpCircle, AlertTriangle } from 'lucide-react';
import { useNavigation } from './NavigationContext';
import { _useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  path: string;
  category: 'page' | 'resource' | 'therapist' | 'community' | 'crisis' | 'action';
  icon?: React.ReactNode;
  priority?: number;
  keywords: string[];
}

// Comprehensive search database with mental health resources
const searchDatabase: SearchResult[] = [
  // Crisis Resources (highest priority)
  { id: 'crisis-help', title: 'Crisis Help', path: '/crisis', category: 'crisis', priority: 100, icon: <AlertTriangle className="h-4 w-4" />, keywords: ['emergency', 'help', 'suicide', 'crisis', '988', 'urgent'] },
  { id: 'crisis-hotline', title: 'Crisis Hotline (988)', path: 'tel:988', category: 'crisis', priority: 100, icon: <AlertTriangle className="h-4 w-4" />, keywords: ['call', 'phone', 'hotline', '988', 'talk'] },
  { id: 'crisis-text', title: 'Crisis Text Line', path: 'sms:741741', category: 'crisis', priority: 100, icon: <AlertTriangle className="h-4 w-4" />, keywords: ['text', 'message', 'chat', '741741'] },
  
  // Main Pages
  { id: 'dashboard', title: 'Dashboard', path: '/dashboard', category: 'page', icon: <TrendingUp className="h-4 w-4" />, keywords: ['home', 'overview', 'progress', 'tracking'] },
  { id: 'wellness', title: 'Wellness Hub', path: '/wellness', category: 'page', icon: <Heart className="h-4 w-4" />, keywords: ['wellness', 'health', 'self-care', 'activities'] },
  { id: 'community', title: 'Community', path: '/community', category: 'page', icon: <Users className="h-4 w-4" />, keywords: ['community', 'support', 'groups', 'forums', 'chat'] },
  { id: 'professional', title: 'Professional Care', path: '/professional', category: 'page', icon: <Brain className="h-4 w-4" />, keywords: ['therapist', 'doctor', 'professional', 'appointment', 'therapy'] },
  
  // Wellness Resources
  { id: 'mood-tracker', title: 'Mood Tracker', path: '/wellness/mood', category: 'resource', icon: <Heart className="h-4 w-4" />, keywords: ['mood', 'emotions', 'feelings', 'tracking', 'log'] },
  { id: 'journal', title: 'Journal', path: '/wellness/journal', category: 'resource', icon: <FileText className="h-4 w-4" />, keywords: ['journal', 'diary', 'write', 'thoughts', 'reflection'] },
  { id: 'meditation', title: 'Meditation', path: '/wellness/meditation', category: 'resource', icon: <Brain className="h-4 w-4" />, keywords: ['meditation', 'mindfulness', 'breathe', 'calm', 'relax'] },
  { id: 'breathing', title: 'Breathing Exercises', path: '/wellness/breathing', category: 'resource', icon: <Heart className="h-4 w-4" />, keywords: ['breathing', 'breathe', 'exercise', 'calm', 'anxiety'] },
  { id: 'sleep', title: 'Sleep Tracker', path: '/wellness/sleep', category: 'resource', icon: <Brain className="h-4 w-4" />, keywords: ['sleep', 'rest', 'insomnia', 'bedtime', 'tracking'] },
  
  // Community Features
  { id: 'support-groups', title: 'Support Groups', path: '/community/groups', category: 'community', icon: <Users className="h-4 w-4" />, keywords: ['groups', 'support', 'community', 'connect', 'share'] },
  { id: 'success-stories', title: 'Success Stories', path: '/community/stories', category: 'community', icon: <Star className="h-4 w-4" />, keywords: ['stories', 'success', 'inspiration', 'recovery', 'hope'] },
  { id: 'events', title: 'Events', path: '/community/events', category: 'community', icon: <Calendar className="h-4 w-4" />, keywords: ['events', 'calendar', 'workshops', 'meetings', 'schedule'] },
  
  // Professional Care
  { id: 'find-therapist', title: 'Find a Therapist', path: '/professional/find', category: 'therapist', icon: <Brain className="h-4 w-4" />, keywords: ['therapist', 'counselor', 'psychologist', 'find', 'search'] },
  { id: 'appointments', title: 'Appointments', path: '/professional/appointments', category: 'therapist', icon: <Calendar className="h-4 w-4" />, keywords: ['appointment', 'booking', 'schedule', 'calendar', 'session'] },
  { id: 'teletherapy', title: 'Teletherapy', path: '/professional/teletherapy', category: 'therapist', icon: <Brain className="h-4 w-4" />, keywords: ['online', 'video', 'teletherapy', 'remote', 'virtual'] },
  
  // Quick Actions
  { id: 'quick-mood', title: 'Quick Mood Check', path: '/wellness/mood/quick', category: 'action', icon: <Heart className="h-4 w-4" />, keywords: ['quick', 'mood', 'check', 'fast', 'now'] },
  { id: 'sos-toolkit', title: 'SOS Toolkit', path: '/crisis/toolkit', category: 'crisis', priority: 90, icon: <AlertTriangle className="h-4 w-4" />, keywords: ['sos', 'toolkit', 'emergency', 'coping', 'strategies'] },
  { id: 'help-center', title: 'Help Center', path: '/help', category: 'resource', icon: <HelpCircle className="h-4 w-4" />, keywords: ['help', 'support', 'faq', 'questions', 'guide'] },
];

export function GlobalSearch() {
  const _navigate  = useNavigate();
  const { isSearchOpen, setSearchOpen, _preferences, addToRecent } = useNavigation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const _saved = localStorage.getItem('recentSearches');
    if (_saved) {
      setRecentSearches(JSON.parse(_saved));
    }
  }, []);

  // Save recent searches
  const saveRecentSearch = (searchTerm: string) => {
    if (searchTerm.trim()) {
      const _updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
      setRecentSearches(_updated);
      localStorage.setItem('recentSearches', JSON.stringify(_updated));
    }
  };

  // Search algorithm with fuzzy matching and ranking
  const performSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const terms = lowerQuery.split(' ').filter(_Boolean);

    const _searchResults = searchDatabase
      .map(item => {
        let score = 0;
        
        // Exact title match
        if (item.title.toLowerCase() === lowerQuery) {
          score += 100;
        }
        
        // Title contains query
        if (item.title.toLowerCase().includes(_lowerQuery)) {
          score += 50;
        }
        
        // Check each term
        terms.forEach(_term => {
          if (item.title.toLowerCase().includes(_term)) {
            score += 20;
          }
          if (item.description?.toLowerCase().includes(_term)) {
            score += 10;
          }
          if (item.keywords.some(k => k.includes(_term))) {
            score += 15;
          }
        });
        
        // Priority boost
        score += (item.priority || 0);
        
        // Category boost for crisis items when certain keywords are present
        if (item.category === 'crisis' && ['help', 'emergency', 'crisis', 'suicide'].some(_word => lowerQuery.includes(_word))) {
          score += 200;
        }
        
        return { ...item, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    setResults(_searchResults);
    setSelectedIndex(0);
  }, []);

  // Handle search input change
  useEffect(() => {
    const _debounceTimer = setTimeout(() => {
      performSearch(_query);
    }, 150);

    return () => clearTimeout(_debounceTimer);
  }, [query, performSearch]);

  // Keyboard navigation
  useEffect(() => {
    if (!isSearchOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % Math.max(1, results.length));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + Math.max(1, results.length)) % Math.max(1, results.length));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleResultClick(results[selectedIndex]);
          }
          break;
        case 'Escape':
          setSearchOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, _results, selectedIndex, setSearchOpen]);

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(_query);
    addToRecent(result.path);
    
    if (result.path.startsWith('tel:') || result.path.startsWith('sms:')) {
      window.location.href = result.path;
    } else {
      navigate(result.path);
    }
    
    setSearchOpen(false);
    setQuery('');
  };

  // Quick search suggestions based on context
  const getQuickSuggestions = () => {
    const suggestions = [];
    const hour = new Date().getHours();
    
    if (hour >= 22 || hour < 6) {
      suggestions.push({ text: 'Sleep resources', query: 'sleep' });
      suggestions.push({ text: 'Calming exercises', query: 'calm' });
    } else if (hour >= 6 && hour < 12) {
      suggestions.push({ text: 'Morning meditation', query: 'meditation' });
      suggestions.push({ text: 'Mood check-in', query: 'mood' });
    } else {
      suggestions.push({ text: 'Stress relief', query: 'stress' });
      suggestions.push({ text: 'Find support', query: 'support' });
    }
    
    return suggestions;
  };

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
          onClick={() => setSearchOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          
          {/* Search Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="flex items-center px-6 py-4 border-b border-gray-200">
              <Search className="h-5 w-5 text-gray-400 mr-3" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for resources, support, or type 'help' for crisis assistance..."
                className="flex-1 text-lg outline-none placeholder-gray-400"
                autoComplete="off"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="ml-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            {/* Search Results or Suggestions */}
            <div className="max-h-96 overflow-y-auto">
              {query ? (
                results.length > 0 ? (
                  <div className="py-2">
                    {results.map((result, index) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(_result)}
                        onMouseEnter={() => setSelectedIndex(_index)}
                        className={`w-full px-6 py-3 flex items-center hover:bg-gray-50 transition-colors ${
                          index === selectedIndex ? 'bg-gray-50' : ''
                        }`}
                      >
                        <div className={`mr-3 ${
                          result.category === 'crisis' ? 'text-red-500' : 'text-gray-400'
                        }`}>
                          {result.icon || <Search className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-gray-900">{result.title}</div>
                          {result.description && (
                            <div className="text-sm text-gray-500">{result.description}</div>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    No results found for "{query}"
                  </div>
                )
              ) : (
                <div className="p-6">
                  {/* Quick Suggestions */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Suggestions for you</h3>
                    <div className="flex flex-wrap gap-2">
                      {getQuickSuggestions().map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => setQuery(suggestion.query)}
                          className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm hover:bg-primary-100 transition-colors"
                        >
                          {suggestion.text}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Recent searches</h3>
                      <div className="space-y-1">
                        {recentSearches.map((search, index) => (
                          <button
                            key={index}
                            onClick={() => setQuery(search)}
                            className="w-full px-3 py-2 flex items-center text-left hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <Clock className="h-4 w-4 text-gray-400 mr-3" />
                            <span className="text-gray-700">{search}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Keyboard Shortcuts Hint */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs mr-1">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs mr-1">↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs mr-1">Enter</kbd>
                  Select
                </span>
                <span className="flex items-center">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs mr-1">Esc</kbd>
                  Close
                </span>
              </div>
              <span className="flex items-center">
                <Command className="h-3 w-3 mr-1" />K to open
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}