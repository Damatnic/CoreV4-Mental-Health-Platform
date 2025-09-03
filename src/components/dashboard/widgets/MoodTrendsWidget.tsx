import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MoodEntry {
  id: string;
  timestamp: Date;
  moodScore: number;
  emotions: string[];
}

interface MoodTrendsWidgetProps {
  moodData?: MoodEntry[];
  error?: string;
}

export function MoodTrendsWidget({ moodData, error }: MoodTrendsWidgetProps) {
  const navigate = useNavigate();

  const chartData = useMemo(() => {
    if (!moodData || moodData.length === 0) return null;

    // Get last 7 days of data
    const last7Days = moodData
      .filter(entry => {
        const entryDate = new Date(entry.timestamp);
        const daysAgo = (Date.now() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo <= 7;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const labels = last7Days.map(entry => {
      const date = new Date(entry.timestamp);
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    });

    const scores = last7Days.map(entry => entry.moodScore);

    return {
      labels,
      datasets: [
        {
          label: 'Mood Score',
          data: scores,
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgb(99, 102, 241)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }
      ]
    };
  }, [moodData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: unknown) => `Mood: ${context.parsed.y}/5`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 1
        }
      },
      x: {
        display: false
      }
    }
  };

  const calculateTrend = () => {
    if (!moodData || moodData.length < 2) return 'stable';
    
    const recent = moodData.slice(-7);
    const older = moodData.slice(-14, -7);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, entry) => sum + entry.moodScore, 0) / recent.length;
    const olderAvg = older.reduce((sum, entry) => sum + entry.moodScore, 0) / older.length;
    
    if (recentAvg > olderAvg + 0.5) return 'improving';
    if (recentAvg < olderAvg - 0.5) return 'declining';
    return 'stable';
  };

  const getCommonEmotions = () => {
    if (!moodData || moodData.length === 0) return [];
    
    const emotionCounts: Record<string, number> = {};
    moodData.slice(-7).forEach(entry => {
      if (entry.emotions && Array.isArray(entry.emotions)) {
        entry.emotions.forEach(emotion => {
          emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        });
      }
    });
    
    return Object.entries(_emotionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([emotion]) => emotion);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!moodData || moodData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8">
        <Activity className="h-12 w-12 text-gray-300 mb-3" />
        <p className="text-gray-500 text-center">No mood data available</p>
        <button
          onClick={() => navigate('/wellness/mood')}
          className="mt-3 text-sm text-primary-600 hover:text-primary-700"
        >
          Log your first mood
        </button>
      </div>
    );
  }

  const trend = calculateTrend();
  const commonEmotions = getCommonEmotions();
  const latestMood = moodData && moodData.length > 0 ? moodData[moodData.length - 1] : null;

  return (
    <div className="space-y-3">
      {/* Trend Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {trend === 'improving' && <TrendingUp className="h-5 w-5 text-green-500" />}
          {trend === 'declining' && <TrendingDown className="h-5 w-5 text-red-500" />}
          {trend === 'stable' && <Activity className="h-5 w-5 text-gray-500" />}
          <span className="text-sm font-medium text-gray-700">
            Mood is {trend}
          </span>
        </div>
        <button
          onClick={() => navigate('/wellness/mood')}
          className="text-xs text-primary-600 hover:text-primary-700"
        >
          Log Mood
        </button>
      </div>

      {/* Chart */}
      {chartData && (
        <div className="h-32">
          <Line data={chartData} options={chartOptions} />
        </div>
      )}

      {/* Latest Entry */}
      {latestMood && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Latest Entry</span>
            <span className="text-xs text-gray-500">
              {new Date(latestMood.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`w-1.5 h-6 mx-0.5 rounded-full transition-colors ${
                    level <= latestMood.moodScore
                      ? 'bg-primary-500'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-700">
              Score: {latestMood.moodScore}/5
            </span>
          </div>
        </div>
      )}

      {/* Common Emotions */}
      {commonEmotions.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Common emotions this week:</p>
          <div className="flex flex-wrap gap-1">
            {commonEmotions.map((emotion) => (
              <span
                key={emotion}
                className="px-2 py-1 bg-primary-100 text-primary-700 rounded-md text-xs"
              >
                {emotion}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* View Details Link */}
      <button
        onClick={() => navigate('/wellness/mood/history')}
        className="w-full text-center py-2 text-sm text-primary-600 hover:text-primary-700"
      >
        View Detailed History
      </button>
    </div>
  );
}