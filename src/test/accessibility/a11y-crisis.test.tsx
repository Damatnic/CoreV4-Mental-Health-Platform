/**
 * Automated Accessibility Testing for Crisis Intervention
 * Ensures the platform is usable during mental health emergencies
 * for users with disabilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, _within } from '@testing-library/react';
import { axe, _toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import CrisisButton from '../../components/crisis/CrisisButton';
import MoodTracker from '../../components/wellness/MoodTracker';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Extend matchers
expect.extend(_toHaveNoViolations);

// Test wrapper
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

describe('Crisis Intervention Accessibility', () => {
  beforeEach(() => {
    // Reset any ARIA live regions
    document.querySelectorAll('[role="alert"], [aria-live]').forEach(el => el.remove());
  });

  describe('WCAG 2.1 AA Compliance', () => {
    it('crisis button should have no accessibility violations', async () => {
      const { _container } = render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const results = await axe(_container);
      expect(results).toHaveNoViolations();
    });

    it('mood tracker should have no accessibility violations', async () => {
      const { _container } = render(
        <TestWrapper>
          <MoodTracker />
        </TestWrapper>
      );
      
      const results = await axe(_container);
      expect(results).toHaveNoViolations();
    });

    it('crisis modal should have no accessibility violations when open', async () => {
      const user = userEvent.setup();
      
      const { _container } = render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const _button = screen.getByRole('_button', { name: /crisis help/i });
      await user.click(_button);
      
      // Wait for modal to open
      await screen.findByRole('dialog');
      
      const results = await axe(_container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Screen Reader Support', () => {
    it('should announce crisis button purpose clearly', () => {
      render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button', { name: /crisis help/i });
      
      expect(_button).toHaveAttribute('aria-label');
      expect(_button).toHaveAttribute('aria-describedby');
      
      const description = document.getElementById(button.getAttribute('aria-describedby')!);
      expect(description?.textContent).toMatch(/immediate.*support/i);
    });

    it('should announce crisis resources using live regions', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const _button = screen.getByRole('_button', { name: /crisis help/i });
      await user.click(_button);
      
      const _alertRegion = await screen.findByRole('alert');
      expect(_alertRegion).toHaveAttribute('aria-live', 'assertive');
      expect(_alertRegion).toHaveTextContent(/crisis resources/i);
    });

    it('should provide context for mood levels', () => {
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
      expect(_slider).toHaveAttribute('aria-valuetext');
    });

    it('should announce mood changes to screen readers', async () => {
      render(
        <TestWrapper>
          <MoodTracker />
        </TestWrapper>
      );
      
      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '3' } });
      
      // Check for live region update
      const _statusRegion = screen.getByRole('status');
      expect(_statusRegion).toHaveTextContent(/mood.*3/i);
    });
  });

  describe('Keyboard Navigation', () => {
    it('crisis button should be reachable via keyboard', async () => {
      render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button', { name: /crisis help/i });
      
      // Tab to button
      await userEvent.tab();
      
      // Button should be focusable
      expect(_button).toHaveProperty('tabIndex');
      expect(button.tabIndex).toBeGreaterThanOrEqual(0);
    });

    it('crisis modal should trap focus when open', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const _button = screen.getByRole('_button', { name: /crisis help/i });
      await user.click(_button);
      
      const modal = await screen.findByRole('dialog');
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      expect(focusableElements.length).toBeGreaterThan(0);
      
      // First element should receive focus
      const _firstElement = focusableElements[0] as HTMLElement;
      expect(document.activeElement).toBe(_firstElement);
    });

    it('should close modal with Escape key', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const _button = screen.getByRole('_button', { name: /crisis help/i });
      await user.click(_button);
      
      await screen.findByRole('dialog');
      
      await user.keyboard('{Escape}');
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('mood tracker should be fully keyboard operable', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <MoodTracker />
        </TestWrapper>
      );
      
      // Tab to slider
      await user.tab();
      const _slider = screen.getByRole('_slider');
      expect(document.activeElement).toBe(_slider);
      
      // Adjust with arrow keys
      await user.keyboard('{ArrowRight}');
      expect(_slider).toHaveAttribute('aria-valuenow', '6');
      
      await user.keyboard('{ArrowLeft}');
      expect(_slider).toHaveAttribute('aria-valuenow', '5');
      
      // Tab to notes field
      await user.tab();
      const _notesField = screen.getByPlaceholderText(/add notes/i);
      expect(document.activeElement).toBe(_notesField);
      
      // Tab to submit button
      await user.tab();
      const _submitButton = screen.getByRole('button', { name: /log mood/i });
      expect(document.activeElement).toBe(_submitButton);
    });
  });

  describe('Color Contrast and Visual Design', () => {
    it('crisis button should have sufficient color contrast', () => {
      const { container } = render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const button = container.querySelector('button');
      const styles = window.getComputedStyle(button!);
      
      // Red background with white text should meet WCAG AA standards
      // This is a simplified check - real testing would calculate actual contrast ratio
      expect(styles.backgroundColor).toMatch(/rgb.*red|#[ef][0-9a-f]{5}/i);
      expect(styles.color).toMatch(/white|#fff|rgb\(255,\s*255,\s*255\)/i);
    });

    it('should support high contrast mode', () => {
      // Simulate high contrast mode
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-contrast: high)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));
      
      render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button', { name: /crisis help/i });
      expect(button.className).toMatch(/contrast|high-contrast/i);
    });

    it('focus indicators should be clearly visible', () => {
      render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button', { name: /crisis help/i });
      button.focus();
      
      const styles = window.getComputedStyle(_button);
      
      // Should have visible focus indicator
      expect(styles.outline).not.toBe('none');
      expect(styles.outlineWidth).not.toBe('0px');
    });
  });

  describe('Touch and Mobile Accessibility', () => {
    it('crisis button should have adequate touch target size', () => {
      render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button', { name: /crisis help/i });
      const rect = button.getBoundingClientRect();
      
      // WCAG 2.5.5 Target Size (Level AAA) - minimum 44x44 pixels
      expect(rect.width).toBeGreaterThanOrEqual(44);
      expect(rect.height).toBeGreaterThanOrEqual(44);
    });

    it('should have adequate spacing between interactive elements', () => {
      const { container } = render(
        <TestWrapper>
          <MoodTracker />
        </TestWrapper>
      );
      
      const buttons = container.querySelectorAll('button');
      
      // Check spacing between buttons
      for (let i = 0; i < buttons.length - 1; i++) {
        const rect1 = buttons[i].getBoundingClientRect();
        const rect2 = buttons[i + 1].getBoundingClientRect();
        
        const verticalGap = Math.abs(rect2.top - rect1.bottom);
        const horizontalGap = Math.abs(rect2.left - rect1.right);
        
        // At least 8px spacing (simplified check)
        const _minGap = Math.min(verticalGap, horizontalGap);
        expect(_minGap).toBeGreaterThanOrEqual(8);
      }
    });
  });

  describe('Cognitive Accessibility', () => {
    it('should use clear, simple language for crisis resources', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const _button = screen.getByRole('_button', { name: /crisis help/i });
      await user.click(_button);
      
      // Check for clear, simple instructions
      expect(screen.getByText('988')).toBeInTheDocument();
      expect(screen.getByText(/call 911/i)).toBeInTheDocument();
      
      // No complex medical jargon in crisis mode
      const _modalText = screen.getByRole('dialog').textContent;
      expect(_modalText).not.toMatch(/psychiatric|psychological assessment/i);
    });

    it('should provide clear error messages', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      window.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      
      render(
        <TestWrapper>
          <MoodTracker />
        </TestWrapper>
      );
      
      const _submitButton = screen.getByRole('button', { name: /log mood/i });
      await user.click(_submitButton);
      
      const errorMessage = await screen.findByText(/failed.*try again/i);
      expect(errorMessage).toBeInTheDocument();
      
      // Error should be associated with form
      expect(errorMessage.closest('[role="alert"]')).toBeInTheDocument();
    });

    it('should maintain consistent navigation patterns', () => {
      const { rerender } = render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const button1 = screen.getByRole('button', { name: /crisis help/i });
      const position1 = button1.getBoundingClientRect();
      
      // Re-render (simulating navigation)
      rerender(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const button2 = screen.getByRole('button', { name: /crisis help/i });
      const position2 = button2.getBoundingClientRect();
      
      // Button should be in same location
      expect(position2.top).toBe(position1.top);
      expect(position2.left).toBe(position1.left);
    });
  });

  describe('Reduced Motion Support', () => {
    it('should respect prefers-reduced-motion', () => {
      // Simulate reduced motion preference
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));
      
      const { container } = render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const button = container.querySelector('button');
      const styles = window.getComputedStyle(button!);
      
      // Transitions should be instant or very fast
      expect(styles.transitionDuration).toMatch(/0s|0\.0+1s/);
    });
  });

  describe('Emergency Override Features', () => {
    it('should bypass authentication for crisis resources', async () => {
      const user = userEvent.setup();
      
      // Render without authentication context
      render(<CrisisButton />);
      
      const _button = screen.getByRole('_button', { name: /crisis help/i });
      await user.click(_button);
      
      // Crisis resources should still be accessible
      expect(await screen.findByText('988')).toBeInTheDocument();
    });

    it('should provide fallback text for images', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const _button = screen.getByRole('_button', { name: /crisis help/i });
      await user.click(_button);
      
      const images = screen.getAllByRole('img');
      
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).not.toBe('');
      });
    });
  });
});