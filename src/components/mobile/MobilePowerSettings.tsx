import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Smartphone, 
  Vibrate, 
  Volume2, 
  VolumeX,
  Sun,
  Moon,
  Zap,
  Battery,
  Wifi,
  WifiOff,
  Bell,
  BellOff,
  Eye,
  EyeOff,
  Accessibility,
  Languages,
  Palette,
  Shield,
  Download,
  X
} from 'lucide-react';
import { useMobileFeatures } from '../../hooks/useMobileFeatures';

interface MobilePowerSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SettingItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  type: 'toggle' | 'select' | 'action';
  value?: boolean | string;
  options?: string[];
  action?: () => void;
  color?: string;
}

export function MobilePowerSettings({ isOpen, onClose }: MobilePowerSettingsProps) {
  const { canVibrate, canInstall, installApp, deviceInfo } = useMobileFeatures();
  const [settings, setSettings] = useState<Record<string, boolean | string>>({
    darkMode: localStorage.getItem('darkMode') === 'true',
    notifications: localStorage.getItem('notifications') !== 'false',
    vibration: localStorage.getItem('vibration') !== 'false',
    sound: localStorage.getItem('sound') !== 'false',
    reducedMotion: localStorage.getItem('reducedMotion') === 'true',
    highContrast: localStorage.getItem('highContrast') === 'true',
    textSize: localStorage.getItem('textSize') || 'medium',
    language: localStorage.getItem('language') || 'en',
    theme: localStorage.getItem('theme') || 'blue'
  });

  const settingsItems: SettingItem[] = [
    {
      id: 'darkMode',
      label: 'Dark Mode',
      description: 'Easier on the eyes in low light',
      icon: settings.darkMode ? Moon : Sun,
      type: 'toggle',
      value: settings.darkMode as boolean,
      color: 'from-indigo-500 to-purple-500'
    },
    {
      id: 'notifications',
      label: 'Push Notifications',
      description: 'Get wellness reminders and updates',
      icon: settings.notifications ? Bell : BellOff,
      type: 'toggle',
      value: settings.notifications as boolean,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'vibration',
      label: 'Haptic Feedback',
      description: 'Feel vibrations for interactions',
      icon: Vibrate,
      type: 'toggle',
      value: settings.vibration as boolean,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'sound',
      label: 'Sound Effects',
      description: 'Audio feedback for actions',
      icon: settings.sound ? Volume2 : VolumeX,
      type: 'toggle',
      value: settings.sound as boolean,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'reducedMotion',
      label: 'Reduce Motion',
      description: 'Minimize animations for comfort',
      icon: Eye,
      type: 'toggle',
      value: settings.reducedMotion as boolean,
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'highContrast',
      label: 'High Contrast',
      description: 'Enhanced visibility for accessibility',
      icon: Accessibility,
      type: 'toggle',
      value: settings.highContrast as boolean,
      color: 'from-yellow-500 to-orange-500'
    },
    {
      id: 'textSize',
      label: 'Text Size',
      description: 'Adjust text size for readability',
      icon: Eye,
      type: 'select',
      value: settings.textSize as string,
      options: ['small', 'medium', 'large', 'extra-large'],
      color: 'from-gray-500 to-gray-600'
    },
    {
      id: 'theme',
      label: 'Accent Color',
      description: 'Customize the app appearance',
      icon: Palette,
      type: 'select',
      value: settings.theme as string,
      options: ['blue', 'purple', 'green', 'orange', 'pink'],
      color: 'from-rainbow'
    }
  ];

  const quickActions = [
    {
      id: 'install',
      label: 'Install App',
      description: 'Add to home screen',
      icon: Download,
      action: installApp,
      visible: canInstall,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'offline',
      label: 'Offline Mode',
      description: 'Download for offline use',
      icon: WifiOff,
      action: () => console.log('Offline mode'),
      visible: true,
      color: 'from-gray-500 to-gray-600'
    }
  ];

  const handleSettingChange = (id: string, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [id]: value }));
    localStorage.setItem(id, String(value));
    
    // Apply settings immediately
    switch (id) {
      case 'darkMode':
        document.documentElement.classList.toggle('dark', value as boolean);
        break;
      case 'highContrast':
        document.documentElement.classList.toggle('high-contrast', value as boolean);
        break;
      case 'reducedMotion':
        document.documentElement.classList.toggle('reduce-motion', value as boolean);
        break;
      case 'textSize':
        document.documentElement.className = document.documentElement.className
          .replace(/text-size-\w+/g, '')
          .concat(` text-size-${value}`);
        break;
    }
    
    // Haptic feedback
    if (canVibrate && settings.vibration) {
      navigator.vibrate(30);
    }
  };

  const DeviceInfo = () => (
    <div className="bg-gray-700/30 rounded-2xl p-4 mb-6">
      <div className="flex items-center space-x-3 mb-3">
        <Smartphone className="w-5 h-5 text-blue-400" />
        <h4 className="font-semibold text-white">Device Info</h4>
      </div>
      <div className="space-y-2 text-sm text-gray-300">
        <div className="flex justify-between">
          <span>Platform:</span>
          <span className="capitalize">{deviceInfo.isIOS ? 'iOS' : deviceInfo.isAndroid ? 'Android' : 'Web'}</span>
        </div>
        <div className="flex justify-between">
          <span>Screen Size:</span>
          <span className="uppercase">{deviceInfo.screenSize}</span>
        </div>
        <div className="flex justify-between">
          <span>Touch Support:</span>
          <span>{deviceInfo.hasTouch ? 'Yes' : 'No'}</span>
        </div>
        <div className="flex justify-between">
          <span>PWA Mode:</span>
          <span>{deviceInfo.isPWA ? 'Yes' : 'No'}</span>
        </div>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-gray-800/95 backdrop-blur-xl rounded-t-3xl max-h-[90vh] overflow-y-auto"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mt-3 mb-6" />
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Mobile Settings</h3>
                  <p className="text-sm text-gray-400">Optimize your experience</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
              >
                <X className="w-5 h-5 text-gray-300" />
              </button>
            </div>

            <div className="px-6 pb-6 space-y-6">
              {/* Quick Actions */}
              {quickActions.some(action => action.visible) && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {quickActions.filter(action => action.visible).map(action => (
                      <motion.button
                        key={action.id}
                        onClick={action.action}
                        className={`p-4 bg-gradient-to-r ${action.color} rounded-2xl text-white transition-all`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <action.icon className="w-6 h-6 mb-2 mx-auto" />
                        <div className="text-sm font-medium">{action.label}</div>
                        <div className="text-xs opacity-80">{action.description}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Settings */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Preferences</h4>
                <div className="space-y-3">
                  {settingsItems.map(item => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.id}
                        className="flex items-center justify-between p-4 bg-gray-700/30 rounded-2xl"
                        whileHover={{ backgroundColor: 'rgba(107, 114, 128, 0.4)' }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 bg-gradient-to-r ${item.color} rounded-xl flex items-center justify-center`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{item.label}</p>
                            <p className="text-sm text-gray-400">{item.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0">
                          {item.type === 'toggle' ? (
                            <motion.button
                              className={`w-12 h-7 rounded-full transition-colors ${
                                item.value 
                                  ? 'bg-blue-500' 
                                  : 'bg-gray-600'
                              }`}
                              onClick={() => handleSettingChange(item.id, !item.value)}
                              whileTap={{ scale: 0.95 }}
                            >
                              <motion.div
                                className="w-5 h-5 bg-white rounded-full shadow-sm"
                                animate={{
                                  x: item.value ? 20 : 2
                                }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              />
                            </motion.button>
                          ) : item.type === 'select' ? (
                            <select
                              value={item.value as string}
                              onChange={(e) => handleSettingChange(item.id, e.target.value)}
                              className="bg-gray-600 text-white rounded-lg px-3 py-1 text-sm min-w-[100px]"
                            >
                              {item.options?.map(option => (
                                <option key={option} value={option}>
                                  {option.charAt(0).toUpperCase() + option.slice(1).replace('-', ' ')}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <motion.button
                              onClick={item.action}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Action
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Device Info */}
              <DeviceInfo />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MobilePowerSettings;