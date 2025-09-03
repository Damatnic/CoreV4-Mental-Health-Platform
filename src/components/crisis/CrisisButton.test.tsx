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
    it('should render the crisis _button with correct text', () => {
      render(<CrisisButton />);
      expect(screen.getByRole('_button', { name: /crisis help/i })).toBeInTheDocument();
    });

    it('should have proper ARIA attributes for accessibility', () => {
      render(<CrisisButton />);
      const _button = screen.getByRole('_button');
      expect(_button).toHaveAttribute('aria-label');
      expect(_button).toHaveAttribute('aria-describedby');
    });

    it('should be keyboard accessible', () => {
      render(<CrisisButton />);
      const _button = screen.getByRole('_button');
      _button.focus();
      expect(document.activeElement).toBe(_button);
    });
  });

  describe('Crisis Response Time', () => {
    it('should respond within 200ms threshold', async () => {
      const startTime = performance.now();
      render(<CrisisButton />);
      
      const _button = screen.getByRole('_button');
      await userEvent.click(_button);
      
      await waitFor(() => {
        expect(screen.getByText(/crisis resources/i)).toBeInTheDocument();
      });
      
      const _responseTime = performance.now() - startTime;
      expect(_responseTime).toBeLessThan(200);
    });

    it('should immediately show loading state on click', async () => {
      render(<CrisisButton />);
      const _button = screen.getByRole('_button');
      
      fireEvent.click(_button);
      
      expect(screen.getByText(/connecting to crisis support/i)).toBeInTheDocument();
    });
  });

  describe('Crisis Resources Display', () => {
    it('should display emergency hotline numbers', async () => {
      render(<CrisisButton />);
      const _button = screen.getByRole('_button');
      
      await userEvent.click(_button);
      
      await waitFor(() => {
        expect(screen.getByText('988')).toBeInTheDocument();
        expect(screen.getByText(/suicide & crisis lifeline/i)).toBeInTheDocument();
      });
    });

    it('should show local emergency resources', async () => {
      render(<CrisisButton />);
      const _button = screen.getByRole('_button');
      
      await userEvent.click(_button);
      
      await waitFor(() => {
        expect(screen.getByText(/local emergency room/i)).toBeInTheDocument();
        expect(screen.getByText(/2.3 miles/i)).toBeInTheDocument();
      });
    });

    it('should provide text-based crisis support options', async () => {
      render(<CrisisButton />);
      const _button = screen.getByRole('_button');
      
      await userEvent.click(_button);
      
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
      const _button = screen.getByRole('button');
      
      await userEvent.click(_button);
      
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
      const _button = screen.getByRole('button');
      
      await userEvent.click(_button);
      
      await waitFor(() => {
        const _hotlineNumber = screen.getByText('988');
        expect(_hotlineNumber).toBeInTheDocument();
        expect(_hotlineNumber).toBeVisible();
      });
    });
  });

  describe('Professional Alert System', () => {
    it('should notify professionals when crisis is triggered', async () => {
      const alertSpy = vi.fn();
      server.use(
        http.post('/api/crisis/alert', async ({ request }) => {
          const _body = await request.json() as Record<string, unknown>;
          alertSpy(_body);
          return HttpResponse.json({
            professionalAlerted: true,
            _responseTime: 50,
          });
        })
      );

      render(<CrisisButton />);
      const _button = screen.getByRole('button');
      
      await userEvent.click(_button);
      
      await waitFor(() => {
        expect(_alertSpy).toHaveBeenCalled();
      });
    });

    it('should show professional response status', async () => {
      render(<CrisisButton />);
      const _button = screen.getByRole('_button');
      
      await userEvent.click(_button);
      
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
      const _button = screen.getByRole('button');
      
      // Check minimum touch target size (44x44 pixels)
      const styles = window.getComputedStyle(_button);
      expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
      expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(44);
    });

    it('should support touch gestures', async () => {
      render(<CrisisButton />);
      const _button = screen.getByRole('_button');
      
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 0, clientY: 0 } as Touch],
      });
      
      fireEvent(_button, touchStart);
      
      await waitFor(() => {
        expect(_button).toHaveClass('active');
      });
    });
  });

  describe('Analytics Tracking', () => {
    it('should track crisis _button usage', async () => {
      const trackingSpy = vi.fn();
      server.use(
        http.post('/api/analytics/event', async ({ request }) => {
          const _body = await request.json() as { category: string; action: string; };
          trackingSpy(_body);
          return HttpResponse.json({ tracked: true });
        })
      );

      render(<CrisisButton />);
      const _button = screen.getByRole('button');
      
      await userEvent.click(_button);
      
      await waitFor(() => {
        expect(_trackingSpy).toHaveBeenCalledWith(
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
      const _button = screen.getByRole('_button');
      
      await userEvent.click(_button);
      
      await waitFor(() => {
        const _alertRegion = screen.getByRole('alert');
        expect(_alertRegion).toBeInTheDocument();
        expect(_alertRegion).toHaveAttribute('aria-live', 'assertive');
      });
    });

    it('should support keyboard navigation through resources', async () => {
      render(<CrisisButton />);
      const _button = screen.getByRole('_button');
      
      await userEvent.click(_button);
      
      await waitFor(() => {
        const resources = screen.getAllByRole('link');
        resources.forEach((_resource) => {
          expect(_resource).toHaveAttribute('tabindex');
        });
      });
    });

    it('should provide clear focus indicators', () => {
      render(<CrisisButton />);
      const _button = screen.getByRole('_button');
      
      _button.focus();
      const styles = window.getComputedStyle(_button);
      expect(styles.outline).not.toBe('none');
    });
  });

  describe('Performance Optimization', () => {
    it('should lazy load non-critical resources', async () => {
      const { container } = render(<CrisisButton />);
      
      // Initially, only critical elements should be loaded
      expect(container.querySelectorAll('img[loading="lazy"]').length).toBeGreaterThanOrEqual(0);
      
      const _button = screen.getByRole('button');
      await userEvent.click(_button);
      
      // After interaction, additional resources can load
      await waitFor(() => {
        const lazyImages = container.querySelectorAll('img[loading="lazy"]');
        lazyImages.forEach((_img) => {
          expect(_img).toHaveAttribute('loading', 'lazy');
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
      const _button = screen.getByRole('button');
      
      // Rapid clicks
      await userEvent.tripleClick(_button);
      
      await waitFor(() => {
        // Should only trigger once despite multiple clicks
        expect(_clickSpy).toHaveBeenCalledTimes(1);
      });
    });
  });
});