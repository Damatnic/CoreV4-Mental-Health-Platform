import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Heart, 
  Users, 
  Stethoscope, 
  Settings,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
  color: string;
}

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  
  const navItems: NavItem[] = [
    { path: '/', icon: Home, label: 'Home', color: 'from-blue-400 to-blue-600' },
    { path: '/ai-therapy', icon: Sparkles, label: 'AI', color: 'from-purple-400 to-purple-600' },
    { path: '/crisis', icon: AlertTriangle, label: 'Crisis', color: 'from-red-400 to-red-600' },
    { path: '/wellness', icon: Heart, label: 'Wellness', color: 'from-green-400 to-green-600' },
    { path: '/community', icon: Users, label: 'Community', color: 'from-cyan-400 to-cyan-600' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-gray-900 to-gray-800 border-t border-gray-700/50 backdrop-blur-xl safe-area-bottom"
    >
      <div className="flex justify-around items-center px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const isCrisis = item.path === '/crisis';

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex flex-col items-center justify-center 
                min-w-[64px] min-h-[56px] 
                rounded-lg transition-all duration-300
                ${active 
                  ? 'bg-gradient-to-br from-gray-700/50 to-gray-800/50' 
                  : 'hover:bg-gray-800/30'
                }
                ${isCrisis ? 'relative' : ''}
              `}
            >
              {isCrisis && (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                />
              )}
              
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`
                  p-2 rounded-lg transition-all duration-300
                  ${active 
                    ? `bg-gradient-to-r ${item.color} shadow-lg` 
                    : 'bg-gray-700/50'
                  }
                `}
              >
                <Icon className={`
                  w-5 h-5 
                  ${active ? 'text-white' : 'text-gray-400'}
                `} />
              </motion.div>
              
              <span className={`
                text-[10px] mt-1 font-medium
                ${active ? 'text-white' : 'text-gray-400'}
              `}>
                {item.label}
              </span>
              
              {active && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-t-full"
                />
              )}
            </Link>
          );
        })}
      </div>
      
      {/* Safe area padding for iPhones */}
      <div className="h-[env(safe-area-inset-bottom,0)]" />
    </motion.nav>
  );
};

export default MobileBottomNav;