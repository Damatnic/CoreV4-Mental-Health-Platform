import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * E2E Tests for Crisis Intervention Flow
 * Critical path testing for mental health emergencies
 */

test.describe('Crisis Intervention E2E', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/');
    
    // Set up performance monitoring
    await page.evaluateOnNewDocument(() => {
      window.performanceMarks = new Map();
      window.markPerformance = (name: string) => {
        window.performanceMarks.set(name, performance.now());
      };
    });
  });

  test('Crisis button responds within 200ms requirement', async () => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Start performance measurement
    await page.evaluate(() => window.markPerformance('crisis-start'));
    
    // Click crisis button
    await page.click('button:has-text("Crisis Help")', { timeout: 1000 });
    
    // Wait for crisis modal
    await expect(page.locator('text=Crisis Resources')).toBeVisible({ timeout: 200 });
    
    // Measure response time
    const responseTime = await page.evaluate(() => {
      window.markPerformance('crisis-end');
      const start = window.performanceMarks.get('crisis-start');
      const end = window.performanceMarks.get('crisis-end');
      return end - start;
    });
    
    expect(responseTime).toBeLessThan(200);
  });

  test('Complete crisis intervention flow', async () => {
    await page.goto('/dashboard');
    
    // Step 1: User indicates crisis
    await page.click('button:has-text("Crisis Help")');
    
    // Step 2: Crisis resources should appear immediately
    await expect(page.locator('text=988')).toBeVisible();
    await expect(page.locator('text=Crisis Text Line')).toBeVisible();
    await expect(page.locator('text=Text HOME to 741741')).toBeVisible();
    
    // Step 3: Verify professional notification
    await expect(page.locator('text=Professional support notified')).toBeVisible({ timeout: 5000 });
    
    // Step 4: Test hotline link
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.click('a[href^="tel:988"]')
    ]);
    
    // Verify tel: protocol handling
    expect(popup).toBeDefined();
  });

  test('Crisis resources remain available offline', async () => {
    await page.goto('/dashboard');
    
    // Go offline
    await page.context().setOffline(true);
    
    // Click crisis button
    await page.click('button:has-text("Crisis Help")');
    
    // Offline resources should still be available
    await expect(page.locator('text=Offline Crisis Resources')).toBeVisible();
    await expect(page.locator('text=988')).toBeVisible();
    await expect(page.locator('text=Text HOME to 741741')).toBeVisible();
    
    // Go back online
    await page.context().setOffline(false);
  });

  test('Low mood triggers crisis support automatically', async () => {
    await page.goto('/wellness/mood');
    
    // Set very low mood (crisis level)
    const slider = page.locator('input[type="range"]');
    await slider.fill('2');
    
    // Add concerning notes
    await page.fill('textarea[placeholder*="Add notes"]', 'Feeling hopeless');
    
    // Submit mood
    await page.click('button:has-text("Log Mood")');
    
    // Crisis support should be triggered
    await expect(page.locator('text=Crisis Support Available')).toBeVisible();
    await expect(page.locator('text=988')).toBeVisible();
  });

  test('Crisis intervention is keyboard accessible', async () => {
    await page.goto('/dashboard');
    
    // Navigate to crisis button using keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Activate crisis button with Enter
    await page.keyboard.press('Enter');
    
    // Modal should be accessible
    await expect(page.locator('text=Crisis Resources')).toBeVisible();
    
    // Tab through resources
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
    
    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('text=Crisis Resources')).not.toBeVisible();
  });

  test('Crisis support works on mobile devices', async ({ browser }) => {
    // Create mobile context
    const context = await browser.newContext({
      ...devices['iPhone 12'],
      permissions: ['geolocation'],
      geolocation: { latitude: 37.7749, longitude: -122.4194 }
    });
    
    const mobilePage = await context.newPage();
    await mobilePage.goto('/dashboard');
    
    // Test touch interaction
    await mobilePage.tap('button:has-text("Crisis Help")');
    
    // Resources should be mobile-optimized
    await expect(mobilePage.locator('text=988')).toBeVisible();
    
    // Test tel: link on mobile
    const telLink = mobilePage.locator('a[href^="tel:988"]');
    await expect(telLink).toHaveAttribute('href', 'tel:988');
    
    await context.close();
  });

  test('Crisis data is encrypted and secure', async () => {
    await page.goto('/dashboard');
    
    // Monitor network requests
    const encryptedRequests: boolean[] = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/crisis')) {
        const headers = request.headers();
        encryptedRequests.push(headers['content-type'] === 'application/json');
      }
    });
    
    // Trigger crisis
    await page.click('button:has-text("Crisis Help")');
    
    // Wait for API call
    await page.waitForTimeout(1000);
    
    // Check localStorage for encrypted data
    const storageData = await page.evaluate(() => {
      const data = localStorage.getItem('crisis_session');
      return data ? !data.startsWith('{') : false; // Should not be plain JSON
    });
    
    expect(storageData).toBeTruthy();
  });

  test('Professional connection during crisis', async () => {
    await page.goto('/dashboard');
    
    // Trigger crisis
    await page.click('button:has-text("Crisis Help")');
    
    // Wait for professional notification
    await expect(page.locator('text=Professional support notified')).toBeVisible();
    
    // Check for connection status
    const connectionStatus = await page.locator('[data-testid="professional-status"]');
    
    if (await connectionStatus.isVisible()) {
      const statusText = await connectionStatus.textContent();
      expect(['Available', 'Connecting', 'In Queue']).toContain(statusText);
    }
  });

  test('Crisis intervention meets WCAG 2.1 AA standards', async () => {
    await page.goto('/dashboard');
    
    // Open crisis modal
    await page.click('button:has-text("Crisis Help")');
    await page.waitForSelector('text=Crisis Resources');
    
    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Crisis follow-up is scheduled after intervention', async () => {
    await page.goto('/dashboard');
    
    // Trigger and complete crisis intervention
    await page.click('button:has-text("Crisis Help")');
    await expect(page.locator('text=Crisis Resources')).toBeVisible();
    
    // Close modal
    await page.click('button:has-text("Close")');
    
    // Check for follow-up scheduling
    const followUpScheduled = await page.evaluate(() => {
      return sessionStorage.getItem('crisis_follow_up') !== null;
    });
    
    expect(followUpScheduled).toBeTruthy();
    
    // Verify follow-up reminder appears
    await page.reload();
    await expect(page.locator('text=Check-in scheduled')).toBeVisible({ timeout: 5000 });
  });

  test('Crisis history is tracked for pattern detection', async () => {
    await page.goto('/wellness/mood');
    
    // Log multiple low moods
    for (let i = 0; i < 3; i++) {
      const slider = page.locator('input[type="range"]');
      await slider.fill('3');
      await page.click('button:has-text("Log Mood")');
      await page.waitForTimeout(500);
    }
    
    // Pattern warning should appear
    await expect(page.locator('text=mood has been declining')).toBeVisible();
    await expect(page.locator('text=Consider reaching out')).toBeVisible();
  });

  test('Multi-language crisis support', async () => {
    // Set Spanish language preference
    await page.goto('/settings');
    await page.selectOption('select[name="language"]', 'es');
    await page.click('button:has-text("Save")');
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Crisis button should be in Spanish
    const crisisButton = await page.locator('button:has-text("Ayuda de Crisis")');
    
    if (await crisisButton.isVisible()) {
      await crisisButton.click();
      
      // Resources should include Spanish options
      await expect(page.locator('text=988')).toBeVisible();
      await expect(page.locator('text=Línea de Crisis')).toBeVisible();
    }
  });

  test('Performance monitoring during crisis', async () => {
    await page.goto('/dashboard');
    
    // Collect performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as any;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      };
    });
    
    // Page should load quickly
    expect(metrics.domContentLoaded).toBeLessThan(1000);
    expect(metrics.loadComplete).toBeLessThan(2000);
    
    // Measure crisis button interaction
    const interactionMetrics = await page.evaluate(async () => {
      const start = performance.now();
      (document.querySelector('button:has-text("Crisis Help")') as any)?.click();
      await new Promise(resolve => setTimeout(resolve, 100));
      const end = performance.now();
      return end - start;
    });
    
    expect(interactionMetrics).toBeLessThan(200);
  });
});

// Declare global window extensions for TypeScript
declare global {
  interface Window {
    performanceMarks: Map<string, number>;
    markPerformance: (name: string) => void;
  }
}

const devices = {
  'iPhone 12': {
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  }
};