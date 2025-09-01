import { motion } from 'framer-motion';
import { 
  Brain, Heart, Edit3, Phone, Calendar, MessageSquare, 
  Activity, Pill, Book, Users, Sparkles, Music
} from 'lucide-react';
import { QuickAction } from '../../../types/dashboard';

interface QuickActionsProps {
  actions?: QuickAction[];
  onActionClick?: (action: QuickAction) => void;
}

export function QuickActions({ actions, onActionClick }: QuickActionsProps) {
  // Default quick actions if none provided
  const defaultActions: QuickAction[] = [
    {
      id: '1',
      label: 'Log Mood',
      icon: 'mood',
      description: 'Track how you\'re feeling',
      action: '/wellness/mood',
      color: 'bg-purple-500',
      category: 'tracking',
      keyboard: 'alt+m',
    },
    {
      id: '2',
      label: 'Meditate',
      icon: 'meditation',
      description: '5-minute guided session',
      action: '/wellness/meditation',
      color: 'bg-blue-500',
      category: 'wellness',
      keyboard: 'alt+d',
    },
    {
      id: '3',
      label: 'Journal',
      icon: 'journal',
      description: 'Write your thoughts',
      action: '/wellness/journal',
      color: 'bg-green-500',
      category: 'tracking',
      keyboard: 'alt+j',
    },
    {
      id: '4',
      label: 'Crisis Help',
      icon: 'emergency',
      description: 'Get immediate support',
      action: '/crisis',
      color: 'bg-red-500',
      category: 'crisis',
      isEmergency: true,
      keyboard: 'alt+h',
    },
    {
      id: '5',
      label: 'Breathe',
      icon: 'breathe',
      description: 'Breathing exercise',
      action: '/wellness/breathe',
      color: 'bg-cyan-500',
      category: 'wellness',
    },
    {
      id: '6',
      label: 'Connect',
      icon: 'community',
      description: 'Join support group',
      action: '/community',
      color: 'bg-indigo-500',
      category: 'social',
    },
  ];

  const quickActions = actions || defaultActions;

  // Get icon component based on icon string
  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      mood: Brain,
      meditation: Heart,
      journal: Edit3,
      emergency: Phone,
      schedule: Calendar,
      message: MessageSquare,
      breathe: Activity,
      medication: Pill,
      resources: Book,
      community: Users,
      insights: Sparkles,
      music: Music,
    };
    return icons[iconName] || Brain;
  };

  // Group actions by category
  const groupedActions = quickActions.reduce((acc, action) => {
    if (!acc[action.category]) {
      acc[action.category] = [];
    }
    acc[action.category].push(action);
    return acc;
  }, {} as Record<string, QuickAction[]>);

  // Category display names
  const categoryNames: Record<string, string> = {
    crisis: 'Emergency',
    wellness: 'Wellness',
    tracking: 'Track & Record',
    social: 'Connect',
    professional: 'Professional',
  };

  // Category order (crisis first)
  const categoryOrder = ['crisis', 'wellness', 'tracking', 'social', 'professional'];
  const sortedCategories = categoryOrder.filter(cat => groupedActions[cat]);

  return (
    <div className="space-y-4">
      {sortedCategories.map((category) => (
        <div key={category} className="space-y-2">
          {category !== 'crisis' && (
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {categoryNames[category]}
            </h4>
          )}
          
          <div className={`grid ${category === 'crisis' ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
            {groupedActions[category].map((action, index) => {
              const Icon = getIconComponent(action.icon);
              
              return (
                <motion.button
                  key={action.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onActionClick?.(action)}
                  className={`
                    relative overflow-hidden group
                    ${action.isEmergency 
                      ? 'p-4 bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl' 
                      : 'p-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-900'
                    } 
                    rounded-lg transition-all duration-200
                    ${category === 'crisis' ? 'flex items-center justify-center space-x-3' : 'flex flex-col items-center'}
                  `}
                  aria-label={action.label}
                  title={action.keyboard ? `Keyboard shortcut: ${action.keyboard}` : action.description}
                >
                  {/* Background decoration for non-emergency buttons */}
                  {!action.isEmergency && action.color && (
                    <div 
                      className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${action.color}`}
                    />
                  )}
                  
                  {/* Icon */}
                  <div className={`
                    ${action.isEmergency 
                      ? '' 
                      : `p-2 rounded-lg ${action.color} bg-opacity-10 group-hover:bg-opacity-20`
                    }
                    transition-all
                  `}>
                    <Icon className={`
                      ${action.isEmergency 
                        ? 'h-6 w-6' 
                        : `h-5 w-5 ${action.color?.replace('bg-', 'text-')}`
                      }
                    `} />
                  </div>
                  
                  {/* Label and description */}
                  <div className={category === 'crisis' ? 'text-left' : 'text-center mt-2'}>
                    <p className={`
                      font-medium 
                      ${action.isEmergency ? 'text-base' : 'text-sm'}
                    `}>
                      {action.label}
                    </p>
                    {action.description && (
                      <p className={`
                        text-xs mt-0.5
                        ${action.isEmergency ? 'text-red-100' : 'text-gray-500'}
                      `}>
                        {action.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Keyboard shortcut indicator */}
                  {action.keyboard && !action.isEmergency && (
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                        {action.keyboard}
                      </span>
                    </div>
                  )}
                  
                  {/* Emergency pulse animation */}
                  {action.isEmergency && (
                    <div className="absolute inset-0 -z-10">
                      <div className="absolute inset-0 bg-red-400 opacity-20 animate-ping" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}
      
      {/* Keyboard shortcuts help */}
      <div className="mt-4 p-2 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500 text-center">
          Tip: Use keyboard shortcuts for quick access (Alt + key)
        </p>
      </div>
    </div>
  );
}