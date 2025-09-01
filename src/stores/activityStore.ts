import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types and interfaces for activity tracking
export interface Activity {
  id: string;
  title: string;
  description?: string;
  category: 'therapy' | 'wellness' | 'social' | 'professional' | 'personal' | 'self-care';
  type: 'task' | 'appointment' | 'exercise' | 'medication' | 'practice' | 'goal';
  scheduledTime?: Date;
  duration?: number; // in minutes
  energyLevel?: 'low' | 'medium' | 'high'; // Required energy level
  moodImpact?: number; // Expected mood impact (-5 to +5)
  completed: boolean;
  completedAt?: Date;
  actualMoodImpact?: number; // Actual mood impact after completion
  notes?: string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[]; // 0-6 for Sunday-Saturday
    endDate?: Date;
  };
  tags?: string[];
  linkedGoalId?: string;
  therapyHomework?: boolean;
  flexibility?: 'fixed' | 'flexible' | 'optional'; // For bad mental health days
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: 'therapy' | 'wellness' | 'social' | 'professional' | 'personal';
  type: 'short-term' | 'long-term' | 'milestone';
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: Date;
  targetDate?: Date;
  completedDate?: Date;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  priority: 'low' | 'medium' | 'high';
  milestones: Milestone[];
  linkedActivities?: string[];
  measurable: boolean;
  specific: boolean;
  achievable: boolean;
  relevant: boolean;
  timeBound: boolean;
  progress: number; // Percentage
  insights?: string[];
  celebrations?: string[];
}

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  targetValue: number;
  completed: boolean;
  completedDate?: Date;
  celebration?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  takenToday: boolean;
  nextDose?: Date;
  refillDate?: Date;
  adherenceRate: number;
  startDate?: Date;
  endDate?: Date;
  prescribedBy?: string;
  purpose?: string;
  sideEffects?: string[];
  lastTaken?: Date;
  remindersEnabled?: boolean;
  notes?: string;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  category: 'physical' | 'mental' | 'emotional' | 'social' | 'spiritual';
  icon?: string;
  targetFrequency: 'daily' | 'weekly' | 'monthly';
  targetCount: number; // times per frequency period
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  lastCompleted?: Date;
  startDate: Date;
  isActive: boolean;
  flexibleTracking: boolean; // Allow missed days without breaking streak
  recoveryDays: number; // Grace period for streak recovery
  correlatedMoodImprovement?: number;
  stackedWith?: string[]; // Other habit IDs for habit stacking
  reminders?: {
    enabled: boolean;
    times: string[];
    message?: string;
  };
}

export interface TherapyProgress {
  id: string;
  sessionDate: Date;
  therapistName?: string;
  sessionType: 'individual' | 'group' | 'psychiatry' | 'assessment';
  topics: string[];
  homework: {
    id: string;
    title: string;
    description: string;
    dueDate?: Date;
    completed: boolean;
    completedDate?: Date;
    skillType?: 'CBT' | 'DBT' | 'mindfulness' | 'other';
  }[];
  skillsPracticed: {
    name: string;
    type: 'CBT' | 'DBT' | 'mindfulness' | 'other';
    effectiveness: number; // 1-10 scale
    notes?: string;
  }[];
  mood: {
    before: number; // 1-10
    after: number; // 1-10
  };
  insights: string[];
  nextSession?: Date;
  progressScore?: number;
  notes?: string;
  medicationChanges?: {
    medication: string;
    change: 'started' | 'stopped' | 'increased' | 'decreased';
    dosage?: string;
  }[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'wellness' | 'therapy' | 'social' | 'streak' | 'milestone' | 'recovery';
  icon: string;
  unlockedDate?: Date;
  requirements: {
    type: 'streak' | 'count' | 'goal' | 'special';
    target: number;
    current: number;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  shared: boolean;
  celebrationType?: 'confetti' | 'badge' | 'animation' | 'message';
}

export interface ActivityAnalytics {
  activityId: string;
  completionRate: number;
  averageMoodImpact: number;
  bestTimeOfDay?: string;
  energyEfficiency: number; // Impact per energy unit
  correlatedActivities: string[];
  effectiveness: number; // 0-100 score
  recommendations: string[];
}

interface ActivityStore {
  // State
  activities: Activity[];
  goals: Goal[];
  habits: Habit[];
  medications: Medication[];
  therapyProgress: TherapyProgress[];
  achievements: Achievement[];
  analytics: ActivityAnalytics[];
  dailySchedule: Activity[];
  activityHistory: Activity[];
  
  // Activity management
  addActivity: (activity: Omit<Activity, 'id'>) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  completeActivity: (id: string, moodImpact?: number, notes?: string) => void;
  rescheduleActivity: (id: string, newTime: Date) => void;
  
  // Goal management
  addGoal: (goal: Omit<Goal, 'id' | 'progress'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  updateGoalProgress: (id: string, newValue: number) => void;
  completeGoal: (id: string) => void;
  pauseGoal: (id: string) => void;
  abandonGoal: (id: string, reason?: string) => void;
  addMilestone: (goalId: string, milestone: Omit<Milestone, 'id' | 'goalId'>) => void;
  completeMilestone: (goalId: string, milestoneId: string) => void;
  
  // Habit tracking
  addHabit: (habit: Omit<Habit, 'id' | 'currentStreak' | 'longestStreak' | 'totalCompletions'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  completeHabit: (id: string) => void;
  resetHabitStreak: (id: string) => void;
  pauseHabit: (id: string) => void;
  stackHabits: (habitIds: string[]) => void;
  
  // Therapy progress
  addTherapySession: (session: Omit<TherapyProgress, 'id'>) => void;
  updateTherapyProgress: (id: string, updates: Partial<TherapyProgress>) => void;
  completeHomework: (sessionId: string, homeworkId: string, notes?: string) => void;
  addSkillPractice: (skill: { name: string; type: string; effectiveness: number; notes?: string }) => void;
  
  // Achievement system
  checkAchievements: () => void;
  unlockAchievement: (id: string) => void;
  shareAchievement: (id: string) => void;
  
  // Analytics and insights
  analyzeActivityEffectiveness: (activityId: string) => ActivityAnalytics;
  getActivityRecommendations: (energyLevel: 'low' | 'medium' | 'high', mood: number) => Activity[];
  getOptimalSchedule: (date: Date) => Activity[];
  correlateActivitiesWithMood: () => { activity: string; correlation: number }[];
  
  // Smart scheduling
  suggestReschedule: (energyLevel: 'low' | 'medium' | 'high') => Activity[];
  adaptScheduleForBadDay: () => void;
  generateDailySchedule: (date: Date) => void;
  
  // Data management
  exportProgressReport: () => string;
  importData: (data: string) => void;
  clearAllData: () => void;
}

// Create the store with persistence
export const useActivityStore = create<ActivityStore>()(
  persist(
    (set, get) => ({
      // Initialize state
      activities: [],
      goals: [],
      habits: [],
      therapyProgress: [],
      achievements: [],
      analytics: [],
      dailySchedule: [],
      activityHistory: [],
      
      // Activity management
      addActivity: (activity) => {
        const newActivity: Activity = {
          ...activity,
          id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        set((state) => ({
          activities: [...state.activities, newActivity],
        }));
      },
      
      updateActivity: (id, updates) => {
        set((state) => ({
          activities: state.activities.map((activity) =>
            activity.id === id ? { ...activity, ...updates } : activity
          ),
        }));
      },
      
      deleteActivity: (id) => {
        set((state) => ({
          activities: state.activities.filter((activity) => activity.id !== id),
        }));
      },
      
      completeActivity: (id, moodImpact, notes) => {
        const now = new Date();
        set((state) => {
          const updatedActivities = state.activities.map((activity) =>
            activity.id === id
              ? {
                  ...activity,
                  completed: true,
                  completedAt: now,
                  actualMoodImpact: moodImpact,
                  notes: notes || activity.notes,
                }
              : activity
          );
          
          // Move to history
          const completedActivity = updatedActivities.find(a => a.id === id);
          const newHistory = completedActivity 
            ? [...state.activityHistory, completedActivity]
            : state.activityHistory;
          
          return {
            activities: updatedActivities,
            activityHistory: newHistory,
          };
        });
        
        // Check for achievements after completion
        get().checkAchievements();
      },
      
      rescheduleActivity: (id, newTime) => {
        set((state) => ({
          activities: state.activities.map((activity) =>
            activity.id === id ? { ...activity, scheduledTime: newTime } : activity
          ),
        }));
      },
      
      // Goal management
      addGoal: (goal) => {
        const newGoal: Goal = {
          ...goal,
          id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          progress: 0,
        };
        set((state) => ({
          goals: [...state.goals, newGoal],
        }));
      },
      
      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === id ? { ...goal, ...updates } : goal
          ),
        }));
      },
      
      updateGoalProgress: (id, newValue) => {
        set((state) => ({
          goals: state.goals.map((goal) => {
            if (goal.id === id) {
              const progress = Math.min((newValue / goal.targetValue) * 100, 100);
              return {
                ...goal,
                currentValue: newValue,
                progress,
                status: progress >= 100 ? 'completed' : goal.status,
                completedDate: progress >= 100 ? new Date() : undefined,
              };
            }
            return goal;
          }),
        }));
        
        get().checkAchievements();
      },
      
      completeGoal: (id) => {
        const now = new Date();
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === id
              ? {
                  ...goal,
                  status: 'completed',
                  completedDate: now,
                  progress: 100,
                  celebrations: [...(goal.celebrations || []), 'Goal completed! Amazing achievement!'],
                }
              : goal
          ),
        }));
        
        get().checkAchievements();
      },
      
      pauseGoal: (id) => {
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === id ? { ...goal, status: 'paused' } : goal
          ),
        }));
      },
      
      abandonGoal: (id, reason) => {
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === id
              ? {
                  ...goal,
                  status: 'abandoned',
                  insights: [...(goal.insights || []), reason || 'Goal no longer relevant'],
                }
              : goal
          ),
        }));
      },
      
      addMilestone: (goalId, milestone) => {
        const newMilestone: Milestone = {
          ...milestone,
          id: `milestone-${Date.now()}`,
          goalId,
        };
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === goalId
              ? { ...goal, milestones: [...goal.milestones, newMilestone] }
              : goal
          ),
        }));
      },
      
      completeMilestone: (goalId, milestoneId) => {
        const now = new Date();
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === goalId
              ? {
                  ...goal,
                  milestones: goal.milestones.map((m) =>
                    m.id === milestoneId
                      ? { ...m, completed: true, completedDate: now }
                      : m
                  ),
                }
              : goal
          ),
        }));
        
        get().checkAchievements();
      },
      
      // Habit tracking
      addHabit: (habit) => {
        const newHabit: Habit = {
          ...habit,
          id: `habit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          currentStreak: 0,
          longestStreak: 0,
          totalCompletions: 0,
        };
        set((state) => ({
          habits: [...state.habits, newHabit],
        }));
      },
      
      updateHabit: (id, updates) => {
        set((state) => ({
          habits: state.habits.map((habit) =>
            habit.id === id ? { ...habit, ...updates } : habit
          ),
        }));
      },
      
      completeHabit: (id) => {
        const now = new Date();
        set((state) => ({
          habits: state.habits.map((habit) => {
            if (habit.id === id) {
              const lastDate = habit.lastCompleted ? new Date(habit.lastCompleted) : null;
              const daysSince = lastDate
                ? Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
                : null;
              
              // Check if streak continues (within recovery days)
              const streakContinues = !daysSince || daysSince <= (habit.recoveryDays + 1);
              const newStreak = streakContinues ? habit.currentStreak + 1 : 1;
              
              return {
                ...habit,
                currentStreak: newStreak,
                longestStreak: Math.max(newStreak, habit.longestStreak),
                totalCompletions: habit.totalCompletions + 1,
                lastCompleted: now,
              };
            }
            return habit;
          }),
        }));
        
        get().checkAchievements();
      },
      
      resetHabitStreak: (id) => {
        set((state) => ({
          habits: state.habits.map((habit) =>
            habit.id === id ? { ...habit, currentStreak: 0 } : habit
          ),
        }));
      },
      
      pauseHabit: (id) => {
        set((state) => ({
          habits: state.habits.map((habit) =>
            habit.id === id ? { ...habit, isActive: false } : habit
          ),
        }));
      },
      
      stackHabits: (habitIds) => {
        set((state) => ({
          habits: state.habits.map((habit) =>
            habitIds.includes(habit.id)
              ? { ...habit, stackedWith: habitIds.filter(id => id !== habit.id) }
              : habit
          ),
        }));
      },
      
      // Therapy progress
      addTherapySession: (session) => {
        const newSession: TherapyProgress = {
          ...session,
          id: `therapy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        set((state) => ({
          therapyProgress: [...state.therapyProgress, newSession],
        }));
      },
      
      updateTherapyProgress: (id, updates) => {
        set((state) => ({
          therapyProgress: state.therapyProgress.map((session) =>
            session.id === id ? { ...session, ...updates } : session
          ),
        }));
      },
      
      completeHomework: (sessionId, homeworkId, notes) => {
        const now = new Date();
        set((state) => ({
          therapyProgress: state.therapyProgress.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  homework: session.homework.map((hw) =>
                    hw.id === homeworkId
                      ? { ...hw, completed: true, completedDate: now }
                      : hw
                  ),
                }
              : session
          ),
        }));
        
        get().checkAchievements();
      },
      
      addSkillPractice: (skill) => {
        // This would add to the most recent therapy session or create a practice log
        set((state) => {
          const recentSession = state.therapyProgress
            .sort((a, b) => b.sessionDate.getTime() - a.sessionDate.getTime())[0];
          
          if (recentSession) {
            return {
              therapyProgress: state.therapyProgress.map((session) =>
                session.id === recentSession.id
                  ? {
                      ...session,
                      skillsPracticed: [...session.skillsPracticed, skill],
                    }
                  : session
              ),
            };
          }
          return state;
        });
      },
      
      // Achievement system
      checkAchievements: () => {
        const state = get();
        const potentialAchievements: Achievement[] = [];
        
        // Check streak achievements
        state.habits.forEach(habit => {
          if (habit.currentStreak >= 7 && !state.achievements.find(a => a.id === `streak-7-${habit.id}`)) {
            potentialAchievements.push({
              id: `streak-7-${habit.id}`,
              title: `Week Warrior: ${habit.name}`,
              description: `Maintained ${habit.name} for 7 days straight!`,
              category: 'streak',
              icon: '🔥',
              requirements: { type: 'streak', target: 7, current: habit.currentStreak },
              rarity: 'common',
              points: 50,
              shared: false,
            });
          }
          
          if (habit.currentStreak >= 30 && !state.achievements.find(a => a.id === `streak-30-${habit.id}`)) {
            potentialAchievements.push({
              id: `streak-30-${habit.id}`,
              title: `Monthly Master: ${habit.name}`,
              description: `Incredible! 30 days of ${habit.name}!`,
              category: 'streak',
              icon: '🏆',
              requirements: { type: 'streak', target: 30, current: habit.currentStreak },
              rarity: 'rare',
              points: 200,
              shared: false,
              celebrationType: 'confetti',
            });
          }
        });
        
        // Check goal achievements
        const completedGoals = state.goals.filter(g => g.status === 'completed');
        if (completedGoals.length >= 5 && !state.achievements.find(a => a.id === 'goals-5')) {
          potentialAchievements.push({
            id: 'goals-5',
            title: 'Goal Getter',
            description: 'Completed 5 wellness goals!',
            category: 'milestone',
            icon: '🎯',
            requirements: { type: 'count', target: 5, current: completedGoals.length },
            rarity: 'rare',
            points: 150,
            shared: false,
          });
        }
        
        // Unlock new achievements
        potentialAchievements.forEach(achievement => {
          get().unlockAchievement(achievement.id);
          set((state) => ({
            achievements: [...state.achievements, { ...achievement, unlockedDate: new Date() }],
          }));
        });
      },
      
      unlockAchievement: (id) => {
        const now = new Date();
        set((state) => ({
          achievements: state.achievements.map((achievement) =>
            achievement.id === id && !achievement.unlockedDate
              ? { ...achievement, unlockedDate: now }
              : achievement
          ),
        }));
      },
      
      shareAchievement: (id) => {
        set((state) => ({
          achievements: state.achievements.map((achievement) =>
            achievement.id === id ? { ...achievement, shared: true } : achievement
          ),
        }));
      },
      
      // Analytics and insights
      analyzeActivityEffectiveness: (activityId) => {
        const state = get();
        const activityHistory = state.activityHistory.filter(a => a.id === activityId);
        
        if (activityHistory.length === 0) {
          return {
            activityId,
            completionRate: 0,
            averageMoodImpact: 0,
            energyEfficiency: 0,
            correlatedActivities: [],
            effectiveness: 0,
            recommendations: ['Not enough data to analyze'],
          };
        }
        
        const completionRate = (activityHistory.filter(a => a.completed).length / activityHistory.length) * 100;
        const moodImpacts = activityHistory
          .filter(a => a.actualMoodImpact !== undefined)
          .map(a => a.actualMoodImpact!);
        const averageMoodImpact = moodImpacts.length > 0
          ? moodImpacts.reduce((sum, impact) => sum + impact, 0) / moodImpacts.length
          : 0;
        
        const analytics: ActivityAnalytics = {
          activityId,
          completionRate,
          averageMoodImpact,
          energyEfficiency: averageMoodImpact / 3, // Simplified calculation
          correlatedActivities: [],
          effectiveness: (completionRate * 0.5 + averageMoodImpact * 10),
          recommendations: [],
        };
        
        // Add recommendations based on analysis
        if (completionRate < 50) {
          analytics.recommendations.push('Consider scheduling this activity at a different time');
        }
        if (averageMoodImpact > 3) {
          analytics.recommendations.push('This activity significantly improves your mood - prioritize it!');
        }
        
        return analytics;
      },
      
      getActivityRecommendations: (energyLevel, mood) => {
        const state = get();
        const recommendations: Activity[] = [];
        
        // Filter activities based on energy level and expected mood impact
        state.activities.forEach(activity => {
          if (!activity.completed && activity.energyLevel === energyLevel) {
            recommendations.push(activity);
          }
        });
        
        // Sort by expected mood impact
        recommendations.sort((a, b) => (b.moodImpact || 0) - (a.moodImpact || 0));
        
        return recommendations.slice(0, 5);
      },
      
      getOptimalSchedule: (date) => {
        const state = get();
        const dayActivities = state.activities.filter(a => {
          if (!a.scheduledTime) return false;
          const activityDate = new Date(a.scheduledTime);
          return activityDate.toDateString() === date.toDateString();
        });
        
        // Sort by scheduled time
        dayActivities.sort((a, b) => {
          if (!a.scheduledTime || !b.scheduledTime) return 0;
          return a.scheduledTime.getTime() - b.scheduledTime.getTime();
        });
        
        return dayActivities;
      },
      
      correlateActivitiesWithMood: () => {
        const state = get();
        const correlations: { activity: string; correlation: number }[] = [];
        
        // Group activities by type and calculate mood correlation
        const activityGroups = new Map<string, number[]>();
        
        state.activityHistory.forEach(activity => {
          if (activity.actualMoodImpact !== undefined) {
            const impacts = activityGroups.get(activity.title) || [];
            impacts.push(activity.actualMoodImpact);
            activityGroups.set(activity.title, impacts);
          }
        });
        
        activityGroups.forEach((impacts, activityName) => {
          const avgImpact = impacts.reduce((sum, i) => sum + i, 0) / impacts.length;
          correlations.push({ activity: activityName, correlation: avgImpact });
        });
        
        // Sort by correlation strength
        correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
        
        return correlations;
      },
      
      // Smart scheduling
      suggestReschedule: (energyLevel) => {
        const state = get();
        const today = new Date();
        const suggestions: Activity[] = [];
        
        // Find activities that don't match current energy level
        state.activities.forEach(activity => {
          if (!activity.completed && activity.scheduledTime) {
            const isToday = new Date(activity.scheduledTime).toDateString() === today.toDateString();
            if (isToday && activity.energyLevel !== energyLevel && activity.flexibility !== 'fixed') {
              suggestions.push(activity);
            }
          }
        });
        
        return suggestions;
      },
      
      adaptScheduleForBadDay: () => {
        const state = get();
        const today = new Date();
        
        // Mark optional activities as postponed
        set((state) => ({
          activities: state.activities.map(activity => {
            if (activity.scheduledTime) {
              const isToday = new Date(activity.scheduledTime).toDateString() === today.toDateString();
              if (isToday && activity.flexibility === 'optional' && !activity.completed) {
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                return { ...activity, scheduledTime: tomorrow };
              }
            }
            return activity;
          }),
        }));
      },
      
      generateDailySchedule: (date) => {
        const state = get();
        const schedule: Activity[] = [];
        
        // Get recurring activities for this day
        state.activities.forEach(activity => {
          if (activity.recurring) {
            const dayOfWeek = date.getDay();
            if (activity.recurring.daysOfWeek?.includes(dayOfWeek)) {
              schedule.push({
                ...activity,
                scheduledTime: date,
                id: `${activity.id}-${date.toISOString()}`,
              });
            }
          }
        });
        
        // Add therapy homework if due
        state.therapyProgress.forEach(session => {
          session.homework.forEach(hw => {
            if (!hw.completed && hw.dueDate) {
              const dueDate = new Date(hw.dueDate);
              if (dueDate.toDateString() === date.toDateString()) {
                schedule.push({
                  id: `homework-${hw.id}`,
                  title: hw.title,
                  description: hw.description,
                  category: 'therapy',
                  type: 'practice',
                  scheduledTime: date,
                  completed: false,
                  therapyHomework: true,
                  flexibility: 'flexible',
                });
              }
            }
          });
        });
        
        set({ dailySchedule: schedule });
      },
      
      // Data management
      exportProgressReport: () => {
        const state = get();
        const report = {
          exportDate: new Date().toISOString(),
          activities: state.activities,
          goals: state.goals,
          habits: state.habits,
          therapyProgress: state.therapyProgress,
          achievements: state.achievements,
          analytics: state.analytics,
        };
        return JSON.stringify(report, null, 2);
      },
      
      importData: (data) => {
        try {
          const parsed = JSON.parse(data);
          set({
            activities: parsed.activities || [],
            goals: parsed.goals || [],
            habits: parsed.habits || [],
            therapyProgress: parsed.therapyProgress || [],
            achievements: parsed.achievements || [],
            analytics: parsed.analytics || [],
          });
        } catch (error) {
          console.error('Failed to import data:', error);
        }
      },
      
      clearAllData: () => {
        set({
          activities: [],
          goals: [],
          habits: [],
          therapyProgress: [],
          achievements: [],
          analytics: [],
          dailySchedule: [],
          activityHistory: [],
        });
      },
    }),
    {
      name: 'activity-store',
      partialize: (state) => ({
        activities: state.activities,
        goals: state.goals,
        habits: state.habits,
        therapyProgress: state.therapyProgress,
        achievements: state.achievements,
        activityHistory: state.activityHistory,
      }),
    }
  )
);