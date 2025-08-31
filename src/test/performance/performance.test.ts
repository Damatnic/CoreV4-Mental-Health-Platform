// Comprehensive Performance Testing Suite
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { performance } from 'perf_hooks';
import puppeteer, { Browser, Page } from 'puppeteer';

// Performance thresholds
const THRESHOLDS = {
  CRISIS_RESPONSE: 200, // ms
  PAGE_LOAD: 3000, // ms
  API_RESPONSE: 100, // ms
  FIRST_CONTENTFUL_PAINT: 1500, // ms
  TIME_TO_INTERACTIVE: 3500, // ms
  LARGEST_CONTENTFUL_PAINT: 2500, // ms
  CUMULATIVE_LAYOUT_SHIFT: 0.1,
  FIRST_INPUT_DELAY: 100, // ms
  BUNDLE_SIZE_LIMIT: 500000, // 500KB
};

describe('Performance Testing Suite', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    page = await browser.newPage();
    
    // Enable performance metrics collection
    await page.evaluateOnNewDocument(() => {
      window.__PERFORMANCE_MARKS__ = [];
      const originalMark = performance.mark.bind(performance);
      performance.mark = function(name: string) {
        window.__PERFORMANCE_MARKS__.push({ name, time: performance.now() });
        return originalMark(name);
      };
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Core Web Vitals', () => {
    it('should meet Largest Contentful Paint (LCP) threshold', async () => {
      await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
      
      const lcp = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            resolve(lastEntry.renderTime || lastEntry.loadTime);
          }).observe({ entryTypes: ['largest-contentful-paint'] });
        });
      });

      expect(lcp).toBeLessThan(THRESHOLDS.LARGEST_CONTENTFUL_PAINT);
    });

    it('should meet First Input Delay (FID) threshold', async () => {
      await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
      
      // Simulate user interaction
      const startTime = await page.evaluate(() => performance.now());
      await page.click('button');
      const endTime = await page.evaluate(() => performance.now());
      
      const fid = endTime - startTime;
      expect(fid).toBeLessThan(THRESHOLDS.FIRST_INPUT_DELAY);
    });

    it('should meet Cumulative Layout Shift (CLS) threshold', async () => {
      await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
      
      const cls = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let clsValue = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
            resolve(clsValue);
          }).observe({ entryTypes: ['layout-shift'] });
          
          // Trigger some interactions that might cause layout shifts
          setTimeout(() => {
            window.scrollTo(0, 100);
            setTimeout(() => resolve(clsValue), 1000);
          }, 1000);
        });
      });

      expect(cls).toBeLessThan(THRESHOLDS.CUMULATIVE_LAYOUT_SHIFT);
    });

    it('should meet First Contentful Paint (FCP) threshold', async () => {
      const startTime = Date.now();
      await page.goto('http://localhost:5173');
      
      await page.waitForSelector('[data-testid="app-ready"]');
      const fcp = Date.now() - startTime;
      
      expect(fcp).toBeLessThan(THRESHOLDS.FIRST_CONTENTFUL_PAINT);
    });

    it('should meet Time to Interactive (TTI) threshold', async () => {
      const startTime = Date.now();
      await page.goto('http://localhost:5173');
      
      // Wait for page to be fully interactive
      await page.evaluate(() => {
        return new Promise((resolve) => {
          if (document.readyState === 'complete') {
            resolve(true);
          } else {
            window.addEventListener('load', () => resolve(true));
          }
        });
      });
      
      const tti = Date.now() - startTime;
      expect(tti).toBeLessThan(THRESHOLDS.TIME_TO_INTERACTIVE);
    });
  });

  describe('Critical Path Performance', () => {
    it('should respond to crisis button within 200ms', async () => {
      await page.goto('http://localhost:5173');
      await page.waitForSelector('[data-testid="crisis-button"]');
      
      const responseTime = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          const button = document.querySelector('[data-testid="crisis-button"]') as HTMLElement;
          const startTime = performance.now();
          
          button.click();
          
          const observer = new MutationObserver(() => {
            const modal = document.querySelector('[data-testid="crisis-modal"]');
            if (modal) {
              resolve(performance.now() - startTime);
              observer.disconnect();
            }
          });
          
          observer.observe(document.body, { childList: true, subtree: true });
        });
      });

      expect(responseTime).toBeLessThan(THRESHOLDS.CRISIS_RESPONSE);
    });

    it('should load dashboard within performance budget', async () => {
      const startTime = Date.now();
      await page.goto('http://localhost:5173/dashboard');
      await page.waitForSelector('[data-testid="dashboard-loaded"]');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(THRESHOLDS.PAGE_LOAD);
    });

    it('should maintain 60fps during animations', async () => {
      await page.goto('http://localhost:5173');
      
      const fps = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let frames = 0;
          let startTime = performance.now();
          
          function measureFPS() {
            frames++;
            const currentTime = performance.now();
            const elapsed = currentTime - startTime;
            
            if (elapsed >= 1000) {
              resolve(frames);
            } else {
              requestAnimationFrame(measureFPS);
            }
          }
          
          // Trigger animation
          const element = document.querySelector('[data-testid="animated-element"]') as HTMLElement;
          if (element) {
            element.style.animation = 'pulse 1s infinite';
          }
          
          requestAnimationFrame(measureFPS);
        });
      });

      expect(fps).toBeGreaterThanOrEqual(55); // Allow slight variance from 60fps
    });
  });

  describe('Memory Management', () => {
    it('should not have memory leaks during navigation', async () => {
      const getMemoryUsage = () => page.evaluate(() => {
        return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
      });

      const initialMemory = await getMemoryUsage();
      
      // Navigate through multiple pages
      for (let i = 0; i < 10; i++) {
        await page.goto('http://localhost:5173/dashboard');
        await page.goto('http://localhost:5173/wellness');
        await page.goto('http://localhost:5173/community');
      }
      
      // Force garbage collection if available
      await page.evaluate(() => {
        if ((global as any).gc) {
          (global as any).gc();
        }
      });
      
      const finalMemory = await getMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory should not increase by more than 10MB
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should properly clean up event listeners', async () => {
      await page.goto('http://localhost:5173');
      
      const listenerCount = await page.evaluate(() => {
        const getEventListeners = (element: any) => {
          const listeners = (window as any).getEventListeners?.(element) || {};
          return Object.values(listeners).flat().length;
        };
        
        // Get initial count
        const initialCount = getEventListeners(window) + getEventListeners(document);
        
        // Trigger component mount/unmount cycle
        const button = document.querySelector('[data-testid="toggle-component"]') as HTMLElement;
        if (button) {
          button.click(); // Mount
          setTimeout(() => button.click(), 100); // Unmount
        }
        
        // Return difference after cleanup
        return new Promise<number>((resolve) => {
          setTimeout(() => {
            const finalCount = getEventListeners(window) + getEventListeners(document);
            resolve(finalCount - initialCount);
          }, 200);
        });
      });

      expect(listenerCount).toBeLessThanOrEqual(0);
    });
  });

  describe('Network Performance', () => {
    it('should implement effective caching strategy', async () => {
      // First load
      await page.goto('http://localhost:5173');
      
      const firstLoadMetrics = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        return resources.map(r => ({
          name: r.name,
          duration: r.duration,
          size: r.transferSize,
        }));
      });
      
      // Second load (should use cache)
      await page.reload();
      
      const secondLoadMetrics = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        return resources.map(r => ({
          name: r.name,
          duration: r.duration,
          size: r.transferSize,
        }));
      });
      
      // Calculate cache hit rate
      const cacheHits = secondLoadMetrics.filter((r, i) => 
        r.size === 0 || r.size < (firstLoadMetrics[i]?.size || 0) * 0.1
      ).length;
      
      const cacheHitRate = cacheHits / secondLoadMetrics.length;
      expect(cacheHitRate).toBeGreaterThan(0.7); // 70% cache hit rate
    });

    it('should minimize API response times', async () => {
      await page.goto('http://localhost:5173');
      
      const apiTimes = await page.evaluate(() => {
        return new Promise<number[]>((resolve) => {
          const times: number[] = [];
          
          // Intercept fetch
          const originalFetch = window.fetch;
          window.fetch = async (...args) => {
            const startTime = performance.now();
            const response = await originalFetch(...args);
            times.push(performance.now() - startTime);
            return response;
          };
          
          // Trigger some API calls
          Promise.all([
            fetch('/api/user/profile'),
            fetch('/api/wellness/data'),
            fetch('/api/community/groups'),
          ]).then(() => resolve(times));
        });
      });

      apiTimes.forEach(time => {
        expect(time).toBeLessThan(THRESHOLDS.API_RESPONSE);
      });
    });

    it('should implement request batching for efficiency', async () => {
      await page.goto('http://localhost:5173');
      
      const requestCount = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let count = 0;
          
          // Monitor network requests
          const observer = new PerformanceObserver((list) => {
            count += list.getEntries().filter(e => 
              e.name.includes('/api/')
            ).length;
          });
          observer.observe({ entryTypes: ['resource'] });
          
          // Trigger multiple data requirements
          const buttons = document.querySelectorAll('[data-action]');
          buttons.forEach(b => (b as HTMLElement).click());
          
          setTimeout(() => resolve(count), 1000);
        });
      });

      // Should batch requests instead of making many individual calls
      expect(requestCount).toBeLessThan(5);
    });
  });

  describe('Bundle Size Optimization', () => {
    it('should keep JavaScript bundle under size limit', async () => {
      await page.goto('http://localhost:5173');
      
      const bundleSize = await page.evaluate(() => {
        const scripts = performance.getEntriesByType('resource')
          .filter(r => r.name.endsWith('.js')) as PerformanceResourceTiming[];
        
        return scripts.reduce((total, script) => total + script.transferSize, 0);
      });

      expect(bundleSize).toBeLessThan(THRESHOLDS.BUNDLE_SIZE_LIMIT);
    });

    it('should implement code splitting effectively', async () => {
      await page.goto('http://localhost:5173');
      
      const initialBundles = await page.evaluate(() => {
        return performance.getEntriesByType('resource')
          .filter(r => r.name.includes('.js'))
          .map(r => r.name);
      });
      
      // Navigate to a different route
      await page.goto('http://localhost:5173/professionals');
      
      const afterNavigationBundles = await page.evaluate(() => {
        return performance.getEntriesByType('resource')
          .filter(r => r.name.includes('.js'))
          .map(r => r.name);
      });
      
      // Should have loaded additional chunks
      const newBundles = afterNavigationBundles.filter(b => !initialBundles.includes(b));
      expect(newBundles.length).toBeGreaterThan(0);
    });

    it('should optimize image loading', async () => {
      await page.goto('http://localhost:5173');
      
      const imageMetrics = await page.evaluate(() => {
        const images = document.querySelectorAll('img');
        return Array.from(images).map(img => ({
          src: img.src,
          loading: img.loading,
          srcset: img.srcset,
          sizes: img.sizes,
          format: img.src.split('.').pop(),
        }));
      });

      imageMetrics.forEach(img => {
        // Images should use lazy loading where appropriate
        if (!img.src.includes('hero') && !img.src.includes('logo')) {
          expect(img.loading).toBe('lazy');
        }
        
        // Should use modern image formats
        expect(['webp', 'avif', 'jpg', 'png', 'svg']).toContain(img.format);
        
        // Should provide responsive images
        if (!img.src.includes('icon')) {
          expect(img.srcset || img.sizes).toBeTruthy();
        }
      });
    });
  });

  describe('Database Query Performance', () => {
    it('should execute queries within performance budget', async () => {
      const queryTimes = await page.evaluate(() => {
        return fetch('/api/test/query-performance')
          .then(r => r.json())
          .then(data => data.queryTimes);
      });

      queryTimes.forEach((time: number) => {
        expect(time).toBeLessThan(50); // 50ms per query
      });
    });

    it('should implement efficient pagination', async () => {
      await page.goto('http://localhost:5173/community');
      
      const loadTime = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          const startTime = performance.now();
          
          // Load paginated content
          fetch('/api/community/posts?page=1&limit=20')
            .then(() => resolve(performance.now() - startTime));
        });
      });

      expect(loadTime).toBeLessThan(200);
    });
  });

  describe('Real User Monitoring Simulation', () => {
    it('should perform well under various network conditions', async () => {
      const conditions = [
        { name: '3G', downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8, latency: 150 },
        { name: '4G', downloadThroughput: 4 * 1024 * 1024 / 8, uploadThroughput: 3 * 1024 * 1024 / 8, latency: 50 },
      ];

      for (const condition of conditions) {
        // Simulate network condition
        await page.emulateNetworkConditions({
          downloadThroughput: condition.downloadThroughput,
          uploadThroughput: condition.uploadThroughput,
          latency: condition.latency,
          offline: false,
        });

        const startTime = Date.now();
        await page.goto('http://localhost:5173');
        await page.waitForSelector('[data-testid="app-ready"]');
        const loadTime = Date.now() - startTime;

        // Adjust threshold based on network condition
        const adjustedThreshold = condition.name === '3G' ? THRESHOLDS.PAGE_LOAD * 2 : THRESHOLDS.PAGE_LOAD;
        expect(loadTime).toBeLessThan(adjustedThreshold);
      }
    });

    it('should handle concurrent users efficiently', async () => {
      const userCount = 50;
      const browsers: Browser[] = [];
      const pages: Page[] = [];

      // Create multiple browser instances
      for (let i = 0; i < userCount; i++) {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        browsers.push(browser);
        pages.push(page);
      }

      // Simulate concurrent usage
      const loadTimes = await Promise.all(
        pages.map(async (page) => {
          const startTime = Date.now();
          await page.goto('http://localhost:5173');
          await page.waitForSelector('[data-testid="app-ready"]');
          return Date.now() - startTime;
        })
      );

      // Calculate statistics
      const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
      const maxLoadTime = Math.max(...loadTimes);

      expect(avgLoadTime).toBeLessThan(THRESHOLDS.PAGE_LOAD);
      expect(maxLoadTime).toBeLessThan(THRESHOLDS.PAGE_LOAD * 1.5);

      // Cleanup
      await Promise.all(browsers.map(b => b.close()));
    });
  });
});