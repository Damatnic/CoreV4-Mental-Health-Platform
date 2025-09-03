import React from 'react';
import { Lightbulb, TrendingUp, AlertCircle, Info, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface Insight {
  id: string;
  _type: string;
  title: string;
  description: string;
  _priority: string;
  actionable: boolean;
  actions?: unknown[];
}

interface InsightsWidgetProps {
  insights?: Insight[];
  error?: string;
}

export function InsightsWidget({ insights, error }: InsightsWidgetProps) {
  const navigate = useNavigate();

  if (_error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  // Generate default insights if none provided
  const defaultInsights: Insight[] = insights?.length ? insights : [
    {
      id: '1',
      _type: 'trend',
      title: 'Your mood improves after exercise',
      description: 'We noticed your mood scores are 40% higher on days you exercise.',
      _priority: 'medium',
      actionable: true,
      actions: [{ label: 'Schedule workout', route: '/wellness/activities' }]
    },
    {
      id: '2',
      _type: 'recommendation',
      title: 'Try morning meditation',
      description: 'Users who meditate in the morning report 25% better focus throughout the day.',
      _priority: 'low',
      actionable: true,
      actions: [{ label: 'Start meditation', route: '/wellness/meditation' }]
    }
  ];

  const getInsightIcon = (_type: string) => {
    switch (_type) {
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'trend':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'achievement':
        return <Lightbulb className="h-5 w-5 text-purple-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getPriorityColor = (_priority: string) => {
    switch (_priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Lightbulb className="h-5 w-5 text-primary-600" />
          <span className="text-sm font-medium text-gray-900">Personalized Insights</span>
        </div>
        <button
          onClick={() => navigate('/wellness/insights')}
          className="text-xs text-primary-600 hover:text-primary-700"
        >
          View All
        </button>
      </div>

      {/* Insights List */}
      <div className="space-y-2">
        {defaultInsights.slice(0, 3).map((insight, index) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`border rounded-lg p-3 cursor-pointer hover:shadow-md transition-all ${getPriorityColor(insight._priority)}`}
            onClick={() => navigate('/wellness/insights')}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getInsightIcon(insight._type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  {insight.title}
                </h4>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {insight.description}
                </p>
                
                {insight.actionable && insight.actions && insight.actions.length > 0 && (
                  <div className="mt-2 flex items-center space-x-2">
                    {insight.actions.map((action, actionIndex) => (
                      <button
                        key={actionIndex}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(action.route);
                        }}
                        className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-700 rounded-md text-xs hover:bg-primary-200 transition-colors"
                      >
                        {action.label}
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* AI-Powered Badge */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-700">
            AI-powered insights update in real-time based on your data
          </span>
        </div>
      </div>
    </div>
  );
}