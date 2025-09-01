import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigation } from './NavigationContext';

export function Breadcrumbs() {
  const { breadcrumbs, mode, preferences } = useNavigation();
  
  // Don't show breadcrumbs in crisis mode to reduce cognitive load
  if (mode === 'crisis') {
    return null;
  }
  
  // Don't show if only on home page
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav 
      aria-label="Breadcrumb navigation"
      className="px-4 sm:px-6 lg:px-8 py-2 bg-gray-50 border-b border-gray-200"
    >
      <ol className="flex items-center space-x-2 text-sm max-w-7xl mx-auto overflow-x-auto">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isFirst = index === 0;
          
          return (
            <motion.li 
              key={crumb.path}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center"
            >
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-gray-400 mx-2 flex-shrink-0" />
              )}
              
              {isLast ? (
                <span 
                  className="text-gray-900 font-medium truncate max-w-[200px]"
                  aria-current="page"
                >
                  {isFirst && <Home className="h-4 w-4 inline mr-1" />}
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.path}
                  className="text-gray-500 hover:text-gray-700 transition-colors truncate max-w-[200px] hover:underline"
                >
                  {isFirst && <Home className="h-4 w-4 inline mr-1" />}
                  {crumb.label}
                </Link>
              )}
            </motion.li>
          );
        })}
      </ol>
    </nav>
  );
}

// Mobile-optimized breadcrumbs that collapse intelligently
export function MobileBreadcrumbs() {
  const { breadcrumbs } = useNavigation();
  
  if (breadcrumbs.length <= 1) {
    return null;
  }
  
  // On mobile, show only: Home > ... > Current
  const showEllipsis = breadcrumbs.length > 2;
  const visibleCrumbs = showEllipsis 
    ? [breadcrumbs[0], breadcrumbs[breadcrumbs.length - 1]]
    : breadcrumbs;
  
  return (
    <nav 
      aria-label="Breadcrumb navigation"
      className="px-4 py-2 bg-gray-50 border-b border-gray-200 md:hidden"
    >
      <ol className="flex items-center space-x-1 text-xs">
        {visibleCrumbs.map((crumb, index) => {
          if (!crumb) return null;
          const isLast = index === visibleCrumbs.length - 1;
          
          return (
            <React.Fragment key={crumb.path}>
              {index > 0 && showEllipsis && index === 1 && (
                <>
                  <ChevronRight className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-400">...</span>
                </>
              )}
              {index > 0 && !showEllipsis && (
                <ChevronRight className="h-3 w-3 text-gray-400" />
              )}
              
              <li className="flex items-center">
                {isLast ? (
                  <span className="text-gray-900 font-medium truncate max-w-[120px]">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    to={crumb.path}
                    className="text-gray-500 hover:text-gray-700 truncate max-w-[120px]"
                  >
                    {index === 0 ? <Home className="h-3 w-3" /> : crumb.label}
                  </Link>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}