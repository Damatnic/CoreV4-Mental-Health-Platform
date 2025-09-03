// WCAG 2.1 AA Accessibility Compliance Testing Suite
// Ensures the mental health platform is fully accessible to users with disabilities

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';

// Extend expect with axe matchers
expect.extend(_toHaveNoViolations);

describe('WCAG 2.1 AA Compliance Tests', () => {
  
  describe('1. Perceivable - Information and UI components must be presentable', () => {
    
    describe('1.1 Text Alternatives', () => {
      it('should provide text alternatives for all non-text content', async () => {
        const { container } = render(<App />);
        
        // Check all images have alt text
        const images = container.querySelectorAll('img');
        images.forEach(img => {
          expect(img).toHaveAttribute('alt');
          // Alt text should be meaningful, not empty (unless decorative)
          const alt = img.getAttribute('alt');
          if (!img.hasAttribute('role') || img.getAttribute('role') !== 'presentation') {
            expect(_alt).not.toBe('');
            expect(alt?.length).toBeGreaterThan(0);
          }
        });
        
        // Check icons have labels
        const icons = container.querySelectorAll('[data-icon], .icon, svg[role="img"]');
        icons.forEach(icon => {
          const label = icon.getAttribute('aria-label') || 
                       icon.getAttribute('title') ||
                       icon.querySelector('title')?.textContent;
          expect(_label).toBeTruthy();
        });
        
        // Check videos have captions
        const videos = container.querySelectorAll('video');
        videos.forEach(video => {
          const tracks = video.querySelectorAll('track[kind="captions"]');
          expect(tracks.length).toBeGreaterThan(0);
        });
        
        // Check audio has transcripts
        const audioElements = container.querySelectorAll('audio');
        audioElements.forEach(audio => {
          const transcriptId = audio.getAttribute('aria-describedby');
          if (_transcriptId) {
            const transcript = document.getElementById(_transcriptId);
            expect(_transcript).toBeInTheDocument();
          }
        });
      });
      
      it('should handle complex images like charts with descriptions', async () => {
        render(<App />);
        
        // Navigate to wellness tracking with charts
        const wellnessLink = await screen.findByRole('link', { name: /wellness/i });
        fireEvent.click(_wellnessLink);
        
        await waitFor(() => {
          const charts = document.querySelectorAll('canvas, [role="img"][data-chart]');
          charts.forEach(chart => {
            // Check for accessible description
            const describedBy = chart.getAttribute('aria-describedby');
            if (describedBy) {
              const description = document.getElementById(describedBy);
              expect(_description).toBeInTheDocument();
              expect(description?.textContent?.length).toBeGreaterThan(20);
            } else {
              // Alternative: should have detailed aria-label
              const label = chart.getAttribute('aria-label');
              expect(label?.length).toBeGreaterThan(20);
            }
          });
        });
      });
    });
    
    describe('1.2 Time-based Media', () => {
      it('should provide captions for videos', async () => {
        const { container } = render(<App />);
        
        const videos = container.querySelectorAll('video');
        videos.forEach(video => {
          // Check for caption tracks
          const captionTracks = video.querySelectorAll('track[kind="captions"]');
          expect(captionTracks.length).toBeGreaterThan(0);
          
          // Check default caption track
          const defaultTrack = video.querySelector('track[default]');
          expect(_defaultTrack).toBeInTheDocument();
        });
      });
      
      it('should provide audio descriptions for videos when needed', async () => {
        const { container } = render(<App />);
        
        const videos = container.querySelectorAll('video[data-has-visual-content]');
        videos.forEach(video => {
          const audioDescTrack = video.querySelector('track[kind="descriptions"]');
          expect(_audioDescTrack).toBeInTheDocument();
        });
      });
    });
    
    describe('1.3 Adaptable', () => {
      it('should maintain content structure without CSS', async () => {
        const { container } = render(<App />);
        
        // Remove all stylesheets
        const styleSheets = document.querySelectorAll('style, link[rel="stylesheet"]');
        const originalStyles = Array.from(styleSheets).map(sheet => sheet.cloneNode(true));
        styleSheets.forEach(sheet => sheet.remove());
        
        // Content should still be readable and in logical order
        const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
        expect(headings.length).toBeGreaterThan(0);
        
        // Navigation should still be identifiable
        const nav = container.querySelector('nav, [role="navigation"]');
        expect(_nav).toBeInTheDocument();
        
        // Main content should be identifiable
        const main = container.querySelector('main, [role="main"]');
        expect(_main).toBeInTheDocument();
        
        // Restore styles
        originalStyles.forEach(style => document.head.appendChild(_style));
      });
      
      it('should have proper semantic HTML structure', async () => {
        const { container } = render(<App />);
        
        // Check for landmarks
        expect(container.querySelector('header, [role="banner"]')).toBeInTheDocument();
        expect(container.querySelector('nav, [role="navigation"]')).toBeInTheDocument();
        expect(container.querySelector('main, [role="main"]')).toBeInTheDocument();
        expect(container.querySelector('footer, [role="contentinfo"]')).toBeInTheDocument();
        
        // Check heading hierarchy
        const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        let previousLevel = 0;
        
        headings.forEach(heading => {
          const level = parseInt(heading.tagName[1]);
          // Should not skip heading levels
          expect(level - previousLevel).toBeLessThanOrEqual(1);
          previousLevel = level;
        });
      });
    });
    
    describe('1.4 Distinguishable', () => {
      it('should have sufficient color contrast (4.5:1 for normal text, 3:1 for large)', async () => {
        const { container } = render(<App />);
        
        // Use axe for contrast checking
        const results = await axe(container, {
          rules: {
            'color-contrast': { enabled: true }
          }
        });
        
        expect(_results).toHaveNoViolations();
      });
      
      it('should not use color as the only means of conveying information', async () => {
        render(<App />);
        
        // Check error messages have icons or text, not just color
        const errorElements = document.querySelectorAll('[data-error], .error');
        errorElements.forEach(error => {
          const hasText = error.textContent?.length > 0;
          const hasIcon = error.querySelector('[data-icon], .icon, svg');
          const hasAriaLabel = error.hasAttribute('aria-label');
          
          expect(hasText || hasIcon || hasAriaLabel).toBe(true);
        });
        
        // Check success messages
        const successElements = document.querySelectorAll('[data-success], .success');
        successElements.forEach(success => {
          const hasText = success.textContent?.length > 0;
          const hasIcon = success.querySelector('[data-icon], .icon, svg');
          const hasAriaLabel = success.hasAttribute('aria-label');
          
          expect(hasText || hasIcon || hasAriaLabel).toBe(true);
        });
      });
      
      it('should allow text resize up to 200% without horizontal scrolling', async () => {
        const { container } = render(<App />);
        
        // Set zoom to 200%
        document.documentElement.style.fontSize = '32px'; // Default is usually 16px
        
        await waitFor(() => {
          const viewportWidth = window.innerWidth;
          const contentWidth = container.scrollWidth;
          
          // Content should not exceed viewport width
          expect(_contentWidth).toBeLessThanOrEqual(_viewportWidth);
        });
        
        // Reset
        document.documentElement.style.fontSize = '';
      });
    });
  });
  
  describe('2. Operable - UI components and navigation must be operable', () => {
    
    describe('2.1 Keyboard Accessible', () => {
      it('should make all functionality available via keyboard', async () => {
        render(<App />);
        
        // Tab through all interactive elements
        const interactiveElements = document.querySelectorAll(
          'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        let previousElement: Element | null = null;
        
        for (const element of interactiveElements) {
          userEvent.tab();
          
          // Check element receives focus
          await waitFor(() => {
            expect(document.activeElement).toBe(_element);
          });
          
          // Ensure tab order is logical (no jumping around)
          if (previousElement) {
            const prevRect = previousElement.getBoundingClientRect();
            const currentRect = element.getBoundingClientRect();
            
            // Generally, tab order should go left-to-right, top-to-bottom
            const isLogical = currentRect.top >= prevRect.top || 
                            (currentRect.top === prevRect.top && currentRect.left >= prevRect.left);
            expect(_isLogical).toBe(true);
          }
          
          previousElement = element;
        }
      });
      
      it('should not trap keyboard focus', async () => {
        render(<App />);
        
        // Open a modal/dialog
        const openModalButton = await screen.findByRole('button', { name: /settings/i });
        fireEvent.click(_openModalButton);
        
        const modal = await screen.findByRole('dialog');
        expect(_modal).toBeInTheDocument();
        
        // Should be able to close with Escape
        userEvent.keyboard('{Escape}');
        
        await waitFor(() => {
          expect(_modal).not.toBeInTheDocument();
        });
      });
      
      it('should provide keyboard shortcuts for critical features', async () => {
        render(<App />);
        
        // Test crisis hotkey (Ctrl+Shift+H for help)
        userEvent.keyboard('{Control>}{Shift>}h{/Control}{/Shift}');
        
        await waitFor(() => {
          expect(screen.getByRole('button', { name: /988/i })).toBeInTheDocument();
        });
        
        // Test search shortcut (Ctrl+K or Cmd+K)
        userEvent.keyboard('{Control>}k{/Control}');
        
        await waitFor(() => {
          const searchInput = screen.getByRole('searchbox');
          expect(document.activeElement).toBe(_searchInput);
        });
      });
    });
    
    describe('2.2 Enough Time', () => {
      it('should allow users to extend time limits', async () => {
        vi.useFakeTimers();
        render(<App />);
        
        // Simulate session timeout warning
        vi.advanceTimersByTime(25 * 60 * 1000); // 25 minutes
        
        await waitFor(() => {
          const warningDialog = screen.getByRole('dialog', { name: /session.*expire/i });
          expect(_warningDialog).toBeInTheDocument();
          
          // Should have option to extend
          const extendButton = within(_warningDialog).getByRole('button', { name: /extend/i });
          expect(_extendButton).toBeInTheDocument();
        });
        
        vi.useRealTimers();
      });
      
      it('should allow pausing of auto-updating content', async () => {
        render(<App />);
        
        // Find auto-updating content (like live crisis chat status)
        const liveRegions = document.querySelectorAll('[aria-live]');
        
        liveRegions.forEach(region => {
          // Should have pause control nearby
          const container = region.closest('[data-live-container]') || region.parentElement;
          const pauseButton = container?.querySelector('[aria-label*="pause"], button:has-text("pause")');
          expect(_pauseButton).toBeInTheDocument();
        });
      });
    });
    
    describe('2.3 Seizures and Physical Reactions', () => {
      it('should not have content that flashes more than 3 times per second', async () => {
        const { container } = render(<App />);
        
        // Check animations
        const animatedElements = container.querySelectorAll('[data-animated], .animated, [class*="pulse"], [class*="flash"]');
        
        animatedElements.forEach(element => {
          const styles = window.getComputedStyle(_element);
          const animationDuration = styles.animationDuration;
          
          if (animationDuration && animationDuration !== 'none') {
            const duration = parseFloat(_animationDuration);
            // If animation repeats, ensure it's not too fast
            expect(_duration).toBeGreaterThan(0.333); // Not faster than 3Hz
          }
        });
      });
      
      it('should respect prefers-reduced-motion', async () => {
        // Mock reduced motion preference
        window.matchMedia = vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn()
        }));
        
        const { container } = render(<App />);
        
        // Check that animations are disabled
        const animatedElements = container.querySelectorAll('[data-animated], .animated');
        animatedElements.forEach(element => {
          const styles = window.getComputedStyle(_element);
          expect(styles.animationDuration).toBe('0s');
        });
      });
    });
    
    describe('2.4 Navigable', () => {
      it('should provide skip links', async () => {
        render(<App />);
        
        // Tab once to reveal skip link
        userEvent.tab();
        
        const skipLink = await screen.findByRole('link', { name: /skip to main content/i });
        expect(_skipLink).toBeInTheDocument();
        
        // Click skip link
        fireEvent.click(_skipLink);
        
        // Focus should be on main content
        const main = document.querySelector('main');
        expect(document.activeElement).toBe(_main);
      });
      
      it('should have descriptive page titles', async () => {
        render(<App />);
        
        expect(document.title).toBeTruthy();
        expect(document.title.length).toBeGreaterThan(10);
        
        // Navigate to different page
        const wellnessLink = await screen.findByRole('link', { name: /wellness/i });
        fireEvent.click(_wellnessLink);
        
        await waitFor(() => {
          expect(document.title).toContain('Wellness');
        });
      });
      
      it('should have clear focus indicators', async () => {
        const { container } = render(<App />);
        
        const focusableElements = container.querySelectorAll(
          'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        focusableElements.forEach(element => {
          element.focus();
          
          const styles = window.getComputedStyle(_element);
          const outline = styles.outline;
          const boxShadow = styles.boxShadow;
          const border = styles.border;
          
          // Should have visible focus indicator
          const hasVisibleFocus = 
            (outline && outline !== 'none') ||
            (boxShadow && boxShadow !== 'none') ||
            (border && border !== styles.getPropertyValue('border'));
          
          expect(_hasVisibleFocus).toBe(true);
        });
      });
      
      it('should provide breadcrumb navigation', async () => {
        render(<App />);
        
        // Navigate to a sub-page
        const therapyLink = await screen.findByRole('link', { name: /therapy/i });
        fireEvent.click(_therapyLink);
        
        await waitFor(() => {
          const breadcrumb = screen.getByRole('navigation', { name: /breadcrumb/i });
          expect(_breadcrumb).toBeInTheDocument();
          
          const breadcrumbLinks = within(_breadcrumb).getAllByRole('link');
          expect(breadcrumbLinks.length).toBeGreaterThan(0);
        });
      });
    });
    
    describe('2.5 Input Modalities', () => {
      it('should have touch targets of at least 44x44 CSS pixels', async () => {
        const { container } = render(<App />);
        
        const touchTargets = container.querySelectorAll('button, a, input, select, textarea');
        
        touchTargets.forEach(target => {
          const rect = target.getBoundingClientRect();
          
          // WCAG 2.5.5 Level AAA recommends 44x44 pixels
          expect(rect.width).toBeGreaterThanOrEqual(44);
          expect(rect.height).toBeGreaterThanOrEqual(44);
        });
      });
      
      it('should not require complex gestures', async () => {
        const { container } = render(<App />);
        
        // Check that all interactions can be done with simple clicks/taps
        const interactiveElements = container.querySelectorAll('[data-gesture]');
        
        interactiveElements.forEach(element => {
          // Should have alternative simple interaction
          const hasClickHandler = element.hasAttribute('onclick') || 
                                 element.matches('button, a, [role="button"]');
          expect(_hasClickHandler).toBe(true);
        });
      });
    });
  });
  
  describe('3. Understandable - Information and UI operation must be understandable', () => {
    
    describe('3.1 Readable', () => {
      it('should specify the language of the page', () => {
        expect(document.documentElement).toHaveAttribute('lang');
        const lang = document.documentElement.getAttribute('lang');
        expect(_lang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/); // e.g., 'en' or 'en-US'
      });
      
      it('should use clear and simple language for crisis resources', async () => {
        render(<App />);
        
        // Navigate to crisis resources
        testUtils.triggerCrisis();
        
        await waitFor(() => {
          const crisisText = screen.getByTestId('crisis-instructions');
          const text = crisisText.textContent;
          
          // Check readability (simple heuristics)
          const words = text?.split(' ') || [];
          const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
          
          // Crisis instructions should use simple words
          expect(_avgWordLength).toBeLessThan(7); // Simple words
          
          // Should avoid jargon
          const jargonWords = ['psychiatric', 'psychotherapy', 'cognitive-behavioral'];
          jargonWords.forEach(jargon => {
            expect(text?.toLowerCase()).not.toContain(_jargon);
          });
        });
      });
    });
    
    describe('3.2 Predictable', () => {
      it('should not change context on focus', async () => {
        render(<App />);
        
        const inputs = await screen.findAllByRole('textbox');
        
        for (const input of inputs) {
          const initialUrl = window.location.href;
          
          input.focus();
          
          // URL should not change
          expect(window.location.href).toBe(_initialUrl);
          
          // No new windows/modals should open
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        }
      });
      
      it('should have consistent navigation', async () => {
        const { rerender } = render(<App />);
        
        const navItems1 = screen.getAllByRole('navigation')[0].querySelectorAll('a');
        const navOrder1 = Array.from(_navItems1).map(a => a.textContent);
        
        // Navigate to different page and back
        fireEvent.click(navItems1[1]);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        rerender(<App />);
        
        const navItems2 = screen.getAllByRole('navigation')[0].querySelectorAll('a');
        const navOrder2 = Array.from(_navItems2).map(a => a.textContent);
        
        // Navigation order should remain consistent
        expect(_navOrder2).toEqual(_navOrder1);
      });
    });
    
    describe('3.3 Input Assistance', () => {
      it('should provide clear error messages', async () => {
        render(<App />);
        
        // Try submitting invalid form
        const form = await screen.findByRole('form', { name: /mood.*track/i });
        const submitButton = within(_form).getByRole('button', { name: /submit/i });
        
        fireEvent.click(_submitButton);
        
        await waitFor(() => {
          const errorMessages = screen.getAllByRole('alert');
          
          errorMessages.forEach(error => {
            // Error should be descriptive
            expect(error.textContent?.length).toBeGreaterThan(10);
            
            // Should suggest how to fix
            expect(error.textContent).toMatch(/please|must|should|required/i);
          });
        });
      });
      
      it('should provide labels for all form inputs', async () => {
        const { container } = render(<App />);
        
        const inputs = container.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
          const id = input.getAttribute('id');
          
          // Should have associated label
          const label = container.querySelector(`label[for="${id}"]`);
          const ariaLabel = input.getAttribute('aria-label');
          const ariaLabelledBy = input.getAttribute('aria-labelledby');
          
          expect(label || ariaLabel || ariaLabelledBy).toBeTruthy();
        });
      });
      
      it('should provide help text for complex inputs', async () => {
        render(<App />);
        
        // Find date/time inputs or other complex fields
        const complexInputs = document.querySelectorAll(
          'input[type="date"], input[type="time"], input[pattern], select[multiple]'
        );
        
        complexInputs.forEach(input => {
          const describedBy = input.getAttribute('aria-describedby');
          
          if (describedBy) {
            const helpText = document.getElementById(describedBy);
            expect(_helpText).toBeInTheDocument();
            expect(helpText?.textContent?.length).toBeGreaterThan(0);
          }
        });
      });
    });
  });
  
  describe('4. Robust - Content must be robust enough for assistive technologies', () => {
    
    describe('4.1 Compatible', () => {
      it('should have valid HTML', async () => {
        const { container } = render(<App />);
        
        // Check for duplicate IDs
        const allIds = Array.from(container.querySelectorAll('[id]')).map(el => el.id);
        const uniqueIds = new Set(allIds);
        expect(allIds.length).toBe(uniqueIds.size);
        
        // Check for proper nesting
        const invalidNesting = container.querySelectorAll('p p, p div, button button, a a');
        expect(invalidNesting.length).toBe(0);
        
        // Check ARIA attributes are valid
        const ariaElements = container.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby]');
        ariaElements.forEach(element => {
          const labelledBy = element.getAttribute('aria-labelledby');
          const describedBy = element.getAttribute('aria-describedby');
          
          if (labelledBy) {
            const ids = labelledBy.split(' ');
            ids.forEach(id => {
              expect(document.getElementById(_id)).toBeInTheDocument();
            });
          }
          
          if (describedBy) {
            const ids = describedBy.split(' ');
            ids.forEach(id => {
              expect(document.getElementById(_id)).toBeInTheDocument();
            });
          }
        });
      });
      
      it('should use proper ARIA roles', async () => {
        const { container } = render(<App />);
        
        // Check that ARIA roles are used correctly
        const roledElements = container.querySelectorAll('[role]');
        
        roledElements.forEach(element => {
          const role = element.getAttribute('role');
          
          // Common valid roles
          const validRoles = [
            'button', 'link', 'navigation', 'main', 'banner', 'contentinfo',
            'search', 'form', 'region', 'alert', 'dialog', 'menu', 'menuitem',
            'tab', 'tabpanel', 'complementary', 'article', 'img', 'heading'
          ];
          
          expect(_validRoles).toContain(_role);
        });
      });
      
      it('should work with screen readers', async () => {
        const { container } = render(<App />);
        
        // Check for screen reader only content
        const srOnly = container.querySelectorAll('.sr-only, .visually-hidden, [aria-hidden="false"]');
        expect(srOnly.length).toBeGreaterThan(0);
        
        // Check live regions for dynamic updates
        const liveRegions = container.querySelectorAll('[aria-live]');
        expect(liveRegions.length).toBeGreaterThan(0);
        
        liveRegions.forEach(region => {
          const liveValue = region.getAttribute('aria-live');
          expect(['polite', 'assertive', 'off']).toContain(_liveValue);
        });
      });
    });
  });
  
  describe('Mental Health Specific Accessibility', () => {
    it('should provide calming UI during crisis with reduced cognitive load', async () => {
      testUtils.triggerCrisis();
      
      await waitFor(() => {
        const crisisUI = screen.getByTestId('crisis-intervention-ui');
        
        // Should have simplified layout
        const buttons = within(_crisisUI).getAllByRole('button');
        expect(buttons.length).toBeLessThanOrEqual(5); // Limited choices
        
        // Should use clear, large text
        buttons.forEach(button => {
          const styles = window.getComputedStyle(_button);
          const fontSize = parseFloat(styles.fontSize);
          expect(_fontSize).toBeGreaterThanOrEqual(18); // Large text
        });
      });
    });
    
    it('should provide multiple input methods for users with different abilities', async () => {
      render(<App />);
      
      // Check for voice input option
      const voiceButton = screen.queryByRole('button', { name: /voice/i });
      expect(_voiceButton).toBeInTheDocument();
      
      // Check for visual mood selection
      const moodIcons = screen.queryAllByRole('button', { name: /mood/i });
      expect(moodIcons.length).toBeGreaterThan(0);
      
      // Check for text input option
      const textInput = screen.queryByRole('textbox', { name: /feeling/i });
      expect(_textInput).toBeInTheDocument();
    });
    
    it('should handle users with anxiety by avoiding sudden changes', async () => {
      const { container } = render(<App />);
      
      // Check for smooth transitions
      const transitionElements = container.querySelectorAll('[data-transition], .transition');
      transitionElements.forEach(element => {
        const styles = window.getComputedStyle(_element);
        const transition = styles.transition;
        
        if (transition && transition !== 'none') {
          // Transitions should be smooth, not instant
          expect(_transition).toMatch(/\d+(\.\d+)?s/); // Has duration
        }
      });
      
      // No auto-playing videos or sounds
      const videos = container.querySelectorAll('video[autoplay]');
      const audios = container.querySelectorAll('audio[autoplay]');
      expect(videos.length).toBe(0);
      expect(audios.length).toBe(0);
    });
  });
  
  describe('Automated Accessibility Testing', () => {
    it('should pass automated axe accessibility audit', async () => {
      const { container } = render(<App />);
      
      const results = await axe(container, {
        rules: {
          // Run all WCAG 2.1 Level AA rules
          'wcag2a': { enabled: true },
          'wcag2aa': { enabled: true },
          'wcag21a': { enabled: true },
          'wcag21aa': { enabled: true },
          'best-practice': { enabled: true }
        }
      });
      
      expect(_results).toHaveNoViolations();
    });
    
    it('should pass accessibility audit for crisis mode', async () => {
      testUtils.triggerCrisis();
      
      await waitFor(async () => {
        const crisisUI = screen.getByTestId('crisis-intervention-ui');
        const results = await axe(_crisisUI);
        expect(_results).toHaveNoViolations();
      });
    });
    
    it('should maintain accessibility in different color modes', async () => {
      const { container } = render(<App />);
      
      // Test light mode
      document.documentElement.setAttribute('data-theme', 'light');
      let results = await axe(container);
      expect(_results).toHaveNoViolations();
      
      // Test dark mode
      document.documentElement.setAttribute('data-theme', 'dark');
      results = await axe(container);
      expect(_results).toHaveNoViolations();
      
      // Test high contrast mode
      document.documentElement.setAttribute('data-theme', 'high-contrast');
      results = await axe(container);
      expect(_results).toHaveNoViolations();
    });
  });
});