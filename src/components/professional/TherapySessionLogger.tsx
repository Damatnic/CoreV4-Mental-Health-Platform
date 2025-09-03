import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, _Calendar, Save, Star, _TrendingUp, Target, 
  Brain, _Heart, CheckCircle, Plus, _Minus, FileText,
  _MessageSquare, Lightbulb, AlertTriangle, Award,
  BarChart3, _PieChart, _LineChart, Activity, _Users,
  PlayCircle, PauseCircle, _RotateCcw, _Timer,
  Mic, MicOff, Video, VideoOff, _Settings, X, Square
} from 'lucide-react';

interface TherapySession {
  id: string;
  providerId: string;
  providerName: string;
  providerSpecialty: string;
  clientId: string;
  clientName: string;
  dateTime: Date;
  duration: number;
  actualDuration?: number;
  type: 'individual' | 'group' | 'family' | 'couples';
  format: 'in-person' | 'telehealth' | 'phone';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  sessionGoals?: SessionGoal[];
  techniques?: TherapeuticTechnique[];
  homework?: TherapyHomework[];
  notes?: SessionNote[];
  outcome?: SessionOutcome;
  nextSession?: Date;
  billingCode?: string;
  insuranceCovered: boolean;
  recordingConsent?: boolean;
  isRecording?: boolean;
}

interface SessionGoal {
  id: string;
  goal: string;
  priority: 'high' | 'medium' | 'low';
  discussed: boolean;
  progress: number; // 0-100
  notes?: string;
  outcome?: 'achieved' | 'partial' | 'not_achieved' | 'deferred';
}

interface TherapeuticTechnique {
  id: string;
  name: string;
  _category: 'CBT' | 'DBT' | 'ACT' | 'Mindfulness' | 'EMDR' | 'Psychodynamic' | 'Behavioral' | 'Other';
  description?: string;
  effectiveness: number; // 1-10
  clientReaction: 'positive' | 'neutral' | 'negative';
  notes?: string;
}

interface TherapyHomework {
  id: string;
  title: string;
  description: string;
  type: 'worksheet' | 'practice' | 'reading' | 'journaling' | 'behavior' | 'exercise';
  assignedDate: Date;
  dueDate?: Date;
  completed: boolean;
  difficulty: number; // 1-10
  priority: 'high' | 'medium' | 'low';
  resources?: string[];
  notes?: string;
}

interface SessionNote {
  id: string;
  timestamp: Date;
  type: 'observation' | 'intervention' | 'client_response' | 'breakthrough' | 'concern' | 'plan';
  content: string;
  _category?: string;
  important: boolean;
  private: boolean; // Provider-only notes
}

interface SessionOutcome {
  clientMood: number; // 1-10 scale
  clientEnergy: number; // 1-10 scale
  sessionHelpfulness: number; // 1-10 scale
  clientEngagement: number; // 1-10 scale
  therapeuticRapport: number; // 1-10 scale
  progressTowardGoals: number; // 1-10 scale
  keyInsights: string[];
  breakthroughs?: string[];
  challenges?: string[];
  clientFeedback?: string;
  providerObservations?: string;
  riskAssessment?: RiskAssessment;
  treatmentPlanAdjustments?: string[];
}

interface RiskAssessment {
  suicidalIdeation: 'none' | 'passive' | 'active' | 'plan' | 'intent';
  selfHarm: 'none' | 'thoughts' | 'recent' | 'active_risk';
  substanceUse: 'none' | 'mild_concern' | 'moderate_concern' | 'severe_concern';
  overallRisk: 'low' | 'moderate' | 'high' | 'crisis';
  interventionsNeeded?: string[];
  followUpRequired: boolean;
  emergencyContacted: boolean;
}

interface TherapySessionLoggerProps {
  session: TherapySession;
  _onUpdateSession?: (session: TherapySession) => void;
  onStartSession?: (sessionId: string) => void;
  onEndSession?: (sessionId: string) => void;
  onSaveNotes?: (sessionId: string, notes: SessionNote[]) => void;
  onCompleteSession?: (sessionId: string, outcome: SessionOutcome) => void;
  readOnly?: boolean;
  isProvider?: boolean;
}

export function TherapySessionLogger({
  session,
  _onUpdateSession,
  onStartSession,
  onEndSession,
  onSaveNotes,
  onCompleteSession,
  readOnly = false,
  isProvider = false
}: TherapySessionLoggerProps) {
  const [activeTab, _setActiveTab] = useState<'session' | 'goals' | 'techniques' | 'notes' | 'homework' | 'outcome'>('session');
  const [sessionTimer, _setSessionTimer] = useState(0);
  const [isTimerRunning, _setIsTimerRunning] = useState(false);
  const [currentSession, _setCurrentSession] = useState<TherapySession>(_session);
  const [newNote, _setNewNote] = useState('');
  const [noteType, _setNoteType] = useState<SessionNote['type']>('observation');
  const [___showRiskAssessment, _setShowRiskAssessment] = useState(false);
  const [audioEnabled, _setAudioEnabled] = useState(true);
  const [videoEnabled, _setVideoEnabled] = useState(true);

  // _Timer effect
  useEffect(() => {
    let _interval: NodeJS.Timeout;
    if (_isTimerRunning) {
      _interval = setInterval(() => {
        setSessionTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(_interval);
  }, [isTimerRunning]);

  // Format timer display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hours > 0 
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle session start
  const handleStartSession = () => {
    setIsTimerRunning(true);
    const _updatedSession = {
      ...currentSession,
      status: 'in-progress' as const,
      actualDuration: 0
    };
    setCurrentSession(_updatedSession);
    onStartSession?.(session.id);
  };

  // Handle session pause
  const handlePauseSession = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  // Handle session end
  const handleEndSession = () => {
    setIsTimerRunning(false);
    const _updatedSession = {
      ...currentSession,
      status: 'completed' as const,
      actualDuration: sessionTimer / 60 // Convert to minutes
    };
    setCurrentSession(_updatedSession);
    onEndSession?.(session.id);
  };

  // Handle adding notes
  const handleAddNote = () => {
    if (!newNote.trim()) return;

    const note: SessionNote = {
      id: `note_${Date.now()}`,
      timestamp: new Date(),
      type: noteType,
      content: newNote.trim(),
      important: false,
      private: isProvider
    };

    const updatedNotes = [...(currentSession.notes || []), note];
    const _updatedSession = {
      ...currentSession,
      notes: updatedNotes
    };

    setCurrentSession(_updatedSession);
    setNewNote('');
    onSaveNotes?.(session.id, updatedNotes);
  };

  // Handle goal progress update
  const handleGoalProgressUpdate = (goalId: string, progress: number, outcome?: SessionGoal['outcome']) => {
    const updatedGoals = currentSession.sessionGoals?.map(goal =>
      goal.id === goalId ? { ...goal, progress, outcome, discussed: true } : goal
    );

    setCurrentSession({
      ...currentSession,
      sessionGoals: updatedGoals
    });
  };

  // Handle technique rating
  const handleTechniqueRating = (techniqueId: string, effectiveness: number, reaction: TherapeuticTechnique['clientReaction']) => {
    const updatedTechniques = currentSession.techniques?.map(technique =>
      technique.id === techniqueId ? { ...technique, effectiveness, clientReaction: reaction } : technique
    );

    setCurrentSession({
      ...currentSession,
      techniques: updatedTechniques
    });
  };

  // Get progress color
  const __getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600 bg-green-100';
    if (progress >= 60) return 'text-blue-600 bg-blue-100';
    if (progress >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Get technique category color
  const getTechniqueColor = (_category: string) => {
    switch (_category) {
      case 'CBT': return 'bg-blue-100 text-blue-800';
      case 'DBT': return 'bg-green-100 text-green-800';
      case 'ACT': return 'bg-purple-100 text-purple-800';
      case 'Mindfulness': return 'bg-indigo-100 text-indigo-800';
      case 'EMDR': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-blue-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Therapy Session</h1>
            <p className="text-primary-100 mt-1">
              {currentSession.clientName} with {currentSession.providerName}
            </p>
            <p className="text-primary-200 text-sm">
              {new Date(currentSession.dateTime).toLocaleString()}
            </p>
          </div>
          
          {/* Session Controls */}
          <div className="flex items-center space-x-4">
            {/* _Timer Display */}
            <div className="text-center">
              <div className="text-3xl font-mono font-bold">
                {formatTime(_sessionTimer)}
              </div>
              <div className="text-xs text-primary-200">
                {currentSession.duration} min scheduled
              </div>
            </div>

            {/* Control Buttons */}
            {!readOnly && isProvider && (
              <div className="flex items-center space-x-2">
                {currentSession.format === 'telehealth' && (
                  <>
                    <button
                      onClick={() => setAudioEnabled(!audioEnabled)}
                      className={`p-2 rounded-full ${
                        audioEnabled ? 'bg-white/20' : 'bg-red-500'
                      } transition-colors`}
                    >
                      {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                    </button>
                    <button
                      onClick={() => setVideoEnabled(!videoEnabled)}
                      className={`p-2 rounded-full ${
                        videoEnabled ? 'bg-white/20' : 'bg-red-500'
                      } transition-colors`}
                    >
                      {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                    </button>
                  </>
                )}

                {currentSession.status === 'scheduled' && (
                  <button
                    onClick={handleStartSession}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
                  >
                    <PlayCircle className="h-4 w-4 mr-1" />
                    Start
                  </button>
                )}

                {currentSession.status === 'in-progress' && (
                  <>
                    <button
                      onClick={handlePauseSession}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center"
                    >
                      {isTimerRunning ? <PauseCircle className="h-4 w-4 mr-1" /> : <PlayCircle className="h-4 w-4 mr-1" />}
                      {isTimerRunning ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={handleEndSession}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center"
                    >
                      <Square className="h-4 w-4 mr-1" />
                      End
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status Indicator */}
        <div className="mt-4">
          <div className="flex items-center space-x-2">
            <div className={`h-3 w-3 rounded-full ${
              currentSession.status === 'in-progress' ? 'bg-green-400 animate-pulse' :
              currentSession.status === 'completed' ? 'bg-gray-400' :
              'bg-yellow-400'
            }`} />
            <span className="text-sm capitalize">
              {currentSession.status.replace('_', ' ')}
            </span>
            {currentSession.isRecording && (
              <div className="flex items-center space-x-1 text-red-200">
                <div className="h-2 w-2 bg-red-400 rounded-full animate-pulse" />
                <span className="text-xs">Recording</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-1 px-6">
          {[
            { id: 'session', label: 'Session Overview', icon: Activity },
            { id: 'goals', label: 'Goals', icon: Target },
            { id: 'techniques', label: 'Techniques', icon: Brain },
            { id: 'notes', label: 'Notes', icon: FileText },
            { id: 'homework', label: 'Homework', icon: CheckCircle },
            { id: 'outcome', label: 'Outcome', icon: BarChart3 }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as unknown)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center space-x-2 ${
                activeTab === id
                  ? 'text-primary-600 border-primary-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {activeTab === 'session' && (
          <div className="space-y-6">
            {/* Session Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Duration</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {currentSession.actualDuration || sessionTimer / 60 || currentSession.duration} min
                </p>
                <p className="text-sm text-blue-700">
                  Scheduled: {currentSession.duration} min
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900">Goals Progress</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {currentSession.sessionGoals?.filter(g => g.discussed).length || 0}/
                  {currentSession.sessionGoals?.length || 0}
                </p>
                <p className="text-sm text-green-700">Goals discussed</p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-purple-900">Techniques</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {currentSession.techniques?.length || 0}
                </p>
                <p className="text-sm text-purple-700">Applied today</p>
              </div>
            </div>

            {/* Session Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Session Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize">{currentSession.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Format:</span>
                    <span className="font-medium capitalize">{currentSession.format}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Provider:</span>
                    <span className="font-medium">{currentSession.providerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Specialty:</span>
                    <span className="font-medium">{currentSession.providerSpecialty}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Quick Notes</h3>
                {!readOnly && (
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <select
                        value={noteType}
                        onChange={(e) => setNoteType(e.target.value as SessionNote['type'])}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="observation">Observation</option>
                        <option value="intervention">Intervention</option>
                        <option value="client_response">Client Response</option>
                        <option value="breakthrough">Breakthrough</option>
                        <option value="concern">Concern</option>
                        <option value="plan">Plan</option>
                      </select>
                    </div>
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a quick note..."
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                      rows={3}
                    />
                    <button
                      onClick={handleAddNote}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                    >
                      Add Note
                    </button>
                  </div>
                )}
                
                {/* Recent Notes Preview */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {currentSession.notes?.slice(-3).map((note) => (
                    <div key={note.id} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className={`px-2 py-1 rounded text-xs ${
                          note.type === 'breakthrough' ? 'bg-green-100 text-green-700' :
                          note.type === 'concern' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {note.type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(note.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{note.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Session Goals</h3>
              {!readOnly && (
                <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm flex items-center">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Goal
                </button>
              )}
            </div>

            <div className="space-y-3">
              {currentSession.sessionGoals?.map((goal) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{goal.goal}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          goal.priority === 'high' ? 'bg-red-100 text-red-700' :
                          goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {goal.priority} priority
                        </span>
                        {goal.discussed && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                            Discussed
                          </span>
                        )}
                      </div>
                    </div>
                    {goal.outcome && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        goal.outcome === 'achieved' ? 'bg-green-100 text-green-700' :
                        goal.outcome === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                        goal.outcome === 'not_achieved' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {goal.outcome.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-medium text-gray-900">{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>

                  {!readOnly && (
                    <div className="flex space-x-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={goal.progress}
                        onChange={(e) => handleGoalProgressUpdate(goal.id, parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <select
                        value={goal.outcome || ''}
                        onChange={(e) => handleGoalProgressUpdate(goal.id, goal.progress, e.target.value as SessionGoal['outcome'])}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="">Set outcome</option>
                        <option value="achieved">Achieved</option>
                        <option value="partial">Partially achieved</option>
                        <option value="not_achieved">Not achieved</option>
                        <option value="deferred">Deferred</option>
                      </select>
                    </div>
                  )}

                  {goal.notes && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                      <p className="text-gray-700">{goal.notes}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'techniques' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Therapeutic Techniques</h3>
              {!readOnly && (
                <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm flex items-center">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Technique
                </button>
              )}
            </div>

            <div className="space-y-3">
              {currentSession.techniques?.map((technique) => (
                <motion.div
                  key={technique.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{technique.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{technique.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getTechniqueColor(technique._category)}`}>
                          {technique._category}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          technique.clientReaction === 'positive' ? 'bg-green-100 text-green-700' :
                          technique.clientReaction === 'negative' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {technique.clientReaction}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Effectiveness Rating */}
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Effectiveness</span>
                      <span className="text-sm font-medium text-gray-900">{technique.effectiveness}/10</span>
                    </div>
                    <div className="flex space-x-1">
                      {[...Array(10)].map((_, index) => (
                        <button
                          key={index}
                          onClick={() => !readOnly && handleTechniqueRating(technique.id, index + 1, technique.clientReaction)}
                          className={`w-4 h-4 rounded-full transition-colors ${
                            index < technique.effectiveness
                              ? 'bg-yellow-400'
                              : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                          disabled={readOnly}
                        />
                      ))}
                    </div>
                  </div>

                  {!readOnly && (
                    <div className="flex space-x-2 text-sm">
                      <button
                        onClick={() => handleTechniqueRating(technique.id, technique.effectiveness, 'positive')}
                        className={`px-3 py-1 rounded-full transition-colors ${
                          technique.clientReaction === 'positive'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-green-50'
                        }`}
                      >
                        Positive
                      </button>
                      <button
                        onClick={() => handleTechniqueRating(technique.id, technique.effectiveness, 'neutral')}
                        className={`px-3 py-1 rounded-full transition-colors ${
                          technique.clientReaction === 'neutral'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        Neutral
                      </button>
                      <button
                        onClick={() => handleTechniqueRating(technique.id, technique.effectiveness, 'negative')}
                        className={`px-3 py-1 rounded-full transition-colors ${
                          technique.clientReaction === 'negative'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-red-50'
                        }`}
                      >
                        Negative
                      </button>
                    </div>
                  )}

                  {technique.notes && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                      <p className="text-gray-700">{technique.notes}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Session Notes</h3>
              <div className="text-sm text-gray-500">
                {currentSession.notes?.length || 0} notes
              </div>
            </div>

            {/* Add Note Form */}
            {!readOnly && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <select
                      value={noteType}
                      onChange={(e) => setNoteType(e.target.value as SessionNote['type'])}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="observation">Observation</option>
                      <option value="intervention">Intervention</option>
                      <option value="client_response">Client Response</option>
                      <option value="breakthrough">Breakthrough</option>
                      <option value="concern">Concern</option>
                      <option value="plan">Plan</option>
                    </select>
                  </div>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add your note here..."
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                    rows={4}
                  />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2 text-sm">
                      <label htmlFor="input_xx89sx5da" className="flex items-center space-x-1">
                        <input type="checkbox" className="rounded" />
                        <span>Mark as important</span>
                      </label>
                      <label htmlFor="input_t00kg3agu" className="flex items-center space-x-1">
                        <input type="checkbox" className="rounded" />
                        <span>Private note</span>
                      </label>
                    </div>
                    <button
                      onClick={handleAddNote}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Note
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notes List */}
            <div className="space-y-2">
              {currentSession.notes?.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`border rounded-lg p-4 ${
                    note.important ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        note.type === 'breakthrough' ? 'bg-green-100 text-green-700' :
                        note.type === 'concern' ? 'bg-red-100 text-red-700' :
                        note.type === 'observation' ? 'bg-blue-100 text-blue-700' :
                        note.type === 'intervention' ? 'bg-purple-100 text-purple-700' :
                        note.type === 'client_response' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {note.type.replace('_', ' ')}
                      </span>
                      {note.important && (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      )}
                      {note.private && (
                        <span className="text-xs text-gray-500">(_Private)</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(note.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{note.content}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'homework' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Homework Assignments</h3>
              {!readOnly && (
                <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm flex items-center">
                  <Plus className="h-4 w-4 mr-1" />
                  Assign Homework
                </button>
              )}
            </div>

            <div className="space-y-3">
              {currentSession.homework?.map((homework) => (
                <motion.div
                  key={homework.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{homework.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{homework.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          homework.type === 'worksheet' ? 'bg-blue-100 text-blue-700' :
                          homework.type === 'practice' ? 'bg-green-100 text-green-700' :
                          homework.type === 'reading' ? 'bg-purple-100 text-purple-700' :
                          homework.type === 'journaling' ? 'bg-yellow-100 text-yellow-700' :
                          homework.type === 'behavior' ? 'bg-pink-100 text-pink-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {homework.type}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          homework.priority === 'high' ? 'bg-red-100 text-red-700' :
                          homework.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {homework.priority} priority
                        </span>
                        {homework.completed && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {homework.dueDate && (
                    <div className="text-sm text-gray-600 mb-2">
                      Due: {new Date(homework.dueDate).toLocaleDateString()}
                    </div>
                  )}

                  {/* Difficulty Rating */}
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Difficulty</span>
                      <span className="text-sm font-medium text-gray-900">{homework.difficulty}/10</span>
                    </div>
                    <div className="flex space-x-1">
                      {[...Array(10)].map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full ${
                            index < homework.difficulty ? 'bg-orange-400' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {homework.resources && homework.resources.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-600 mb-1">Resources:</p>
                      <div className="space-y-1">
                        {homework.resources.map((resource, index) => (
                          <a
                            key={index}
                            href={resource}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary-600 hover:text-primary-700 block"
                          >
                            {resource}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {homework.notes && (
                    <div className="p-2 bg-gray-50 rounded text-sm">
                      <p className="text-gray-700">{homework.notes}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'outcome' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Session Outcome</h3>
              {currentSession.outcome?.riskAssessment?.overallRisk !== 'low' && (
                <button
                  onClick={() => setShowRiskAssessment(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center"
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Risk Assessment
                </button>
              )}
            </div>

            {currentSession.outcome ? (
              <div className="space-y-6">
                {/* Rating Scales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Client Mood', value: currentSession.outcome.clientMood, color: 'blue' },
                    { label: 'Client Energy', value: currentSession.outcome.clientEnergy, color: 'green' },
                    { label: 'Session Helpfulness', value: currentSession.outcome.sessionHelpfulness, color: 'purple' },
                    { label: 'Client Engagement', value: currentSession.outcome.clientEngagement, color: 'indigo' },
                    { label: 'Therapeutic Rapport', value: currentSession.outcome.therapeuticRapport, color: 'pink' },
                    { label: 'Goal Progress', value: currentSession.outcome.progressTowardGoals, color: 'yellow' }
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-900">{label}</span>
                        <span className="text-lg font-bold text-gray-900">{value}/10</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`bg-${color}-500 h-2 rounded-full transition-all`}
                          style={{ width: `${value * 10}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Key Insights */}
                {currentSession.outcome.keyInsights && currentSession.outcome.keyInsights.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Key Insights</h4>
                    <div className="space-y-2">
                      {currentSession.outcome.keyInsights.map((insight, index) => (
                        <div key={index} className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                          <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                          <p className="text-sm text-blue-900">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Breakthroughs */}
                {currentSession.outcome.breakthroughs && currentSession.outcome.breakthroughs.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Breakthroughs</h4>
                    <div className="space-y-2">
                      {currentSession.outcome.breakthroughs.map((breakthrough, index) => (
                        <div key={index} className="flex items-start space-x-2 p-3 bg-green-50 rounded-lg">
                          <Award className="h-5 w-5 text-green-600 mt-0.5" />
                          <p className="text-sm text-green-900">{breakthrough}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Challenges */}
                {currentSession.outcome.challenges && currentSession.outcome.challenges.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Challenges</h4>
                    <div className="space-y-2">
                      {currentSession.outcome.challenges.map((challenge, index) => (
                        <div key={index} className="flex items-start space-x-2 p-3 bg-red-50 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                          <p className="text-sm text-red-900">{challenge}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Client & Provider Feedback */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentSession.outcome.clientFeedback && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Client Feedback</h4>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{currentSession.outcome.clientFeedback}</p>
                      </div>
                    </div>
                  )}

                  {currentSession.outcome.providerObservations && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Provider Observations</h4>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{currentSession.outcome.providerObservations}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Treatment Plan Adjustments */}
                {currentSession.outcome.treatmentPlanAdjustments && currentSession.outcome.treatmentPlanAdjustments.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Treatment Plan Adjustments</h4>
                    <div className="space-y-2">
                      {currentSession.outcome.treatmentPlanAdjustments.map((adjustment, index) => (
                        <div key={index} className="p-3 bg-purple-50 rounded-lg">
                          <p className="text-sm text-purple-900">{adjustment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Session outcome will be available after completion</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Risk Assessment Modal */}
      <AnimatePresence>
        {showRiskAssessment && currentSession.outcome?.riskAssessment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowRiskAssessment(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-red-900">Risk Assessment</h3>
                <button
                  onClick={() => setShowRiskAssessment(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="input_hatnuoz6v" className="text-sm font-medium text-gray-700">Suicidal Ideation</label>
                    <div className={`mt-1 p-2 rounded text-sm ${
                      currentSession.outcome.riskAssessment.suicidalIdeation === 'none' ? 'bg-green-100 text-green-800' :
                      currentSession.outcome.riskAssessment.suicidalIdeation === 'passive' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {currentSession.outcome.riskAssessment.suicidalIdeation}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="input_hxbmg0gky" className="text-sm font-medium text-gray-700">Self Harm</label>
                    <div className={`mt-1 p-2 rounded text-sm ${
                      currentSession.outcome.riskAssessment.selfHarm === 'none' ? 'bg-green-100 text-green-800' :
                      currentSession.outcome.riskAssessment.selfHarm === 'thoughts' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {currentSession.outcome.riskAssessment.selfHarm}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="input_r1ckq4fx9" className="text-sm font-medium text-gray-700">Substance Use</label>
                    <div className={`mt-1 p-2 rounded text-sm ${
                      currentSession.outcome.riskAssessment.substanceUse === 'none' ? 'bg-green-100 text-green-800' :
                      currentSession.outcome.riskAssessment.substanceUse === 'mild_concern' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {currentSession.outcome.riskAssessment.substanceUse.replace('_', ' ')}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="input_zmcbortqk" className="text-sm font-medium text-gray-700">Overall Risk</label>
                    <div className={`mt-1 p-2 rounded text-sm ${
                      currentSession.outcome.riskAssessment.overallRisk === 'low' ? 'bg-green-100 text-green-800' :
                      currentSession.outcome.riskAssessment.overallRisk === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {currentSession.outcome.riskAssessment.overallRisk}
                    </div>
                  </div>
                </div>

                {currentSession.outcome.riskAssessment.interventionsNeeded && currentSession.outcome.riskAssessment.interventionsNeeded.length > 0 && (
                  <div>
                    <label htmlFor="input_03tn8jd4w" className="text-sm font-medium text-gray-700 mb-2 block">Interventions Needed</label>
                    <div className="space-y-1">
                      {currentSession.outcome.riskAssessment.interventionsNeeded.map((intervention, index) => (
                        <div key={index} className="p-2 bg-orange-50 rounded text-sm">
                          <p className="text-orange-900">{intervention}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <div className={`h-3 w-3 rounded-full ${
                      currentSession.outcome.riskAssessment.followUpRequired ? 'bg-red-500' : 'bg-green-500'
                    }`} />
                    <span className="text-sm">Follow-up Required</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`h-3 w-3 rounded-full ${
                      currentSession.outcome.riskAssessment.emergencyContacted ? 'bg-red-500' : 'bg-gray-300'
                    }`} />
                    <span className="text-sm">Emergency Contacted</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Button */}
      {!readOnly && (
        <div className="p-6 bg-gray-50 border-t">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Last saved: {new Date().toLocaleTimeString()}
            </div>
            <button
              onClick={() => onCompleteSession?.(session.id, currentSession.outcome!)}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}