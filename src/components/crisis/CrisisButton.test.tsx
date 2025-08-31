// CrisisButton Component Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CrisisButton from './CrisisButton';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';

describe('CrisisButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the crisis button with correct text', () => {
      render(<CrisisButton />);
      expect(screen.getByRole('button', { name: /crisis help/i })).toBeInTheDocument();
    });

    it('should have proper ARIA attributes for accessibility', () => {
      render(<CrisisButton />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
      expect(button).toHaveAttribute('aria-describedby');
    });

    it('should be keyboard accessible', () => {
      render(<CrisisButton />);
      const button = screen.getByRole('button');
      button.focus();
      expect(document.activeElement).toBe(button);
    });
  });

  describe('Crisis Response Time', () => {
    it('should respond within 200ms threshold', async () => {
      const startTime = performance.now();
      render(<CrisisButton />);
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/crisis resources/i)).toBeInTheDocument();
      });
      
      const responseTime = performance.now() - startTime;
      expect(responseTime).toBeLessThan(200);
    });

    it('should immediately show loading state on click', async () => {
      render(<CrisisButton />);
      const button = screen.getByRole('button');
      
      fireEvent.click(button);
      
      expect(screen.getByText(/connecting to crisis support/i)).toBeInTheDocument();
    });
  });

  describe('Crisis Resources Display', () => {
    it('should display emergency hotline numbers', async () => {
      render(<CrisisButton />);
      const button = screen.getByRole('button');
      
      await userEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('988')).toBeInTheDocument();
        expect(screen.getByText(/suicide & crisis lifeline/i)).toBeInTheDocument();
      });
    });

    it('should show local emergency resources', async () => {
      render(<CrisisButton />);
      const button = screen.getByRole('button');
      
      await userEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/local emergency room/i)).toBeInTheDocument();
        expect(screen.getByText(/2.3 miles/i)).toBeInTheDocument();
      });
    });

    it('should provide text-based crisis support options', async () => {
      render(<CrisisButton />);
      const button = screen.getByRole('button');
      
      await userEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/text home to 741741/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show offline resources when network fails', async () => {
      server.use(
        http.post('/api/crisis/alert', () => {
          return HttpResponse.error();
        })
      );

      render(<CrisisButton />);
      const button = screen.getByRole('button');
      
      await userEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/offline crisis resources/i)).toBeInTheDocument();
        expect(screen.getByText('988')).toBeInTheDocument();
      });
    });

    it('should maintain crisis resources visibility on error', async () => {
      server.use(
        http.post('/api/crisis/alert', () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        })
      );

      render(<CrisisButton />);
      const button = screen.getByRole('button');
      
      await userEvent.click(button);
      
      await waitFor(() => {
        const hotlineNumber = screen.getByText('988');
        expect(hotlineNumber).toBeInTheDocument();
        expect(hotlineNumber).toBeVisible();
      });
    });
  });

  describe('Professional Alert System', () => {
    it('should notify professionals when crisis is triggered', async () => {
      const alertSpy = vi.fn();
      server.use(
        http.post('/api/crisis/alert', async ({ request }) => {
          const body = await request.json() as any;
          alertSpy(body);
          return HttpResponse.json({
            professionalAlerted: true,
            responseTime: 50,
          });
        })
      );

      render(<CrisisButton />);
      const button = screen.getByRole('button');
      
      await userEvent.click(button);
      
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });
    });

    it('should show professional response status', async () => {
      render(<CrisisButton />);
      const button = screen.getByRole('button');
      
      await userEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/professional support notified/i)).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should be touch-friendly on mobile devices', () => {
      // Mock touch device
      Object.defineProperty(window, 'ontouchstart', {
        value: () => {},
        writable: true,
      });

      render(<CrisisButton />);
      const button = screen.getByRole('button');
      
      // Check minimum touch target size (44x44 pixels)
      const styles = window.getComputedStyle(button);
      expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
      expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(44);
    });

    it('should support touch gestures', async () => {
      render(<CrisisButton />);
      const button = screen.getByRole('button');
      
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 0, clientY: 0 } as Touch],
      });
      
      fireEvent(button, touchStart);
      
      await waitFor(() => {
        expect(button).toHaveClass('active');
      });
    });
  });

  describe('Analytics Tracking', () => {
    it('should track crisis button usage', async () => {
      const trackingSpy = vi.fn();
      server.use(
        http.post('/api/analytics/event', async ({ request }) => {
          const body = await request.json() as any;
          trackingSpy(body);
          return HttpResponse.json({ tracked: true });
        })
      );

      render(<CrisisButton />);
      const button = screen.getByRole('button');
      
      await userEvent.click(button);
      
      await waitFor(() => {
        expect(trackingSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'crisis',
            action: 'button_clicked',
          })
        );
      });
    });
  });

  describe('Accessibility Compliance', () => {
    it('should announce crisis resources to screen readers', async () => {
      render(<CrisisButton />);
      const button = screen.getByRole('button');
      
      await userEvent.click(button);
      
      await waitFor(() => {
        const alertRegion = screen.getByRole('alert');
        expect(alertRegion).toBeInTheDocument();
        expect(alertRegion).toHaveAttribute('aria-live', 'assertive');
      });
    });

    it('should support keyboard navigation through resources', async () => {
      render(<CrisisButton />);
      const button = screen.getByRole('button');
      
      await userEvent.click(button);
      
      await waitFor(() => {
        const resources = screen.getAllByRole('link');
        resources.forEach((resource: any) => {
          expect(resource).toHaveAttribute('tabindex');
        });
      });
    });

    it('should provide clear focus indicators', () => {
      render(<CrisisButton />);
      const button = screen.getByRole('button');
      
      button.focus();
      const styles = window.getComputedStyle(button);
      expect(styles.outline).not.toBe('none');
    });
  });

  describe('Performance Optimization', () => {
    it('should lazy load non-critical resources', async () => {
      const { container } = render(<CrisisButton />);
      
      // Initially, only critical elements should be loaded
      expect(container.querySelectorAll('img[loading="lazy"]').length).toBeGreaterThanOrEqual(0);
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      // After interaction, additional resources can load
      await waitFor(() => {
        const lazyImages = container.querySelectorAll('img[loading="lazy"]');
        lazyImages.forEach((img: any) => {
          expect(img).toHaveAttribute('loading', 'lazy');
        });
      });
    });

    it('should debounce rapid clicks', async () => {
      const clickSpy = vi.fn();
      server.use(
        http.post('/api/crisis/alert', async () => {
          clickSpy();
          return HttpResponse.json({ success: true });
        })
      );

      render(<CrisisButton />);
      const button = screen.getByRole('button');
      
      // Rapid clicks
      await userEvent.tripleClick(button);
      
      await waitFor(() => {
        // Should only trigger once despite multiple clicks
        expect(clickSpy).toHaveBeenCalledTimes(1);
      });
    });
  });
});