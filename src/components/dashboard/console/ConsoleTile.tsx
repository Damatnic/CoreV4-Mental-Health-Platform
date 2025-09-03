import React, { ReactNode, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ConsoleFocusable } from '../../console/ConsoleFocusable';
import { useMobileFeatures } from '../../../hooks/useMobileFeatures';
import { useConsoleNavigation } from '../../../hooks/useConsoleNavigation';
import { useVibration } from '../../../hooks/useVibration';
import { initializeTouchOptimization } from '../../../utils/mobile/touchOptimization';

interface ConsoleTileProps {
  title: string;
  description: string;
  icon: ReactNode;
  gradient: 'wellness' | 'community' | 'professional' | 'crisis';
  size: 'small' | 'medium' | 'large';
  to: string;
  badges?: string[];
  status?: string;
  urgent?: boolean;
  showProgress?: boolean;
  progressValue?: number;
  delay?: number;
  children?: ReactNode;
  mobileOptimized?: boolean;
  touchFeedback?: boolean;
}

const gradientMap = {
  wellness: 'from-blue-500 to-purple-600',
  community: 'from-green-400 to-emerald-600',
  professional: 'from-yellow-400 to-orange-600',
  crisis: 'from-pink-500 to-red-600',
};

const getMobileSizeMap = (_isMobile: boolean, _isSmallScreen: boolean) => {
  if (_isSmallScreen) {
    return {
      small: 'col-span-1 row-span-1 h-40 min-h-[10rem]',
      medium: 'col-span-1 row-span-1 h-48 min-h-[12rem]',
      large: 'col-span-1 row-span-1 h-56 min-h-[14rem]',
    };
  }
  
  if (_isMobile) {
    return {
      small: 'col-span-1 row-span-1 h-36 min-h-[9rem]',
      medium: 'col-span-1 sm:col-span-2 row-span-1 h-44 min-h-[11rem]',
      large: 'col-span-1 sm:col-span-2 row-span-1 h-52 min-h-[13rem]',
    };
  }
  
  return {
    small: 'col-span-1 row-span-1 h-32',
    medium: 'col-span-1 md:col-span-2 row-span-1 h-40',
    large: 'col-span-1 md:col-span-2 lg:col-span-1 row-span-2 h-80',
  };
};

export function ConsoleTile({
  title,
  description,
  icon,
  gradient,
  size,
  to,
  badges = [],
  status,
  urgent = false,
  showProgress = false,
  progressValue = 0,
  delay = 0,
  children,
}: ConsoleTileProps) {
  const navigate = useNavigate();
  const { isMobileDevice, _isSmallScreen, deviceInfo } = useMobileFeatures();
  const { isPerformanceMode } = useConsoleNavigation();
  const { vibrate } = useVibration();
  const [isPressed, setIsPressed] = useState(false);
  const tileRef = useRef<HTMLDivElement>(null);
  
  const sizeMap = getMobileSizeMap(isMobileDevice, _isSmallScreen);
  const tileVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: _isSmallScreen ? 20 : 40,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: isPerformanceMode ? 30 : 25,
        stiffness: isPerformanceMode ? 400 : 300,
        delay: isPerformanceMode ? delay * 0.05 : delay * 0.1,
      },
    },
    hover: {
      scale: isMobileDevice ? 1.01 : 1.02,
      y: isMobileDevice ? -2 : -4,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 400,
      },
    },
    tap: {
      scale: isMobileDevice ? 0.96 : 0.98,
      transition: {
        duration: isPerformanceMode ? 0.05 : 0.1,
      },
    },
  };

  const glowVariants = {
    idle: { 
      boxShadow: isPerformanceMode 
        ? '0 4px 16px rgba(0, 0, 0, 0.1)' 
        : '0 8px 32px rgba(0, 0, 0, 0.1)'
    },
    hover: {
      boxShadow: urgent
        ? (isPerformanceMode 
          ? '0 0 20px rgba(239, 68, 68, 0.3), 0 8px 20px rgba(0, 0, 0, 0.1)'
          : '0 0 40px rgba(239, 68, 68, 0.4), 0 12px 40px rgba(0, 0, 0, 0.2)')
        : (isPerformanceMode
          ? '0 0 15px rgba(59, 130, 246, 0.2), 0 8px 20px rgba(0, 0, 0, 0.1)'
          : '0 0 30px rgba(59, 130, 246, 0.3), 0 12px 40px rgba(0, 0, 0, 0.15)'),
    },
  };

  // Mobile-optimized progress ring sizing
  const progressRingSize = isMobileDevice ? (isSmallScreen ? 50 : 55) : 60;
  const strokeWidth = isMobileDevice ? 3 : 4;
  const radius = (progressRingSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${(progressValue / 100) * circumference} ${circumference}`;
  
  // Handle mobile touch interactions
  React.useEffect(() => {
    if (tileRef.current && deviceInfo.hasTouch) {
      const touchManager = initializeTouchOptimization(tileRef.current, {
        enableFastClick: true,
        enableVibration: true,
        longPressDelay: urgent ? 300 : 500,
      });

      touchManager.on('tap', () => {
        // Console-style haptic feedback
        vibrate(urgent ? [50, 30] : [25]);
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 100);
      });

      touchManager.on('longPress', () => {
        // Long press for additional options
        vibrate([100, 50, 100]);
        // Could show context menu here
      });

      return () => touchManager.destroy();
    }
  }, [urgent, vibrate, deviceInfo.hasTouch]);

  return (
    <motion.div
      variants={tileVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      className={`${sizeMap[size]} relative overflow-hidden`}
    >
      <ConsoleFocusable
        id={`console-tile-${title.toLowerCase().replace(/\s+/g, '-')}`}
        group="dashboard-tiles"
        priority={urgent ? 100 : 50}
        className="h-full"
        onActivate={() => {
          vibrate(urgent ? [80, 40] : [40]);
          navigate(_to);
        }}
      >
        <motion.div
          ref={tileRef}
          variants={glowVariants}
          initial="idle"
          whileHover={deviceInfo.hasTouch ? undefined : "hover"}
          className={`h-full group ${isPressed ? 'console-tile-pressed' : ''}`}
        >
          <Link
            to={to}
            className={`
              block h-full relative rounded-2xl
              bg-gradient-to-br from-gray-800/90 to-gray-900/90
              border border-gray-700/50 backdrop-blur-md
              transition-all duration-300 ease-out
              hover:border-gray-600/70 focus:outline-none focus:ring-2 focus:ring-blue-400/50
              ${urgent ? 'border-red-400/60' : ''}
              ${isMobileDevice ? 'p-4 touch-manipulation' : 'p-6'}
              ${_isSmallScreen ? 'p-3 rounded-xl' : ''}
              ${deviceInfo.hasTouch ? 'console-tile-touch' : ''}
            `}
            aria-label={`${title} - Touch to open`}
          >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-gradient-to-r from-white/10 to-transparent blur-2xl" />
            <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full bg-gradient-to-r from-blue-400/20 to-transparent blur-xl" />
          </div>

          {/* Header Section - Mobile Optimized */}
          <div className={`relative z-10 flex items-start justify-between ${
            isMobileDevice ? 'mb-3' : 'mb-4'
          }`}>
            <div className={`flex items-center ${
              _isSmallScreen ? 'space-x-2' : 'space-x-3'
            }`}>
              <div className={`
                rounded-xl bg-gradient-to-r ${gradientMap[gradient]} shadow-lg
                ${_isSmallScreen ? 'p-2' : isMobileDevice ? 'p-2.5' : 'p-3'}
              `}>
                {React.cloneElement(icon as React.ReactElement, {
                  className: `text-white ${_isSmallScreen ? 'h-5 w-5' : 'h-6 w-6'}`
                })}
              </div>
              {status && (
                <div className={`
                  bg-green-500/20 border border-green-400/30 rounded-full
                  text-green-300 font-medium
                  ${_isSmallScreen ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'}
                `}>
                  {status}
                </div>
              )}
            </div>

            {/* Progress Ring */}
            {showProgress && (
              <div className="relative">
                <svg width={progressRingSize} height={progressRingSize} className="transform -rotate-90">
                  <circle
                    cx={progressRingSize / 2}
                    cy={progressRingSize / 2}
                    r={radius}
                    stroke="rgb(55, 65, 81)"
                    strokeWidth={strokeWidth}
                    fill="none"
                  />
                  <motion.circle
                    cx={progressRingSize / 2}
                    cy={progressRingSize / 2}
                    r={radius}
                    stroke="rgb(59, 130, 246)"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={strokeDasharray}
                    initial={{ strokeDasharray: '0 1000' }}
                    animate={{ strokeDasharray }}
                    transition={{ duration: 1.5, ease: 'easeInOut', delay: delay * 0.1 + 0.5 }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-300">{progressValue}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Content Section - Mobile Responsive */}
          <div className="relative z-10 flex-1">
            <h3 className={`
              font-bold text-white group-hover:text-blue-200 transition-colors
              ${_isSmallScreen ? 'text-lg mb-1.5' : isMobileDevice ? 'text-lg mb-2' : 'text-xl mb-2'}
            `}>
              {title}
            </h3>
            <p className={`
              text-gray-300 line-clamp-3
              ${_isSmallScreen ? 'text-xs mb-2' : isMobileDevice ? 'text-sm mb-3' : 'text-sm mb-4'}
            `}>
              {description}
            </p>

            {/* Badges - Mobile Optimized */}
            {badges.length > 0 && (
              <div className={`flex flex-wrap gap-1.5 ${
                _isSmallScreen ? 'mb-2' : isMobileDevice ? 'mb-3' : 'mb-4'
              }`}>
                {badges.map((badge, index) => (
                  <span
                    key={index}
                    className={`
                      bg-blue-500/20 border border-blue-400/30 rounded-full
                      text-blue-300 font-medium
                      ${_isSmallScreen ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'}
                    `}
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}

            {/* Custom Children Content */}
            {children}
          </div>

          {/* Hover Glow Effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Bottom Border Accent */}
          <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${gradientMap[gradient]} opacity-60`} />
          </Link>
        </motion.div>
      </ConsoleFocusable>
      
      {/* Mobile Console Tile Styles */}
      <style>{`
        .console-tile-touch {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
        }
        
        .console-tile-pressed {
          transform: scale(0.98);
          transition: transform 0.1s ease-out;
        }
        
        /* Touch feedback for mobile */
        @media (hover: none) and (pointer: coarse) {
          .console-tile-touch:active {
            transform: scale(0.96);
          }
          
          .console-tile-touch {
            transition: transform 0.1s ease-out;
          }
        }
        
        /* Enhanced touch targets for mobile */
        @media (max-width: 640px) {
          .console-tile-touch {
            min-height: 10rem;
          }
        }
        
        /* Performance mode optimizations */
        [data-performance-mode="true"] .console-tile-touch {
          will-change: transform;
          transform: translateZ(0);
        }
      `}</style>
    </motion.div>
  );
}