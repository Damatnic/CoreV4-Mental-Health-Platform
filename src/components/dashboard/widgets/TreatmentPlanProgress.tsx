import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, TrendingUp, CheckCircle, Circle, _AlertCircle,
  Brain, Heart, Activity, Book, Users, Award, Calendar,
  ChevronRight, Edit2, Plus, Zap, Flag, Clock, _BarChart3,
  FileText, MessageSquare, _Star, Shield, _Sparkles
} from 'lucide-react';

interface TreatmentGoal {
  id: string;
  _category: 'symptom_reduction' | 'behavioral' | 'cognitive' | 'social' | 'lifestyle' | 'medication';
  title: string;
  description: string;
  targetDate?: Date;
  createdDate: Date;
  status: 'not_started' | 'in_progress' | 'achieved' | 'modified' | 'discontinued';
  progress: number; // 0-100
  milestones: Milestone[];
  interventions: string[];
  measuredBy: string;
  baselineValue?: number;
  targetValue?: number;
  currentValue?: number;
  priority: 'high' | 'medium' | 'low';
  assignedBy: string;
  collaborators?: string[];
  notes?: string;
}

interface Milestone {
  id: string;
  title: string;
  dueDate?: Date;
  completed: boolean;
  completedDate?: Date;
  evidence?: string;
}

interface SkillPractice {
  id: string;
  type: 'CBT' | 'DBT' | 'ACT' | 'Mindfulness' | 'EMDR' | 'Other';
  skillName: string;
  _category: string;
  practiceFrequency: 'daily' | 'weekly' | 'as_needed';
  lastPracticed?: Date;
  totalPractices: number;
  effectiveness: number; // 1-10
  notes?: string;
}

interface TherapeuticHomework {
  id: string;
  assignedDate: Date;
  dueDate?: Date;
  type: 'worksheet' | 'practice' | 'reflection' | 'behavioral' | 'reading';
  title: string;
  description: string;
  completed: boolean;
  completedDate?: Date;
  feedback?: string;
  difficulty: 'easy' | 'moderate' | 'challenging';
  timeEstimate?: number; // minutes
}

interface TreatmentUpdate {
  id: string;
  date: Date;
  type: 'progress_note' | 'plan_update' | 'goal_revision' | 'milestone_achieved';
  content: string;
  addedBy: string;
  relatedGoalId?: string;
}

interface TreatmentPlanProgressProps {
  goals?: TreatmentGoal[];
  skills?: SkillPractice[];
  homework?: TherapeuticHomework[];
  updates?: TreatmentUpdate[];
  _onUpdateGoal?: (goal: TreatmentGoal) => void;
  _onAddMilestone?: (goalId: string, milestone: Milestone) => void;
  onCompleteHomework?: (homework: TherapeuticHomework) => void;
  onPracticeSkill?: (skill: SkillPractice) => void;
  onAddGoal?: () => void;
  _onViewDetails?: (goalId: string) => void;
}

export function TreatmentPlanProgress({
  goals = [],
  skills = [],
  homework = [],
  updates = [],
  _onUpdateGoal,
  _onAddMilestone,
  onCompleteHomework,
  onPracticeSkill,
  onAddGoal,
  _onViewDetails
}: TreatmentPlanProgressProps) {
  const [activeTab, _setActiveTab] = useState<'goals' | 'skills' | 'homework' | 'timeline'>('goals');
  const [selectedGoal, _setSelectedGoal] = useState<TreatmentGoal | null>(null);
  const [__showGoalDetails, setShowGoalDetails] = useState(false);
  const [expandedSkillType, _setExpandedSkillType] = useState<string | null>(null);

  // Calculate overall treatment progress
  const calculateOverallProgress = () => {
    if (goals.length === 0) return 0;
    const totalProgress = goals.reduce((sum, goal) => sum + goal.progress, 0);
    return Math.round(totalProgress / goals.length);
  };

  // Get active goals count
  const activeGoalsCount = goals.filter(g => g.status === 'in_progress').length;
  const achievedGoalsCount = goals.filter(g => g.status === 'achieved').length;

  // Get pending homework count
  const pendingHomeworkCount = homework.filter(h => !h.completed).length;

  // Group skills by type
  const _groupedSkills = skills.reduce((acc, skill) => {
    if (!acc[skill.type]) {
      acc[skill.type] = [];
    }
    acc[skill.type]!.push(_skill);
    return acc;
  }, {} as Record<string, SkillPractice[]>);

  // Get goal category icon
  const getGoalIcon = (_category: string) => {
    switch (_category) {
      case 'symptom_reduction': return <Activity className="h-5 w-5" />;
      case 'behavioral': return <Target className="h-5 w-5" />;
      case 'cognitive': return <Brain className="h-5 w-5" />;
      case 'social': return <Users className="h-5 w-5" />;
      case 'lifestyle': return <Heart className="h-5 w-5" />;
      case 'medication': return <Shield className="h-5 w-5" />;
      default: return <Flag className="h-5 w-5" />;
    }
  };

  // Get goal category color
  const getGoalColor = (_category: string) => {
    switch (_category) {
      case 'symptom_reduction': return 'text-red-600 bg-red-50';
      case 'behavioral': return 'text-blue-600 bg-blue-50';
      case 'cognitive': return 'text-purple-600 bg-purple-50';
      case 'social': return 'text-green-600 bg-green-50';
      case 'lifestyle': return 'text-orange-600 bg-orange-50';
      case 'medication': return 'text-indigo-600 bg-indigo-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Get skill type color
  const getSkillTypeColor = (type: string) => {
    switch (type) {
      case 'CBT': return 'bg-blue-100 text-blue-700';
      case 'DBT': return 'bg-purple-100 text-purple-700';
      case 'ACT': return 'bg-green-100 text-green-700';
      case 'Mindfulness': return 'bg-teal-100 text-teal-700';
      case 'EMDR': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const overallProgress = calculateOverallProgress();

  return (
    <div className="h-full flex flex-col">
      {/* Progress Overview */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-primary-600">Overall Progress</p>
              <p className="text-xl font-bold text-primary-700">{overallProgress}%</p>
            </div>
            <TrendingUp className="h-5 w-5 text-primary-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600">Active Goals</p>
              <p className="text-xl font-bold text-blue-700">{activeGoalsCount}</p>
            </div>
            <Target className="h-5 w-5 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600">Achieved</p>
              <p className="text-xl font-bold text-green-700">{achievedGoalsCount}</p>
            </div>
            <Award className="h-5 w-5 text-green-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-600">Homework Due</p>
              <p className="text-xl font-bold text-orange-700">{pendingHomeworkCount}</p>
            </div>
            <Book className="h-5 w-5 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-4 border-b border-gray-200">
        {(['goals', 'skills', 'homework', 'timeline'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(_tab)}
            className={`px-4 py-2 text-sm font-medium transition-all capitalize ${
              activeTab === tab
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'goals' && 'Treatment Goals'}
            {tab === 'skills' && 'Skill Practice'}
            {tab === 'homework' && 'Homework'}
            {tab === 'timeline' && 'Timeline'}
            {tab === 'homework' && pendingHomeworkCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-orange-100 text-orange-600 rounded-full">
                {pendingHomeworkCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'goals' && (
          <div className="space-y-4">
            {/* Add Goal Button */}
            <button
              onClick={onAddGoal}
              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 transition-colors flex items-center justify-center text-gray-600 hover:text-primary-600"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Treatment Goal
            </button>

            {/* Goals List */}
            {goals.map((goal) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${getGoalColor(goal._category)}`}>
                      {getGoalIcon(goal._category)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{goal.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                      <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : 'No deadline'}
                        </span>
                        <span className={`px-2 py-1 rounded-full ${
                          goal.priority === 'high' ? 'bg-red-100 text-red-700' :
                          goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {goal.priority} priority
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedGoal(_goal);
                      setShowGoalDetails(true);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium text-primary-600">{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-primary-400 to-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>

                {/* Milestones */}
                {goal.milestones.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-700">Milestones</p>
                    {goal.milestones.slice(0, 3).map((milestone) => (
                      <div key={milestone.id} className="flex items-center space-x-2">
                        {milestone.completed ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className={`text-sm ${milestone.completed ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                          {milestone.title}
                        </span>
                      </div>
                    ))}
                    {goal.milestones.length > 3 && (
                      <button className="text-xs text-primary-600 hover:text-primary-700">
                        +{goal.milestones.length - 3} more
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-4">
            {Object.entries(_groupedSkills).map(([type, typeSkills]) => (
              <div key={type} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedSkillType(expandedSkillType === type ? null : type)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSkillTypeColor(type)}`}>
                      {type}
                    </span>
                    <span className="text-sm text-gray-600">
                      {typeSkills.length} skill{typeSkills.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${
                    expandedSkillType === type ? 'rotate-90' : ''
                  }`} />
                </button>
                
                <AnimatePresence>
                  {expandedSkillType === type && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="border-t border-gray-100"
                    >
                      <div className="p-4 space-y-3">
                        {typeSkills.map((skill) => (
                          <div key={skill.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{skill.skillName}</h5>
                              <div className="flex items-center space-x-3 mt-1 text-xs text-gray-600">
                                <span>{skill._category}</span>
                                <span>•</span>
                                <span>{skill.practiceFrequency.replace('_', ' ')}</span>
                                <span>•</span>
                                <span>{skill.totalPractices} practices</span>
                              </div>
                              <div className="flex items-center mt-2">
                                <span className="text-xs text-gray-500 mr-2">Effectiveness:</span>
                                <div className="flex space-x-1">
                                  {[...Array(10)].map((_, i) => (
                                    <div
                                      key={i}
                                      className={`h-2 w-2 rounded-full ${
                                        i < skill.effectiveness ? 'bg-green-500' : 'bg-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => onPracticeSkill?.(_skill)}
                              className="px-3 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                            >
                              <Zap className="h-4 w-4 mr-1" />
                              Practice
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {Object.keys(_groupedSkills).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Brain className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No skills tracked yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'homework' && (
          <div className="space-y-3">
            {homework.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Book className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No homework assignments</p>
              </div>
            ) : (
              homework
                .sort((a, b) => {
                  if (a.completed && !b.completed) return 1;
                  if (!a.completed && b.completed) return -1;
                  return 0;
                })
                .map((hw) => (
                  <motion.div
                    key={hw.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border ${
                      hw.completed 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className={`font-medium ${
                            hw.completed ? 'text-gray-600 line-through' : 'text-gray-900'
                          }`}>
                            {hw.title}
                          </h4>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            hw.type === 'worksheet' ? 'bg-blue-100 text-blue-700' :
                            hw.type === 'practice' ? 'bg-green-100 text-green-700' :
                            hw.type === 'reflection' ? 'bg-purple-100 text-purple-700' :
                            hw.type === 'behavioral' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {hw.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{hw.description}</p>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          {hw.dueDate && (
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Due {new Date(hw.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          {hw.timeEstimate && (
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              ~{hw.timeEstimate} min
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full ${
                            hw.difficulty === 'challenging' ? 'bg-red-100 text-red-700' :
                            hw.difficulty === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {hw.difficulty}
                          </span>
                        </div>
                      </div>
                      {!hw.completed && (
                        <button
                          onClick={() => onCompleteHomework?.(hw)}
                          className="ml-3 p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      )}
                      {hw.completed && (
                        <CheckCircle className="h-6 w-6 text-green-500 ml-3" />
                      )}
                    </div>
                  </motion.div>
                ))
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-3">
            {updates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No updates yet</p>
              </div>
            ) : (
              updates
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((update) => (
                  <motion.div
                    key={update.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex space-x-3"
                  >
                    <div className={`p-2 rounded-full ${
                      update.type === 'milestone_achieved' ? 'bg-green-100' :
                      update.type === 'goal_revision' ? 'bg-yellow-100' :
                      update.type === 'plan_update' ? 'bg-blue-100' :
                      'bg-gray-100'
                    }`}>
                      {update.type === 'milestone_achieved' ? (
                        <Award className="h-4 w-4 text-green-600" />
                      ) : update.type === 'goal_revision' ? (
                        <Edit2 className="h-4 w-4 text-yellow-600" />
                      ) : update.type === 'plan_update' ? (
                        <FileText className="h-4 w-4 text-blue-600" />
                      ) : (
                        <MessageSquare className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{update.content}</p>
                      <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                        <span>{update.addedBy}</span>
                        <span>•</span>
                        <span>{new Date(update.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
            )}
          </div>
        )}
      </div>

      {/* Goal Details Modal */}
      <AnimatePresence>
        {showGoalDetails && selectedGoal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowGoalDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold mb-4">{selectedGoal.title}</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
                  <p className="text-gray-900">{selectedGoal.description}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Measured By</p>
                  <p className="text-gray-900">{selectedGoal.measuredBy}</p>
                </div>
                
                {selectedGoal.currentValue !== undefined && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Current Progress</p>
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-600">Baseline: {selectedGoal.baselineValue}</span>
                      <span className="text-primary-600 font-medium">Current: {selectedGoal.currentValue}</span>
                      <span className="text-gray-600">Target: {selectedGoal.targetValue}</span>
                    </div>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Interventions</p>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {selectedGoal.interventions.map((intervention, idx) => (
                      <li key={idx}>{intervention}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Milestones</p>
                  <div className="space-y-2">
                    {selectedGoal.milestones.map((milestone) => (
                      <div key={milestone.id} className="flex items-center space-x-2">
                        {milestone.completed ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className={`text-sm ${milestone.completed ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                          {milestone.title}
                        </span>
                        {milestone.dueDate && (
                          <span className="text-xs text-gray-500">
                            ({new Date(milestone.dueDate).toLocaleDateString()})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowGoalDetails(false)}
                className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}