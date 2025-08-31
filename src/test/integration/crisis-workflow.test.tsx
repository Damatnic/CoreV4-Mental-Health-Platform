// Crisis Intervention Workflow Integration Tests
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

// Import components for integration testing
import CrisisButton from '../../components/crisis/CrisisButton';
import MoodTracker from '../../components/wellness/MoodTracker';

// Test wrapper with all necessary providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Crisis Intervention Workflow', () => {
  let performanceStart: number;

  beforeEach(() => {
    performanceStart = performance.now();
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    const duration = performance.now() - performanceStart;
    if (duration > 200) {
      console.warn(`Test exceeded 200ms threshold: ${duration.toFixed(2)}ms`);
    }
  });

  describe('Crisis Detection → Intervention → Follow-up', () => {
    it('should detect crisis from low mood and trigger intervention', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <MoodTracker />
          <CrisisButton />
        </TestWrapper>
      );
      
      // Step 1: User logs very low mood
      const moodSlider = screen.getByRole('slider');
      fireEvent.change(moodSlider, { target: { value: '2' } });
      
      const logButton = screen.getByRole('button', { name: /log mood/i });
      await user.click(logButton);
      
      // Step 2: Crisis support should be triggered automatically
      await waitFor(() => {
        expect(screen.getByText(/crisis support available/i)).toBeInTheDocument();
        expect(screen.getByText('988')).toBeInTheDocument();
      });
      
      // Step 3: User clicks crisis button
      const crisisButton = screen.getByRole('button', { name: /crisis help/i });
      await user.click(crisisButton);
      
      // Step 4: Crisis resources should be displayed immediately
      await waitFor(() => {
        expect(screen.getByText(/crisis resources/i)).toBeInTheDocument();
        expect(screen.getByText(/suicide & crisis lifeline/i)).toBeInTheDocument();
      });
      
      // Step 5: Professional should be notified
      await waitFor(() => {
        expect(screen.getByText(/professional support notified/i)).toBeInTheDocument();
      });
    });

    it('should maintain crisis resources during network failure', async () => {
      const user = userEvent.setup();
      
      // Simulate network failure
      server.use(
        http.post('/api/crisis/alert', () => {
          return HttpResponse.error();
        }),
        http.get('/api/crisis/resources', () => {
          return HttpResponse.error();
        })
      );
      
      render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const crisisButton = screen.getByRole('button', { name: /crisis help/i });
      await user.click(crisisButton);
      
      // Should show offline resources
      await waitFor(() => {
        expect(screen.getByText(/offline crisis resources/i)).toBeInTheDocument();
        expect(screen.getByText('988')).toBeInTheDocument();
        expect(screen.getByText(/text home to 741741/i)).toBeInTheDocument();
      });
    });

    it('should escalate intervention based on user behavior', async () => {
      const user = userEvent.setup();
      const escalationSpy = vi.fn();
      
      server.use(
        http.post('/api/crisis/escalate', async ({ request }) => {
          const body = await request.json() as any;
          escalationSpy(body);
          return HttpResponse.json({
            escalated: true,
            level: 'urgent',
            professionalContacted: true
          });
        })
      );
      
      render(
        <TestWrapper>
          <MoodTracker />
        </TestWrapper>
      );
      
      // Multiple low mood entries in succession
      const moodSlider = screen.getByRole('slider');
      const logButton = screen.getByRole('button', { name: /log mood/i });
      
      // First entry
      fireEvent.change(moodSlider, { target: { value: '2' } });
      await user.click(logButton);
      
      await waitFor(() => {
        expect(screen.getByText(/mood logged successfully/i)).toBeInTheDocument();
      });
      
      // Wait and clear message
      await new Promise(resolve => setTimeout(resolve, 3100));
      
      // Second very low entry
      fireEvent.change(moodSlider, { target: { value: '1' } });
      await user.click(logButton);
      
      // Should trigger escalation
      await waitFor(() => {
        expect(escalationSpy).toHaveBeenCalled();
      });
    });

    it('should provide follow-up after crisis intervention', async () => {
      const user = userEvent.setup();
      
      server.use(
        http.post('/api/crisis/follow-up', async () => {
          return HttpResponse.json({
            followUpScheduled: true,
            checkInTime: '30 minutes',
            supportGroupInvited: true
          });
        })
      );
      
      render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      // Trigger crisis intervention
      const crisisButton = screen.getByRole('button', { name: /crisis help/i });
      await user.click(crisisButton);
      
      await waitFor(() => {
        expect(screen.getByText(/crisis resources/i)).toBeInTheDocument();
      });
      
      // Close crisis modal
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      
      // Should schedule follow-up
      await waitFor(() => {
        expect(sessionStorage.getItem('crisis_follow_up')).toBeTruthy();
      });
    });
  });

  describe('Professional Integration', () => {
    it('should connect user with available professional immediately', async () => {
      const user = userEvent.setup();
      
      server.use(
        http.post('/api/crisis/connect-professional', async () => {
          return HttpResponse.json({
            professional: {
              name: 'Dr. Sarah Johnson',
              specialty: 'Crisis Intervention',
              available: true,
              responseTime: 45 // milliseconds
            },
            connectionEstablished: true,
            sessionUrl: 'https://secure.teletherapy.com/session/12345'
          });
        })
      );
      
      render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const crisisButton = screen.getByRole('button', { name: /crisis help/i });
      await user.click(crisisButton);
      
      await waitFor(() => {
        expect(screen.getByText(/professional support notified/i)).toBeInTheDocument();
      });
      
      // Professional connection should be fast
      const connectionStart = performance.now();
      await waitFor(() => {
        expect(screen.getByText(/Dr. Sarah Johnson/i)).toBeInTheDocument();
      });
      const connectionTime = performance.now() - connectionStart;
      
      expect(connectionTime).toBeLessThan(100); // Sub-100ms connection
    });

    it('should queue user for next available professional if none available', async () => {
      const user = userEvent.setup();
      
      server.use(
        http.post('/api/crisis/connect-professional', async () => {
          return HttpResponse.json({
            queued: true,
            position: 2,
            estimatedWait: '5 minutes',
            alternativeSupport: {
              peerSupport: true,
              aiCounselor: true
            }
          });
        })
      );
      
      render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const crisisButton = screen.getByRole('button', { name: /crisis help/i });
      await user.click(crisisButton);
      
      await waitFor(() => {
        expect(screen.getByText(/estimated wait: 5 minutes/i)).toBeInTheDocument();
        expect(screen.getByText(/alternative support available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Privacy During Crisis', () => {
    it('should encrypt all crisis-related communications', async () => {
      const encryptSpy = vi.spyOn(window.crypto.subtle, 'encrypt');
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const crisisButton = screen.getByRole('button', { name: /crisis help/i });
      await user.click(crisisButton);
      
      await waitFor(() => {
        expect(encryptSpy).toHaveBeenCalled();
      });
    });

    it('should not log sensitive crisis data in analytics', async () => {
      const analyticsSpy = vi.fn();
      
      server.use(
        http.post('/api/analytics/event', async ({ request }) => {
          const body = await request.json() as any;
          analyticsSpy(body);
          return HttpResponse.json({ tracked: true });
        })
      );
      
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <MoodTracker />
        </TestWrapper>
      );
      
      // Log crisis-level mood
      const moodSlider = screen.getByRole('slider');
      fireEvent.change(moodSlider, { target: { value: '1' } });
      
      const notesInput = screen.getByPlaceholderText(/add notes/i);
      await user.type(notesInput, 'Feeling suicidal');
      
      const logButton = screen.getByRole('button', { name: /log mood/i });
      await user.click(logButton);
      
      await waitFor(() => {
        expect(analyticsSpy).toHaveBeenCalled();
        // Should not contain sensitive text
        expect(analyticsSpy).not.toHaveBeenCalledWith(
          expect.objectContaining({
            notes: expect.stringContaining('suicidal')
          })
        );
      });
    });

    it('should comply with HIPAA during crisis intervention', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const crisisButton = screen.getByRole('button', { name: /crisis help/i });
      await user.click(crisisButton);
      
      // Check for HIPAA compliance indicators
      await waitFor(() => {
        const secureIndicator = sessionStorage.getItem('hipaa_compliant');
        expect(secureIndicator).toBe('true');
        
        const auditLog = sessionStorage.getItem('audit_log');
        expect(auditLog).toBeTruthy();
      });
    });
  });

  describe('Multi-Channel Crisis Support', () => {
    it('should offer multiple communication channels', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const crisisButton = screen.getByRole('button', { name: /crisis help/i });
      await user.click(crisisButton);
      
      await waitFor(() => {
        // Phone support
        expect(screen.getByText('988')).toBeInTheDocument();
        
        // Text support
        expect(screen.getByText(/text home to 741741/i)).toBeInTheDocument();
        
        // Online chat (if available)
        const onlineSupport = screen.queryByText(/online support/i);
        if (onlineSupport) {
          expect(onlineSupport).toBeInTheDocument();
        }
      });
    });

    it('should adapt to user preferences for communication', async () => {
      const user = userEvent.setup();
      
      // Set user preference
      localStorage.setItem('communication_preference', 'text');
      
      render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const crisisButton = screen.getByRole('button', { name: /crisis help/i });
      await user.click(crisisButton);
      
      await waitFor(() => {
        // Text options should be prominently displayed
        const textSection = screen.getByText(/crisis text line/i).parentElement;
        expect(textSection).toHaveClass('bg-blue-50'); // Highlighted
      });
    });
  });

  describe('Crisis Recovery Tracking', () => {
    it('should track recovery progress after crisis', async () => {
      server.use(
        http.get('/api/crisis/recovery-status', () => {
          return HttpResponse.json({
            inRecovery: true,
            daysSinceCrisis: 3,
            checkInsCompleted: 2,
            moodImprovement: 40, // percentage
            supportGroupJoined: true
          });
        })
      );
      
      render(
        <TestWrapper>
          <div data-testid="recovery-dashboard">
            {/* Recovery dashboard would be here */}
          </div>
        </TestWrapper>
      );
      
      await waitFor(() => {
        const recoveryData = sessionStorage.getItem('recovery_tracking');
        expect(recoveryData).toBeTruthy();
        
        const parsed = JSON.parse(recoveryData!);
        expect(parsed.moodImprovement).toBeGreaterThan(0);
      });
    });

    it('should provide positive reinforcement during recovery', async () => {
      server.use(
        http.get('/api/wellness/history', () => {
          return HttpResponse.json({
            moodHistory: [
              { date: '2024-01-01', score: 2, mood: 'very low' },
              { date: '2024-01-02', score: 3, mood: 'low' },
              { date: '2024-01-03', score: 5, mood: 'neutral' },
              { date: '2024-01-04', score: 6, mood: 'okay' }
            ],
            trend: 'improving',
            milestones: ['3 days of improvement', 'Joined support group']
          });
        })
      );
      
      render(
        <TestWrapper>
          <MoodTracker showHistory />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/improving/i)).toBeInTheDocument();
        // Positive reinforcement message
        expect(screen.getByText(/great progress/i)).toBeInTheDocument();
      });
    });
  });
});