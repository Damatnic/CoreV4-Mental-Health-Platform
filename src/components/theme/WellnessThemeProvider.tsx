import React, { createContext, useContext, useEffect, useState } from 'react';
import { wellnessTheme } from '../../styles/wellness-theme';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  getGradient: (type: string) => string;
  getToolGradient: (tool: string) => string;
  applyComponentStyles: (component: string, variant?: string, size?: string) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useWellnessTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useWellnessTheme must be used within a WellnessThemeProvider');
  }
  return context;
};

interface WellnessThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark';
}

export const WellnessThemeProvider: React.FC<WellnessThemeProviderProps> = ({
  children,
  defaultTheme = 'light'
}) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(defaultTheme);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('wellness-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Apply theme class to document root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('wellness-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const getGradient = (type: string) => {
    const gradients = wellnessTheme.gradients as unknown;
    return `bg-gradient-to-r ${gradients[type] || gradients.primary}`;
  };

  const getToolGradient = (tool: string) => {
    const tools = wellnessTheme.gradients.tools as unknown;
    return `bg-gradient-to-r ${tools[tool] || wellnessTheme.gradients.primary}`;
  };

  const applyComponentStyles = (component: string, variant?: string, size?: string) => {
    const comp = (wellnessTheme.components as unknown)[component];
    if (!comp) return '';
    
    let styles = comp.base || '';
    
    if (variant && comp.variants) {
      styles += ` ${  comp.variants[variant]}`;
    }
    
    if (size && comp.sizes) {
      styles += ` ${  comp.sizes[size]}`;
    }
    
    return styles;
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme,
      getGradient,
      getToolGradient,
      applyComponentStyles
    }}>
      {children}
    </ThemeContext.Provider>
  );
};