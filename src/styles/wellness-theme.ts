/**
 * Wellness Suite Theme Configuration
 * Provides consistent theming across the entire mental health platform
 * Matching the beautiful, calming design of WellnessToolsSuite
 */

export const wellnessTheme = {
  // Gradient configurations for tool buttons and highlights
  gradients: {
    primary: 'from-blue-500 to-purple-500',
    secondary: 'from-purple-400 to-violet-500',
    success: 'from-green-400 to-emerald-500',
    warning: 'from-amber-400 to-orange-500',
    danger: 'from-pink-400 to-red-500',
    info: 'from-cyan-400 to-blue-500',
    indigo: 'from-indigo-400 to-purple-500',
    
    // Tool-specific gradients
    tools: {
      dashboard: 'from-purple-400 to-violet-500',
      mood: 'from-pink-400 to-red-500',
      breathing: 'from-cyan-400 to-blue-500',
      meditation: 'from-indigo-400 to-purple-500',
      journal: 'from-green-400 to-emerald-500',
    },
    
    // Background gradients
    backgrounds: {
      light: 'from-blue-50 to-purple-50',
      dark: 'from-gray-800 to-gray-900',
      section: 'from-gray-50 to-white',
      darkSection: 'from-gray-900 to-gray-800',
    }
  },

  // Color palette
  colors: {
    // Primary colors
    primary: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
    },
    
    // Secondary colors
    secondary: {
      50: '#FAF5FF',
      100: '#F3E8FF',
      200: '#E9D5FF',
      300: '#D8B4FE',
      400: '#C084FC',
      500: '#A855F7',
      600: '#9333EA',
      700: '#7E22CE',
      800: '#6B21A8',
      900: '#581C87',
    },

    // Semantic colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    // Mood colors
    mood: {
      excellent: '#10B981',
      good: '#3B82F6',
      neutral: '#F59E0B',
      low: '#F97316',
      crisis: '#EF4444',
    }
  },

  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      display: ['Lexend', 'sans-serif'],
      mono: ['Fira Code', 'monospace'],
    },
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    }
  },

  // Spacing and layout
  spacing: {
    containerPadding: '1.5rem',
    sectionSpacing: '2rem',
    cardPadding: '1.5rem',
    buttonPadding: '0.625rem 1.25rem',
    inputPadding: '0.5rem 0.75rem',
  },

  // Border radius
  borderRadius: {
    sm: '0.25rem',
    default: '0.5rem',
    md: '0.5rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    default: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    none: 'none',
  },

  // Transitions
  transitions: {
    fast: '150ms',
    default: '200ms',
    slow: '300ms',
    slowest: '500ms',
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    }
  },

  // Component styles
  components: {
    button: {
      base: 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
      sizes: {
        sm: 'px-3 py-1.5 text-sm rounded-md',
        md: 'px-4 py-2 text-sm rounded-lg',
        lg: 'px-6 py-3 text-base rounded-lg',
      },
      variants: {
        primary: 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg transform hover:scale-[1.02]',
        secondary: 'bg-gradient-to-r from-purple-400 to-violet-500 text-white hover:shadow-lg transform hover:scale-[1.02]',
        success: 'bg-gradient-to-r from-green-400 to-emerald-500 text-white hover:shadow-lg transform hover:scale-[1.02]',
        danger: 'bg-gradient-to-r from-pink-400 to-red-500 text-white hover:shadow-lg transform hover:scale-[1.02]',
        outline: 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
        ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
      }
    },
    
    card: {
      base: 'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm',
      hover: 'hover:shadow-lg transition-all duration-200 transform hover:translateY(-2px)',
      padding: 'p-6',
    },

    input: {
      base: 'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-30 transition-all duration-200',
      sizes: {
        sm: 'px-2 py-1 text-sm',
        md: 'px-3 py-2 text-sm',
        lg: 'px-4 py-3 text-base',
      }
    },

    sidebar: {
      base: 'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700',
      item: 'w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200',
      itemHover: 'hover:bg-gray-100 dark:hover:bg-gray-700',
      itemActive: 'bg-gradient-to-r text-white shadow-lg',
      itemInactive: 'text-gray-700 dark:text-gray-300',
    }
  },

  // Animations
  animations: {
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    slideIn: {
      from: { transform: 'translateY(_20px)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
    scaleIn: {
      from: { transform: 'scale(0.95)', opacity: 0 },
      to: { transform: 'scale(1)', opacity: 1 },
    },
    pulse: {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.5 },
    },
    breathe: {
      '0%, 100%': { transform: 'scale(1)', opacity: 0.8 },
      '50%': { transform: 'scale(1.05)', opacity: 1 },
    }
  }
};

// Helper function to get gradient class
export const __getGradientClass = (type: keyof typeof wellnessTheme.gradients) => {
  return `bg-gradient-to-r ${wellnessTheme.gradients[type]}`;
};

// Helper function to get tool gradient
export const __getToolGradient = (tool: keyof typeof wellnessTheme.gradients.tools) => {
  return `bg-gradient-to-r ${wellnessTheme.gradients.tools[tool]}`;
};

// Helper function to apply component styles
export const __getComponentStyles = (
  component: keyof typeof wellnessTheme.components,
  variant?: string,
  size?: string
) => {
  const comp = wellnessTheme.components[component];
  let styles = comp.base || '';
  
  if (variant && 'variants' in comp) {
    styles += ` ${  (comp.variants as unknown)[variant]}`;
  }
  
  if (size && 'sizes' in comp) {
    styles += ` ${  (comp.sizes as unknown)[size]}`;
  }
  
  return styles;
};

export default wellnessTheme;