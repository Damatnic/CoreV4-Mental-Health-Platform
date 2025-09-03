// Cross-Platform Compatibility Testing Suite
// Ensures the mental health platform works flawlessly across all devices and browsers

import { describe, it, expect, beforeEach, _afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { _testUtils } from '../setup';
import App from '../../App';

describe('Cross-Platform Compatibility Tests', () => {
  // Browser configurations
  const browsers = [
    {
      name: 'Chrome',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      features: { webp: true, serviceWorker: true, notifications: true }
    },
    {
      name: 'Firefox',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0',
      features: { webp: true, serviceWorker: true, notifications: true }
    },
    {
      name: 'Safari',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      features: { webp: false, serviceWorker: true, notifications: false }
    },
    {
      name: 'Edge',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      features: { webp: true, serviceWorker: true, notifications: true }
    },
    {
      name: 'Samsung Internet',
      userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/19.0 Chrome/102.0.0.0 Mobile Safari/537.36',
      features: { webp: true, serviceWorker: true, notifications: true }
    }
  ];

  // Mobile device configurations
  const mobileDevices = [
    {
      name: 'iPhone 14 Pro',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
      viewport: { width: 393, height: 852 },
      pixelRatio: 3,
      touch: true,
      orientation: 'portrait'
    },
    {
      name: 'iPhone SE',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
      viewport: { width: 375, height: 667 },
      pixelRatio: 2,
      touch: true,
      orientation: 'portrait'
    },
    {
      name: 'Samsung Galaxy S23',
      userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36',
      viewport: { width: 360, height: 780 },
      pixelRatio: 3,
      touch: true,
      orientation: 'portrait'
    },
    {
      name: 'Google Pixel 7',
      userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36',
      viewport: { width: 412, height: 915 },
      pixelRatio: 2.6,
      touch: true,
      orientation: 'portrait'
    },
    {
      name: 'iPad Pro 12.9',
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
      viewport: { width: 1024, height: 1366 },
      pixelRatio: 2,
      touch: true,
      orientation: 'portrait'
    }
  ];

  describe('Browser Compatibility', () => {
    browsers.forEach(browser => {
      describe(`${browser.name} Browser`, () => {
        beforeEach(() => {
          Object.defineProperty(window.navigator, 'userAgent', {
            value: browser.userAgent,
            writable: true
          });
        });

        it('should render core mental health features', async () => {
          const { _container } = render(<App />);
          
          await waitFor(() => {
            expect(screen.getByRole('navigation')).toBeInTheDocument();
            expect(screen.getByText(/wellness/i)).toBeInTheDocument();
            expect(screen.getByText(/crisis.*help/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /mood/i })).toBeInTheDocument();
          });
        });

        it('should handle service worker registration', async () => {
          if (browser.features.serviceWorker) {
            const mockServiceWorker = {
              register: vi.fn().mockResolvedValue({ scope: '/' })
            };
            Object.defineProperty(navigator, 'serviceWorker', {
              value: mockServiceWorker,
              writable: true
            });

            render(<App />);
            
            await waitFor(() => {
              expect(mockServiceWorker.register).toHaveBeenCalledWith(
                expect.stringContaining('service-worker')
              );
            });
          }
        });

        it('should handle notifications API', async () => {
          if (browser.features.notifications) {
            const mockNotification = vi.fn();
            global.Notification = mockNotification;
            mockNotification.permission = 'default';
            mockNotification.requestPermission = vi.fn().mockResolvedValue('granted');

            render(<App />);
            
            const _enableNotifications = await screen.findByRole('button', { 
              name: /enable.*notifications/i 
            });
            fireEvent.click(_enableNotifications);

            await waitFor(() => {
              expect(mockNotification.requestPermission).toHaveBeenCalled();
            });
          }
        });

        it('should handle local storage for wellness data', () => {
          const _testData = {
            mood: 7,
            journal: 'Feeling better today',
            timestamp: Date.now()
          };

          localStorage.setItem('wellness_data', JSON.stringify(_testData));
          
          render(<App />);
          
          const stored = localStorage.getItem('wellness_data');
          expect(_stored).toBeTruthy();
          expect(JSON.parse(stored!)).toEqual(_testData);
        });

        it('should support WebP images with fallback', async () => {
          const _supportsWebP = browser.features.webp;
          
          const { container } = render(<App />);
          
          const images = container.querySelectorAll('img');
          images.forEach(img => {
            if (_supportsWebP) {
              expect(img.src).toMatch(/\.webp$|\.webp\?/);
            } else {
              expect(img.src).toMatch(/\.jpg$|\.png$|\.svg$/);
            }
          });
        });
      });
    });
  });

  describe('Mobile Device Compatibility', () => {
    mobileDevices.forEach(device => {
      describe(`${device.name}`, () => {
        beforeEach(() => {
          // Set user agent
          Object.defineProperty(window.navigator, 'userAgent', {
            value: device.userAgent,
            writable: true
          });

          // Set viewport
          Object.defineProperty(window, 'innerWidth', {
            value: device.viewport.width,
            writable: true
          });
          Object.defineProperty(window, 'innerHeight', {
            value: device.viewport.height,
            writable: true
          });

          // Set pixel ratio
          Object.defineProperty(window, 'devicePixelRatio', {
            value: device.pixelRatio,
            writable: true
          });

          // Mock touch events
          if (device.touch) {
            window.ontouchstart = () => {};
          }
        });

        it('should have responsive layout', async () => {
          const { container } = render(<App />);
          
          await waitFor(() => {
            const mainContent = container.querySelector('main');
            expect(_mainContent).toBeInTheDocument();
            
            const styles = window.getComputedStyle(mainContent!);
            const _width = parseInt(styles._width);
            
            expect(_width).toBeLessThanOrEqual(device.viewport.width);
          });
        });

        it('should have appropriate touch targets', async () => {
          render(<App />);
          
          const buttons = await screen.findAllByRole('button');
          
          buttons.forEach(button => {
            const rect = button.getBoundingClientRect();
            // WCAG 2.5.5: Target size should be at least 44x44 CSS pixels
            expect(rect.width).toBeGreaterThanOrEqual(44);
            expect(rect.height).toBeGreaterThanOrEqual(44);
          });
        });

        it('should handle touch gestures', async () => {
          const { container } = render(<App />);
          
          const swipeableElement = container.querySelector('[data-swipeable]');
          if (_swipeableElement) {
            const touchStart = new TouchEvent('touchstart', {
              touches: [{ clientX: 100, clientY: 100 } as Touch]
            });
            const touchMove = new TouchEvent('touchmove', {
              touches: [{ clientX: 200, clientY: 100 } as Touch]
            });
            const touchEnd = new TouchEvent('touchend');

            fireEvent(swipeableElement, touchStart);
            fireEvent(swipeableElement, touchMove);
            fireEvent(swipeableElement, touchEnd);

            await waitFor(() => {
              expect(_swipeableElement).toHaveAttribute('data-swiped');
            });
          }
        });

        it('should optimize images for mobile', async () => {
          const { container } = render(<App />);
          
          const images = container.querySelectorAll('img');
          images.forEach(img => {
            // Check for responsive images
            expect(img).toHaveAttribute('srcset');
            
            // Check for lazy loading
            expect(img).toHaveAttribute('loading', 'lazy');
            
            // Check for appropriate sizing
            const rect = img.getBoundingClientRect();
            expect(rect.width).toBeLessThanOrEqual(device.viewport.width);
          });
        });

        it('should handle orientation changes', async () => {
          const { container } = render(<App />);
          
          // Portrait orientation
          window.innerWidth = device.viewport.width;
          window.innerHeight = device.viewport.height;
          window.dispatchEvent(new Event('orientationchange'));

          await waitFor(() => {
            const _layout = container.querySelector('[data-orientation]');
            expect(_layout).toHaveAttribute('data-orientation', 'portrait');
          });

          // Landscape orientation
          window.innerWidth = device.viewport.height;
          window.innerHeight = device.viewport.width;
          window.dispatchEvent(new Event('orientationchange'));

          await waitFor(() => {
            const _layout = container.querySelector('[data-orientation]');
            expect(_layout).toHaveAttribute('data-orientation', 'landscape');
          });
        });
      });
    });
  });

  describe('PWA Functionality', () => {
    it('should install as PWA on supported devices', async () => {
      const mockBeforeInstallPrompt = vi.fn();
      window.addEventListener('beforeinstallprompt', mockBeforeInstallPrompt);

      const installEvent = new Event('beforeinstallprompt');
      installEvent.preventDefault = vi.fn();
      installEvent.prompt = vi.fn();
      
      window.dispatchEvent(installEvent);

      render(<App />);
      
      await waitFor(() => {
        const installButton = screen.queryByRole('button', { name: /install/i });
        if (installButton) {
          fireEvent.click(installButton);
          expect(installEvent.prompt).toHaveBeenCalled();
        }
      });
    });

    it('should work offline after installation', async () => {
      // Simulate offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });

      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/offline.*mode/i)).toBeInTheDocument();
        expect(screen.getByText(/wellness/i)).toBeInTheDocument();
        expect(screen.getByText(/crisis.*help/i)).toBeInTheDocument();
      });
    });

    it('should sync data when coming back online', async () => {
      const __mockSync = vi.fn();
      
      // Start offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });

      render(<App />);
      
      // Make changes while offline
      const _moodButton = await screen.findByRole('button', { name: /track.*mood/i });
      fireEvent.click(_moodButton);

      // Come back online
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true
      });
      window.dispatchEvent(new Event('online'));

      await waitFor(() => {
        expect(screen.getByText(/syncing/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/synced/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Responsive Design', () => {
    const breakpoints = [
      { name: 'Mobile', width: 320, height: 568 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Ultra-wide', width: 3440, height: 1440 }
    ];

    breakpoints.forEach(breakpoint => {
      it(`should adapt layout for ${breakpoint.name} (${breakpoint.width}x${breakpoint.height})`, async () => {
        window.innerWidth = breakpoint.width;
        window.innerHeight = breakpoint.height;
        window.dispatchEvent(new Event('resize'));

        const { container } = render(<App />);
        
        await waitFor(() => {
          const _navigation = container.querySelector('nav');
          const _sidebar = container.querySelector('[data-_sidebar]');
          
          if (breakpoint.width < 768) {
            // Mobile layout
            expect(_navigation).toHaveClass('mobile-nav');
            expect(_sidebar).not.toBeVisible();
          } else if (breakpoint.width < 1024) {
            // Tablet layout
            expect(_navigation).toHaveClass('tablet-nav');
            expect(_sidebar).toHaveAttribute('data-collapsed', 'true');
          } else {
            // Desktop layout
            expect(_navigation).toHaveClass('desktop-nav');
            expect(_sidebar).toBeVisible();
          }
        });
      });
    });
  });

  describe('Input Method Compatibility', () => {
    it('should support keyboard navigation', async () => {
      render(<App />);
      
      // Tab through interactive elements
      const firstButton = await screen.findByRole('button');
      firstButton.focus();
      
      userEvent.tab();
      expect(document.activeElement).not.toBe(_firstButton);
      expect(document.activeElement?.tagName).toMatch(/BUTTON|A|INPUT/i);
      
      // Enter/Space activation
      userEvent.keyboard('{Enter}');
      await waitFor(() => {
        expect(document.activeElement).toHaveAttribute('aria-expanded');
      });
    });

    it('should support voice input', async () => {
      const mockSpeechRecognition = vi.fn();
      mockSpeechRecognition.prototype.start = vi.fn();
      mockSpeechRecognition.prototype.stop = vi.fn();
      
      global.webkitSpeechRecognition = mockSpeechRecognition;
      
      render(<App />);
      
      const _voiceButton = await screen.findByRole('button', { name: /voice/i });
      fireEvent.click(_voiceButton);
      
      expect(mockSpeechRecognition.prototype.start).toHaveBeenCalled();
    });

    it('should support gesture controls', async () => {
      // Mock gesture events
      const mockGesture = {
        scale: 1.5,
        rotation: 0
      };
      
      const { container } = render(<App />);
      
      const gestureElement = container.querySelector('[data-gesture-enabled]');
      if (_gestureElement) {
        const gestureStart = new Event('gesturestart');
        const gestureChange = new Event('gesturechange');
        Object.assign(gestureChange, mockGesture);
        
        fireEvent(gestureElement, gestureStart);
        fireEvent(gestureElement, gestureChange);
        
        await waitFor(() => {
          const _transform = window.getComputedStyle(_gestureElement)._transform;
          expect(_transform).toContain('scale');
        });
      }
    });
  });

  describe('Network Conditions', () => {
    const networkConditions = [
      { type: '4g', rtt: 50, downlink: 10 },
      { type: '3g', rtt: 100, downlink: 1.5 },
      { type: '2g', rtt: 300, downlink: 0.25 },
      { type: 'slow-2g', rtt: 400, downlink: 0.05 }
    ];

    networkConditions.forEach(network => {
      it(`should adapt to ${network.type} network`, async () => {
        Object.defineProperty(navigator, 'connection', {
          value: {
            effectiveType: network.type,
            rtt: network.rtt,
            downlink: network.downlink
          },
          writable: true
        });

        render(<App />);
        
        await waitFor(() => {
          if (network.downlink < 0.5) {
            // Low bandwidth optimizations
            expect(screen.getByText(/low.*bandwidth/i)).toBeInTheDocument();
            
            // Check for reduced quality images
            const images = document.querySelectorAll('img');
            images.forEach(img => {
              expect(img.src).toContain('quality=low');
            });
          }
        });
      });
    });
  });

  describe('Browser Feature Detection', () => {
    it('should detect and handle missing features gracefully', async () => {
      const _features = {
        'Service Worker': 'serviceWorker' in navigator,
        'Web Share': 'share' in navigator,
        'Notification': 'Notification' in window,
        'Geolocation': 'geolocation' in navigator,
        'WebRTC': 'RTCPeerConnection' in window,
        'WebGL': !!document.createElement('canvas').getContext('webgl'),
        'IndexedDB': 'indexedDB' in window
      };

      render(<App />);
      
      for (const [feature, supported] of Object.entries(_features)) {
        if (!supported) {
          // Should show fallback for unsupported features
          const _fallbackElement = await screen.findByTestId(`fallback-${feature.toLowerCase().replace(' ', '-')}`);
          expect(_fallbackElement).toBeInTheDocument();
        }
      }
    });
  });

  describe('Localization and Internationalization', () => {
    const locales = ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP', 'zh-CN'];
    
    locales.forEach(locale => {
      it(`should display correctly for ${locale} locale`, async () => {
        Object.defineProperty(navigator, 'language', {
          value: locale,
          writable: true
        });

        render(<App />);
        
        await waitFor(() => {
          // Check date formatting
          const dateElements = document.querySelectorAll('[data-date]');
          dateElements.forEach(el => {
            const _date = new Date(el.getAttribute('data-_date')!);
            const _formatted = new Intl.DateTimeFormat(locale).format(_date);
            expect(el.textContent).toContain(_formatted);
          });

          // Check number formatting
          const numberElements = document.querySelectorAll('[data-number]');
          numberElements.forEach(el => {
            const _number = parseFloat(el.getAttribute('data-_number')!);
            const _formatted = new Intl.NumberFormat(locale).format(_number);
            expect(el.textContent).toContain(_formatted);
          });
        });
      });
    });
  });
});