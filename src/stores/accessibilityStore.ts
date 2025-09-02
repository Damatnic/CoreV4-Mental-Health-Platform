import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AccessibilitySettings {
  // Visual
  highContrast: boolean;
  darkMode: 'auto' | 'light' | 'dark';
  fontSize: number;
  lineSpacing: number;
  fontFamily?: string;
  backgroundColor?: string;
  colorBlindMode?: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
  focusIndicator?: 'default' | 'bold' | 'animated' | 'custom';
  cursorSize?: 'default' | 'large' | 'extra-large';
  
  // Audio
  screenReader: boolean;
  screenReaderMode?: boolean;
  voiceSpeed: number;
  voicePitch: number;
  soundEffects: boolean;
  voiceCommands: boolean;
  voiceNavigation: boolean;
  voiceFeedback: boolean;
  captions: boolean;
  audioDescriptions?: boolean;
  
  // Interaction
  keyboardNavigation: boolean;
  stickyKeys: boolean;
  mouseKeys: boolean;
  touchTargetSize: 'default' | 'large' | 'extra-large';
  gestureControl: boolean;
  dwellClicking: boolean;
  tapAssistance?: boolean;
  scrollAssistance?: boolean;
  
  // Cognitive
  reducedMotion: boolean;
  simplifiedUI: boolean;
  readingMode: boolean;
  autoComplete: boolean;
  extendedTimeouts: boolean;
  errorPrevention: boolean;
  focusMode?: boolean;
  distractionFree?: boolean;
  
  // Language & Communication
  language: string;
  readingLevel?: 'simple' | 'standard' | 'advanced';
  tooltips?: boolean;
  contextualHelp?: boolean;
}

interface AccessibilityPreset {
  id: string;
  name: string;
  description: string;
  settings: Partial<AccessibilitySettings>;
}

interface AccessibilityStore {
  settings: AccessibilitySettings;
  presets: AccessibilityPreset[];
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
  applyPreset: (preset: Partial<AccessibilitySettings>) => void;
  resetToDefaults: () => void;
  addPreset: (preset: AccessibilityPreset) => void;
  removePreset: (presetId: string) => void;
  testAccessibility: () => void;
  announceToScreenReader: (message: string) => void;
  toggleHighContrast: () => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
}

const defaultSettings: AccessibilitySettings = {
  // Visual
  highContrast: false,
  darkMode: 'auto',
  fontSize: 100,
  lineSpacing: 1.5,
  colorBlindMode: 'none',
  focusIndicator: 'default',
  cursorSize: 'default',
  
  // Audio
  screenReader: false,
  screenReaderMode: false,
  voiceSpeed: 1,
  voicePitch: 1,
  soundEffects: false, // DISABLED: Emergency alert sounds were too annoying
  voiceCommands: false,
  voiceNavigation: false,
  voiceFeedback: false,
  captions: false,
  audioDescriptions: false,
  
  // Interaction
  keyboardNavigation: true,
  stickyKeys: false,
  mouseKeys: false,
  touchTargetSize: 'default',
  gestureControl: true,
  dwellClicking: false,
  tapAssistance: false,
  scrollAssistance: false,
  
  // Cognitive
  reducedMotion: false,
  simplifiedUI: false,
  readingMode: false,
  autoComplete: true,
  extendedTimeouts: false,
  errorPrevention: true,
  focusMode: false,
  distractionFree: false,
  
  // Language
  language: 'en',
  readingLevel: 'standard',
  tooltips: true,
  contextualHelp: true
};

const defaultPresets: AccessibilityPreset[] = [
  {
    id: 'low-vision',
    name: 'Low Vision',
    description: 'Optimized for users with low vision',
    settings: {
      highContrast: true,
      fontSize: 150,
      lineSpacing: 2,
      focusIndicator: 'bold' as const,
      cursorSize: 'large' as const
    }
  },
  {
    id: 'dyslexia',
    name: 'Dyslexia Friendly',
    description: 'Easier reading for dyslexia',
    settings: {
      fontSize: 120,
      lineSpacing: 2,
      fontFamily: 'OpenDyslexic',
      backgroundColor: '#FFFBF0',
      readingLevel: 'simple' as const
    }
  },
  {
    id: 'motor',
    name: 'Motor Impairment',
    description: 'Easier interaction for motor difficulties',
    settings: {
      touchTargetSize: 'extra-large' as const,
      stickyKeys: true,
      dwellClicking: true,
      extendedTimeouts: true,
      tapAssistance: true
    }
  },
  {
    id: 'cognitive',
    name: 'Cognitive Support',
    description: 'Simplified and focused interface',
    settings: {
      simplifiedUI: true,
      reducedMotion: true,
      errorPrevention: true,
      autoComplete: true,
      readingLevel: 'simple' as const,
      focusMode: true
    }
  },
  {
    id: 'screen-reader',
    name: 'Screen Reader Optimized',
    description: 'Optimized for screen reader users',
    settings: {
      screenReader: true,
      screenReaderMode: true,
      keyboardNavigation: true,
      focusIndicator: 'bold' as const,
      captions: true
    }
  }
];

export const useAccessibilityStore = create<AccessibilityStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      presets: defaultPresets,

      updateSetting: (key, value) => {
        set((state) => ({
          settings: {
            ...state.settings,
            [key]: value
          }
        }));
        
        // Apply setting immediately
        applyAccessibilitySetting(key, value);
      },

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            ...newSettings
          }
        }));
        
        // Apply all settings
        Object.entries(newSettings).forEach(([key, value]) => {
          applyAccessibilitySetting(key as keyof AccessibilitySettings, value);
        });
      },

      applyPreset: (preset) => {
        const newSettings = {
          ...get().settings,
          ...preset
        };
        
        set({ settings: newSettings });
        
        // Apply all preset settings
        Object.entries(preset).forEach(([key, value]) => {
          applyAccessibilitySetting(key as keyof AccessibilitySettings, value);
        });
      },

      resetToDefaults: () => {
        set({ settings: defaultSettings });
        
        // Apply default settings
        Object.entries(defaultSettings).forEach(([key, value]) => {
          applyAccessibilitySetting(key as keyof AccessibilitySettings, value);
        });
      },

      addPreset: (preset) => {
        set((state) => ({
          presets: [...state.presets, preset]
        }));
      },

      removePreset: (presetId) => {
        set((state) => ({
          presets: state.presets.filter(p => p.id !== presetId)
        }));
      },

      testAccessibility: () => {
        const settings = get().settings;
        
        // Run accessibility tests
        console.log('Running accessibility tests...');
        
        // Test screen reader
        if (settings.screenReader) {
          get().announceToScreenReader('Screen reader test successful');
        }
        
        // Test high contrast
        if (settings.highContrast) {
          document.documentElement.classList.add('accessibility-test');
          setTimeout(() => {
            document.documentElement.classList.remove('accessibility-test');
          }, 2000);
        }
        
        // Test keyboard navigation
        if (settings.keyboardNavigation) {
          const firstFocusable = document.querySelector<HTMLElement>(
            'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          firstFocusable?.focus();
        }
      },

      announceToScreenReader: (message) => {
        // Create or update aria-live region
        let liveRegion = document.getElementById('accessibility-announcer');
        
        if (!liveRegion) {
          liveRegion = document.createElement('div');
          liveRegion.id = 'accessibility-announcer';
          liveRegion.setAttribute('aria-live', 'polite');
          liveRegion.setAttribute('aria-atomic', 'true');
          liveRegion.className = 'sr-only';
          document.body.appendChild(liveRegion);
        }
        
        // Update content to trigger announcement
        liveRegion.textContent = message;
        
        // Also use Web Speech API if available
        if (get().settings.screenReader && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(message);
          utterance.rate = get().settings.voiceSpeed;
          utterance.pitch = get().settings.voicePitch;
          window.speechSynthesis.speak(utterance);
        }
      },

      toggleHighContrast: () => {
        const currentValue = get().settings.highContrast;
        get().updateSetting('highContrast', !currentValue);
      },

      increaseFontSize: () => {
        const currentSize = get().settings.fontSize;
        const newSize = Math.min(currentSize + 10, 200); // Max 200%
        get().updateSetting('fontSize', newSize);
      },

      decreaseFontSize: () => {
        const currentSize = get().settings.fontSize;
        const newSize = Math.max(currentSize - 10, 50); // Min 50%
        get().updateSetting('fontSize', newSize);
      }
    }),
    {
      name: 'accessibility-settings',
      partialize: (state) => ({
        settings: state.settings,
        presets: state.presets
      })
    }
  )
);

// Helper function to apply accessibility settings to the DOM
function applyAccessibilitySetting(key: keyof AccessibilitySettings, value: any) {
  const root = document.documentElement;
  
  switch (key) {
    case 'highContrast':
      root.classList.toggle('high-contrast', value);
      break;
      
    case 'darkMode':
      if (value === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      } else {
        root.setAttribute('data-theme', value);
      }
      break;
      
    case 'fontSize':
      root.style.setProperty('--base-font-size', `${value}%`);
      break;
      
    case 'lineSpacing':
      root.style.setProperty('--line-height', String(value));
      break;
      
    case 'reducedMotion':
      root.classList.toggle('reduced-motion', value);
      break;
      
    case 'focusIndicator':
      root.setAttribute('data-focus-indicator', value);
      break;
      
    case 'colorBlindMode':
      root.setAttribute('data-colorblind-mode', value);
      applyColorBlindFilter(value);
      break;
      
    case 'simplifiedUI':
      root.classList.toggle('simplified-ui', value);
      break;
      
    case 'readingMode':
      root.classList.toggle('reading-mode', value);
      break;
      
    case 'touchTargetSize':
      root.setAttribute('data-touch-target-size', value);
      break;
      
    case 'cursorSize':
      root.setAttribute('data-cursor-size', value);
      break;
      
    case 'fontFamily':
      if (value) {
        root.style.setProperty('--font-family', value);
      }
      break;
      
    case 'backgroundColor':
      if (value) {
        root.style.setProperty('--background-color', value);
      }
      break;
  }
}

// Apply color blind filters
function applyColorBlindFilter(mode: string) {
  // Remove existing filter
  const existingFilter = document.getElementById('colorblind-filter');
  if (existingFilter) {
    existingFilter.remove();
  }
  
  if (mode === 'none') return;
  
  // Create SVG filter based on mode
  const filterValues: Record<string, string> = {
    protanopia: '0.567, 0.433, 0, 0, 0, 0.558, 0.442, 0, 0, 0, 0, 0.242, 0.758, 0, 0, 0, 0, 0, 1, 0',
    deuteranopia: '0.625, 0.375, 0, 0, 0, 0.7, 0.3, 0, 0, 0, 0, 0.3, 0.7, 0, 0, 0, 0, 0, 1, 0',
    tritanopia: '0.95, 0.05, 0, 0, 0, 0, 0.433, 0.567, 0, 0, 0, 0.475, 0.525, 0, 0, 0, 0, 0, 1, 0',
    achromatopsia: '0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0, 0, 0, 1, 0'
  };
  
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.id = 'colorblind-filter';
  svg.style.display = 'none';
  
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
  filter.id = 'colorblind';
  
  const colorMatrix = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix');
  colorMatrix.setAttribute('type', 'matrix');
  const filterValue = (mode && filterValues[mode]) || filterValues.protanopia;
  colorMatrix.setAttribute('values', filterValue!);
  
  filter.appendChild(colorMatrix);
  defs.appendChild(filter);
  svg.appendChild(defs);
  document.body.appendChild(svg);
  
  // Apply filter to root element
  document.documentElement.style.filter = 'url(#colorblind)';
}