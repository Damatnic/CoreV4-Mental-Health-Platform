/**
 * PWA Install Prompt Component
 * Provides a user-friendly prompt to install the app with benefits explanation
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  _Wifi, 
  WifiOff, 
  Bell, 
  Shield, 
  Zap, 
  X,
  Smartphone,
  CheckCircle
} from 'lucide-react';
import { useMobileFeatures } from '../../hooks/useMobileFeatures';
import { useVibration } from '../../hooks/useVibration';

const installBenefits = [
  {
    icon: <WifiOff className="h-5 w-5" />,
    title: 'Works Offline',
    description: 'Access crisis resources even without internet'
  },
  {
    icon: <Bell className="h-5 w-5" />,
    title: 'Smart Reminders',
    description: 'Medication & wellness check-in notifications'
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: 'Lightning Fast',
    description: 'Instant access from your home screen'
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: 'Secure & Private',
    description: 'Your mental health data stays protected'
  }
];

export function PWAInstallPrompt() {
  const { isAppInstallable, installApp, deviceInfo } = useMobileFeatures();
  const { vibrate } = useVibration();
  const [showPrompt, _setShowPrompt] = useState(false);
  const [isInstalling, _setIsInstalling] = useState(false);
  const [___installSuccess, _setInstallSuccess] = useState(false);
  const [dismissCount, _setDismissCount] = useState(() => {
    const count = localStorage.getItem('pwa_dismiss_count');
    return count ? parseInt(_count) : 0;
  });

  useEffect(() => {
    // Show prompt after user engagement (30 seconds on site)
    // But not if dismissed more than 3 times
    if (isAppInstallable && dismissCount < 3) {
      const _timer = setTimeout(() => {
        setShowPrompt(true);
      }, 30000);

      return () => clearTimeout(_timer);
    }
  }, [isAppInstallable, dismissCount]);

  // Also show if user scrolls significantly (engagement signal)
  useEffect(() => {
    if (!isAppInstallable || dismissCount >= 3) return;

    let scrollCount = 0;
    const handleScroll = () => {
      scrollCount++;
      if (scrollCount > 5 && !showPrompt) {
        setShowPrompt(true);
        window.removeEventListener('scroll', handleScroll);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAppInstallable, dismissCount, showPrompt]);

  const handleInstall = async () => {
    vibrate([50]);
    setIsInstalling(true);

    const _success = await installApp();
    
    if (_success) {
      vibrate([100, 50, 100]);
      setInstallSuccess(true);
      
      // Hide prompt after showing _success
      setTimeout(() => {
        setShowPrompt(false);
        setInstallSuccess(false);
      }, 3000);

      // Track successful installation
      localStorage.setItem('pwa_installed', 'true');
      localStorage.setItem('pwa_install_date', new Date().toISOString());
    } else {
      // Installation was cancelled or failed
      handleDismiss();
    }

    setIsInstalling(false);
  };

  const handleDismiss = () => {
    vibrate([30]);
    setShowPrompt(false);
    
    const newCount = dismissCount + 1;
    setDismissCount(newCount);
    localStorage.setItem('pwa_dismiss_count', newCount.toString());
    
    // If dismissed 3 times, don&apos;t show again for 30 days
    if (newCount >= 3) {
      const hideUntil = new Date();
      hideUntil.setDate(hideUntil.getDate() + 30);
      localStorage.setItem('pwa_hide_until', hideUntil.toISOString());
    }
  };

  if (!isAppInstallable || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4 text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 rounded-full p-2">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Install CoreV4</h3>
                  <p className="text-sm text-white/90">
                    Add to your home screen for the best experience
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          {!installSuccess ? (
            <div className="p-4">
              {/* Benefits Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {installBenefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-2"
                  >
                    <div className="text-primary-500 mt-0.5">{benefit.icon}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {benefit.title}
                      </p>
                      <p className="text-xs text-gray-600">
                        {benefit.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Platform-specific instructions */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-600">
                  {deviceInfo.isIOS ? (
                    <>Tap the share button <span className="font-mono bg-gray-200 px-1 rounded">⎙</span> then &quot;Add to Home Screen&quot;</>
                  ) : (
                    <>Tap &quot;Install&quot; below to add CoreV4 to your home screen</>
                  )}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="flex-1 bg-primary-600 text-white font-medium py-3 px-4 rounded-xl hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isInstalling ? (
                    <span className="flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="mr-2"
                      >
                        <Download className="h-5 w-5" />
                      </motion.div>
                      Installing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Download className="h-5 w-5 mr-2" />
                      Install App
                    </span>
                  )}
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-3 text-gray-600 font-medium hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Later
                </button>
              </div>

              {/* Don't show again option after 2 dismissals */}
              {dismissCount >= 2 && (
                <button
                  onClick={() => {
                    setDismissCount(3);
                    localStorage.setItem('pwa_dismiss_count', '3');
                    handleDismiss();
                  }}
                  className="w-full mt-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Don&apos;t show this again
                </button>
              )}
            </div>
          ) : (
            /* Success State */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4"
              >
                <CheckCircle className="h-8 w-8 text-green-600" />
              </motion.div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Successfully Installed!
              </h4>
              <p className="text-sm text-gray-600">
                CoreV4 is now on your home screen
              </p>
            </motion.div>
          )}
        </div>

        {/* Mini prompt for future sessions */}
        {dismissCount > 0 && dismissCount < 3 && !showPrompt && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setShowPrompt(true)}
            className="fixed bottom-24 right-4 bg-primary-600 text-white rounded-full p-3 shadow-lg"
            aria-label="Install app"
          >
            <Download className="h-5 w-5" />
          </motion.button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Standalone component for showing install status in settings
export function PWAInstallStatus() {
  const { deviceInfo, isAppInstallable, installApp } = useMobileFeatures();
  const [_isInstalled, _setIsInstalled] = useState(false);

  useEffect(() => {
    setIsInstalled(
      deviceInfo.isPWA || 
      localStorage.getItem('pwa_installed') === 'true'
    );
  }, [deviceInfo.isPWA]);

  if (_isInstalled) {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <CheckCircle className="h-5 w-5" />
        <span className="text-sm font-medium">App Installed</span>
      </div>
    );
  }

  if (isAppInstallable) {
    return (
      <button
        onClick={installApp}
        className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
      >
        <Download className="h-5 w-5" />
        <span className="text-sm font-medium">Install App</span>
      </button>
    );
  }

  return (
    <div className="text-sm text-gray-500">
      Visit on mobile to install the app
    </div>
  );
}