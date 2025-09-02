/**
 * Console Styling Utilities
 * Provides console-themed styling functions for gaming-inspired UI elements
 */

// Console mode type definition
export type ConsoleMode = 'playstation' | 'xbox' | 'switch';

/**
 * Get console navigation style based on current console mode
 */
export const getConsoleNavStyle = (mode: ConsoleMode = 'playstation'): string => {
  switch (mode) {
    case 'playstation':
      return 'bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-900 border-t border-blue-700';
    case 'xbox':
      return 'bg-gradient-to-r from-green-900 via-emerald-900 to-green-900 border-t border-green-700';
    case 'switch':
      return 'bg-gradient-to-r from-red-900 via-blue-900 to-red-900 border-t border-purple-700';
    default:
      return 'bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-900 border-t border-blue-700';
  }
};

/**
 * Get console accent color with optional opacity
 */
export const getConsoleAccentColor = (mode: ConsoleMode = 'playstation', opacity: number = 1): string => {
  const colors = {
    playstation: '59, 130, 246', // Blue-500 RGB
    xbox: '34, 197, 94', // Green-500 RGB
    switch: '239, 68, 68', // Red-500 RGB
  };

  const rgb = colors[mode];
  return opacity === 1 ? `rgb(${rgb})` : `rgba(${rgb}, ${opacity})`;
};

/**
 * Get console accent color as a hex value
 */
export const getConsoleAccentColorHex = (mode: ConsoleMode = 'playstation'): string => {
  switch (mode) {
    case 'playstation':
      return '#3B82F6'; // Blue-500
    case 'xbox':
      return '#22C55E'; // Green-500
    case 'switch':
      return '#EF4444'; // Red-500
    default:
      return '#3B82F6';
  }
};

/**
 * Get console-themed glow effect
 */
export const getConsoleGlowEffect = (mode: ConsoleMode = 'playstation', intensity: number = 0.5): string => {
  const color = getConsoleAccentColor(mode, intensity);
  return `0 0 20px ${color}, 0 0 40px ${color}`;
};

/**
 * Get console-themed shadow effect
 */
export const getConsoleShadowEffect = (mode: ConsoleMode = 'playstation', intensity: number = 0.3): string => {
  const color = getConsoleAccentColor(mode, intensity);
  return `0 4px 20px ${color}`;
};

/**
 * Get console button style based on state
 */
export const getConsoleButtonStyle = (
  mode: ConsoleMode = 'playstation', 
  isActive: boolean = false,
  isHovered: boolean = false
): string => {
  const baseStyle = 'transition-all duration-200 ease-in-out';
  const accentColor = getConsoleAccentColorHex(mode);
  
  if (isActive) {
    return `${baseStyle} bg-gradient-to-b from-gray-700 to-gray-800 text-white border-2 border-${accentColor} shadow-lg`;
  }
  
  if (isHovered) {
    return `${baseStyle} bg-gradient-to-b from-gray-600 to-gray-700 text-white border border-gray-500 shadow-md`;
  }
  
  return `${baseStyle} bg-gradient-to-b from-gray-800 to-gray-900 text-gray-300 border border-gray-600`;
};

/**
 * Get console-specific icon color
 */
export const getConsoleIconColor = (mode: ConsoleMode = 'playstation', isActive: boolean = false): string => {
  if (isActive) {
    return getConsoleAccentColorHex(mode);
  }
  return '#9CA3AF'; // Gray-400
};

/**
 * Get console-themed gradient background
 */
export const getConsoleGradientBackground = (mode: ConsoleMode = 'playstation'): string => {
  switch (mode) {
    case 'playstation':
      return 'bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950';
    case 'xbox':
      return 'bg-gradient-to-br from-green-950 via-emerald-950 to-teal-950';
    case 'switch':
      return 'bg-gradient-to-br from-red-950 via-rose-950 to-pink-950';
    default:
      return 'bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950';
  }
};

/**
 * Get console loading animation style
 */
export const getConsoleLoadingStyle = (mode: ConsoleMode = 'playstation'): string => {
  const accentColor = getConsoleAccentColorHex(mode);
  return `animate-pulse bg-gradient-to-r from-transparent via-${accentColor} to-transparent`;
};