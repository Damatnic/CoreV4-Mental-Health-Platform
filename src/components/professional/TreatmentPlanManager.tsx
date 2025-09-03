import { useState, useEffect } from 'react';
import { motion, _AnimatePresence } from 'framer-motion';
import { 
  Target, _Calendar, _Clock, CheckCircle, AlertCircle,
  Plus, _Minus, Edit2, Save, _Trash2, Users, Brain,
  TrendingUp, _TrendingDown, BarChart3, FileText,
  Star, _Award, _Settings, _Filter, _Search, Download,
  _Upload, _RefreshCw, _Eye, _EyeOff, _Flag, _MessageSquare,
  Lightbulb, Activity, _Heart, Shield, _Zap, _Globe
} from 'lucide-react';

interface TreatmentPlan {
  id: string;
  clientId: string;
  clientName: string;
  providerId: string;
  providerName: string;
  primaryDiagnosis: Diagnosis[];
  secondaryDiagnoses?: Diagnosis[];
  createdDate: Date;
  lastUpdated: Date;
  reviewDate: Date;
  _status: 'active' | 'paused' | 'completed' | 'discontinued';
  _priority: 'high' | 'medium' | 'low';
  treatmentModalities: TreatmentModality[];
  shortTermGoals: TreatmentGoal[];
  longTermGoals: TreatmentGoal[];
  interventions: Intervention[];
  objectives: Objective[];
  measurements: ProgressMeasurement[];
  barriers?: Barrier[];
  strengths?: string[];
  notes?: string;
  collaborators?: Collaborator[];
  crisisPlan?: CrisisPlan;
}

interface Diagnosis {
  code: string; // ICD-10 or DSM-5 code
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  specifiers?: string[];
  onset: Date;
  notes?: string;
}

interface TreatmentModality {
  id: string;
  name: string;
  type: 'CBT' | 'DBT' | 'ACT' | 'EMDR' | 'Psychodynamic' | 'Behavioral' | 'Family' | 'Group' | 'Other';
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'as_needed';
  duration: number; // in weeks
  provider?: string;
  startDate: Date;
  endDate?: Date;
  notes?: string;
}

interface TreatmentGoal {
  id: string;
  category: 'symptom_reduction' | 'functional_improvement' | 'skill_development' | 'relationship' | 'behavioral' | 'cognitive' | 'other';
  description: string;
  targetDate: Date;
  _priority: 'high' | 'medium' | 'low';
  _status: 'not_started' | 'in_progress' | 'achieved' | 'modified' | 'discontinued';
  progress: number; // 0-100
  objectives: string[];
  measurableOutcomes: string[];
  interventions: string[];
  barriers?: string[];
  notes?: string;
  reviewDates: Date[];
  lastReviewed?: Date;
}

interface Intervention {
  id: string;
  name: string;
  type: 'individual_therapy' | 'group_therapy' | 'medication' | 'behavioral_intervention' | 'skill_training' | 'family_session' | 'other';
  frequency: string;
  provider?: string;
  startDate: Date;
  endDate?: Date;
  effectiveness: number; // 1-10
  adherence: number; // 0-100
  sideEffects?: string[];
  notes?: string;
  relatedGoals: string[];
}

interface Objective {
  id: string;
  goalId: string;
  description: string;
  targetDate: Date;
  _status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  _priority: 'high' | 'medium' | 'low';
  measurable: boolean;
  measurementCriteria?: string;
  progress: number; // 0-100
  lastUpdated: Date;
  notes?: string;
}

interface ProgressMeasurement {
  id: string;
  date: Date;
  type: 'standardized_scale' | 'custom_rating' | 'behavioral_count' | 'functional_assessment' | 'self_report';
  instrument?: string; // e.g., PHQ-9, GAD-7, etc.
  score?: number;
  interpretation?: string;
  notes?: string;
  trends: 'improving' | 'stable' | 'declining' | 'fluctuating';
}

interface Barrier {
  id: string;
  category: 'financial' | 'transportation' | 'scheduling' | 'motivation' | 'family' | 'medical' | 'substance_use' | 'other';
  description: string;
  impact: 'high' | 'medium' | 'low';
  _status: 'active' | 'resolved' | 'managed';
  interventions?: string[];
  notes?: string;
}

interface Collaborator {
  id: string;
  name: string;
  role: 'primary_therapist' | 'psychiatrist' | 'case_manager' | 'family_member' | 'peer_support' | 'medical_provider' | 'other';
  contact?: string;
  responsibilities: string[];
  active: boolean;
}

interface CrisisPlan {
  warningSignsEarly: string[];
  warningSignsLate: string[];
  copingStrategies: string[];
  supportContacts: { name: string; phone: string; relationship: string }[];
  emergencyContacts: { name: string; phone: string; role: string }[];
  safetyPlan: string[];
  medications?: string[];
  preferredFacility?: string;
  lastUpdated: Date;
}

interface TreatmentPlanManagerProps {
  treatmentPlan?: TreatmentPlan;
  onSavePlan?: (plan: TreatmentPlan) => void;
  onUpdateGoal?: (goalId: string, updates: Partial<TreatmentGoal>) => void;
  _onAddIntervention?: (intervention: Intervention) => void;
  onArchivePlan?: (planId: string) => void;
  readOnly?: boolean;
  isProvider?: boolean;
}

export function TreatmentPlanManager({
  treatmentPlan,
  onSavePlan,
  onUpdateGoal,
  _onAddIntervention,
  onArchivePlan,
  readOnly = false,
  isProvider = false
}: TreatmentPlanManagerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'interventions' | 'progress' | 'barriers' | 'crisis'>('overview');
  const [currentPlan, setCurrentPlan] = useState<TreatmentPlan | null>(treatmentPlan || null);
  const [_editingGoal, setEditingGoal] = useState<string | null>(null);
  const [_showGoalForm, setShowGoalForm] = useState(false);
  const [_showInterventionForm, setShowInterventionForm] = useState(false);
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [_searchTerm, _setSearchTerm] = useState('');
  const [_showPrivateNotes, _setShowPrivateNotes] = useState(_isProvider);

  // Create new treatment plan if none provided
  useEffect(() => {
    if (!currentPlan && isProvider) {
      setCurrentPlan(createNewTreatmentPlan());
    }
  }, [currentPlan, isProvider]);

  const createNewTreatmentPlan = (): TreatmentPlan => ({
    id: `plan_${Date.now()}`,
    clientId: '',
    clientName: '',
    providerId: '',
    providerName: '',
    primaryDiagnosis: [],
    createdDate: new Date(),
    lastUpdated: new Date(),
    reviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    status: 'active',
    _priority: 'medium',
    treatmentModalities: [],
    shortTermGoals: [],
    longTermGoals: [],
    interventions: [],
    objectives: [],
    measurements: [],
    barriers: [],
    strengths: []
  });

  // Calculate plan progress
  const calculatePlanProgress = () => {
    if (!currentPlan) return 0;
    const allGoals = [...currentPlan.shortTermGoals, ...currentPlan.longTermGoals];
    if (allGoals.length === 0) return 0;
    
    const totalProgress = allGoals.reduce((sum, goal) => sum + goal.progress, 0);
    return Math.round(totalProgress / allGoals.length);
  };

  // Get goals by status
  const getGoalsByStatus = (_status: TreatmentGoal['status']) => {
    if (!currentPlan) return [];
    const allGoals = [...currentPlan.shortTermGoals, ...currentPlan.longTermGoals];
    return allGoals.filter(goal => goal._status === _status);
  };

  // Get priority color
  const getPriorityColor = (_priority: string) => {
    switch (_priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status color
  const getStatusColor = (_status: string) => {
    switch (_status) {
      case 'achieved':
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'not_started':
      case 'pending': return 'text-gray-600 bg-gray-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      case 'modified': return 'text-purple-600 bg-purple-100';
      case 'discontinued': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Handle goal progress update
  const handleGoalProgressUpdate = (goalId: string, progress: number) => {
    if (!currentPlan) return;

    const updateGoalInArray = (goals: TreatmentGoal[]) => 
      goals.map(goal => 
        goal.id === goalId 
          ? { 
              ...goal, 
              progress,
              _status: progress === 100 ? 'achieved' as const : 
                     progress > 0 ? 'in_progress' as const : 'not_started' as const,
              lastReviewed: new Date()
            }
          : goal
      );

    setCurrentPlan({
      ...currentPlan,
      shortTermGoals: updateGoalInArray(currentPlan.shortTermGoals),
      longTermGoals: updateGoalInArray(currentPlan.longTermGoals),
      lastUpdated: new Date()
    });

    onUpdateGoal?.(goalId, { progress });
  };

  if (!currentPlan) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No treatment plan available</p>
          {isProvider && (
            <button
              onClick={() => setCurrentPlan(createNewTreatmentPlan())}
              className="mt-3 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Create Treatment Plan
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Treatment Plan</h1>
            <p className="text-primary-100 mt-1">
              {currentPlan.clientName}
            </p>
            <div className="flex items-center space-x-4 mt-2 text-sm">
              <span className="text-primary-200">
                Created: {new Date(currentPlan.createdDate).toLocaleDateString()}
              </span>
              <span className="text-primary-200">
                Last Updated: {new Date(currentPlan.lastUpdated).toLocaleDateString()}
              </span>
              <span className="text-primary-200">
                Review Due: {new Date(currentPlan.reviewDate).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          {/* Status and Progress */}
          <div className="text-center">
            <div className="mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentPlan._status === 'active' ? 'bg-green-500 text-white' :
                currentPlan._status === 'paused' ? 'bg-yellow-500 text-white' :
                currentPlan._status === 'completed' ? 'bg-blue-500 text-white' :
                'bg-red-500 text-white'
              }`}>
                {currentPlan._status}
              </span>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{calculatePlanProgress()}%</div>
              <div className="text-xs text-primary-200">Overall Progress</div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{getGoalsByStatus('achieved').length}</div>
            <div className="text-xs text-primary-200">Goals Achieved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{getGoalsByStatus('in_progress').length}</div>
            <div className="text-xs text-primary-200">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{currentPlan.interventions.length}</div>
            <div className="text-xs text-primary-200">Active Interventions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{currentPlan.barriers?.length || 0}</div>
            <div className="text-xs text-primary-200">Barriers Identified</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-1 px-6">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'goals', label: 'Goals', icon: Target },
            { id: 'interventions', label: 'Interventions', icon: Brain },
            { id: 'progress', label: 'Progress', icon: TrendingUp },
            { id: 'barriers', label: 'Barriers', icon: AlertCircle },
            { id: 'crisis', label: 'Crisis Plan', icon: Shield }
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
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Primary Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Primary Diagnoses</h3>
                <div className="space-y-2">
                  {currentPlan.primaryDiagnosis.map((diagnosis, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-blue-900">{diagnosis.name}</h4>
                          <p className="text-sm text-blue-700">Code: {diagnosis.code}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          diagnosis.severity === 'severe' ? 'bg-red-100 text-red-700' :
                          diagnosis.severity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {diagnosis.severity}
                        </span>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">
                        Onset: {new Date(diagnosis.onset).toLocaleDateString()}
                      </p>
                      {diagnosis.specifiers && diagnosis.specifiers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {diagnosis.specifiers.map((specifier, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {specifier}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Treatment Modalities</h3>
                <div className="space-y-2">
                  {currentPlan.treatmentModalities.map((modality) => (
                    <div key={modality.id} className="p-3 bg-purple-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-purple-900">{modality.name}</h4>
                          <p className="text-sm text-purple-700">{modality.type}</p>
                        </div>
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                          {modality.frequency}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-purple-700 mt-1">
                        <span>Duration: {modality.duration} weeks</span>
                        <span>Started: {new Date(modality.startDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Strengths and Barriers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Client Strengths</h3>
                <div className="space-y-2">
                  {currentPlan.strengths?.map((strength, index) => (
                    <div key={index} className="flex items-center p-2 bg-green-50 rounded-lg">
                      <Star className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm text-green-800">{strength}</span>
                    </div>
                  ))}
                  {!currentPlan.strengths?.length && (
                    <p className="text-gray-500 text-sm">No strengths identified yet</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Current Barriers</h3>
                <div className="space-y-2">
                  {currentPlan.barriers?.filter(b => b._status === 'active').slice(0, 3).map((barrier) => (
                    <div key={barrier.id} className="p-2 bg-red-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-red-800">{barrier.description}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          barrier.impact === 'high' ? 'bg-red-200 text-red-800' :
                          barrier.impact === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-green-200 text-green-800'
                        }`}>
                          {barrier.impact}
                        </span>
                      </div>
                    </div>
                  ))}
                  {!currentPlan.barriers?.filter(b => b._status === 'active').length && (
                    <p className="text-gray-500 text-sm">No active barriers identified</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Progress */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Progress Measurements</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                {currentPlan.measurements.length > 0 ? (
                  <div className="space-y-3">
                    {currentPlan.measurements.slice(-3).map((measurement) => (
                      <div key={measurement.id} className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{measurement.instrument || measurement.type}</span>
                          {measurement.score && (
                            <span className="ml-2 text-gray-600">Score: {measurement.score}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            measurement.trends === 'improving' ? 'bg-green-100 text-green-700' :
                            measurement.trends === 'stable' ? 'bg-blue-100 text-blue-700' :
                            measurement.trends === 'declining' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {measurement.trends}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(measurement.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No progress measurements recorded yet</p>
                )}
              </div>
            </div>

            {/* Care Team */}
            {currentPlan.collaborators && currentPlan.collaborators.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Care Team</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentPlan.collaborators.filter(c => c.active).map((collaborator) => (
                    <div key={collaborator.id} className="p-3 bg-indigo-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-indigo-900">{collaborator.name}</h4>
                        <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full">
                          {collaborator.role.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {collaborator.responsibilities.slice(0, 2).map((responsibility, index) => (
                          <p key={index} className="text-xs text-indigo-700">
                            • {responsibility}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-gray-900">Treatment Goals</h3>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as unknown)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
              {!readOnly && (
                <button
                  onClick={() => setShowGoalForm(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Goal
                </button>
              )}
            </div>

            {/* Short-term Goals */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-800">Short-term Goals</h4>
              <div className="space-y-3">
                {currentPlan.shortTermGoals
                  .filter(goal => filterPriority === 'all' || goal._priority === filterPriority)
                  .map((goal) => (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 mb-1">{goal.description}</h5>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(goal._priority)}`}>
                              {goal._priority}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(goal._status)}`}>
                              {goal._status.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-gray-500">
                              Due: {new Date(goal.targetDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {!readOnly && (
                          <button
                            onClick={() => setEditingGoal(goal.id)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600">Progress</span>
                          <span className="text-sm font-medium">{goal.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full transition-all"
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                        {!readOnly && (
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="10"
                            value={goal.progress}
                            onChange={(e) => handleGoalProgressUpdate(goal.id, parseInt(e.target.value))}
                            className="w-full"
                          />
                        )}
                      </div>

                      {/* Objectives */}
                      {goal.objectives.length > 0 && (
                        <div className="mb-3">
                          <h6 className="text-sm font-medium text-gray-700 mb-1">Objectives:</h6>
                          <div className="space-y-1">
                            {goal.objectives.map((objective, index) => (
                              <div key={index} className="flex items-start space-x-2">
                                <CheckCircle className="h-3 w-3 text-gray-400 mt-1 flex-shrink-0" />
                                <span className="text-xs text-gray-600">{objective}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Measurable Outcomes */}
                      {goal.measurableOutcomes.length > 0 && (
                        <div className="mb-3">
                          <h6 className="text-sm font-medium text-gray-700 mb-1">Measurable Outcomes:</h6>
                          <div className="space-y-1">
                            {goal.measurableOutcomes.map((outcome, index) => (
                              <div key={index} className="flex items-start space-x-2">
                                <BarChart3 className="h-3 w-3 text-gray-400 mt-1 flex-shrink-0" />
                                <span className="text-xs text-gray-600">{outcome}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Barriers */}
                      {goal.barriers && goal.barriers.length > 0 && (
                        <div className="mb-2">
                          <h6 className="text-sm font-medium text-gray-700 mb-1">Barriers:</h6>
                          <div className="flex flex-wrap gap-1">
                            {goal.barriers.map((barrier, index) => (
                              <span key={index} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                                {barrier}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {goal.lastReviewed && (
                        <div className="text-xs text-gray-500">
                          Last reviewed: {new Date(goal.lastReviewed).toLocaleDateString()}
                        </div>
                      )}
                    </motion.div>
                  ))}
              </div>
            </div>

            {/* Long-term Goals */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-800">Long-term Goals</h4>
              <div className="space-y-3">
                {currentPlan.longTermGoals
                  .filter(goal => filterPriority === 'all' || goal._priority === filterPriority)
                  .map((goal) => (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 rounded-lg p-4 bg-blue-50/30"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 mb-1">{goal.description}</h5>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(goal._priority)}`}>
                              {goal._priority}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(goal._status)}`}>
                              {goal._status.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-gray-500">
                              Target: {new Date(goal.targetDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {!readOnly && (
                          <button
                            onClick={() => setEditingGoal(goal.id)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600">Progress</span>
                          <span className="text-sm font-medium">{goal.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                        {!readOnly && (
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="10"
                            value={goal.progress}
                            onChange={(e) => handleGoalProgressUpdate(goal.id, parseInt(e.target.value))}
                            className="w-full"
                          />
                        )}
                      </div>

                      {/* Show similar structure as short-term goals */}
                      {/* ... (similar content structure as short-term goals) */}
                    </motion.div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'interventions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Active Interventions</h3>
              {!readOnly && (
                <button
                  onClick={() => setShowInterventionForm(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Intervention
                </button>
              )}
            </div>

            <div className="space-y-4">
              {currentPlan.interventions.map((intervention) => (
                <motion.div
                  key={intervention.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{intervention.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{intervention.type.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-500">
                        Frequency: {intervention.frequency}
                        {intervention.provider && ` • Provider: ${intervention.provider}`}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-gray-500">
                        Started: {new Date(intervention.startDate).toLocaleDateString()}
                      </div>
                      {intervention.endDate && (
                        <div className="text-gray-500">
                          Ends: {new Date(intervention.endDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Effectiveness and Adherence */}
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Effectiveness</span>
                        <span className="text-sm font-medium">{intervention.effectiveness}/10</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-green-600 h-1.5 rounded-full"
                          style={{ width: `${intervention.effectiveness * 10}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Adherence</span>
                        <span className="text-sm font-medium">{intervention.adherence}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${intervention.adherence}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Related Goals */}
                  {intervention.relatedGoals.length > 0 && (
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700">Related Goals:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {intervention.relatedGoals.map((goalId, index) => {
                          const goal = [...currentPlan.shortTermGoals, ...currentPlan.longTermGoals]
                            .find(g => g.id === goalId);
                          return (
                            <span key={index} className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded">
                              {goal?.description.substring(0, 30)}...
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Side Effects */}
                  {intervention.sideEffects && intervention.sideEffects.length > 0 && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-red-700">Side Effects:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {intervention.sideEffects.map((effect, index) => (
                          <span key={index} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                            {effect}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {intervention.notes && (
                    <div className="p-2 bg-gray-50 rounded text-sm">
                      <p className="text-gray-700">{intervention.notes}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Progress Tracking</h3>
            
            {/* Progress Overview Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Goal Achievement Rate</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Achieved</span>
                    <span className="text-sm font-medium text-green-600">
                      {getGoalsByStatus('achieved').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">In Progress</span>
                    <span className="text-sm font-medium text-blue-600">
                      {getGoalsByStatus('in_progress').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Not Started</span>
                    <span className="text-sm font-medium text-gray-600">
                      {getGoalsByStatus('not_started').length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Recent Measurements</h4>
                <div className="space-y-2">
                  {currentPlan.measurements.slice(-5).map((measurement) => (
                    <div key={measurement.id} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {measurement.instrument || measurement.type}
                      </span>
                      <div className="flex items-center space-x-2">
                        {measurement.score && (
                          <span className="text-sm font-medium">{measurement.score}</span>
                        )}
                        <span className={`w-2 h-2 rounded-full ${
                          measurement.trends === 'improving' ? 'bg-green-500' :
                          measurement.trends === 'stable' ? 'bg-blue-500' :
                          measurement.trends === 'declining' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Measurement Timeline */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Progress Timeline</h4>
              {currentPlan.measurements.length > 0 ? (
                <div className="space-y-4">
                  {currentPlan.measurements
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 10)
                    .map((measurement) => (
                      <div key={measurement.id} className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className={`w-3 h-3 rounded-full mt-2 ${
                            measurement.trends === 'improving' ? 'bg-green-500' :
                            measurement.trends === 'stable' ? 'bg-blue-500' :
                            measurement.trends === 'declining' ? 'bg-red-500' :
                            'bg-yellow-500'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="text-sm font-medium text-gray-900">
                                {measurement.instrument || measurement.type}
                              </h5>
                              {measurement.score && (
                                <p className="text-sm text-gray-600">Score: {measurement.score}</p>
                              )}
                              {measurement.interpretation && (
                                <p className="text-sm text-gray-600">{measurement.interpretation}</p>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(measurement.date).toLocaleDateString()}
                            </span>
                          </div>
                          {measurement.notes && (
                            <p className="text-sm text-gray-500 mt-1">{measurement.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500">No progress measurements recorded yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'barriers' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Treatment Barriers</h3>
              {!readOnly && (
                <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Barrier
                </button>
              )}
            </div>

            {/* Active Barriers */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-red-800">Active Barriers</h4>
              <div className="space-y-3">
                {currentPlan.barriers?.filter(barrier => barrier._status === 'active').map((barrier) => (
                  <motion.div
                    key={barrier.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-red-200 bg-red-50 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h5 className="font-medium text-red-900">{barrier.description}</h5>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                            {barrier.category.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            barrier.impact === 'high' ? 'bg-red-200 text-red-800' :
                            barrier.impact === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-green-200 text-green-800'
                          }`}>
                            {barrier.impact} impact
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {barrier.interventions && barrier.interventions.length > 0 && (
                      <div className="mt-2">
                        <h6 className="text-sm font-medium text-red-800 mb-1">Interventions:</h6>
                        <div className="space-y-1">
                          {barrier.interventions.map((intervention, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <Lightbulb className="h-3 w-3 text-red-600 mt-1 flex-shrink-0" />
                              <span className="text-sm text-red-700">{intervention}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {barrier.notes && (
                      <div className="mt-2 p-2 bg-red-100 rounded text-sm">
                        <p className="text-red-800">{barrier.notes}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Resolved/Managed Barriers */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-green-800">Resolved/Managed Barriers</h4>
              <div className="space-y-3">
                {currentPlan.barriers?.filter(barrier => barrier._status !== 'active').map((barrier) => (
                  <motion.div
                    key={barrier.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-green-200 bg-green-50 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h5 className="font-medium text-green-900">{barrier.description}</h5>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                            {barrier.category.replace('_', ' ')}
                          </span>
                          <span className="px-2 py-1 text-xs bg-green-200 text-green-800 rounded-full">
                            {barrier._status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {barrier.notes && (
                      <div className="mt-2 p-2 bg-green-100 rounded text-sm">
                        <p className="text-green-800">{barrier.notes}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'crisis' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Crisis Management Plan</h3>
              <div className="flex items-center space-x-2">
                {currentPlan.crisisPlan && (
                  <span className="text-sm text-gray-500">
                    Last updated: {new Date(currentPlan.crisisPlan.lastUpdated).toLocaleDateString()}
                  </span>
                )}
                {!readOnly && (
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center">
                    <Edit2 className="h-4 w-4 mr-1" />
                    Update Plan
                  </button>
                )}
              </div>
            </div>

            {currentPlan.crisisPlan ? (
              <div className="space-y-6">
                {/* Warning Signs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                      Early Warning Signs
                    </h4>
                    <div className="space-y-2">
                      {currentPlan.crisisPlan.warningSignsEarly.map((sign, index) => (
                        <div key={index} className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <span className="text-sm text-yellow-800">{sign}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                      Late Warning Signs
                    </h4>
                    <div className="space-y-2">
                      {currentPlan.crisisPlan.warningSignsLate.map((sign, index) => (
                        <div key={index} className="p-2 bg-red-50 border border-red-200 rounded">
                          <span className="text-sm text-red-800">{sign}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Coping Strategies */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <Brain className="h-5 w-5 text-blue-500 mr-2" />
                    Coping Strategies
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentPlan.crisisPlan.copingStrategies.map((strategy, index) => (
                      <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <span className="text-sm text-blue-800">{strategy}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Safety Plan */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <Shield className="h-5 w-5 text-green-500 mr-2" />
                    Safety Plan Steps
                  </h4>
                  <div className="space-y-2">
                    {currentPlan.crisisPlan.safetyPlan.map((step, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded">
                        <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <span className="text-sm text-green-800">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contacts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <Users className="h-5 w-5 text-indigo-500 mr-2" />
                      Support Contacts
                    </h4>
                    <div className="space-y-2">
                      {currentPlan.crisisPlan.supportContacts.map((contact, index) => (
                        <div key={index} className="p-3 bg-indigo-50 border border-indigo-200 rounded">
                          <div className="font-medium text-indigo-900">{contact.name}</div>
                          <div className="text-sm text-indigo-700">{contact.relationship}</div>
                          <div className="text-sm text-indigo-600">{contact.phone}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <Activity className="h-5 w-5 text-red-500 mr-2" />
                      Emergency Contacts
                    </h4>
                    <div className="space-y-2">
                      {currentPlan.crisisPlan.emergencyContacts.map((contact, index) => (
                        <div key={index} className="p-3 bg-red-50 border border-red-200 rounded">
                          <div className="font-medium text-red-900">{contact.name}</div>
                          <div className="text-sm text-red-700">{contact.role}</div>
                          <div className="text-sm text-red-600 font-mono">{contact.phone}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Medications & Facility */}
                {(currentPlan.crisisPlan.medications || currentPlan.crisisPlan.preferredFacility) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {currentPlan.crisisPlan.medications && (
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Current Medications</h4>
                        <div className="space-y-1">
                          {currentPlan.crisisPlan.medications.map((medication, index) => (
                            <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                              {medication}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentPlan.crisisPlan.preferredFacility && (
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Preferred Emergency Facility</h4>
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                          <span className="text-purple-800">{currentPlan.crisisPlan.preferredFacility}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 mb-4">No crisis plan has been created yet</p>
                {!readOnly && (
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    Create Crisis Plan
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Button */}
      {!readOnly && (
        <div className="p-6 bg-gray-50 border-t">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Last saved: {new Date(currentPlan.lastUpdated).toLocaleString()}</span>
              <span>•</span>
              <span>Next review: {new Date(currentPlan.reviewDate).toLocaleDateString()}</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onArchivePlan?.(currentPlan.id)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
              <button
                onClick={() => onSavePlan?.(currentPlan)}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}