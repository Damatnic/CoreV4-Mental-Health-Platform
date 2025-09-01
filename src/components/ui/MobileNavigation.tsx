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
    label: 'Dashboard',
    icon: BarChart3,
    color: 'text-blue-600',
  },
  {
    path: '/crisis',
    label: 'Crisis',
    icon: AlertTriangle,
    color: 'text-red-600',
    urgent: true,
  },
  {
    path: '/wellness',
    label: 'Wellness',
    icon: Heart,
    color: 'text-pink-600',
  },
  {
    path: '/community',
    label: 'Community',
    icon: Users,
    color: 'text-green-600',
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
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 md:hidden">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => handleNavClick(item.urgent)}
                className="relative flex flex-col items-center justify-center py-2 px-1"
              >
                {/* Active indicator */}
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute top-0 left-2 right-2 h-0.5 bg-primary-500"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
                
                {/* Icon with animation */}
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`relative ${active ? item.color : 'text-gray-400'}`}
                >
                  <Icon className="h-5 w-5" />
                  
                  {/* Urgent indicator for crisis */}
                  {item.urgent && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                </motion.div>
                
                {/* Label */}
                <span className={`
                  text-xs mt-1 font-medium
                  ${active ? item.color : 'text-gray-400'}
                  ${item.urgent && !active ? 'font-bold' : ''}
                `}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
        
        {/* Safe area padding for devices with home indicator */}
        <div className="h-safe-area-bottom bg-white" />
      </nav>

      {/* Tablet Side Navigation */}
      <nav className="hidden md:flex lg:hidden fixed left-0 top-16 bottom-0 w-20 bg-white border-r border-gray-200 flex-col items-center py-4 space-y-2 z-30">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => handleNavClick(item.urgent)}
              className={`
                relative w-16 h-16 rounded-xl flex flex-col items-center justify-center
                transition-all group
                ${active 
                  ? 'bg-primary-50 shadow-md' 
                  : 'hover:bg-gray-50'
                }
              `}
            >
              {/* Icon */}
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`relative ${active ? item.color : 'text-gray-400 group-hover:text-gray-600'}`}
              >
                <Icon className="h-6 w-6" />
                
                {/* Urgent indicator */}
                {item.urgent && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </motion.div>
              
              {/* Label */}
              <span className={`
                text-xs mt-1 font-medium
                ${active ? item.color : 'text-gray-400 group-hover:text-gray-600'}
              `}>
                {item.label}
              </span>
              
              {/* Active indicator */}
              {active && (
                <motion.div
                  layoutId="activeTabTablet"
                  className="absolute left-0 top-4 bottom-4 w-1 bg-primary-500 rounded-r-full"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* iOS Safe Area Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .h-safe-area-bottom {
          height: env(safe-area-inset-bottom, 0);
        }
      `}} />
    </>
  );
}