// Mock Data Service for Development and Testing
// Provides realistic mental health platform data for development

import {
  User,
  MoodEntry,
  CrisisSession,
  Therapist,
  Appointment,
  SafetyPlan,
  CommunityPost,
  SupportGroup,
  _Message,
  _Comment
} from './types';

// Helper function to generate random dates
const __randomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'sarah.johnson@example.com',
    username: 'sarah_j',
    role: 'patient',
    profile: {
      firstName: 'Sarah',
      lastName: 'Johnson',
      dateOfBirth: new Date('1990-05-15'),
      phone: '+1-555-0123',
      emergencyContact: {
        name: 'Michael Johnson',
        relationship: 'Spouse',
        phone: '+1-555-0124',
        email: 'michael.j@example.com'
      },
      location: {
        country: 'USA',
        state: 'California',
        city: 'San Francisco',
        zipCode: '94102',
        coordinates: {
          latitude: 37.7749,
          longitude: -122.4194
        }
      },
      timezone: 'America/Los_Angeles',
      avatarUrl: '/avatars/sarah.jpg',
      bio: 'Working on my mental health journey one day at a time.',
      pronouns: 'she/her'
    },
    preferences: {
      theme: 'auto',
      notifications: {
        email: true,
        push: true,
        sms: false,
        crisisAlerts: true,
        appointmentReminders: true,
        medicationReminders: true,
        communityUpdates: false
      },
      privacy: {
        profileVisibility: 'connections',
        shareDataWithTherapist: true,
        anonymousMode: false,
        allowResearch: true
      },
      accessibility: {
        fontSize: 'medium',
        highContrast: false,
        screenReaderMode: false,
        reducedMotion: false
      }
    },
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-08-30'),
    lastActive: new Date('2025-08-30T14:30:00'),
    isVerified: true,
    twoFactorEnabled: true
  },
  {
    id: 'therapist-1',
    email: 'dr.emily.chen@therapycenter.com',
    username: 'dr_chen',
    role: 'therapist',
    profile: {
      firstName: 'Emily',
      lastName: 'Chen',
      phone: '+1-555-0200',
      location: {
        country: 'USA',
        state: 'California',
        city: 'San Francisco',
        zipCode: '94103'
      },
      timezone: 'America/Los_Angeles',
      avatarUrl: '/avatars/dr-chen.jpg',
      bio: 'Licensed Clinical Psychologist specializing in anxiety, depression, and trauma recovery.',
      pronouns: 'she/her'
    },
    preferences: {
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        sms: true,
        crisisAlerts: true,
        appointmentReminders: true,
        medicationReminders: false,
        communityUpdates: false
      },
      privacy: {
        profileVisibility: 'public',
        shareDataWithTherapist: false,
        anonymousMode: false,
        allowResearch: true
      },
      accessibility: {
        fontSize: 'medium',
        highContrast: false,
        screenReaderMode: false,
        reducedMotion: false
      }
    },
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2025-08-30'),
    lastActive: new Date('2025-08-30T16:00:00'),
    isVerified: true,
    twoFactorEnabled: true
  }
];

// Mock Mood Entries
export const mockMoodEntries: MoodEntry[] = [
  {
    id: 'mood-1',
    userId: 'user-1',
    timestamp: new Date('2025-08-30T09:00:00'),
    mood: 4,
    emotions: [
      { type: 'happy', intensity: 70 },
      { type: 'grateful', intensity: 80 },
      { type: 'energetic', intensity: 60 }
    ],
    triggers: ['good sleep', 'morning exercise'],
    activities: ['meditation', 'journaling', 'yoga'],
    notes: 'Started the day with meditation and feeling really positive.',
    location: 'Home',
    weather: {
      temperature: 72,
      condition: 'sunny',
      humidity: 55
    },
    sleep: {
      duration: 480,
      quality: 4,
      disturbances: 1
    },
    medication: [
      {
        medicationId: 'med-1',
        taken: true,
        time: new Date('2025-08-30T08:00:00'),
        dosage: '20mg'
      }
    ]
  },
  {
    id: 'mood-2',
    userId: 'user-1',
    timestamp: new Date('2025-08-29T20:00:00'),
    mood: 2,
    emotions: [
      { type: 'anxious', intensity: 85 },
      { type: 'overwhelmed', intensity: 75 },
      { type: 'tired', intensity: 90 }
    ],
    triggers: ['work stress', 'deadline pressure'],
    activities: ['work', 'meetings'],
    notes: 'Very stressful day at work. Multiple deadlines and conflicts.',
    location: 'Office',
    weather: {
      temperature: 68,
      condition: 'cloudy',
      humidity: 70
    },
    sleep: {
      duration: 360,
      quality: 2,
      disturbances: 4
    }
  }
];

// Mock Therapists
export const mockTherapists: Therapist[] = [
  {
    id: 'therapist-1',
    userId: 'therapist-1',
    credentials: {
      licenseNumber: 'PSY123456',
      licenseState: 'California',
      licenseType: 'Clinical Psychologist',
      education: [
        {
          degree: 'Ph.D. in Clinical Psychology',
          institution: 'Stanford University',
          year: 2015
        },
        {
          degree: 'M.A. in Psychology',
          institution: 'UC Berkeley',
          year: 2011
        }
      ],
      certifications: [
        {
          name: 'Cognitive Behavioral Therapy',
          issuer: 'Beck Institute',
          date: new Date('2016-03-15')
        },
        {
          name: 'EMDR Therapy',
          issuer: 'EMDR International Association',
          date: new Date('2018-07-20')
        }
      ],
      yearsOfExperience: 9
    },
    specializations: [
      'Anxiety Disorders',
      'Depression',
      'PTSD',
      'Relationship Issues',
      'Work Stress'
    ],
    availability: {
      timezone: 'America/Los_Angeles',
      regularHours: {
        monday: [
          { start: '09:00', end: '12:00' },
          { start: '14:00', end: '18:00' }
        ],
        tuesday: [
          { start: '09:00', end: '12:00' },
          { start: '14:00', end: '18:00' }
        ],
        wednesday: [
          { start: '09:00', end: '12:00' },
          { start: '14:00', end: '18:00' }
        ],
        thursday: [
          { start: '09:00', end: '12:00' },
          { start: '14:00', end: '18:00' }
        ],
        friday: [
          { start: '09:00', end: '12:00' },
          { start: '14:00', end: '17:00' }
        ]
      },
      exceptions: []
    },
    clients: ['user-1', 'user-2', 'user-3'],
    ratings: [
      {
        userId: 'user-1',
        rating: 5,
        review: 'Dr. Chen has been incredibly helpful in my journey. Highly recommended!',
        date: new Date('2025-07-15')
      },
      {
        userId: 'user-2',
        rating: 5,
        review: 'Very professional and understanding. Great listener.',
        date: new Date('2025-06-20')
      }
    ],
    verified: true,
    acceptingNewClients: true,
    languages: ['English', 'Mandarin'],
    insuranceAccepted: [
      'Blue Cross Blue Shield',
      'Aetna',
      'Cigna',
      'United Healthcare'
    ],
    sessionRate: 200,
    slidingScale: true
  }
];

// Mock Appointments
export const mockAppointments: Appointment[] = [
  {
    id: 'appt-1',
    patientId: 'user-1',
    therapistId: 'therapist-1',
    scheduledTime: new Date('2025-09-05T14:00:00'),
    duration: 50,
    type: 'followup',
    format: 'video',
    status: 'scheduled',
    videoUrl: 'https://meet.therapy.com/room/abc123',
    notes: {
      preSession: 'Focus on work stress management techniques',
      treatmentPlan: 'CBT for anxiety, mindfulness exercises',
      homework: [
        'Practice deep breathing 3x daily',
        'Complete thought record worksheet',
        'Try progressive muscle relaxation before bed'
      ]
    },
    payment: {
      amount: 200,
      currency: 'USD',
      method: 'insurance',
      status: 'pending',
      insuranceClaim: {
        claimNumber: 'CLM-2025-0905',
        provider: 'Blue Cross Blue Shield',
        status: 'submitted',
        copay: 30
      }
    },
    reminder: {
      email: true,
      sms: true,
      push: true,
      leadTime: 1440 // 24 hours
    }
  }
];

// Mock Crisis Sessions
export const mockCrisisSessions: CrisisSession[] = [
  {
    id: 'crisis-1',
    userId: 'user-1',
    counselorId: 'counselor-1',
    startTime: new Date('2025-08-25T22:30:00'),
    endTime: new Date('2025-08-25T23:15:00'),
    severity: 'high',
    type: 'chat',
    status: 'resolved',
    transcript: [
      {
        id: 'msg-1',
        senderId: 'user-1',
        content: "I'm having a really hard time right now",
        timestamp: new Date('2025-08-25T22:30:00'),
        type: 'text'
      },
      {
        id: 'msg-2',
        senderId: 'counselor-1',
        content: "I'm here to help. You're not alone. Can you tell me what's happening?",
        timestamp: new Date('2025-08-25T22:31:00'),
        type: 'text'
      }
    ],
    outcome: {
      resolved: true,
      escalatedToEmergency: false,
      referralMade: true,
      safetyPlanReviewed: true,
      followUpScheduled: new Date('2025-08-26T10:00:00'),
      notes: 'User was experiencing acute anxiety. Utilized grounding techniques and reviewed safety plan.'
    },
    followUpRequired: true
  }
];

// Mock Safety Plan
export const mockSafetyPlan: SafetyPlan = {
  id: 'safety-1',
  userId: 'user-1',
  warningSignals: [
    'Feeling overwhelmed and unable to cope',
    'Isolating myself from others',
    'Negative self-talk increasing',
    'Sleep disturbances for multiple _days',
    'Loss of interest in activities'
  ],
  copingStrategies: [
    {
      id: 'cope-1',
      strategy: 'Deep breathing exercises (4-7-8 technique)',
      effectiveness: 8,
      lastUsed: new Date('2025-08-29')
    },
    {
      id: 'cope-2',
      strategy: 'Go for a walk in nature',
      effectiveness: 7,
      lastUsed: new Date('2025-08-28')
    },
    {
      id: 'cope-3',
      strategy: 'Call a friend or family member',
      effectiveness: 9,
      lastUsed: new Date('2025-08-27')
    },
    {
      id: 'cope-4',
      strategy: 'Practice progressive muscle relaxation',
      effectiveness: 6,
      lastUsed: new Date('2025-08-26')
    }
  ],
  distractions: [
    'Watch a favorite comedy show',
    'Listen to uplifting music',
    'Do a puzzle or play a game',
    'Cook a favorite meal',
    'Take a hot bath or shower'
  ],
  supportContacts: [
    {
      name: 'Michael Johnson',
      relationship: 'Spouse',
      phone: '+1-555-0124',
      availability: 'Anytime'
    },
    {
      name: 'Lisa Williams',
      relationship: 'Best Friend',
      phone: '+1-555-0125',
      availability: 'Evenings and weekends'
    },
    {
      name: 'Mom',
      relationship: 'Parent',
      phone: '+1-555-0126',
      availability: 'Daily 8am-10pm'
    }
  ],
  professionalContacts: [
    {
      name: 'Dr. Emily Chen',
      role: 'Therapist',
      phone: '+1-555-0200',
      afterHours: '+1-555-0201',
      organization: 'SF Therapy Center'
    },
    {
      name: 'Crisis Hotline',
      role: 'Crisis Support',
      phone: '988',
      afterHours: '988',
      organization: 'National Suicide Prevention Lifeline'
    }
  ],
  safeEnvironment: [
    {
      item: 'Medications',
      action: 'Give to spouse to manage',
      completed: true
    },
    {
      item: 'Sharp objects',
      action: 'Store in locked drawer',
      completed: true
    }
  ],
  reasonsToLive: [
    'My family who loves me',
    'My dog Max who needs me',
    'Want to see my niece grow up',
    'Travel goals I want to achieve',
    'Making a difference in my community'
  ],
  createdAt: new Date('2025-01-20'),
  updatedAt: new Date('2025-08-25'),
  lastReviewed: new Date('2025-08-25'),
  sharedWith: ['therapist-1', 'user-spouse']
};

// Mock Community Posts
export const mockCommunityPosts: CommunityPost[] = [
  {
    id: 'post-1',
    authorId: 'user-1',
    title: 'Small wins matter too',
    content: 'Today I managed to get out of bed, take a shower, and make breakfast. It might not seem like much, but for me, it\'s a victory. Remember to celebrate your small wins too! 💪',
    tags: ['depression', 'small-wins', 'self-care'],
    type: 'achievement',
    visibility: 'public',
    createdAt: new Date('2025-08-30T10:00:00'),
    updatedAt: new Date('2025-08-30T10:00:00'),
    likes: ['user-2', 'user-3', 'user-4', 'user-5'],
    comments: [
      {
        id: 'comment-1',
        authorId: 'user-2',
        content: 'Thank you for sharing this! I needed to hear it today.',
        createdAt: new Date('2025-08-30T10:30:00'),
        updatedAt: new Date('2025-08-30T10:30:00'),
        likes: ['user-1', 'user-3'],
        replies: [],
        reported: false,
        hidden: false
      }
    ],
    reported: false,
    moderated: false,
    pinned: false
  },
  {
    id: 'post-2',
    authorId: 'user-3',
    title: 'Looking for anxiety management tips',
    content: 'Been dealing with increased anxiety lately, especially in social situations. What techniques have worked for you? Open to all suggestions!',
    tags: ['anxiety', 'tips', 'social-anxiety'],
    type: 'question',
    visibility: 'public',
    createdAt: new Date('2025-08-29T15:00:00'),
    updatedAt: new Date('2025-08-29T15:00:00'),
    likes: ['user-1', 'user-2'],
    comments: [
      {
        id: 'comment-2',
        authorId: 'user-1',
        content: 'The 5-4-3-2-1 grounding technique has been really helpful for me. Also, carrying a small stress ball helps in social situations.',
        createdAt: new Date('2025-08-29T15:30:00'),
        updatedAt: new Date('2025-08-29T15:30:00'),
        likes: ['user-3', 'user-4'],
        replies: [],
        reported: false,
        hidden: false
      }
    ],
    reported: false,
    moderated: false,
    pinned: false
  }
];

// Mock Support Groups
export const mockSupportGroups: SupportGroup[] = [
  {
    id: 'group-1',
    name: 'Anxiety Warriors',
    description: 'A supportive community for those dealing with anxiety disorders. Share experiences, coping strategies, and encouragement.',
    category: 'Anxiety',
    moderators: ['mod-1', 'mod-2'],
    members: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'],
    rules: [
      'Be respectful and supportive',
      'No medical advice - share experiences only',
      'Maintain confidentiality',
      'No triggering content without warnings',
      'Report concerning behavior to moderators'
    ],
    isPrivate: false,
    requiresApproval: false,
    meetingSchedule: {
      frequency: 'weekly',
      dayOfWeek: 3, // Wednesday
      time: '19:00',
      duration: 60,
      meetingUrl: 'https://meet.support.com/anxiety-warriors'
    },
    resources: [
      {
        id: 'resource-1',
        title: 'Understanding Anxiety: A Comprehensive Guide',
        type: 'article',
        url: '/resources/anxiety-guide.pdf',
        description: 'Learn about different types of anxiety disorders and treatment options',
        tags: ['anxiety', 'education', 'treatment'],
        addedBy: 'mod-1',
        addedAt: new Date('2025-07-01')
      },
      {
        id: 'resource-2',
        title: 'Breathing Exercises for Anxiety',
        type: 'video',
        url: 'https://videos.support.com/breathing-exercises',
        description: 'Guided breathing exercises to help manage anxiety',
        tags: ['anxiety', 'breathing', 'exercises'],
        addedBy: 'mod-2',
        addedAt: new Date('2025-07-15')
      }
    ],
    createdAt: new Date('2025-01-01')
  },
  {
    id: 'group-2',
    name: 'Depression Support Circle',
    description: 'A safe space for individuals experiencing depression to connect, share, and support each other.',
    category: 'Depression',
    moderators: ['mod-3', 'mod-4'],
    members: ['user-1', 'user-6', 'user-7', 'user-8'],
    rules: [
      'Practice empathy and kindness',
      'No judgment or criticism',
      'Respect privacy and boundaries',
      'Crisis situations should be directed to emergency services',
      'Celebrate progress, no matter how small'
    ],
    isPrivate: false,
    requiresApproval: true,
    meetingSchedule: {
      frequency: 'biweekly',
      dayOfWeek: 1, // Monday
      time: '18:00',
      duration: 90,
      meetingUrl: 'https://meet.support.com/depression-circle'
    },
    resources: [
      {
        id: 'resource-3',
        title: 'Daily Mood Tracking Template',
        type: 'pdf',
        url: '/resources/mood-tracker.pdf',
        description: 'Printable mood tracking journal to monitor patterns',
        tags: ['depression', 'mood-tracking', 'tools'],
        addedBy: 'mod-3',
        addedAt: new Date('2025-06-15')
      }
    ],
    createdAt: new Date('2025-02-01')
  }
];

// Mock Data Service Class
export class MockDataService {
  private static instance: MockDataService;
  
  private constructor() {}
  
  public static getInstance(): MockDataService {
    if (!MockDataService.instance) {
      MockDataService.instance = new MockDataService();
    }
    return MockDataService.instance;
  }
  
  // Simulate network delay
  private async delay(ms: number = 300): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // User methods
  async getUser(userId: string): Promise<User | null> {
    await this.delay();
    return mockUsers.find(u => u.id === userId) || null;
  }
  
  async getUserByEmail(email: string): Promise<User | null> {
    await this.delay();
    return mockUsers.find(u => u.email === email) || null;
  }
  
  // Mood tracking methods
  async getMoodEntries(userId: string, _days: number = 30): Promise<MoodEntry[]> {
    await this.delay();
    return mockMoodEntries.filter(entry => entry.userId === userId);
  }
  
  async createMoodEntry(entry: Omit<MoodEntry, 'id'>): Promise<MoodEntry> {
    await this.delay();
    const newEntry: MoodEntry = {
      ...entry,
      id: `mood-${Date.now()}`
    };
    mockMoodEntries.push(_newEntry);
    return newEntry;
  }
  
  // Therapist methods
  async getTherapists(filters?: unknown): Promise<Therapist[]> {
    await this.delay(500);
    let therapists = [...mockTherapists];
    
    if (filters?.specializations?.length) {
      therapists = therapists.filter(t => 
        filters.specializations.some((s: string) => t.specializations.includes(s))
      );
    }
    
    if (filters?.acceptingNewClients !== undefined) {
      therapists = therapists.filter(t => t.acceptingNewClients === filters.acceptingNewClients);
    }
    
    return therapists;
  }
  
  async getTherapist(therapistId: string): Promise<Therapist | null> {
    await this.delay();
    return mockTherapists.find(t => t.id === therapistId) || null;
  }
  
  // Appointment methods
  async getAppointments(userId: string): Promise<Appointment[]> {
    await this.delay();
    return mockAppointments.filter(
      a => a.patientId === userId || a.therapistId === userId
    );
  }
  
  async createAppointment(appointment: Omit<Appointment, 'id'>): Promise<Appointment> {
    await this.delay();
    const newAppointment: Appointment = {
      ...appointment,
      id: `appt-${Date.now()}`
    };
    mockAppointments.push(_newAppointment);
    return newAppointment;
  }
  
  // Crisis support methods
  async getCrisisSessions(userId: string): Promise<CrisisSession[]> {
    await this.delay();
    return mockCrisisSessions.filter(s => s.userId === userId);
  }
  
  async createCrisisSession(userId: string, severity: CrisisSession['severity']): Promise<CrisisSession> {
    await this.delay(100); // Quick response for crisis
    const newSession: CrisisSession = {
      id: `crisis-${Date.now()}`,
      userId,
      startTime: new Date(),
      severity,
      type: 'chat',
      status: 'waiting',
      followUpRequired: severity === 'high' || severity === 'critical'
    };
    mockCrisisSessions.push(newSession);
    
    // Simulate counselor assignment after a brief delay
    setTimeout(() => {
      newSession.counselorId = 'counselor-auto';
      newSession.status = 'active';
    }, 2000);
    
    return newSession;
  }
  
  // Safety plan methods
  async getSafetyPlan(userId: string): Promise<SafetyPlan | null> {
    await this.delay();
    return mockSafetyPlan.userId === userId ? mockSafetyPlan : null;
  }
  
  async updateSafetyPlan(userId: string, updates: Partial<SafetyPlan>): Promise<SafetyPlan> {
    await this.delay();
    Object.assign(mockSafetyPlan, updates, { 
      updatedAt: new Date(),
      userId 
    });
    return mockSafetyPlan;
  }
  
  // Community methods
  async getCommunityPosts(page: number = 1, pageSize: number = 10): Promise<CommunityPost[]> {
    await this.delay();
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return mockCommunityPosts.slice(start, end);
  }
  
  async createPost(post: Omit<CommunityPost, 'id'>): Promise<CommunityPost> {
    await this.delay();
    const newPost: CommunityPost = {
      ...post,
      id: `post-${Date.now()}`,
      likes: [],
      comments: [],
      reported: false,
      moderated: false,
      pinned: false
    };
    mockCommunityPosts.unshift(_newPost);
    return newPost;
  }
  
  async getSupportGroups(): Promise<SupportGroup[]> {
    await this.delay();
    return mockSupportGroups;
  }
  
  async joinSupportGroup(groupId: string, userId: string): Promise<SupportGroup> {
    await this.delay();
    const group = mockSupportGroups.find(g => g.id === groupId);
    if (group && !group.members.includes(userId)) {
      group.members.push(userId);
    }
    return group!;
  }
}

// Export singleton instance
export const __mockDataService = MockDataService.getInstance();