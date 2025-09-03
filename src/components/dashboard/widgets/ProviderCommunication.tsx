import { useState } from 'react';
import { motion, _AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Phone, Video, _Mail, Send, Paperclip, 
  Calendar, Clock, Shield, Lock, CheckCircle, AlertCircle,
  User, _Users, FileText, Download, Upload, Info, _Bell,
  _ChevronRight, Search, _Filter, Archive, _Star, _Reply
} from 'lucide-react';

interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  recipientName: string;
  subject?: string;
  content: string;
  timestamp: Date;
  read: boolean;
  urgent: boolean;
  encrypted: boolean;
  attachments?: Attachment[];
  relatedTo?: 'appointment' | 'prescription' | 'lab_results' | 'treatment_plan' | 'general';
  status: 'sent' | 'delivered' | 'read' | 'replied';
  parentMessageId?: string;
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
  isSecure: boolean;
}

interface CommunicationThread {
  id: string;
  participants: string[];
  subject: string;
  lastMessage: Message;
  unreadCount: number;
  isUrgent: boolean;
  _category: 'clinical' | 'administrative' | 'prescription' | 'appointment' | 'results';
  startedAt: Date;
  lastActivity: Date;
  archived: boolean;
}

interface AppointmentRequest {
  id: string;
  providerId: string;
  providerName: string;
  requestedDates: Date[];
  preferredTime: 'morning' | 'afternoon' | 'evening';
  type: 'initial' | 'follow_up' | 'urgent' | 'routine';
  reason: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'rescheduling';
  notes?: string;
  insuranceVerified: boolean;
}

interface Document {
  id: string;
  name: string;
  type: 'assessment' | 'treatment_plan' | 'progress_note' | 'lab_result' | 'prescription' | 'insurance' | 'consent';
  uploadedBy: string;
  uploadedAt: Date;
  size: number;
  status: 'pending_review' | 'reviewed' | 'requires_signature' | 'completed';
  sharedWith: string[];
  requiresAction: boolean;
  expiresAt?: Date;
}

interface ProviderCommunicationProps {
  threads?: CommunicationThread[];
  messages?: Message[];
  appointmentRequests?: AppointmentRequest[];
  documents?: Document[];
  currentUserId?: string;
  _onSendMessage?: (recipientId: string, message: string, attachments?: File[]) => void;
  _onScheduleAppointment?: (request: AppointmentRequest) => void;
  _onUploadDocument?: (document: File, type: string) => void;
  onDownloadDocument?: (documentId: string) => void;
  _onMarkAsRead?: (messageId: string) => void;
  onArchiveThread?: (threadId: string) => void;
}

export function ProviderCommunication({
  threads = [],
  messages = [],
  appointmentRequests = [],
  documents = [],
  currentUserId = 'user123',
  _onSendMessage,
  _onScheduleAppointment,
  _onUploadDocument,
  onDownloadDocument,
  _onMarkAsRead,
  onArchiveThread
}: ProviderCommunicationProps) {
  const [activeTab, _setActiveTab] = useState<'messages' | 'appointments' | 'documents' | 'secure'>('messages');
  const [selectedThread, _setSelectedThread] = useState<CommunicationThread | null>(null);
  const [__composeMode, _setComposeMode] = useState(false);
  const [messageContent, _setMessageContent] = useState('');
  const [searchQuery, _setSearchQuery] = useState('');
  const [filterCategory, _setFilterCategory] = useState<string>('all');
  const [__showUploadModal, _setShowUploadModal] = useState(false);

  // Get unread message count
  const unreadCount = threads.reduce((sum, thread) => sum + thread.unreadCount, 0);

  // Get pending appointment requests
  const pendingAppointments = appointmentRequests.filter(req => req.status === 'pending');

  // Get documents requiring action
  const actionRequiredDocs = documents.filter(doc => doc.requiresAction);

  // _Filter threads based on search and _category
  const filteredThreads = threads.filter(thread => {
    const matchesSearch = thread.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         thread.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || thread._category === filterCategory;
    return matchesSearch && matchesCategory && !thread.archived;
  });

  // Get thread messages
  const getThreadMessages = (threadId: string) => {
    return messages.filter(msg => msg.threadId === threadId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  // Format timestamp
  const formatTimestamp = (_date: Date) => {
    const now = new Date();
    const msgDate = new Date(_date);
    const diffMs = now.getTime() - msgDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return msgDate.toLocaleDateString();
  };

  // Get category color
  const getCategoryColor = (_category: string) => {
    switch (_category) {
      case 'clinical': return 'bg-blue-100 text-blue-700';
      case 'administrative': return 'bg-gray-100 text-gray-700';
      case 'prescription': return 'bg-purple-100 text-purple-700';
      case 'appointment': return 'bg-green-100 text-green-700';
      case 'results': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600">Unread Messages</p>
              <p className="text-xl font-bold text-blue-700">{unreadCount}</p>
            </div>
            <MessageSquare className="h-5 w-5 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600">Pending Appointments</p>
              <p className="text-xl font-bold text-green-700">{pendingAppointments.length}</p>
            </div>
            <Calendar className="h-5 w-5 text-green-500" />
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-600">Action Required</p>
              <p className="text-xl font-bold text-orange-700">{actionRequiredDocs.length}</p>
            </div>
            <AlertCircle className="h-5 w-5 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-4 border-b border-gray-200">
        {(['messages', 'appointments', 'documents', 'secure'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(_tab)}
            className={`px-4 py-2 text-sm font-medium transition-all capitalize ${
              activeTab === tab
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'secure' ? 'Secure Portal' : tab}
            {tab === 'messages' && unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                {unreadCount}
              </span>
            )}
            {tab === 'appointments' && pendingAppointments.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-600 rounded-full">
                {pendingAppointments.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'messages' && (
          <div className="h-full flex">
            {/* Thread List */}
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
              {/* Search and _Filter */}
              <div className="p-3 border-b border-gray-200">
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Categories</option>
                  <option value="clinical">Clinical</option>
                  <option value="administrative">Administrative</option>
                  <option value="prescription">Prescriptions</option>
                  <option value="appointment">Appointments</option>
                  <option value="results">Results</option>
                </select>
              </div>

              {/* Compose Button */}
              <div className="p-3 border-b border-gray-200">
                <button
                  onClick={() => setComposeMode(true)}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
                >
                  <Send className="h-4 w-4 mr-2" />
                  New Message
                </button>
              </div>

              {/* Thread List */}
              <div className="divide-y divide-gray-200">
                {filteredThreads.map((thread) => (
                  <motion.div
                    key={thread.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedThread?.id === thread.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedThread(thread)}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900">
                            {thread.lastMessage.senderName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {thread.lastMessage.senderRole}
                          </p>
                        </div>
                      </div>
                      {thread.unreadCount > 0 && (
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {thread.subject}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {thread.lastMessage.content}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(thread._category)}`}>
                        {thread._category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(thread.lastActivity)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Message View */}
            <div className="flex-1 flex flex-col">
              {selectedThread ? (
                <>
                  {/* Thread Header */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{selectedThread.subject}</h3>
                        <p className="text-sm text-gray-600">
                          {selectedThread.participants.length} participants
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <Phone className="h-5 w-5" />
                        </button>
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <Video className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => onArchiveThread?.(selectedThread.id)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Archive className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {getThreadMessages(selectedThread.id).map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-lg ${
                          message.senderId === currentUserId 
                            ? 'bg-primary-600 text-white' 
                            : 'bg-gray-100 text-gray-900'
                        } rounded-lg p-3`}>
                          <div className="flex items-center justify-between mb-1">
                            <p className={`text-sm font-medium ${
                              message.senderId === currentUserId ? 'text-primary-100' : 'text-gray-700'
                            }`}>
                              {message.senderName}
                            </p>
                            {message.encrypted && (
                              <Lock className="h-3 w-3" />
                            )}
                          </div>
                          <p className="text-sm">{message.content}</p>
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.attachments.map((attachment) => (
                                <div key={attachment.id} className={`flex items-center space-x-2 p-2 rounded ${
                                  message.senderId === currentUserId ? 'bg-primary-700' : 'bg-gray-200'
                                }`}>
                                  <Paperclip className="h-4 w-4" />
                                  <span className="text-xs">{attachment.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <p className={`text-xs mt-1 ${
                            message.senderId === currentUserId ? 'text-primary-200' : 'text-gray-500'
                          }`}>
                            {formatTimestamp(message.timestamp)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex items-end space-x-2">
                      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Paperclip className="h-5 w-5" />
                      </button>
                      <textarea
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                        rows={2}
                      />
                      <button
                        onClick={() => {
                          if (messageContent.trim()) {
                            // Send message logic
                            setMessageContent('');
                          }
                        }}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Select a conversation to view messages</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="space-y-4">
            {/* Request New Appointment */}
            <button className="w-full p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center">
              <Calendar className="h-4 w-4 mr-2" />
              Request New Appointment
            </button>

            {/* Appointment Requests */}
            <div className="space-y-3">
              {appointmentRequests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-white border border-gray-200 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{request.providerName}</h4>
                      <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      request.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      request.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {request.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      Requested: {request.requestedDates.map(_date => 
                        new Date(_date).toLocaleDateString()
                      ).join(', ')}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      Preferred: {request.preferredTime}
                    </div>
                    {request.insuranceVerified && (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Insurance verified
                      </div>
                    )}
                  </div>

                  {request.status === 'pending' && (
                    <div className="flex space-x-2 mt-3">
                      <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                        Reschedule
                      </button>
                      <button className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm">
                        Cancel
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-4">
            {/* Upload Document */}
            <button
              onClick={() => setShowUploadModal(true)}
              className="w-full p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </button>

            {/* Document List */}
            <div className="space-y-3">
              {documents.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <FileText className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <h4 className="font-medium text-gray-900">{doc.name}</h4>
                        <div className="flex items-center space-x-3 mt-1 text-xs text-gray-600">
                          <span>{doc.type.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{(doc.size / 1024).toFixed(1)} KB</span>
                          <span>•</span>
                          <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                        </div>
                        {doc.requiresAction && (
                          <div className="flex items-center mt-2 text-orange-600">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            <span className="text-sm">Action required</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        doc.status === 'completed' ? 'bg-green-100 text-green-700' :
                        doc.status === 'reviewed' ? 'bg-blue-100 text-blue-700' :
                        doc.status === 'requires_signature' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {doc.status.replace('_', ' ')}
                      </span>
                      <button
                        onClick={() => onDownloadDocument?.(doc.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'secure' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="mb-4 p-4 bg-green-100 rounded-full inline-block">
                <Shield className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Communication Portal</h3>
              <p className="text-gray-600 mb-4">
                All communications with your healthcare providers are encrypted end-to-end and HIPAA compliant.
              </p>
              <div className="space-y-2 text-sm text-left bg-gray-50 rounded-lg p-4">
                <div className="flex items-center text-gray-700">
                  <Lock className="h-4 w-4 mr-2 text-green-600" />
                  End-to-end encryption
                </div>
                <div className="flex items-center text-gray-700">
                  <Shield className="h-4 w-4 mr-2 text-green-600" />
                  HIPAA compliant
                </div>
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Audit logging enabled
                </div>
                <div className="flex items-center text-gray-700">
                  <Info className="h-4 w-4 mr-2 text-green-600" />
                  Data retention policies enforced
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}