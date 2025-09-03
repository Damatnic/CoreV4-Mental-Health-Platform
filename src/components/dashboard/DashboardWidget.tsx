import { ReactNode, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, RefreshCw, MoreVertical, Maximize2, Minimize2 } from 'lucide-react';
import { DashboardWidget as WidgetType } from '../../types/dashboard';

interface DashboardWidgetProps {
  widget: WidgetType;
  children: ReactNode;
  onRefresh?: () => Promise<void>;
  onExpand?: () => void;
  onCollapse?: () => void;
  onSettings?: () => void;
  className?: string;
  loading?: boolean;
  error?: string;
  actions?: ReactNode;
  noPadding?: boolean;
  transparent?: boolean;
}

export function DashboardWidget({
  widget,
  children,
  onRefresh,
  onExpand,
  onCollapse,
  onSettings,
  className = '',
  loading = false,
  error,
  actions,
  noPadding = false,
  transparent = false,
}: DashboardWidgetProps) {
  const [isCollapsed, setIsCollapsed] = useState(widget.isCollapsed || false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Auto-refresh functionality
  useEffect(() => {
    if (widget.refreshInterval && onRefresh && !loading) {
      const _interval = setInterval(async () => {
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
      }, widget.refreshInterval * 1000);

      return () => clearInterval(_interval);
    }
  }, [widget.refreshInterval, onRefresh, loading]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!widget.accessibility?.keyboardShortcut) return;
      
      const shortcut = widget.accessibility.keyboardShortcut;
      const keys = shortcut.split('+');
      
      const modifierPressed = keys.includes('ctrl') ? e.ctrlKey : true;
      const altPressed = keys.includes('alt') ? e.altKey : true;
      const keyPressed = keys[keys.length - 1] === e.key.toLowerCase();
      
      if (modifierPressed && altPressed && keyPressed) {
        e.preventDefault();
        widgetRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [widget.accessibility?.keyboardShortcut]);

  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
  };

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(_newState);
    if (newState && onCollapse) onCollapse();
    if (!newState && onExpand) onExpand();
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Priority-based styling
  const getPriorityStyles = () => {
    switch (widget.priority) {
      case 'critical':
        return 'ring-2 ring-red-500 ring-opacity-50';
      case 'high':
        return 'ring-1 ring-primary-500 ring-opacity-30';
      default:
        return '';
    }
  };

  // Loading skeleton
  if (loading && !children) {
    return (
      <div 
        className={`
          ${transparent ? '' : 'bg-white'} 
          rounded-xl shadow-sm animate-pulse 
          ${className}
        `}
        style={{
          gridColumn: `span ${widget.size.width}`,
          gridRow: `span ${widget.size.height}`,
        }}
      >
        <div className="p-4">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      ref={widgetRef}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        scale: isExpanded ? 1.02 : 1,
        zIndex: isExpanded ? 50 : 1,
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`
        ${transparent ? '' : 'bg-white'} 
        rounded-xl shadow-sm hover:shadow-md transition-all
        ${getPriorityStyles()}
        ${isExpanded ? 'fixed inset-4 z-50' : ''}
        ${className}
      `}
      style={!isExpanded ? {
        gridColumn: `span ${widget.size.width}`,
        gridRow: `span ${widget.size.height}`,
      } : undefined}
      role="region"
      aria-label={widget.accessibility?.ariaLabel || widget.title}
      aria-describedby={widget.accessibility?.ariaDescribedBy}
      tabIndex={widget.accessibility?.focusOrder || 0}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <h3 className="font-semibold text-gray-900">{widget.title}</h3>
          {widget.priority === 'critical' && (
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
              Critical
            </span>
          )}
          {isRefreshing && (
            <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {actions}
          
          {onRefresh && !widget.refreshInterval && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Refresh widget"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
          
          <button
            onClick={toggleExpand}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={isExpanded ? "Minimize widget" : "Expand widget"}
          >
            {isExpanded ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
          
          <button
            onClick={toggleCollapse}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={isCollapsed ? "Expand content" : "Collapse content"}
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
          
          {onSettings && (
            <button
              onClick={onSettings}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Widget settings"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Widget Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`overflow-hidden ${noPadding ? '' : 'p-4'}`}
          >
            {error ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <p className="text-red-600 mb-2">Error loading widget</p>
                  <p className="text-sm text-gray-500">{error}</p>
                  {onRefresh && (
                    <button
                      onClick={handleRefresh}
                      className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
                {children}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Overlay Background */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 -z-10"
          onClick={toggleExpand}
        />
      )}
    </motion.div>
  );
}

// Widget Loading Skeleton Component
export function WidgetSkeleton({ 
  width = 4, 
  height = 2,
  className = ''
}: { 
  width?: number; 
  height?: number;
  className?: string;
}) {
  return (
    <div 
      className={`bg-white rounded-xl shadow-sm animate-pulse ${className}`}
      style={{
        gridColumn: `span ${width}`,
        gridRow: `span ${height}`,
      }}
    >
      <div className="p-4">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {Array.from({ length: height }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}