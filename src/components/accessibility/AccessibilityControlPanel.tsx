import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Mic,
  MicOff,
  Eye,
  EyeOff,
  Volume2,
  Contrast,
  Settings,
  CheckCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Zap
} from 'lucide-react';
import { logger } from '../../utils/logger';
import {
  _advancedAccessibilityService as advancedAccessibilityService,
  AccessibilityProfile,
  VoiceNavigationAction
} from '../../services/accessibility/AdvancedAccessibilityService';

interface AccessibilityControlPanelProps {
  className?: string;
}

export const AccessibilityControlPanel: React.FC<AccessibilityControlPanelProps> = ({
  className = ''
}) => {
  const [profile, _setProfile] = useState<AccessibilityProfile | null>(null);
  const [isVoiceActive, _setIsVoiceActive] = useState(false);
  const [isEyeTrackingActive, _setIsEyeTrackingActive] = useState(false);
  const [availableCommands, _setAvailableCommands] = useState<VoiceNavigationAction[]>([]);
  const [_isLoading, _setIsLoading] = useState(true);
  const [testingSpeech, _setTestingSpeech] = useState(false);
  const [calibratingEyeTracking, _setCalibratingEyeTracking] = useState(false);

  useEffect(() => {
    initializeAccessibility();
  }, []);

  const initializeAccessibility = async () => {
    try {
      setIsLoading(true);
      
      // Load user profile
      const userProfile = await advancedAccessibilityService.loadAccessibilityProfile();
      setProfile(userProfile);
      
      // Get available voice commands
      const commands = advancedAccessibilityService.getAvailableCommands();
      setAvailableCommands(commands);
      
      // Update active states
      setIsVoiceActive(advancedAccessibilityService.isVoiceNavigationActive());
      setIsEyeTrackingActive(advancedAccessibilityService.isEyeTrackingEnabled());
      
    } catch (error) {
      logger.error('Failed to initialize accessibility', 'AccessibilityControlPanel', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoiceNavigation = async () => {
    try {
      if (isVoiceActive) {
        advancedAccessibilityService.stopVoiceNavigation();
        setIsVoiceActive(false);
        await updateProfile({ voiceNavigation: false });
      } else {
        const success = await advancedAccessibilityService.startVoiceNavigation();
        if (success) {
          setIsVoiceActive(true);
          await updateProfile({ voiceNavigation: true });
        }
      }
    } catch (error) {
      logger.error('Failed to toggle voice navigation', 'AccessibilityControlPanel', error);
    }
  };

  const toggleEyeTracking = async () => {
    try {
      if (isEyeTrackingActive) {
        advancedAccessibilityService.stopEyeTracking();
        setIsEyeTrackingActive(false);
        await updateProfile({ eyeTracking: false });
      } else {
        const success = await advancedAccessibilityService.startEyeTracking();
        if (success) {
          setIsEyeTrackingActive(true);
          await updateProfile({ eyeTracking: true });
        }
      }
    } catch (error) {
      logger.error('Failed to toggle eye tracking', 'AccessibilityControlPanel', error);
    }
  };

  const testSpeech = async () => {
    try {
      setTestingSpeech(true);
      await advancedAccessibilityService.speak(
        'Voice accessibility is working correctly. You can now use voice commands to navigate the application.',
        'normal'
      );
    } catch (error) {
      logger.error('Speech test failed', 'AccessibilityControlPanel', error);
    } finally {
      setTestingSpeech(false);
    }
  };

  const calibrateEyeTracking = async () => {
    try {
      setCalibratingEyeTracking(true);
      await advancedAccessibilityService.speak(
        'Eye tracking calibration started. Please look at each corner of the screen when prompted.',
        'normal'
      );
      
      // Simulate calibration process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await updateProfile({
        eyeTrackingCalibration: {
          ...profile!.preferences.eyeTrackingCalibration,
          isCalibrated: true,
          calibrationTimestamp: Date.now()
        }
      });
      
      await advancedAccessibilityService.speak('Eye tracking calibration completed successfully.');
      
    } catch (error) {
      logger.error('Eye tracking calibration failed', 'AccessibilityControlPanel', error);
    } finally {
      setCalibratingEyeTracking(false);
    }
  };

  const updateProfile = async (updates: Partial<AccessibilityProfile['preferences']>) => {
    try {
      await advancedAccessibilityService.updateProfile(updates);
      const updatedProfile = advancedAccessibilityService.getProfile();
      setProfile(updatedProfile);
    } catch (error) {
      logger.error('Failed to update profile', 'AccessibilityControlPanel', error);
    }
  };

  const toggleHighContrast = async () => {
    const newValue = !profile?.preferences.highContrast;
    await updateProfile({ highContrast: newValue });
  };

  const toggleReducedMotion = async () => {
    const newValue = !profile?.preferences.reducedMotion;
    await updateProfile({ reducedMotion: newValue });
  };

  const toggleTextToSpeech = async () => {
    const newValue = !profile?.preferences.textToSpeech;
    await updateProfile({ textToSpeech: newValue });
  };

  const setVoiceCommandSensitivity = async (sensitivity: 'low' | 'medium' | 'high') => {
    await updateProfile({ voiceCommandSensitivity: sensitivity });
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center space-x-3">
          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading accessibility settings...</span>
        </div>
      </div>
    );
  }

  const commandsByPriority = availableCommands.reduce((acc, cmd) => {
    if (!acc[cmd.priority]) acc[cmd.priority] = [];
    acc[cmd.priority]!.push(cmd);
    return acc;
  }, {} as Record<string, VoiceNavigationAction[]>);

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
        <div className="flex items-center space-x-3">
          <Settings className="w-8 h-8" />
          <div>
            <h2 className="text-xl font-bold">Accessibility Control Panel</h2>
            <p className="text-indigo-100 text-sm">
              Advanced accessibility features and voice navigation
            </p>
          </div>
        </div>
      </div>

      {/* Main Controls */}
      <div className="p-6 space-y-6">
        {/* Voice Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${isVoiceActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                {isVoiceActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Voice Navigation</h3>
                <p className="text-sm text-gray-600">
                  {isVoiceActive ? 'Listening for voice commands' : 'Voice commands disabled'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleVoiceNavigation}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isVoiceActive
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isVoiceActive ? 'Disable' : 'Enable'}
            </button>
          </div>

          {profile?.capabilities.hasVoiceRecognition && (
            <div className="space-y-3">
              {/* Voice Sensitivity */}
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Sensitivity:</span>
                <div className="flex space-x-2">
                  {['low', 'medium', 'high'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setVoiceCommandSensitivity(level as 'low' | 'medium' | 'high')}
                      className={`px-3 py-1 text-xs rounded-full ${
                        profile?.preferences.voiceCommandSensitivity === level
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Test Speech */}
              <button
                onClick={testSpeech}
                disabled={testingSpeech}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                {testingSpeech ? (
                  <>
                    <Volume2 className="w-4 h-4 animate-pulse" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Test Speech</span>
                  </>
                )}
              </button>
            </div>
          )}

          {!profile?.capabilities.hasVoiceRecognition && (
            <div className="flex items-center space-x-2 p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-yellow-700">
                Voice recognition not available in this browser
              </span>
            </div>
          )}
        </motion.div>

        {/* Eye Tracking */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="border rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${isEyeTrackingActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                {isEyeTrackingActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Eye Tracking</h3>
                <p className="text-sm text-gray-600">
                  {isEyeTrackingActive ? 'Tracking eye movements' : 'Eye tracking disabled'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleEyeTracking}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isEyeTrackingActive
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isEyeTrackingActive ? 'Disable' : 'Enable'}
            </button>
          </div>

          {profile?.capabilities.hasEyeTracking && (
            <div className="space-y-3">
              {/* Calibration Status */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  {profile.preferences.eyeTrackingCalibration?.isCalibrated ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-700">Calibrated</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      <span className="text-sm text-orange-700">Needs calibration</span>
                    </>
                  )}
                </div>
                <button
                  onClick={calibrateEyeTracking}
                  disabled={calibratingEyeTracking}
                  className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
                >
                  {calibratingEyeTracking ? (
                    <div className="flex items-center space-x-2">
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Calibrating...</span>
                    </div>
                  ) : (
                    'Calibrate'
                  )}
                </button>
              </div>
            </div>
          )}

          {!profile?.capabilities.hasEyeTracking && (
            <div className="flex items-center space-x-2 p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-yellow-700">
                Eye tracking requires camera access and compatible browser
              </span>
            </div>
          )}
        </motion.div>

        {/* Visual Accessibility */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="border rounded-lg p-4"
        >
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Contrast className="w-5 h-5" />
            <span>Visual Settings</span>
          </h3>

          <div className="space-y-4">
            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-900">High Contrast Mode</span>
                <p className="text-sm text-gray-600">Increase contrast for better visibility</p>
              </div>
              <button
                onClick={toggleHighContrast}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  profile?.preferences.highContrast ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    profile?.preferences.highContrast ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Reduced Motion */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-900">Reduced Motion</span>
                <p className="text-sm text-gray-600">Minimize animations and transitions</p>
              </div>
              <button
                onClick={toggleReducedMotion}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  profile?.preferences.reducedMotion ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    profile?.preferences.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Text to Speech */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-900">Text to Speech</span>
                <p className="text-sm text-gray-600">Read page content aloud</p>
              </div>
              <button
                onClick={toggleTextToSpeech}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  profile?.preferences.textToSpeech ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    profile?.preferences.textToSpeech ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Voice Commands Reference */}
        {availableCommands.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="border rounded-lg p-4"
          >
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>Available Voice Commands</span>
            </h3>

            <div className="space-y-4">
              {Object.entries(commandsByPriority).map(([priority, commands]) => (
                <div key={priority} className="space-y-2">
                  <h4 className={`text-sm font-medium ${
                    priority === 'crisis' ? 'text-red-700' :
                    priority === 'high' ? 'text-orange-700' :
                    priority === 'medium' ? 'text-blue-700' : 'text-gray-700'
                  }`}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {commands.slice(0, 6).map((cmd, index) => (
                      <div
                        key={`${cmd.command}-${index}`}
                        className={`p-2 rounded text-xs ${
                          priority === 'crisis' ? 'bg-red-50 text-red-700' :
                          priority === 'high' ? 'bg-orange-50 text-orange-700' :
                          priority === 'medium' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="font-medium">&ldquo;{cmd.command}&rdquo;</div>
                        <div className="text-xs opacity-75">{cmd.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Capabilities Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-50 rounded-lg p-4"
        >
          <h3 className="font-semibold text-gray-900 mb-3">System Capabilities</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              {profile?.capabilities.hasVoiceRecognition ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              )}
              <span>Voice Recognition</span>
            </div>
            <div className="flex items-center space-x-2">
              {profile?.capabilities.canSpeak ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              )}
              <span>Text to Speech</span>
            </div>
            <div className="flex items-center space-x-2">
              {profile?.capabilities.hasEyeTracking ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              )}
              <span>Eye Tracking</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Keyboard Navigation</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AccessibilityControlPanel;