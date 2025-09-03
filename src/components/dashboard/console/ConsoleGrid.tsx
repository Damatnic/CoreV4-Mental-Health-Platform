import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useMobileFeatures } from '../../../hooks/useMobileFeatures';
import { useConsoleNavigation } from '../../../hooks/useConsoleNavigation';

interface ConsoleGridProps {
  children: ReactNode;
  className?: string;
  mobileColumns?: 1 | 2;
  touchOptimized?: boolean;
}

export function ConsoleGrid({ children, className = '' }: ConsoleGridProps) {
  const { isMobileDevice, isSmallScreen, deviceInfo } = useMobileFeatures();
  const { isPerformanceMode } = useConsoleNavigation();
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: isPerformanceMode ? 0.05 : 0.1,
        delayChildren: isPerformanceMode ? 0.1 : 0.2,
      },
    },
  };
  
  // Mobile-optimized grid classes
  const getGridClasses = () => {
    if (_isSmallScreen) {
      return 'grid grid-cols-1 gap-4 auto-rows-min';
    }
    if (_isMobileDevice) {
      return 'grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-min';
    }
    return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-min';
  };

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`
          ${getGridClasses()}
          ${className}
          ${isSmallScreen ? 'console-grid-mobile' : ''}
          ${deviceInfo.hasTouch ? 'console-grid-touch' : ''}
        `}
        data-performance-mode={isPerformanceMode}
        data-mobile-device={isMobileDevice}
      >
        {children}
      </motion.div>
      
      {/* Mobile-specific grid optimizations */}
      <style>{`
        .console-grid-mobile {
          /* Optimize for mobile scrolling */
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }
        
        .console-grid-touch {
          /* Larger touch targets on mobile */
          --min-touch-target: 56px;
        }
        
        .console-grid-touch > * {
          min-height: var(--min-touch-target, 56px);
        }
        
        /* Performance mode optimizations */
        [data-performance-mode="true"] {
          will-change: transform;
          transform: translateZ(0);
        }
        
        [data-performance-mode="true"] * {
          animation-duration: 0.2s !important;
          transition-duration: 0.2s !important;
        }
        
        /* Mobile-specific tile sizing */
        @media (max-width: 640px) {
          .grid-mobile-optimized {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .grid-mobile-optimized > .col-span-2,
          .grid-mobile-optimized > .md\\:col-span-2 {
            grid-column: span 1;
          }
          
          .grid-mobile-optimized > .row-span-2 {
            grid-row: span 1;
          }
        }
        
        /* Tablet optimizations */
        @media (min-width: 641px) and (max-width: 1024px) {
          .grid-mobile-optimized {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.25rem;
          }
        }
        
        /* Touch-friendly hover states */
        @media (hover: none) and (pointer: coarse) {
          .console-grid-touch > * {
            transition: transform 0.1s ease-out;
          }
          
          .console-grid-touch > *:active {
            transform: scale(0.98);
          }
        }
      `}</style>
    </>
  );
}