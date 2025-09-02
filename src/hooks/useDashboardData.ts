import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { 
  DashboardData,
  WellnessStatus,
  ScheduleItem,
  CrisisPanelData,
  QuickAction
} from '../types/dashboard';

// Mock data generator for development
const generateMockDashboardData = (userId?: string): Partial<DashboardData> => {
  const now = new Date();
  
  // Generate schedule items for today
  const scheduleItems: ScheduleItem[] = [
    {
      id: '1',
      type: 'therapy',
      title: 'Therapy Session with Dr. Smith',
      time: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0),
      duration: 60,
      location: 'Video Call',
      isVirtual: true,
      provider: 'Dr. Sarah Smith',
      status: 'upcoming',
      priority: 'high',
    },
    {
      id: '2',
      type: 'medication',
      title: 'Evening Medication',
      time: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0),
      status: 'upcoming',
      priority: 'high',
    },
    {
      id: '3',
      type: 'activity',
      title: 'Group Meditation',
      time: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0),
      duration: 30,
      location: 'Wellness Center',
      isVirtual: false,
      status: 'upcoming',
      priority: 'medium',
    },
  ];

  // Generate wellness status
  const wellnessStatus: WellnessStatus = {
    overallScore: 72,
    trend: 'improving',
    lastMoodEntry: {
      id: '1',
      userId: userId || '',
      mood: 3,
      emotions: [
        { name: 'calm', intensity: 6 },
        { name: 'hopeful', intensity: 7 },
      ],
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    activeGoals: [
      {
        id: '1',
        userId: userId || '',
        title: 'Daily Meditation Practice',
        description: 'Meditate for 10 minutes each day',
        category: 'mental',
        targetDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        progress: 65,
        milestones: [],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        userId: userId || '',
        title: 'Improve Sleep Quality',
        description: 'Get 7-8 hours of quality sleep',
        category: 'physical',
        targetDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        progress: 40,
        milestones: [],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    streaks: [
      { type: 'mood_tracking', count: 7, unit: 'days', lastActivity: now },
      { type: 'meditation', count: 3, unit: 'days', lastActivity: now },
      { type: 'journaling', count: 5, unit: 'days', lastActivity: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    ],
    riskLevel: 'low',
    recommendations: [
      'Great job on your mood tracking streak! Keep it up.',
      'Try a new meditation technique today.',
      'Consider reaching out to a friend for social connection.',
    ],
  };

  // Crisis panel data
  const crisisData: CrisisPanelData = {
    emergencyContacts: [
      {
        id: '1',
        name: 'Emergency Contact',
        relationship: 'Spouse',
        phone: '+1-555-0100',
        isAvailable: true,
        preferredContact: 'both',
      },
    ],
    hotlines: [
      {
        id: '1',
        name: '988 Suicide & Crisis Lifeline',
        type: 'hotline',
        contact: '988',
        available247: true,
        description: 'Free, confidential crisis support',
        country: 'US',
      },
      {
        id: '2',
        name: 'Crisis Text Line',
        type: 'text',
        contact: 'Text HOME to 741741',
        available247: true,
        description: 'Text-based crisis support',
        country: 'US',
      },
    ],
    currentRiskLevel: 'low',
    lastCheckIn: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
  };

  // Quick actions
  const quickActions: QuickAction[] = [
    {
      id: '1',
      label: 'Log Mood',
      icon: 'mood',
      description: 'Track how you\'re feeling',
      action: '/wellness/mood',
      color: 'bg-purple-500',
      category: 'tracking',
      keyboard: 'alt+m',
    },
    {
      id: '2',
      label: 'Meditate',
      icon: 'meditation',
      description: '5-minute guided session',
      action: '/wellness/meditation',
      color: 'bg-blue-500',
      category: 'wellness',
      keyboard: 'alt+d',
    },
    {
      id: '3',
      label: 'Journal',
      icon: 'journal',
      description: 'Write your thoughts',
      action: '/wellness/journal',
      color: 'bg-green-500',
      category: 'tracking',
      keyboard: 'alt+j',
    },
    {
      id: '4',
      label: 'Crisis Help',
      icon: 'emergency',
      description: 'Get immediate support',
      action: '/crisis',
      color: 'bg-red-500',
      category: 'crisis',
      isEmergency: true,
      keyboard: 'alt+h',
    },
  ];

  return {
    wellnessStatus,
    todaySchedule: scheduleItems,
    crisisData,
    quickActions,
  };
};

// API function to fetch dashboard data
const fetchDashboardData = async (userId: string): Promise<Partial<DashboardData>> => {
  // In production, this would be an actual API call
  // For now, we'll simulate an API delay and return mock data
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(generateMockDashboardData(userId));
    }, 500);
  });

  // Production API call example:
  // const response = await fetch(`/api/dashboard/${userId}`, {
  //   headers: {
  //     'Authorization': `Bearer ${token}`,
  //   },
  // });
  // 
  // if (!response.ok) {
  //   throw new Error('Failed to fetch dashboard data');
  // }
  // 
  // return response.json();
};

// Custom hook for dashboard data
export function useDashboardData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: () => fetchDashboardData(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    refetchOnWindowFocus: true,
    retry: 3,
  });
}

// Hook for individual widget data
export function useWidgetData(widgetType: string, widgetId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['widget', widgetType, widgetId, user?.id],
    queryFn: async () => {
      // Fetch specific widget data
      // This allows for independent widget updates
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockData = generateMockDashboardData(user?.id);
          
          switch (widgetType) {
            case 'wellness_status':
              resolve(mockData.wellnessStatus);
              break;
            case 'todays_schedule':
              resolve(mockData.todaySchedule);
              break;
            case 'crisis_panel':
              resolve(mockData.crisisData);
              break;
            default:
              resolve(null);
          }
        }, 300);
      });
    },
    enabled: !!user?.id && !!widgetType && !!widgetId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
}