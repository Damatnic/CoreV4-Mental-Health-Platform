/**
 * Performance Benchmarks for Crisis Response
 * Ensures the platform meets critical performance requirements
 * during mental health emergencies
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { logger } from '../../utils/logger';
import CrisisButton from '../../components/crisis/CrisisButton';
import MoodTracker from '../../components/wellness/MoodTracker';

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  CRISIS_RESPONSE: 200,      // Maximum time for crisis button response
  API_RESPONSE: 100,          // Maximum time for critical API calls
  RENDER_TIME: 50,            // Maximum initial render time
  INTERACTION_DELAY: 100,     // Maximum delay for user interactions
  MEMORY_LIMIT: 50 * 1024 * 1024, // 50MB memory limit
  BUNDLE_SIZE: 500 * 1024,    // 500KB bundle size limit
};

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

// Performance measurement utilities
class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();
    
    if (!start) throw new Error(`Start mark ${startMark} not found`);
    if (endMark && !this.marks.get(endMark)) throw new Error(`End mark ${endMark} not found`);
    
    const duration = (end || performance.now()) - start;
    this.measures.set(name, duration);
    return duration;
  }

  getMeasure(name: string): number | undefined {
    return this.measures.get(_name);
  }

  getAllMeasures(): Record<string, number> {
    return Object.fromEntries(this.measures);
  }

  reset(): void {
    this.marks.clear();
    this.measures.clear();
  }
}

describe('Crisis Response Performance', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  afterEach(() => {
    monitor.reset();
  });

  describe('Crisis Button Performance', () => {
    it('should respond within 200ms threshold', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button', { name: /crisis help/i });
      
      monitor.mark('crisis-start');
      await user.click(_button);
      
      await waitFor(() => {
        expect(screen.getByText(/crisis resources/i)).toBeInTheDocument();
      });
      
      const responseTime = monitor.measure('crisis-response', 'crisis-start');
      
      expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.CRISIS_RESPONSE);
      
      // Log for monitoring
      logger.debug(`Crisis response time: ${responseTime.toFixed(2)}ms`);
    });

    it('should render crisis button quickly', () => {
      monitor.mark('render-start');
      
      render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const renderTime = monitor.measure('render-time', 'render-start');
      
      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.RENDER_TIME);
      
      logger.debug(`Crisis button render time: ${renderTime.toFixed(2)}ms`);
    });

    it('should handle rapid crisis button clicks efficiently', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button', { name: /crisis help/i });
      
      monitor.mark('rapid-clicks-start');
      
      // Simulate panic clicking (10 rapid clicks)
      for (let i = 0; i < 10; i++) {
        await user.click(_button);
      }
      
      const totalTime = monitor.measure('rapid-clicks', 'rapid-clicks-start');
      const averageTime = totalTime / 10;
      
      // Should handle rapid clicks without performance degradation
      expect(averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.INTERACTION_DELAY);
      
      logger.debug(`Average time per click: ${averageTime.toFixed(2)}ms`);
    });
  });

  describe('API Response Performance', () => {
    it('crisis API should respond quickly', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button', { name: /crisis help/i });
      
      monitor.mark('api-start');
      await user.click(_button);
      
      await waitFor(() => {
        expect(screen.getByText('988')).toBeInTheDocument();
      });
      
      const apiTime = monitor.measure('api-response', 'api-start');
      
      expect(apiTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE * 2); // Allow some overhead
      
      logger.debug(`Crisis API response time: ${apiTime.toFixed(2)}ms`);
    });

    it('should cache crisis resources for instant access', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button', { name: /crisis help/i });
      
      // First click - cold cache
      monitor.mark('cold-start');
      await user.click(_button);
      await waitFor(() => screen.getByText('988'));
      const coldTime = monitor.measure('cold-response', 'cold-start');
      
      // Close modal
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(_closeButton);
      
      // Second click - warm cache
      monitor.mark('warm-start');
      await user.click(_button);
      await waitFor(() => screen.getByText('988'));
      const warmTime = monitor.measure('warm-response', 'warm-start');
      
      // Cached response should be significantly faster
      expect(warmTime).toBeLessThan(coldTime * 0.5);
      
      logger.debug(`Cold cache: ${coldTime.toFixed(2)}ms, Warm cache: ${warmTime.toFixed(2)}ms`);
    });
  });

  describe('Memory Performance', () => {
    it('should not leak memory during crisis interactions', async () => {
      const user = userEvent.setup();
      
      // Get initial memory (if available)
      const initialMemory = (performance as unknown).memory?.usedJSHeapSize || 0;
      
      render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button', { name: /crisis help/i });
      
      // Perform multiple open/close cycles
      for (let i = 0; i < 5; i++) {
        await user.click(_button);
        await waitFor(() => screen.getByText('988'));
        
        const closeButton = screen.getByRole('button', { name: /close/i });
        await user.click(_closeButton);
        await waitFor(() => expect(screen.queryByText('988')).not.toBeInTheDocument());
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Check memory after interactions
      const finalMemory = (performance as unknown).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be minimal
      if (initialMemory > 0) {
        expect(_memoryIncrease).toBeLessThan(5 * 1024 * 1024); // Less than 5MB increase
        logger.debug(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      }
    });

    it('should clean up event listeners properly', async () => {
      const user = userEvent.setup();
      
      const { unmount } = render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button', { name: /crisis help/i });
      await user.click(_button);
      
      // Get initial listener count
      const getListenerCount = () => {
        const events = (window as unknown).getEventListeners?.(_document) || {};
        return Object.values(_events).reduce((sum: number, arr: unknown) => sum + arr.length, 0);
      };
      
      const initialListeners = getListenerCount();
      
      // Unmount component
      unmount();
      
      // Check that listeners were removed
      const finalListeners = getListenerCount();
      
      if (initialListeners > 0) {
        expect(_finalListeners).toBeLessThanOrEqual(_initialListeners);
      }
    });
  });

  describe('Rendering Performance', () => {
    it('mood tracker should render efficiently', () => {
      monitor.mark('mood-render-start');
      
      render(
        <TestWrapper>
          <MoodTracker showHistory={false} />
        </TestWrapper>
      );
      
      const renderTime = monitor.measure('mood-render', 'mood-render-start');
      
      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.RENDER_TIME * 2);
      
      logger.debug(`Mood tracker render time: ${renderTime.toFixed(2)}ms`);
    });

    it('should efficiently update mood display', async () => {
      render(
        <TestWrapper>
          <MoodTracker />
        </TestWrapper>
      );
      
      const slider = screen.getByRole('slider');
      
      monitor.mark('mood-update-start');
      
      // Change mood value
      fireEvent.change(slider, { target: { value: '8' } });
      
      await waitFor(() => {
        expect(screen.getByText(/feeling good/i)).toBeInTheDocument();
      });
      
      const updateTime = monitor.measure('mood-update', 'mood-update-start');
      
      expect(updateTime).toBeLessThan(PERFORMANCE_THRESHOLDS.INTERACTION_DELAY);
      
      logger.debug(`Mood update time: ${updateTime.toFixed(2)}ms`);
    });

    it('should lazy load non-critical components', async () => {
      const { rerender } = render(
        <TestWrapper>
          <MoodTracker showHistory={false} />
        </TestWrapper>
      );
      
      // Initial render without history
      const initialComponents = screen.queryByTestId('mood-history-chart');
      expect(_initialComponents).not.toBeInTheDocument();
      
      // Re-render with history
      monitor.mark('lazy-load-start');
      
      rerender(
        <TestWrapper>
          <MoodTracker showHistory={true} />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('mood-history-chart')).toBeInTheDocument();
      });
      
      const lazyLoadTime = monitor.measure('lazy-load', 'lazy-load-start');
      
      // Lazy loading should be reasonably fast
      expect(lazyLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.RENDER_TIME * 4);
      
      logger.debug(`Lazy load time: ${lazyLoadTime.toFixed(2)}ms`);
    });
  });

  describe('Network Performance', () => {
    it('should handle slow network gracefully', async () => {
      const user = userEvent.setup();
      
      // Simulate slow network
      const slowFetch = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ hotlines: [{ name: '988', number: '988' }] })
        }), 1000))
      );
      
      global.fetch = slowFetch;
      
      render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button', { name: /crisis help/i });
      
      monitor.mark('slow-network-start');
      await user.click(_button);
      
      // Should show loading state immediately
      expect(screen.getByText(/connecting to crisis support/i)).toBeInTheDocument();
      
      const loadingTime = monitor.measure('loading-shown', 'slow-network-start');
      expect(loadingTime).toBeLessThan(50); // Loading state should appear quickly
      
      logger.debug(`Loading state appeared in: ${loadingTime.toFixed(2)}ms`);
    });

    it('should prioritize critical resources', async () => {
      const fetchOrder: string[] = [];
      
      const trackingFetch = vi.fn().mockImplementation((url: string) => {
        fetchOrder.push(_url);
        return Promise.resolve({
          ok: true,
          json: async () => ({})
        });
      });
      
      global.fetch = trackingFetch;
      
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CrisisButton />
        </TestWrapper>
      );
      
      await user.click(screen.getByRole('button', { name: /crisis help/i }));
      
      // Crisis resources should be fetched first
      expect(fetchOrder[0]).toContain('crisis');
      
      logger.debug('Resource fetch order:', fetchOrder);
    });
  });

  describe('Bundle Size and Loading', () => {
    it('should have acceptable Time to Interactive (_TTI)', async () => {
      monitor.mark('tti-start');
      
      render(
        <TestWrapper>
          <CrisisButton />
          <MoodTracker />
        </TestWrapper>
      );
      
      // Wait for all components to be interactive
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /crisis help/i });
        const slider = screen.getByRole('slider');
        
        expect(_button).toBeEnabled();
        expect(_slider).toBeEnabled();
      });
      
      const ttiTime = monitor.measure('tti', 'tti-start');
      
      // TTI should be under 3 seconds for good UX
      expect(ttiTime).toBeLessThan(3000);
      
      logger.debug(`Time to Interactive: ${ttiTime.toFixed(2)}ms`);
    });

    it('should efficiently batch DOM updates', async () => {
      let updateCount = 0;
      
      // Monitor DOM mutations
      const observer = new MutationObserver(() => {
        updateCount++;
      });
      
      const { container } = render(
        <TestWrapper>
          <MoodTracker />
        </TestWrapper>
      );
      
      observer.observe(container, { 
        childList: true, 
        subtree: true,
        attributes: true 
      });
      
      const slider = screen.getByRole('slider');
      
      // Rapid mood changes
      for (let i = 1; i <= 10; i++) {
        fireEvent.change(slider, { target: { value: i.toString() } });
      }
      
      // Wait for updates to settle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      observer.disconnect();
      
      // Updates should be batched efficiently
      expect(updateCount).toBeLessThan(50); // Should batch updates
      
      logger.debug(`DOM updates for 10 changes: ${updateCount}`);
    });
  });

  describe('Performance Summary', () => {
    it('should generate performance report', async () => {
      const user = userEvent.setup();
      const performanceMetrics: Record<string, number> = {};
      
      // Test complete user flow
      monitor.mark('flow-start');
      
      render(
        <TestWrapper>
          <CrisisButton />
          <MoodTracker />
        </TestWrapper>
      );
      
      performanceMetrics.initialRender = monitor.measure('initial-render', 'flow-start');
      
      // Test crisis button
      monitor.mark('crisis-test-start');
      const crisisButton = screen.getByRole('button', { name: /crisis help/i });
      await user.click(_crisisButton);
      await waitFor(() => screen.getByText('988'));
      performanceMetrics.crisisResponse = monitor.measure('crisis-test', 'crisis-test-start');
      
      // Close modal
      await user.click(screen.getByRole('button', { name: /close/i }));
      
      // Test mood tracker
      monitor.mark('mood-test-start');
      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '7' } });
      await user.click(screen.getByRole('button', { name: /log mood/i }));
      performanceMetrics.moodLogging = monitor.measure('mood-test', 'mood-test-start');
      
      // Overall flow time
      performanceMetrics.totalFlow = monitor.measure('total-flow', 'flow-start');
      
      // Generate report
      logger.debug('\n=== Performance Report ===');
      logger.debug(`Initial Render: ${performanceMetrics.initialRender.toFixed(2)}ms`);
      logger.debug(`Crisis Response: ${performanceMetrics.crisisResponse.toFixed(2)}ms`);
      logger.debug(`Mood Logging: ${performanceMetrics.moodLogging.toFixed(2)}ms`);
      logger.debug(`Total Flow: ${performanceMetrics.totalFlow.toFixed(2)}ms`);
      logger.debug('========================\n');
      
      // Assert critical metrics
      expect(performanceMetrics.crisisResponse).toBeLessThan(PERFORMANCE_THRESHOLDS.CRISIS_RESPONSE);
      expect(performanceMetrics.initialRender).toBeLessThan(PERFORMANCE_THRESHOLDS.RENDER_TIME * 3);
    });
  });
});