import React from 'react';
import { motion } from 'framer-motion';

interface ConsoleLoaderProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  variant?: 'spinner' | 'dots' | 'pulse' | 'progress';
  className?: string;
}

export function ConsoleLoader({ 
  size = 'medium', 
  text = 'Loading...', 
  variant = 'spinner',
  className = '' 
}: ConsoleLoaderProps) {
  const sizeMap = {
    small: { 
      container: 'w-8 h-8 md:w-10 md:h-10', 
      text: 'text-xs md:text-sm',
      spinner: 'w-6 h-6 md:w-8 md:h-8'
    },
    medium: { 
      container: 'w-12 h-12 md:w-16 md:h-16', 
      text: 'text-sm md:text-base',
      spinner: 'w-10 h-10 md:w-12 md:h-12'
    },
    large: { 
      container: 'w-16 h-16 md:w-20 md:h-20', 
      text: 'text-base md:text-lg',
      spinner: 'w-14 h-14 md:w-16 md:h-16'
    },
  };

  const sizes = sizeMap[size];

  if (variant === 'spinner') {
    return (
      <div className={`flex flex-col items-center space-y-3 md:space-y-4 ${className}`}>
        <div className={`${sizes.container} relative console-focusable`}>
          {/* Outer ring - Mobile enhanced */}
          <motion.div
            className="absolute inset-0 border-2 md:border-3 border-gray-700/30 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
          {/* Inner spinning ring - Console themed */}
          <motion.div
            className="absolute inset-1 border-2 md:border-3 border-transparent border-t-console-accent border-r-blue-500 rounded-full shadow-console-glow"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
          {/* Center glow - Enhanced mobile visibility */}
          <motion.div 
            className="absolute inset-2 md:inset-3 bg-gradient-to-r from-console-accent/20 to-blue-500/20 rounded-full blur-sm"
            animate={{ 
              opacity: [0.3, 0.8, 0.3],
              scale: [0.8, 1.1, 0.8]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: 'easeInOut' 
            }}
          />
          {/* Mobile touch indicator */}
          <div className="absolute inset-0 rounded-full border border-console-accent/20 shadow-console-card" />
        </div>
        {text && (
          <motion.p
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
            className={`text-console-accent font-medium text-center max-w-xs leading-tight ${sizes.text}`}
          >
            {text}
          </motion.p>
        )}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={`flex flex-col items-center space-y-3 md:space-y-4 ${className}`}>
        <div className="flex space-x-2 md:space-x-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 md:w-4 md:h-4 bg-gradient-to-r from-console-accent to-blue-500 rounded-full shadow-console-glow"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
        {text && (
          <p className={`text-console-accent font-medium text-center max-w-xs leading-tight ${sizes.text}`}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={`flex flex-col items-center space-y-4 ${className}`}>
        <motion.div
          className={`${sizes.container} bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-500/30`}
          animate={{
            scale: [1, 1.2, 1],
            boxShadow: [
              '0 0 0 0 rgba(59, 130, 246, 0.4)',
              '0 0 0 10px rgba(59, 130, 246, 0)',
              '0 0 0 0 rgba(59, 130, 246, 0)',
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
          </div>
        </motion.div>
        {text && (
          <p className={`text-gray-300 font-medium ${sizes.text}`}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'progress') {
    return (
      <div className={`flex flex-col items-center space-y-4 ${className}`}>
        <div className="w-48 h-2 bg-gray-700/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>
        {text && (
          <p className={`text-gray-300 font-medium ${sizes.text}`}>
            {text}
          </p>
        )}
      </div>
    );
  }

  return null;
}

// Console page loading overlay - Mobile Enhanced
export function ConsolePageLoader({ text = 'Loading page...' }: { text?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gradient-to-br from-gray-900/95 via-gray-900/98 to-black/95 backdrop-blur-console z-50 flex items-center justify-center overflow-hidden"
    >
      {/* Enhanced background effects for mobile */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-r from-console-accent/10 to-blue-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 50, -50, 0],
            y: [0, -30, 30, 0],
            scale: [1, 1.2, 0.8, 1]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/3 w-48 h-48 md:w-80 md:h-80 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -40, 40, 0],
            y: [0, 40, -40, 0],
            scale: [0.8, 1.1, 1, 0.8]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2
          }}
        />
      </div>

      <div className="relative z-10 text-center px-4">
        <ConsoleLoader size="large" text={text} variant="spinner" />
        
        {/* Console-style loading bar - Mobile responsive */}
        <div className="mt-6 md:mt-8 w-48 md:w-64 h-1 md:h-2 bg-gray-700/50 rounded-full overflow-hidden mx-auto shadow-console-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-console-accent via-blue-500 to-purple-500 shadow-console-glow"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
          className="mt-4 md:mt-6"
        >
          <p className="text-xs md:text-sm text-console-accent font-mono tracking-wider mb-2">
            ASTRAL CORE SYSTEM INITIALIZING...
          </p>
          <p className="text-xs text-gray-400 font-mono">
            MENTAL HEALTH CONSOLE v4.0
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Console card loading skeleton - Mobile Enhanced
export function ConsoleCardSkeleton() {
  return (
    <motion.div 
      className="p-4 md:p-6 rounded-console-xl bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/50 backdrop-blur-console shadow-console-card relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Skeleton shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-600/10 to-transparent"
        animate={{
          x: ['-100%', '100%']
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
      
      {/* Header skeleton - Mobile optimized */}
      <div className="flex items-center space-x-3 mb-4">
        <motion.div 
          className="w-10 h-10 md:w-12 md:h-12 bg-gray-700/50 rounded-console-lg animate-pulse"
          animate={{ 
            opacity: [0.5, 0.8, 0.5] 
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity 
          }}
        />
        <div className="flex-1 space-y-2">
          <div className="h-3 md:h-4 bg-gray-700/50 rounded-console w-3/4 animate-pulse" />
          <div className="h-2 md:h-3 bg-gray-700/30 rounded-console w-1/2 animate-pulse" />
        </div>
      </div>

      {/* Content skeleton - Responsive spacing */}
      <div className="space-y-2 md:space-y-3 mb-4">
        <div className="h-2 md:h-3 bg-gray-700/30 rounded-console w-full animate-pulse" />
        <div className="h-2 md:h-3 bg-gray-700/30 rounded-console w-5/6 animate-pulse" />
        <div className="h-2 md:h-3 bg-gray-700/30 rounded-console w-4/6 animate-pulse" />
      </div>

      {/* Bottom skeleton - Mobile touch-friendly */}
      <div className="flex flex-wrap gap-2">
        <div className="h-6 md:h-7 bg-gray-700/30 rounded-full w-14 md:w-16 animate-pulse" />
        <div className="h-6 md:h-7 bg-gray-700/30 rounded-full w-16 md:w-20 animate-pulse" />
        <div className="h-6 md:h-7 bg-gray-700/30 rounded-full w-12 md:w-14 animate-pulse" />
      </div>
      
      {/* Console accent border */}
      <div className="absolute inset-0 rounded-console-xl border border-console-accent/10 pointer-events-none" />
    </motion.div>
  );
}