/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
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
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Lexend', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'fade-out': 'fadeOut 0.5s ease-in-out',
        'slide-in': 'slideIn 0.4s ease-out',
        'slide-out': 'slideOut 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-soft': 'pulseSoft 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'breathe': 'breathe 5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 8s ease-in-out infinite',
      },
      keyframes: {
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
          '50%': { transform: 'scale(1.04)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
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
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02)',
        'soft-lg': '0 4px 16px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.03)',
        'glow': '0 0 15px rgba(123, 167, 217, 0.2)',
        'inner-soft': 'inset 0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        'gentle': '0 1px 4px rgba(0, 0, 0, 0.03)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}