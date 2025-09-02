import { logger, LogCategory } from '../logging/logger';
import { secureStorage } from '../security/secureStorage';
import { CrisisProfile } from '../../types/ai-insights';

export interface NotificationRule {
  id: string;
  name: string;
  type: 'wellness_reminder' | 'medication_reminder' | 'mood_check' | 'crisis_followup' | 'appointment_reminder' | 'self_care_prompt';
  priority: 'low' | 'medium' | 'high' | 'critical';
  trigger: NotificationTrigger;
  conditions: NotificationCondition[];
  content: NotificationContent;
  schedule: NotificationSchedule;
  isActive: boolean;
  createdAt: number;
  lastTriggered?: number;
}

export interface NotificationTrigger {
  type: 'time_based' | 'event_based' | 'condition_based' | 'geolocation_based';
  parameters: {
    timePattern?: string; // cron-like pattern
    eventType?: string;
    condition?: string;
    location?: { latitude: number; longitude: number; radius: number };
  };
}

export interface NotificationCondition {
  type: 'mood_score' | 'stress_level' | 'activity_level' | 'sleep_quality' | 'medication_adherence' | 'crisis_risk';
  operator: 'equals' | 'greater_than' | 'less_than' | 'between';
  value: number | string | [number, number];
}

export interface NotificationContent {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  actions?: NotificationAction[];
  personalizedElements?: {
    userName?: boolean;
    moodContext?: boolean;
    progressData?: boolean;
  };
}

export interface NotificationAction {
  id: string;
  title: string;
  icon?: string;
  action: 'open_app' | 'log_mood' | 'start_breathing' | 'call_crisis_line' | 'view_resources' | 'dismiss';
  parameters?: Record<string, any>;
}

export interface NotificationSchedule {
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  timeOfDay?: string; // HH:MM format
  timezone?: string;
  endDate?: number;
  respectSleepHours?: boolean;
  sleepStart?: string; // HH:MM
  sleepEnd?: string; // HH:MM
}

export interface SmartNotification {
  id: string;
  ruleId: string;
  title: string;
  body: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  scheduledFor: number;
  status: 'pending' | 'sent' | 'delivered' | 'clicked' | 'dismissed' | 'expired';
  actions: NotificationAction[];
  metadata: {
    userId: string;
    context?: Record<string, any>;
    personalizedData?: Record<string, any>;
  };
}

export interface NotificationPreferences {
  userId: string;
  globalEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM
    end: string; // HH:MM
  };
  categories: {
    wellness_reminders: boolean;
    medication_reminders: boolean;
    mood_checks: boolean;
    crisis_alerts: boolean;
    appointment_reminders: boolean;
    self_care_prompts: boolean;
  };
  delivery: {
    push: boolean;
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
  frequency: {
    maxPerDay: number;
    respectDoNotDisturb: boolean;
  };
}

export class ComprehensiveNotificationService {
  private rules: Map<string, NotificationRule> = new Map();
  private notifications: Map<string, SmartNotification> = new Map();
  private preferences: NotificationPreferences | null = null;
  private scheduledNotifications: Set<number> = new Set();
  private serviceWorker: ServiceWorker | null = null;

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      // Register service worker for background notifications
      await this.registerServiceWorker();
      
      // Load user preferences and rules
      await this.loadPreferences();
      await this.loadNotificationRules();
      
      // Set up default notification rules
      await this.setupDefaultRules();
      
      // Start notification scheduler
      this.startNotificationScheduler();
      
      logger.info('Comprehensive notification service initialized', {
        category: LogCategory.NOTIFICATIONS
      });

    } catch (error) {
      logger.error('Failed to initialize notification service:', error instanceof Error ? error : new Error(String(error)), {
        category: LogCategory.NOTIFICATIONS
      });
    }
  }

  private async registerServiceWorker(): Promise<void> {
    try {
      if ('serviceWorker' in navigator && 'Notification' in window) {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        this.serviceWorker = registration.active;
        
        // Request notification permission
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          logger.info(`Notification permission: ${permission}`, {
            category: LogCategory.NOTIFICATIONS,
            metadata: { permission }
          });
        }
      }
    } catch (error) {
      logger.error('Service worker registration failed:', error instanceof Error ? error : new Error(String(error)), {
        category: LogCategory.NOTIFICATIONS
      });
    }
  }

  private async loadPreferences(): Promise<void> {
    try {
      const preferences = await secureStorage.getItem('notification_preferences');
      
      if (preferences) {
        this.preferences = preferences;
      } else {
        // Create default preferences
        this.preferences = {
          userId: 'anonymous',
          globalEnabled: true,
          quietHours: {
            enabled: true,
            start: '22:00',
            end: '08:00'
          },
          categories: {
            wellness_reminders: true,
            medication_reminders: true,
            mood_checks: true,
            crisis_alerts: true,
            appointment_reminders: true,
            self_care_prompts: true
          },
          delivery: {
            push: true,
            email: false,
            sms: false,
            inApp: true
          },
          frequency: {
            maxPerDay: 8,
            respectDoNotDisturb: true
          }
        };
        
        await this.savePreferences();
      }
    } catch (error) {
      logger.error('Failed to load notification preferences:', error instanceof Error ? error : new Error(String(error)), {
        category: LogCategory.NOTIFICATIONS
      });
    }
  }

  private async loadNotificationRules(): Promise<void> {
    try {
      const rules = await secureStorage.getItem('notification_rules') || [];
      
      rules.forEach((rule: NotificationRule) => {
        this.rules.set(rule.id, rule);
      });

    } catch (error) {
      logger.error('Failed to load notification rules:', error instanceof Error ? error : new Error(String(error)), {
        category: LogCategory.NOTIFICATIONS
      });
    }
  }

  private async setupDefaultRules(): Promise<void> {
    const defaultRules: Omit<NotificationRule, 'id' | 'createdAt'>[] = [
      {
        name: 'Morning Mood Check-in',
        type: 'mood_check',
        priority: 'medium',
        trigger: {
          type: 'time_based',
          parameters: {
            timePattern: '0 9 * * *' // 9:00 AM daily
          }
        },
        conditions: [],
        content: {
          title: 'Good morning! 🌅',
          body: 'How are you feeling today? Take a moment to check in with yourself.',
          icon: '/icons/mood-check.png',
          actions: [
            {
              id: 'log_mood',
              title: 'Log Mood',
              icon: '😊',
              action: 'log_mood'
            },
            {
              id: 'dismiss',
              title: 'Later',
              action: 'dismiss'
            }
          ],
          personalizedElements: {
            userName: true,
            moodContext: true
          }
        },
        schedule: {
          frequency: 'daily',
          respectSleepHours: true
        },
        isActive: true
      },
      {
        name: 'Evening Self-Care Reminder',
        type: 'self_care_prompt',
        priority: 'low',
        trigger: {
          type: 'time_based',
          parameters: {
            timePattern: '0 19 * * *' // 7:00 PM daily
          }
        },
        conditions: [],
        content: {
          title: 'Self-Care Time 🧘‍♀️',
          body: 'You\'ve worked hard today. Take some time for yourself with a relaxing activity.',
          icon: '/icons/self-care.png',
          actions: [
            {
              id: 'breathing',
              title: 'Breathing Exercise',
              icon: '🫁',
              action: 'start_breathing'
            },
            {
              id: 'meditation',
              title: 'Meditation',
              icon: '🧘',
              action: 'open_app',
              parameters: { page: 'meditation' }
            }
          ]
        },
        schedule: {
          frequency: 'daily',
          respectSleepHours: true
        },
        isActive: true
      },
      {
        name: 'Crisis Follow-up Check',
        type: 'crisis_followup',
        priority: 'high',
        trigger: {
          type: 'condition_based',
          parameters: {
            condition: 'crisis_event_occurred'
          }
        },
        conditions: [
          {
            type: 'crisis_risk',
            operator: 'greater_than',
            value: 0.7
          }
        ],
        content: {
          title: 'Checking in on you 💙',
          body: 'We noticed you accessed crisis support. How are you feeling now?',
          icon: '/icons/crisis-support.png',
          actions: [
            {
              id: 'talk_now',
              title: 'Talk to Someone',
              icon: '💬',
              action: 'call_crisis_line'
            },
            {
              id: 'resources',
              title: 'View Resources',
              icon: '📚',
              action: 'view_resources'
            },
            {
              id: 'im_safe',
              title: 'I\'m Safe Now',
              icon: '✅',
              action: 'dismiss',
              parameters: { feedback: 'safe' }
            }
          ]
        },
        schedule: {
          frequency: 'once'
        },
        isActive: true
      },
      {
        name: 'Weekly Progress Celebration',
        type: 'wellness_reminder',
        priority: 'medium',
        trigger: {
          type: 'time_based',
          parameters: {
            timePattern: '0 10 * * 1' // Mondays at 10 AM
          }
        },
        conditions: [],
        content: {
          title: 'Weekly Check-in 📈',
          body: 'Let\'s review your wellness progress from last week and set goals for this week.',
          icon: '/icons/progress.png',
          actions: [
            {
              id: 'view_progress',
              title: 'View Progress',
              icon: '📊',
              action: 'open_app',
              parameters: { page: 'analytics' }
            }
          ],
          personalizedElements: {
            progressData: true
          }
        },
        schedule: {
          frequency: 'weekly',
          daysOfWeek: [1] // Monday
        },
        isActive: true
      },
      {
        name: 'Medication Reminder',
        type: 'medication_reminder',
        priority: 'high',
        trigger: {
          type: 'time_based',
          parameters: {
            timePattern: '0 8,20 * * *' // 8 AM and 8 PM daily
          }
        },
        conditions: [],
        content: {
          title: 'Medication Reminder 💊',
          body: 'Time to take your prescribed medication. Stay consistent with your treatment.',
          icon: '/icons/medication.png',
          actions: [
            {
              id: 'taken',
              title: 'Taken',
              icon: '✅',
              action: 'dismiss',
              parameters: { logged: true }
            },
            {
              id: 'snooze',
              title: 'Remind in 30min',
              icon: '⏰',
              action: 'dismiss',
              parameters: { snooze: 30 }
            }
          ]
        },
        schedule: {
          frequency: 'daily',
          respectSleepHours: true
        },
        isActive: false // Disabled by default, user can enable if needed
      }
    ];

    // Add default rules if they don't exist
    for (const ruleData of defaultRules) {
      const existingRule = Array.from(this.rules.values()).find(r => r.name === ruleData.name);
      
      if (!existingRule) {
        const rule: NotificationRule = {
          ...ruleData,
          id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: Date.now()
        };
        
        this.rules.set(rule.id, rule);
      }
    }

    await this.saveNotificationRules();
  }

  private startNotificationScheduler(): void {
    // Check for pending notifications every minute
    setInterval(() => {
      this.processScheduledNotifications();
    }, 60000);

    // Initial check
    this.processScheduledNotifications();
  }

  private async processScheduledNotifications(): Promise<void> {
    try {
      const now = Date.now();
      
      // Process time-based notifications
      for (const rule of this.rules.values()) {
        if (!rule.isActive || !this.isRuleEnabled(rule)) continue;

        if (rule.trigger.type === 'time_based') {
          const shouldTrigger = await this.shouldTriggerTimeBasedRule(rule, now);
          if (shouldTrigger) {
            await this.createAndScheduleNotification(rule);
          }
        }
      }

      // Send pending notifications
      await this.sendPendingNotifications();

    } catch (error) {
      logger.error('Failed to process scheduled notifications:', error instanceof Error ? error : new Error(String(error)), {
        category: LogCategory.NOTIFICATIONS
      });
    }
  }

  private async shouldTriggerTimeBasedRule(rule: NotificationRule, now: number): Promise<boolean> {
    try {
      // Check if we're in quiet hours
      if (this.preferences?.quietHours.enabled && this.isInQuietHours()) {
        return false;
      }

      // Check daily frequency limit
      if (!await this.checkDailyFrequencyLimit()) {
        return false;
      }

      // Check if rule was already triggered today (for daily rules)
      if (rule.schedule.frequency === 'daily' && rule.lastTriggered) {
        const lastTriggeredDate = new Date(rule.lastTriggered);
        const currentDate = new Date(now);
        
        if (lastTriggeredDate.toDateString() === currentDate.toDateString()) {
          return false;
        }
      }

      // Parse time pattern (simplified cron-like)
      const timePattern = rule.trigger.parameters.timePattern;
      if (timePattern) {
        return this.matchesTimePattern(timePattern, now);
      }

      return false;

    } catch (error) {
      logger.error('Error checking time-based rule:', error instanceof Error ? error : new Error(String(error)), {
        category: LogCategory.NOTIFICATIONS
      });
      return false;
    }
  }

  private matchesTimePattern(pattern: string, timestamp: number): boolean {
    const date = new Date(timestamp);
    const parts = pattern.split(' ');
    const minute = parts[0] || '*';
    const hour = parts[1] || '*';
    
    const currentMinute = date.getMinutes();
    const currentHour = date.getHours();
    
    // Simple pattern matching (full cron implementation would be more complex)
    const minuteMatch = minute === '*' || parseInt(minute) === currentMinute;
    const hourMatch = hour === '*' || parseInt(hour) === currentHour;
    
    return minuteMatch && hourMatch;
  }

  private isInQuietHours(): boolean {
    if (!this.preferences?.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const startTime = this.preferences.quietHours.start;
    const endTime = this.preferences.quietHours.end;
    
    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }

  private async checkDailyFrequencyLimit(): Promise<boolean> {
    const today = new Date().toDateString();
    const todaysNotifications = Array.from(this.notifications.values())
      .filter(n => new Date(n.timestamp).toDateString() === today && n.status === 'sent');
    
    const maxPerDay = this.preferences?.frequency.maxPerDay || 8;
    return todaysNotifications.length < maxPerDay;
  }

  private isRuleEnabled(rule: NotificationRule): boolean {
    if (!this.preferences?.globalEnabled) return false;
    
    const categoryKey = `${rule.type  }s` as keyof typeof this.preferences.categories;
    return this.preferences.categories[categoryKey] !== false;
  }

  public async createAndScheduleNotification(
    rule: NotificationRule, 
    customData?: Record<string, any>
  ): Promise<string | null> {
    try {
      // Check if conditions are met
      const conditionsMet = await this.checkConditions(rule.conditions);
      if (!conditionsMet) return null;

      // Personalize notification content
      const personalizedContent = await this.personalizeContent(rule.content, customData);

      const notification: SmartNotification = {
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ruleId: rule.id,
        title: personalizedContent.title,
        body: personalizedContent.body,
        priority: rule.priority,
        timestamp: Date.now(),
        scheduledFor: Date.now(),
        status: 'pending',
        actions: personalizedContent.actions || [],
        metadata: {
          userId: this.preferences?.userId || 'anonymous',
          context: customData,
          personalizedData: personalizedContent.personalizedData
        }
      };

      this.notifications.set(notification.id, notification);
      
      // Update rule's last triggered time
      rule.lastTriggered = Date.now();
      this.rules.set(rule.id, rule);
      
      await this.saveNotificationRules();
      
      logger.info(`Notification created and scheduled: ${notification.id}`, {
        category: LogCategory.NOTIFICATIONS,
        metadata: { notificationId: notification.id }
      });
      return notification.id;

    } catch (error) {
      logger.error('Failed to create notification:', error instanceof Error ? error : new Error(String(error)), {
        category: LogCategory.NOTIFICATIONS
      });
      return null;
    }
  }

  private async checkConditions(conditions: NotificationCondition[]): Promise<boolean> {
    if (conditions.length === 0) return true;

    try {
      // In a real implementation, this would check actual user data
      // For now, return true to allow notifications
      return true;

    } catch (error) {
      logger.error('Error checking notification conditions:', error instanceof Error ? error : new Error(String(error)), {
        category: LogCategory.NOTIFICATIONS
      });
      return false;
    }
  }

  private async personalizeContent(
    content: NotificationContent, 
    customData?: Record<string, any>
  ): Promise<NotificationContent & { personalizedData?: Record<string, any> }> {
    let personalizedTitle = content.title;
    let personalizedBody = content.body;
    const personalizedData: Record<string, any> = {};

    try {
      // Add user name if requested
      if (content.personalizedElements?.userName) {
        const userName = await this.getUserName();
        if (userName) {
          personalizedTitle = personalizedTitle.replace(/Good morning!/g, `Good morning, ${userName}!`);
          personalizedData.userName = userName;
        }
      }

      // Add mood context if requested
      if (content.personalizedElements?.moodContext) {
        const moodContext = await this.getMoodContext();
        if (moodContext) {
          personalizedData.moodContext = moodContext;
        }
      }

      // Add progress data if requested
      if (content.personalizedElements?.progressData) {
        const progressData = await this.getProgressData();
        if (progressData) {
          personalizedBody += ` You've made great progress: ${progressData.summary}`;
          personalizedData.progressData = progressData;
        }
      }

      return {
        ...content,
        title: personalizedTitle,
        body: personalizedBody,
        personalizedData
      };

    } catch (error) {
      logger.error('Error personalizing content:', error instanceof Error ? error : new Error(String(error)), {
        category: LogCategory.NOTIFICATIONS
      });
      return content;
    }
  }

  private async getUserName(): Promise<string | null> {
    try {
      const userProfile = await secureStorage.getItem('user_profile');
      return userProfile?.name || null;
    } catch (error) {
      return null;
    }
  }

  private async getMoodContext(): Promise<string | null> {
    try {
      const recentMood = await secureStorage.getItem('recent_mood_data');
      if (recentMood && recentMood.length > 0) {
        const latest = recentMood[recentMood.length - 1];
        return `Last mood: ${latest.mood} (${latest.energy}/10 energy)`;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  private async getProgressData(): Promise<{ summary: string; details: any } | null> {
    try {
      // Mock progress data
      return {
        summary: "3 mood logs this week, 2 breathing sessions completed",
        details: {
          moodLogs: 3,
          breathingSessions: 2,
          weeklyStreak: 5
        }
      };
    } catch (error) {
      return null;
    }
  }

  private async sendPendingNotifications(): Promise<void> {
    const pendingNotifications = Array.from(this.notifications.values())
      .filter(n => n.status === 'pending' && n.scheduledFor <= Date.now());

    for (const notification of pendingNotifications) {
      await this.sendNotification(notification);
    }
  }

  private async sendNotification(notification: SmartNotification): Promise<void> {
    try {
      if (!this.preferences?.globalEnabled) return;

      // Send push notification if enabled and supported
      if (this.preferences.delivery.push && 'Notification' in window && Notification.permission === 'granted') {
        const pushNotification = new Notification(notification.title, {
          body: notification.body,
          icon: '/icons/app-icon-192.png',
          badge: '/icons/badge-72.png',
          tag: notification.id,
          requireInteraction: notification.priority === 'critical',
          actions: notification.actions.slice(0, 2).map(action => ({
            action: action.id,
            title: action.title,
            icon: action.icon
          }))
        });

        pushNotification.onclick = () => {
          this.handleNotificationClick(notification.id, 'main');
        };

        // Auto-close non-critical notifications after 10 seconds
        if (notification.priority !== 'critical') {
          setTimeout(() => pushNotification.close(), 10000);
        }
      }

      // Send in-app notification if enabled
      if (this.preferences.delivery.inApp) {
        this.sendInAppNotification(notification);
      }

      // Update notification status
      notification.status = 'sent';
      notification.timestamp = Date.now();
      this.notifications.set(notification.id, notification);

      await this.saveNotifications();

      logger.info(`Notification sent: ${notification.id}`, {
        category: LogCategory.NOTIFICATIONS,
        metadata: { notificationId: notification.id }
      });

    } catch (error) {
      logger.error('Failed to send notification:', error instanceof Error ? error : new Error(String(error)), {
        category: LogCategory.NOTIFICATIONS
      });
      notification.status = 'expired';
      this.notifications.set(notification.id, notification);
    }
  }

  private sendInAppNotification(notification: SmartNotification): void {
    // Dispatch custom event for in-app notifications
    window.dispatchEvent(new CustomEvent('inAppNotification', {
      detail: {
        id: notification.id,
        title: notification.title,
        body: notification.body,
        priority: notification.priority,
        actions: notification.actions
      }
    }));
  }

  public async handleNotificationClick(notificationId: string, actionId: string): Promise<void> {
    try {
      const notification = this.notifications.get(notificationId);
      if (!notification) return;

      // Update notification status
      notification.status = 'clicked';
      this.notifications.set(notificationId, notification);

      // Find the action
      const action = notification.actions.find(a => a.id === actionId);
      if (!action) return;

      // Execute action
      await this.executeNotificationAction(action, notification);

      await this.saveNotifications();

    } catch (error) {
      logger.error('Failed to handle notification click:', error instanceof Error ? error : new Error(String(error)), {
        category: LogCategory.NOTIFICATIONS
      });
    }
  }

  private async executeNotificationAction(
    action: NotificationAction, 
    notification: SmartNotification
  ): Promise<void> {
    try {
      switch (action.action) {
        case 'open_app':
          if (action.parameters?.page) {
            window.location.hash = `#/${action.parameters.page}`;
          } else {
            window.focus();
          }
          break;

        case 'log_mood':
          window.location.hash = '#/wellness/mood-tracker';
          break;

        case 'start_breathing':
          window.dispatchEvent(new CustomEvent('startBreathingExercise'));
          break;

        case 'call_crisis_line':
          window.location.href = 'tel:988';
          break;

        case 'view_resources':
          window.location.hash = '#/resources';
          break;

        case 'dismiss':
          if (action.parameters?.snooze) {
            // Snooze notification
            const snoozeTime = action.parameters.snooze * 60 * 1000; // Convert minutes to ms
            notification.scheduledFor = Date.now() + snoozeTime;
            notification.status = 'pending';
          }
          break;
      }

      logger.info(`Notification action executed: ${action.action}`, {
        category: LogCategory.NOTIFICATIONS,
        metadata: { action: action.action }
      });

    } catch (error) {
      logger.error('Failed to execute notification action:', error instanceof Error ? error : new Error(String(error)), {
        category: LogCategory.NOTIFICATIONS
      });
    }
  }

  public async triggerCrisisNotification(crisisProfile: CrisisProfile): Promise<void> {
    try {
      const crisisRule: Omit<NotificationRule, 'id' | 'createdAt'> = {
        name: 'Crisis Alert',
        type: 'crisis_followup',
        priority: 'critical',
        trigger: {
          type: 'event_based',
          parameters: {
            eventType: 'crisis_detected'
          }
        },
        conditions: [],
        content: {
          title: 'Crisis Support Available 🚨',
          body: 'We detected you might need immediate support. Help is available right now.',
          icon: '/icons/crisis-alert.png',
          actions: [
            {
              id: 'call_911',
              title: 'Call 911',
              icon: '🚨',
              action: 'open_app',
              parameters: { phone: '911' }
            },
            {
              id: 'crisis_chat',
              title: 'Crisis Chat',
              icon: '💬',
              action: 'open_app',
              parameters: { page: 'crisis-chat' }
            },
            {
              id: 'call_988',
              title: 'Call 988',
              icon: '📞',
              action: 'call_crisis_line'
            }
          ]
        },
        schedule: {
          frequency: 'once'
        },
        isActive: true
      };

      const rule: NotificationRule = {
        ...crisisRule,
        id: `crisis_${Date.now()}`,
        createdAt: Date.now()
      };

      await this.createAndScheduleNotification(rule, {
        crisisProfile,
        urgency: 'immediate'
      });

    } catch (error) {
      logger.error('Failed to trigger crisis notification:', error instanceof Error ? error : new Error(String(error)), {
        category: LogCategory.NOTIFICATIONS
      });
    }
  }

  public async updatePreferences(updates: Partial<NotificationPreferences>): Promise<void> {
    if (!this.preferences) {
      await this.loadPreferences();
    }

    if (this.preferences) {
      this.preferences = { ...this.preferences, ...updates };
      await this.savePreferences();
    }
  }

  public async addCustomRule(rule: Omit<NotificationRule, 'id' | 'createdAt'>): Promise<string> {
    const newRule: NotificationRule = {
      ...rule,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now()
    };

    this.rules.set(newRule.id, newRule);
    await this.saveNotificationRules();

    return newRule.id;
  }

  public async removeRule(ruleId: string): Promise<boolean> {
    const deleted = this.rules.delete(ruleId);
    if (deleted) {
      await this.saveNotificationRules();
    }
    return deleted;
  }

  public getPreferences(): NotificationPreferences | null {
    return this.preferences;
  }

  public getAllRules(): NotificationRule[] {
    return Array.from(this.rules.values());
  }

  public getNotificationHistory(): SmartNotification[] {
    return Array.from(this.notifications.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  private async savePreferences(): Promise<void> {
    if (this.preferences) {
      await secureStorage.setItem('notification_preferences', this.preferences);
    }
  }

  private async saveNotificationRules(): Promise<void> {
    const rules = Array.from(this.rules.values());
    await secureStorage.setItem('notification_rules', rules);
  }

  private async saveNotifications(): Promise<void> {
    const notifications = Array.from(this.notifications.values());
    // Keep only last 100 notifications to prevent storage bloat
    const recentNotifications = notifications.slice(-100);
    await secureStorage.setItem('notification_history', recentNotifications);
  }
}

export const comprehensiveNotificationService = new ComprehensiveNotificationService();