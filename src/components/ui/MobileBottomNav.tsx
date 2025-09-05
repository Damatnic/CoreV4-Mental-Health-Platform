import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Heart, 
  Users, 
  Stethoscope, 
  Settings,
  Sparkles,
  AlertTriangle,
  Plus,
  X
} from 'lucide-react';
import { useMobileFeatures } from '../../hooks/useMobileFeatures';

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
  color: string;
}

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { canVibrate } = useMobileFeatures();
  const [showMore, setShowMore] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  
  const primaryNavItems: NavItem[] = [
    { path: '/', icon: Home, label: 'Home', color: 'from-blue-400 to-blue-600' },
    { path: '/ai-therapy', icon: Sparkles, label: 'AI', color: 'from-purple-400 to-purple-600' },
    { path: '/crisis', icon: AlertTriangle, label: 'Crisis', color: 'from-red-400 to-red-600' },
    { path: '/wellness', icon: Heart, label: 'Wellness', color: 'from-green-400 to-green-600' }
  ];

  const secondaryNavItems: NavItem[] = [
    { path: '/community', icon: Users, label: 'Community', color: 'from-cyan-400 to-cyan-600' },
    { path: '/professional', icon: Stethoscope, label: 'Professional', color: 'from-indigo-400 to-indigo-600' },
    { path: '/settings', icon: Settings, label: 'Settings', color: 'from-gray-400 to-gray-600' }
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavClick = (path: string) => {
    if (canVibrate) {
      navigator.vibrate(30);
    }
    setShowMore(false);
  };

  const handleMoreClick = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      // Double tap - show all items
      setShowMore(!showMore);
    } else {
      // Single tap - toggle more menu
      setShowMore(!showMore);
    }
    setLastTap(now);
    
    if (canVibrate) {
      navigator.vibrate(showMore ? 50 : [50, 50, 50]);
    }
  };

  // Close more menu when navigating
  useEffect(() => {
    setShowMore(false);
  }, [location.pathname]);

  return (
    <>
      {/* Enhanced Mobile Bottom Navigation */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-gray-900/98 to-gray-800/95 border-t border-gray-700/50 backdrop-blur-xl"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        {/* Primary Navigation Bar */}
        <div className="flex justify-around items-center px-3 py-2">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const isCrisis = item.path === '/crisis';

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`
                  flex flex-col items-center justify-center 
                  min-w-[60px] min-h-[60px] 
                  rounded-2xl transition-all duration-300 relative
                  ${active 
                    ? 'bg-gradient-to-br from-gray-700/60 to-gray-800/60 scale-105' 
                    : 'hover:bg-gray-800/40 active:bg-gray-700/60'
                  }
                `}
              >
                {/* Crisis indicator */}
                {isCrisis && (
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.8, 1, 0.8]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full shadow-lg"
                  />
                )}
                
                {/* Icon container with enhanced styling */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`
                    p-2.5 rounded-xl transition-all duration-300 mb-1
                    ${active 
                      ? `bg-gradient-to-r ${item.color} shadow-lg shadow-black/20` 
                      : 'bg-gray-700/60 hover:bg-gray-600/70'
                    }
                  `}
                >
                  <Icon className={`
                    w-5 h-5 transition-colors duration-200
                    ${active ? 'text-white drop-shadow-sm' : 'text-gray-300 hover:text-white'}
                  `} />
                </motion.div>
                
                {/* Label with better typography */}
                <span className={`
                  text-[10px] font-medium transition-colors duration-200
                  ${active ? 'text-white' : 'text-gray-400'}
                `}>
                  {item.label}
                </span>
                
                {/* Active indicator */}
                {active && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                    initial={false}
                  />
                )}
              </Link>
            );
          })}

          {/* More button */}
          <motion.button
            onClick={handleMoreClick}
            className={`
              flex flex-col items-center justify-center 
              min-w-[60px] min-h-[60px] 
              rounded-2xl transition-all duration-300 relative
              ${showMore 
                ? 'bg-gradient-to-br from-gray-700/60 to-gray-800/60 scale-105' 
                : 'hover:bg-gray-800/40 active:bg-gray-700/60'
              }
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className={`
                p-2.5 rounded-xl transition-all duration-300 mb-1
                ${showMore 
                  ? 'bg-gradient-to-r from-gray-500 to-gray-600 shadow-lg shadow-black/20' 
                  : 'bg-gray-700/60 hover:bg-gray-600/70'
                }
              `}
            >
              <motion.div
                animate={{ rotate: showMore ? 45 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {showMore ? (
                  <X className="w-5 h-5 text-white" />
                ) : (
                  <Plus className="w-5 h-5 text-gray-300" />
                )}
              </motion.div>
            </motion.div>
            
            <span className={`
              text-[10px] font-medium transition-colors duration-200
              ${showMore ? 'text-white' : 'text-gray-400'}
            `}>
              More
            </span>
          </motion.button>
        </div>
      </motion.nav>

      {/* Expandable Secondary Navigation */}
      <AnimatePresence>
        {showMore && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setShowMore(false)}
            />

            {/* Secondary nav panel */}
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 25,
                mass: 0.8
              }}
              className="fixed bottom-20 left-4 right-4 z-50 bg-gray-800/95 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 shadow-2xl"
              style={{
                marginBottom: 'env(safe-area-inset-bottom, 0px)'
              }}
            >
              {/* Handle indicator */}
              <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-4" />
              
              <div className="grid grid-cols-3 gap-4">
                {secondaryNavItems.map((item, index) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);

                  return (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ 
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 400,
                        damping: 25
                      }}
                    >
                      <Link
                        to={item.path}
                        onClick={() => handleNavClick(item.path)}
                        className={`
                          flex flex-col items-center justify-center 
                          p-4 rounded-2xl transition-all duration-300
                          ${active 
                            ? 'bg-gradient-to-br from-gray-600/60 to-gray-700/60 scale-105' 
                            : 'hover:bg-gray-700/50 active:bg-gray-600/60'
                          }
                        `}
                      >
                        <motion.div
                          className={`
                            p-3 rounded-xl transition-all duration-300 mb-2
                            ${active 
                              ? `bg-gradient-to-r ${item.color} shadow-lg shadow-black/20` 
                              : 'bg-gray-700/60 hover:bg-gray-600/70'
                            }
                          `}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Icon className={`
                            w-6 h-6 transition-colors duration-200
                            ${active ? 'text-white drop-shadow-sm' : 'text-gray-300'}
                          `} />
                        </motion.div>
                        
                        <span className={`
                          text-xs font-medium text-center transition-colors duration-200
                          ${active ? 'text-white' : 'text-gray-300'}
                        `}>
                          {item.label}
                        </span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileBottomNav;