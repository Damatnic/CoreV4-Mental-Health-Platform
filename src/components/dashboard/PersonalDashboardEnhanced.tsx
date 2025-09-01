import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Heart, 
  BookOpen, 
  Activity, 
  Settings,
  Grid3x3,
  RefreshCw,
  Bell
} from 'lucide-react';
import { DashboardWidget } from './DashboardWidget';
import { CrisisPanel } from './widgets/CrisisPanel';
import { 
  MoodAnalytics,
  WellnessMetricsDashboard,
  AdvancedJournal,
  MeditationMindfulness
} from './widgets/wellness';
import { useWellnessStore } from '../../stores/wellnessStore';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';

/**
 * Enhanced Personal Dashboard with comprehensive wellness tracking widgets
 * This component demonstrates how to integrate all the new wellness widgets
 */
export function PersonalDashboardEnhanced() {
  const { user } = useAuth();
  const { data: dashboardData, isLoading, refetch } = useDashboardData();
  const { moodEntries, wellnessMetrics, calculateWellnessScores } = useWellnessStore();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'mood' | 'wellness' | 'journal' | 'meditation'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  // Handle global refresh
  const handleGlobalRefresh = async () => {
    setRefreshing(true);
    await refetch();
    calculateWellnessScores();
    setRefreshing(false);
  };

  // Get greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.name?.split(' ')[0] || 'there';
    
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 17) return `Good afternoon, ${name}`;
    if (hour < 21) return `Good evening, ${name}`;
    return `Good night, ${name}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Dashboard Header */}
      <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-gray-900">
                {getGreeting()}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Your comprehensive wellness dashboard
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <button 
                onClick={handleGlobalRefresh}
                disabled={refreshing}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Refresh"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <button 
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mt-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Grid3x3 className="inline h-4 w-4 mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('mood')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'mood'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Brain className="inline h-4 w-4 mr-2" />
              Mood Analytics
            </button>
            <button
              onClick={() => setActiveTab('wellness')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'wellness'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Activity className="inline h-4 w-4 mr-2" />
              Wellness Metrics
            </button>
            <button
              onClick={() => setActiveTab('journal')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'journal'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BookOpen className="inline h-4 w-4 mr-2" />
              Journal
            </button>
            <button
              onClick={() => setActiveTab('meditation')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'meditation'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Heart className="inline h-4 w-4 mr-2" />
              Meditation
            </button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {/* Crisis Panel - Always visible */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-1"
            >
              <DashboardWidget
                widget={{
                  id: 'crisis-panel',
                  type: 'crisis_panel',
                  title: 'Crisis Support',
                  position: { x: 0, y: 0 },
                  size: { width: 3, height: 2 },
                  priority: 'critical'
                }}
                loading={isLoading}
              >
                <CrisisPanel data={dashboardData?.crisisData} />
              </DashboardWidget>
            </motion.div>

            {/* Wellness Metrics Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2"
            >
              <DashboardWidget
                widget={{
                  id: 'wellness-metrics',
                  type: 'wellness_status',
                  title: 'Wellness Metrics',
                  position: { x: 3, y: 0 },
                  size: { width: 6, height: 2 },
                  priority: 'high'
                }}
                loading={isLoading}
              >
                <WellnessMetricsDashboard />
              </DashboardWidget>
            </motion.div>

            {/* Mood Analytics Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-1"
            >
              <DashboardWidget
                widget={{
                  id: 'mood-analytics',
                  type: 'mood_tracker',
                  title: 'Mood Trends',
                  position: { x: 0, y: 2 },
                  size: { width: 3, height: 2 },
                  priority: 'high'
                }}
                loading={isLoading}
              >
                <MoodAnalytics timeRange="week" />
              </DashboardWidget>
            </motion.div>

            {/* Journal Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-1"
            >
              <DashboardWidget
                widget={{
                  id: 'journal',
                  type: 'journal_prompt',
                  title: 'Recent Journal',
                  position: { x: 3, y: 2 },
                  size: { width: 3, height: 2 },
                  priority: 'medium'
                }}
                loading={isLoading}
              >
                <AdvancedJournal entries={[]} />
              </DashboardWidget>
            </motion.div>

            {/* Meditation Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-1"
            >
              <DashboardWidget
                widget={{
                  id: 'meditation',
                  type: 'quick_actions',
                  title: 'Meditation & Mindfulness',
                  position: { x: 6, y: 2 },
                  size: { width: 3, height: 2 },
                  priority: 'medium'
                }}
                loading={isLoading}
              >
                <MeditationMindfulness />
              </DashboardWidget>
            </motion.div>
          </div>
        )}

        {/* Full-screen views for each tab */}
        {activeTab === 'mood' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold mb-4">Mood Analytics</h2>
            <MoodAnalytics 
              timeRange="month"
              onExport={(data) => console.log('Export mood data:', data)}
              onTriggerIdentified={(trigger) => console.log('Trigger identified:', trigger)}
            />
          </motion.div>
        )}

        {activeTab === 'wellness' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold mb-4">Wellness Metrics Dashboard</h2>
            <WellnessMetricsDashboard 
              onSetGoal={(category) => console.log('Set goal for:', category)}
              onViewDetails={(metric) => console.log('View details for:', metric)}
            />
          </motion.div>
        )}

        {activeTab === 'journal' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold mb-4">Advanced Journal</h2>
            <AdvancedJournal 
              entries={[]}
              onNewEntry={() => console.log('New journal entry')}
              onEditEntry={(id) => console.log('Edit entry:', id)}
              onExport={(entries) => console.log('Export entries:', entries)}
            />
          </motion.div>
        )}

        {activeTab === 'meditation' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold mb-4">Meditation & Mindfulness</h2>
            <MeditationMindfulness 
              sessions={[]}
              onStartSession={(type) => console.log('Start session:', type)}
              onViewHistory={() => console.log('View meditation history')}
              onSetGoal={() => console.log('Set meditation goal')}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}