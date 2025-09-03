import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, Stethoscope, AlertTriangle, _Clock, _Shield } from 'lucide-react';
import { ConsoleWelcomeBar } from './ConsoleWelcomeBar';
import { ConsoleGrid } from './ConsoleGrid';
import { ConsoleTile } from './ConsoleTile';
import { ConsoleUserStats } from './ConsoleUserStats';
import { ConsoleQuickLinks } from './ConsoleQuickLinks';
import { useConsoleNavigation } from '../../../hooks/useConsoleNavigation';
import { useMobileFeatures } from '../../../hooks/useMobileFeatures';

export function ConsoleDashboard() {
  const { navigationMode, isPerformanceMode } = useConsoleNavigation();
  const { _deviceInfo, isMobileDevice, isSmallScreen } = useMobileFeatures();

  // Apply navigation mode class to body for styling
  useEffect(() => {
    document.body.className = `console-navigation-${navigationMode}`;
    return () => {
      document.body.className = '';
    };
  }, [navigationMode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden console-dashboard">
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Floating orbs */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -150, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 80, 0],
            y: [0, -80, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute top-3/4 left-1/2 w-64 h-64 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"
        />
      </div>

      {/* Main Content - Mobile Optimized */}
      <div className={`
        relative z-10 mx-auto py-4
        ${isMobileDevice 
          ? 'px-3 sm:px-4 max-w-full' 
          : 'px-4 sm:px-6 lg:px-8 max-w-7xl'
        }
        ${isSmallScreen ? 'py-2' : 'py-8'}
      `}>
        {/* Console Welcome Bar */}
        <ConsoleWelcomeBar />

        {/* User Stats & Progress - Mobile Responsive */}
        <div className={isMobileDevice ? 'mb-4' : 'mb-8'}>
          <ConsoleUserStats />
        </div>

        {/* Quick Links Section - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: isSmallScreen ? 10 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: isPerformanceMode ? 0.2 : 0.8 }}
          className={`
            ${isMobileDevice ? 'mb-4 p-4' : 'mb-8 p-6'} 
            rounded-2xl bg-gradient-to-br from-gray-800/90 to-gray-900/90 
            border border-gray-700/50 backdrop-blur-md shadow-console-depth
            ${isSmallScreen ? 'rounded-xl' : ''}
          `}
        >
          <div className={isMobileDevice ? 'mb-4' : 'mb-6'}>
            <h2 className={`font-bold text-white mb-2 ${
              isSmallScreen ? 'text-xl' : 'text-2xl'
            }`}>Quick Access</h2>
            <p className={`text-gray-300 ${
              isSmallScreen ? 'text-sm' : 'text-base'
            }`}>Your most-used features at your fingertips</p>
          </div>
          <ConsoleQuickLinks />
        </motion.div>

        {/* Main Feature Tiles - Mobile Touch Optimized */}
        <ConsoleGrid className={`
          ${isMobileDevice ? 'mb-4' : 'mb-8'}
          ${isSmallScreen ? 'grid-mobile-optimized' : ''}
        `}>
          {/* Crisis Support - Always Prominent */}
          <ConsoleTile
            title="🆘 Crisis Support"
            description="Immediate help available 24/7"
            icon={<AlertTriangle className="h-6 w-6 text-white" />}
            gradient="crisis"
            size="medium"
            to="/crisis"
            status="24/7 Available"
            delay={5}
          />

          {/* Wellness Hub */}
          <ConsoleTile
            title="🧘 Wellness Hub"
            description="Your complete mental wellness toolkit"
            icon={<Heart className="h-6 w-6 text-white" />}
            gradient="wellness"
            size="medium"
            to="/wellness"
            showProgress
            progressValue={75}
            delay={6}
          />

          {/* Community */}
          <ConsoleTile
            title="💬 Community"
            description="Connect with supportive peers"
            icon={<Users className="h-6 w-6 text-white" />}
            gradient="community"
            size="small"
            to="/community"
            status="247 Online"
            delay={7}
          />

          {/* Professionals */}
          <ConsoleTile
            title="👨⚕️ Professionals"
            description="Licensed therapists & counselors"
            icon={<Stethoscope className="h-6 w-6 text-white" />}
            gradient="professional"
            size="small"
            to="/professional"
            status="500+ Available"
            delay={8}
          />
        </ConsoleGrid>

        {/* Today&apos;s Wellness Section - Mobile Responsive */}
        <motion.div
          initial={{ opacity: 0, y: isSmallScreen ? 20 : 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: isPerformanceMode ? 0.4 : 0.8, 
            duration: isPerformanceMode ? 0.3 : 0.6 
          }}
          className={`
            ${isMobileDevice ? 'p-4' : 'p-8'} 
            ${isSmallScreen ? 'rounded-xl' : 'rounded-2xl'}
            bg-gradient-to-r from-gray-800/90 to-gray-900/90 
            border border-gray-700/50 backdrop-blur-md relative overflow-hidden
          `}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-4 left-4 w-32 h-32 rounded-full bg-gradient-to-r from-blue-400/30 to-transparent blur-2xl" />
            <div className="absolute bottom-4 right-4 w-24 h-24 rounded-full bg-gradient-to-r from-purple-400/30 to-transparent blur-xl" />
          </div>

          <div className="relative z-10">
            <h2 className={`
              font-bold text-white flex items-center
              ${isSmallScreen ? 'text-xl mb-4' : 'text-2xl mb-6'}
            `}>
              <span className={isSmallScreen ? 'mr-2' : 'mr-3'}>✨</span>
              Today&apos;s Wellness Insights
            </h2>
            
            <div className={`
              grid gap-4
              ${isSmallScreen 
                ? 'grid-cols-1' 
                : 'grid-cols-1 sm:grid-cols-3'
              }
              ${isMobileDevice ? 'gap-4' : 'gap-6'}
            `}>
              {/* Morning Motivation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.5 }}
                className={`
                  text-center rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20
                  ${isSmallScreen ? 'p-4' : 'p-6'}
                `}
              >
                <div className="text-4xl mb-3">
                  🌅
                </div>
                <div className="text-lg font-semibold text-white mb-2">Start Your Day</div>
                <div className="text-gray-300 text-sm">
                  Take 5 minutes for morning meditation and set positive intentions
                </div>
              </motion.div>

              {/* Self-Care Reminder */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.5 }}
                className={`
                  text-center rounded-xl bg-gradient-to-br from-pink-500/10 to-red-600/10 border border-pink-500/20
                  ${isSmallScreen ? 'p-4' : 'p-6'}
                `}
              >
                <div className="text-4xl mb-3">
                  💝
                </div>
                <div className="text-lg font-semibold text-white mb-2">Self-Care Reminder</div>
                <div className="text-gray-300 text-sm">
                  You deserve kindness, especially from yourself
                </div>
              </motion.div>

              {/* Support Network */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className={`
                  text-center rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20
                  ${isSmallScreen ? 'p-4' : 'p-6'}
                `}
              >
                <div className="text-4xl mb-3">
                  🌟
                </div>
                <div className="text-lg font-semibold text-white mb-2">You&apos;re Not Alone</div>
                <div className="text-gray-300 text-sm">
                  Thousands of people are here to support you on your journey
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}