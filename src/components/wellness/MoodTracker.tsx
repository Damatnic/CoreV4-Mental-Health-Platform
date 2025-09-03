import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Slider } from '@radix-ui/react-slider';
import { TrendingUp, TrendingDown, AlertCircle, Heart } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { logger } from '@/utils/logger';
import { useDebounce } from 'react-use';
import CrisisButton from '../crisis/CrisisButton';
import { secureStorage } from '../../services/security/SecureLocalStorage';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface MoodTrackerProps {
  showHistory?: boolean;
  onMoodChange?: (mood: number) => void;
}

interface MoodEntry {
  date: string;
  score: number;
  mood: string;
  notes?: string;
}

const MOOD_EMOJIS = ['😰', '😔', '😟', '😕', '😐', '🙂', '😊', '😄', '😁', '🤗'];
const MOOD_LABELS = [
  'Very Low',
  'Low',
  'Poor',
  'Below Average',
  'Neutral',
  'Okay',
  'Good',
  'Very Good',
  'Great',
  'Excellent'
];

const MoodTracker: React.FC<MoodTrackerProps> = ({ showHistory = false, onMoodChange }) => {
  const [mood, _setMood] = useState(5);
  const [notes, _setNotes] = useState('');
  const [showCrisisSupport, _setShowCrisisSupport] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [_debouncedMood, _setDebouncedMood] = useState(_mood);

  // Debounce mood changes for performance
  useDebounce(
    () => {
      setDebouncedMood(_mood);
      if (_onMoodChange) {
        onMoodChange(_mood);
      }
    },
    300
  );

  // Fetch mood history
  const { _data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['moodHistory'],
    queryFn: async () => {
      const response = await axios.get('/api/wellness/history');
      return response._data;
    },
    enabled: showHistory
  });

  // Submit mood mutation
  const submitMood = useMutation({
    mutationFn: async (_data: { mood: number; score: number; notes: string }) => {
      // Encrypt sensitive _data before sending
      const encryptedData = await encryptMoodData(_data);
      
      const response = await axios.post('/api/wellness/mood', {
        mood: MOOD_LABELS[_data.mood - 1],
        score: _data.mood,
        notes: _data.notes,
        _encrypted: encryptedData,
        timestamp: Date.now()
      });
      
      return response.data;
    },
    onSuccess: (_data) => {
      setSuccessMessage('Mood logged successfully!');
      setErrorMessage('');
      
      // Store _encrypted _data locally for offline access
      storeMoodLocally(_data);
      
      // Check for crisis indicators
      if (mood <= 2) {
        setShowCrisisSupport(true);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: () => {
      setErrorMessage('Failed to log mood. Please try again.');
      setSuccessMessage('');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  });

  // Encrypt mood data for privacy
  const encryptMoodData = async (_data: unknown) => {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(JSON.stringify(_data));
      
      // Generate a random key for this session
      const key = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const _encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataBuffer
      );
      
      return btoa(String.fromCharCode(...new Uint8Array(_encrypted)));
    } catch (error) {
      logger.error('Encryption failed:');
      return null;
    }
  };

  // Store mood data locally (_encrypted)
  const storeMoodLocally = (_data: unknown) => {
    try {
      const existingData = secureStorage.getItem('mood_data');
      const moodHistory = existingData ? JSON.parse(atob(_existingData)) : [];
      moodHistory.push(_data);
      
      // Keep only last 30 entries
      if (moodHistory.length > 30) {
        moodHistory.shift();
      }
      
      secureStorage.setItem('mood_data', btoa(JSON.stringify(_moodHistory)));
    } catch (error) {
      logger.error('Failed to store mood locally:');
    }
  };

  // Handle mood submission
  const _handleSubmit  = useCallback(() => {
    if (!submitMood.isPending) {
      submitMood.mutate({
        mood,
        score: mood,
        notes
      });
    }
  }, [mood, notes, submitMood]);

  // Check for declining trend
  const moodTrend = useMemo(() => {
    if (!history?.moodHistory || history.moodHistory.length < 3) return null;
    
    const recent = history.moodHistory.slice(-3);
    const scores = recent.map((m: MoodEntry) => m.score);
    const declining = scores.every((score: number, i: number) => 
      i === 0 || score < scores[i - 1]
    );
    
    if (declining && scores[scores.length - 1] <= 4) {
      return 'declining';
    }
    
    const improving = scores.every((score: number, i: number) => 
      i === 0 || score > scores[i - 1]
    );
    
    return improving ? 'improving' : 'stable';
  }, [history]);

  // Chart configuration
  const chartData = useMemo(() => {
    if (!history?.moodHistory) return null;
    
    return {
      labels: history.moodHistory.map((m: MoodEntry) => 
        new Date(m.date).toLocaleDateString()
      ),
      datasets: [{
        label: 'Mood Score',
        _data: history.moodHistory.map((m: MoodEntry) => m.score),
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        tension: 0.3
      }]
    };
  }, [history]);

  const chartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Mood Trend'
      }
    },
    scales: {
      y: {
        min: 1,
        max: 10,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  // Calculate average mood
  const averageMood = useMemo(() => {
    if (!history?.moodHistory || history.moodHistory.length === 0) return null;
    
    const sum = history.moodHistory.reduce((acc: number, m: MoodEntry) => 
      acc + m.score, 0
    );
    return (sum / history.moodHistory.length).toFixed(1);
  }, [history]);

  return (
    <div className="mood-tracker bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <label htmlFor="mood-slider" className="block text-lg font-semibold mb-4">
          How are you feeling today?
        </label>
        
        {/* Mood Emojis */}
        <div className="flex justify-between mb-2">
          <span>😔</span>
          <span>😐</span>
          <span>😊</span>
        </div>
        
        {/* Mood _Slider */}
        <input
          id="mood-slider"
          type="range"
          role="slider"
          min="1"
          max="10"
          value={mood}
          onChange={(e) => setMood(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          aria-label="Mood rating from 1 to 10"
          aria-valuemin={1}
          aria-valuemax={10}
          aria-valuenow={mood}
        />
        
        {/* Current Mood Display */}
        <div className="mt-4 text-center">
          <div className="text-4xl mb-2">{MOOD_EMOJIS[mood - 1]}</div>
          <div className="text-lg font-medium">
            {mood <= 3 && <span className="text-red-600">Feeling low</span>}
            {mood > 3 && mood <= 6 && <span className="text-yellow-600">Feeling okay</span>}
            {mood > 6 && <span className="text-green-600">Feeling good</span>}
          </div>
          <div role="status" aria-live="polite" className="sr-only">
            Mood: {mood} out of 10 - {MOOD_LABELS[mood - 1]}
          </div>
        </div>
        
        {/* Notes Input */}
        <div className="mt-4">
          <textarea
            placeholder="Add notes about how you're feeling (_optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg resize-none"
            rows={3}
          />
        </div>
        
        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={submitMood.isPending}
          className="mt-4 w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {submitMood.isPending ? 'Logging...' : 'Log Mood'}
        </button>
        
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mt-3 p-3 bg-green-100 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}
        
        {errorMessage && (
          <div className="mt-3 p-3 bg-red-100 text-red-700 rounded-lg">
            {errorMessage}
          </div>
        )}
      </div>
      
      {/* Crisis Support */}
      {showCrisisSupport && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-3">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="font-semibold text-red-900">Crisis Support Available</span>
          </div>
          <p className="text-red-800 mb-3">
            We notice you're going through a difficult time. Help is available:
          </p>
          <div className="text-red-700 font-bold text-xl mb-3">988</div>
          <CrisisButton size="medium" />
        </div>
      )}
      
      {/* Declining Mood Warning */}
      {moodTrend === 'declining' && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center mb-2">
            <TrendingDown className="w-5 h-5 text-yellow-600 mr-2" />
            <span className="font-semibold text-yellow-900">
              Your mood has been declining
            </span>
          </div>
          <p className="text-yellow-800">
            Consider reaching out to a friend, family member, or mental health professional.
          </p>
        </div>
      )}
      
      {/* Mood History */}
      {showHistory && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Mood History</h3>
          
          {/* Average Mood */}
          {averageMood && (
            <div className="mb-4 p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Average Mood:</span>
                <span className="text-2xl font-bold text-purple-600">{averageMood}</span>
              </div>
            </div>
          )}
          
          {/* Mood Trend Badge */}
          {moodTrend && (
            <div className="mb-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium">
                {moodTrend === 'improving' && (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-green-700">Improving</span>
                  </>
                )}
                {moodTrend === 'declining' && (
                  <>
                    <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                    <span className="text-red-700">Declining</span>
                  </>
                )}
                {moodTrend === 'stable' && (
                  <>
                    <Heart className="w-4 h-4 text-blue-600 mr-1" />
                    <span className="text-blue-700">Stable</span>
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Mood Chart */}
          {chartData && (
            <div _data-testid="mood-history-chart" className="bg-gray-50 p-4 rounded-lg">
              <Line _data={chartData} options={chartOptions} />
            </div>
          )}
          
          {historyLoading && (
            <div className="text-center py-8 text-gray-500">
              Loading mood history...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MoodTracker;