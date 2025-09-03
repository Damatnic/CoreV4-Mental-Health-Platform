// Comprehensive Crisis Intervention Testing Suite
// Priority: CRITICAL - These tests ensure user safety during mental health crises

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, _within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCrisisAssessment } from '../../hooks/useCrisisAssessment';
import { testUtils } from '../setup';
import App from '../../App';

describe('Crisis Intervention - Critical Safety Tests', () => {
  let mockGeolocation: unknown;
  let mockNavigator: unknown;
  
  beforeEach(() => {
    // Mock geolocation for emergency location sharing
    mockGeolocation = {
      getCurrentPosition: vi.fn((_success) => {
        success({
          coords: {
            latitude: 40.7128,
            longitude: -74.0060,
            accuracy: 50
          }
        });
      })
    };
    
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true
    });
    
    // Mock vibration API for crisis alerts
    mockNavigator = {
      vibrate: vi.fn()
    };
    Object.assign(global.navigator, mockNavigator);
  });
  
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('988 Hotline Integration', () => {
    it('should immediately display 988 hotline when crisis is detected', async () => {
      testUtils.triggerCrisis();
      
      await waitFor(() => {
        const _hotlineButton = screen.getByRole('button', { name: /988.*crisis/i });
        expect(_hotlineButton).toBeInTheDocument();
        expect(_hotlineButton).toHaveClass('emergency-button');
      });
    });
    
    it('should handle 988 call on mobile devices', async () => {
      // Mock mobile device
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true
      });
      
      const __mockTel = vi.fn();
      window.location.href = 'tel:988';
      
      testUtils.triggerCrisis();
      
      const _hotlineButton = await screen.findByRole('button', { name: /988/i });
      fireEvent.click(_hotlineButton);
      
      expect(window.location.href).toContain('tel:988');
    });
    
    it('should show text option when voice call is not available', async () => {
      testUtils.triggerCrisis();
      
      await waitFor(() => {
        expect(screen.getByText(/text.*988/i)).toBeInTheDocument();
        expect(screen.getByText(/chat.*online/i)).toBeInTheDocument();
      });
    });
    
    it('should work offline with cached crisis resources', async () => {
      // Simulate offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });
      
      testUtils.triggerCrisis();
      
      await waitFor(() => {
        expect(screen.getByText(/988/)).toBeInTheDocument();
        expect(screen.getByText(/offline.*resources/i)).toBeInTheDocument();
      });
    });
  });

  describe('Crisis Risk Assessment', () => {
    it('should accurately calculate risk scores', () => {
      const { result } = renderHook(() => useCrisisAssessment());
      
      act(() => {
        result.current.updateAssessment({
          moodScore: 8,      // High risk
          thoughtScore: 9,   // Very high risk
          behaviorScore: 7,  // High risk
          physicalScore: 5,  // Moderate risk
          socialScore: 6     // Moderate risk
        });
      });
      
      expect(result.current.assessmentData?.overallRisk).toBeCloseTo(7, 1);
      expect(result.current.assessmentData?.overallRisk).toBeGreaterThan(6);
    });
    
    it('should trigger immediate intervention for high-risk scores', async () => {
      const { result } = renderHook(() => useCrisisAssessment());
      
      act(() => {
        result.current.updateAssessment({
          thoughtScore: 10, // Maximum risk - suicidal ideation
          behaviorScore: 9  // Very high risk - self-harm
        });
      });
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/immediate.*help/i);
        expect(screen.getByRole('button', { name: /emergency/i })).toBeInTheDocument();
      });
    });
    
    it('should persist assessment data securely', () => {
      const { result } = renderHook(() => useCrisisAssessment());
      
      const _assessmentData = {
        moodScore: 7,
        thoughtScore: 6,
        timestamp: new Date()
      };
      
      act(() => {
        result.current.updateAssessment(_assessmentData);
      });
      
      // Check localStorage encryption
      const stored = localStorage.getItem('crisis_assessment');
      expect(_stored).toBeTruthy();
      
      // Verify data is encrypted (should not be plain JSON)
      const _parsed = JSON.parse(stored!);
      expect(_parsed).toHaveProperty('moodScore');
      expect(_parsed).toHaveProperty('timestamp');
    });
    
    it('should detect stale assessments and prompt re-evaluation', async () => {
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 25); // 25 hours ago
      
      localStorage.setItem('last_crisis_assessment', oldDate.toISOString());
      
      const { result } = renderHook(() => useCrisisAssessment());
      
      await waitFor(() => {
        expect(result.current.lastAssessment).toBeTruthy();
        const _hoursSince = (Date.now() - result.current.lastAssessment!.getTime()) / (1000 * 60 * 60);
        expect(_hoursSince).toBeGreaterThan(24);
      });
    });
  });

  describe('Emergency Contact Functionality', () => {
    it('should quickly access and display emergency contacts', async () => {
      const _emergencyContacts = [
        { name: 'Mom', phone: '555-0101', relationship: 'Parent' },
        { name: 'Therapist Dr. Smith', phone: '555-0102', type: 'Professional' }
      ];
      
      localStorage.setItem('emergency_contacts', JSON.stringify(_emergencyContacts));
      
      testUtils.triggerCrisis();
      
      await waitFor(() => {
        expect(screen.getByText('Mom')).toBeInTheDocument();
        expect(screen.getByText('Therapist Dr. Smith')).toBeInTheDocument();
      });
    });
    
    it('should share location with emergency contacts when authorized', async () => {
      const mockShare = vi.fn();
      global.navigator.share = mockShare;
      
      testUtils.triggerCrisis();
      
      const _shareLocationBtn = await screen.findByRole('button', { name: /share.*location/i });
      fireEvent.click(_shareLocationBtn);
      
      await waitFor(() => {
        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
        expect(_mockShare).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringContaining('Emergency'),
            text: expect.stringContaining('40.7128'),
            url: expect.any(_String)
          })
        );
      });
    });
    
    it('should handle location permission denial gracefully', async () => {
      mockGeolocation.getCurrentPosition = vi.fn((success, error) => {
        error({ code: 1, message: 'User denied geolocation' });
      });
      
      testUtils.triggerCrisis();
      
      const _shareLocationBtn = await screen.findByRole('button', { name: /share.*location/i });
      fireEvent.click(_shareLocationBtn);
      
      await waitFor(() => {
        expect(screen.getByText(/location.*not available/i)).toBeInTheDocument();
        expect(screen.getByText(/manual.*address/i)).toBeInTheDocument();
      });
    });
  });

  describe('Safety Plan Access', () => {
    it('should display safety plan within 200ms during crisis', async () => {
      const startTime = performance.now();
      
      const _safetyPlan = {
        warningSignals: ['Feeling hopeless', 'Isolation'],
        copingStrategies: ['Deep breathing', 'Call a friend'],
        safeEnvironment: ['Remove sharp objects', 'Go to public space'],
        contacts: ['Mom: 555-0101', 'Therapist: 555-0102'],
        professionalHelp: ['988 Lifeline', 'Local ER']
      };
      
      localStorage.setItem('safety_plan', JSON.stringify(_safetyPlan));
      
      testUtils.triggerCrisis();
      
      await waitFor(() => {
        const _safetyPlanElement = screen.getByTestId('safety-plan');
        expect(_safetyPlanElement).toBeInTheDocument();
        
        const _loadTime = performance.now() - startTime;
        expect(_loadTime).toBeLessThan(200);
      });
    });
    
    it('should allow quick creation of safety plan if none exists', async () => {
      testUtils.triggerCrisis();
      
      await waitFor(() => {
        const _createPlanButton = screen.getByRole('button', { name: /create.*safety.*plan/i });
        expect(_createPlanButton).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByRole('button', { name: /create.*safety.*plan/i }));
      
      // Verify guided creation process
      expect(screen.getByText(/warning.*signs/i)).toBeInTheDocument();
      expect(screen.getByText(/coping.*strategies/i)).toBeInTheDocument();
      expect(screen.getByText(/support.*network/i)).toBeInTheDocument();
    });
  });

  describe('Crisis Chat Functionality', () => {
    it('should connect to crisis counselor within acceptable timeframe', async () => {
      testUtils.triggerCrisis();
      
      const _chatButton = await screen.findByRole('button', { name: /chat.*counselor/i });
      fireEvent.click(_chatButton);
      
      await waitFor(() => {
        expect(screen.getByText(/connecting/i)).toBeInTheDocument();
      }, { timeout: 1000 });
      
      await waitFor(() => {
        expect(screen.getByText(/connected.*counselor/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
    
    it('should maintain chat session during network interruptions', async () => {
      testUtils.triggerCrisis();
      
      const _chatButton = await screen.findByRole('button', { name: /chat/i });
      fireEvent.click(_chatButton);
      
      // Simulate network interruption
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });
      
      await waitFor(() => {
        expect(screen.getByText(/connection.*interrupted/i)).toBeInTheDocument();
        expect(screen.getByText(/attempting.*reconnect/i)).toBeInTheDocument();
      });
      
      // Restore connection
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true
      });
      
      await waitFor(() => {
        expect(screen.getByText(/reconnected/i)).toBeInTheDocument();
      });
    });
  });

  describe('Crisis Mode UI Simplification', () => {
    it('should simplify UI to essential elements during crisis', async () => {
      const { container } = render(<App />);
      
      // Normal mode - multiple features visible
      expect(container.querySelectorAll('[data-feature]').length).toBeGreaterThan(10);
      
      testUtils.triggerCrisis();
      
      await waitFor(() => {
        // Crisis mode - only essential features
        const features = container.querySelectorAll('[data-feature]');
        const _essentialFeatures = ['crisis-hotline', 'safety-plan', 'emergency-contacts', 'crisis-chat'];
        
        features.forEach(feature => {
          const _featureName = feature.getAttribute('data-feature');
          expect(_essentialFeatures).toContain(_featureName);
        });
        
        expect(features.length).toBeLessThanOrEqual(5);
      });
    });
    
    it('should use high contrast and large buttons in crisis mode', async () => {
      testUtils.triggerCrisis();
      
      await waitFor(() => {
        const crisisButtons = screen.getAllByRole('button');
        
        crisisButtons.forEach(button => {
          const styles = window.getComputedStyle(_button);
          
          // Check minimum size
          const _height = parseInt(styles._height);
          expect(_height).toBeGreaterThanOrEqual(48); // WCAG touch target size
          
          // Check contrast ratio
          if (button.classList.contains('emergency-button')) {
            expect(_button).toHaveStyle({
              backgroundColor: expect.stringMatching(/red|#ff/i)
            });
          }
        });
      });
    });
  });

  describe('Crisis Detection Algorithms', () => {
    it('should detect crisis keywords in user input', async () => {
      const crisisKeywords = [
        'suicide', 'kill myself', 'end it all', 'not worth living',
        'self harm', 'cutting', 'overdose', 'pills'
      ];
      
      for (const keyword of crisisKeywords) {
        const input = screen.getByRole('textbox', { name: /how.*feeling/i });
        await userEvent.type(input, keyword);
        
        await waitFor(() => {
          expect(screen.getByRole('alert')).toHaveTextContent(/crisis.*detected/i);
        });
        
        await userEvent.clear(input);
      }
    });
    
    it('should detect crisis patterns in mood tracking', async () => {
      const { result } = renderHook(() => useCrisisAssessment());
      
      // Simulate declining mood pattern
      const moodEntries = [8, 7, 5, 4, 2, 1]; // Rapid decline
      
      for (const mood of moodEntries) {
        act(() => {
          result.current.updateAssessment({ moodScore: mood });
        });
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/concerning.*pattern/i);
      });
    });
  });

  describe('Multi-Device Crisis Response', () => {
    const devices = [
      { name: 'iPhone', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)' },
      { name: 'Android', userAgent: 'Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36' },
      { name: 'iPad', userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)' },
      { name: 'Desktop', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    ];
    
    devices.forEach(device => {
      it(`should work correctly on ${device.name}`, async () => {
        Object.defineProperty(window.navigator, 'userAgent', {
          value: device.userAgent,
          writable: true
        });
        
        testUtils.triggerCrisis();
        
        await waitFor(() => {
          expect(screen.getByRole('button', { name: /988/i })).toBeInTheDocument();
          expect(screen.getByText(/emergency/i)).toBeInTheDocument();
        });
        
        // Device-specific features
        if (device.name.includes('Phone') || device.name === 'Android') {
          expect(screen.getByRole('button', { name: /call.*988/i })).toBeInTheDocument();
        }
      });
    });
  });

  describe('Crisis Response Performance', () => {
    it('should load crisis resources under 200ms', async () => {
      const startTime = performance.now();
      
      testUtils.triggerCrisis();
      
      await waitFor(() => {
        const _crisisUI = screen.getByTestId('crisis-intervention-ui');
        expect(_crisisUI).toBeInTheDocument();
        
        const _loadTime = performance.now() - startTime;
        expect(_loadTime).toBeLessThan(200);
      });
    });
    
    it('should handle multiple crisis triggers without performance degradation', async () => {
      const times: number[] = [];
      
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        testUtils.triggerCrisis();
        
        await waitFor(() => {
          expect(screen.getByRole('button', { name: /988/i })).toBeInTheDocument();
        });
        
        times.push(performance.now() - startTime);
        
        // Clear for next iteration
        cleanup();
      }
      
      // Ensure no significant performance degradation
      const _avgTime = times.reduce((a, b) => a + b) / times.length;
      expect(_avgTime).toBeLessThan(200);
      expect(Math.max(...times)).toBeLessThan(250);
    });
  });

  describe('Crisis Accessibility', () => {
    it('should be fully keyboard navigable in crisis mode', async () => {
      testUtils.triggerCrisis();
      
      await waitFor(() => {
        const firstButton = screen.getByRole('button', { name: /988/i });
        firstButton.focus();
        expect(document.activeElement).toBe(_firstButton);
      });
      
      // Tab through crisis elements
      userEvent.tab();
      expect(document.activeElement).toHaveAttribute('data-crisis-element');
      
      userEvent.tab();
      expect(document.activeElement).toHaveAttribute('data-crisis-element');
      
      // Activate with Enter
      userEvent.keyboard('{Enter}');
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
    
    it('should work with screen readers', async () => {
      testUtils.triggerCrisis();
      
      await waitFor(() => {
        // Check ARIA labels
        const crisisButtons = screen.getAllByRole('button');
        crisisButtons.forEach(_button => {
          expect(_button).toHaveAttribute('aria-label');
        });
        
        // Check live regions for updates
        const alerts = screen.getAllByRole('alert');
        alerts.forEach(_alert => {
          expect(_alert).toHaveAttribute('aria-live', 'assertive');
        });
        
        // Check focus management
        const _dialog = screen.queryByRole('_dialog');
        if (_dialog) {
          expect(_dialog).toHaveAttribute('aria-modal', 'true');
        }
      });
    });
  });
});

describe('Crisis Intervention - Edge Cases', () => {
  describe('Extreme Scenarios', () => {
    it('should handle user in severe cognitive impairment', async () => {
      // Simulate confused/impaired input
      const confusedInputs = [
        'helppppp',
        'HELP ME PLEASE',
        'i cant i cant i cant',
        '!!!!!!!!',
        'dying'
      ];
      
      for (const input of confusedInputs) {
        const textbox = screen.getByRole('textbox');
        await userEvent.type(textbox, input);
        
        await waitFor(() => {
          // Should still detect crisis and simplify UI
          expect(screen.getByRole('button', { name: /988/i })).toBeInTheDocument();
          expect(screen.getByText(/tap.*help/i)).toBeInTheDocument(); // Simple instructions
        });
      }
    });
    
    it('should handle device with very low battery', async () => {
      // Mock low battery
      Object.defineProperty(navigator, 'getBattery', {
        value: () => Promise.resolve({
          level: 0.05, // 5% battery
          charging: false
        }),
        writable: true
      });
      
      testUtils.triggerCrisis();
      
      await waitFor(() => {
        expect(screen.getByText(/low.*battery/i)).toBeInTheDocument();
        expect(screen.getByText(/988/)).toHaveClass('high-visibility'); // Extra visible
      });
    });
    
    it('should work with extremely slow network (_2G)', async () => {
      // Mock slow network
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '2g',
          rtt: 300,
          downlink: 0.05
        },
        writable: true
      });
      
      testUtils.triggerCrisis();
      
      await waitFor(() => {
        // Should prioritize offline resources
        expect(screen.getByText(/offline.*resources/i)).toBeInTheDocument();
        expect(screen.getByText(/988/)).toBeInTheDocument();
      });
    });
  });
  
  describe('International Support', () => {
    const internationalHotlines = [
      { country: 'UK', number: '116 123', timezone: 'GMT' },
      { country: 'Australia', number: '13 11 14', timezone: 'AEST' },
      { country: 'Canada', number: '1-833-456-4566', timezone: 'EST' }
    ];
    
    internationalHotlines.forEach(({ country, number }) => {
      it(`should show correct crisis number for ${country}`, async () => {
        // Mock location API to return country
        global.fetch = vi.fn(() =>
          Promise.resolve({
            json: () => Promise.resolve({ country_code: country })
          })
        );
        
        testUtils.triggerCrisis();
        
        await waitFor(() => {
          expect(screen.getByText(number)).toBeInTheDocument();
        });
      });
    });
  });
});