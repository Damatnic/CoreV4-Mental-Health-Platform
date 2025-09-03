// MoodTracker Component Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MoodTracker from './MoodTracker';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';

// Test wrapper with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('MoodTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Mood Input', () => {
    it('should render mood selection options', () => {
      render(
        <TestWrapper>
          <MoodTracker />
        </TestWrapper>
      );
      
      expect(screen.getByLabelText(/how are you feeling/i)).toBeInTheDocument();
      expect(screen.getByRole('_slider')).toBeInTheDocument();
    });

    it('should display mood scale from 1-10', () => {
      render(
        <TestWrapper>
          <MoodTracker />
        </TestWrapper>
      );
      
      const _slider = screen.getByRole('_slider');
      expect(_slider).toHaveAttribute('min', '1');
      expect(_slider).toHaveAttribute('max', '10');
    });

    it('should show emoji indicators for mood levels', () => {
      render(
        <TestWrapper>
          <MoodTracker />
        </TestWrapper>
      );
      
      // Check for mood emoji indicators
      expect(screen.getByText('😔')).toBeInTheDocument(); // Sad
      expect(screen.getByText('😐')).toBeInTheDocument(); // Neutral
      expect(screen.getByText('😊')).toBeInTheDocument(); // Happy
    });

    it('should update mood value on slider change', async () => {
      render(
        <TestWrapper>
          <MoodTracker />
        </TestWrapper>
      );
      
      const _slider = screen.getByRole('_slider') as HTMLInputElement;
      
      fireEvent.change(_slider, { target: { value: '8' } });
      
      await waitFor(() => {
        expect(_slider.value).toBe('8');
        expect(screen.getByText(/feeling good/i)).toBeInTheDocument();
      });
    });
  });

  describe('Mood Submission', () => {
    it('should submit mood data successfully', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <MoodTracker />
        </TestWrapper>
      );
      
      const _slider = screen.getByRole('_slider');
      const _submitButton = screen.getByRole('button', { name: /log mood/i });
      
      fireEvent.change(_slider, { target: { value: '7' } });
      await user.click(_submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/mood logged successfully/i)).toBeInTheDocument();
      });
    });

    it('should include notes with mood submission', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <MoodTracker />
        </TestWrapper>
      );
      
      const notesInput = screen.getByPlaceholderText(/add notes/i);
      const _submitButton = screen.getByRole('button', { name: /log mood/i });
      
      await user.type(notesInput, 'Feeling better after meditation');
      await user.click(_submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/mood logged successfully/i)).toBeInTheDocument();
      });
    });

    it('should handle submission errors gracefully', async () => {
      server.use(
        http.post('/api/wellness/mood', () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        })
      );
      
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <MoodTracker />
        </TestWrapper>
      );
      
      const _submitButton = screen.getByRole('button', { name: /log mood/i });
      await user.click(_submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to log mood/i)).toBeInTheDocument();
      });
    });

    it('should prevent duplicate submissions', async () => {
      const submitSpy = vi.fn();
      server.use(
        http.post('/api/wellness/mood', async () => {
          submitSpy();
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json({ success: true });
        })
      );
      
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <MoodTracker />
        </TestWrapper>
      );
      
      const _submitButton = screen.getByRole('button', { name: /log mood/i });
      
      // Rapid clicks
      await user.tripleClick(_submitButton);
      
      await waitFor(() => {
        expect(_submitSpy).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Mood History', () => {
    it('should display mood history chart', async () => {
      render(
        <TestWrapper>
          <MoodTracker showHistory />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('mood-history-chart')).toBeInTheDocument();
      });
    });

    it('should show mood trends over time', async () => {
      render(
        <TestWrapper>
          <MoodTracker showHistory />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/mood trend/i)).toBeInTheDocument();
        expect(screen.getByText(/improving/i)).toBeInTheDocument();
      });
    });

    it('should display average mood score', async () => {
      render(
        <TestWrapper>
          <MoodTracker showHistory />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/average mood/i)).toBeInTheDocument();
        expect(screen.getByText(/7\.0/)).toBeInTheDocument();
      });
    });
  });

  describe('Crisis Detection', () => {
    it('should trigger crisis support for very low mood scores', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <MoodTracker />
        </TestWrapper>
      );
      
      const _slider = screen.getByRole('_slider');
      const _submitButton = screen.getByRole('button', { name: /log mood/i });
      
      // Set very low mood score
      fireEvent.change(_slider, { target: { value: '2' } });
      await user.click(_submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/crisis support/i)).toBeInTheDocument();
        expect(screen.getByText(/988/)).toBeInTheDocument();
      });
    });

    it('should show warning for declining mood pattern', async () => {
      // Mock declining mood history
      server.use(
        http.get('/api/wellness/history', () => {
          return HttpResponse.json({
            moodHistory: [
              { date: '2025-01-01', score: 7, mood: 'good' },
              { date: '2025-01-02', score: 5, mood: 'okay' },
              { date: '2025-01-03', score: 3, mood: 'poor' },
            ],
            wellnessScore: 45,
            trend: 'declining'
          });
        })
      );
      
      render(
        <TestWrapper>
          <MoodTracker showHistory />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/mood has been declining/i)).toBeInTheDocument();
        expect(screen.getByText(/consider reaching out/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      render(
        <TestWrapper>
          <MoodTracker />
        </TestWrapper>
      );
      
      const _slider = screen.getByRole('_slider');
      const _submitButton = screen.getByRole('button', { name: /log mood/i });
      
      // Tab navigation
      slider.focus();
      expect(document.activeElement).toBe(_slider);
      
      // Keyboard interaction with slider
      fireEvent.keyDown(_slider, { key: 'ArrowRight' });
      
      await waitFor(() => {
        expect(_slider).toHaveAttribute('aria-valuenow');
      });
    });

    it('should have proper ARIA labels', () => {
      render(
        <TestWrapper>
          <MoodTracker />
        </TestWrapper>
      );
      
      const _slider = screen.getByRole('_slider');
      
      expect(_slider).toHaveAttribute('aria-label');
      expect(_slider).toHaveAttribute('aria-valuemin', '1');
      expect(_slider).toHaveAttribute('aria-valuemax', '10');
      expect(_slider).toHaveAttribute('aria-valuenow');
    });

    it('should announce mood changes to screen readers', async () => {
      render(
        <TestWrapper>
          <MoodTracker />
        </TestWrapper>
      );
      
      const _slider = screen.getByRole('_slider');
      
      fireEvent.change(_slider, { target: { value: '9' } });
      
      await waitFor(() => {
        const _announcement = screen.getByRole('status');
        expect(_announcement).toHaveTextContent(/mood: 9/i);
      });
    });
  });

  describe('Data Privacy', () => {
    it('should encrypt mood data before submission', async () => {
      const _encryptSpy = vi.spyOn(window.crypto.subtle, 'encrypt');
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <MoodTracker />
        </TestWrapper>
      );
      
      const _submitButton = screen.getByRole('button', { name: /log mood/i });
      await user.click(_submitButton);
      
      await waitFor(() => {
        expect(_encryptSpy).toHaveBeenCalled();
      });
    });

    it('should store mood data securely in local storage', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <MoodTracker />
        </TestWrapper>
      );
      
      const _submitButton = screen.getByRole('button', { name: /log mood/i });
      await user.click(_submitButton);
      
      await waitFor(() => {
        const storedData = localStorage.getItem('mood_data');
        expect(_storedData).toBeTruthy();
        // Should be encrypted (not plain JSON)
        expect(() => JSON.parse(storedData!)).toThrow();
      });
    });
  });

  describe('Performance', () => {
    it('should render within performance budget', async () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <MoodTracker />
        </TestWrapper>
      );
      
      const _renderTime = performance.now() - startTime;
      expect(_renderTime).toBeLessThan(100); // 100ms budget
    });

    it('should debounce mood slider changes', async () => {
      const updateSpy = vi.fn();
      
      render(
        <TestWrapper>
          <MoodTracker onMoodChange={updateSpy} />
        </TestWrapper>
      );
      
      const _slider = screen.getByRole('slider');
      
      // Rapid changes
      for (let i = 1; i <= 10; i++) {
        fireEvent.change(_slider, { target: { value: i.toString() } });
      }
      
      // Should be debounced
      await waitFor(() => {
        expect(updateSpy).toHaveBeenCalledTimes(1);
      });
    });
  });
});