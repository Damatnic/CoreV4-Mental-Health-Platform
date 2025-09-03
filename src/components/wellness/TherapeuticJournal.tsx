import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  _BookOpen, 
  Edit3, 
  Heart, 
  Brain, 
  _Shield, 
  Download,
  _Upload,
  _Calendar,
  _Tag,
  Lock,
  Unlock,
  Search,
  _Filter,
  ChevronRight,
  Sparkles,
  Sun,
  Cloud,
  CloudRain,
  Zap,
  Moon,
  Star,
  TrendingUp,
  _AlertCircle,
  Save,
  _Trash2,
  _Share2,
  _FileText
} from 'lucide-react';
import { format as formatDate, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from 'date-fns';
import { secureStorage } from '../../services/security/SecureLocalStorage';

// Journal entry types based on therapeutic approaches
const JOURNAL_TYPES = {
  freeform: {
    name: 'Free Writing',
    icon: Edit3,
    description: 'Express yourself freely without structure',
    color: 'from-purple-400 to-pink-400'
  },
  gratitude: {
    name: 'Gratitude Journal',
    icon: Heart,
    description: 'Focus on things you\'re grateful for',
    color: 'from-green-400 to-emerald-400',
    prompts: [
      'What are three things you\'re grateful for today?',
      'Who made a positive impact on your day?',
      'What small moment brought you joy?',
      'What ability or skill are you thankful for?'
    ]
  },
  thought: {
    name: 'Thought Record',
    icon: Brain,
    description: 'CBT-based thought challenging',
    color: 'from-blue-400 to-indigo-400',
    structure: {
      situation: 'What happened?',
      thoughts: 'What thoughts went through your mind?',
      emotions: 'What emotions did you feel? (Rate 0-100)',
      evidence_for: 'Evidence supporting the thought',
      evidence_against: 'Evidence against the thought',
      balanced_thought: 'More balanced perspective',
      outcome: 'How do you feel _now? (Rate 0-100)'
    }
  },
  emotion: {
    name: 'Emotion Regulation',
    icon: Zap,
    description: 'DBT-based emotion tracking',
    color: 'from-orange-400 to-red-400',
    structure: {
      emotion: 'Primary emotion',
      intensity: 'Intensity (0-10)',
      triggers: 'What triggered this emotion?',
      physical: 'Physical sensations',
      urges: 'Action urges',
      actions: 'What did you actually do?',
      effectiveness: 'How effective was your response?'
    }
  },
  reflection: {
    name: 'Daily Reflection',
    icon: Sun,
    description: 'Structured end-of-day reflection',
    color: 'from-yellow-400 to-orange-400',
    prompts: [
      'What went well today?',
      'What was challenging?',
      'What did you learn about yourself?',
      'What would you do differently?',
      'What are you looking forward to tomorrow?'
    ]
  }
};

// Mood options for tagging
const MOOD_OPTIONS = [
  { value: 'happy', icon: Sun, color: 'text-yellow-500' },
  { value: 'calm', icon: Cloud, color: 'text-blue-400' },
  { value: 'anxious', icon: CloudRain, color: 'text-gray-500' },
  { value: 'angry', icon: Zap, color: 'text-red-500' },
  { value: 'sad', icon: Moon, color: 'text-indigo-500' },
  { value: 'excited', icon: Star, color: 'text-purple-500' }
];

interface JournalEntry {
  id: string;
  type: keyof typeof JOURNAL_TYPES;
  title: string;
  content: string | Record<string, string>;
  mood?: string;
  tags: string[];
  timestamp: Date;
  edited?: Date;
  encrypted: boolean;
  wordCount: number;
  readingTime: number;
  insights?: string[];
}

interface JournalPrompt {
  id: string;
  category: string;
  prompt: string;
  therapeutic_approach: string;
}

// Therapeutic prompts database
const THERAPEUTIC_PROMPTS: JournalPrompt[] = [
  // CBT Prompts
  { id: '1', category: 'CBT', prompt: 'Identify three negative thoughts you had today. How can you reframe them more realistically?', therapeutic_approach: 'Cognitive Restructuring' },
  { id: '2', category: 'CBT', prompt: 'What evidence do you have for and against your biggest worry right _now?', therapeutic_approach: 'Evidence Examination' },
  { id: '3', category: 'CBT', prompt: 'Describe a situation where your thoughts influenced your emotions and behaviors.', therapeutic_approach: 'Thought-Emotion-Behavior Connection' },
  
  // DBT Prompts
  { id: '4', category: 'DBT', prompt: 'Practice radical acceptance: What situation do you need to accept right _now?', therapeutic_approach: 'Radical Acceptance' },
  { id: '5', category: 'DBT', prompt: 'Describe a time today when you used wise mind (balancing emotion and logic).', therapeutic_approach: 'Wise Mind' },
  { id: '6', category: 'DBT', prompt: 'What opposite action could you take to change an unhelpful emotion?', therapeutic_approach: 'Opposite Action' },
  
  // Mindfulness Prompts
  { id: '7', category: 'Mindfulness', prompt: 'Describe your current moment using all five senses.', therapeutic_approach: 'Present Moment Awareness' },
  { id: '8', category: 'Mindfulness', prompt: 'What thoughts are passing through your mind like clouds in the sky?', therapeutic_approach: 'Thought Observation' },
  { id: '9', category: 'Mindfulness', prompt: 'Body scan: What sensations do you notice from head to toe?', therapeutic_approach: 'Body Awareness' },
  
  // Self-Compassion Prompts
  { id: '10', category: 'Self-Compassion', prompt: 'Write a letter to yourself as you would to a good friend facing your situation.', therapeutic_approach: 'Self-Kindness' },
  { id: '11', category: 'Self-Compassion', prompt: 'What would you say to comfort your younger self?', therapeutic_approach: 'Inner Child Work' },
  { id: '12', category: 'Self-Compassion', prompt: 'List three ways you can be kinder to yourself today.', therapeutic_approach: 'Self-Care Planning' }
];

export const TherapeuticJournal: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<Partial<JournalEntry>>({
    type: 'freeform',
    title: '',
    content: '',
    tags: [],
    mood: undefined
  });
  const [selectedType, setSelectedType] = useState<keyof typeof JOURNAL_TYPES>('freeform');
  const [isWriting, setIsWriting] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, _setSearchQuery] = useState('');
  const [filterMood, _setFilterMood] = useState<string | null>(null);
  const [filterType, _setFilterType] = useState<keyof typeof JOURNAL_TYPES | null>(null);
  const [showPrompts, _setShowPrompts] = useState(false);
  const [selectedPromptCategory, _setSelectedPromptCategory] = useState<string | null>(null);
  const [isEncrypted, _setIsEncrypted] = useState(false);
  const [_password, _setPassword] = useState('');
  const [showStats, _setShowStats] = useState(false);
  const [autoSaveEnabled, _setAutoSaveEnabled] = useState(true);
  
  const _editorRef  = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Load entries from localStorage
  useEffect(() => {
    const _savedEntries = secureStorage.getItem('journalEntries');
    if (_savedEntries) {
      const parsed = JSON.parse(_savedEntries);
      setEntries(parsed.map((e: unknown) => ({
        ...e,
        timestamp: new Date(e.timestamp),
        edited: e.edited ? new Date(e.edited) : undefined
      })));
    }
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !isWriting) return;
    
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    
    autoSaveTimer.current = setTimeout(() => {
      if (currentEntry.content && (typeof currentEntry.content === 'string' ? currentEntry.content.length > 0 : Object.keys(currentEntry.content).length > 0)) {
        saveDraft();
      }
    }, 3000); // Auto-save after 3 seconds of inactivity
    
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [currentEntry, autoSaveEnabled, isWriting, saveDraft]);

  // Save draft
  const saveDraft = useCallback(() => {
    const _draft = {
      ...currentEntry,
      timestamp: new Date(),
      lastSaved: new Date()
    };
    secureStorage.setItem('journalDraft', JSON.stringify(_draft));
  }, [currentEntry]);

  // Calculate word count and reading time
  const calculateStats = (content: string | Record<string, string>) => {
    let text = '';
    if (typeof content === 'string') {
      text = content;
    } else {
      text = Object.values(_content).join(' ');
    }
    
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed
    
    return { wordCount, readingTime };
  };

  // Save entry
  const saveEntry = () => {
    if (!currentEntry.content || (typeof currentEntry.content === 'string' && !currentEntry.content.trim())) {
      return;
    }
    
    const __stats = calculateStats(currentEntry.content);
    const newEntry: JournalEntry = {
      id: Date._now().toString(),
      type: currentEntry.type || 'freeform',
      title: currentEntry.title || `${JOURNAL_TYPES[currentEntry.type || 'freeform'].name} - ${formatDate(new Date(), 'MMM d, yyyy')}`,
      content: currentEntry.content,
      mood: currentEntry.mood,
      tags: currentEntry.tags || [],
      timestamp: new Date(),
      encrypted: isEncrypted,
      ...stats
    };
    
    // Analyze for insights (simplified version)
    if (typeof newEntry.content === 'string') {
      const insights = analyzeContent(newEntry.content);
      if (insights.length > 0) {
        newEntry.insights = insights;
      }
    }
    
    const _updatedEntries = [...entries, newEntry];
    setEntries(_updatedEntries);
    secureStorage.setItem('journalEntries', JSON.stringify(_updatedEntries));
    
    // Clear draft
    secureStorage.removeItem('journalDraft');
    
    // Reset form
    setCurrentEntry({
      type: 'freeform',
      title: '',
      content: '',
      tags: [],
      mood: undefined
    });
    setIsWriting(false);
  };

  // Simple content analysis for insights
  const analyzeContent = (content: string): string[] => {
    const insights: string[] = [];
    const lowerContent = content.toLowerCase();
    
    // Check for positive patterns
    if (lowerContent.includes('grateful') || lowerContent.includes('thankful')) {
      insights.push('Practicing gratitude');
    }
    
    // Check for growth indicators
    if (lowerContent.includes('learned') || lowerContent.includes('realized') || lowerContent.includes('understood')) {
      insights.push('Self-awareness growth');
    }
    
    // Check for coping strategies
    if (lowerContent.includes('breathe') || lowerContent.includes('meditation') || lowerContent.includes('exercise')) {
      insights.push('Using healthy coping strategies');
    }
    
    // Check for emotional vocabulary
    const emotions = ['happy', 'sad', 'angry', 'anxious', 'calm', 'excited', 'frustrated', 'peaceful'];
    const usedEmotions = emotions.filter(e => lowerContent.includes(e));
    if (usedEmotions.length > 2) {
      insights.push('Rich emotional vocabulary');
    }
    
    return insights;
  };

  // Export entries
  const exportEntries = (format: 'json' | 'txt' | 'pdf') => {
    if (format === 'json') {
      const _dataStr = JSON.stringify(entries, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${ encodeURIComponent(_dataStr)}`;
      const exportFileDefaultName = `journal-export-${formatDate(new Date(), 'yyyy-MM-dd')}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } else if (format === 'txt') {
      let textContent = 'Therapeutic Journal Export\n';
      textContent += `${'=' .repeat(50)  }\n\n`;
      
      entries.forEach(entry => {
        textContent += `Date: ${formatDate(entry.timestamp, 'PPP')}\n`;
        textContent += `Type: ${JOURNAL_TYPES[entry.type].name}\n`;
        textContent += `Title: ${entry.title}\n`;
        if (entry.mood) textContent += `Mood: ${entry.mood}\n`;
        if (entry.tags.length > 0) textContent += `Tags: ${entry.tags.join(', ')}\n`;
        textContent += '\n';
        
        if (typeof entry.content === 'string') {
          textContent += entry.content;
        } else {
          Object.entries(entry.content).forEach(([key, value]) => {
            textContent += `${key}:\n${value}\n\n`;
          });
        }
        
        textContent += `\n${  '-'.repeat(50)  }\n\n`;
      });
      
      const _blob = new Blob([textContent], { type: 'text/plain' });
      const url = URL.createObjectURL(_blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `journal-export-${formatDate(new Date(), 'yyyy-MM-dd')}.txt`;
      link.click();
    }
  };

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    let matches = true;
    
    if (searchQuery) {
      const _query = searchQuery.toLowerCase();
      const content = typeof entry.content === 'string' 
        ? entry.content.toLowerCase()
        : Object.values(entry.content).join(' ').toLowerCase();
      
      matches = matches && (
        entry.title.toLowerCase().includes(_query) ||
        content.includes(_query) ||
        entry.tags.some(tag => tag.toLowerCase().includes(_query))
      );
    }
    
    if (_filterMood) {
      matches = matches && entry.mood === filterMood;
    }
    
    if (_filterType) {
      matches = matches && entry.type === filterType;
    }
    
    return matches;
  });

  // Get weekly stats
  const getWeeklyStats = () => {
    const _now = new Date();
    const weekStart = startOfWeek(_now);
    const weekEnd = endOfWeek(_now);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    return days.map(day => {
      const dayEntries = entries.filter(entry => 
        formatDate(entry.timestamp, 'yyyy-MM-dd') === formatDate(day, 'yyyy-MM-dd')
      );
      
      return {
        date: day,
        count: dayEntries.length,
        words: dayEntries.reduce((sum, e) => sum + e.wordCount, 0),
        isToday: isToday(_day)
      };
    });
  };

  return (
    <div className="therapeutic-journal-container max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Therapeutic Journal
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Evidence-based journaling for mental wellness and self-discovery
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
              onClick={() => exportEntries('txt')}
              className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
            >
              <Download className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Weekly Stats */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl"
            >
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">This Week&apos;s Activity</h3>
              <div className="grid grid-cols-7 gap-2">
                {getWeeklyStats().map((day, idx) => (
                  <div
                    key={idx}
                    className={`text-center p-2 rounded-lg ${
                      day.isToday
                        ? 'bg-blue-100 dark:bg-blue-900'
                        : 'bg-white dark:bg-gray-800'
                    }`}
                  >
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(day.date, 'EEE')}
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {day.count}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {day.words} words
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Journal Writing Area */}
        <div className="lg:col-span-2">
          {!isWriting ? (
            <div>
              {/* Journal Type Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Choose Journal Type
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(_JOURNAL_TYPES).map(([key, type]) => {
                    const Icon = type.icon;
                    return (
                      <motion.button
                        key={key}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedType(key as keyof typeof JOURNAL_TYPES);
                          setCurrentEntry(prev => ({ ...prev, type: key as keyof typeof JOURNAL_TYPES }));
                          setIsWriting(true);
                        }}
                        className="p-4 bg-white dark:bg-gray-800 rounded-xl hover:shadow-lg transition-all group"
                      >
                        <div className={`w-12 h-12 mx-auto mb-2 rounded-lg bg-gradient-to-r ${type.color} flex items-center justify-center text-white`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                          {type.name}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {type.description}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Therapeutic Prompts */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Therapeutic Prompts
                  </h3>
                  <button
                    onClick={() => setShowPrompts(!showPrompts)}
                    className="text-sm text-blue-500 hover:text-blue-600"
                  >
                    {showPrompts ? 'Hide' : 'Show All'}
                  </button>
                </div>
                
                <AnimatePresence>
                  {showPrompts && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <div className="flex gap-2 mb-3">
                        {['All', 'CBT', 'DBT', 'Mindfulness', 'Self-Compassion'].map(cat => (
                          <button
                            key={cat}
                            onClick={() => setSelectedPromptCategory(cat === 'All' ? null : cat)}
                            className={`px-3 py-1 rounded-full text-sm ${
                              (cat === 'All' && !selectedPromptCategory) || selectedPromptCategory === cat
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                      
                      {THERAPEUTIC_PROMPTS
                        .filter(p => !selectedPromptCategory || p.category === selectedPromptCategory)
                        .map(prompt => (
                          <motion.div
                            key={prompt.id}
                            whileHover={{ x: 5 }}
                            onClick={() => {
                              setCurrentEntry(prev => ({
                                ...prev,
                                content: prompt.prompt,
                                title: `${prompt.category}: ${prompt.therapeutic_approach}`
                              }));
                              setIsWriting(true);
                            }}
                            className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-start gap-2">
                              <Sparkles className="w-4 h-4 text-yellow-500 mt-1 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm text-gray-900 dark:text-white mb-1">
                                  {prompt.prompt}
                                </p>
                                <div className="flex gap-2">
                                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                                    {prompt.category}
                                  </span>
                                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                                    {prompt.therapeutic_approach}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Recent Entries List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Recent Entries
                </h3>
                <div className="space-y-3">
                  {filteredEntries.slice(-5).reverse().map(entry => (
                    <motion.div
                      key={entry.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setSelectedEntry(entry)}
                      className="p-4 bg-white dark:bg-gray-800 rounded-xl cursor-pointer hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {React.createElement(JOURNAL_TYPES[entry.type].icon, {
                              className: "w-4 h-4 text-gray-500"
                            })}
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {entry.title}
                            </h4>
                            {entry.encrypted && (
                              <Lock className="w-3 h-3 text-gray-400" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                            {typeof entry.content === 'string'
                              ? `${entry.content.substring(0, 100)  }...`
                              : 'Structured entry'
                            }
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{formatDate(entry.timestamp, 'MMM d, yyyy')}</span>
                            <span>{entry.wordCount} words</span>
                            {entry.mood && (
                              <span className="flex items-center gap-1">
                                {React.createElement(
                                  MOOD_OPTIONS.find(m => m.value === entry.mood)?.icon || Sun,
                                  { className: "w-3 h-3" }
                                )}
                                {entry.mood}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
              {/* Writing Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {React.createElement(JOURNAL_TYPES[selectedType].icon, {
                    className: "w-6 h-6 text-gray-500"
                  })}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {JOURNAL_TYPES[selectedType].name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(new Date(), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEncrypted(!isEncrypted)}
                    className={`p-2 rounded-lg ${
                      isEncrypted
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {isEncrypted ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={saveEntry}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsWriting(false);
                      setCurrentEntry({
                        type: 'freeform',
                        title: '',
                        content: '',
                        tags: [],
                        mood: undefined
                      });
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <input
                type="text"
                placeholder="Entry title (_optional)"
                value={currentEntry.title || ''}
                onChange={(e) => setCurrentEntry(prev => ({ ...prev, title: e.target.value }))}
                className="w-full mb-4 px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Mood Selection */}
              <div className="mb-4">
                <label htmlFor="input_u1up5dvou" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  How are you feeling?
                </label>
                <div className="flex gap-3">
                  {MOOD_OPTIONS.map(mood => {
                    const Icon = mood.icon;
                    return (
                      <button
                        key={mood.value}
                        onClick={() => setCurrentEntry(prev => ({ 
                          ...prev, 
                          mood: prev.mood === mood.value ? undefined : mood.value 
                        }))}
                        className={`p-3 rounded-lg transition-all ${
                          currentEntry.mood === mood.value
                            ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500'
                            : 'bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className={`w-6 h-6 ${mood.color}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Writing Area */}
              {selectedType === 'thought' || selectedType === 'emotion' ? (
                <div className="space-y-4">
                  {Object.entries(JOURNAL_TYPES[selectedType].structure!).map(([key, prompt]) => (
                    <div key={key}>
                      <label htmlFor="input_q6n8mo9is" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        {prompt}
                      </label>
                      <textarea
                        placeholder={`Write about ${prompt.toLowerCase()}...`}
                        value={(currentEntry.content as Record<string, string>)?.[key] || ''}
                        onChange={(e) => setCurrentEntry(prev => ({
                          ...prev,
                          content: {
                            ...(typeof prev.content === 'object' ? prev.content : {}),
                            [key]: e.target.value
                          }
                        }))}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={3}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  {selectedType === 'gratitude' || selectedType === 'reflection' ? (
                    <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Prompts to consider:
                      </p>
                      <ul className="mt-2 space-y-1">
                        {JOURNAL_TYPES[selectedType].prompts?.map((prompt, idx) => (
                          <li key={idx} className="text-sm text-blue-600 dark:text-blue-400">
                            • {prompt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  
                  <textarea
                    ref={editorRef}
                    placeholder="Start writing your thoughts..."
                    value={currentEntry.content as string || ''}
                    onChange={(e) => setCurrentEntry(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full h-96 px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              )}

              {/* Tags Input */}
              <div className="mt-4">
                <label htmlFor="input_t95p5495r" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g., work, family, self-care"
                  value={currentEntry.tags?.join(', ') || ''}
                  onChange={(e) => setCurrentEntry(prev => ({
                    ...prev,
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                  }))}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Word Count */}
              <div className="mt-4 flex justify-between text-sm text-gray-500">
                <span>
                  {autoSaveEnabled && (
                    <>
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Auto-save enabled
                    </>
                  )}
                </span>
                <span>
                  {calculateStats(currentEntry.content || '').wordCount} words
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Search and _Filter */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Search & Filter
            </h3>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <select
                value={filterType || ''}
                onChange={(e) => setFilterType(e.target.value as keyof typeof JOURNAL_TYPES || null)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                {Object.entries(_JOURNAL_TYPES).map(([key, type]) => (
                  <option key={key} value={key}>{type.name}</option>
                ))}
              </select>
              
              <select
                value={filterMood || ''}
                onChange={(e) => setFilterMood(e.target.value || null)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Moods</option>
                {MOOD_OPTIONS.map(mood => (
                  <option key={mood.value} value={mood.value}>
                    {mood.value.charAt(0).toUpperCase() + mood.value.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Entry View */}
          <AnimatePresence>
            {selectedEntry && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Entry Details
                  </h3>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Title</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedEntry.title}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Date</p>
                    <p className="text-gray-700 dark:text-gray-300">
                      {formatDate(selectedEntry.timestamp, 'PPP')}
                    </p>
                  </div>
                  
                  {selectedEntry.mood && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Mood</p>
                      <div className="flex items-center gap-2">
                        {React.createElement(
                          MOOD_OPTIONS.find(m => m.value === selectedEntry.mood)?.icon || Sun,
                          { className: "w-5 h-5" }
                        )}
                        <span className="text-gray-700 dark:text-gray-300">
                          {selectedEntry.mood}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {selectedEntry.tags.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedEntry.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedEntry.insights && selectedEntry.insights.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Insights</p>
                      <div className="space-y-1">
                        {selectedEntry.insights.map((insight, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-yellow-500" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {insight}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Statistics</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {selectedEntry.wordCount}
                        </p>
                        <p className="text-xs text-gray-500">words</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {selectedEntry.readingTime}
                        </p>
                        <p className="text-xs text-gray-500">min read</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        setCurrentEntry({
                          ...selectedEntry,
                          type: selectedEntry.type
                        });
                        setSelectedType(selectedEntry.type);
                        setIsWriting(true);
                        setSelectedEntry(null);
                      }}
                      className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Continue Entry
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};