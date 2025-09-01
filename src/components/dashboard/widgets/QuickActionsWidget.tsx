import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Brain, 
  BookOpen, 
  AlertTriangle, 
  Users, 
  Pill,
  Calendar,
  MessageCircle,
  Activity,
  Target
} from 'lucide-react';
import { QuickAction } from '../../../types/dashboard';

interface QuickActionsWidgetProps {
  actions?: QuickAction[];
  error?: string;
}

export function QuickActionsWidget({ actions, error }: QuickActionsWidgetProps) {
  const navigate = useNavigate();

  const getActionIcon = (icon: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      mood: <Heart className="h-5 w-5" />,
      meditation: <Brain className="h-5 w-5" />,
      journal: <BookOpen className="h-5 w-5" />,
      emergency: <AlertTriangle className="h-5 w-5" />,
      community: <Users className="h-5 w-5" />,
      medication: <Pill className="h-5 w-5" />,
      calendar: <Calendar className="h-5 w-5" />,
      chat: <MessageCircle className="h-5 w-5" />,
      activity: <Activity className="h-5 w-5" />,
      goals: <Target className="h-5 w-5" />
    };
    return iconMap[icon] || <Heart className="h-5 w-5" />;
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!actions || actions.length === 0) {
    return (
      <div className="flex space-x-3 overflow-x-auto pb-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-shrink-0 w-32 h-20 bg-gray-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  const handleAction = (action: QuickAction) => {
    // Handle special actions
    if (action.isEmergency) {
      // Trigger crisis flow immediately
      navigate('/crisis');
    } else if (action.action.startsWith('/')) {
      // Navigate to route
      navigate(action.action);
    } else if (action.action.startsWith('http')) {
      // Open external link
      window.open(action.action, '_blank');
    } else {
      // Custom action handler
      console.log('Custom action:', action.action);
    }
  };

  return (
    <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
      {actions.map((action, index) => (
        <motion.button
          key={action.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleAction(action)}
          className={`
            flex-shrink-0 min-w-[120px] p-4 rounded-xl transition-all
            ${action.isEmergency 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : `${action.color || 'bg-primary-500'} hover:opacity-90 text-white`
            }
          `}
          aria-label={action.description}
          title={action.keyboard ? `Keyboard shortcut: ${action.keyboard}` : undefined}
        >
          <div className="flex flex-col items-center space-y-2">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              {getActionIcon(action.icon)}
            </div>
            <span className="text-sm font-medium">{action.label}</span>
          </div>
        </motion.button>
      ))}
    </div>
  );
}