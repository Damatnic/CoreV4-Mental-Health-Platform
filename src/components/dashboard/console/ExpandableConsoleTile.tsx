import React, { ReactNode, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Phone, MessageCircle, Shield, FileText, HeartHandshake, 
  Wind, Users as UsersIcon, Video, Calendar, Search,
  BookOpen, Star, MapPin, CreditCard, Headphones,
  Activity, PenTool, Target, Moon, TrendingUp, Clock
} from 'lucide-react';
import { ConsoleFocusable } from '../../console/ConsoleFocusable';
import { useMobileFeatures } from '../../../hooks/useMobileFeatures';
import { useConsoleNavigation } from '../../../hooks/useConsoleNavigation';
import { useVibration } from '../../../hooks/useVibration';
import { initializeTouchOptimization } from '../../../utils/mobile/touchOptimization';

export interface ExpandableOption {
  id: string;
  label: string;
  icon: ReactNode;
  action: () => void;
  urgent?: boolean;
  badge?: string;
  description?: string;
}

interface ExpandableConsoleTileProps {
  title: string;
  description: string;
  icon: ReactNode;
  gradient: 'wellness' | 'community' | 'professional' | 'crisis';
  size: 'small' | 'medium' | 'large';
  to: string;
  badges?: string[];
  status?: string;
  urgent?: boolean;
  showProgress?: boolean;
  progressValue?: number;
  delay?: number;
  expandableOptions?: ExpandableOption[];
  children?: ReactNode;
}

const gradientMap = {
  wellness: 'from-blue-500 to-purple-600',
  community: 'from-green-400 to-emerald-600',
  professional: 'from-yellow-400 to-orange-600',
  crisis: 'from-pink-500 to-red-600',
};

// Export predefined contextual options for reuse
export const contextualOptions: Record<string, ExpandableOption[]> = {
  crisis: [
    {
      id: 'crisis-hotline',
      label: 'Call Crisis Hotline',
      icon: <Phone className="h-5 w-5" />,
      description: '988 - Immediate support',
      urgent: true,
      action: () => window.location.href = 'tel:988',
    },
    {
      id: 'crisis-text',
      label: 'Text Crisis Line',
      icon: <MessageCircle className="h-5 w-5" />,
      description: 'Text HOME to 741741',
      urgent: true,
      action: () => window.location.href = 'sms:741741?body=HOME',
    },
    {
      id: 'emergency-services',
      label: 'Emergency Services',
      icon: <Shield className="h-5 w-5" />,
      description: 'Call 911 for emergencies',
      urgent: true,
      action: () => window.location.href = 'tel:911',
    },
    {
      id: 'safety-plan',
      label: 'Safety Plan Builder',
      icon: <FileText className="h-5 w-5" />,
      description: 'Create your personalized plan',
      action: () => window.location.href = '/crisis/safety-plan',
    },
    {
      id: 'crisis-chat',
      label: 'Crisis Chat',
      icon: <HeartHandshake className="h-5 w-5" />,
      description: 'Chat with a counselor',
      badge: 'Live',
      action: () => window.location.href = '/crisis/chat',
    },
    {
      id: 'breathing-exercises',
      label: 'Breathing Exercises',
      icon: <Wind className="h-5 w-5" />,
      description: 'Immediate calming techniques',
      action: () => window.location.href = '/wellness/breathing',
    },
    {
      id: 'local-contacts',
      label: 'Local Emergency Contacts',
      icon: <MapPin className="h-5 w-5" />,
      description: 'Your saved emergency contacts',
      action: () => window.location.href = '/crisis/contacts',
    },
  ],
  wellness: [
    {
      id: 'mood-checkin',
      label: 'Mood Check-in',
      icon: <Activity className="h-5 w-5" />,
      description: 'How are you feeling today?',
      action: () => window.location.href = '/wellness/mood',
    },
    {
      id: 'journal-entry',
      label: 'Daily Journal Entry',
      icon: <PenTool className="h-5 w-5" />,
      description: 'Express your thoughts',
      action: () => window.location.href = '/wellness/journal',
    },
    {
      id: 'guided-meditation',
      label: 'Guided Meditation',
      icon: <Headphones className="h-5 w-5" />,
      description: 'Find your inner peace',
      badge: 'New',
      action: () => window.location.href = '/wellness/meditation',
    },
    {
      id: 'breathing-wellness',
      label: 'Breathing Exercises',
      icon: <Wind className="h-5 w-5" />,
      description: 'Reduce stress and anxiety',
      action: () => window.location.href = '/wellness/breathing',
    },
    {
      id: 'sleep-tracker',
      label: 'Sleep Tracker',
      icon: <Moon className="h-5 w-5" />,
      description: 'Monitor your sleep patterns',
      action: () => window.location.href = '/wellness/sleep',
    },
    {
      id: 'wellness-goals',
      label: 'Wellness Goals',
      icon: <Target className="h-5 w-5" />,
      description: 'Set and track your goals',
      action: () => window.location.href = '/wellness/goals',
    },
    {
      id: 'progress-review',
      label: 'Progress Review',
      icon: <TrendingUp className="h-5 w-5" />,
      description: 'View your wellness journey',
      action: () => window.location.href = '/wellness/progress',
    },
  ],
  community: [
    {
      id: 'support-groups',
      label: 'Support Groups',
      icon: <UsersIcon className="h-5 w-5" />,
      description: 'Join group sessions',
      badge: '12 Active',
      action: () => window.location.href = '/community/groups',
    },
    {
      id: 'peer-chat',
      label: 'Peer Chat',
      icon: <MessageCircle className="h-5 w-5" />,
      description: 'Connect with peers',
      badge: '247 Online',
      action: () => window.location.href = '/community/chat',
    },
    {
      id: 'community-forums',
      label: 'Community Forums',
      icon: <BookOpen className="h-5 w-5" />,
      description: 'Share experiences',
      action: () => window.location.href = '/community/forums',
    },
    {
      id: 'success-stories',
      label: 'Success Stories',
      icon: <Star className="h-5 w-5" />,
      description: 'Get inspired by others',
      action: () => window.location.href = '/community/stories',
    },
    {
      id: 'weekly-challenges',
      label: 'Weekly Challenges',
      icon: <Target className="h-5 w-5" />,
      description: 'Join wellness challenges',
      badge: 'New',
      action: () => window.location.href = '/community/challenges',
    },
    {
      id: 'group-activities',
      label: 'Group Activities',
      icon: <Calendar className="h-5 w-5" />,
      description: 'Participate in events',
      action: () => window.location.href = '/community/activities',
    },
    {
      id: 'local-groups',
      label: 'Find Local Groups',
      icon: <MapPin className="h-5 w-5" />,
      description: 'Connect locally',
      action: () => window.location.href = '/community/local',
    },
  ],
  professional: [
    {
      id: 'find-therapists',
      label: 'Find Therapists',
      icon: <Search className="h-5 w-5" />,
      description: 'Search for providers',
      action: () => window.location.href = '/professional/find',
    },
    {
      id: 'book-appointment',
      label: 'Book Appointment',
      icon: <Calendar className="h-5 w-5" />,
      description: 'Schedule a session',
      badge: 'Available',
      action: () => window.location.href = '/professional/book',
    },
    {
      id: 'video-consultation',
      label: 'Video Consultation',
      icon: <Video className="h-5 w-5" />,
      description: 'Start virtual session',
      action: () => window.location.href = '/professional/video',
    },
    {
      id: 'message-therapist',
      label: 'Message Therapist',
      icon: <MessageCircle className="h-5 w-5" />,
      description: 'Secure messaging',
      action: () => window.location.href = '/professional/messages',
    },
    {
      id: 'treatment-plans',
      label: 'Treatment Plans',
      icon: <FileText className="h-5 w-5" />,
      description: 'View your care plan',
      action: () => window.location.href = '/professional/plans',
    },
    {
      id: 'insurance-help',
      label: 'Insurance Help',
      icon: <CreditCard className="h-5 w-5" />,
      description: 'Coverage assistance',
      action: () => window.location.href = '/professional/insurance',
    },
    {
      id: 'provider-reviews',
      label: 'Provider Reviews',
      icon: <Star className="h-5 w-5" />,
      description: 'Read testimonials',
      action: () => window.location.href = '/professional/reviews',
    },
  ],
};

export function ExpandableConsoleTile({
  title,
  description,
  icon,
  gradient,
  size,
  to,
  badges = [],
  status,
  urgent = false,
  showProgress = false,
  progressValue = 0,
  delay = 0,
  expandableOptions,
  children,
}: ExpandableConsoleTileProps) {
  const navigate = useNavigate();
  const { isMobileDevice, isSmallScreen, deviceInfo } = useMobileFeatures();
  const { isPerformanceMode } = useConsoleNavigation();
  const { vibrate } = useVibration();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const tileRef = useRef<HTMLDivElement>(null);
  const expandedRef = useRef<HTMLDivElement>(null);

  // Determine which options to use based on tile type
  const getTileOptions = useCallback(() => {
    if (expandableOptions) return expandableOptions;
    
    // Map title to contextual options
    if (title.includes('Crisis')) return contextualOptions.crisis;
    if (title.includes('Wellness')) return contextualOptions.wellness;
    if (title.includes('Community')) return contextualOptions.community;
    if (title.includes('Professional')) return contextualOptions.professional;
    
    return [];
  }, [title, expandableOptions]);

  const options = getTileOptions();

  // Mobile-optimized size mappings
  const getMobileSizeMap = (isMobile: boolean, isSmall: boolean) => {
    if (isSmall) {
      return {
        small: 'col-span-1 row-span-1 min-h-[10rem]',
        medium: 'col-span-1 row-span-1 min-h-[12rem]',
        large: 'col-span-1 row-span-1 min-h-[14rem]',
      };
    }
    
    if (isMobile) {
      return {
        small: 'col-span-1 row-span-1 min-h-[9rem]',
        medium: 'col-span-1 sm:col-span-2 row-span-1 min-h-[11rem]',
        large: 'col-span-1 sm:col-span-2 row-span-1 min-h-[13rem]',
      };
    }
    
    return {
      small: 'col-span-1 row-span-1 h-auto min-h-[8rem]',
      medium: 'col-span-1 md:col-span-2 row-span-1 h-auto min-h-[10rem]',
      large: 'col-span-1 md:col-span-2 lg:col-span-1 row-span-2 h-auto min-h-[20rem]',
    };
  };

  const sizeMap = getMobileSizeMap(isMobileDevice, isSmallScreen);

  // Animation variants
  const tileVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: isSmallScreen ? 20 : 40,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: isPerformanceMode ? 30 : 25,
        stiffness: isPerformanceMode ? 400 : 300,
        delay: isPerformanceMode ? delay * 0.05 : delay * 0.1,
      },
    },
    expanded: {
      scale: 1,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300,
      },
    },
  };

  const optionVariants = {
    hidden: { 
      opacity: 0, 
      y: -10,
      scale: 0.95,
    },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.03,
        type: 'spring',
        damping: 25,
        stiffness: 400,
      },
    }),
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: {
        duration: 0.2,
      },
    },
  };

  // Handle tile click
  const handleTileClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Provide haptic feedback
    vibrate(urgent ? [50, 30] : [25]);
    
    // Toggle expansion
    setIsExpanded(!isExpanded);
    
    // If collapsed, navigate to main route after a delay
    if (!isExpanded && !options.length) {
      setTimeout(() => navigate(to), 150);
    }
  }, [isExpanded, navigate, to, urgent, vibrate, options.length]);

  // Handle option click
  const handleOptionClick = useCallback((option: ExpandableOption, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Haptic feedback for option selection
    vibrate([30, 20, 30]);
    
    // Execute the option's action
    option.action();
  }, [vibrate]);

  // Handle mobile touch optimization
  React.useEffect(() => {
    if (tileRef.current && deviceInfo.hasTouch) {
      const touchManager = initializeTouchOptimization(tileRef.current, {
        enableFastClick: true,
        enableVibration: true,
        longPressDelay: 500,
      });

      touchManager.on('tap', () => {
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 100);
      });

      touchManager.on('longPress', () => {
        vibrate([100, 50, 100]);
        setIsExpanded(true);
      });

      return () => touchManager.destroy();
    }
  }, [deviceInfo.hasTouch, vibrate]);

  // Handle ESC key to close expanded tile
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
        vibrate([20]);
      }
    };

    if (isExpanded) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isExpanded, vibrate]);

  // Progress ring calculations
  const progressRingSize = isMobileDevice ? (isSmallScreen ? 50 : 55) : 60;
  const strokeWidth = isMobileDevice ? 3 : 4;
  const radius = (progressRingSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${(progressValue / 100) * circumference} ${circumference}`;

  return (
    <motion.div
      variants={tileVariants}
      initial="hidden"
      animate={isExpanded ? "expanded" : "visible"}
      className={`${sizeMap[size]} relative overflow-visible transition-all duration-300`}
      style={{ zIndex: isExpanded ? 50 : 1 }}
    >
      <ConsoleFocusable
        id={`expandable-tile-${title.toLowerCase().replace(/\s+/g, '-')}`}
        group="dashboard-tiles"
        priority={urgent ? 100 : 50}
        className="h-full"
        onActivate={() => {
          vibrate(urgent ? [80, 40] : [40]);
          setIsExpanded(!isExpanded);
        }}
      >
        <motion.div
          ref={tileRef}
          className={`
            relative h-full group cursor-pointer
            ${isPressed ? 'scale-98' : ''}
            ${isExpanded ? 'z-50' : 'z-10'}
          `}
          onClick={handleTileClick}
          whileHover={{ scale: isMobileDevice ? 1 : 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Main Tile Content */}
          <div className={`
            relative h-full rounded-2xl
            bg-gradient-to-br from-gray-800/95 to-gray-900/95
            border backdrop-blur-md
            transition-all duration-300 ease-out
            ${urgent ? 'border-red-400/60 shadow-red-500/20' : 'border-gray-700/50'}
            ${isExpanded ? 'border-blue-400/60 shadow-blue-500/30 shadow-2xl' : ''}
            hover:border-gray-600/70 
            ${isMobileDevice ? 'p-4' : 'p-6'}
            ${isSmallScreen ? 'p-3 rounded-xl' : ''}
          `}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-gradient-to-r from-white/10 to-transparent blur-2xl" />
              <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full bg-gradient-to-r from-blue-400/20 to-transparent blur-xl" />
            </div>

            {/* Header Section */}
            <div className={`relative z-10 flex items-start justify-between ${
              isMobileDevice ? 'mb-3' : 'mb-4'
            }`}>
              <div className={`flex items-center ${
                isSmallScreen ? 'space-x-2' : 'space-x-3'
              }`}>
                <div className={`
                  rounded-xl bg-gradient-to-r ${gradientMap[gradient]} shadow-lg
                  ${isSmallScreen ? 'p-2' : isMobileDevice ? 'p-2.5' : 'p-3'}
                  ${isExpanded ? 'animate-pulse' : ''}
                `}>
                  {React.cloneElement(icon as React.ReactElement, {
                    className: `text-white ${isSmallScreen ? 'h-5 w-5' : 'h-6 w-6'}`
                  })}
                </div>
                {status && (
                  <div className={`
                    bg-green-500/20 border border-green-400/30 rounded-full
                    text-green-300 font-medium
                    ${isSmallScreen ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'}
                  `}>
                    {status}
                  </div>
                )}
              </div>

              {/* Progress Ring or Expand Indicator */}
              {showProgress && !isExpanded ? (
                <div className="relative">
                  <svg width={progressRingSize} height={progressRingSize} className="transform -rotate-90">
                    <circle
                      cx={progressRingSize / 2}
                      cy={progressRingSize / 2}
                      r={radius}
                      stroke="rgb(55, 65, 81)"
                      strokeWidth={strokeWidth}
                      fill="none"
                    />
                    <motion.circle
                      cx={progressRingSize / 2}
                      cy={progressRingSize / 2}
                      r={radius}
                      stroke="rgb(59, 130, 246)"
                      strokeWidth={strokeWidth}
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={strokeDasharray}
                      initial={{ strokeDasharray: '0 1000' }}
                      animate={{ strokeDasharray }}
                      transition={{ duration: 1.5, ease: 'easeInOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-300">{progressValue}%</span>
                  </div>
                </div>
              ) : (
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className={`
                    rounded-lg bg-gray-700/50 
                    ${isSmallScreen ? 'p-1.5' : 'p-2'}
                  `}
                >
                  <Clock className={`
                    text-gray-400
                    ${isSmallScreen ? 'h-4 w-4' : 'h-5 w-5'}
                  `} />
                </motion.div>
              )}
            </div>

            {/* Content Section */}
            <div className="relative z-10">
              <h3 className={`
                font-bold text-white group-hover:text-blue-200 transition-colors
                ${isSmallScreen ? 'text-base mb-1' : isMobileDevice ? 'text-lg mb-2' : 'text-xl mb-2'}
              `}>
                {title}
              </h3>
              <p className={`
                text-gray-300 line-clamp-2
                ${isSmallScreen ? 'text-xs mb-2' : isMobileDevice ? 'text-sm mb-3' : 'text-sm mb-4'}
              `}>
                {description}
              </p>

              {/* Badges */}
              {badges.length > 0 && !isExpanded && (
                <div className="flex flex-wrap gap-1.5">
                  {badges.map((badge, index) => (
                    <span
                      key={index}
                      className={`
                        bg-blue-500/20 border border-blue-400/30 rounded-full
                        text-blue-300 font-medium
                        ${isSmallScreen ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'}
                      `}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              )}

              {/* Custom Children */}
              {!isExpanded && children}
            </div>

            {/* Hover Glow Effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Bottom Border Accent */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${gradientMap[gradient]} opacity-60 rounded-b-2xl`} />
          </div>

          {/* Expandable Options Panel */}
          <AnimatePresence>
            {isExpanded && options.length > 0 && (
              <motion.div
                ref={expandedRef}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className={`
                  absolute left-0 right-0 top-full mt-2 z-50
                  bg-gradient-to-br from-gray-800/98 to-gray-900/98
                  border border-gray-700/70 rounded-2xl
                  backdrop-blur-lg shadow-2xl
                  ${isMobileDevice ? 'p-3' : 'p-4'}
                  ${isSmallScreen ? 'rounded-xl' : ''}
                `}
                style={{ 
                  maxHeight: isMobileDevice ? '70vh' : '60vh',
                  overflowY: 'auto',
                }}
              >
                {/* Options Grid */}
                <div className={`
                  grid gap-2
                  ${isSmallScreen ? 'grid-cols-1' : isMobileDevice ? 'grid-cols-1' : 'grid-cols-2'}
                `}>
                  {options.map((option, index) => (
                    <motion.button
                      key={option.id}
                      custom={index}
                      variants={optionVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      onClick={(e) => handleOptionClick(option, e)}
                      className={`
                        group/option relative flex items-center space-x-3
                        p-3 rounded-xl text-left w-full
                        bg-gray-700/30 hover:bg-gray-700/50
                        border transition-all duration-200
                        ${option.urgent 
                          ? 'border-red-500/30 hover:border-red-400/50 hover:shadow-red-500/20' 
                          : 'border-gray-600/30 hover:border-blue-400/50 hover:shadow-blue-500/20'
                        }
                        hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
                        focus:outline-none focus:ring-2 focus:ring-blue-400/50
                      `}
                    >
                      {/* Option Icon */}
                      <div className={`
                        rounded-lg p-2 flex-shrink-0
                        ${option.urgent 
                          ? 'bg-red-500/20 text-red-300' 
                          : 'bg-blue-500/20 text-blue-300'
                        }
                        group-hover/option:scale-110 transition-transform
                      `}>
                        {option.icon}
                      </div>

                      {/* Option Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`
                            font-semibold text-white group-hover/option:text-blue-200
                            ${isSmallScreen ? 'text-sm' : 'text-base'}
                          `}>
                            {option.label}
                          </span>
                          {option.badge && (
                            <span className={`
                              px-1.5 py-0.5 rounded-full text-[10px] font-medium
                              ${option.urgent 
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                                : 'bg-green-500/20 text-green-300 border border-green-500/30'
                              }
                            `}>
                              {option.badge}
                            </span>
                          )}
                        </div>
                        {option.description && (
                          <p className={`
                            text-gray-400 mt-0.5
                            ${isSmallScreen ? 'text-xs' : 'text-sm'}
                          `}>
                            {option.description}
                          </p>
                        )}
                      </div>

                      {/* Hover Arrow */}
                      <div className="opacity-0 group-hover/option:opacity-100 transition-opacity">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Quick Access Footer */}
                <div className={`
                  mt-3 pt-3 border-t border-gray-700/50
                  ${isSmallScreen ? 'text-xs' : 'text-sm'}
                `}>
                  <button
                    onClick={() => navigate(to)}
                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    View All {title} Options →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </ConsoleFocusable>

      {/* Backdrop for expanded state */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}