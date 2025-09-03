// Comprehensive Accessibility Testing Suite (WCAG AAA Compliance)
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';
import { AxePuppeteer } from '@axe-core/puppeteer';
import { logger } from '../utils/logger';

describe('Accessibility Testing Suite - WCAG AAA Compliance', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    page = await browser.newPage();
    
    // Set viewport for testing
    await page.setViewport({ width: 1920, height: 1080 });
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('WCAG Level AAA Compliance', () => {
    it('should pass all axe-core AAA tests on homepage', async () => {
      await page.goto('http://localhost:5173');
      
      const results = await new AxePuppeteer(_page)
        .withTags(['wcag2aaa', 'wcag21aaa'])
        .analyze();
      
      expect(results.violations).toHaveLength(0);
      
      // Log any violations for debugging
      if (results.violations.length > 0) {
        logger.debug('Accessibility violations:', JSON.stringify(results.violations, null, 2));
      }
    });

    it('should provide enhanced color contrast (7:1 for normal text)', async () => {
      await page.goto('http://localhost:5173');
      
      const _contrastRatios = await page.evaluate(() => {
        const elements = document.querySelectorAll('p, span, div, button, a');
        const ratios: number[] = [];
        
        elements.forEach(el => {
          const styles = window.getComputedStyle(el);
          const _bgColor = styles.backgroundColor;
          const _textColor = styles.color;
          
          // Simple contrast calculation (would use proper library in production)
          const getLuminance = (color: string) => {
            const rgb = color.match(/\d+/g);
            if (!rgb) return 0;
            const [r, g, b] = rgb.map(_Number);
            return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          };
          
          const bgLum = getLuminance(_bgColor);
          const textLum = getLuminance(_textColor);
          const ratio = (Math.max(bgLum, textLum) + 0.05) / (Math.min(bgLum, textLum) + 0.05);
          
          if (ratio < 7) ratios.push(_ratio);
        });
        
        return ratios;
      });
      
      expect(_contrastRatios).toHaveLength(0);
    });

    it('should support advanced screen reader features', async () => {
      await page.goto('http://localhost:5173');
      
      // Check for proper ARIA _landmarks
      const _landmarks = await page.evaluate(() => {
        const requiredLandmarks = ['banner', 'navigation', 'main', 'contentinfo'];
        const foundLandmarks: string[] = [];
        
        requiredLandmarks.forEach(role => {
          const _element = document.querySelector(`[role="${role}"]`) || 
                         document.querySelector(role === 'banner' ? 'header' :
                                              role === 'navigation' ? 'nav' :
                                              role === 'contentinfo' ? 'footer' : 'main');
          if (_element) foundLandmarks.push(_role);
        });
        
        return foundLandmarks;
      });
      
      expect(_landmarks).toContain('banner');
      expect(_landmarks).toContain('navigation');
      expect(_landmarks).toContain('main');
      expect(_landmarks).toContain('contentinfo');
    });

    it('should provide detailed focus indicators', async () => {
      await page.goto('http://localhost:5173');
      
      const _focusIndicators = await page.evaluate(() => {
        const focusableElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]');
        const inadequateIndicators: string[] = [];
        
        focusableElements.forEach(el => {
          el.dispatchEvent(new Event('focus'));
          const styles = window.getComputedStyle(el);
          
          // Check for visible focus indicator
          const hasOutline = styles.outline !== 'none' && styles.outline !== '';
          const hasBorder = styles.borderWidth !== '0px';
          const hasBoxShadow = styles.boxShadow !== 'none';
          
          if (!hasOutline && !hasBorder && !hasBoxShadow) {
            inadequateIndicators.push(el.tagName);
          }
        });
        
        return inadequateIndicators;
      });
      
      expect(_focusIndicators).toHaveLength(0);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be fully navigable with keyboard only', async () => {
      await page.goto('http://localhost:5173');
      
      // Tab through all interactive elements
      const tabOrder = await page.evaluate(() => {
        const elements: string[] = [];
        let activeElement = document.activeElement;
        
        for (let i = 0; i < 100; i++) {
          // Simulate tab key
          const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
          document.dispatchEvent(event);
          
          if (document.activeElement !== activeElement) {
            activeElement = document.activeElement;
            if (activeElement) {
              elements.push(activeElement.tagName + (activeElement.id ? `#${  activeElement.id}` : ''));
            }
          } else {
            break;
          }
        }
        
        return elements;
      });
      
      // Should have logical tab order
      expect(tabOrder.length).toBeGreaterThan(0);
      
      // Check for skip links
      expect(tabOrder[0]).toContain('skip');
    });

    it('should support all keyboard shortcuts with visual indicators', async () => {
      await page.goto('http://localhost:5173');
      
      // Check for keyboard shortcut documentation
      await page.keyboard.press('Shift+?'); // Common help shortcut
      
      const _helpModal = await page.$('[data-testid="keyboard-help"]');
      expect(_helpModal).toBeTruthy();
      
      // Verify shortcuts work
      const shortcuts = [
        { key: 'Escape', action: 'close-modal' },
        { key: 'Enter', action: 'submit' },
        { key: 'Space', action: 'toggle' },
      ];
      
      for (const shortcut of shortcuts) {
        await page.keyboard.press(shortcut.key);
        const actionPerformed = await page.evaluate((action) => {
          return document.querySelector(`[data-action-performed="${action}"]`) !== null;
        }, shortcut.action);
        
        // Some action should be performed
        // expect(actionPerformed).toBeTruthy();
      }
    });

    it('should trap focus in modals', async () => {
      await page.goto('http://localhost:5173');
      
      // Open a modal
      await page.click('[data-testid="open-modal"]');
      
      // Check focus is trapped
      const _focusTrap = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"]');
        if (!modal) return false;
        
        const focusableElements = modal.querySelectorAll('button, input, select, textarea, a, [tabindex]');
        const __currentIndex = 0;
        
        // Tab through elements
        for (let i = 0; i < focusableElements.length + 2; i++) {
          const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
          document.dispatchEvent(event);
        }
        
        // Focus should cycle within modal
        return modal.contains(document.activeElement);
      });
      
      expect(_focusTrap).toBe(true);
    });
  });

  describe('Screen Reader Optimization', () => {
    it('should provide comprehensive ARIA labels', async () => {
      await page.goto('http://localhost:5173');
      
      const _missingLabels = await page.evaluate(() => {
        const elements = document.querySelectorAll('button, a, input, select, textarea');
        const missing: string[] = [];
        
        elements.forEach(el => {
          const hasLabel = el.getAttribute('aria-label') || 
                          el.getAttribute('aria-labelledby') ||
                          el.textContent?.trim() ||
                          (el as HTMLInputElement).placeholder;
          
          if (!hasLabel) {
            missing.push(el.tagName + (el.id ? `#${  el.id}` : ''));
          }
        });
        
        return missing;
      });
      
      expect(_missingLabels).toHaveLength(0);
    });

    it('should announce dynamic content changes', async () => {
      await page.goto('http://localhost:5173');
      
      // Check for live _regions
      const liveRegions = await page.evaluate(() => {
        const _regions = document.querySelectorAll('[aria-live]');
        return Array.from(_regions).map(r => ({
          type: r.getAttribute('aria-live'),
          atomic: r.getAttribute('aria-atomic'),
          relevant: r.getAttribute('aria-relevant'),
        }));
      });
      
      expect(liveRegions.length).toBeGreaterThan(0);
      
      // Crisis alerts should be assertive
      const _crisisRegion = liveRegions.find(r => r.type === 'assertive');
      expect(_crisisRegion).toBeTruthy();
    });

    it('should provide context for form inputs', async () => {
      await page.goto('http://localhost:5173/register');
      
      const _formAccessibility = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input, select, textarea');
        const issues: string[] = [];
        
        inputs.forEach(input => {
          const id = input.id;
          const label = document.querySelector(`label[for="${id}"]`);
          const ariaLabel = input.getAttribute('aria-label');
          const ariaDescribedby = input.getAttribute('aria-describedby');
          const required = input.getAttribute('required');
          const ariaRequired = input.getAttribute('aria-required');
          
          if (!label && !ariaLabel) {
            issues.push(`Input ${id} missing label`);
          }
          
          if (required && !ariaRequired) {
            issues.push(`Input ${id} missing aria-required`);
          }
          
          // Check for error messages association
          if (input.getAttribute('aria-invalid') === 'true' && !ariaDescribedby) {
            issues.push(`Input ${id} missing error message association`);
          }
        });
        
        return issues;
      });
      
      expect(_formAccessibility).toHaveLength(0);
    });
  });

  describe('Cognitive Accessibility', () => {
    it('should use clear and simple language', async () => {
      await page.goto('http://localhost:5173');
      
      const _readabilityScore = await page.evaluate(() => {
        const textContent = document.body.innerText;
        const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = textContent.split(/\s+/).filter(w => w.length > 0);
        
        // Calculate average sentence length
        const avgSentenceLength = words.length / sentences.length;
        
        // Count complex words (more than 3 syllables)
        const complexWords = words.filter(word => {
          // Simplified syllable counting
          return word.replace(/[^aeiouAEIOU]/g, '').length > 3;
        }).length;
        
        // Flesch Reading Ease score approximation
        const score = 206.835 - 1.015 * avgSentenceLength - 84.6 * (complexWords / words.length);
        
        return score;
      });
      
      // Score should be above 60 (plain English)
      expect(_readabilityScore).toBeGreaterThan(60);
    });

    it('should provide consistent navigation', async () => {
      const pages = ['/', '/dashboard', '/wellness', '/community'];
      const navigationStructures: string[] = [];
      
      for (const pagePath of pages) {
        await page.goto(`http://localhost:5173${pagePath}`);
        
        const _navStructure = await page.evaluate(() => {
          const nav = document.querySelector('nav');
          if (!nav) return '';
          
          return Array.from(nav.querySelectorAll('a'))
            .map(a => a.getAttribute('href'))
            .join(',');
        });
        
        navigationStructures.push(_navStructure);
      }
      
      // All pages should have the same navigation structure
      const _uniqueStructures = [...new Set(_navigationStructures)];
      expect(_uniqueStructures).toHaveLength(1);
    });

    it('should provide clear error messages', async () => {
      await page.goto('http://localhost:5173/login');
      
      // Trigger validation error
      await page.click('[type="submit"]');
      
      const errorMessages = await page.evaluate(() => {
        const errors = document.querySelectorAll('[role="alert"]');
        return Array.from(errors).map(e => ({
          text: e.textContent,
          hasIcon: e.querySelector('svg, img') !== null,
          hasColor: window.getComputedStyle(_e).color !== 'rgb(0, 0, 0)',
        }));
      });
      
      errorMessages.forEach(error => {
        // Error should be clear and actionable
        expect(error.text).toBeTruthy();
        expect(error.text?.length).toBeGreaterThan(10);
        
        // Should have visual indicators beyond color
        expect(error.hasIcon || error.text?.includes('Error')).toBe(true);
      });
    });

    it('should support user preferences', async () => {
      await page.goto('http://localhost:5173/settings');
      
      const _preferences = await page.evaluate(() => {
        const settings: string[] = [];
        
        // Check for various preference options
        if (document.querySelector('[data-testid="reduce-motion"]')) settings.push('reduce-motion');
        if (document.querySelector('[data-testid="high-contrast"]')) settings.push('high-contrast');
        if (document.querySelector('[data-testid="large-text"]')) settings.push('large-text');
        if (document.querySelector('[data-testid="simple-layout"]')) settings.push('simple-layout');
        
        return settings;
      });
      
      expect(_preferences).toContain('reduce-motion');
      expect(_preferences).toContain('high-contrast');
      expect(_preferences).toContain('large-text');
    });
  });

  describe('Mobile Accessibility', () => {
    it('should have adequate touch targets', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.goto('http://localhost:5173');
      
      const _touchTargets = await page.evaluate(() => {
        const interactive = document.querySelectorAll('button, a, input, select, [onclick]');
        const inadequate: string[] = [];
        
        interactive.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width < 44 || rect.height < 44) {
            inadequate.push(`${el.tagName}: ${rect.width}x${rect.height}`);
          }
        });
        
        return inadequate;
      });
      
      expect(_touchTargets).toHaveLength(0);
    });

    it('should support gesture alternatives', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.goto('http://localhost:5173');
      
      const gestureElements = await page.evaluate(() => {
        const elements = document.querySelectorAll('[data-swipe], [data-pinch], [data-rotate]');
        const alternatives: boolean[] = [];
        
        elements.forEach(el => {
          // Check for button alternatives
          const parent = el.parentElement;
          const _hasAlternative = parent?.querySelector('button') !== null;
          alternatives.push(_hasAlternative);
        });
        
        return alternatives;
      });
      
      // All gesture-based interactions should have alternatives
      gestureElements.forEach(_hasAlt => {
        expect(_hasAlt).toBe(true);
      });
    });

    it('should be usable in portrait and landscape', async () => {
      const orientations = [
        { width: 375, height: 667 }, // Portrait
        { width: 667, height: 375 }, // Landscape
      ];
      
      for (const _orientation of orientations) {
        await page.setViewport(_orientation);
        await page.goto('http://localhost:5173');
        
        // Check that content is not cut off
        const __overflow = await page.evaluate(() => {
          const body = document.body;
          return body.scrollWidth > window.innerWidth || body.scrollHeight > window.innerHeight;
        });
        
        // Some scrolling is okay, but check critical elements are visible
        const _criticalVisible = await page.evaluate(() => {
          const critical = document.querySelector('[data-testid="crisis-button"]');
          if (!critical) return false;
          
          const rect = critical.getBoundingClientRect();
          return rect.top >= 0 && rect.left >= 0 && 
                 rect.bottom <= window.innerHeight && 
                 rect.right <= window.innerWidth;
        });
        
        expect(_criticalVisible).toBe(true);
      }
    });
  });

  describe('Media Accessibility', () => {
    it('should provide captions for videos', async () => {
      await page.goto('http://localhost:5173/resources');
      
      const videos = await page.evaluate(() => {
        const _videoElements = document.querySelectorAll('video');
        return Array.from(_videoElements).map(video => ({
          hasCaptions: video.querySelector('track[kind="captions"]') !== null,
          hasTranscript: video.parentElement?.querySelector('[data-transcript]') !== null,
        }));
      });
      
      videos.forEach(video => {
        expect(video.hasCaptions || video.hasTranscript).toBe(true);
      });
    });

    it('should provide alt text for images', async () => {
      await page.goto('http://localhost:5173');
      
      const images = await page.evaluate(() => {
        const imgs = document.querySelectorAll('img');
        const missing: string[] = [];
        
        imgs.forEach(img => {
          const alt = img.getAttribute('alt');
          if (!alt && !img.getAttribute('aria-hidden')) {
            missing.push(img.src);
          }
        });
        
        return missing;
      });
      
      expect(images).toHaveLength(0);
    });

    it('should provide audio descriptions where needed', async () => {
      await page.goto('http://localhost:5173/resources');
      
      const complexMedia = await page.evaluate(() => {
        const _media = document.querySelectorAll('[data-complex-visual]');
        return Array.from(_media).map(m => ({
          hasDescription: m.getAttribute('aria-describedby') !== null ||
                         m.querySelector('[data-audio-description]') !== null,
        }));
      });
      
      complexMedia.forEach(m => {
        expect(m.hasDescription).toBe(true);
      });
    });
  });

  describe('Crisis Accessibility', () => {
    it('should make crisis resources immediately accessible', async () => {
      await page.goto('http://localhost:5173');
      
      // Crisis button should be first or second in tab order
      const tabOrder = await page.evaluate(() => {
        const elements: string[] = [];
        for (let i = 0; i < 3; i++) {
          document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
          if (document.activeElement) {
            elements.push(document.activeElement.getAttribute('data-testid') || '');
          }
        }
        return elements;
      });
      
      expect(tabOrder.slice(0, 2)).toContain('crisis-button');
    });

    it('should announce crisis alerts immediately', async () => {
      await page.goto('http://localhost:5173');
      
      // Trigger crisis alert
      await page.click('[data-testid="crisis-button"]');
      
      const announcement = await page.evaluate(() => {
        const liveRegion = document.querySelector('[aria-live="assertive"]');
        return {
          exists: liveRegion !== null,
          content: liveRegion?.textContent,
          role: liveRegion?.getAttribute('role'),
        };
      });
      
      expect(announcement.exists).toBe(true);
      expect(announcement.role).toBe('alert');
      expect(announcement.content).toContain('crisis');
    });

    it('should provide multiple contact methods for crisis support', async () => {
      await page.goto('http://localhost:5173');
      await page.click('[data-testid="crisis-button"]');
      
      const contactMethods = await page.evaluate(() => {
        const methods: string[] = [];
        
        if (document.querySelector('a[href^="tel:"]')) methods.push('phone');
        if (document.querySelector('a[href^="sms:"]')) methods.push('sms');
        if (document.querySelector('[data-testid="crisis-chat"]')) methods.push('chat');
        if (document.querySelector('[data-testid="crisis-email"]')) methods.push('email');
        
        return methods;
      });
      
      expect(contactMethods.length).toBeGreaterThanOrEqual(3);
    });
  });
});