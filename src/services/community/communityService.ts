import axios from 'axios';
import { z } from 'zod';
import { secureStorage } from '../security/SecureLocalStorage';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Validation schemas
const PostSchema = z.object({
  id: z.string(),
  userId: z.string(),
  username: z.string(),
  userAvatar: z.string().optional(),
  groupId: z.string().optional(),
  title: z.string().min(1).max(200),
  _content: z.string().min(1).max(5000),
  tags: z.array(z.string()),
  triggerWarning: z.boolean().default(false),
  triggerWarningType: z.array(z.string()).optional(),
  visibility: z.enum(['public', 'group', 'private']).default('public'),
  likes: z.number().default(0),
  comments: z.number().default(0),
  shares: z.number().default(0),
  isLiked: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
  metadata: z.object({
    mood: z.string().optional(),
    helpfulVotes: z.number().default(0),
    reportCount: z.number().default(0),
  }).optional(),
});

const CommentSchema = z.object({
  id: z.string(),
  postId: z.string(),
  userId: z.string(),
  username: z.string(),
  userAvatar: z.string().optional(),
  _content: z.string().min(1).max(1000),
  parentId: z.string().optional(),
  likes: z.number().default(0),
  isLiked: z.boolean().default(false),
  isHelpful: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const SupportGroupSchema = z.object({
  id: z.string(),
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  category: z.enum(['anxiety', 'depression', 'trauma', 'addiction', 'grief', 'relationships', 'self-esteem', 'other']),
  coverImage: z.string().optional(),
  icon: z.string().optional(),
  memberCount: z.number().default(0),
  postCount: z.number().default(0),
  isPrivate: z.boolean().default(false),
  requiresApproval: z.boolean().default(false),
  guidelines: z.array(z.string()).optional(),
  moderators: z.array(z.string()),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  userRole: z.enum(['member', 'moderator', 'admin', 'none']).optional(),
  isMember: z.boolean().default(false),
  settings: z.object({
    allowAnonymous: z.boolean().default(true),
    autoModeration: z.boolean().default(true),
    crisisSupport: z.boolean().default(true),
    peerSupport: z.boolean().default(true),
  }).optional(),
});

const EventSchema = z.object({
  id: z.string(),
  groupId: z.string().optional(),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  type: z.enum(['workshop', 'support-session', 'meditation', 'group-therapy', 'webinar', 'social']),
  startTime: z.string(),
  endTime: z.string(),
  timezone: z.string(),
  isOnline: z.boolean(),
  location: z.string().optional(),
  meetingLink: z.string().optional(),
  maxAttendees: z.number().optional(),
  currentAttendees: z.number().default(0),
  host: z.object({
    id: z.string(),
    name: z.string(),
    credentials: z.string().optional(),
  }),
  isRegistered: z.boolean().default(false),
  tags: z.array(z.string()),
  createdAt: z.string(),
});

// Types
export type Post = z.infer<typeof PostSchema>;
export type Comment = z.infer<typeof CommentSchema>;
export type SupportGroup = z.infer<typeof SupportGroupSchema>;
export type Event = z.infer<typeof EventSchema>;

export interface CreatePostDto {
  title: string;
  _content: string;
  groupId?: string;
  tags: string[];
  triggerWarning: boolean;
  triggerWarningType?: string[];
  visibility: 'public' | 'group' | 'private';
  mood?: string;
}

export interface CreateCommentDto {
  _content: string;
  parentId?: string;
}

export interface CreateGroupDto {
  name: string;
  description: string;
  category: SupportGroup['category'];
  isPrivate: boolean;
  requiresApproval: boolean;
  guidelines?: string[];
  settings?: SupportGroup['settings'];
}

export interface CreateEventDto {
  title: string;
  description: string;
  type: Event['type'];
  startTime: Date;
  endTime: Date;
  timezone: string;
  isOnline: boolean;
  location?: string;
  meetingLink?: string;
  maxAttendees?: number;
  groupId?: string;
  tags: string[];
}

interface EventAttendee {
  userId: string;
  name: string;
  avatar?: string;
  joinedAt: string;
  [key: string]: unknown;
}

interface UserAchievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: string;
  [key: string]: unknown;
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  rank: number;
  [key: string]: unknown;
}

interface ModerationItem {
  id: string;
  type: string;
  content: string;
  reportedAt: string;
  reportedBy: string;
  status: string;
  [key: string]: unknown;
}

// Community Service Class
class CommunityService {
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

    // Add response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (_response) => _response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // =============== Posts ===============

  async getPosts(filters?: {
    groupId?: string;
    userId?: string;
    tags?: string[];
    page?: number;
    limit?: number;
    filter?: string;
    cursor?: string;
  }): Promise<{ posts: Post[]; total: number; hasMore: boolean; nextCursor?: string }> {
    const response = await this.apiClient.get('/community/posts', { params: filters });
    return response.data;
  }

  async getPost(postId: string): Promise<Post> {
    const response = await this.apiClient.get(`/community/posts/${postId}`);
    return PostSchema.parse(response.data);
  }

  async createPost(data: CreatePostDto): Promise<Post> {
    // Validate _content for harmful language before posting
    await this.validateContent(data._content);
    
    const response = await this.apiClient.post('/community/posts', data);
    return PostSchema.parse(response.data);
  }

  async updatePost(postId: string, data: Partial<CreatePostDto>): Promise<Post> {
    if (data._content) {
      await this.validateContent(data._content);
    }
    
    const response = await this.apiClient.put(`/community/posts/${postId}`, data);
    return PostSchema.parse(response.data);
  }

  async deletePost(postId: string): Promise<void> {
    await this.apiClient.delete(`/community/posts/${postId}`);
  }

  async likePost(postId: string): Promise<void> {
    await this.apiClient.post(`/community/posts/${postId}/like`);
  }

  async unlikePost(postId: string): Promise<void> {
    await this.apiClient.delete(`/community/posts/${postId}/like`);
  }

  async sharePost(postId: string, message?: string): Promise<void> {
    await this.apiClient.post(`/community/posts/${postId}/share`, { message });
  }

  async reportPost(postId: string, reason: string, details?: string): Promise<void> {
    await this.apiClient.post(`/community/posts/${postId}/report`, { reason, details });
  }

  // =============== Comments ===============

  async getComments(postId: string, page = 1, limit = 20): Promise<{
    comments: Comment[];
    total: number;
    hasMore: boolean;
  }> {
    const response = await this.apiClient.get(`/community/posts/${postId}/comments`, {
      params: { page, limit },
    });
    return response.data;
  }

  async createComment(postId: string, data: CreateCommentDto): Promise<Comment> {
    await this.validateContent(data._content);
    
    const response = await this.apiClient.post(
      `/community/posts/${postId}/comments`,
      data
    );
    return CommentSchema.parse(response.data);
  }

  async updateComment(commentId: string, _content: string): Promise<Comment> {
    await this.validateContent(_content);
    
    const response = await this.apiClient.put(
      `/community/comments/${commentId}`,
      { _content }
    );
    return CommentSchema.parse(response.data);
  }

  async deleteComment(commentId: string): Promise<void> {
    await this.apiClient.delete(`/community/comments/${commentId}`);
  }

  async likeComment(commentId: string): Promise<void> {
    await this.apiClient.post(`/community/comments/${commentId}/like`);
  }

  async markCommentHelpful(commentId: string): Promise<void> {
    await this.apiClient.post(`/community/comments/${commentId}/helpful`);
  }

  // =============== Support Groups ===============

  async getGroups(filters?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ groups: SupportGroup[]; total: number; hasMore: boolean }> {
    const response = await this.apiClient.get('/community/groups', { params: filters });
    return response.data;
  }

  async getGroup(groupId: string): Promise<SupportGroup> {
    const response = await this.apiClient.get(`/community/groups/${groupId}`);
    return SupportGroupSchema.parse(response.data);
  }

  async createGroup(data: CreateGroupDto): Promise<SupportGroup> {
    const response = await this.apiClient.post('/community/groups', data);
    return SupportGroupSchema.parse(response.data);
  }

  async updateGroup(groupId: string, data: Partial<CreateGroupDto>): Promise<SupportGroup> {
    const response = await this.apiClient.put(`/community/groups/${groupId}`, data);
    return SupportGroupSchema.parse(response.data);
  }

  async deleteGroup(groupId: string): Promise<void> {
    await this.apiClient.delete(`/community/groups/${groupId}`);
  }

  async joinGroup(groupId: string): Promise<void> {
    await this.apiClient.post(`/community/groups/${groupId}/join`);
  }

  async leaveGroup(groupId: string): Promise<void> {
    await this.apiClient.post(`/community/groups/${groupId}/leave`);
  }

  async getGroupMembers(groupId: string, page = 1, limit = 50): Promise<{
    members: unknown[];
    total: number;
    hasMore: boolean;
  }> {
    const response = await this.apiClient.get(`/community/groups/${groupId}/members`, {
      params: { page, limit },
    });
    return response.data;
  }

  async inviteToGroup(groupId: string, userIds: string[]): Promise<void> {
    await this.apiClient.post(`/community/groups/${groupId}/invite`, { userIds });
  }

  async kickFromGroup(groupId: string, userId: string, reason?: string): Promise<void> {
    await this.apiClient.post(`/community/groups/${groupId}/kick`, { userId, reason });
  }

  async promoteGroupModerator(groupId: string, userId: string): Promise<void> {
    await this.apiClient.post(`/community/groups/${groupId}/promote`, { userId });
  }

  // =============== Events ===============

  async getEvents(filters?: {
    groupId?: string;
    type?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ events: Event[]; total: number; hasMore: boolean }> {
    const response = await this.apiClient.get('/community/events', {
      params: {
        ...filters,
        startDate: filters?.startDate?.toISOString(),
        endDate: filters?.endDate?.toISOString(),
      },
    });
    return response.data;
  }

  async getEvent(eventId: string): Promise<Event> {
    const response = await this.apiClient.get(`/community/events/${eventId}`);
    return EventSchema.parse(response.data);
  }

  async createEvent(data: CreateEventDto): Promise<Event> {
    const response = await this.apiClient.post('/community/events', {
      ...data,
      startTime: data.startTime.toISOString(),
      endTime: data.endTime.toISOString(),
    });
    return EventSchema.parse(response.data);
  }

  async updateEvent(eventId: string, data: Partial<CreateEventDto>): Promise<Event> {
    const response = await this.apiClient.put(`/community/events/${eventId}`, {
      ...data,
      startTime: data.startTime?.toISOString(),
      endTime: data.endTime?.toISOString(),
    });
    return EventSchema.parse(response.data);
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.apiClient.delete(`/community/events/${eventId}`);
  }

  async registerForEvent(eventId: string): Promise<void> {
    await this.apiClient.post(`/community/events/${eventId}/register`);
  }

  async unregisterFromEvent(eventId: string): Promise<void> {
    await this.apiClient.delete(`/community/events/${eventId}/register`);
  }

  async getEventAttendees(eventId: string): Promise<EventAttendee[]> {
    const response = await this.apiClient.get(`/community/events/${eventId}/attendees`);
    return response.data;
  }

  // =============== Content Validation & Safety ===============

  private async validateContent(_content: string): Promise<void> {
    // Check for harmful _content
    const harmfulPatterns = [
      /\b(kill\s+yourself|kys)\b/gi,
      /\b(self[\s-]?harm|cutting|burning)\b/gi,
      /\b(suicide|suicidal)\b/gi,
      /\b(hate\s+speech|racial\s+slur)\b/gi,
    ];

    for (const pattern of harmfulPatterns) {
      if (pattern.test(_content)) {
        throw new Error('Content contains potentially harmful language. Please review our community guidelines.');
      }
    }

    // Check for spam patterns
    const spamPatterns = [
      /\b(buy\s+now|click\s+here|limited\s+offer)\b/gi,
      /(https?:\/\/[^\s]+){3,}/gi, // Multiple URLs
      /(.)\1{10,}/gi, // Repeated characters
    ];

    for (const pattern of spamPatterns) {
      if (pattern.test(_content)) {
        throw new Error('Content appears to be spam. Please ensure your post follows community guidelines.');
      }
    }
  }

  // =============== Achievements & Gamification ===============

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const response = await this.apiClient.get(`/community/users/${userId}/achievements`);
    return response.data;
  }

  async getLeaderboard(type: 'helpful' | 'supportive' | 'active', period: 'week' | 'month' | 'all'): Promise<LeaderboardEntry[]> {
    const response = await this.apiClient.get('/community/leaderboard', {
      params: { type, period },
    });
    return response.data;
  }

  async awardKudos(userId: string, reason: string): Promise<void> {
    await this.apiClient.post(`/community/users/${userId}/kudos`, { reason });
  }

  // =============== Moderation ===============

  async getModerationQueue(): Promise<ModerationItem[]> {
    const response = await this.apiClient.get('/community/moderation/queue');
    return response.data;
  }

  async moderateContent(contentId: string, action: 'approve' | 'reject' | 'flag', reason?: string): Promise<void> {
    await this.apiClient.post('/community/moderation/action', {
      contentId,
      action,
      reason,
    });
  }

  async banUser(userId: string, duration: number, reason: string): Promise<void> {
    await this.apiClient.post('/community/moderation/ban', {
      userId,
      duration,
      reason,
    });
  }

  async unbanUser(userId: string): Promise<void> {
    await this.apiClient.post('/community/moderation/unban', { userId });
  }

  // =============== Search ===============

  async searchCommunity(query: string, filters?: {
    type?: 'posts' | 'groups' | 'events' | 'users';
    category?: string;
    dateRange?: { start: Date; end: Date };
  }): Promise<unknown> {
    const response = await this.apiClient.get('/community/search', {
      params: {
        q: query,
        ...filters,
        startDate: filters?.dateRange?.start.toISOString(),
        endDate: filters?.dateRange?.end.toISOString(),
      },
    });
    return response.data;
  }
}

// Export singleton instance
export const _communityService = new CommunityService();