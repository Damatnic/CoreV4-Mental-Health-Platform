import { Clock, Video, MapPin, Pill, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { ScheduleItem } from '../../../types/dashboard';

interface TodayScheduleProps {
  scheduleItems?: ScheduleItem[];
  onItemClick?: (item: ScheduleItem) => void;
  onReschedule?: (item: ScheduleItem) => void;
  onMarkComplete?: (item: ScheduleItem) => void;
}

export function TodaySchedule({ 
  scheduleItems = [], 
  onItemClick, 
  onReschedule,
  onMarkComplete 
}: TodayScheduleProps) {
  
  // Group items by time period
  const groupItemsByPeriod = () => {
    const now = new Date();
    const groups: Record<string, ScheduleItem[]> = {
      overdue: [],
      current: [],
      upcoming: [],
      later: [],
    };

    scheduleItems.forEach(item => {
      const itemTime = new Date(item.time);
      const diffMinutes = (itemTime.getTime() - now.getTime()) / (1000 * 60);
      
      if (item.status === 'completed') {
        // Skip completed items or show them separately
      } else if (item.status === 'missed' || diffMinutes < -30) {
        groups.overdue!.push(item);
      } else if (diffMinutes >= -30 && diffMinutes <= 30) {
        groups.current!.push(item);
      } else if (diffMinutes > 30 && diffMinutes <= 180) {
        groups.upcoming!.push(item);
      } else {
        groups.later!.push(item);
      }
    });

    return groups;
  };

  const groups = groupItemsByPeriod();

  // Get icon for schedule item type
  const getItemIcon = (_type: ScheduleItem['type']) => {
    switch (_type) {
      case 'therapy':
        return Video;
      case 'medication':
        return Pill;
      case 'appointment':
        return Calendar;
      default:
        return Clock;
    }
  };

  // Get status color
  const getStatusColor = (_status: ScheduleItem['status'], priority: ScheduleItem['priority']) => {
    if (_status === 'missed') return 'border-red-500 bg-red-50';
    if (_status === 'ongoing') return 'border-green-500 bg-green-50 animate-pulse';
    if (_status === 'completed') return 'border-gray-300 bg-gray-50';
    if (priority === 'high') return 'border-orange-500 bg-orange-50';
    return 'border-gray-300 bg-white';
  };

  // Get status icon
  const StatusIcon = ({ status }: { status: ScheduleItem['status'] }) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'missed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-400" />;
      case 'ongoing':
        return <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />;
      default:
        return null;
    }
  };

  // Format time display
  const formatTime = (_date: Date) => {
    return new Date(_date).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Calculate time until
  const getTimeUntil = (_date: Date) => {
    const now = new Date();
    const itemTime = new Date(_date);
    const diffMinutes = Math.floor((itemTime.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffMinutes < 0) return 'Overdue';
    if (diffMinutes === 0) return 'Now';
    if (diffMinutes < 60) return `In ${diffMinutes} min`;
    if (diffMinutes < 120) return 'In 1 hour';
    return `In ${Math.floor(diffMinutes / 60)} hours`;
  };

  // Empty state
  if (scheduleItems.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No scheduled items for today</p>
        <p className="text-sm text-gray-400 mt-1">Your schedule will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overdue Items */}
      {groups.overdue!.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <h4 className="text-sm font-semibold text-red-700">Overdue</h4>
          </div>
          <div className="space-y-2">
            {groups.overdue!.map((item) => (
              <ScheduleItemCard
                key={item.id}
                item={item}
                onClick={onItemClick}
                onReschedule={onReschedule}
                onMarkComplete={onMarkComplete}
                getItemIcon={getItemIcon}
                formatTime={formatTime}
                getStatusColor={getStatusColor}
                StatusIcon={StatusIcon}
              />
            ))}
          </div>
        </div>
      )}

      {/* Current/Ongoing Items */}
      {groups.current!.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-green-700">Happening Now</h4>
          <div className="space-y-2">
            {groups.current!.map((item) => (
              <ScheduleItemCard
                key={item.id}
                item={item}
                onClick={onItemClick}
                onReschedule={onReschedule}
                onMarkComplete={onMarkComplete}
                getItemIcon={getItemIcon}
                formatTime={formatTime}
                getStatusColor={getStatusColor}
                StatusIcon={StatusIcon}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Items */}
      {groups.upcoming!.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">Coming Up</h4>
          <div className="space-y-2">
            {groups.upcoming!.map((item) => (
              <ScheduleItemCard
                key={item.id}
                item={item}
                onClick={onItemClick}
                onReschedule={onReschedule}
                onMarkComplete={onMarkComplete}
                getItemIcon={getItemIcon}
                formatTime={formatTime}
                getStatusColor={getStatusColor}
                StatusIcon={StatusIcon}
                showTimeUntil
                getTimeUntil={getTimeUntil}
              />
            ))}
          </div>
        </div>
      )}

      {/* Later Today */}
      {groups.later!.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-500">Later Today</h4>
          <div className="space-y-2">
            {groups.later!.slice(0, 3).map((item) => (
              <ScheduleItemCard
                key={item.id}
                item={item}
                onClick={onItemClick}
                onReschedule={onReschedule}
                onMarkComplete={onMarkComplete}
                getItemIcon={getItemIcon}
                formatTime={formatTime}
                getStatusColor={getStatusColor}
                StatusIcon={StatusIcon}
                compact
              />
            ))}
          </div>
          {groups.later!.length > 3 && (
            <button className="text-sm text-primary-600 hover:text-primary-700">
              View {groups.later!.length - 3} more items
            </button>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{scheduleItems.length}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {scheduleItems.filter(i => i.status === 'completed').length}
            </p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">
              {scheduleItems.filter(i => i.status === 'upcoming').length}
            </p>
            <p className="text-xs text-gray-500">Remaining</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Individual Schedule Item Card Component
interface ScheduleItemCardProps {
  item: ScheduleItem;
  onClick?: (item: ScheduleItem) => void;
  onReschedule?: (item: ScheduleItem) => void;
  onMarkComplete?: (item: ScheduleItem) => void;
  getItemIcon: (_type: ScheduleItem['type']) => any;
  formatTime: (_date: Date) => string;
  getStatusColor: (_status: ScheduleItem['status'], priority: ScheduleItem['priority']) => string;
  StatusIcon: ({ status }: { status: ScheduleItem['status'] }) => JSX.Element | null;
  compact?: boolean;
  showTimeUntil?: boolean;
  getTimeUntil?: (_date: Date) => string;
}

function ScheduleItemCard({
  item,
  onClick,
  onReschedule,
  onMarkComplete,
  getItemIcon,
  formatTime,
  getStatusColor,
  StatusIcon,
  compact = false,
  showTimeUntil = false,
  getTimeUntil,
}: ScheduleItemCardProps) {
  const Icon = getItemIcon(item.type);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        p-3 rounded-lg border-l-4 cursor-pointer transition-all
        ${getStatusColor(item.status, item.priority)}
        ${compact ? 'py-2' : ''}
      `}
      onClick={() => onClick?.(item)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <Icon className={`h-5 w-5 mt-0.5 ${compact ? 'h-4 w-4' : ''} text-gray-600`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className={`font-medium text-gray-900 ${compact ? 'text-sm' : ''}`}>
                {item.title}
              </p>
              <StatusIcon status={item.status} />
            </div>
            {!compact && (
              <>
                <p className="text-sm text-gray-600 mt-0.5">
                  {formatTime(item.time)}
                  {item.duration && ` • ${item.duration} min`}
                  {showTimeUntil && getTimeUntil && (
                    <span className="text-primary-600 font-medium ml-2">
                      {getTimeUntil(item.time)}
                    </span>
                  )}
                </p>
                {item.location && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    {item.isVirtual ? (
                      <Video className="h-3 w-3 mr-1" />
                    ) : (
                      <MapPin className="h-3 w-3 mr-1" />
                    )}
                    {item.location}
                  </p>
                )}
                {item.provider && (
                  <p className="text-xs text-gray-500">
                    With {item.provider}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
        
        {!compact && item.status === 'upcoming' && (
          <div className="flex flex-col space-y-1 ml-2">
            {onMarkComplete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkComplete(item);
                }}
                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                Complete
              </button>
            )}
            {onReschedule && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReschedule(item);
                }}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Reschedule
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}