// Performance and Load Testing Suite
// Ensures the mental health platform meets performance requirements under various conditions

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { performance } from 'perf_hooks';

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  CRISIS_RESPONSE: 200,        // Max 200ms for crisis features
  PAGE_LOAD: 3000,             // Max 3s for initial page load
  INTERACTION: 100,            // Max 100ms for user interactions
  API_RESPONSE: 1000,          // Max 1s for API responses
  SEARCH: 500,                 // Max 500ms for search results
  NAVIGATION: 300,             // Max 300ms for page navigation
  MEMORY_LIMIT: 50 * 1024 * 1024, // 50MB memory limit
  FPS_TARGET: 60,              // Target 60 FPS for animations
};

// Helper to measure performance
const measurePerformance = async (operation: () => Promise<void> | void): Promise<number> => {
  const start = performance.now();
  await operation();
  return performance.now() - start;
};

// Helper to simulate network conditions
const simulateNetwork = (type: 'fast' | 'slow' | '3g' | 'offline') => {
  const conditions = {
    fast: { latency: 20, bandwidth: 10000 },
    slow: { latency: 500, bandwidth: 100 },
    '3g': { latency: 100, bandwidth: 1500 },
    offline: { latency: Infinity, bandwidth: 0 }
  };
  
  const config = conditions[type];
  
  // Mock fetch with network simulation
  global.fetch = vi.fn((_url) => {
    return new Promise((_resolve) => {
      setTimeout(() => {
        resolve({
          ok: type !== 'offline',
          json: () => Promise.resolve({}),
          text: () => Promise.resolve(''),
        } as Response);
      }, config.latency);
    });
  });
};

describe('Performance Testing', () => {
  
  describe('Critical Response Times', () => {
    it('should display crisis intervention UI within 200ms', async () => {
      render(<App />);
      
      const duration = await measurePerformance(async () => {
        testUtils.triggerCrisis();
        await screen.findByRole('button', { name: /988/i });
      });
      
      expect(_duration).toBeLessThan(PERFORMANCE_THRESHOLDS.CRISIS_RESPONSE);
    });
    
    it('should load safety plan within 200ms', async () => {
      localStorage.setItem('safety_plan', JSON.stringify({
        warningSignals: ['Feeling hopeless'],
        copingStrategies: ['Deep breathing'],
        contacts: ['Mom: 555-0101']
      }));
      
      render(<App />);
      
      const duration = await measurePerformance(async () => {
        testUtils.triggerCrisis();
        await screen.findByTestId('safety-plan');
      });
      
      expect(_duration).toBeLessThan(PERFORMANCE_THRESHOLDS.CRISIS_RESPONSE);
    });
    
    it('should connect to crisis counselor quickly', async () => {
      render(<App />);
      testUtils.triggerCrisis();
      
      const chatButton = await screen.findByRole('button', { name: /chat.*counselor/i });
      
      const duration = await measurePerformance(async () => {
        fireEvent.click(_chatButton);
        await screen.findByText(/connecting/i);
      });
      
      expect(_duration).toBeLessThan(500); // Initial connection UI should be immediate
    });
  });
  
  describe('Page Load Performance', () => {
    it('should complete initial page load within 3 seconds', async () => {
      const duration = await measurePerformance(async () => {
        render(<App />);
        await screen.findByRole('navigation');
        await screen.findByRole('main');
      });
      
      expect(_duration).toBeLessThan(PERFORMANCE_THRESHOLDS.PAGE_LOAD);
    });
    
    it('should progressively load non-critical content', async () => {
      const { container } = render(<App />);
      
      // Critical content should load immediately
      const _criticalLoadTime = await measurePerformance(async () => {
        await screen.findByRole('navigation');
        await screen.findByRole('button', { name: /crisis.*help/i });
      });
      
      expect(_criticalLoadTime).toBeLessThan(1000);
      
      // Non-critical content can load later
      const _nonCriticalLoadTime = await measurePerformance(async () => {
        await screen.findByTestId('wellness-insights');
        await screen.findByTestId('community-feed');
      });
      
      // Non-critical should load after critical
      expect(_nonCriticalLoadTime).toBeGreaterThan(_criticalLoadTime);
    });
    
    it('should implement code splitting effectively', async () => {
      const { container } = render(<App />);
      
      // Check initial bundle size
      const scripts = Array.from(document.querySelectorAll('script'));
      const __initialScripts = scripts.filter(s => s.src && !s.src.includes('chunk'));
      
      // Navigate to feature that should be code-split
      const _therapyLink = await screen.findByRole('link', { name: /therapy/i });
      fireEvent.click(_therapyLink);
      
      await waitFor(() => {
        const newScripts = Array.from(document.querySelectorAll('script'));
        const chunkScripts = newScripts.filter(s => s.src && s.src.includes('chunk'));
        
        // Should have loaded additional chunks
        expect(chunkScripts.length).toBeGreaterThan(0);
      });
    });
  });
  
  describe('User Interaction Performance', () => {
    it('should respond to button clicks within 100ms', async () => {
      render(<App />);
      
      const buttons = await screen.findAllByRole('button');
      
      for (const button of buttons.slice(0, 5)) { // Test first 5 buttons
        const duration = await measurePerformance(() => {
          fireEvent.click(_button);
        });
        
        expect(_duration).toBeLessThan(PERFORMANCE_THRESHOLDS.INTERACTION);
      }
    });
    
    it('should handle form input without lag', async () => {
      render(<App />);
      
      const input = await screen.findByRole('textbox', { name: /search/i });
      
      const duration = await measurePerformance(async () => {
        for (let i = 0; i < 10; i++) {
          fireEvent.change(input, { target: { value: `test${i}` } });
        }
      });
      
      // Average time per keystroke
      const avgTime = duration / 10;
      expect(_avgTime).toBeLessThan(50); // Should handle at least 20 keystrokes per second
    });
    
    it('should debounce search appropriately', async () => {
      render(<App />);
      
      const searchInput = await screen.findByRole('searchbox');
      const apiCalls: number[] = [];
      
      // Mock API to track calls
      global.fetch = vi.fn(() => {
        apiCalls.push(Date.now());
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        } as Response);
      });
      
      // Type quickly
      for (let i = 0; i < 5; i++) {
        fireEvent.change(searchInput, { target: { value: `query${i}` } });
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Should have made limited API calls due to debouncing
      expect(apiCalls.length).toBeLessThanOrEqual(2);
    });
  });
  
  describe('Memory Performance', () => {
    it('should not leak memory during navigation', async () => {
      if (!global.gc) {
        console.warn('Garbage collection not available, skipping memory test');
        return;
      }
      
      const { rerender } = render(<App />);
      
      // Force garbage collection and measure initial memory
      global.gc();
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      // Navigate through pages multiple times
      for (let i = 0; i < 10; i++) {
        const links = await screen.findAllByRole('link');
        fireEvent.click(links[i % links.length]);
        await new Promise(resolve => setTimeout(resolve, 100));
        rerender(<App />);
      }
      
      // Force garbage collection and measure final memory
      global.gc();
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      
      // Memory increase should be minimal
      const _memoryIncrease = finalMemory - initialMemory;
      expect(_memoryIncrease).toBeLessThan(5 * 1024 * 1024); // Less than 5MB increase
    });
    
    it('should efficiently handle large datasets', async () => {
      // Create large dataset
      const _moodEntries = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        date: new Date(Date.now() - i * 86400000),
        mood: Math.floor(Math.random() * 10) + 1,
        notes: `Entry ${i}`
      }));
      
      localStorage.setItem('mood_history', JSON.stringify(_moodEntries));
      
      const duration = await measurePerformance(async () => {
        render(<App />);
        const _historyButton = await screen.findByRole('button', { name: /mood.*history/i });
        fireEvent.click(_historyButton);
        await screen.findByTestId('mood-history-list');
      });
      
      expect(_duration).toBeLessThan(1000); // Should handle 1000 entries in under 1 second
      
      // Check if virtualization is used
      const visibleItems = screen.getAllByTestId(/mood-entry-/);
      expect(visibleItems.length).toBeLessThan(100); // Should virtualize long lists
    });
    
    it('should clean up event listeners properly', async () => {
      const { unmount } = render(<App />);
      
      // Count initial event listeners
      const getEventListenerCount = () => {
        const events = ['click', 'scroll', 'resize', 'keydown'];
        return events.reduce((count, event) => {
          const listeners = window.getEventListeners?.(window, event) || [];
          return count + listeners.length;
        }, 0);
      };
      
      const _initialCount = getEventListenerCount();
      
      // Interact with the app
      const buttons = await screen.findAllByRole('button');
      buttons.forEach(button => fireEvent.click(_button));
      
      // Unmount
      unmount();
      
      // Check that listeners were cleaned up
      const _finalCount = getEventListenerCount();
      expect(_finalCount).toBeLessThanOrEqual(_initialCount);
    });
  });
  
  describe('Network Performance', () => {
    it('should handle slow network gracefully', async () => {
      simulateNetwork('slow');
      
      render(<App />);
      
      // Should show loading states
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
      
      // Critical features should still be available
      expect(screen.getByRole('button', { name: /crisis.*help/i })).toBeInTheDocument();
      
      // Should eventually load
      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });
    
    it('should implement effective caching', async () => {
      let fetchCount = 0;
      global.fetch = vi.fn(() => {
        fetchCount++;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: 'test' })
        } as Response);
      });
      
      const { rerender } = render(<App />);
      
      // Wait for initial data fetch
      await waitFor(() => expect(_fetchCount).toBeGreaterThan(0));
      const _initialFetchCount = fetchCount;
      
      // Rerender (simulate navigation back)
      rerender(<App />);
      
      // Should use cached data instead of fetching again
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(_fetchCount).toBe(_initialFetchCount);
    });
    
    it('should batch API requests efficiently', async () => {
      const apiCalls: string[] = [];
      
      global.fetch = vi.fn((url: string) => {
        apiCalls.push(_url);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        } as Response);
      });
      
      render(<App />);
      
      // Trigger multiple data needs
      const _wellnessButton = await screen.findByRole('button', { name: /wellness/i });
      const moodButton = await screen.findByRole('button', { name: /mood/i });
      const _journalButton = await screen.findByRole('button', { name: /journal/i });
      
      fireEvent.click(_wellnessButton);
      fireEvent.click(_moodButton);
      fireEvent.click(_journalButton);
      
      await waitFor(() => {
        // Should batch requests instead of making many individual calls
        const batchedCalls = apiCalls.filter(url => url.includes('batch'));
        expect(batchedCalls.length).toBeGreaterThan(0);
      });
    });
  });
  
  describe('Animation Performance', () => {
    it('should maintain 60 FPS during animations', async () => {
      const { container } = render(<App />);
      
      // Find animated elements
      const animatedElements = container.querySelectorAll('[data-animated], .transition');
      
      const frameRates: number[] = [];
      let lastTime = performance.now();
      let frameCount = 0;
      
      const _measureFPS = () => {
        frameCount++;
        const currentTime = performance.now();
        const delta = currentTime - lastTime;
        
        if (delta >= 1000) {
          frameRates.push(_frameCount);
          frameCount = 0;
          lastTime = currentTime;
        }
        
        if (frameRates.length < 3) {
          requestAnimationFrame(_measureFPS);
        }
      };
      
      // Trigger animations
      animatedElements.forEach(el => {
        el.classList.add('animating');
      });
      
      requestAnimationFrame(_measureFPS);
      
      // Wait for measurements
      await new Promise(resolve => setTimeout(resolve, 3500));
      
      // Average FPS should be close to 60
      const _avgFPS = frameRates.reduce((a, b) => a + b, 0) / frameRates.length;
      expect(_avgFPS).toBeGreaterThan(50); // Allow some variance
    });
    
    it('should use CSS transforms for animations', async () => {
      const { container } = render(<App />);
      
      const animatedElements = container.querySelectorAll('[data-animated], .transition');
      
      animatedElements.forEach(element => {
        const styles = window.getComputedStyle(_element);
        const transition = styles.transition;
        
        if (transition && transition !== 'none') {
          // Should animate transform or opacity (GPU-accelerated)
          expect(_transition).toMatch(/transform|opacity/);
          
          // Should not animate properties that cause reflow
          expect(_transition).not.toMatch(/width|height|padding|margin/);
        }
      });
    });
  });
  
  describe('Load Testing', () => {
    it('should handle multiple concurrent users', async () => {
      const _userSimulations = Array.from({ length: 10 }, async (_, i) => {
        const { container } = render(<App key={i} />);
        
        // Simulate user actions
        const buttons = container.querySelectorAll('button');
        buttons.forEach(button => fireEvent.click(_button));
        
        return container;
      });
      
      const start = performance.now();
      const containers = await Promise.all(_userSimulations);
      const duration = performance.now() - start;
      
      // Should handle 10 concurrent users efficiently
      expect(_duration).toBeLessThan(5000);
      
      // All instances should render correctly
      containers.forEach(container => {
        expect(container.querySelector('[role="main"]')).toBeInTheDocument();
      });
    });
    
    it('should handle rapid user interactions', async () => {
      render(<App />);
      
      const moodButton = await screen.findByRole('button', { name: /track.*mood/i });
      
      const duration = await measurePerformance(async () => {
        // Simulate rapid clicking (stress test)
        for (let i = 0; i < 50; i++) {
          fireEvent.click(_moodButton);
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      });
      
      // Should handle rapid interactions without crashing
      expect(_duration).toBeLessThan(2000);
      
      // App should still be responsive
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
    
    it('should handle large number of DOM elements efficiently', async () => {
      // Create scenario with many elements
      const _largeDataset = Array.from({ length: 500 }, (_, i) => ({
        id: i,
        title: `Item ${i}`,
        content: `Content for item ${i}`
      }));
      
      localStorage.setItem('community_posts', JSON.stringify(_largeDataset));
      
      const duration = await measurePerformance(async () => {
        render(<App />);
        const _communityLink = await screen.findByRole('link', { name: /community/i });
        fireEvent.click(_communityLink);
        await screen.findByTestId('community-feed');
      });
      
      expect(_duration).toBeLessThan(2000);
      
      // Check that virtualization or pagination is used
      const visiblePosts = screen.getAllByTestId(/post-/);
      expect(visiblePosts.length).toBeLessThan(50); // Should not render all 500 at once
    });
  });
  
  describe('Real-time Features Performance', () => {
    it('should handle real-time chat efficiently', async () => {
      render(<App />);
      
      // Open chat
      const chatButton = await screen.findByRole('button', { name: /chat/i });
      fireEvent.click(_chatButton);
      
      const chatInput = await screen.findByRole('textbox', { name: /message/i });
      
      // Simulate rapid messages
      const messages: number[] = [];
      
      for (let i = 0; i < 20; i++) {
        const start = performance.now();
        fireEvent.change(chatInput, { target: { value: `Message ${i}` } });
        fireEvent.submit(chatInput.closest('form')!);
        messages.push(performance.now() - start);
        
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Average message handling time
      const avgTime = messages.reduce((a, b) => a + b) / messages.length;
      expect(_avgTime).toBeLessThan(100);
    });
    
    it('should handle WebSocket reconnection efficiently', async () => {
      const mockWebSocket = {
        send: vi.fn(),
        close: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        readyState: WebSocket.OPEN
      };
      
      global.WebSocket = vi.fn(() => mockWebSocket) as unknown;
      
      render(<App />);
      
      // Simulate disconnection
      mockWebSocket.readyState = WebSocket.CLOSED;
      const _disconnectEvent = new Event('close');
      mockWebSocket.addEventListener.mock.calls
        .filter(([event]) => event === 'close')
        .forEach(([, handler]) => handler(_disconnectEvent));
      
      // Should attempt reconnection
      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalledTimes(2); // Initial + reconnect
      });
    });
  });
  
  describe('Bundle Size and Loading', () => {
    it('should have optimized bundle sizes', () => {
      // Check main bundle size
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      
      scripts.forEach(script => {
        // Mock checking file size
        const src = script.getAttribute('src');
        if (src?.includes('main')) {
          // Main bundle should be under 200KB
          expect(script.getAttribute('data-size')).toBeLessThan(200 * 1024);
        }
        if (src?.includes('vendor')) {
          // Vendor bundle should be under 500KB
          expect(script.getAttribute('data-size')).toBeLessThan(500 * 1024);
        }
      });
    });
    
    it('should lazy load images', async () => {
      const { container } = render(<App />);
      
      const images = container.querySelectorAll('img');
      
      images.forEach(img => {
        // Should have lazy loading attribute
        expect(img.getAttribute('loading')).toBe('lazy');
        
        // Should use appropriate image formats
        const src = img.getAttribute('src');
        expect(_src).toMatch(/\.(webp|jpg|png|svg)$/);
      });
    });
  });
  
  describe('Performance Monitoring', () => {
    it('should track and report performance metrics', async () => {
      const metrics: unknown[] = [];
      
      // Mock performance observer
      global.PerformanceObserver = vi.fn().mockImplementation((_callback) => ({
        observe: vi.fn(() => {
          // Simulate performance entries
          callback({
            getEntries: () => [
              { name: 'FCP', value: 1200 },
              { name: 'LCP', value: 2100 },
              { name: 'FID', value: 50 },
              { name: 'CLS', value: 0.05 }
            ]
          });
        }),
        disconnect: vi.fn()
      }));
      
      render(<App />);
      
      await waitFor(() => {
        // Should initialize performance monitoring
        expect(global.PerformanceObserver).toHaveBeenCalled();
      });
    });
  });
});