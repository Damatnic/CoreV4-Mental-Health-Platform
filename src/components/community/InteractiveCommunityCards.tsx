import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  Heart, 
  Star, 
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Shield,
  Award,
  Sparkles,
  Activity,
  Plus,
  ArrowRight,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface CommunityCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  stats: { label: string; value: string | number }[];
  actions: { label: string; href: string; primary?: boolean }[];
  color: string;
  expandedContent?: React.ReactNode;
}

export const InteractiveCommunityCards: React.FC = () => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const communityCards: CommunityCard[] = [
    {
      id: 'support-groups',
      title: '🤝 Support Groups',
      description: 'Join topic-specific groups where you can share experiences and find understanding.',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      stats: [
        { label: 'Active Groups', value: 24 },
        { label: 'Members', value: '2.4K' },
        { label: 'Daily Posts', value: 156 }
      ],
      actions: [
        { label: 'Browse Groups', href: '/community/groups', primary: true },
        { label: 'Create Group', href: '/community/groups/new' }
      ],
      expandedContent: (
        <div className="space-y-3 mt-4">
          <h4 className="text-white font-semibold mb-2">Popular Groups:</h4>
          {['Anxiety Warriors', 'Depression Support', 'PTSD Recovery', 'Mindfulness Practice'].map((group) => (
            <div key={group} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-console hover:bg-gray-700/50 transition-colors">
              <span className="text-gray-300">{group}</span>
              <button className="text-blue-400 hover:text-blue-300 text-sm">Join</button>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'peer-support',
      title: '💬 Peer Support Chat',
      description: 'Connect with trained peer supporters who understand what you\'re going through.',
      icon: MessageSquare,
      color: 'from-purple-500 to-pink-500',
      stats: [
        { label: 'Online Now', value: 43 },
        { label: 'Avg Response', value: '< 2 min' },
        { label: 'Satisfaction', value: '98%' }
      ],
      actions: [
        { label: 'Start Chat', href: '/community/chat', primary: true },
        { label: 'Schedule Session', href: '/community/chat/schedule' }
      ],
      expandedContent: (
        <div className="space-y-3 mt-4">
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-console border border-purple-500/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white">43 peer supporters available now</span>
            </div>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-gray-400 text-sm">
            Our peer supporters are community members who have received training and have lived experience 
            with mental health challenges. They provide emotional support and understanding.
          </p>
        </div>
      )
    },
    {
      id: 'events',
      title: '📅 Community Events',
      description: 'Join virtual workshops, support sessions, and wellness activities.',
      icon: Calendar,
      color: 'from-green-500 to-emerald-500',
      stats: [
        { label: 'This Week', value: 8 },
        { label: 'Registered', value: 324 },
        { label: 'Topics', value: 15 }
      ],
      actions: [
        { label: 'View Events', href: '/community/events', primary: true },
        { label: 'Host Event', href: '/community/events/create' }
      ],
      expandedContent: (
        <div className="space-y-3 mt-4">
          <h4 className="text-white font-semibold mb-2">Upcoming Today:</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-console border border-green-500/30">
              <div>
                <p className="text-white text-sm font-medium">Mindfulness Meditation</p>
                <p className="text-gray-400 text-xs">2:00 PM - 3:00 PM</p>
              </div>
              <button className="text-green-400 hover:text-green-300 text-sm">Join</button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-console border border-green-500/30">
              <div>
                <p className="text-white text-sm font-medium">Anxiety Management Workshop</p>
                <p className="text-gray-400 text-xs">5:00 PM - 6:30 PM</p>
              </div>
              <button className="text-green-400 hover:text-green-300 text-sm">Register</button>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'success-stories',
      title: '⭐ Success Stories',
      description: 'Read inspiring stories from community members on their recovery journeys.',
      icon: Award,
      color: 'from-yellow-500 to-orange-500',
      stats: [
        { label: 'Stories', value: 156 },
        { label: 'Inspired', value: '12K+' },
        { label: 'This Month', value: 23 }
      ],
      actions: [
        { label: 'Read Stories', href: '/community/stories', primary: true },
        { label: 'Share Your Story', href: '/community/stories/share' }
      ],
      expandedContent: (
        <div className="space-y-3 mt-4">
          <div className="p-4 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 rounded-console border border-yellow-500/30">
            <p className="text-gray-300 text-sm italic">
              "This community helped me realize I wasn't alone. The support I received here 
              gave me the strength to seek professional help and start my recovery journey."
            </p>
            <p className="text-yellow-400 text-xs mt-2">- Sarah, 3 months ago</p>
          </div>
        </div>
      )
    }
  ];

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  return (
    <div className="space-y-6">
      {/* Mobile-optimized grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {communityCards.map((card, index) => {
          const Icon = card.icon;
          const isExpanded = expandedCard === card.id;
          const isHovered = hoveredCard === card.id;

          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onMouseEnter={() => setHoveredCard(card.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className="relative"
            >
              <motion.div
                animate={{
                  scale: isHovered ? 1.02 : 1,
                  y: isExpanded ? 0 : 0
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`
                  bg-gradient-to-br from-gray-800/90 to-gray-900/90 
                  border border-gray-700/50 
                  rounded-console-lg 
                  p-6 
                  backdrop-blur-md 
                  shadow-console-card 
                  hover:shadow-console-hover 
                  transition-all 
                  duration-300 
                  relative 
                  overflow-hidden
                  cursor-pointer
                  min-h-[200px]
                  ${isExpanded ? 'ring-2 ring-blue-500/50' : ''}
                `}
                onClick={() => toggleCard(card.id)}
              >
                {/* Background gradient effect */}
                <motion.div 
                  className={`absolute inset-0 bg-gradient-to-r ${card.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}
                  animate={{
                    opacity: isHovered ? 0.1 : 0.05
                  }}
                />
                
                {/* Card Header */}
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                        className={`p-3 bg-gradient-to-r ${card.color} rounded-console shadow-console-glow`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </motion.div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{card.title}</h3>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-gray-400"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </motion.div>
                  </div>
                  
                  <p className="text-gray-300 mb-4">{card.description}</p>
                  
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {card.stats.map((stat) => (
                      <div key={stat.label} className="text-center p-2 bg-gray-800/50 rounded-console">
                        <motion.p 
                          className="text-lg font-bold text-white"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.3 }}
                        >
                          {stat.value}
                        </motion.p>
                        <p className="text-xs text-gray-400">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  
                  {/* Action Buttons - Always visible */}
                  <div className="flex gap-3">
                    {card.actions.map((action) => (
                      <Link
                        key={action.label}
                        to={action.href}
                        onClick={(e) => e.stopPropagation()}
                        className={`
                          flex-1 
                          py-2 px-4 
                          rounded-console 
                          font-medium 
                          text-sm 
                          transition-all 
                          duration-300 
                          text-center
                          ${action.primary 
                            ? `bg-gradient-to-r ${card.color} text-white hover:opacity-90 shadow-console-glow` 
                            : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border border-gray-600/50'
                          }
                        `}
                      >
                        {action.label}
                      </Link>
                    ))}
                  </div>
                  
                  {/* Expandable Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        {card.expandedContent}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Hover effect overlay */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  animate={{
                    background: isHovered 
                      ? 'radial-gradient(circle at center, rgba(59, 130, 246, 0.1) 0%, transparent 70%)'
                      : 'radial-gradient(circle at center, transparent 0%, transparent 70%)'
                  }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Action Bar - Mobile optimized */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-console-lg border border-blue-500/30 backdrop-blur-md"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <p className="text-white font-medium">Need immediate support?</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Link 
              to="/crisis" 
              className="flex-1 md:flex-initial px-4 py-2 bg-red-500/20 text-red-300 rounded-console border border-red-500/30 hover:bg-red-500/30 transition-colors text-center"
            >
              Crisis Support
            </Link>
            <Link 
              to="/community/chat" 
              className="flex-1 md:flex-initial px-4 py-2 bg-blue-500/20 text-blue-300 rounded-console border border-blue-500/30 hover:bg-blue-500/30 transition-colors text-center"
            >
              Chat Now
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default InteractiveCommunityCards;