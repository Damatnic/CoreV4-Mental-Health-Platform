import _React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConsoleSound } from '../services/console/ConsoleSoundSystem';
import { performanceMonitor } from '../utils/performance/performanceMonitor';
import { logger } from '../utils/logger';

interface ConsoleFocusable {
  id: string;
  element: HTMLElement;
  priority: number; // Higher priority = focused first
  group: string; // Navigation group (e.g., 'main-nav', 'dashboard-tiles', 'sidebar')
  bounds?: DOMRect; // Cached element bounds for performance
  lastFocused?: number; // Timestamp of last focus for cleanup
}

interface ConsoleNavigationState {
  currentFocusId: string | null;
  currentGroup: string;
  navigationMode: 'mouse' | 'keyboard' | 'gamepad';
  focusables: ConsoleFocusable[];
  isPerformanceMode: boolean; // For low-end devices
  lastInteraction: number; // For cleanup optimization
  frameRate: number; // Current frame rate for adaptive performance
}

export function useConsoleNavigation() {
  const navigate = useNavigate();
  const { onFocus, onSelect, onBack } = useConsoleSound();
  const __frameRateMonitorRef   = useRef<number>(60);
  const lastCleanupRef = useRef<number>(0);
  const interactionTimeoutRef = useRef<number | null>(null);
  const boundsCacheRef = useRef<Map<string, DOMRect>>(new Map());
  
  // Detect device performance capabilities
  const isLowEndDevice = useMemo(() => {
    const memory = (navigator as unknown).deviceMemory;
    const cores = navigator.hardwareConcurrency;
    return (memory && memory <= 4) || (cores && cores <= 2);
  }, []);
  
  const [state, _setState] = useState<ConsoleNavigationState>({
    currentFocusId: null,
    currentGroup: 'dashboard-tiles',
    navigationMode: 'mouse',
    focusables: [],
    isPerformanceMode: isLowEndDevice,
    lastInteraction: Date.now(),
    frameRate: 60,
  });
  
  // Monitor frame rate for adaptive performance
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const _measureFrameRate = () => {
      const now = performance.now();
      frameCount++;
      
      if (now - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (now - lastTime));
        frameRateMonitorRef.current = fps;
        
        setState(prev => ({
          ...prev,
          frameRate: fps,
          isPerformanceMode: fps < 45 || prev.isPerformanceMode
        }));
        
        frameCount = 0;
        lastTime = now;
        
        // Record frame rate metrics
        performanceMonitor.recordMetric('console_frame_rate', fps, {
          isLowEndDevice,
          navigationMode: state.navigationMode
        });
      }
      
      requestAnimationFrame(_measureFrameRate);
    };
    
    const _animationId = requestAnimationFrame(_measureFrameRate);
    return () => cancelAnimationFrame(_animationId);
  }, [isLowEndDevice, state.navigationMode]);

  // Register a focusable element with performance optimizations
  const __registerFocusable   = useCallback((focusable: ConsoleFocusable) => {
    const startTime = performance.now();
    
    // Cache element bounds for faster lookups
    if (focusable.element) {
      const bounds = focusable.element.getBoundingClientRect();
      boundsCacheRef.current.set(focusable.id, bounds);
      focusable.bounds = bounds;
      focusable.lastFocused = Date.now();
    }
    
    setState(prev => {
      const filtered = prev.focusables.filter(f => f.id !== focusable.id);
      const newFocusables = [...filtered, focusable]
        .sort((a, b) => b.priority - a.priority);
      
      return {
        ...prev,
        focusables: newFocusables,
      };
    });
    
    // Performance monitoring
    const registrationTime = performance.now() - startTime;
    if (registrationTime > 1) {
      performanceMonitor.recordMetric('focusable_registration_slow', registrationTime, {
        focusableId: focusable.id,
        group: focusable.group
      });
    }
  }, []);

  // Unregister a focusable element with cleanup
  const __unregisterFocusable   = useCallback((id: string) => {
    // Clean up cached bounds
    boundsCacheRef.current.delete(id);
    
    setState(prev => ({
      ...prev,
      focusables: prev.focusables.filter(f => f.id !== id),
      currentFocusId: prev.currentFocusId === id ? null : prev.currentFocusId,
    }));
  }, []);

  // Get focusables in current group with memoization
  const ____getCurrentGroupFocusables   = useCallback(() => {
    return state.focusables.filter(f => f.group === state.currentGroup);
  }, [state.focusables, state.currentGroup]);
  
  // Memoized group focusables for performance
  const currentGroupFocusables = useMemo(() => {
    return state.focusables.filter(f => f.group === state.currentGroup);
  }, [state.focusables, state.currentGroup]);

  // Set focus to specific element with performance optimizations
  const setFocus = useCallback((id: string) => {
    if (!id) return; // Guard against empty id
    
    const startTime = performance.now();
    const focusable = state.focusables.find(f => f.id === id);
    
    if (focusable?.element) {
      try {
        // Update interaction timestamp
        setState(prev => ({ ...prev, currentFocusId: id, lastInteraction: Date.now() }));
        
        // Focus element with performance consideration
        if (!state.isPerformanceMode) {
          focusable.element.focus({ preventScroll: false });
        } else {
          // Reduced animations for low-end devices
          focusable.element.focus({ preventScroll: true });
        }
        
        // Batch DOM updates for better performance
        requestAnimationFrame(() => {
          // Add console focus styling
          focusable.element?.classList.add('console-focused');
          
          // Remove focus styling from other elements (_throttled)
          const now = Date.now();
          if (now - lastCleanupRef.current > 16) { // ~60fps throttling
            state.focusables.forEach(f => {
              if (f.id !== id && f.element?.classList) {
                f.element.classList.remove('console-focused');
              }
            });
            lastCleanupRef.current = now;
          }
        });

        // Play console focus sound with performance consideration
        if (!state.isPerformanceMode) {
          onFocus();
        }
        
        // Update last focused timestamp
        focusable.lastFocused = Date.now();
        
        // Performance monitoring
        const focusTime = performance.now() - startTime;
        if (focusTime > 5) {
          performanceMonitor.recordMetric('focus_operation_slow', focusTime, {
            focusableId: id,
            isPerformanceMode: state.isPerformanceMode
          });
        }
      } catch (error  ) {
        logger.warn('Error setting focus on element:');
        performanceMonitor.recordMetric('focuserror', 1, { focusableId: id, undefined: String(_undefined) });
      }
    }
  }, [state.focusables, state.isPerformanceMode, onFocus]);

  // Enhanced 2D navigation with spatial awareness and performance optimizations
  const navigate2D = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    const startTime = performance.now();
    
    if (currentGroupFocusables.length === 0) return;

    const currentIndex = currentGroupFocusables.findIndex(f => f.id === state.currentFocusId);
    if (currentIndex === -1) {
      // Focus first element if nothing is focused
      const firstFocusable = currentGroupFocusables[0];
      if (firstFocusable?.id) {
        setFocus(firstFocusable.id);
      }
      return;
    }
    
    const currentFocusable = currentGroupFocusables[currentIndex];
    if (!currentFocusable?.element) return;
    
    // Use cached bounds or calculate new ones
    let currentBounds = boundsCacheRef.current.get(currentFocusable.id);
    if (!currentBounds) {
      currentBounds = currentFocusable.element.getBoundingClientRect();
      boundsCacheRef.current.set(currentFocusable.id, currentBounds);
    }
    
    const currentCenter = {
      x: currentBounds.left + currentBounds.width / 2,
      y: currentBounds.top + currentBounds.height / 2,
    };
    
    // Find best match using spatial distance instead of grid-based navigation
    let bestMatch: ConsoleFocusable | null = null;
    let bestDistance = Infinity;
    let bestAlignment = 0;
    
    for (const focusable of currentGroupFocusables) {
      if (focusable.id === state.currentFocusId || !focusable.element) continue;
      
      // Use cached bounds or calculate
      let bounds = boundsCacheRef.current.get(focusable.id);
      if (!bounds) {
        bounds = focusable.element.getBoundingClientRect();
        boundsCacheRef.current.set(focusable.id, bounds);
      }
      
      const center = {
        x: bounds.left + bounds.width / 2,
        y: bounds.top + bounds.height / 2,
      };
      
      const deltaX = center.x - currentCenter.x;
      const deltaY = center.y - currentCenter.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      let isValidDirection = false;
      let alignment = 0;
      
      switch (_direction) {
        case 'up':
          isValidDirection = deltaY < -10; // Must be significantly above
          alignment = 1 - Math.abs(_deltaX) / window.innerWidth; // Prefer aligned horizontally
          break;
        case 'down':
          isValidDirection = deltaY > 10; // Must be significantly below
          alignment = 1 - Math.abs(_deltaX) / window.innerWidth;
          break;
        case 'left':
          isValidDirection = deltaX < -10; // Must be significantly to the left
          alignment = 1 - Math.abs(_deltaY) / window.innerHeight; // Prefer aligned vertically
          break;
        case 'right':
          isValidDirection = deltaX > 10; // Must be significantly to the right
          alignment = 1 - Math.abs(_deltaY) / window.innerHeight;
          break;
      }
      
      if (isValidDirection) {
        // Score combines distance and alignment
        const score = distance - (alignment * 100); // Alignment bonus
        
        if (score < bestDistance || (score === bestDistance && alignment > bestAlignment)) {
          bestMatch = focusable;
          bestDistance = score;
          bestAlignment = alignment;
        }
      }
    }
    
    // Focus the best match
    if (bestMatch?.id) {
      setFocus(bestMatch.id);
    }
    
    // Performance monitoring
    const navigationTime = performance.now() - startTime;
    if (navigationTime > 10) {
      performanceMonitor.recordMetric('navigation_slow', navigationTime, {
        direction,
        itemCount: currentGroupFocusables.length,
        foundMatch: !!bestMatch
      });
    }
  }, [state.currentFocusId, currentGroupFocusables, setFocus]);

  // Switch navigation group
  const switchGroup = useCallback((group: string) => {
    if (!group) return; // Guard against empty group name
    
    setState(prev => ({ ...prev, currentGroup: group }));
    const groupFocusables = state.focusables.filter(f => f.group === group);
    if (groupFocusables.length > 0) {
      const firstFocusable = groupFocusables[0];
      if (firstFocusable && firstFocusable.id) {
        setFocus(firstFocusable.id);
      }
    }
  }, [state.focusables, setFocus]);

  // Activate current focused element
  const activateCurrent = useCallback(() => {
    if (state.currentFocusId) {
      const focusable = state.focusables.find(f => f.id === state.currentFocusId);
      if (focusable && focusable.element) {
        try {
          // Add console activation animation
          if (focusable.element.classList) {
            focusable.element.classList.add('console-activated');
            setTimeout(() => {
              if (focusable.element && focusable.element.classList) {
                focusable.element.classList.remove('console-activated');
              }
            }, 200);
          }
          
          focusable.element.click();
          onSelect();
        } catch (error) {
    logger.warn('Error activating element:');
        }
      }
    }
  }, [state.currentFocusId, state.focusables, onSelect]);


  // Optimized keyboard event handler with debouncing
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Only handle navigation keys when not typing in input fields
    if (event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.contentEditable === 'true') {
      return;
    }

    const startTime = performance.now();
    setState(prev => ({ ...prev, navigationMode: 'keyboard', lastInteraction: Date.now() }));
    
    // Clear any existing interaction timeout
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }
    
    // Throttle rapid keypresses for performance
    interactionTimeoutRef.current = window.setTimeout(() => {
      performanceMonitor.recordMetric('keyboardinteraction', performance.now() - startTime);
    }, 100);

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        navigate2D('up');
        break;

      case 'ArrowDown':
        event.preventDefault();
        navigate2D('down');
        break;

      case 'ArrowLeft':
        event.preventDefault();
        navigate2D('left');
        break;

      case 'ArrowRight':
        event.preventDefault();
        navigate2D('right');
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        activateCurrent();
        break;

      case 'Tab':
        event.preventDefault();
        if (event.shiftKey) {
          // Switch to previous group
          const groups = ['main-nav', 'dashboard-tiles', 'sidebar'];
          const currentIndex = groups.indexOf(state.currentGroup);
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : groups.length - 1;
          const _prevGroup = groups[prevIndex];
          if (_prevGroup) {
            switchGroup(_prevGroup);
          }
        } else {
          // Switch to next group
          const groups = ['main-nav', 'dashboard-tiles', 'sidebar'];
          const currentIndex = groups.indexOf(state.currentGroup);
          const nextIndex = (currentIndex + 1) % groups.length;
          const _nextGroup = groups[nextIndex];
          if (_nextGroup) {
            switchGroup(_nextGroup);
          }
        }
        break;

      case 'Escape':
        event.preventDefault();
        // Go to home/dashboard
        onBack();
        navigate('/');
        break;

      // Quick navigation shortcuts
      case '1':
        if (event.ctrlKey) {
          event.preventDefault();
          navigate('/');
        }
        break;
      case '2':
        if (event.ctrlKey) {
          event.preventDefault();
          navigate('/wellness');
        }
        break;
      case '3':
        if (event.ctrlKey) {
          event.preventDefault();
          navigate('/community');
        }
        break;
      case '4':
        if (event.ctrlKey) {
          event.preventDefault();
          navigate('/professional');
        }
        break;
      case '9':
        if (event.ctrlKey) {
          event.preventDefault();
          navigate('/crisis');
        }
        break;
    }
  }, [navigate2D, activateCurrent, switchGroup, navigate, state.currentGroup, onBack]);

  // Mouse event handler - switch to mouse mode
  const handleMouseMove = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      navigationMode: 'mouse',
      currentFocusId: null 
    }));
    
    // Remove all console focus styling when switching to mouse
    state.focusables.forEach(f => {
      if (f.element && f.element.classList) {
        try {
          f.element.classList.remove('console-focused');
        } catch (error) {
    logger.warn('Error removing focus styling:');
        }
      }
    });
  }, [state.focusables]);

  // Initialize navigation system
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousemove', handleMouseMove);

    // Set initial focus on dashboard tiles
    const _timer = setTimeout(() => {
      const dashboardTiles = state.focusables.filter(f => f.group === 'dashboard-tiles');
      if (dashboardTiles.length > 0) {
        const firstTile = dashboardTiles[0];
        if (firstTile && firstTile.id) {
          setFocus(firstTile.id);
        }
      }
    }, 500);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(_timer);
    };
  }, [handleKeyDown, handleMouseMove, state.focusables, setFocus]);

  // Enhanced gamepad support with performance monitoring
  useEffect(() => {
    let gamepadIndex: number | null = null;
    let lastButtonStates: boolean[] = [];
    let lastAxisStates: number[] = [];
    let _gamepadConnected = false;

    const checkGamepad = () => {
      // Skip if no gamepad API or performance mode is active
      if (!navigator.getGamepads || state.isPerformanceMode) return;
      
      try {
        const gamepads = navigator.getGamepads();
        if (!gamepads || gamepads.length === 0) {
          if (_gamepadConnected) {
            _gamepadConnected = false;
            performanceMonitor.recordMetric('gamepad_disconnected', Date.now());
          }
          return;
        }
        
        const gamepad = gamepads[0]; // Use first connected gamepad

        if (gamepad && gamepadIndex === null) {
          gamepadIndex = 0;
          _gamepadConnected = true;
          setState(prev => ({ ...prev, navigationMode: 'gamepad', lastInteraction: Date.now() }));
          performanceMonitor.recordMetric('gamepad_connected', Date.now(), {
            id: gamepad.id,
            buttons: gamepad.buttons.length,
            axes: gamepad.axes.length
          });
        }

        if (gamepad && gamepadIndex !== null && gamepad.axes && gamepad.buttons) {
          // Optimized axis handling with deadzone and smoothing
          const deadzone = 0.3;
          const rawVertical = gamepad.axes[1];
          const rawHorizontal = gamepad.axes[0];
          
          // Ensure axis values are defined before processing
          if (rawVertical !== undefined && rawHorizontal !== undefined) {
            const verticalAxis = Math.abs(_rawVertical) > deadzone ? rawVertical : 0;
            const horizontalAxis = Math.abs(_rawHorizontal) > deadzone ? rawHorizontal : 0;
            
            // Only process if axis state changed significantly
            const _axisChanged = (
              Math.abs((lastAxisStates[1] || 0) - verticalAxis) > 0.2 ||
              Math.abs((lastAxisStates[0] || 0) - horizontalAxis) > 0.2
            );
            
            if (_axisChanged) {
              if (verticalAxis < -0.5) navigate2D('up');
              if (verticalAxis > 0.5) navigate2D('down');
              if (horizontalAxis < -0.5) navigate2D('left');
              if (horizontalAxis > 0.5) navigate2D('right');
              
              lastAxisStates = [horizontalAxis, verticalAxis];
            }
          }

          // Enhanced button handling with timing
          const buttonA = gamepad.buttons[0];
          const buttonB = gamepad.buttons[1];
          const buttonX = gamepad.buttons[2];
          const buttonY = gamepad.buttons[3];
          
          if (buttonA?.pressed && !lastButtonStates[0]) {
            activateCurrent();
          }
          if (buttonB?.pressed && !lastButtonStates[1]) {
            navigate('/'); // Back to home
          }
          if (buttonX?.pressed && !lastButtonStates[2]) {
            // Quick access to wellness tools
            navigate('/wellness');
          }
          if (buttonY?.pressed && !lastButtonStates[3]) {
            // Quick access to crisis support
            navigate('/crisis');
          }

          // Update button states efficiently
          lastButtonStates = gamepad.buttons.map(b => b?.pressed || false);
        }
      } catch (error) {
        // Log gamepad errors for monitoring but don't break functionality
        performanceMonitor.recordMetric('gamepaderror', 1, {
          error: String(error)
        });
      }
    };

    // Adaptive polling rate based on performance
    const pollingRate = state.frameRate < 30 ? 200 : 100; // Slower polling for low-end devices
    const _gamepadInterval = setInterval(checkGamepad, pollingRate);
    
    return () => {
      clearInterval(_gamepadInterval);
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, [navigate2D, activateCurrent, navigate, state.isPerformanceMode, state.frameRate]);
  
  // Cleanup old focusable elements periodically
  useEffect(() => {
    const _cleanupInterval = setInterval(() => {
      const now = Date.now();
      const staleThreshold = 30000; // 30 seconds
      
      setState(prev => ({
        ...prev,
        focusables: prev.focusables.filter(f => {
          if (!f.lastFocused) return true;
          if (now - f.lastFocused > staleThreshold) {
            // Clean up cache
            boundsCacheRef.current.delete(f.id);
            return false;
          }
          return true;
        })
      }));
    }, 60000); // Run every minute
    
    return () => clearInterval(_cleanupInterval);
  }, []);

  // Performance metrics for the hook
  const __getPerformanceMetrics   = useCallback(() => {
    return {
      frameRate: state.frameRate,
      isPerformanceMode: state.isPerformanceMode,
      focusableCount: state.focusables.length,
      currentGroup: state.currentGroup,
      navigationMode: state.navigationMode,
      cacheSize: boundsCacheRef.current.size,
    };
  }, [state]);

  return {
    registerFocusable,
    unregisterFocusable,
    setFocus,
    navigate2D,
    switchGroup,
    activateCurrent,
    currentFocusId: state.currentFocusId,
    currentGroup: state.currentGroup,
    navigationMode: state.navigationMode,
    focusables: state.focusables,
    isPerformanceMode: state.isPerformanceMode,
    frameRate: state.frameRate,
    getPerformanceMetrics,
  };
}