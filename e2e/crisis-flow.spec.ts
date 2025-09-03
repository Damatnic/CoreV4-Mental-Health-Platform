// End-to-End Tests for Crisis Flow
import { test, expect } from '@playwright/test';

// Crisis response must be under 200ms
const CRISIS_RESPONSE_THRESHOLD = 200;

test.describe('Crisis Intervention Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to be fully loaded
    await page.waitForSelector('[data-testid="app-ready"]', { timeout: 5000 });
  });

  test('should display crisis button prominently on all pages', async ({ page }) => {
    // Check crisis button on home page
    const crisisButton = page.locator('[data-testid="crisis-button"]');
    await expect(crisisButton).toBeVisible();
    await expect(crisisButton).toHaveCSS('position', 'fixed');
    
    // Navigate to different pages and verify button persists
    const pages = ['/dashboard', '/wellness', '/community', '/professionals'];
    
    for (const route of pages) {
      await page.goto(route);
      await expect(crisisButton).toBeVisible();
      
      // Verify button is always accessible (z-index)
      const zIndex = await crisisButton.evaluate(el => 
        window.getComputedStyle(el).zIndex
      );
      expect(parseInt(zIndex)).toBeGreaterThan(1000);
    }
  });

  test('should respond to crisis trigger within 200ms', async ({ page }) => {
    const crisisButton = page.locator('[data-testid="crisis-button"]');
    
    // Measure response time
    const startTime = Date.now();
    await crisisButton.click();
    
    // Wait for crisis modal to appear
    await page.waitForSelector('[data-testid="crisis-modal"]');
    const responseTime = Date.now() - startTime;
    
    expect(responseTime).toBeLessThan(CRISIS_RESPONSE_THRESHOLD);
    
    // Verify crisis resources are immediately visible
    await expect(page.locator('text=988')).toBeVisible();
    await expect(page.locator('text=Crisis Text Line')).toBeVisible();
  });

  test('should provide multiple crisis contact methods', async ({ page }) => {
    await page.click('[data-testid="crisis-button"]');
    
    // Phone hotline
    const hotlineLink = page.locator('a[href="tel:988"]');
    await expect(hotlineLink).toBeVisible();
    await expect(hotlineLink).toHaveText(/988/);
    
    // Text support
    const textSupport = page.locator('text=Text HOME to 741741');
    await expect(textSupport).toBeVisible();
    
    // Online chat option
    const chatOption = page.locator('[data-testid="crisis-chat"]');
    await expect(chatOption).toBeVisible();
    
    // Local emergency resources
    const localResources = page.locator('[data-testid="local-resources"]');
    await expect(localResources).toBeVisible();
  });

  test('should work offline with cached crisis resources', async ({ page, context }) => {
    // Load page first to cache resources
    await page.goto('/');
    await page.click('[data-testid="crisis-button"]');
    await page.click('[data-testid="crisis-close"]');
    
    // Go offline
    await context.setOffline(true);
    
    // Crisis button should still work
    await page.click('[data-testid="crisis-button"]');
    
    // Offline crisis resources should be available
    await expect(page.locator('text=988')).toBeVisible();
    await expect(page.locator('text=Offline Resources Available')).toBeVisible();
    
    // Verify cached resources
    const resources = await page.locator('[data-testid="offline-resources"]').textContent();
    expect(resources).toContain('988');
    expect(resources).toContain('741741');
  });

  test('should alert professionals when crisis is triggered', async ({ page }) => {
    // Login as a user with professional support enabled
    await page.goto('/login');
    await page.fill('[name="email"]', 'patient@example.com');
    await page.fill('[name="password"]', 'Test123!');
    await page.click('[type="submit"]');
    
    await page.waitForURL('/dashboard');
    
    // Trigger crisis
    await page.click('[data-testid="crisis-button"]');
    
    // Verify professional alert notification
    await expect(page.locator('text=Professional support has been notified')).toBeVisible();
    
    // Check for professional response indicator
    await expect(page.locator('[data-testid="professional-responding"]')).toBeVisible();
  });

  test('should track crisis events for safety monitoring', async ({ page }) => {
    // Enable analytics tracking
    await page.evaluate(() => {
      window.localStorage.setItem('analytics_consent', 'true');
    });
    
    // Intercept analytics calls
    interface AnalyticsEvent {
      category: string;
      action: string;
      timestamp?: number;
      [key: string]: unknown;
    }
    const analyticsRequests: AnalyticsEvent[] = [];
    await page.route('**/api/analytics/event', async route => {
      const request = route.request();
      analyticsRequests.push(await request.postDataJSON() as AnalyticsEvent);
      await route.fulfill({ status: 200, body: '{"tracked": true}' });
    });
    
    // Trigger crisis
    await page.click('[data-testid="crisis-button"]');
    
    // Verify analytics event was sent
    await page.waitForTimeout(100);
    const crisisEvent = analyticsRequests.find(r => r.category === 'crisis');
    expect(crisisEvent).toBeDefined();
    expect(crisisEvent.action).toBe('button_clicked');
    expect(crisisEvent.timestamp).toBeDefined();
  });

  test('should provide crisis text alternatives for accessibility', async ({ page }) => {
    await page.click('[data-testid="crisis-button"]');
    
    // Check for screen reader announcements
    const ariaLive = page.locator('[aria-live="assertive"]');
    await expect(ariaLive).toContainText(/crisis support/i);
    
    // Verify all crisis options have text alternatives
    const images = page.locator('[data-testid="crisis-modal"] img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const altText = await img.getAttribute('alt');
      expect(altText).toBeTruthy();
    }
    
    // Check keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focusedElement).toBeTruthy();
  });

  test('should handle crisis escalation workflow', async ({ page }) => {
    await page.click('[data-testid="crisis-button"]');
    
    // Initial self-help resources
    await expect(page.locator('[data-testid="self-help-resources"]')).toBeVisible();
    
    // Escalate to professional support
    await page.click('[data-testid="need-more-help"]');
    await expect(page.locator('[data-testid="professional-options"]')).toBeVisible();
    
    // Further escalate to emergency
    await page.click('[data-testid="emergency-help"]');
    await expect(page.locator('[data-testid="emergency-resources"]')).toBeVisible();
    await expect(page.locator('text=Call 911')).toBeVisible();
  });

  test('should maintain crisis state across page navigation', async ({ page }) => {
    // Trigger crisis mode
    await page.click('[data-testid="crisis-button"]');
    await page.click('[data-testid="activate-crisis-mode"]');
    
    // Navigate to different page
    await page.goto('/wellness');
    
    // Crisis mode should persist
    await expect(page.locator('[data-testid="crisis-mode-active"]')).toBeVisible();
    
    // Crisis resources should remain easily accessible
    const crisisBar = page.locator('[data-testid="crisis-resource-bar"]');
    await expect(crisisBar).toBeVisible();
    await expect(crisisBar).toContainText('988');
  });

  test('should validate crisis response on mobile devices', async ({ _page, browser }) => {
    // Create mobile context
    const iPhone = {
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      hasTouch: true,
      isMobile: true,
    };
    
    const context = await browser.newContext(iPhone);
    const mobilePage = await context.newPage();
    
    await mobilePage.goto('/');
    
    // Crisis button should be thumb-reachable
    const crisisButton = mobilePage.locator('[data-testid="crisis-button"]');
    const buttonBox = await crisisButton.boundingBox();
    
    // Button should be in lower portion of screen for thumb reach
    expect(buttonBox?.y).toBeGreaterThan(400);
    
    // Minimum touch target size (44x44 pixels)
    expect(buttonBox?.width).toBeGreaterThanOrEqual(44);
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
    
    // Test touch interaction
    await crisisButton.tap();
    await expect(mobilePage.locator('[data-testid="crisis-modal"]')).toBeVisible();
    
    await context.close();
  });
});

test.describe('Crisis Recovery and Follow-up', () => {
  test('should provide post-crisis check-in', async ({ page }) => {
    // Simulate crisis event
    await page.goto('/');
    await page.click('[data-testid="crisis-button"]');
    await page.click('[data-testid="crisis-resolved"]');
    
    // Wait for follow-up prompt (simulated delay)
    await page.waitForTimeout(2000);
    
    // Check-in notification should appear
    await expect(page.locator('[data-testid="crisis-checkin"]')).toBeVisible();
    await expect(page.locator('text=How are you feeling now?')).toBeVisible();
    
    // Provide feedback
    await page.click('[data-testid="feeling-better"]');
    
    // Verify support resources are offered
    await expect(page.locator('[data-testid="follow-up-resources"]')).toBeVisible();
  });

  test('should save crisis intervention history for professionals', async ({ page }) => {
    // Login as professional
    await page.goto('/login');
    await page.fill('[name="email"]', 'professional@example.com');
    await page.fill('[name="password"]', 'Test123!');
    await page.click('[type="submit"]');
    
    await page.goto('/professional/dashboard');
    
    // View crisis interventions
    await page.click('[data-testid="crisis-interventions"]');
    
    // Verify intervention history is displayed
    const interventions = page.locator('[data-testid="intervention-item"]');
    await expect(interventions).toHaveCount(3); // Based on mock data
    
    // Check intervention details
    await interventions.first().click();
    await expect(page.locator('[data-testid="intervention-details"]')).toBeVisible();
    await expect(page.locator('text=Response Time')).toBeVisible();
    await expect(page.locator('text=Outcome')).toBeVisible();
  });
});

test.describe('Crisis System Performance', () => {
  test('should handle multiple simultaneous crisis triggers', async ({ browser }) => {
    const contexts = [];
    const pages = [];
    
    // Create 10 concurrent users
    for (let i = 0; i < 10; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      contexts.push(context);
      pages.push(page);
      await page.goto('/');
    }
    
    // Trigger crisis simultaneously
    const promises = pages.map(async page => {
      const startTime = Date.now();
      await page.click('[data-testid="crisis-button"]');
      await page.waitForSelector('[data-testid="crisis-modal"]');
      return Date.now() - startTime;
    });
    
    const responseTimes = await Promise.all(promises);
    
    // All responses should be under threshold
    responseTimes.forEach(time => {
      expect(time).toBeLessThan(CRISIS_RESPONSE_THRESHOLD * 2); // Allow some overhead for concurrent requests
    });
    
    // Cleanup
    for (const context of contexts) {
      await context.close();
    }
  });

  test('should prioritize crisis requests over other operations', async ({ page }) => {
    // Start a heavy operation
    await page.goto('/analytics');
    await page.click('[data-testid="generate-report"]'); // Long-running operation
    
    // Immediately trigger crisis
    const startTime = Date.now();
    await page.click('[data-testid="crisis-button"]');
    await page.waitForSelector('[data-testid="crisis-modal"]');
    const responseTime = Date.now() - startTime;
    
    // Crisis should interrupt and respond quickly
    expect(responseTime).toBeLessThan(CRISIS_RESPONSE_THRESHOLD);
    
    // Verify heavy operation was paused
    await expect(page.locator('text=Report generation paused')).toBeVisible();
  });
});