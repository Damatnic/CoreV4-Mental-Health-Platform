import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Clock,
  Calendar,
  Smartphone,
  Watch,
  Volume2,
  VolumeX,
  Settings,
  BrainCircuit,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pill,
  Coffee,
  Sun,
  Moon,
  Activity,
  Target,
  Zap,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  MapPin,
  User,
  HeartPulse,
  FileText,
  Lightbulb
} from 'lucide-react';

interface SmartReminderProps {
  userId: string;
  medications: any[];
  onUpdateReminders: (reminders: SmartReminder[]) => void;
}

interface SmartReminder {
  id: string;
  medicationId: string;
  _type: 'time' | 'location' | 'context' | 'adaptive' | 'emergency';
  enabled: boolean;
  settings: ReminderSettings;
  intelligence: ReminderIntelligence;
  effectiveness: number; // 0-1
  lastTriggered?: Date;
  successRate: number; // 0-1
  userFeedback: 'helpful' | 'annoying' | 'neutral';
}

interface ReminderSettings {
  // Time-based
  times?: string[];
  advanceNotice?: number; // _minutes
  snoozeOptions?: number[]; // _minutes
  
  // Location-based
  locations?: LocationTrigger[];
  geofenceRadius?: number; // meters
  
  // Context-aware
  contextTriggers?: ContextTrigger[];
  
  // Adaptive
  adaptToRoutine?: boolean;
  learnFromBehavior?: boolean;
  personalizeContent?: boolean;
  
  // Delivery methods
  pushNotification?: boolean;
  sms?: boolean;
  email?: boolean;
  smartWatch?: boolean;
  
  // Sound and vibration
  soundEnabled?: boolean;
  customSound?: string;
  vibrationPattern?: 'gentle' | 'strong' | 'custom';
  
  // Escalation
  escalationEnabled?: boolean;
  escalationDelay?: number; // _minutes
  escalationContacts?: string[];
}

interface LocationTrigger {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  trigger: 'enter' | 'exit';
  description: string;
}

interface ContextTrigger {
  id: string;
  _type: 'meal' | 'exercise' | 'bedtime' | 'work' | 'stress' | 'mood';
  condition: string;
  description: string;
}

interface ReminderIntelligence {
  // Pattern recognition
  optimalTimes?: string[];
  adherencePatterns?: AdherencePattern[];
  
  // Personalization
  preferredChannels?: string[];
  responseLatency?: number; // average time to respond
  
  // Smart features
  moodCorrelation?: number; // -1 to 1
  sideEffectPrediction?: number; // 0-1
  dosageOptimization?: DosageRecommendation;
  
  // Learning
  adaptationHistory?: AdaptationEvent[];
  confidenceScore?: number; // 0-1
}

interface AdherencePattern {
  pattern: string;
  confidence: number;
  impact: number; // effect on adherence
  recommendation: string;
}

interface DosageRecommendation {
  currentEffectiveness: number;
  suggestedChanges: string[];
  reasoning: string;
  confidence: number;
}

interface AdaptationEvent {
  date: Date;
  trigger: string;
  action: string;
  result: string;
  effectiveness: number;
}

interface AIInsight {
  _type: 'pattern' | 'optimization' | 'warning' | 'success';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  actions?: string[];
}

export function MedicationSmartReminders({ 
  userId, 
  medications, 
  onUpdateReminders 
}: SmartReminderProps) {
  const [reminders, setReminders] = useState<SmartReminder[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'configure' | 'insights' | 'history'>('overview');
  const [selectedMedication, setSelectedMedication] = useState<string | null>(null);
  const [isLearningMode, setIsLearningMode] = useState(true);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [reminderTest, setReminderTest] = useState<{ active: boolean; type: string } | null>(null);

  useEffect(() => {
    generateInitialReminders();
    generateAIInsights();
  }, [medications]);

  const generateInitialReminders = () => {
    const initialReminders: SmartReminder[] = medications.map((med: any, index: number) => ({
      id: `reminder-${med.id}`,
      medicationId: med.id,
      _type: 'adaptive',
      enabled: true,
      settings: {
        times: med.schedule?.map((s: any) => s.time) || ['08:00'],
        advanceNotice: 15,
        snoozeOptions: [5, 10, 30],
        adaptToRoutine: true,
        learnFromBehavior: true,
        personalizeContent: true,
        pushNotification: true,
        soundEnabled: true,
        vibrationPattern: 'gentle',
        escalationEnabled: true,
        escalationDelay: 60
      },
      intelligence: {
        optimalTimes: med.schedule?.map((s: any) => s.time) || ['08:00'],
        adherencePatterns: [
          {
            pattern: `Better adherence when taken with ${index % 2 === 0 ? 'breakfast' : 'dinner'}`,
            confidence: 0.75 + Math.random() * 0.2,
            impact: 0.3 + Math.random() * 0.4,
            recommendation: `Consider scheduling with ${index % 2 === 0 ? 'morning' : 'evening'} meal`
          }
        ],
        preferredChannels: ['push', 'vibration'],
        responseLatency: 5 + Math.random() * 15,
        moodCorrelation: (Math.random() - 0.5) * 0.8,
        confidenceScore: 0.6 + Math.random() * 0.3
      },
      effectiveness: 0.7 + Math.random() * 0.25,
      successRate: 0.65 + Math.random() * 0.3,
      userFeedback: Math.random() > 0.7 ? 'helpful' : Math.random() > 0.5 ? 'neutral' : 'annoying'
    }));

    setReminders(initialReminders);
  };

  const generateAIInsights = () => {
    const insights: AIInsight[] = [
      {
        _type: 'pattern',
        title: 'Optimal Timing Discovered',
        description: 'Your medication adherence is 23% higher when taken within 30 _minutes of breakfast.',
        confidence: 0.87,
        actionable: true,
        actions: ['Adjust reminder to 8:15 AM', 'Link reminder to meal tracking']
      },
      {
        _type: 'optimization',
        title: 'Smart Scheduling Opportunity',
        description: 'Consolidating your 8 AM and 8:30 AM medications into a single reminder could improve adherence.',
        confidence: 0.74,
        actionable: true,
        actions: ['Create combined reminder', 'Test for 2 weeks']
      },
      {
        _type: 'warning',
        title: 'Missed Dose Pattern',
        description: 'You\'ve missed your evening medication 4 times this week, typically on busy weekdays.',
        confidence: 0.92,
        actionable: true,
        actions: ['Enable location-based reminders', 'Add backup reminder 2 _hours later']
      },
      {
        _type: 'success',
        title: 'Improvement Detected',
        description: 'Your medication adherence has improved 18% since enabling smart reminders.',
        confidence: 0.95,
        actionable: false
      }
    ];

    setAiInsights(insights);
  };

  const testReminder = (type: string) => {
    setReminderTest({ active: true, type });
    
    // Simulate reminder
    if ('Notification' in window) {
      new Notification('Medication Reminder', {
        body: 'Time to take your medication!',
        icon: '/medication-icon.png',
        requireInteraction: true
      });
    }

    // Auto-dismiss test after 5 seconds
    setTimeout(() => {
      setReminderTest(null);
    }, 5000);
  };

  const getReminderTypeIcon = (type: string) => {
    switch (type) {
      case 'time': return <Clock className="w-5 h-5" />;
      case 'location': return <MapPin className="w-5 h-5" />;
      case 'context': return <Activity className="w-5 h-5" />;
      case 'adaptive': return <BrainCircuit className="w-5 h-5" />;
      case 'emergency': return <AlertTriangle className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getEffectivenessColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern': return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'optimization': return <Target className="w-5 h-5 text-purple-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Lightbulb className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BrainCircuit className="w-8 h-8 mr-3 text-blue-600" />
              Smart Medication Reminders
            </h1>
            <p className="text-gray-600 mt-2">
              AI-powered reminders that learn from your habits and optimize for better adherence
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
              <div className={`w-3 h-3 rounded-full ${isLearningMode ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-sm font-medium">Learning Mode</span>
              <button
                onClick={() => setIsLearningMode(!isLearningMode)}
                className="ml-2 text-blue-600 hover:text-blue-700"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Reminders</p>
                <p className="text-2xl font-bold text-gray-900">{reminders.filter(r => r.enabled).length}</p>
              </div>
              <Bell className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(reminders.reduce((acc, r) => acc + r.successRate, 0) / reminders.length * 100)}%
                </p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">AI Insights</p>
                <p className="text-2xl font-bold text-purple-600">{aiInsights.length}</p>
              </div>
              <Lightbulb className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Effectiveness</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(reminders.reduce((acc, r) => acc + r.effectiveness, 0) / reminders.length * 100)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 bg-white rounded-lg p-1 shadow-sm">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'configure', label: 'Configure', icon: Settings },
          { id: 'insights', label: 'AI Insights', icon: BrainCircuit },
          { id: 'history', label: 'History', icon: FileText }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'insights' && aiInsights.filter(i => i.actionable).length > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {aiInsights.filter(i => i.actionable).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Active Reminders */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Active Reminders</h2>
              <div className="space-y-4">
                {reminders.filter(r => r.enabled).map(reminder => {
                  const medication = medications.find((m: any) => m.id === reminder.medicationId);
                  return (
                    <motion.div
                      key={reminder.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          {getReminderTypeIcon(reminder._type)}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{medication?.name}</h3>
                          <p className="text-sm text-gray-600">
                            {reminder.settings.times?.join(', ')} • {reminder._type} reminder
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs font-medium ${getEffectivenessColor(reminder.effectiveness)}`}>
                              {Math.round(reminder.effectiveness * 100)}% effective
                            </span>
                            <span className="text-xs text-gray-500">
                              • {Math.round(reminder.successRate * 100)}% success rate
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => testReminder(reminder._type)}
                          className="p-2 text-gray-500 hover:text-gray-700"
                          title="Test reminder"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedMedication(reminder.medicationId)}
                          className="p-2 text-gray-500 hover:text-gray-700"
                          title="Configure"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Today&apos;s Schedule */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Today&apos;s Schedule</h2>
              <div className="space-y-3">
                {medications.flatMap((med: any) => 
                  med.schedule?.map((sched: any, idx: number) => {
                    const now = new Date();
                    const [hours, minutes] = sched.time.split(':');
                    const schedTime = new Date();
                    schedTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    const isPast = schedTime < now;
                    const isNext = !isPast && schedTime.getTime() === Math.min(
                      ...medications.flatMap((m: any) => 
                        m.schedule?.map((s: any) => {
                          const [h, min] = s.time.split(':');
                          const t = new Date();
                          t.setHours(parseInt(h), parseInt(min), 0, 0);
                          return t > now ? t.getTime() : Infinity;
                        }) || []
                      ).filter((t: number) => t !== Infinity)
                    );

                    return (
                      <div
                        key={`${med.id}-${idx}`}
                        className={`flex items-center gap-4 p-3 rounded-lg ${
                          isPast ? 'bg-gray-50' : isNext ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-gray-200'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${
                          isPast ? 'bg-gray-200' : isNext ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          {isPast ? (
                            sched.taken ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />
                          ) : (
                            <Pill className={`w-5 h-5 ${isNext ? 'text-blue-600' : 'text-green-600'}`} />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{med.name}</p>
                          <p className="text-sm text-gray-600">{med.dosage} • {sched.time}</p>
                        </div>
                        {isNext && (
                          <div className="flex items-center gap-1 text-blue-600 text-sm font-medium">
                            <Clock className="w-4 h-4" />
                            Next
                          </div>
                        )}
                        {isPast && sched.taken && (
                          <div className="text-green-600 text-sm">
                            ✓ Taken
                          </div>
                        )}
                      </div>
                    );
                  }) || []
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Configure Tab */}
        {activeTab === 'configure' && (
          <motion.div
            key="configure"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Test Reminder */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Test Reminders</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { type: 'push', label: 'Push Notification', icon: Smartphone },
                  { type: 'sound', label: 'Sound Alert', icon: Volume2 },
                  { type: 'vibration', label: 'Vibration', icon: Watch },
                  { type: 'voice', label: 'Voice Reminder', icon: User }
                ].map(test => {
                  const Icon = test.icon;
                  return (
                    <button
                      key={test.type}
                      onClick={() => testReminder(test.type)}
                      disabled={reminderTest?.active && reminderTest.type === test.type}
                      className={`p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${
                        reminderTest?.active && reminderTest.type === test.type ? 'bg-blue-50 border-blue-300' : ''
                      }`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                      <p className="text-sm font-medium text-gray-900">{test.label}</p>
                      {reminderTest?.active && reminderTest.type === test.type && (
                        <p className="text-xs text-blue-600 mt-1">Testing...</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Smart Features */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Smart Features</h2>
              <div className="space-y-4">
                {[
                  {
                    id: 'adaptive',
                    title: 'Adaptive Timing',
                    description: 'AI learns your optimal medication times based on your routine',
                    icon: BrainCircuit,
                    enabled: true
                  },
                  {
                    id: 'location',
                    title: 'Location-Based Reminders',
                    description: 'Get reminders when you arrive at or leave specific places',
                    icon: MapPin,
                    enabled: false
                  },
                  {
                    id: 'context',
                    title: 'Context-Aware Alerts',
                    description: 'Reminders based on your activities, meals, and mood',
                    icon: Activity,
                    enabled: true
                  },
                  {
                    id: 'escalation',
                    title: 'Smart Escalation',
                    description: 'Automatically notify emergency contacts if medication is consistently missed',
                    icon: AlertTriangle,
                    enabled: false
                  }
                ].map(feature => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Icon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{feature.title}</h3>
                          <p className="text-sm text-gray-600">{feature.description}</p>
                        </div>
                      </div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={feature.enabled}
                          onChange={() => {}}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          aria-label={`Toggle ${feature.title}`}
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* AI Insights Tab */}
        {activeTab === 'insights' && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">AI-Generated Insights</h2>
              <div className="space-y-4">
                {aiInsights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {getInsightIcon(insight._type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900">{insight.title}</h3>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {Math.round(insight.confidence * 100)}% confidence
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{insight.description}</p>
                        
                        {insight.actionable && insight.actions && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-900">Recommended Actions:</p>
                            <div className="space-y-1">
                              {insight.actions.map((action, actionIndex) => (
                                <div key={actionIndex} className="flex items-center gap-2">
                                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                    {action}
                                  </button>
                                  <ChevronRight className="w-3 h-3 text-gray-400" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Reminder History</h2>
              <div className="space-y-3">
                {[...Array(10)].map((_, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border-l-4 border-blue-200 bg-blue-50 rounded-r-lg">
                    <div className="flex-shrink-0">
                      {index % 3 === 0 ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : index % 3 === 1 ? (
                        <Clock className="w-5 h-5 text-yellow-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {medications[index % medications.length]?.name || 'Medication'} reminder
                      </p>
                      <p className="text-sm text-gray-600">
                        {index % 3 === 0 ? 'Taken on time' : index % 3 === 1 ? 'Snoozed for 15 _minutes' : 'Missed dose'}
                        • {Math.floor(Math.random() * 5) + 1} hours ago
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button for Emergency */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors"
        title="Emergency Override"
      >
        <Zap className="w-6 h-6 mx-auto" />
      </motion.button>
    </div>
  );
}