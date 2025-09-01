import React from 'react';
import { Target, Trophy, TrendingUp, Calendar, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface Goal {
  id: string;
  title: string;
  category: string;
  progress: number;
  targetDate?: Date;
  milestones: any[];
  status: string;
}

interface GoalsProgressWidgetProps {
  goals?: Goal[];
  error?: string;
}

export function GoalsProgressWidget({ goals, error }: GoalsProgressWidgetProps) {
  const navigate = useNavigate();

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!goals || goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8">
        <Target className="h-12 w-12 text-gray-300 mb-3" />
        <p className="text-gray-500 text-center">No active goals</p>
        <button
          onClick={() => navigate('/wellness/goals')}
          className="mt-3 text-sm text-primary-600 hover:text-primary-700"
        >
          Set your first goal
        </button>
      </div>
    );
  }

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const overallProgress = activeGoals.reduce((sum, goal) => sum + goal.progress, 0) / 
    (activeGoals.length || 1);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      physical: 'bg-blue-100 text-blue-700',
      mental: 'bg-purple-100 text-purple-700',
      emotional: 'bg-pink-100 text-pink-700',
      social: 'bg-green-100 text-green-700',
      professional: 'bg-orange-100 text-orange-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-3">
      {/* Overall Progress */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-primary-600" />
            <span className="text-sm font-medium text-gray-900">Goals Progress</span>
          </div>
          <span className="text-sm font-bold text-primary-600">
            {Math.round(overallProgress)}%
          </span>
        </div>
        <div className="flex items-center space-x-4 text-xs text-gray-600">
          <span>{activeGoals.length} active</span>
          <span>{completedGoals.length} completed</span>
        </div>
      </div>

      {/* Active Goals */}
      <div className="space-y-2">
        {activeGoals.slice(0, 3).map((goal, index) => (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/wellness/goals/${goal.id}`)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">{goal.title}</h4>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${getCategoryColor(goal.category)}`}>
                    {goal.category}
                  </span>
                  {goal.targetDate && (
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(goal.targetDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
              <Target className="h-4 w-4 text-gray-400" />
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Progress</span>
                <span className="text-xs font-medium text-primary-600">
                  {goal.progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${goal.progress}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                />
              </div>
            </div>

            {/* Milestones */}
            {goal.milestones.length > 0 && (
              <div className="mt-2 flex items-center text-xs text-gray-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                {goal.milestones.filter((m: any) => m.completed).length}/{goal.milestones.length} milestones
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => navigate('/wellness/goals/new')}
          className="bg-gray-50 hover:bg-gray-100 rounded-lg p-2 text-center transition-colors"
        >
          <span className="text-xs text-gray-700">Add Goal</span>
        </button>
        <button
          onClick={() => navigate('/wellness/goals')}
          className="bg-primary-50 hover:bg-primary-100 rounded-lg p-2 text-center transition-colors"
        >
          <span className="text-xs text-primary-700">View All</span>
        </button>
      </div>
    </div>
  );
}