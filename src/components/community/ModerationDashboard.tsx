import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Shield, AlertTriangle, Flag, CheckCircle, XCircle, Clock, TrendingUp, Users, MessageSquare, Activity, Ban, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import { _communityService } from '../../services/community/communityService';
import { _websocketService } from '../../services/realtime/websocketService';
import { useAuth } from '../../hooks/useAuth';

interface ModerationItem {
  id: string;
  _type: 'post' | 'comment' | 'message' | 'user';
  contentId: string;
  content: string;
  reportedBy: string[];
  reportReasons: string[];
  userId: string;
  username: string;
  timestamp: Date;
  status: 'pending' | 'reviewed' | 'resolved';
  _priority: 'low' | 'medium' | 'high' | 'critical';
  crisisDetected: boolean;
  autoFlagged: boolean;
  actionTaken?: {
    action: string;
    moderator: string;
    timestamp: Date;
    notes?: string;
  };
}

interface _ModeratorStats {
  itemsReviewed: number;
  averageResponseTime: number;
  accuracyRate: number;
  activeToday: boolean;
}

function ModerationCard({ item, onAction }: { item: ModerationItem; onAction: (action: string, notes?: string) => void }) {
  const [showDetails, _setShowDetails] = useState(false);
  const [actionNotes, _setActionNotes] = useState('');

  const getPriorityColor = (_priority: string) => {
    switch (_priority) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeIcon = (_type: string) => {
    switch (_type) {
      case 'post': return MessageSquare;
      case 'comment': return MessageSquare;
      case 'user': return Users;
      default: return Flag;
    }
  };

  const TypeIcon = getTypeIcon(item._type);

  return (
    <div className={`bg-white rounded-lg shadow-sm border-2 ${getPriorityColor(item._priority)}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${getPriorityColor(item._priority)}`}>
              <TypeIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900">{item.username}</span>
                {item.crisisDetected && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">Crisis</span>
                )}
                {item.autoFlagged && (
                  <span className="px-2 py-0.5 bg-purple-500 text-white text-xs rounded-full">Auto-flagged</span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(item.timestamp, { addSuffix: true })}
              </p>
            </div>
          </div>
          <button
            onClick={() => _setShowDetails(!showDetails)}
            className="text-gray-400 hover:text-gray-600"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="mb-3">
          <p className="text-sm text-gray-700 line-clamp-2">{item.content}</p>
        </div>

        {/* Report Reasons */}
        <div className="flex flex-wrap gap-2 mb-3">
          {item.reportReasons.map((reason, index) => (
            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              {reason}
            </span>
          ))}
          <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded">
            {item.reportedBy.length} reports
          </span>
        </div>

        {/* Expanded Details */}
        {showDetails && (
          <div className="border-t pt-3 mt-3 space-y-3">
            <div>
              <label htmlFor={`full-content-${item.id}`} className="block text-xs font-medium text-gray-700 mb-1">Full Content</label>
              <div id={`full-content-${item.id}`} className="p-2 bg-gray-50 rounded text-sm text-gray-700">
                {item.content}
              </div>
            </div>
            
            <div>
              <label htmlFor={`mod-notes-${item.id}`} className="block text-xs font-medium text-gray-700 mb-1">Moderation Notes</label>
              <textarea
                id={`mod-notes-${item.id}`}
                value={actionNotes}
                onChange={(e) => _setActionNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add notes about your decision..."
                rows={2}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          {item.crisisDetected ? (
            <button
              onClick={() => onAction('escalate-crisis', actionNotes)}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
            >
              Escalate to Crisis Team
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onAction('approve', actionNotes)}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Approve</span>
              </button>
              <button
                onClick={() => onAction('remove', actionNotes)}
                className="px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-1"
              >
                <XCircle className="h-4 w-4" />
                <span>Remove</span>
              </button>
              <button
                onClick={() => onAction('ban', actionNotes)}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-1"
              >
                <Ban className="h-4 w-4" />
                <span>Ban User</span>
              </button>
            </div>
          )}
          
          <button
            onClick={() => onAction('defer', actionNotes)}
            className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            Defer
          </button>
        </div>
      </div>
    </div>
  );
}

export function ModerationDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFilter, _setSelectedFilter] = useState<'all' | 'crisis' | 'auto-flagged' | 'user-reported'>('all');
  const [selectedPriority, _setSelectedPriority] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [stats, _setStats] = useState({
    pendingItems: 0,
    criticalItems: 0,
    averageWaitTime: 0,
    activeModerators: 0,
  });

  // Mock moderation queue (in production, this would come from the API)
  const moderationQueue: ModerationItem[] = useMemo(() => [
    {
      id: '1',
      _type: 'post',
      contentId: 'post-123',
      content: 'I\'m feeling really overwhelmed and don\'t know if I can continue like this...',
      reportedBy: ['user1', 'user2'],
      reportReasons: ['Concerning content', 'Potential self-harm'],
      userId: 'user-456',
      username: 'AnxiousUser123',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      status: 'pending',
      _priority: 'high',
      crisisDetected: true,
      autoFlagged: true,
    },
    {
      id: '2',
      _type: 'comment',
      contentId: 'comment-789',
      content: 'This advice is completely wrong and could be harmful to people...',
      reportedBy: ['user3'],
      reportReasons: ['Misinformation'],
      userId: 'user-789',
      username: 'ConcernedMember',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      status: 'pending',
      _priority: 'medium',
      crisisDetected: false,
      autoFlagged: false,
    },
  ], []);

  // Set up WebSocket listeners for real-time moderation alerts
  useEffect(() => {
    const handleModerationAlert = (data: unknown) => {
      toast.error(`New ${(data as any)._priority} priority item in moderation queue`, {
        duration: 5000,
        icon: '🚨',
      });
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
    };

    const handleCrisisAlert = (_data: unknown) => {
      toast.error('Crisis content detected - immediate review needed', {
        duration: 10000,
        icon: '🆘',
      });
    };

    _websocketService.on('moderation:alert', handleModerationAlert);
    _websocketService.on('crisis:detected', handleCrisisAlert);

    return () => {
      _websocketService.off('moderation:alert', handleModerationAlert);
      _websocketService.off('crisis:detected', handleCrisisAlert);
    };
  }, [queryClient]);

  // Handle moderation actions
  const handleAction = async (itemId: string, action: string, notes?: string) => {
    try {
      await _communityService.moderateContent(itemId, action as any, notes);
      toast.success(`Action "${action}" completed successfully`);
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
      
      // If crisis escalation, send immediate alert
      if (action === 'escalate-crisis') {
        _websocketService.getSocket()?.emit('crisis:escalate', { itemId, notes });
      }
    } catch (error) {
      // Error is caught but not needed for logging
      toast.error('Failed to complete moderation action');
    }
  };

  // Filter moderation items
  const filteredItems = moderationQueue.filter(item => {
    if (selectedFilter === 'crisis' && !item.crisisDetected) return false;
    if (selectedFilter === 'auto-flagged' && !item.autoFlagged) return false;
    if (selectedFilter === 'user-reported' && item.autoFlagged) return false;
    
    if (selectedPriority !== 'all' && item._priority !== selectedPriority) return false;
    
    return true;
  });

  // Calculate stats
  useEffect(() => {
    const pending = moderationQueue.filter(item => item.status === 'pending').length;
    const critical = moderationQueue.filter(item => item._priority === 'critical').length;
    const _avgWait = moderationQueue.reduce((acc, item) => {
      return acc + (Date.now() - item.timestamp.getTime());
    }, 0) / moderationQueue.length / 1000 / 60; // in minutes

    _setStats({
      pendingItems: pending,
      criticalItems: critical,
      averageWaitTime: Math.round(_avgWait),
      activeModerators: 3, // Mock value
    });
  }, [moderationQueue]);

  // Since this is an anonymous platform, we{'\'}ll check for moderation permissions differently
  // For now, we{'\'}ll allow access to demonstrate the UI, but in production you{'\'}d check against
  // specific user permissions or a moderation flag
  if (!user) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Please refresh the page to access this area.</p>
      </div>
    );
  }
  
  // For demo purposes, show the moderation dashboard
  // In production, you{'\'}d implement proper permission checking

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Moderation Dashboard</h1>
            <p className="text-gray-600 mt-1">Keep our community safe and supportive</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center space-x-1">
              <Activity className="h-3 w-3" />
              <span>Active</span>
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingItems}</p>
              </div>
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">Critical Items</p>
                <p className="text-2xl font-bold text-red-900">{stats.criticalItems}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Avg Wait Time</p>
                <p className="text-2xl font-bold text-blue-900">{stats.averageWaitTime}m</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Active Mods</p>
                <p className="text-2xl font-bold text-green-900">{stats.activeModerators}</p>
              </div>
              <Users className="h-8 w-8 text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="moderation-filter" className="text-sm font-medium text-gray-700">Filter:</label>
            <select
              id="moderation-filter"
              value={selectedFilter}
              onChange={(e) => _setSelectedFilter(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Items</option>
              <option value="crisis">Crisis Content</option>
              <option value="auto-flagged">Auto-flagged</option>
              <option value="user-reported">User Reported</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label htmlFor="moderation-priority" className="text-sm font-medium text-gray-700">Priority:</label>
            <select
              id="moderation-priority"
              value={selectedPriority}
              onChange={(e) => _setSelectedPriority(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Moderation Queue */}
      <div className="space-y-4">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <ModerationCard
              key={item.id}
              item={item}
              onAction={(action, notes) => handleAction(item.id, action, notes)}
            />
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">No items in the moderation queue</p>
            <p className="text-sm text-gray-500 mt-2">Great job keeping the community safe!</p>
          </div>
        )}
      </div>

      {/* Quick Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Moderation Guidelines</h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Always prioritize user safety, especially in crisis situations</li>
          <li>• Document your decisions with clear notes for transparency</li>
          <li>• Escalate crisis content immediately to trained professionals</li>
          <li>• Be empathetic but firm when enforcing community guidelines</li>
          <li>• When in doubt, consult with senior moderators</li>
        </ul>
      </div>
    </div>
  );
}