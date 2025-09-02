/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Therapeutic primary colors - soft blues for trust and calm
        primary: {
          50: '#EBF3FA',
          100: '#D6E7F5',
          200: '#B3CCDF',
          300: '#9BB9D4',
          400: '#84A6C9',
          500: '#7BA7D9',
          600: '#6A93C2',
          700: '#5A7FA8',
          800: '#4A6B8E',
          900: '#3A5774',
          950: '#2A435A',
        },
        // Soothing secondary colors - sage greens for balance and growth
        secondary: {
          50: '#E8F4F1',
          100: '#D1E9E3',
          200: '#B3D9CF',
          300: '#95C9BB',
          400: '#79A89D',
          500: '#668F85',
          600: '#567B71',
          700: '#46675D',
          800: '#365349',
          900: '#263F35',
          950: '#162B21',
        },
        // Wellness colors - muted and calming
        wellness: {
          meditation: '#9B8EC1',  // Soft purple
          mindfulness: '#87CEEB',  // Sky blue
          gratitude: '#F4C97D',    // Warm gold
          reflection: '#8FA5D1',   // Gentle blue
          growth: '#90C5A9',       // Soft mint green
        },
        // Mood tracking colors - softer, less jarring
        mood: {
          excellent: '#90C5A9',  // Soft mint
          good: '#A8D5BA',       // Light sage
          neutral: '#F6E6A8',    // Warm yellow
          low: '#F4C097',        // Peach
          crisis: '#DFA4A0',     // Muted coral
        },
        // Alert and status colors - visible but not alarming
        alert: {
          info: '#8FA5D1',       // Soft blue
          success: '#90C5A9',    // Soft green
          warning: '#F4C97D',    // Warm amber
          error: '#DFA4A0',      // Muted coral
          crisis: '#D4908B',     // Deeper coral
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