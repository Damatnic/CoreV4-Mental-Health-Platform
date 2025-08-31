import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Minus, Calendar, Clock, 
  Sun, Cloud, CloudRain, Zap, Moon, Heart, Brain,
  Activity, Coffee, Users, Home, Briefcase, BookOpen
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MoodEntry {
  id: string;
  timestamp: Date;
  moodScore: number; // 1-10 scale
  emotions: string[];
  activities: string[];
  triggers: string[];
  notes: string;
  weather?: string;
  sleep?: number;
  exercise?: boolean;
  medication?: boolean;
  socialInteraction?: number; // 1-5 scale
  location?: string;
}

interface MoodPattern {
  pattern: string;
  frequency: number;
  impact: 'positive' | 'negative' | 'neutral';
  recommendation: string;
}

const MOOD_EMOJIS = ['😔', '😟', '😐', '🙂', '😊'];
const MOOD_COLORS = ['#EF4444', '#F59E0B', '#FCD34D', '#84CC16', '#22C55E'];

const EMOTIONS = [
  { value: 'happy', label: '😊 Happy', color: '#22C55E' },
  { value: 'sad', label: '😢 Sad', color: '#3B82F6' },
  { value: 'anxious', label: '😰 Anxious', color: '#F59E0B' },
  { value: 'angry', label: '😠 Angry', color: '#EF4444' },
  { value: 'calm', label: '😌 Calm', color: '#06B6D4' },
  { value: 'excited', label: '🤗 Excited', color: '#A855F7' },
  { value: 'tired', label: '😴 Tired', color: '#6B7280' },
  { value: 'stressed', label: '😣 Stressed', color: '#DC2626' },
  { value: 'grateful', label: '🙏 Grateful', color: '#10B981' },
  { value: 'lonely', label: '😔 Lonely', color: '#7C3AED' }
];

const ACTIVITIES = [
  { value: 'work', label: 'Work', icon: Briefcase },
  { value: 'exercise', label: 'Exercise', icon: Activity },
  { value: 'social', label: 'Socializing', icon: Users },
  { value: 'relaxing', label: 'Relaxing', icon: Home },
  { value: 'learning', label: 'Learning', icon: BookOpen },
  { value: 'creative', label: 'Creative', icon: Brain }
];

export function MoodTracker() {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [currentMood, setCurrentMood] = useState(5);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [moodNotes, setMoodNotes] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [patterns, setPatterns] = useState<MoodPattern[]>([]);
  const [sleepHours, setSleepHours] = useState(7);
  const [hadExercise, setHadExercise] = useState(false);
  const [socialScore, setSocialScore] = useState(3);

  // Load mood entries from localStorage
  useEffect(() => {
    const savedEntries = localStorage.getItem('moodEntries');
    if (savedEntries) {
      const entries = JSON.parse(savedEntries);
      setMoodEntries(entries.map((e: any) => ({
        ...e,
        timestamp: new Date(e.timestamp)
      })));
    }
  }, []);

  // Analyze patterns when entries change
  useEffect(() => {
    if (moodEntries.length > 5) {
      analyzeMoodPatterns();
    }
  }, [moodEntries, timeRange]);

  // Save mood entry
  const saveMoodEntry = () => {
    const newEntry: MoodEntry = {
      id: `mood-${Date.now()}`,
      timestamp: new Date(),
      moodScore: currentMood,
      emotions: selectedEmotions,
      activities: selectedActivities,
      triggers: [],
      notes: moodNotes,
      sleep: sleepHours,
      exercise: hadExercise,
      socialInteraction: socialScore,
      medication: true // This would be tracked properly in production
    };

    const updatedEntries = [...moodEntries, newEntry];
    setMoodEntries(updatedEntries);
    localStorage.setItem('moodEntries', JSON.stringify(updatedEntries));

    // Reset form
    setCurrentMood(5);
    setSelectedEmotions([]);
    setSelectedActivities([]);
    setMoodNotes('');
    setSleepHours(7);
    setHadExercise(false);
    setSocialScore(3);

    // Show success feedback
    alert('Mood entry saved successfully!');
  };

  // Analyze mood patterns using simple algorithms
  const analyzeMoodPatterns = () => {
    const newPatterns: MoodPattern[] = [];

    // Pattern 1: Low mood correlation with sleep
    const lowMoodEntries = moodEntries.filter(e => e.moodScore <= 4);
    const poorSleepLowMood = lowMoodEntries.filter(e => (e.sleep || 0) < 6);
    if (poorSleepLowMood.length > lowMoodEntries.length * 0.6) {
      newPatterns.push({
        pattern: 'Poor sleep linked to low mood',
        frequency: poorSleepLowMood.length,
        impact: 'negative',
        recommendation: 'Consider improving sleep hygiene. Aim for 7-9 hours of quality sleep.'
      });
    }

    // Pattern 2: Exercise impact
    const exerciseEntries = moodEntries.filter(e => e.exercise);
    const avgMoodWithExercise = exerciseEntries.reduce((sum, e) => sum + e.moodScore, 0) / (exerciseEntries.length || 1);
    const noExerciseEntries = moodEntries.filter(e => !e.exercise);
    const avgMoodWithoutExercise = noExerciseEntries.reduce((sum, e) => sum + e.moodScore, 0) / (noExerciseEntries.length || 1);
    
    if (avgMoodWithExercise > avgMoodWithoutExercise + 1) {
      newPatterns.push({
        pattern: 'Exercise boosts your mood',
        frequency: exerciseEntries.length,
        impact: 'positive',
        recommendation: 'Keep up the regular exercise! It significantly improves your mood.'
      });
    }

    // Pattern 3: Social interaction correlation
    const highSocialEntries = moodEntries.filter(e => (e.socialInteraction || 0) >= 4);
    const avgMoodHighSocial = highSocialEntries.reduce((sum, e) => sum + e.moodScore, 0) / (highSocialEntries.length || 1);
    
    if (avgMoodHighSocial > 6) {
      newPatterns.push({
        pattern: 'Social connections improve mood',
        frequency: highSocialEntries.length,
        impact: 'positive',
        recommendation: 'Social interactions positively affect your wellbeing. Stay connected!'
      });
    }

    // Pattern 4: Time of day patterns
    const morningEntries = moodEntries.filter(e => e.timestamp.getHours() < 12);
    const eveningEntries = moodEntries.filter(e => e.timestamp.getHours() >= 18);
    const avgMorningMood = morningEntries.reduce((sum, e) => sum + e.moodScore, 0) / (morningEntries.length || 1);
    const avgEveningMood = eveningEntries.reduce((sum, e) => sum + e.moodScore, 0) / (eveningEntries.length || 1);
    
    if (Math.abs(avgMorningMood - avgEveningMood) > 2) {
      newPatterns.push({
        pattern: avgMorningMood > avgEveningMood ? 'Better mood in mornings' : 'Better mood in evenings',
        frequency: moodEntries.length,
        impact: 'neutral',
        recommendation: `Your mood tends to be better in the ${avgMorningMood > avgEveningMood ? 'morning' : 'evening'}. Plan important activities accordingly.`
      });
    }

    setPatterns(newPatterns);
  };

  // Get chart data
  const getChartData = () => {
    const filteredEntries = getFilteredEntries();
    const labels = filteredEntries.map(e => 
      e.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    const moodData = filteredEntries.map(e => e.moodScore);

    return {
      labels,
      datasets: [
        {
          label: 'Mood Score',
          data: moodData,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };
  };

  // Get emotion distribution data
  const getEmotionData = () => {
    const emotionCounts: Record<string, number> = {};
    moodEntries.forEach(entry => {
      entry.emotions.forEach(emotion => {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });
    });

    const sortedEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      labels: sortedEmotions.map(([emotion]) => 
        EMOTIONS.find(e => e.value === emotion)?.label || emotion
      ),
      datasets: [{
        data: sortedEmotions.map(([, count]) => count),
        backgroundColor: sortedEmotions.map(([emotion]) => 
          EMOTIONS.find(e => e.value === emotion)?.color || '#6B7280'
        )
      }]
    };
  };

  // Filter entries based on time range
  const getFilteredEntries = () => {
    const now = new Date();
    const cutoff = new Date();
    
    switch (timeRange) {
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
    }

    return moodEntries
      .filter(e => e.timestamp >= cutoff)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  };

  // Calculate mood statistics
  const getMoodStats = () => {
    const filtered = getFilteredEntries();
    if (filtered.length === 0) return { average: 0, trend: 'stable', change: 0 };

    const average = filtered.reduce((sum, e) => sum + e.moodScore, 0) / filtered.length;
    const recentAvg = filtered.slice(-3).reduce((sum, e) => sum + e.moodScore, 0) / Math.min(3, filtered.length);
    const olderAvg = filtered.slice(0, -3).reduce((sum, e) => sum + e.moodScore, 0) / Math.max(1, filtered.length - 3);
    
    const change = recentAvg - olderAvg;
    const trend = change > 0.5 ? 'improving' : change < -0.5 ? 'declining' : 'stable';

    return { average: average.toFixed(1), trend, change: change.toFixed(1) };
  };

  const stats = getMoodStats();

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl p-8 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mood Tracker</h1>
            <p className="opacity-90">Track your emotional wellbeing over time</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{stats.average}</div>
            <div className="text-sm opacity-75">Average Mood</div>
            <div className="flex items-center mt-2">
              {stats.trend === 'improving' ? (
                <TrendingUp className="h-5 w-5 mr-1" />
              ) : stats.trend === 'declining' ? (
                <TrendingDown className="h-5 w-5 mr-1" />
              ) : (
                <Minus className="h-5 w-5 mr-1" />
              )}
              <span className="text-sm">{stats.trend}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Mood Entry */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">How are you feeling?</h2>
        
        {/* Mood Slider */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {MOOD_EMOJIS.map((emoji, index) => (
              <span
                key={index}
                className={`text-2xl cursor-pointer transition-transform ${
                  Math.floor(currentMood / 2) === index ? 'scale-125' : 'opacity-50'
                }`}
                onClick={() => setCurrentMood((index + 1) * 2)}
              >
                {emoji}
              </span>
            ))}
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={currentMood}
            onChange={(e) => setCurrentMood(Number(e.target.value))}
            className="w-full h-3 bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${MOOD_COLORS.join(', ')})`
            }}
          />
          <div className="text-center mt-2">
            <span className="text-3xl font-bold" style={{ color: MOOD_COLORS[Math.floor(currentMood / 2.1)] }}>
              {currentMood}/10
            </span>
          </div>
        </div>

        {/* Emotions */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What emotions are you experiencing?
          </label>
          <div className="flex flex-wrap gap-2">
            {EMOTIONS.map((emotion) => (
              <button
                key={emotion.value}
                onClick={() => {
                  setSelectedEmotions(prev =>
                    prev.includes(emotion.value)
                      ? prev.filter(e => e !== emotion.value)
                      : [...prev, emotion.value]
                  );
                }}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedEmotions.includes(emotion.value)
                    ? 'ring-2 ring-offset-2'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: selectedEmotions.includes(emotion.value) ? emotion.color + '20' : undefined,
                  color: selectedEmotions.includes(emotion.value) ? emotion.color : undefined,
                  borderColor: selectedEmotions.includes(emotion.value) ? emotion.color : undefined,
                  ringColor: selectedEmotions.includes(emotion.value) ? emotion.color : undefined
                }}
              >
                {emotion.label}
              </button>
            ))}
          </div>
        </div>

        {/* Activities */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What have you been doing?
          </label>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {ACTIVITIES.map((activity) => (
              <button
                key={activity.value}
                onClick={() => {
                  setSelectedActivities(prev =>
                    prev.includes(activity.value)
                      ? prev.filter(a => a !== activity.value)
                      : [...prev, activity.value]
                  );
                }}
                className={`p-3 rounded-lg text-center transition-all ${
                  selectedActivities.includes(activity.value)
                    ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <activity.icon className="h-6 w-6 mx-auto mb-1" />
                <span className="text-xs">{activity.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Additional Factors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sleep (hours)
            </label>
            <input
              type="number"
              min="0"
              max="24"
              value={sleepHours}
              onChange={(e) => setSleepHours(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exercise today?
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setHadExercise(true)}
                className={`flex-1 py-2 rounded-lg ${
                  hadExercise ? 'bg-green-100 text-green-700' : 'bg-gray-100'
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => setHadExercise(false)}
                className={`flex-1 py-2 rounded-lg ${
                  !hadExercise ? 'bg-red-100 text-red-700' : 'bg-gray-100'
                }`}
              >
                No
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Social interaction
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setSocialScore(level)}
                  className={`flex-1 py-2 rounded ${
                    socialScore >= level ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (optional)
          </label>
          <textarea
            value={moodNotes}
            onChange={(e) => setMoodNotes(e.target.value)}
            placeholder="Any thoughts, triggers, or observations..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        {/* Save Button */}
        <button
          onClick={saveMoodEntry}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Save Mood Entry
        </button>
      </div>

      {/* Analytics Toggle */}
      <div className="flex justify-center mb-8">
        <button
          onClick={() => setShowAnalytics(!showAnalytics)}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
        >
          {showAnalytics ? 'Hide' : 'Show'} Analytics & Insights
        </button>
      </div>

      {/* Analytics Section */}
      {showAnalytics && moodEntries.length > 0 && (
        <div className="space-y-8">
          {/* Time Range Selector */}
          <div className="flex justify-center gap-2">
            {(['week', 'month', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mood Trend Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Mood Trend</h3>
              <Line
                data={getChartData()}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (context) => `Mood: ${context.parsed.y}/10`
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 10,
                      ticks: { stepSize: 1 }
                    }
                  }
                }}
              />
            </div>

            {/* Emotion Distribution */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Top Emotions</h3>
              {moodEntries.length > 0 ? (
                <Doughnut
                  data={getEmotionData()}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'bottom' }
                    }
                  }}
                />
              ) : (
                <p className="text-gray-500 text-center py-8">No emotion data yet</p>
              )}
            </div>
          </div>

          {/* Patterns & Insights */}
          {patterns.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Patterns & Insights</h3>
              <div className="space-y-4">
                {patterns.map((pattern, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      pattern.impact === 'positive'
                        ? 'bg-green-50 border-green-500'
                        : pattern.impact === 'negative'
                        ? 'bg-red-50 border-red-500'
                        : 'bg-gray-50 border-gray-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{pattern.pattern}</h4>
                        <p className="text-sm text-gray-600 mt-1">{pattern.recommendation}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        pattern.impact === 'positive'
                          ? 'bg-green-200 text-green-800'
                          : pattern.impact === 'negative'
                          ? 'bg-red-200 text-red-800'
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        {pattern.frequency} occurrences
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Entries */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Entries</h3>
            <div className="space-y-3">
              {getFilteredEntries().slice(-5).reverse().map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">{MOOD_EMOJIS[Math.floor(entry.moodScore / 2.1)]}</span>
                    <div>
                      <p className="font-medium">
                        {entry.timestamp.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {entry.emotions.slice(0, 3).map(e => 
                          EMOTIONS.find(em => em.value === e)?.label || e
                        ).join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold" style={{ color: MOOD_COLORS[Math.floor(entry.moodScore / 2.1)] }}>
                      {entry.moodScore}/10
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}