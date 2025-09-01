import { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, AlertTriangle, Activity, 
  Calendar, Clock, Target, Shield, Brain, Heart,
  Zap, AlertCircle, CheckCircle, Info, ChevronRight,
  BarChart3, LineChart, PieChart, Eye, EyeOff, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, Bar, Radar, Area } from 'recharts';
import { useAuth } from '../../../contexts/AuthContext';
import { logger, LogCategory } from '../../../services/logging/logger';

interface TriggerPattern {
  id: string;
  name: string;
  category: 'environmental' | 'social' | 'physical' | 'emotional' | 'behavioral';
  frequency: number;
  impact: 'low' | 'medium' | 'high';
  lastOccurrence: Date;
  trend: 'increasing' | 'stable' | 'decreasing';
  description: string;
  preventionStrategies: string[];
}

interface WarningSign {
  id: string;
  sign: string;
  severity: 'mild' | 'moderate' | 'severe';
  detected: boolean;
  confidence: number; // 0-100
  lastDetected?: Date;
  actionRequired: boolean;
}

interface CrisisTimeline {
  timestamp: Date;
  event: string;
  type: 'trigger' | 'warning' | 'intervention' | 'resolution';
  severity: 'low' | 'medium' | 'high';
  outcome?: string;
}

interface PreventionMetrics {
  preventedCrises: number;
  earlyInterventions: number;
  successRate: number;
  averageResponseTime: number; // in minutes
  riskReduction: number; // percentage
}

interface PatternRecognition {
  timeOfDay: { morning: number; afternoon: number; evening: number; night: number };
  dayOfWeek: { [key: string]: number };
  seasonal: { spring: number; summer: number; fall: number; winter: number };
  weatherCorrelation: { sunny: number; cloudy: number; rainy: number };
  socialContext: { alone: number; withOthers: number; crowded: number };
}

export function CrisisPreventionDashboard() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'overview' | 'patterns' | 'timeline' | 'prevention'>('overview');
  const [showSensitiveData, setShowSensitiveData] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  
  // State for pattern recognition data
  const [triggers, setTriggers] = useState<TriggerPattern[]>([
    {
      id: '1',
      name: 'Work Stress',
      category: 'environmental',
      frequency: 8,
      impact: 'high',
      lastOccurrence: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      trend: 'increasing',
      description: 'Deadline pressure and workload',
      preventionStrategies: ['Time management', 'Delegation', 'Regular breaks']
    },
    {
      id: '2',
      name: 'Social Isolation',
      category: 'social',
      frequency: 5,
      impact: 'medium',
      lastOccurrence: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      trend: 'stable',
      description: 'Extended periods without social contact',
      preventionStrategies: ['Schedule social activities', 'Join support groups', 'Regular check-ins']
    },
    {
      id: '3',
      name: 'Sleep Disruption',
      category: 'physical',
      frequency: 12,
      impact: 'high',
      lastOccurrence: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      trend: 'increasing',
      description: 'Poor sleep quality or insomnia',
      preventionStrategies: ['Sleep hygiene', 'Relaxation techniques', 'Consistent schedule']
    }
  ]);

  const [warningSignsChecklist, setWarningSignsChecklist] = useState<WarningSign[]>([
    {
      id: '1',
      sign: 'Increased irritability or mood swings',
      severity: 'moderate',
      detected: true,
      confidence: 75,
      lastDetected: new Date(),
      actionRequired: true
    },
    {
      id: '2',
      sign: 'Withdrawal from social activities',
      severity: 'moderate',
      detected: true,
      confidence: 60,
      lastDetected: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      actionRequired: false
    },
    {
      id: '3',
      sign: 'Changes in sleep patterns',
      severity: 'mild',
      detected: true,
      confidence: 85,
      lastDetected: new Date(),
      actionRequired: true
    },
    {
      id: '4',
      sign: 'Difficulty concentrating',
      severity: 'mild',
      detected: false,
      confidence: 0,
      actionRequired: false
    },
    {
      id: '5',
      sign: 'Hopelessness or despair',
      severity: 'severe',
      detected: false,
      confidence: 0,
      actionRequired: false
    }
  ]);

  const [preventionMetrics] = useState<PreventionMetrics>({
    preventedCrises: 7,
    earlyInterventions: 23,
    successRate: 82,
    averageResponseTime: 15,
    riskReduction: 65
  });

  const [patternData] = useState<PatternRecognition>({
    timeOfDay: { morning: 20, afternoon: 35, evening: 60, night: 85 },
    dayOfWeek: { 
      Monday: 70, Tuesday: 60, Wednesday: 55, Thursday: 50, 
      Friday: 45, Saturday: 30, Sunday: 40 
    },
    seasonal: { spring: 40, summer: 30, fall: 50, winter: 70 },
    weatherCorrelation: { sunny: 25, cloudy: 50, rainy: 75 },
    socialContext: { alone: 80, withOthers: 30, crowded: 45 }
  });

  // Calculate overall risk score based on warning signs and triggers
  const overallRiskScore = useMemo(() => {
    const activeWarnings = warningSignsChecklist.filter(w => w.detected);
    const warningScore = activeWarnings.reduce((sum, w) => {
      const severityMultiplier = w.severity === 'severe' ? 3 : w.severity === 'moderate' ? 2 : 1;
      return sum + (w.confidence / 100) * severityMultiplier * 20;
    }, 0);

    const triggerScore = triggers.reduce((sum, t) => {
      const impactMultiplier = t.impact === 'high' ? 3 : t.impact === 'medium' ? 2 : 1;
      const trendMultiplier = t.trend === 'increasing' ? 1.5 : t.trend === 'stable' ? 1 : 0.5;
      return sum + (t.frequency * impactMultiplier * trendMultiplier);
    }, 0);

    return Math.min(100, (warningScore + triggerScore) / 2);
  }, [warningSignsChecklist, triggers]);

  // Generate prevention suggestions based on current patterns
  const preventionSuggestions = useMemo(() => {
    const suggestions = [];
    
    // Time-based suggestions
    const highRiskTimes = Object.entries(patternData.timeOfDay)
      .filter(([_, risk]) => risk > 60)
      .map(([time]) => time);
    
    if (highRiskTimes.length > 0) {
      suggestions.push({
        type: 'schedule',
        priority: 'high',
        title: `High-risk times: ${highRiskTimes.join(', ')}`,
        action: 'Schedule supportive activities during these periods',
        icon: Clock
      });
    }

    // Trigger-based suggestions
    const increasingTriggers = triggers.filter(t => t.trend === 'increasing' && t.impact === 'high');
    if (increasingTriggers.length > 0) {
      suggestions.push({
        type: 'trigger',
        priority: 'high',
        title: `Rising trigger: ${increasingTriggers[0]?.name || 'Unknown'}`,
        action: increasingTriggers[0]?.preventionStrategies?.[0] || 'No strategy available',
        icon: TrendingUp
      });
    }

    // Warning sign suggestions
    const severeWarnings = warningSignsChecklist.filter(w => w.detected && w.severity === 'severe');
    if (severeWarnings.length > 0) {
      suggestions.push({
        type: 'warning',
        priority: 'critical',
        title: 'Severe warning signs detected',
        action: 'Contact your therapist or crisis support immediately',
        icon: AlertTriangle
      });
    }

    return suggestions;
  }, [patternData, triggers, warningSignsChecklist]);

  // Handle warning sign checkbox changes
  const toggleWarningSign = (signId: string) => {
    setWarningSignsChecklist(prev => prev.map(sign => {
      if (sign.id === signId) {
        const newDetected = !sign.detected;
        return {
          ...sign,
          detected: newDetected,
          confidence: newDetected ? 75 : 0,
          lastDetected: newDetected ? new Date() : sign.lastDetected,
          actionRequired: newDetected && sign.severity !== 'mild'
        };
      }
      return sign;
    }));

    // Log the change for tracking
    logger.info('Warning sign status changed', { 
      category: LogCategory.CRISIS,
      signId,
      newStatus: !warningSignsChecklist.find(s => s.id === signId)?.detected
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Risk Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Crisis Prevention Center</h2>
            <p className="text-gray-600">Early detection and intervention system</p>
          </div>
          
          {/* Overall Risk Indicator */}
          <div className="text-center">
            <div className={`relative w-24 h-24 rounded-full ${
              overallRiskScore > 70 ? 'bg-red-100' : 
              overallRiskScore > 40 ? 'bg-yellow-100' : 'bg-green-100'
            }`}>
              <svg className="absolute inset-0 w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className={
                    overallRiskScore > 70 ? 'text-red-500' : 
                    overallRiskScore > 40 ? 'text-yellow-500' : 'text-green-500'
                  }
                  strokeDasharray={`${(overallRiskScore / 100) * 226} 226`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{Math.round(overallRiskScore)}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">Risk Level</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-white bg-opacity-70 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{preventionMetrics.preventedCrises}</p>
                <p className="text-xs text-gray-600">Crises Prevented</p>
              </div>
            </div>
          </div>
          <div className="bg-white bg-opacity-70 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{preventionMetrics.earlyInterventions}</p>
                <p className="text-xs text-gray-600">Early Interventions</p>
              </div>
            </div>
          </div>
          <div className="bg-white bg-opacity-70 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{preventionMetrics.successRate}%</p>
                <p className="text-xs text-gray-600">Success Rate</p>
              </div>
            </div>
          </div>
          <div className="bg-white bg-opacity-70 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{preventionMetrics.averageResponseTime}m</p>
                <p className="text-xs text-gray-600">Avg Response</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'patterns', label: 'Patterns', icon: Brain },
              { id: 'timeline', label: 'Timeline', icon: Calendar },
              { id: 'prevention', label: 'Prevention', icon: Shield }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`flex-1 py-3 px-4 flex items-center justify-center space-x-2 font-medium text-sm transition-colors ${
                  activeView === tab.id
                    ? 'border-b-2 border-primary-500 text-primary-700 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Overview Tab */}
            {activeView === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Warning Signs Checklist */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Warning Signs Checklist</h3>
                    <button
                      onClick={() => setShowSensitiveData(!showSensitiveData)}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      {showSensitiveData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {warningSignsChecklist.map((sign) => (
                      <div
                        key={sign.id}
                        className={`p-3 rounded-lg border ${
                          sign.detected 
                            ? sign.severity === 'severe' ? 'border-red-300 bg-red-50' :
                              sign.severity === 'moderate' ? 'border-yellow-300 bg-yellow-50' :
                              'border-blue-300 bg-blue-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            checked={sign.detected}
                            onChange={() => toggleWarningSign(sign.id)}
                            className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <label className="font-medium text-gray-900">
                                {showSensitiveData ? sign.sign : '••••••••'}
                              </label>
                              <div className="flex items-center space-x-2">
                                {sign.actionRequired && (
                                  <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded">
                                    Action Required
                                  </span>
                                )}
                                <span className={`px-2 py-1 text-xs rounded ${
                                  sign.severity === 'severe' ? 'bg-red-100 text-red-700' :
                                  sign.severity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {sign.severity}
                                </span>
                              </div>
                            </div>
                            {sign.detected && sign.confidence > 0 && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                  <span>Confidence: {sign.confidence}%</span>
                                  {sign.lastDetected && (
                                    <span>Last: {new Date(sign.lastDetected).toLocaleDateString()}</span>
                                  )}
                                </div>
                                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      sign.severity === 'severe' ? 'bg-red-500' :
                                      sign.severity === 'moderate' ? 'bg-yellow-500' :
                                      'bg-blue-500'
                                    }`}
                                    style={{ width: `${sign.confidence}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prevention Suggestions */}
                {preventionSuggestions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Immediate Actions</h3>
                    <div className="space-y-3">
                      {preventionSuggestions.map((suggestion, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className={`p-4 rounded-lg border ${
                            suggestion.priority === 'critical' ? 'border-red-300 bg-red-50' :
                            suggestion.priority === 'high' ? 'border-orange-300 bg-orange-50' :
                            'border-blue-300 bg-blue-50'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <suggestion.icon className={`h-5 w-5 mt-0.5 ${
                              suggestion.priority === 'critical' ? 'text-red-600' :
                              suggestion.priority === 'high' ? 'text-orange-600' :
                              'text-blue-600'
                            }`} />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{suggestion.title}</p>
                              <p className="text-sm text-gray-600 mt-1">{suggestion.action}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Patterns Tab */}
            {activeView === 'patterns' && (
              <motion.div
                key="patterns"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Trigger Patterns */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Identified Trigger Patterns</h3>
                  <div className="grid gap-4">
                    {triggers.map((trigger) => (
                      <div key={trigger.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium text-gray-900">{trigger.name}</h4>
                              <span className={`px-2 py-1 text-xs rounded ${
                                trigger.impact === 'high' ? 'bg-red-100 text-red-700' :
                                trigger.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {trigger.impact} impact
                              </span>
                              <span className="flex items-center text-xs text-gray-600">
                                {trigger.trend === 'increasing' ? (
                                  <><TrendingUp className="h-3 w-3 text-red-500 mr-1" /> Increasing</>
                                ) : trigger.trend === 'decreasing' ? (
                                  <><TrendingDown className="h-3 w-3 text-green-500 mr-1" /> Decreasing</>
                                ) : (
                                  <>Stable</>
                                )}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{trigger.description}</p>
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="text-gray-500">
                                Frequency: {trigger.frequency} times/month
                              </span>
                              <span className="text-gray-500">
                                Last: {new Date(trigger.lastOccurrence).toLocaleDateString()}
                              </span>
                            </div>
                            
                            {/* Prevention Strategies */}
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs font-medium text-gray-700 mb-2">Prevention Strategies:</p>
                              <div className="flex flex-wrap gap-2">
                                {trigger.preventionStrategies.map((strategy, idx) => (
                                  <span key={idx} className="px-2 py-1 text-xs bg-white rounded border border-gray-200">
                                    {strategy}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pattern Analysis */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Pattern Analysis</h3>
                  
                  {/* Time of Day Patterns */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Risk by Time of Day</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(patternData.timeOfDay).map(([time, risk]) => (
                        <div key={time} className="text-center">
                          <div className="relative h-20 bg-gray-100 rounded">
                            <div 
                              className={`absolute bottom-0 left-0 right-0 rounded transition-all ${
                                risk > 60 ? 'bg-red-400' : risk > 30 ? 'bg-yellow-400' : 'bg-green-400'
                              }`}
                              style={{ height: `${risk}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-600 mt-1 capitalize">{time}</p>
                          <p className="text-xs font-medium">{risk}%</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Day of Week Patterns */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Risk by Day of Week</h4>
                    <div className="space-y-2">
                      {Object.entries(patternData.dayOfWeek).map(([day, risk]) => (
                        <div key={day} className="flex items-center space-x-3">
                          <span className="text-sm text-gray-600 w-20">{day.slice(0, 3)}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                            <div 
                              className={`absolute left-0 top-0 h-4 rounded-full ${
                                risk > 60 ? 'bg-red-400' : risk > 30 ? 'bg-yellow-400' : 'bg-green-400'
                              }`}
                              style={{ width: `${risk}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700 w-12 text-right">{risk}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Environmental Correlations */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Environmental Factors</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-2">Weather Impact</p>
                        <div className="space-y-2">
                          {Object.entries(patternData.weatherCorrelation).map(([weather, risk]) => (
                            <div key={weather} className="flex items-center justify-between">
                              <span className="text-sm capitalize">{weather}</span>
                              <span className={`text-sm font-medium ${
                                risk > 60 ? 'text-red-600' : risk > 30 ? 'text-yellow-600' : 'text-green-600'
                              }`}>{risk}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-2">Social Context</p>
                        <div className="space-y-2">
                          {Object.entries(patternData.socialContext).map(([context, risk]) => (
                            <div key={context} className="flex items-center justify-between">
                              <span className="text-sm capitalize">{context}</span>
                              <span className={`text-sm font-medium ${
                                risk > 60 ? 'text-red-600' : risk > 30 ? 'text-yellow-600' : 'text-green-600'
                              }`}>{risk}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Timeline Tab */}
            {activeView === 'timeline' && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Crisis Timeline</h3>
                  <select
                    value={selectedTimeRange}
                    onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="week">Past Week</option>
                    <option value="month">Past Month</option>
                    <option value="quarter">Past Quarter</option>
                    <option value="year">Past Year</option>
                  </select>
                </div>

                {/* Timeline visualization would go here */}
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                  <div className="space-y-6">
                    {[
                      {
                        date: new Date(),
                        type: 'intervention',
                        title: 'Early intervention successful',
                        description: 'Recognized warning signs and used coping strategies',
                        severity: 'low'
                      },
                      {
                        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                        type: 'warning',
                        title: 'Multiple warning signs detected',
                        description: 'Sleep disruption and social withdrawal observed',
                        severity: 'medium'
                      },
                      {
                        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                        type: 'trigger',
                        title: 'Work stress trigger identified',
                        description: 'Project deadline causing increased anxiety',
                        severity: 'medium'
                      },
                      {
                        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                        type: 'resolution',
                        title: 'Crisis resolved',
                        description: 'Successfully managed crisis with support system',
                        severity: 'low'
                      }
                    ].map((event, idx) => (
                      <div key={idx} className="relative flex items-start ml-10">
                        <div className={`absolute -left-7 w-4 h-4 rounded-full border-2 ${
                          event.type === 'trigger' ? 'bg-yellow-500 border-yellow-300' :
                          event.type === 'warning' ? 'bg-orange-500 border-orange-300' :
                          event.type === 'intervention' ? 'bg-blue-500 border-blue-300' :
                          'bg-green-500 border-green-300'
                        }`}></div>
                        <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{event.title}</p>
                              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded ${
                              event.severity === 'high' ? 'bg-red-100 text-red-700' :
                              event.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {event.type}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {event.date.toLocaleDateString()} at {event.date.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Prevention Tab */}
            {activeView === 'prevention' && (
              <motion.div
                key="prevention"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Prevention Toolkit</h3>
                  
                  {/* Prevention Actions */}
                  <div className="grid gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">Cognitive Strategies</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Challenge negative thoughts, practice mindfulness, use grounding techniques
                          </p>
                          <button className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                            Learn techniques →
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Heart className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">Self-Care Activities</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Regular exercise, healthy sleep schedule, balanced nutrition, relaxation
                          </p>
                          <button className="mt-2 text-sm text-green-600 hover:text-green-700 font-medium">
                            View activities →
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">Social Support</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Connect with support network, join groups, schedule regular check-ins
                          </p>
                          <button className="mt-2 text-sm text-purple-600 hover:text-purple-700 font-medium">
                            Build network →
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Shield className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">Professional Support</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Regular therapy sessions, medication management, crisis planning
                          </p>
                          <button className="mt-2 text-sm text-orange-600 hover:text-orange-700 font-medium">
                            Find providers →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prevention Success Metrics */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Prevention Success</h3>
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Risk Reduction</p>
                        <div className="flex items-baseline space-x-2">
                          <span className="text-3xl font-bold text-green-600">
                            {preventionMetrics.riskReduction}%
                          </span>
                          <TrendingDown className="h-5 w-5 text-green-500" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Success Rate</p>
                        <div className="flex items-baseline space-x-2">
                          <span className="text-3xl font-bold text-blue-600">
                            {preventionMetrics.successRate}%
                          </span>
                          <CheckCircle className="h-5 w-5 text-blue-500" />
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mt-4">
                      You've successfully prevented {preventionMetrics.preventedCrises} potential crises 
                      through early intervention and proactive self-care. Keep up the great work!
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}