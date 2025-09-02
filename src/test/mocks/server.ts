// MSW (Mock Service Worker) Server Setup
import { setupServer } from 'msw/node';
import { http, HttpResponse, delay } from 'msw';

// Crisis response handlers
const crisisHandlers = [
  http.post('/api/crisis/alert', async ({ request }) => {
    const body = await request.json() as any;
    
    // Simulate fast crisis response
    await delay(50);
    
    return HttpResponse.json({
      id: `crisis-${  Date.now()}`,
      severity: body.severity || 'high',
      responseTime: 50,
      hotlineNumber: '988',
      emergencyProtocol: 'immediate',
      professionalAlerted: true,
      supportTeamNotified: true,
      timestamp: Date.now(),
    });
  }),
  
  http.get('/api/crisis/resources', async () => {
    await delay(30);
    
    return HttpResponse.json({
      hotlines: [
        { name: '988 Suicide & Crisis Lifeline', number: '988', available: true },
        { name: 'Crisis Text Line', number: 'Text HOME to 741741', available: true },
        { name: 'Veterans Crisis Line', number: '1-800-273-8255', available: true },
      ],
      localResources: [
        { name: 'Local Emergency Room', address: '123 Medical Center Dr', distance: '2.3 miles' },
        { name: 'Community Mental Health Center', address: '456 Wellness Ave', distance: '3.1 miles' },
      ],
      onlineSupport: [
        { name: 'NAMI Support Groups', url: 'https://nami.org/support' },
        { name: 'Mental Health America', url: 'https://mhanational.org' },
      ],
    });
  }),
];

// Authentication handlers
const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as any;
    
    await delay(100);
    
    if (body.email === 'test@example.com' && body.password === 'Test123!') {
      return HttpResponse.json({
        token: 'mock-jwt-token',
        user: {
          id: 'user-123',
          email: body.email,
          name: 'Test User',
          role: 'patient',
          preferences: {
            theme: 'light',
            notifications: true,
            privacy: 'high',
          },
        },
        expiresIn: 3600,
      });
    }
    
    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }),
  
  http.post('/api/auth/logout', async () => {
    await delay(50);
    return HttpResponse.json({ success: true });
  }),
  
  http.get('/api/auth/me', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (authHeader === 'Bearer mock-jwt-token') {
      return HttpResponse.json({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'patient',
      });
    }
    
    return HttpResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }),
];

// Wellness tracking handlers
const wellnessHandlers = [
  http.post('/api/wellness/mood', async ({ request }) => {
    const body = await request.json() as any;
    
    await delay(50);
    
    return HttpResponse.json({
      id: `mood-${  Date.now()}`,
      mood: body.mood,
      score: body.score,
      timestamp: Date.now(),
      analysis: {
        trend: 'improving',
        insights: ['Your mood has been steadily improving over the past week'],
        recommendations: ['Continue with current wellness practices'],
      },
    });
  }),
  
  http.get('/api/wellness/history', async () => {
    await delay(80);
    
    return HttpResponse.json({
      moodHistory: [
        { date: '2025-01-01', score: 7, mood: 'good' },
        { date: '2025-01-02', score: 6, mood: 'okay' },
        { date: '2025-01-03', score: 8, mood: 'great' },
      ],
      wellnessScore: 75,
      streaks: {
        meditation: 5,
        journaling: 3,
        exercise: 7,
      },
    });
  }),
];

// Professional services handlers
const professionalHandlers = [
  http.get('/api/professionals', async () => {
    await delay(100);
    
    return HttpResponse.json({
      professionals: [
        {
          id: 'prof-1',
          name: 'Dr. Sarah Johnson',
          specialization: 'Anxiety & Depression',
          rating: 4.8,
          availability: 'Available',
          nextSlot: '2025-01-05 10:00 AM',
        },
        {
          id: 'prof-2',
          name: 'Dr. Michael Chen',
          specialization: 'Trauma & PTSD',
          rating: 4.9,
          availability: 'Busy',
          nextSlot: '2025-01-06 2:00 PM',
        },
      ],
    });
  }),
  
  http.post('/api/appointments/book', async ({ request }) => {
    const body = await request.json() as any;
    
    await delay(150);
    
    return HttpResponse.json({
      appointmentId: `apt-${  Date.now()}`,
      professionalId: body.professionalId,
      datetime: body.datetime,
      type: body.type || 'video',
      status: 'confirmed',
      confirmationCode: `CONF-${  Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    });
  }),
];

// Community features handlers
const communityHandlers = [
  http.get('/api/community/groups', async () => {
    await delay(80);
    
    return HttpResponse.json({
      groups: [
        {
          id: 'group-1',
          name: 'Anxiety Support Circle',
          members: 234,
          activeNow: 12,
          description: 'A safe space for those dealing with anxiety',
          moderated: true,
        },
        {
          id: 'group-2',
          name: 'Mindfulness & Meditation',
          members: 567,
          activeNow: 28,
          description: 'Daily meditation practices and mindfulness discussions',
          moderated: true,
        },
      ],
    });
  }),
  
  http.post('/api/community/message', async ({ request }) => {
    const body = await request.json() as any;
    
    // Simulate content moderation
    await delay(100);
    
    const hasTriggerWords = /suicide|self-harm|crisis/i.test(body.message);
    
    if (hasTriggerWords) {
      return HttpResponse.json({
        id: `msg-${  Date.now()}`,
        status: 'flagged',
        crisisResourcesProvided: true,
        message: 'Your message has been flagged for safety review. Crisis resources have been provided.',
      });
    }
    
    return HttpResponse.json({
      id: `msg-${  Date.now()}`,
      status: 'posted',
      timestamp: Date.now(),
    });
  }),
];

// Analytics handlers
const analyticsHandlers = [
  http.post('/api/analytics/event', async ({ request }) => {
    const body = await request.json() as any;
    
    await delay(20);
    
    return HttpResponse.json({
      eventId: `evt-${  Date.now()}`,
      tracked: true,
      category: body.category,
      action: body.action,
    });
  }),
  
  http.get('/api/analytics/dashboard', async () => {
    await delay(120);
    
    return HttpResponse.json({
      userEngagement: {
        dailyActiveUsers: 1234,
        weeklyActiveUsers: 5678,
        monthlyActiveUsers: 15234,
      },
      featureUsage: {
        moodTracking: 89,
        meditation: 67,
        journaling: 45,
        professionalBookings: 23,
      },
      healthMetrics: {
        averageWellnessScore: 72,
        crisisInterventions: 3,
        successfulInterventions: 3,
      },
    });
  }),
];

// Error simulation handlers (for error boundary testing)
const errorHandlers = [
  http.get('/api/error/500', () => {
    return HttpResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }),
  
  http.get('/api/error/network', () => {
    return HttpResponse.error();
  }),
  
  http.get('/api/timeout', async () => {
    await delay(30000); // Simulate timeout
    return HttpResponse.json({ data: 'too late' });
  }),
];

// Combine all handlers
export const handlers = [
  ...crisisHandlers,
  ...authHandlers,
  ...wellnessHandlers,
  ...professionalHandlers,
  ...communityHandlers,
  ...analyticsHandlers,
  ...errorHandlers,
];

// Create the server
export const server = setupServer(...handlers);

// Test utilities for modifying handlers
export const mockServerUtils = {
  // Simulate server downtime
  simulateDowntime: () => {
    server.use(
      http.all('*', () => {
        return HttpResponse.error();
      })
    );
  },
  
  // Simulate slow responses
  simulateSlowNetwork: (delayMs: number = 3000) => {
    server.use(
      http.all('*', async () => {
        await delay(delayMs);
        return HttpResponse.json({ delayed: true });
      })
    );
  },
  
  // Reset to default handlers
  reset: () => {
    server.resetHandlers();
  },
};