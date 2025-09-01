import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, Video, MapPin, FileText, CheckCircle, 
  AlertCircle, ChevronRight, Edit2, Phone, MessageSquare,
  Target, Brain, Heart, Clipboard, TrendingUp, Star
} from 'lucide-react';

interface TherapySession {
  id: string;
  providerId: string;
  providerName: string;
  providerSpecialty: string;
  providerImage?: string;
  dateTime: Date;
  duration: number; // minutes
  type: 'individual' | 'group' | 'family' | 'couples';
  format: 'in-person' | 'telehealth' | 'phone';
  location?: string;
  meetingUrl?: string;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'rescheduled';
  preparationNotes?: string[];
  sessionGoals?: SessionGoal[];
  homework?: TherapyHomework[];
  postSessionNotes?: string;
  outcome?: SessionOutcome;
  nextSession?: Date;
  insuranceCovered: boolean;
  copay?: number;
}

interface SessionGoal {
  id: string;
  goal: string;
  priority: 'high' | 'medium' | 'low';
  discussed: boolean;
  progress?: number; // 0-100
}

interface TherapyHomework {
  id: string;
  title: string;
  description: string;
  type: 'worksheet' | 'practice' | 'reading' | 'journaling' | 'behavior';
  dueDate?: Date;
  completed: boolean;
  completedDate?: Date;
  notes?: string;
}

interface SessionOutcome {
  mood: number; // 1-10
  helpfulness: number; // 1-10
  keyTakeaways: string[];
  techniques: string[];
  breakthroughs?: string[];
}

interface TherapySessionWidgetProps {
  sessions?: TherapySession[];
  onSessionClick?: (session: TherapySession) => void;
  onPrepareSession?: (session: TherapySession) => void;
  onJoinTelehealth?: (session: TherapySession) => void;
  onReschedule?: (session: TherapySession) => void;
  onCompleteHomework?: (homework: TherapyHomework) => void;
  onAddNote?: (sessionId: string, note: string) => void;
}

export function TherapySessionWidget({
  sessions = [],
  onSessionClick,
  onPrepareSession,
  onJoinTelehealth,
  onReschedule,
  onCompleteHomework,
  onAddNote
}: TherapySessionWidgetProps) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'homework' | 'history'>('upcoming');
  const [selectedSession, setSelectedSession] = useState<TherapySession | null>(null);
  const [showPreparation, setShowPreparation] = useState(false);
  const [preparationTopics, setPreparationTopics] = useState<string[]>([]);
  const [sessionQuestions, setSessionQuestions] = useState<string[]>([]);

  // Get next upcoming session
  const nextSession = sessions
    .filter(s => s.status === 'scheduled' || s.status === 'confirmed')
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())[0];

  // Get all homework across sessions
  const allHomework = sessions
    .flatMap(s => s.homework || [])
    .filter(h => !h.completed)
    .sort((a, b) => {
      if (!a.dueDate || !b.dueDate) return 0;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  // Calculate session preparation progress
  const calculatePreparationProgress = (session: TherapySession) => {
    const totalItems = (session.sessionGoals?.length || 0) + 
                      (session.preparationNotes?.length || 0);
    const completedItems = (session.sessionGoals?.filter(g => g.discussed).length || 0) +
                          (session.preparationNotes?.length || 0);
    return totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  };

  // Format time until session
  const getTimeUntilSession = (session: TherapySession) => {
    const now = new Date();
    const sessionTime = new Date(session.dateTime);
    const diff = sessionTime.getTime() - now.getTime();
    
    if (diff < 0) return 'Past';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours`;
    return `${Math.floor(diff / 86400000)} days`;
  };

  // Session type icons
  const getSessionIcon = (type: string) => {
    switch (type) {
      case 'individual': return <Brain className="h-4 w-4" />;
      case 'group': return <Heart className="h-4 w-4" />;
      case 'family': return <Heart className="h-4 w-4" />;
      case 'couples': return <Heart className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  // Session status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-50';
      case 'scheduled': return 'text-blue-600 bg-blue-50';
      case 'in-progress': return 'text-purple-600 bg-purple-50';
      case 'completed': return 'text-gray-600 bg-gray-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex space-x-1 mb-4 border-b border-gray-200">
        {(['upcoming', 'homework', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'homework' && allHomework.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-orange-100 text-orange-600 rounded-full">
                {allHomework.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content based on active tab */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'upcoming' && (
          <div className="space-y-4">
            {/* Next Session Card */}
            {nextSession && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-4 border border-primary-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">Next Session</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(nextSession.dateTime).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600">
                      {getTimeUntilSession(nextSession)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {new Date(nextSession.dateTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                {/* Provider Info */}
                <div className="flex items-center space-x-3 mb-3">
                  <div className="h-10 w-10 bg-primary-200 rounded-full flex items-center justify-center">
                    {nextSession.providerImage ? (
                      <img 
                        src={nextSession.providerImage} 
                        alt={nextSession.providerName}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-primary-700 font-semibold">
                        {nextSession.providerName.split(' ').map(n => n[0]).join('')}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{nextSession.providerName}</p>
                    <p className="text-xs text-gray-600">{nextSession.providerSpecialty}</p>
                  </div>
                </div>

                {/* Session Details */}
                <div className="flex flex-wrap gap-3 mb-3 text-sm">
                  <div className="flex items-center text-gray-600">
                    {getSessionIcon(nextSession.type)}
                    <span className="ml-1 capitalize">{nextSession.type}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span className="ml-1">{nextSession.duration} min</span>
                  </div>
                  {nextSession.format === 'telehealth' ? (
                    <div className="flex items-center text-blue-600">
                      <Video className="h-4 w-4" />
                      <span className="ml-1">Telehealth</span>
                    </div>
                  ) : nextSession.format === 'phone' ? (
                    <div className="flex items-center text-green-600">
                      <Phone className="h-4 w-4" />
                      <span className="ml-1">Phone</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="ml-1">{nextSession.location || 'In-Person'}</span>
                    </div>
                  )}
                </div>

                {/* Preparation Progress */}
                {(nextSession.sessionGoals || nextSession.preparationNotes) && (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Preparation Progress</span>
                      <span className="text-primary-600 font-medium">
                        {Math.round(calculatePreparationProgress(nextSession))}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${calculatePreparationProgress(nextSession)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  {nextSession.format === 'telehealth' && (
                    <button
                      onClick={() => onJoinTelehealth?.(nextSession)}
                      className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center text-sm"
                    >
                      <Video className="h-4 w-4 mr-1" />
                      Join Session
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedSession(nextSession);
                      setShowPreparation(true);
                    }}
                    className="flex-1 px-3 py-2 bg-white text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors flex items-center justify-center text-sm"
                  >
                    <Clipboard className="h-4 w-4 mr-1" />
                    Prepare
                  </button>
                  <button
                    onClick={() => onReschedule?.(nextSession)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Other Upcoming Sessions */}
            <div className="space-y-2">
              {sessions
                .filter(s => s.id !== nextSession?.id && 
                  (s.status === 'scheduled' || s.status === 'confirmed'))
                .slice(0, 3)
                .map((session) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
                    onClick={() => onSessionClick?.(session)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">
                            {new Date(session.dateTime).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-gray-600">
                            {new Date(session.dateTime).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {session.providerName}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-600">
                            {getSessionIcon(session.type)}
                            <span>{session.type}</span>
                            {session.format === 'telehealth' && <Video className="h-3 w-3" />}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'homework' && (
          <div className="space-y-3">
            {allHomework.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clipboard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No pending homework</p>
              </div>
            ) : (
              allHomework.map((homework) => (
                <motion.div
                  key={homework.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{homework.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{homework.description}</p>
                    </div>
                    <button
                      onClick={() => onCompleteHomework?.(homework)}
                      className="ml-3 p-2 text-gray-400 hover:text-green-600 transition-colors"
                    >
                      <CheckCircle className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-3 text-xs">
                    <span className={`px-2 py-1 rounded-full ${
                      homework.type === 'worksheet' ? 'bg-blue-100 text-blue-700' :
                      homework.type === 'practice' ? 'bg-green-100 text-green-700' :
                      homework.type === 'reading' ? 'bg-purple-100 text-purple-700' :
                      homework.type === 'journaling' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {homework.type}
                    </span>
                    {homework.dueDate && (
                      <span className="text-gray-600">
                        Due {new Date(homework.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {sessions
              .filter(s => s.status === 'completed')
              .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
              .slice(0, 5)
              .map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
                  onClick={() => onSessionClick?.(session)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(session.dateTime).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {session.providerName} - {session.type}
                      </p>
                      {session.outcome && (
                        <div className="flex items-center space-x-3 mt-2">
                          <div className="flex items-center text-xs text-gray-600">
                            <Star className="h-3 w-3 text-yellow-500 mr-1" />
                            <span>Mood: {session.outcome.mood}/10</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                            <span>Helpful: {session.outcome.helpfulness}/10</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </motion.div>
              ))}
          </div>
        )}
      </div>

      {/* Session Preparation Modal */}
      <AnimatePresence>
        {showPreparation && selectedSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPreparation(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold mb-4">Session Preparation</h3>
              
              {/* Session Goals */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Session Goals</h4>
                <div className="space-y-2">
                  {selectedSession.sessionGoals?.map((goal) => (
                    <div key={goal.id} className="flex items-center p-2 bg-gray-50 rounded-lg">
                      <Target className={`h-4 w-4 mr-2 ${
                        goal.priority === 'high' ? 'text-red-500' :
                        goal.priority === 'medium' ? 'text-yellow-500' :
                        'text-gray-500'
                      }`} />
                      <span className="text-sm text-gray-700">{goal.goal}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Topics to Discuss */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Topics to Discuss</h4>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                  rows={3}
                  placeholder="What would you like to talk about?"
                  value={preparationTopics.join('\n')}
                  onChange={(e) => setPreparationTopics(e.target.value.split('\n'))}
                />
              </div>

              {/* Questions */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Questions for Therapist</h4>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                  rows={3}
                  placeholder="Any questions you'd like to ask?"
                  value={sessionQuestions.join('\n')}
                  onChange={(e) => setSessionQuestions(e.target.value.split('\n'))}
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    onPrepareSession?.(selectedSession);
                    setShowPreparation(false);
                  }}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Save Preparation
                </button>
                <button
                  onClick={() => setShowPreparation(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}