import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Wind, 
  Timer, 
  BookOpen, 
  MessageSquare, 
  _Calendar, 
  Settings,
  Phone,
  _Shield,
  BarChart3,
  Users,
  Zap,
  Target
} from 'lucide-react';
import { ConsoleFocusable } from '../../console/ConsoleFocusable';

interface QuickLink {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  color: string;
  category: 'wellness' | 'community' | 'tools' | 'emergency';
  priority: number;
}

export function ConsoleQuickLinks() {
  const navigate = useNavigate();
  const quickLinks: QuickLink[] = [
    // Emergency (Highest Priority)
    {
      id: 'crisis-support',
      title: '🆘 Crisis Support',
      description: 'Immediate help available 24/7',
      icon: <Phone className="h-6 w-6" />,
      to: '/crisis',
      color: 'from-red-500 to-pink-600',
      category: 'emergency',
      priority: 100
    },

    // Wellness Activities
    {
      id: 'breathing-exercise',
      title: '🌬️ Breathing Exercise',
      description: 'Quick 5-minute breathing session',
      icon: <Wind className="h-6 w-6" />,
      to: '/wellness/breathing',
      color: 'from-cyan-400 to-blue-500',
      category: 'wellness',
      priority: 90
    },
    {
      id: 'meditation',
      title: '🧘 Meditation',
      description: 'Guided mindfulness sessions',
      icon: <Timer className="h-6 w-6" />,
      to: '/wellness/meditation',
      color: 'from-indigo-400 to-purple-500',
      category: 'wellness',
      priority: 85
    },
    {
      id: 'mood-journal',
      title: '📓 Mood Journal',
      description: 'Track your daily emotions',
      icon: <BookOpen className="h-6 w-6" />,
      to: '/wellness/journal',
      color: 'from-green-400 to-emerald-500',
      category: 'wellness',
      priority: 80
    },

    // Community
    {
      id: 'community-chat',
      title: '💬 Community Chat',
      description: 'Connect with supportive peers',
      icon: <MessageSquare className="h-6 w-6" />,
      to: '/community',
      color: 'from-pink-400 to-rose-500',
      category: 'community',
      priority: 75
    },
    {
      id: 'support-groups',
      title: '👥 Support Groups',
      description: 'Join moderated group sessions',
      icon: <Users className="h-6 w-6" />,
      to: '/community/groups',
      color: 'from-orange-400 to-red-500',
      category: 'community',
      priority: 70
    },

    // Tools & Analytics
    {
      id: 'wellness-analytics',
      title: '📊 Wellness Analytics',
      description: 'View your progress insights',
      icon: <BarChart3 className="h-6 w-6" />,
      to: '/analytics',
      color: 'from-violet-400 to-purple-500',
      category: 'tools',
      priority: 65
    },
    {
      id: 'goal-setting',
      title: '🎯 Goals & Habits',
      description: 'Set and track wellness goals',
      icon: <Target className="h-6 w-6" />,
      to: '/wellness/goals',
      color: 'from-teal-400 to-cyan-500',
      category: 'tools',
      priority: 60
    },
    {
      id: 'settings',
      title: '⚙️ Settings',
      description: 'Customize your experience',
      icon: <Settings className="h-6 w-6" />,
      to: '/settings',
      color: 'from-gray-400 to-gray-500',
      category: 'tools',
      priority: 50
    }
  ];

  // Group links by category
  const emergencyLinks = quickLinks.filter(link => link.category === 'emergency');
  const wellnessLinks = quickLinks.filter(link => link.category === 'wellness');
  const communityLinks = quickLinks.filter(link => link.category === 'community');
  const toolLinks = quickLinks.filter(link => link.category === 'tools');

  const renderLinkGroup = (title: string, links: QuickLink[], delay: number, urgent = false) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="space-y-4"
    >
      <div className="flex items-center space-x-3">
        <div className={`h-px flex-1 bg-gradient-to-r ${urgent ? 'from-red-500/50 via-red-400/30 to-transparent' : 'from-gray-600/50 via-gray-500/30 to-transparent'}`} />
        <h3 className={`text-sm font-semibold uppercase tracking-wider ${urgent ? 'text-red-400' : 'text-gray-400'}`}>
          {title}
        </h3>
        <div className={`h-px flex-1 bg-gradient-to-l ${urgent ? 'from-red-500/50 via-red-400/30 to-transparent' : 'from-gray-600/50 via-gray-500/30 to-transparent'}`} />
      </div>

      <div className={`grid gap-3 ${links.length <= 2 ? 'grid-cols-1' : links.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {links.map((link, index) => (
          <ConsoleFocusable
            key={link.id}
            id={`quick-link-${link.id}`}
            group="quick-links"
            priority={link.priority}
            onActivate={() => navigate(link.to)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 0.1 + index * 0.05 }}
              className="group"
            >
              <Link
                to={link.to}
                className={`block p-4 rounded-console-lg bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/50 backdrop-blur-md shadow-console-card hover:shadow-console-hover transition-all duration-300 relative overflow-hidden ${urgent ? 'border-red-400/30 hover:border-red-400/50' : 'hover:border-gray-600/70'}`}
              >
                {/* Background glow effect */}
                <div className={`absolute inset-0 bg-gradient-to-r ${link.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
                
                <div className="relative z-10 flex items-center space-x-4">
                  <div className={`p-3 rounded-console bg-gradient-to-r ${link.color} bg-opacity-20 group-hover:scale-110 transition-transform duration-300 ${urgent ? 'animate-pulse' : ''}`}>
                    <div className="text-white">
                      {link.icon}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h4 className={`font-semibold mb-1 transition-colors duration-300 ${urgent ? 'text-red-100 group-hover:text-white' : 'text-white'}`}>
                      {link.title}
                    </h4>
                    <p className={`text-sm transition-colors duration-300 ${urgent ? 'text-red-200/80 group-hover:text-red-100' : 'text-gray-400 group-hover:text-gray-300'}`}>
                      {link.description}
                    </p>
                  </div>
                  
                  {urgent && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-3 h-3 bg-red-400 rounded-full"
                    />
                  )}
                </div>

                {/* Hover accent line */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${link.color} opacity-0 group-hover:opacity-60 transition-opacity duration-300`} />
              </Link>
            </motion.div>
          </ConsoleFocusable>
        ))}
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-8">
      {/* Emergency Links - Always First */}
      {renderLinkGroup('Emergency Support', emergencyLinks, 0, true)}
      
      {/* Wellness Activities */}
      {renderLinkGroup('Wellness Activities', wellnessLinks, 0.2)}
      
      {/* Community Features */}
      {renderLinkGroup('Community Support', communityLinks, 0.4)}
      
      {/* Tools & Settings */}
      {renderLinkGroup('Tools & Analytics', toolLinks, 0.6)}

      {/* Quick Action Hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center p-4 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-console-lg border border-gray-600/30 backdrop-blur-md"
      >
        <div className="flex items-center justify-center space-x-2 text-gray-400 text-sm">
          <Zap className="h-4 w-4" />
          <span>Pro Tip: Use keyboard navigation (Arrow keys + Enter) or gamepad for quick access!</span>
        </div>
      </motion.div>
    </div>
  );
}