import { z } from 'zod';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { secureStorage } from '../security/SecureLocalStorage';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Achievement schemas
const AchievementSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  category: z.enum(['community', 'wellness', 'support', 'consistency', 'milestone', 'special']),
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum']),
  points: z.number(),
  requirements: z.object({
    type: z.enum(['count', 'streak', 'milestone', 'special']),
    target: z.number(),
    current: z.number(),
    unit: z.string(),
  }),
  unlockedAt: z.string().nullable(),
  progress: z.number(), // 0-100
  isUnlocked: z.boolean(),
  isNew: z.boolean().default(false),
});

const UserProgressSchema = z.object({
  userId: z.string(),
  level: z.number(),
  currentExp: z.number(),
  nextLevelExp: z.number(),
  totalPoints: z.number(),
  streak: z.object({
    current: z.number(),
    longest: z.number(),
    lastActive: z.string(),
  }),
  badges: z.array(z.string()),
  rank: z.string(),
  percentile: z.number(), // User's percentile in the community
});

const LeaderboardEntrySchema = z.object({
  rank: z.number(),
  userId: z.string(),
  username: z.string(),
  avatar: z.string().optional(),
  level: z.number(),
  points: z.number(),
  achievements: z.number(),
  helpfulVotes: z.number(),
  isCurrentUser: z.boolean().default(false),
  trend: z.enum(['up', 'down', 'stable']).optional(),
});

const MilestoneSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  date: z.string(),
  type: z.enum(['personal', 'community', 'wellness', 'anniversary']),
  celebratedBy: z.array(z.string()),
  celebration: z.object({
    message: z.string(),
    reactions: z.record(z.string(), z.number()),
  }).optional(),
});

const ChallengeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.enum(['daily', 'weekly', 'monthly', 'special']),
  startDate: z.string(),
  endDate: z.string(),
  goal: z.object({
    type: z.string(),
    target: z.number(),
    current: z.number(),
    unit: z.string(),
  }),
  reward: z.object({
    points: z.number(),
    badge: z.string().optional(),
    title: z.string().optional(),
  }),
  participants: z.number(),
  isJoined: z.boolean(),
  isCompleted: z.boolean(),
  progress: z.number(), // 0-100
});

// Types
export type Achievement = z.infer<typeof AchievementSchema>;
export type UserProgress = z.infer<typeof UserProgressSchema>;
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
export type Milestone = z.infer<typeof MilestoneSchema>;
export type Challenge = z.infer<typeof ChallengeSchema>;

// Achievement definitions
const __ACHIEVEMENTS = {
  // Community Achievements
  FIRST_POST: {
    id: 'first-post',
    name: 'First Steps',
    description: 'Share your first post with the community',
    category: 'community',
    tier: 'bronze',
    points: 10,
  },
  HELPFUL_MEMBER: {
    id: 'helpful-member',
    name: 'Helpful Member',
    description: 'Receive 10 helpful votes on your posts or comments',
    category: 'community',
    tier: 'silver',
    points: 25,
  },
  COMMUNITY_PILLAR: {
    id: 'community-pillar',
    name: 'Community Pillar',
    description: 'Receive 100 helpful votes',
    category: 'community',
    tier: 'gold',
    points: 100,
  },
  
  // Support Achievements
  PEER_SUPPORTER: {
    id: 'peer-supporter',
    name: 'Peer Supporter',
    description: 'Provide support to 5 community members',
    category: 'support',
    tier: 'bronze',
    points: 20,
  },
  CRISIS_HELPER: {
    id: 'crisis-helper',
    name: 'Crisis Helper',
    description: 'Successfully assist someone in crisis',
    category: 'support',
    tier: 'platinum',
    points: 200,
  },
  GROUP_LEADER: {
    id: 'group-leader',
    name: 'Group Leader',
    description: 'Create and maintain an active support group',
    category: 'support',
    tier: 'gold',
    points: 75,
  },
  
  // Wellness Achievements
  MEDITATION_BEGINNER: {
    id: 'meditation-beginner',
    name: 'Mindful Beginner',
    description: 'Complete 7 meditation sessions',
    category: 'wellness',
    tier: 'bronze',
    points: 15,
  },
  MOOD_TRACKER: {
    id: 'mood-tracker',
    name: 'Self-Aware',
    description: 'Track your mood for 30 consecutive days',
    category: 'wellness',
    tier: 'silver',
    points: 30,
  },
  WELLNESS_WARRIOR: {
    id: 'wellness-warrior',
    name: 'Wellness Warrior',
    description: 'Complete 100 wellness activities',
    category: 'wellness',
    tier: 'gold',
    points: 80,
  },
  
  // Consistency Achievements
  WEEK_STREAK: {
    id: 'week-streak',
    name: 'Consistent',
    description: 'Visit the platform for 7 consecutive days',
    category: 'consistency',
    tier: 'bronze',
    points: 10,
  },
  MONTH_STREAK: {
    id: 'month-streak',
    name: 'Dedicated',
    description: 'Visit the platform for 30 consecutive days',
    category: 'consistency',
    tier: 'silver',
    points: 40,
  },
  YEAR_MEMBER: {
    id: 'year-member',
    name: 'Veteran',
    description: 'Be an active member for one year',
    category: 'milestone',
    tier: 'platinum',
    points: 500,
  },
};

interface KudosEntry {
  id: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  [key: string]: unknown;
}

class GamificationService {
  private apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Add auth interceptor
    this.apiClient.interceptors.request.use((config) => {
      const token = secureStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // =============== User Progress ===============

  async getUserProgress(userId?: string): Promise<UserProgress> {
    const response = await this.apiClient.get(`/gamification/progress/${userId || 'me'}`);
    return UserProgressSchema.parse(response.data);
  }

  async updateUserProgress(action: string, value?: number): Promise<{
    pointsEarned: number;
    newAchievements: Achievement[];
    levelUp?: boolean;
  }> {
    const response = await this.apiClient.post('/gamification/progress/update', {
      action,
      value,
    });
    
    // Show notifications for achievements
    if (response.data.newAchievements?.length > 0) {
      response.data.newAchievements.forEach((_achievement: Achievement) => {
        this.showAchievementNotification(_achievement);
      });
    }
    
    // Show level up notification
    if (response.data.levelUp) {
      toast.success(`Level Up! You're now level ${response.data.newLevel}!`, {
        duration: 5000,
        icon: '🎉',
      });
    }
    
    return response.data;
  }

  // =============== Achievements ===============

  async getAchievements(userId?: string): Promise<Achievement[]> {
    const response = await this.apiClient.get(`/gamification/achievements/${userId || 'me'}`);
    return response.data.map((a: unknown) => AchievementSchema.parse(a));
  }

  async getAchievementProgress(achievementId: string): Promise<Achievement> {
    const response = await this.apiClient.get(`/gamification/achievements/${achievementId}/progress`);
    return AchievementSchema.parse(response.data);
  }

  async claimAchievement(achievementId: string): Promise<void> {
    await this.apiClient.post(`/gamification/achievements/${achievementId}/claim`);
  }

  private showAchievementNotification(_achievement: Achievement) {
    const tierEmojis = {
      bronze: '🥉',
      silver: '🥈',
      gold: '🥇',
      platinum: '💎',
    };

    const emoji = achievement.icon || tierEmojis[achievement.tier] || '🏆';
    
    toast.success(
      `${emoji} Achievement Unlocked!\n${_achievement.name}\n${_achievement.description}\n+${_achievement.points} points`,
      {
        duration: 5000,
        style: {
          minWidth: '300px',
          padding: '16px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        },
      }
    );
  }

  // =============== Leaderboard ===============

  async getLeaderboard(
    type: 'points' | 'helpful' | 'streak' | 'level' = 'points',
    period: 'day' | 'week' | 'month' | 'all' = 'week',
    limit = 10
  ): Promise<LeaderboardEntry[]> {
    const response = await this.apiClient.get('/gamification/leaderboard', {
      params: { type, period, limit },
    });
    return response.data.map((_entry: unknown) => LeaderboardEntrySchema.parse(_entry));
  }

  async getUserRank(userId?: string): Promise<{
    rank: number;
    percentile: number;
    totalUsers: number;
  }> {
    const response = await this.apiClient.get(`/gamification/rank/${userId || 'me'}`);
    return response.data;
  }

  // =============== Milestones ===============

  async getMilestones(userId?: string): Promise<Milestone[]> {
    const response = await this.apiClient.get(`/gamification/milestones/${userId || 'me'}`);
    return response.data.map((m: unknown) => MilestoneSchema.parse(m));
  }

  async celebrateMilestone(milestoneId: string, message?: string): Promise<void> {
    await this.apiClient.post(`/gamification/milestones/${milestoneId}/celebrate`, {
      message,
    });
    toast.success('Milestone celebrated! 🎉');
  }

  async reactToMilestone(milestoneId: string, reaction: string): Promise<void> {
    await this.apiClient.post(`/gamification/milestones/${milestoneId}/react`, {
      reaction,
    });
  }

  // =============== Challenges ===============

  async getActiveChallenges(): Promise<Challenge[]> {
    const response = await this.apiClient.get('/gamification/challenges/active');
    return response.data.map((c: unknown) => ChallengeSchema.parse(c));
  }

  async getMyChallenges(): Promise<Challenge[]> {
    const response = await this.apiClient.get('/gamification/challenges/my');
    return response.data.map((c: unknown) => ChallengeSchema.parse(c));
  }

  async joinChallenge(challengeId: string): Promise<void> {
    await this.apiClient.post(`/gamification/challenges/${challengeId}/join`);
    toast.success('Challenge joined! Good luck! 💪');
  }

  async leaveChallenge(challengeId: string): Promise<void> {
    await this.apiClient.post(`/gamification/challenges/${challengeId}/leave`);
  }

  async updateChallengeProgress(challengeId: string, progress: number): Promise<void> {
    await this.apiClient.post(`/gamification/challenges/${challengeId}/progress`, {
      progress,
    });
  }

  // =============== Recognition & Kudos ===============

  async giveKudos(userId: string, reason: string, category?: string): Promise<void> {
    await this.apiClient.post('/gamification/kudos', {
      recipientId: userId,
      reason,
      category,
    });
    toast.success('Kudos sent! You are making someone\'s day better 💝');
  }

  async getKudosHistory(userId?: string): Promise<KudosEntry[]> {
    const response = await this.apiClient.get(`/gamification/kudos/${userId || 'me'}`);
    return response.data;
  }

  // =============== Badges & Titles ===============

  async getBadges(userId?: string): Promise<Badge[]> {
    const response = await this.apiClient.get(`/gamification/badges/${userId || 'me'}`);
    return response.data;
  }

  async selectDisplayBadge(badgeId: string): Promise<void> {
    await this.apiClient.post('/gamification/badges/display', { badgeId });
    toast.success('Display badge updated!');
  }

  async selectTitle(title: string): Promise<void> {
    await this.apiClient.post('/gamification/title', { title });
    toast.success('Title updated!');
  }

  // =============== Streaks ===============

  async getStreak(): Promise<{
    current: number;
    longest: number;
    lastActive: Date;
    willBreakIn: number; // hours
  }> {
    const response = await this.apiClient.get('/gamification/streak');
    return {
      ...response.data,
      lastActive: new Date(response.data.lastActive),
    };
  }

  async checkIn(): Promise<{
    streak: number;
    pointsEarned: number;
    bonusPoints?: number;
  }> {
    const response = await this.apiClient.post('/gamification/checkin');
    
    if (response.data.bonusPoints) {
      toast.success(`Daily check-in! Streak: ${response.data.streak} days (+${response.data.bonusPoints} bonus points!)`, {
        icon: '🔥',
      });
    } else {
      toast.success(`Daily check-in! Streak: ${response.data.streak} days`, {
        icon: '✅',
      });
    }
    
    return response.data;
  }

  // =============== Analytics ===============

  async getProgressAnalytics(period: 'week' | 'month' | 'year' = 'month'): Promise<{
    pointsOverTime: { date: string; points: number }[];
    achievementsUnlocked: number;
    averageEngagement: number;
    topCategories: { category: string; count: number }[];
  }> {
    const response = await this.apiClient.get('/gamification/analytics', {
      params: { period },
    });
    return response.data;
  }

  // =============== Helper Methods ===============

  calculateLevel(exp: number): number {
    // Progressive level system: each level requires more XP
    return Math.floor(Math.sqrt(exp / 100)) + 1;
  }

  calculateExpForLevel(level: number): number {
    return Math.pow(level - 1, 2) * 100;
  }

  getNextMilestone(currentValue: number, milestones: number[]): number | null {
    const sorted = milestones.sort((a, b) => a - b);
    return sorted.find(m => m > currentValue) || null;
  }

  getRankTitle(level: number): string {
    if (level >= 100) return 'Mental Health Champion';
    if (level >= 75) return 'Wellness Master';
    if (level >= 50) return 'Community Elder';
    if (level >= 30) return 'Support Specialist';
    if (level >= 20) return 'Peer Counselor';
    if (level >= 10) return 'Active Supporter';
    if (level >= 5) return 'Rising Member';
    return 'New Member';
  }

  getTierColor(tier: Achievement['tier']): string {
    const colors = {
      bronze: 'text-orange-600 bg-orange-100',
      silver: 'text-gray-600 bg-gray-100',
      gold: 'text-yellow-600 bg-yellow-100',
      platinum: 'text-purple-600 bg-purple-100',
    };
    return colors[tier];
  }
}

// Export singleton instance
export const __gamificationService = new GamificationService();