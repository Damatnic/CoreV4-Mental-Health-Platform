import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, Volume2, VolumeX, Type, Palette, Monitor,
  Moon, Sun, Zap, ZapOff, Globe, Keyboard, Mouse,
  Smartphone, Headphones, Settings, Check, X,
  ChevronRight, ChevronDown, RefreshCw, Download,
  Upload, HelpCircle, Info, AlertCircle, Brain, Mic,
  MessageSquare, Edit3, Clock, Layout, Book
} from 'lucide-react';
import { useAccessibilityStore, type AccessibilitySettings } from '../../../../stores/accessibilityStore';

interface AccessibilityCommandCenterProps {
  onSettingChange?: (setting: string, value: unknown) => void;
  showCompactView?: boolean;
}

export function AccessibilityCommandCenter({
  onSettingChange,
  showCompactView = false
}: AccessibilityCommandCenterProps) {
  const { settings, updateSetting, applyPreset, resetToDefaults } = useAccessibilityStore();
  
  const [activeSection, setActiveSection] = useState<string>('visual');
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [customPresetName, setCustomPresetName] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [testMode, setTestMode] = useState(false);

  // Accessibility sections configuration
  const sections = [
    {
      id: 'visual',
      label: 'Visual',
      icon: Eye,
      description: 'Display and contrast settings'
    },
    {
      id: 'audio',
      label: 'Audio',
      icon: Volume2,
      description: 'Sound and voice settings'
    },
    {
      id: 'interaction',
      label: 'Interaction',
      icon: Mouse,
      description: 'Navigation and input methods'
    },
    {
      id: 'cognitive',
      label: 'Cognitive',
      icon: Brain,
      description: 'Simplification and focus aids'
    },
    {
      id: 'language',
      label: 'Language',
      icon: Globe,
      description: 'Translation and localization'
    }
  ];

  // Visual accessibility settings
  const visualSettings = [
    {
      id: 'highContrast',
      label: 'High Contrast Mode',
      description: 'Increase contrast for better visibility',
      type: 'toggle',
      value: settings.highContrast,
      icon: Palette
    },
    {
      id: 'darkMode',
      label: 'Dark Mode',
      description: 'Reduce eye strain in low light',
      type: 'select',
      value: settings.darkMode,
      options: ['auto', 'light', 'dark'],
      icon: Moon
    },
    {
      id: 'fontSize',
      label: 'Text Size',
      description: 'Adjust text size for readability',
      type: 'slider',
      value: settings.fontSize,
      min: 80,
      max: 200,
      step: 10,
      unit: '%',
      icon: Type
    },
    {
      id: 'lineSpacing',
      label: 'Line Spacing',
      description: 'Increase space between lines',
      type: 'slider',
      value: settings.lineSpacing,
      min: 1,
      max: 3,
      step: 0.25,
      icon: Type
    },
    {
      id: 'colorBlindMode',
      label: 'Color Blind Mode',
      description: 'Adjust colors for color vision deficiency',
      type: 'select',
      value: settings.colorBlindMode || 'none',
      options: ['none', 'protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'],
      icon: Palette
    },
    {
      id: 'focusIndicator',
      label: 'Focus Indicators',
      description: 'Highlight focused elements',
      type: 'select',
      value: settings.focusIndicator || 'default',
      options: ['default', 'bold', 'animated', 'custom'],
      icon: Eye
    }
  ];

  // Audio accessibility settings
  const audioSettings = [
    {
      id: 'screenReader',
      label: 'Screen Reader',
      description: 'Enable text-to-speech for content',
      type: 'toggle',
      value: settings.screenReader,
      icon: Headphones
    },
    {
      id: 'voiceSpeed',
      label: 'Voice Speed',
      description: 'Adjust screen reader speech rate',
      type: 'slider',
      value: settings.voiceSpeed,
      min: 0.5,
      max: 2,
      step: 0.1,
      icon: Volume2
    },
    {
      id: 'voicePitch',
      label: 'Voice Pitch',
      description: 'Adjust voice pitch preference',
      type: 'slider',
      value: settings.voicePitch,
      min: 0.5,
      max: 2,
      step: 0.1,
      icon: Volume2
    },
    {
      id: 'soundEffects',
      label: 'Sound Effects',
      description: 'Enable audio feedback for actions',
      type: 'toggle',
      value: settings.soundEffects !== false,
      icon: Volume2
    },
    {
      id: 'voiceCommands',
      label: 'Voice Commands',
      description: 'Control app with voice',
      type: 'toggle',
      value: settings.voiceCommands,
      icon: Mic
    },
    {
      id: 'captions',
      label: 'Auto Captions',
      description: 'Show captions for audio content',
      type: 'toggle',
      value: settings.captions,
      icon: MessageSquare
    }
  ];

  // Interaction accessibility settings
  const interactionSettings = [
    {
      id: 'keyboardNavigation',
      label: 'Keyboard Navigation',
      description: 'Navigate without mouse',
      type: 'toggle',
      value: settings.keyboardNavigation !== false,
      icon: Keyboard
    },
    {
      id: 'stickyKeys',
      label: 'Sticky Keys',
      description: 'Press shortcuts one key at a time',
      type: 'toggle',
      value: settings.stickyKeys,
      icon: Keyboard
    },
    {
      id: 'mouseKeys',
      label: 'Mouse Keys',
      description: 'Control mouse with keyboard',
      type: 'toggle',
      value: settings.mouseKeys,
      icon: Mouse
    },
    {
      id: 'touchTargetSize',
      label: 'Touch Target Size',
      description: 'Increase button and link sizes',
      type: 'select',
      value: settings.touchTargetSize,
      options: ['default', 'large', 'extra-large'],
      icon: Smartphone
    },
    {
      id: 'gestureControl',
      label: 'Gesture Control',
      description: 'Use swipes and gestures',
      type: 'toggle',
      value: settings.gestureControl !== false,
      icon: Smartphone
    },
    {
      id: 'dwellClicking',
      label: 'Dwell Clicking',
      description: 'Click by hovering',
      type: 'toggle',
      value: settings.dwellClicking,
      icon: Mouse
    }
  ];

  // Cognitive accessibility settings
  const cognitiveSettings = [
    {
      id: 'reducedMotion',
      label: 'Reduced Motion',
      description: 'Minimize animations',
      type: 'toggle',
      value: settings.reducedMotion,
      icon: ZapOff
    },
    {
      id: 'simplifiedUI',
      label: 'Simplified Interface',
      description: 'Hide complex features',
      type: 'toggle',
      value: settings.simplifiedUI,
      icon: Layout
    },
    {
      id: 'readingMode',
      label: 'Reading Mode',
      description: 'Focus on content only',
      type: 'toggle',
      value: settings.readingMode,
      icon: Book
    },
    {
      id: 'autoComplete',
      label: 'Auto Complete',
      description: 'Suggest text as you type',
      type: 'toggle',
      value: settings.autoComplete !== false,
      icon: Edit3
    },
    {
      id: 'timeouts',
      label: 'Extended Timeouts',
      description: 'More time for actions',
      type: 'toggle',
      value: settings.extendedTimeouts,
      icon: Clock
    },
    {
      id: 'errorPrevention',
      label: 'Error Prevention',
      description: 'Confirm important actions',
      type: 'toggle',
      value: settings.errorPrevention !== false,
      icon: AlertCircle
    }
  ];

  // Get settings for active section
  const getActiveSettings = () => {
    switch (activeSection) {
      case 'visual': return visualSettings;
      case 'audio': return audioSettings;
      case 'interaction': return interactionSettings;
      case 'cognitive': return cognitiveSettings;
      default: return visualSettings;
    }
  };

  // Handle setting change
  const handleSettingChange = useCallback((settingId: string, value: unknown) => {
    updateSetting(settingId as keyof AccessibilitySettings, value as string | number | boolean | undefined);
    onSettingChange?.(settingId, value);
    
    // Announce change for screen readers
    if (settings.screenReader) {
      const utterance = new SpeechSynthesisUtterance(`${settingId} changed to ${value}`);
      window.speechSynthesis.speak(utterance);
    }
  }, [updateSetting, onSettingChange, settings.screenReader]);

  // Render setting control based on type
  const renderSettingControl = (setting: any) => {
    switch (setting.type) {
      case 'toggle':
        return (
          <button
            onClick={() => handleSettingChange(setting.id, !setting.value)}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${setting.value ? 'bg-blue-600' : 'bg-gray-300'}
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            `}
            role="switch"
            aria-checked={setting.value}
            aria-label={`${setting.label}: ${setting.value ? 'On' : 'Off'}`}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${setting.value ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        );
        
      case 'select':
        return (
          <select
            value={setting.value}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={setting.label}
          >
            {setting.options.map((option: string) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        );
        
      case 'slider':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min={setting.min}
              max={setting.max}
              step={setting.step}
              value={setting.value}
              onChange={(e) => handleSettingChange(setting.id, parseFloat(e.target.value))}
              className="flex-1"
              aria-label={setting.label}
              aria-valuenow={setting.value}
              aria-valuemin={setting.min}
              aria-valuemax={setting.max}
            />
            <span className="text-sm font-medium w-12 text-right">
              {setting.value}{setting.unit || ''}
            </span>
          </div>
        );
        
      default:
        return null;
    }
  };

  // Accessibility presets
  const accessibilityPresets = [
    {
      id: 'low-vision',
      name: 'Low Vision',
      description: 'Optimized for users with low vision',
      settings: {
        highContrast: true,
        fontSize: 150,
        lineSpacing: 2,
        focusIndicator: 'bold'
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
        backgroundColor: '#FFFBF0'
      }
    },
    {
      id: 'motor',
      name: 'Motor Impairment',
      description: 'Easier interaction for motor difficulties',
      settings: {
        touchTargetSize: 'extra-large',
        stickyKeys: true,
        dwellClicking: true,
        extendedTimeouts: true
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
        autoComplete: true
      }
    }
  ];

  if (showCompactView) {
    // Compact view for quick access
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Quick Accessibility</h3>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-1 hover:bg-gray-100 rounded"
            aria-label="Accessibility help"
          >
            <HelpCircle className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleSettingChange('highContrast', !settings.highContrast)}
            className={`
              p-2 rounded-lg border text-sm font-medium transition-all
              ${settings.highContrast 
                ? 'bg-black text-white border-black' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            High Contrast
          </button>
          
          <button
            onClick={() => handleSettingChange('screenReader', !settings.screenReader)}
            className={`
              p-2 rounded-lg border text-sm font-medium transition-all
              ${settings.screenReader 
                ? 'bg-blue-500 text-white border-blue-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            Screen Reader
          </button>
          
          <button
            onClick={() => handleSettingChange('fontSize', settings.fontSize === 100 ? 150 : 100)}
            className="p-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50"
          >
            Text: {settings.fontSize}%
          </button>
          
          <button
            onClick={() => handleSettingChange('reducedMotion', !settings.reducedMotion)}
            className={`
              p-2 rounded-lg border text-sm font-medium transition-all
              ${settings.reducedMotion 
                ? 'bg-purple-500 text-white border-purple-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            Reduced Motion
          </button>
        </div>
      </div>
    );
  }

  // Full command center view
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Accessibility Command Center</h2>
            <p className="text-blue-100">Customize your experience for better accessibility</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPresetMenu(!showPresetMenu)}
              className="px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
            >
              Presets
            </button>
            
            <button
              onClick={resetToDefaults}
              className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
              aria-label="Reset to defaults"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Preset menu */}
      {showPresetMenu && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Presets</h3>
          <div className="grid grid-cols-2 gap-2">
            {accessibilityPresets.map(preset => (
              <button
                key={preset.id}
                onClick={() => {
                  applyPreset(preset.settings as Partial<AccessibilitySettings>);
                  setShowPresetMenu(false);
                }}
                className="p-3 bg-white rounded-lg hover:shadow-md transition-all text-left"
              >
                <div className="font-medium text-sm">{preset.name}</div>
                <div className="text-xs text-gray-500 mt-1">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Section tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {sections.map(section => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`
                flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap
                ${activeSection === section.id 
                  ? 'border-blue-500 text-blue-600 bg-blue-50' 
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
              aria-selected={activeSection === section.id}
              role="tab"
            >
              <Icon className="h-4 w-4" />
              <span className="font-medium">{section.label}</span>
            </button>
          );
        })}
      </div>

      {/* Settings content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {getActiveSettings().map(setting => {
              const Icon = setting.icon;
              return (
                <div
                  key={setting.id}
                  className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Icon className="h-5 w-5 text-gray-600" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="input_r2bti0dds" className="font-medium text-gray-900">
                        {setting.label}
                      </label>
                      {renderSettingControl(setting)}
                    </div>
                    <p className="text-sm text-gray-500">{setting.description}</p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Test mode */}
      <div className="px-6 pb-6">
        <button
          onClick={() => setTestMode(!testMode)}
          className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          {testMode ? 'Exit Test Mode' : 'Test Accessibility Settings'}
        </button>
        
        {testMode && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Test mode active. Navigate the interface to experience your accessibility settings.
              All changes are applied in real-time.
            </p>
          </div>
        )}
      </div>

      {/* Help overlay */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-3">Accessibility Help</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p>• Use Tab to navigate between controls</p>
              <p>• Press Space or Enter to activate buttons</p>
              <p>• Use arrow keys to adjust sliders</p>
              <p>• Screen reader users: Enable screen reader mode for audio feedback</p>
              <p>• Keyboard shortcuts are available for most actions</p>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Close Help
            </button>
          </div>
        </div>
      )}
    </div>
  );
}