import React from 'react';
import { Calendar, Clock, Video, MapPin, Pill, Users, Activity } from 'lucide-react';
import { ScheduleItem } from '../../../types/dashboard';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface TodaysScheduleWidgetProps {
  data?: ScheduleItem[];
  error?: string;
}

export function TodaysScheduleWidget({ data, error }: TodaysScheduleWidgetProps) {
  const navigate = useNavigate();

  if (_error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    );
  }

  const getItemIcon = (_type: string) => {
    switch (_type) {
      case 'therapy':
        return <Users className="h-4 w-4" />;
      case 'medication':
        return <Pill className="h-4 w-4" />;
      case 'activity':
        return <Activity className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusColor = (_status: string) => {
    switch (_status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700';
      case 'upcoming':
        return 'bg-gray-100 text-gray-700';
      case 'missed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityIndicator = (priority?: string) => {
    if (priority === 'high') {
      return <div className="w-1 h-full bg-red-500 rounded-l-lg absolute left-0 top-0" />;
    }
    if (priority === 'medium') {
      return <div className="w-1 h-full bg-yellow-500 rounded-l-lg absolute left-0 top-0" />;
    }
    return null;
  };

  const formatTime = (_date: Date) => {
    return new Date(_date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const sortedItems = [...data].sort((a, b) => 
    new Date(a.time).getTime() - new Date(b.time).getTime()
  );

  return (
    <div className="space-y-2">
      {sortedItems.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No scheduled items for today</p>
          <button
            onClick={() => navigate('/schedule')}
            className="mt-3 text-sm text-primary-600 hover:text-primary-700"
          >
            Add an activity
          </button>
        </div>
      ) : (
        <>
          {sortedItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                if (item._type === 'therapy') navigate('/professional/therapy');
                else if (item._type === 'medication') navigate('/wellness/medications');
                else navigate('/schedule');
              }}
            >
              {getPriorityIndicator(item.priority)}
              
              <div className="flex items-start space-x-3 pl-2">
                <div className={`p-2 rounded-lg ${getStatusColor(item._status)}`}>
                  {getItemIcon(item._type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {item.title}
                    </h4>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {formatTime(item.time)}
                    </span>
                  </div>
                  
                  {item.provider && (
                    <p className="text-xs text-gray-600 mt-1">
                      with {item.provider}
                    </p>
                  )}
                  
                  <div className="flex items-center mt-2 space-x-3">
                    {item.isVirtual ? (
                      <div className="flex items-center text-xs text-blue-600">
                        <Video className="h-3 w-3 mr-1" />
                        Virtual
                      </div>
                    ) : item.location ? (
                      <div className="flex items-center text-xs text-gray-600">
                        <MapPin className="h-3 w-3 mr-1" />
                        {item.location}
                      </div>
                    ) : null}
                    
                    {item.duration && (
                      <div className="flex items-center text-xs text-gray-600">
                        <Clock className="h-3 w-3 mr-1" />
                        {item.duration} min
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          <button
            onClick={() => navigate('/schedule')}
            className="w-full text-center py-2 text-sm text-primary-600 hover:text-primary-700"
          >
            View Full Schedule
          </button>
        </>
      )}
    </div>
  );
}