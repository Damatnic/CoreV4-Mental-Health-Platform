import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Heart, 
  Users, 
  Stethoscope,
  AlertTriangle 
} from 'lucide-react';
import { useVibration } from '../../hooks/useVibration';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  urgent?: boolean;
}

const navItems: NavItem[] = [
  {
    path: '/',
    label: 'Home',
    icon: BarChart3,
    color: 'text-console-accent',
  },
  {
    path: '/crisis',
    label: 'Crisis',
    icon: AlertTriangle,
    color: 'text-red-400',
    urgent: true,
  },
  {
    path: '/wellness',
    label: 'Wellness',
    icon: Heart,
    color: 'text-pink-400',
  },
  {
    path: '/community',
    label: 'Community',
    icon: Users,
    color: 'text-green-400',
  },
  {
    path: '/professional',
    label: 'Professionals',
    icon: Stethoscope,
    color: 'text-purple-400',
  },
];

export function MobileNavigation() {
  const location = useLocation();
  const vibrate = useVibration();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavClick = (urgent?: boolean) => {
    // Different haptic patterns for different nav items
    if (urgent) {
      vibrate([50, 30, 50]); // Double tap for crisis
    } else {
      vibrate(20); // Light tap for regular navigation
    }
  };

  return (
    <>
      {/* Mobile Console Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-gray-900/95 via-gray-800/95 to-gray-900/90 border-t border-gray-700/50 backdrop-blur-console shadow-console-depth md:hidden">
        {/* Console glow accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-console-accent/50 to-transparent" />
        
        <div className={`grid grid-cols-${navItems.length} h-16 relative`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => handleNavClick(item.urgent)}
                className="console-focusable relative flex flex-col items-center justify-center py-2 px-1 group transition-all duration-300"
              >
                {/* Console active indicator */}
                {active && (
                  <motion.div
                    layoutId="activeMobileTab"
                    className="absolute top-0 left-2 right-2 h-1 bg-gradient-to-r from-console-accent to-blue-400 rounded-b-full shadow-console-glow"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
                
                {/* Console button background effect */}
                <motion.div
                  className={`absolute inset-1 rounded-console-lg transition-all duration-300 ${
                    active 
                      ? 'bg-gradient-to-t from-console-accent/20 to-blue-500/10 border border-console-accent/30' 
                      : 'group-hover:bg-gray-700/30'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                />
                
                {/* Icon with console styling */}
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`relative z-10 p-2 rounded-console transition-all duration-300 ${
                    active 
                      ? `${item.color} bg-white/10 shadow-console-glow` 
                      : 'text-gray-400 group-hover:text-white group-hover:bg-gray-700/50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  
                  {/* Enhanced urgent indicator for crisis */}
                  {item.urgent && (
                    <motion.span 
                      className="absolute -top-1 -right-1 flex h-3 w-3"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-console-glow"></span>
                    </motion.span>
                  )}
                </motion.div>
                
                {/* Console label with gaming font */}
                <span className={`
                  text-xs mt-1 font-medium tracking-wide transition-all duration-300 z-10 relative
                  ${active ? `${item.color} font-bold` : 'text-gray-400 group-hover:text-white'}
                  ${item.urgent && !active ? 'font-bold animate-pulse' : ''}
                `}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
        
        {/* Console safe area with gaming accent */}
        <div className="h-safe-area-bottom bg-gradient-to-t from-gray-900 to-gray-800/50 border-t border-gray-700/30" />
      </nav>

      {/* Tablet Console Side Navigation */}
      <nav className="hidden md:flex lg:hidden fixed left-0 top-16 bottom-0 w-24 bg-gradient-to-b from-gray-800/95 to-gray-900/95 border-r border-gray-700/50 backdrop-blur-console flex-col items-center py-6 space-y-3 z-30 shadow-console-depth">
        {/* Console accent line */}
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-console-accent/30 to-transparent" />
        
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={item.path}
                onClick={() => handleNavClick(item.urgent)}
                className={`
                  console-focusable relative w-18 h-18 rounded-console-lg flex flex-col items-center justify-center
                  transition-all duration-300 group overflow-hidden border
                  ${active 
                    ? `bg-gradient-to-br from-${item.color.split('-')[1]}-500/20 to-${item.color.split('-')[1]}-600/10 border-${item.color.split('-')[1]}-400/30 shadow-console-glow` 
                    : 'border-gray-700/50 hover:border-gray-600/50 hover:bg-gray-700/30'
                  }
                `}
              >
                {/* Console tile background effect */}
                <div className={`absolute inset-0 bg-gradient-to-br from-console-accent/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                {/* Icon container */}
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`relative z-10 p-2 rounded-console transition-all duration-300 ${
                    active 
                      ? `${item.color} bg-white/10` 
                      : 'text-gray-400 group-hover:text-white group-hover:bg-gray-700/50'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  
                  {/* Enhanced urgent indicator */}
                  {item.urgent && (
                    <motion.span 
                      className="absolute -top-1 -right-1 flex h-3 w-3"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-console-glow"></span>
                    </motion.span>
                  )}
                </motion.div>
                
                {/* Console label */}
                <span className={`
                  text-xs mt-1 font-medium text-center leading-tight tracking-wide transition-all duration-300 z-10 relative
                  ${active ? `${item.color} font-bold` : 'text-gray-400 group-hover:text-white'}
                `}>
                  {item.label}
                </span>
                
                {/* Console active indicator */}
                {active && (
                  <motion.div
                    layoutId="activeTabTabletConsole"
                    className="absolute left-0 top-3 bottom-3 w-1 bg-gradient-to-b from-console-accent to-blue-400 rounded-r-full shadow-console-glow"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Console Mobile Navigation Styles */}
      <style jsx>{`
        .h-safe-area-bottom {
          height: env(safe-area-inset-bottom, 0);
          min-height: 0.5rem;
        }
        
        .console-focusable {
          transition: all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          transform: translate3d(0, 0, 0);
          will-change: transform, box-shadow;
        }
        
        .console-focusable:focus {
          outline: 2px solid rgb(0, 212, 255);
          outline-offset: 2px;
        }
        
        .backdrop-blur-console {
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        
        @media (max-width: 768px) {
          .console-focusable:active {
            transform: translate3d(0, 0, 0) scale(0.95);
          }
        }
      `}</style>
    </>
  );
}