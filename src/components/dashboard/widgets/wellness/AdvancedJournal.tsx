import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  PenTool,
  Search,
  Filter,
  Tag,
  Calendar,
  Heart,
  Smile,
  Frown,
  Meh,
  TrendingUp,
  Download,
  ChevronRight,
  Sparkles,
  Brain,
  Award,
  Clock,
  FileText,
  MessageSquare,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { format, isToday, isYesterday, differenceInDays } from 'date-fns';

interface JournalEntry {
  id: string;
  timestamp: Date;
  content: string;
  mood?: number;
  emotions?: string[];
  tags?: string[];
  sentiment?: {
    score: number; // -1 to 1
    magnitude: number; // 0 to infinity
    emotions: {
      joy: number;
      sadness: number;
      anger: number;
      fear: number;
      surprise: number;
      love: number;
    };
  };
  gratitude?: string[];
  achievements?: string[];
  prompts?: string[];
  wordCount: number;
  editedAt?: Date;
  isPrivate?: boolean;
}

interface AdvancedJournalProps {
  entries?: JournalEntry[];
  onNewEntry?: () => void;
  onEditEntry?: (id: string) => void;
  onExport?: (entries: JournalEntry[]) => void;
  _onSearch?: (query: string) => void;
}

export function AdvancedJournal({ 
  entries = [], 
  onNewEntry, 
  onEditEntry,
  onExport,
  _onSearch 
}: AdvancedJournalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);

  // Mock journal entries if none provided
  const mockEntries: JournalEntry[] = [
    {
      id: '1',
      timestamp: new Date(),
      content: "Today was a breakthrough day. I finally understood that my anxiety doesn&apos;t define me. The meditation session this morning really helped me see things from a different perspective.",
      mood: 7,
      emotions: ['hopeful', 'calm', 'grateful'],
      tags: ['breakthrough', 'meditation', 'anxiety'],
      sentiment: {
        score: 0.8,
        magnitude: 2.1,
        emotions: {
          joy: 0.7,
          sadness: 0.1,
          anger: 0,
          fear: 0.1,
          surprise: 0.3,
          love: 0.6
        }
      },
      gratitude: ['My support system', 'Morning sunlight', 'Progress in therapy'],
      achievements: ['Completed 30-minute meditation', 'Reached out to a friend'],
      wordCount: 42,
      prompts: ['What made today meaningful?']
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 86400000),
      content: "Struggled with motivation today, but I&apos;m proud that I still managed to journal. Small wins count too.",
      mood: 5,
      emotions: ['tired', 'proud', 'determined'],
      tags: ['motivation', 'small-wins'],
      sentiment: {
        score: 0.3,
        magnitude: 1.5,
        emotions: {
          joy: 0.3,
          sadness: 0.4,
          anger: 0,
          fear: 0.2,
          surprise: 0,
          love: 0.2
        }
      },
      wordCount: 18,
      prompts: ['What am I proud of today?']
    }
  ];

  const journalEntries = entries.length > 0 ? entries : mockEntries;

  // Filter entries based on search and filters
  const filteredEntries = useMemo(() => {
    let filtered = [...journalEntries];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(entry =>
        entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        entry.emotions?.some(emotion => emotion.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(entry =>
        selectedTags.every(tag => entry.tags?.includes(tag))
      );
    }

    // Emotion filter
    if (selectedEmotions.length > 0) {
      filtered = filtered.filter(entry =>
        selectedEmotions.every(emotion => entry.emotions?.includes(emotion))
      );
    }

    // Date filter
    const now = new Date();
    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(entry => isToday(new Date(entry.timestamp)));
        break;
      case 'week':
        filtered = filtered.filter(entry => 
          differenceInDays(now, new Date(entry.timestamp)) <= 7
        );
        break;
      case 'month':
        filtered = filtered.filter(entry => 
          differenceInDays(now, new Date(entry.timestamp)) <= 30
        );
        break;
    }

    return filtered.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [journalEntries, searchQuery, selectedTags, selectedEmotions, dateFilter]);

  // Extract all unique tags and emotions
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    journalEntries.forEach(entry => {
      entry.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [journalEntries]);

  const allEmotions = useMemo(() => {
    const emotions = new Set<string>();
    journalEntries.forEach(entry => {
      entry.emotions?.forEach(emotion => emotions.add(emotion));
    });
    return Array.from(emotions);
  }, [journalEntries]);

  // Calculate sentiment statistics
  const sentimentStats = useMemo(() => {
    const validEntries = filteredEntries.filter(e => e.sentiment);
    if (validEntries.length === 0) return null;

    const avgSentiment = validEntries.reduce((sum, e) => sum + (e.sentiment?.score || 0), 0) / validEntries.length;
    const _dominantEmotion = validEntries.reduce((emotions, entry) => {
      if (!entry.sentiment?.emotions) return emotions;
      Object.entries(entry.sentiment.emotions).forEach(([emotion, value]) => {
        emotions[emotion] = (emotions[emotion] || 0) + value;
      });
      return emotions;
    }, {} as Record<string, number>);

    const topEmotion = Object.entries(_dominantEmotion)
      .sort((a, b) => b[1] - a[1])[0];

    return {
      avgSentiment,
      topEmotion: topEmotion ? topEmotion[0] : null,
      totalWords: filteredEntries.reduce((sum, e) => sum + e.wordCount, 0),
      avgWords: Math.round(filteredEntries.reduce((sum, e) => sum + e.wordCount, 0) / filteredEntries.length)
    };
  }, [filteredEntries]);

  // Get writing prompts based on current mood and patterns
  const writingPrompts = useMemo(() => {
    const prompts = [
      {
        category: 'reflection',
        prompt: 'What moment from today would you like to remember?',
        difficulty: 'easy'
      },
      {
        category: 'gratitude',
        prompt: 'List three things that brought you joy today, no matter how small.',
        difficulty: 'easy'
      },
      {
        category: 'growth',
        prompt: 'What challenge did you face today and what did it teach you?',
        difficulty: 'medium'
      },
      {
        category: 'emotions',
        prompt: 'Describe your emotions today as if they were weather patterns.',
        difficulty: 'medium'
      },
      {
        category: 'future',
        prompt: 'Write a letter to yourself one year from now.',
        difficulty: 'deep'
      },
      {
        category: 'relationships',
        prompt: 'How did your interactions with others affect your mood today?',
        difficulty: 'deep'
      }
    ];

    // Customize prompts based on recent sentiment
    if (sentimentStats?.avgSentiment && sentimentStats.avgSentiment < 0) {
      prompts.unshift({
        category: 'support',
        prompt: 'What would you tell a friend who was feeling the way you are now?',
        difficulty: 'medium'
      });
    }

    return prompts.slice(0, 3);
  }, [sentimentStats]);

  // Format date for display
  const formatEntryDate = (date: Date) => {
    const entryDate = new Date(date);
    if (isToday(entryDate)) return 'Today';
    if (isYesterday(entryDate)) return 'Yesterday';
    return format(entryDate, 'MMM d, yyyy');
  };

  // Get mood emoji
  const getMoodEmoji = (mood?: number) => {
    if (!mood) return <Meh className="h-5 w-5 text-gray-400" />;
    if (mood >= 7) return <Smile className="h-5 w-5 text-green-500" />;
    if (mood >= 4) return <Meh className="h-5 w-5 text-yellow-500" />;
    return <Frown className="h-5 w-5 text-red-500" />;
  };

  // Get sentiment color
  const getSentimentColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score > 0.5) return 'text-green-600';
    if (score > 0) return 'text-blue-600';
    if (score > -0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Handle export
  const handleExport = () => {
    if (onExport) {
      onExport?.(filteredEntries);
    } else {
      // Create markdown export
      const markdown = filteredEntries.map(entry => `
## ${format(new Date(entry.timestamp), 'MMMM d, yyyy - h:mm a')}
**Mood:** ${entry.mood || 'Not recorded'}
**Emotions:** ${entry.emotions?.join(', ') || 'None'}
**Tags:** ${entry.tags?.join(', ') || 'None'}

${entry.content}

${entry.gratitude ? `**Gratitude:** ${entry.gratitude.join(', ')}` : ''}
${entry.achievements ? `**Achievements:** ${entry.achievements.join(', ')}` : ''}
      `).join('\n---\n');

      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `journal-export-${format(new Date(), 'yyyy-MM-dd')}.md`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-6 w-6" />
            <div>
              <h3 className="text-lg font-semibold">Your Journal</h3>
              <p className="text-xs text-indigo-100">
                {filteredEntries.length} entries • {sentimentStats?.totalWords || 0} words
              </p>
            </div>
          </div>
          <button
            onClick={onNewEntry}
            className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors flex items-center"
          >
            <PenTool className="h-4 w-4 mr-2" />
            New Entry
          </button>
        </div>

        {/* Sentiment overview */}
        {sentimentStats && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/20 rounded-lg p-2 text-center">
              <p className="text-xs text-indigo-100">Avg Sentiment</p>
              <p className={`text-lg font-bold ${sentimentStats.avgSentiment > 0 ? 'text-green-300' : 'text-red-300'}`}>
                {sentimentStats.avgSentiment > 0 ? '+' : ''}{(sentimentStats.avgSentiment * 100).toFixed(0)}%
              </p>
            </div>
            <div className="bg-white/20 rounded-lg p-2 text-center">
              <p className="text-xs text-indigo-100">Top Emotion</p>
              <p className="text-lg font-bold capitalize">
                {sentimentStats.topEmotion || 'Mixed'}
              </p>
            </div>
            <div className="bg-white/20 rounded-lg p-2 text-center">
              <p className="text-xs text-indigo-100">Avg Words</p>
              <p className="text-lg font-bold">
                {sentimentStats.avgWords}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Search and filters */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entries, tags, emotions..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Filter className="h-5 w-5" />
          </button>
          <button
            onClick={handleExport}
            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download className="h-5 w-5" />
          </button>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                {/* Date filter */}
                <div>
                  <label htmlFor="input_lsd9ubn8q" className="text-sm font-medium text-gray-700 mb-2 block">Time Period</label>
                  <div className="flex space-x-2">
                    {(['all', 'today', 'week', 'month'] as const).map(period => (
                      <button
                        key={period}
                        onClick={() => setDateFilter(period)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          dateFilter === period
                            ? 'bg-purple-500 text-white'
                            : 'bg-white text-gray-700 border border-gray-300'
                        }`}
                      >
                        {period.charAt(0).toUpperCase() + period.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags filter */}
                {allTags.length > 0 && (
                  <div>
                    <label htmlFor="input_3sny0mu0n" className="text-sm font-medium text-gray-700 mb-2 block">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map((tag: string) => (
                        <button
                          key={tag}
                          onClick={() => {
                            setSelectedTags((prev: string[]) =>
                              prev.includes(tag)
                                ? prev.filter((t: string) => t !== tag)
                                : [...prev, tag]
                            );
                          }}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            selectedTags.includes(tag)
                              ? 'bg-purple-500 text-white'
                              : 'bg-white text-gray-700 border border-gray-300'
                          }`}
                        >
                          <Tag className="inline h-3 w-3 mr-1" />
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Emotions filter */}
                {allEmotions.length > 0 && (
                  <div>
                    <label htmlFor="input_8c2r6d1vh" className="text-sm font-medium text-gray-700 mb-2 block">Emotions</label>
                    <div className="flex flex-wrap gap-2">
                      {allEmotions.map((emotion: string) => (
                        <button
                          key={emotion}
                          onClick={() => {
                            setSelectedEmotions((prev: string[]) =>
                              prev.includes(emotion)
                                ? prev.filter((e: string) => e !== emotion)
                                : [...prev, emotion]
                            );
                          }}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            selectedEmotions.includes(emotion)
                              ? 'bg-purple-500 text-white'
                              : 'bg-white text-gray-700 border border-gray-300'
                          }`}
                        >
                          <Heart className="inline h-3 w-3 mr-1" />
                          {emotion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Writing prompts */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-yellow-600" />
          Today&apos;s Writing Prompts
        </h4>
        <div className="space-y-2">
          {writingPrompts.map((prompt: any, idx: number) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-3 bg-white rounded-lg cursor-pointer hover:shadow-sm transition-all"
              onClick={() => onNewEntry?.()}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{prompt.prompt}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      prompt.difficulty === 'easy' 
                        ? 'bg-green-100 text-green-700'
                        : prompt.difficulty === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {prompt.difficulty}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">
                      {prompt.category}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 mt-1" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Journal entries */}
      <div className="space-y-3">
        {filteredEntries.length > 0 ? (
          filteredEntries.map((entry, idx) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all cursor-pointer ${
                selectedEntry === entry.id ? 'ring-2 ring-purple-500' : ''
              }`}
              onClick={() => setSelectedEntry(selectedEntry === entry.id ? null : entry.id)}
            >
              {/* Entry header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      {formatEntryDate(entry.timestamp)}
                    </p>
                    <p className="text-sm font-medium text-gray-700">
                      {format(new Date(entry.timestamp), 'h:mm a')}
                    </p>
                  </div>
                  {getMoodEmoji(entry.mood)}
                  {entry.sentiment && (
                    <div className="flex items-center space-x-1">
                      <Brain className={`h-4 w-4 ${getSentimentColor(entry.sentiment.score)}`} />
                      <span className={`text-xs font-medium ${getSentimentColor(entry.sentiment.score)}`}>
                        {entry.sentiment.score > 0 ? '+' : ''}{(entry.sentiment.score * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditEntry?.(entry.id);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <PenTool className="h-4 w-4" />
                </button>
              </div>

              {/* Entry content */}
              <p className={`text-gray-700 mb-3 ${
                selectedEntry === entry.id ? '' : 'line-clamp-3'
              }`}>
                {entry.content}
              </p>

              {/* Tags and emotions */}
              <div className="flex flex-wrap gap-2 mb-2">
                {entry.tags?.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
                {entry.emotions?.map(emotion => (
                  <span
                    key={emotion}
                    className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full"
                  >
                    {emotion}
                  </span>
                ))}
              </div>

              {/* Expanded content */}
              <AnimatePresence>
                {selectedEntry === entry.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 border-t border-gray-100 space-y-3">
                      {/* Gratitude */}
                      {entry.gratitude && entry.gratitude.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <Heart className="h-4 w-4 mr-1 text-red-500" />
                            Gratitude
                          </h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {entry.gratitude.map((item, idx) => (
                              <li key={idx} className="flex items-start">
                                <CheckCircle className="h-3 w-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Achievements */}
                      {entry.achievements && entry.achievements.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <Award className="h-4 w-4 mr-1 text-yellow-500" />
                            Achievements
                          </h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {entry.achievements.map((item, idx) => (
                              <li key={idx} className="flex items-start">
                                <CheckCircle className="h-3 w-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Sentiment emotions breakdown */}
                      {entry.sentiment?.emotions && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Emotional Analysis</h5>
                          <div className="grid grid-cols-3 gap-2">
                            {Object.entries(entry.sentiment.emotions).map(([emotion, value]) => (
                              <div key={emotion} className="text-center">
                                <div className="h-1 bg-gray-200 rounded-full overflow-hidden mb-1">
                                  <div
                                    className="h-full bg-gradient-to-r from-purple-400 to-purple-600"
                                    style={{ width: `${value * 100}%` }}
                                  />
                                </div>
                                <p className="text-xs text-gray-600 capitalize">{emotion}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center">
                          <FileText className="h-3 w-3 mr-1" />
                          {entry.wordCount} words
                        </span>
                        {entry.prompts && entry.prompts.length > 0 && (
                          <span className="flex items-center">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Prompted
                          </span>
                        )}
                        {entry.editedAt && (
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Edited {format(new Date(entry.editedAt), 'MMM d')}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No journal entries found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery || selectedTags.length > 0 || selectedEmotions.length > 0
                ? 'Try adjusting your filters'
                : 'Start writing to track your journey'}
            </p>
            <button
              onClick={onNewEntry}
              className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Write Your First Entry
            </button>
          </div>
        )}
      </div>

      {/* Insights */}
      {filteredEntries.length >= 5 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
            <Brain className="h-5 w-5 mr-2 text-indigo-600" />
            Journal Insights
          </h4>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center justify-between">
              <span>Most frequent emotion:</span>
              <span className="font-medium">
                {allEmotions[0] || 'Not enough data'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Average mood trend:</span>
              <span className="font-medium flex items-center">
                {sentimentStats?.avgSentiment && sentimentStats.avgSentiment > 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    Improving
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
                    Variable
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Writing consistency:</span>
              <span className="font-medium">
                {filteredEntries.length} entries this period
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}