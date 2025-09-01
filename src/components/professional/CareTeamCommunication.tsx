import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Send, Users, Clock, Phone, Video,
  FileText, Paperclip, Image, AlertTriangle, CheckCircle,
  Plus, Search, Filter, Bell, BellOff, Settings,
  UserPlus, UserMinus, MoreHorizontal, Star, Flag,
  Calendar, MapPin, Stethoscope, Briefcase, Heart,
  Shield, Zap, Upload, Download, Eye, EyeOff,
  Edit2, Trash2, Copy, Share, Archive, RefreshCw
} from 'lucide-react';

interface CareTeamMember {
  id: string;
  name: string;
  role: 'primary_therapist' | 'psychiatrist' | 'case_manager' | 'nurse' | 'social_worker' | 'peer_support' | 'family_member' | 'medical_provider' | 'other';
  credentials?: string;
  specialty?: string;
  organization?: string;
  email: string;
  phone?: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'on_leave';
  permissions: Permission[];
  lastActive?: Date;
  timezone?: string;
  preferredContact: 'email' | 'phone' | 'secure_message';
}

interface Permission {
  area: 'treatment_plan' | 'session_notes' | 'medications' | 'crisis_plan' | 'assessments' | 'scheduling' | 'billing';
  level: 'view' | 'edit' | 'full';
}

interface Message {
  id: string;
  threadId: string;
  senderId: string;
  recipientIds: string[];
  content: string;
  timestamp: Date;
  type: 'text' | 'file' | 'image' | 'voice' | 'video_call' | 'phone_call' | 'system';
  attachments?: Attachment[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'sent' | 'delivered' | 'read';
  readBy: { userId: string; timestamp: Date }[];
  tags?: string[];
  relatedTo?: {
    type: 'patient' | 'session' | 'treatment_plan' | 'assessment';
    id: string;
    name: string;
  };
  isEncrypted: boolean;
  editedAt?: Date;
  deletedAt?: Date;
}

interface Attachment {
  id: string;
  name: string;
  type: 'document' | 'image' | 'audio' | 'video';
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  isSecure: boolean;
}

interface Thread {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'team' | 'emergency';
  participantIds: string[];
  createdBy: string;
  createdAt: Date;
  lastActivity: Date;
  lastMessage?: Message;
  isArchived: boolean;
  isMuted: boolean;
  tags?: string[];
  relatedPatientId?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  unreadCount: number;
}

interface Notification {
  id: string;
  type: 'message' | 'mention' | 'file_shared' | 'emergency' | 'system';
  title: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  senderId?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

interface CareTeamCommunicationProps {
  currentUserId: string;
  patientId?: string;
  careTeam: CareTeamMember[];
  threads?: Thread[];
  onSendMessage?: (threadId: string, message: Partial<Message>) => void;
  onCreateThread?: (thread: Partial<Thread>) => void;
  onAddMember?: (member: CareTeamMember) => void;
  onRemoveMember?: (memberId: string) => void;
  onUpdatePermissions?: (memberId: string, permissions: Permission[]) => void;
  isProvider?: boolean;
}

export function CareTeamCommunication({
  currentUserId,
  patientId,
  careTeam,
  threads = [],
  onSendMessage,
  onCreateThread,
  onAddMember,
  onRemoveMember,
  onUpdatePermissions,
  isProvider = false
}: CareTeamCommunicationProps) {
  const [activeTab, setActiveTab] = useState<'messages' | 'team' | 'notifications'>('messages');
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showNewThread, setShowNewThread] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'normal' | 'high' | 'urgent'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedThread?.id]);

  // Get current user
  const currentUser = careTeam.find(member => member.id === currentUserId);

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'primary_therapist': return 'text-blue-700 bg-blue-100';
      case 'psychiatrist': return 'text-purple-700 bg-purple-100';
      case 'case_manager': return 'text-green-700 bg-green-100';
      case 'nurse': return 'text-pink-700 bg-pink-100';
      case 'social_worker': return 'text-indigo-700 bg-indigo-100';
      case 'peer_support': return 'text-yellow-700 bg-yellow-100';
      case 'family_member': return 'text-orange-700 bg-orange-100';
      case 'medical_provider': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'normal': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'low': return 'text-gray-600 bg-gray-100 border-gray-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  // Handle send message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedThread) return;

    const message: Partial<Message> = {
      content: newMessage.trim(),
      type: 'text',
      priority: 'normal',
      recipientIds: selectedThread.participantIds.filter(id => id !== currentUserId),
      relatedTo: patientId ? {
        type: 'patient',
        id: patientId,
        name: 'Current Patient'
      } : undefined
    };

    onSendMessage?.(selectedThread.id, message);
    setNewMessage('');
  };

  // Filter threads
  const filteredThreads = threads.filter(thread => {
    const matchesSearch = thread.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thread.lastMessage?.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || thread.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  // Get thread participants
  const getThreadParticipants = (thread: Thread) => {
    return careTeam.filter(member => thread.participantIds.includes(member.id));
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  return (
    <div className="h-full flex bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Care Team</h2>
            <div className="flex space-x-1">
              <button
                onClick={() => setShowNewThread(true)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="New message"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowMemberForm(true)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Add team member"
              >
                <UserPlus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1">
            {[
              { id: 'messages', label: 'Messages', icon: MessageSquare },
              { id: 'team', label: 'Team', icon: Users },
              { id: 'notifications', label: 'Alerts', icon: Bell }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center space-x-1 ${
                  activeTab === id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
                {id === 'notifications' && notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'messages' && (
            <div className="p-4 space-y-2">
              {/* Search and Filter */}
              <div className="space-y-2 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search messages..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Threads List */}
              <div className="space-y-1">
                {filteredThreads.map((thread) => {
                  const participants = getThreadParticipants(thread);
                  return (
                    <motion.div
                      key={thread.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-100 ${
                        selectedThread?.id === thread.id ? 'bg-primary-100 border border-primary-200' : ''
                      }`}
                      onClick={() => setSelectedThread(thread)}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900 text-sm">{thread.name}</h4>
                          {thread.priority !== 'normal' && (
                            <span className={`px-1.5 py-0.5 text-xs rounded-full ${getPriorityColor(thread.priority)}`}>
                              {thread.priority}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(thread.lastActivity)}
                        </span>
                      </div>
                      
                      {thread.lastMessage && (
                        <p className="text-sm text-gray-600 truncate">
                          {thread.lastMessage.content}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex -space-x-2">
                          {participants.slice(0, 3).map((participant) => (
                            <div
                              key={participant.id}
                              className="h-6 w-6 bg-primary-200 rounded-full flex items-center justify-center border-2 border-white"
                              title={participant.name}
                            >
                              {participant.avatar ? (
                                <img 
                                  src={participant.avatar} 
                                  alt={participant.name}
                                  className="h-6 w-6 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-xs text-primary-700 font-medium">
                                  {participant.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              )}
                            </div>
                          ))}
                          {participants.length > 3 && (
                            <div className="h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center border-2 border-white">
                              <span className="text-xs text-gray-600 font-medium">
                                +{participants.length - 3}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {thread.unreadCount > 0 && (
                          <span className="px-2 py-1 bg-primary-500 text-white text-xs rounded-full">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="p-4 space-y-3">
              {careTeam
                .filter(member => 
                  member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  member.role.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((member) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-white border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-primary-200 rounded-full flex items-center justify-center">
                          {member.avatar ? (
                            <img 
                              src={member.avatar} 
                              alt={member.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-primary-700 font-semibold">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{member.name}</h4>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(member.role)}`}>
                              {member.role.replace('_', ' ')}
                            </span>
                            {member.credentials && (
                              <span className="text-xs text-gray-600">{member.credentials}</span>
                            )}
                          </div>
                          {member.organization && (
                            <p className="text-xs text-gray-500 mt-1">{member.organization}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <div className={`h-2 w-2 rounded-full ${
                          member.status === 'active' ? 'bg-green-400' :
                          member.status === 'on_leave' ? 'bg-yellow-400' :
                          'bg-gray-400'
                        }`} />
                        {isProvider && (
                          <button
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Settings"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 mt-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-3 w-3 mr-1" />
                        <span>{member.phone || 'N/A'}</span>
                      </div>
                      {member.lastActive && (
                        <span className="text-gray-500">
                          Active {formatTimestamp(member.lastActive)}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="p-4 space-y-2">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded-lg border ${
                      notification.isRead ? 'bg-gray-50 border-gray-200' : 'bg-primary-50 border-primary-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-gray-900 text-sm">{notification.title}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{notification.content}</p>
                    {!notification.isRead && (
                      <div className="h-2 w-2 bg-primary-500 rounded-full absolute top-3 right-3" />
                    )}
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedThread ? (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex -space-x-2">
                    {getThreadParticipants(selectedThread).slice(0, 3).map((participant) => (
                      <div
                        key={participant.id}
                        className="h-8 w-8 bg-primary-200 rounded-full flex items-center justify-center border-2 border-white"
                      >
                        {participant.avatar ? (
                          <img 
                            src={participant.avatar} 
                            alt={participant.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-primary-700 font-medium">
                            {participant.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{selectedThread.name}</h3>
                    <p className="text-sm text-gray-600">
                      {getThreadParticipants(selectedThread).map(p => p.name).join(', ')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Phone className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Video className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {selectedThread.relatedPatientId && (
                <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
                  <Heart className="h-4 w-4" />
                  <span>Related to patient care</span>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Mock messages for demonstration */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="h-8 w-8 bg-blue-200 rounded-full flex items-center justify-center">
                    <span className="text-xs text-blue-700 font-medium">DR</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm">Dr. Robinson</span>
                      <span className="text-xs text-gray-500">2:30 PM</span>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-800">
                      Patient showed significant improvement in anxiety levels during yesterday's session. 
                      Considering adjusting medication dosage. Thoughts?
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 justify-end">
                  <div className="flex-1 text-right">
                    <div className="flex items-center justify-end space-x-2 mb-1">
                      <span className="text-xs text-gray-500">2:35 PM</span>
                      <span className="font-medium text-gray-900 text-sm">You</span>
                    </div>
                    <div className="bg-primary-500 text-white rounded-lg p-3 text-sm inline-block">
                      Agreed. The CBT techniques seem to be working well. Let's schedule a review 
                      meeting to discuss medication adjustments.
                    </div>
                  </div>
                  <div className="h-8 w-8 bg-primary-200 rounded-full flex items-center justify-center">
                    <span className="text-xs text-primary-700 font-medium">
                      {currentUser?.name.split(' ').map(n => n[0]).join('') || 'ME'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <div className="border border-gray-300 rounded-lg">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="w-full p-3 border-none rounded-lg resize-none focus:ring-0"
                      rows={3}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <div className="flex items-center justify-between p-2 border-t border-gray-200">
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <Paperclip className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <Image className="h-4 w-4" />
                        </button>
                        <select className="text-sm border-none text-gray-600 focus:ring-0">
                          <option value="normal">Normal</option>
                          <option value="high">High Priority</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      >
                        <Send className="h-4 w-4" />
                        <span>Send</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No conversation selected</h3>
              <p className="text-gray-500">Choose a thread from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* New Thread Modal */}
      <AnimatePresence>
        {showNewThread && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewThread(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold mb-4">New Conversation</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thread Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter thread name..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Participants
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {careTeam.filter(m => m.id !== currentUserId).map((member) => (
                      <label key={member.id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="ml-3 flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{member.name}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(member.role)}`}>
                            {member.role.replace('_', ' ')}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-2 mt-6">
                <button
                  onClick={() => setShowNewThread(false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowNewThread(false)}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Create Thread
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showMemberForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowMemberForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold mb-4">Add Team Member</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                    <option value="primary_therapist">Primary Therapist</option>
                    <option value="psychiatrist">Psychiatrist</option>
                    <option value="case_manager">Case Manager</option>
                    <option value="nurse">Nurse</option>
                    <option value="social_worker">Social Worker</option>
                    <option value="peer_support">Peer Support</option>
                    <option value="family_member">Family Member</option>
                    <option value="medical_provider">Medical Provider</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permissions
                  </label>
                  <div className="space-y-2">
                    {[
                      'Treatment Plan',
                      'Session Notes', 
                      'Medications',
                      'Crisis Plan',
                      'Assessments',
                      'Scheduling'
                    ].map((permission) => (
                      <div key={permission} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                        <span className="text-sm">{permission}</span>
                        <select className="text-sm border-none focus:ring-0">
                          <option value="none">No Access</option>
                          <option value="view">View Only</option>
                          <option value="edit">Edit</option>
                          <option value="full">Full Access</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2 mt-6">
                <button
                  onClick={() => setShowMemberForm(false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowMemberForm(false)}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Add Member
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}