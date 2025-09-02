/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // Include any dynamic content
    "./src/**/*.stories.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  // Optimize for production builds
  future: {
    hoverOnlyWhenSupported: true,
  },
  experimental: {
    optimizeUniversalDefaults: true,
  },
  theme: {
    extend: {
      colors: {
        // Primary colors - matching WellnessToolsSuite gradients
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6', // Main blue
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
        // Secondary colors - purple for harmony
        secondary: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7', // Main purple
          600: '#9333EA',
          700: '#7E22CE',
          800: '#6B21A8',
          900: '#581C87',
          950: '#3B0764',
        },
        // Wellness gradient colors - matching tool buttons
        wellness: {
          purple: {
            from: '#C084FC', // from-purple-400
            to: '#8B5CF6',   // to-violet-500
          },
          pink: {
            from: '#F472B6', // from-pink-400
            to: '#EF4444',   // to-red-500
          },
          cyan: {
            from: '#22D3EE', // from-cyan-400
            to: '#3B82F6',   // to-blue-500
          },
          indigo: {
            from: '#818CF8', // from-indigo-400
            to: '#A855F7',   // to-purple-500
          },
          green: {
            from: '#4ADE80', // from-green-400
            to: '#10B981',   // to-emerald-500
          },
        },
        // Mood tracking colors - gentle and calming
        mood: {
          excellent: '#10B981',  // Emerald
          good: '#3B82F6',       // Blue
          neutral: '#F59E0B',    // Amber
          low: '#F97316',        // Orange
          crisis: '#EF4444',     // Red
        },
        // Alert and status colors - clear but calm
        alert: {
          info: '#3B82F6',       // Blue
          success: '#10B981',    // Emerald
          warning: '#F59E0B',    // Amber
          error: '#EF4444',      // Red
          crisis: '#DC2626',     // Red-600
        },
        // Neutral palette - warmer and softer
        neutral: {
          50: '#FAF9F6',   // Warm off-white
          100: '#F5F4F1',  // Light cream
          200: '#EBEBEB',  // Light gray
          300: '#D6D6D6',  // Soft gray
          400: '#A8A8A8',  // Medium gray
          500: '#787878',  // Gray
          600: '#5A5A5A',  // Dark gray
          700: '#404040',  // Charcoal
          800: '#2B2B2B',  // Deep charcoal
          900: '#1A1A1A',  // Near black
          950: '#0D0D0D',  // Black
        },
        // Additional calming colors
        calm: {
          lavender: '#D4C5E8',
          peach: '#FFE5D9',
          mint: '#C8E6C9',
          sky: '#E5F0FA',
          sand: '#F6E6D3',
        },
        // Console-specific colors (PS5/Xbox inspired) with performance optimizations
        console: {
          primary: '#1B1B1B',     // Deep black background
          secondary: '#2D2D2D',   // Card backgrounds
          accent: '#00D4FF',      // PlayStation blue
          xbox: '#107C10',        // Xbox green
          highlight: '#FFFFFF',   // White highlights
          glow: 'rgba(0, 212, 255, 0.3)', // Glow effects
          dark: '#0F0F0F',        // Darker background
          surface: '#1A1A1A',     // Surface color
          muted: '#404040',       // Muted text
          border: 'rgba(255, 255, 255, 0.1)', // Subtle borders
        },
        // Performance mode colors (reduced saturation)
        perf: {
          primary: '#2A2A2A',
          secondary: '#3A3A3A',
          accent: '#0099CC',
          text: '#CCCCCC',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Lexend', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      animation: {
        // Standard animations - optimized for performance
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-out': 'fadeOut 0.2s ease-out',
        'slide-in': 'slideIn 0.25s ease-out',
        'slide-out': 'slideOut 0.25s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        
        // Console-specific animations
        'console-glow': 'consoleGlow 2s ease-in-out infinite',
        'console-pulse': 'consolePulse 1s ease-in-out',
        'console-focus': 'consoleFocus 0.15s ease-out',
        'console-activate': 'consoleActivate 0.1s ease-out',
        
        // Performance mode animations (reduced)
        'fade-in-fast': 'fadeIn 0.15s ease-out',
        'scale-in-fast': 'scaleIn 0.1s ease-out',
        
        // Gaming-grade 60fps animations
        'smooth-bounce': 'smoothBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth-slide': 'smoothSlide 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      keyframes: {
        // Optimized base animations
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideOut: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-10px)', opacity: '0' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.02)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        
        // Console-specific keyframes
        consoleGlow: {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
            transform: 'scale(1)'
          },
          '50%': { 
            boxShadow: '0 0 30px rgba(0, 212, 255, 0.5)',
            transform: 'scale(1.01)'
          },
        },
        consolePulse: {
          '0%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.02)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        consoleFocus: {
          '0%': { 
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(0, 212, 255, 0)'
          },
          '100%': { 
            transform: 'scale(1.02)',
            boxShadow: '0 0 0 2px rgba(0, 212, 255, 0.4)'
          },
        },
        consoleActivate: {
          '0%': { transform: 'scale(1.02)' },
          '50%': { transform: 'scale(0.98)' },
          '100%': { transform: 'scale(1)' },
        },
        
        // Gaming-grade smooth animations
        smoothBounce: {
          '0%': { 
            transform: 'translateY(-20px) scale(0.95)',
            opacity: '0'
          },
          '60%': { 
            transform: 'translateY(0) scale(1.02)',
            opacity: '1'
          },
          '100%': { 
            transform: 'translateY(0) scale(1)',
            opacity: '1'
          },
        },
        smoothSlide: {
          '0%': { 
            transform: 'translateX(-30px)',
            opacity: '0'
          },
          '100%': { 
            transform: 'translateX(0)',
            opacity: '1'
          },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        // Optimized base shadows
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02)',
        'soft-lg': '0 4px 16px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.03)',
        'glow': '0 0 15px rgba(123, 167, 217, 0.2)',
        'inner-soft': 'inset 0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        'gentle': '0 1px 4px rgba(0, 0, 0, 0.03)',
        
        // Console-specific shadows - optimized for GPU acceleration
        'console-glow': '0 0 20px rgba(0, 212, 255, 0.3)',
        'console-glow-strong': '0 0 30px rgba(0, 212, 255, 0.5)',
        'console-depth': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'console-inner': 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'console-hover': '0 12px 40px rgba(0, 212, 255, 0.2)',
        'console-card': '0 4px 20px rgba(0, 0, 0, 0.15)',
        'console-focused': '0 0 0 2px rgba(0, 212, 255, 0.4), 0 4px 20px rgba(0, 212, 255, 0.1)',
        
        // Performance mode shadows (simplified)
        'perf-card': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'perf-hover': '0 4px 12px rgba(0, 0, 0, 0.15)',
        
        // Gaming-grade depth shadows
        'game-card': '0 4px 8px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)',
        'game-hover': '0 8px 16px rgba(0, 0, 0, 0.16), 0 4px 8px rgba(0, 0, 0, 0.12)',
        'game-active': '0 2px 4px rgba(0, 0, 0, 0.16), 0 1px 2px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
        // Console-specific radii
        'console': '12px',
        'console-lg': '20px',
        'console-xl': '24px',
        // Gaming-specific rounded corners
        'game': '8px',
        'game-lg': '16px',
      },
      backdropBlur: {
        'console': '12px',
        'console-heavy': '20px',
        'perf': '6px', // Reduced blur for performance mode
      },
      
      // Enhanced transitions for 60fps performance
      transitionDuration: {
        '50': '50ms',
        '75': '75ms',
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },
      
      transitionTimingFunction: {
        'console': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-soft': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'console-out': 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
      },
      
      // Gaming performance optimizations
      willChange: {
        'transform': 'transform',
        'opacity': 'opacity',
        'transform-opacity': 'transform, opacity',
        'scroll': 'scroll-position',
      },
      
      // GPU acceleration helpers
      transform: {
        'gpu': 'translate3d(0, 0, 0)', // Force GPU layer
        'console-focus': 'translate3d(0, 0, 0) scale(1.02)',
        'console-press': 'translate3d(0, 0, 0) scale(0.98)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    
    // Custom plugin for console-specific utilities
    function({ addUtilities, addBase, theme }) {
      // Console-specific utilities
      addUtilities({
        '.console-focusable': {
          'transition': 'all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          'transform': 'translate3d(0, 0, 0)',
          'will-change': 'transform, box-shadow',
        },
        '.console-focused': {
          'transform': 'translate3d(0, 0, 0) scale(1.02)',
          'box-shadow': '0 0 0 2px rgba(0, 212, 255, 0.4), 0 4px 20px rgba(0, 212, 255, 0.1)',
          'z-index': '10',
        },
        '.console-activated': {
          'transform': 'translate3d(0, 0, 0) scale(0.98)',
          'transition': 'transform 0.1s ease-out',
        },
        '.performance-mode *': {
          'animation-duration': '0.1s !important',
          'transition-duration': '0.1s !important',
        },
        '.performance-emergency *': {
          'animation': 'none !important',
          'transition': 'none !important',
        },
        '.gpu-accelerated': {
          'transform': 'translate3d(0, 0, 0)',
          'backface-visibility': 'hidden',
          'perspective': '1000px',
        },
        '.smooth-scroll': {
          'scroll-behavior': 'smooth',
          '-webkit-overflow-scrolling': 'touch',
        },
        // Gaming-grade optimizations
        '.game-element': {
          'contain': 'layout style paint',
          'will-change': 'transform',
        },
        '.reduce-motion': {
          '*': {
            'animation-duration': '0.01ms !important',
            'animation-iteration-count': '1 !important',
            'transition-duration': '0.01ms !important',
            'scroll-behavior': 'auto !important',
          },
        },
      });
      
      // Performance base styles
      addBase({
        '*': {
          'box-sizing': 'border-box',
        },
        'html': {
          'scroll-behavior': 'smooth',
        },
        'body': {
          'font-feature-settings': '"kern"',
          'text-rendering': 'optimizeLegibility',
          '-webkit-font-smoothing': 'antialiased',
          '-moz-osx-font-smoothing': 'grayscale',
        },
        // Gaming performance optimizations
        '.game-viewport': {
          'contain': 'layout style paint',
          'transform': 'translate3d(0, 0, 0)',
        },
        // Console navigation styles
        '.console-navigation-gamepad .console-focusable': {
          'border': '2px solid transparent',
        },
        '.console-navigation-gamepad .console-focused': {
          'border-color': theme('colors.console.accent'),
          'background-color': 'rgba(0, 212, 255, 0.1)',
        },
        '.console-navigation-keyboard .console-focused': {
          'outline': `2px solid ${theme('colors.console.accent')}`,
          'outline-offset': '2px',
        },
      });
    },
  ],
  
  // Optimize for production
  corePlugins: {
    // Disable unused features for smaller CSS
    container: false,
  },
}