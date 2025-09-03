// AI Insights Dashboard Widget
// Displays AI-powered mental health insights, patterns, and recommendations

import React, { useState, _useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  AlertCircle,
  Target,
  Activity,
  _Calendar,
  ChevronRight,
  Info,
  CheckCircle,
  _XCircle,
  BarChart3,
  Sparkles,
  Shield,
  Clock,
  Award,
  MessageSquare,
  Lightbulb,
  Heart,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  _Star,
  _TrendingDown,
  Users,
  Sun,
  Moon,
  Cloud,
  Pill,
  _BookOpen,
  Settings,
} from 'lucide-react';
import { useAIInsights, _useProgressMetrics, _useTherapeuticIntelligence } from '../../../hooks/useAIInsights';
import {
  _AIInsight,
  _PatternAnalysis,
  _PredictiveModel,
  _PersonalizedRecommendation,
  InsightCategory,
  _ProgressMetrics,
  _TherapeuticIntelligence,
} from '../../../types/ai-insights';

export function AIInsightsDashboard() {
  const { insightsDashboard, filteredInsights, _isLoading, _error, selectedInsightCategory, setSelectedInsightCategory, insightTimeRange, setInsightTimeRange, markInsightActioned, _dismissInsight, requestRefresh, insightStats, isMarkingActioned, _isDismissing,  } = useAIInsights();

  const [expandedInsight, _setExpandedInsight] = useState<string | null>(null);
  const [activeTab, _setActiveTab] = useState<'insights' | 'patterns' | 'predictions' | 'recommendations' | 'progress'>('insights');
  const [showFilters, _setShowFilters] = useState(false);

  // Category icons and colors
  const categoryConfig: Record<InsightCategory | 'all', { icon: React.ElementType; _color: string; bgColor: string }> = {
    all: { icon: Brain, _color: 'text-purple-600', bgColor: 'bg-purple-50' },
    mood: { icon: Heart, _color: 'text-pink-600', bgColor: 'bg-pink-50' },
    behavior: { icon: Activity, _color: 'text-blue-600', bgColor: 'bg-blue-50' },
    sleep: { icon: Moon, _color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    social: { icon: Users, _color: 'text-green-600', bgColor: 'bg-green-50' },
    activity: { icon: Zap, _color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    medication: { icon: Pill, _color: 'text-orange-600', bgColor: 'bg-orange-50' },
    therapy: { icon: MessageSquare, _color: 'text-purple-600', bgColor: 'bg-purple-50' },
    crisis: { icon: AlertCircle, _color: 'text-red-600', bgColor: 'bg-red-50' },
    wellness: { icon: Sun, _color: 'text-amber-600', bgColor: 'bg-amber-50' },
    environmental: { icon: Cloud, _color: 'text-sky-600', bgColor: 'bg-sky-50' },
  };

  // Severity colors
  const getSeverityColor = (_severity: string) => {
    switch (_severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Convert trend values to expected format
  const convertTrend = (_trend: string): 'up' | 'down' | 'stable' => {
    switch (_trend) {
      case 'improving': return 'up';
      case 'declining': return 'down';
      case 'stable': return 'stable';
      default: return 'stable';
    }
  };

  // Trend indicator
  const TrendIndicator = ({ trend, value }: { _trend: 'up' | 'down' | 'stable'; value?: number }) => {
    const config = {
      up: { icon: ArrowUpRight, _color: 'text-green-600', bg: 'bg-green-50' },
      down: { icon: ArrowDownRight, _color: 'text-red-600', bg: 'bg-red-50' },
      stable: { icon: Minus, _color: 'text-gray-600', bg: 'bg-gray-50' },
    };
    const { icon: Icon, _color, bg } = config[trend];
    
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${bg}`}>
        <Icon className={`w-4 h-4 ${_color}`} />
        {value !== undefined && (
          <span className={`text-sm font-medium ${_color}`}>
            {_trend === 'up' ? '+' : _trend === 'down' ? '-' : ''}{Math.abs(_value)}%
          </span>
        )}
      </div>
    );
  };

  // Progress bar component
  const ProgressBar = ({ value, max = 100, _color = 'bg-primary-600' }: { value: number; max?: number; _color?: string }) => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all duration-500 ${_color}`}
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  );

  // Confidence indicator
  const ConfidenceIndicator = ({ confidence }: { confidence: number }) => {
    const percentage = Math.round(confidence * 100);
    const _color = confidence >= 0.8 ? 'text-green-600' : confidence >= 0.6 ? 'text-yellow-600' : 'text-orange-600';
    
    return (
      <div className="flex items-center gap-2">
        <Shield className={`w-4 h-4 ${_color}`} />
        <span className={`text-sm font-medium ${_color}`}>{percentage}% confidence</span>
      </div>
    );
  };

  if (_isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
        <p className="text-center text-gray-500 mt-4">Analyzing your mental health data...</p>
      </div>
    );
  }

  if (_error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <p className="font-medium">Unable to load AI insights</p>
        </div>
        <button
          onClick={() => requestRefresh()}
          className="mt-4 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">AI-Powered Insights</h2>
              <p className="text-sm text-gray-500">Personalized mental health intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Filter className="w-5 h-5" />
            </button>
            <button
              onClick={requestRefresh}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        {insightStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-600">Total Insights</span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-purple-900 mt-1">{insightStats.totalInsights}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-600">Actionable</span>
                <Target className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-1">{insightStats.actionableInsights}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-600">Patterns</span>
                <BarChart3 className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-green-900 mt-1">{insightStats.patternCount}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-600">AI Confidence</span>
                <Shield className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-amber-900 mt-1">
                {Math.round(insightStats.averageConfidence * 100)}%
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-sm font-medium text-gray-700">Category:</span>
                {(['all', 'mood', 'behavior', 'sleep', 'activity', 'social', 'wellness'] as const).map(category => {
                  const { icon: Icon, _color } = categoryConfig[category];
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedInsightCategory(_category)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        selectedInsightCategory === category
                          ? 'bg-primary-100 text-primary-700 border border-primary-300'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <span className="text-sm font-medium text-gray-700">Time Range:</span>
                {(['week', 'month', 'quarter', 'year'] as const).map(range => (
                  <button
                    key={range}
                    onClick={() => setInsightTimeRange(_range)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      insightTimeRange === range
                        ? 'bg-primary-100 text-primary-700 border border-primary-300'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1 p-1 bg-gray-50">
          {[
            { id: 'insights', label: 'Insights', icon: Lightbulb },
            { id: 'patterns', label: 'Patterns', icon: BarChart3 },
            { id: 'predictions', label: 'Predictions', icon: TrendingUp },
            { id: 'recommendations', label: 'Recommendations', icon: Target },
            { id: 'progress', label: 'Progress', icon: Award },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as unknown)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {filteredInsights.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No insights available for the selected filters</p>
                </div>
              ) : (
                filteredInsights.map(insight => {
                  const { icon: CategoryIcon, _color: categoryColor, bgColor } = categoryConfig[insight.category];
                  const isExpanded = expandedInsight === insight.id;

                  return (
                    <motion.div
                      key={insight.id}
                      layout
                      className={`border rounded-lg p-4 transition-all ${getSeverityColor(insight._severity)}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${bgColor}`}>
                            <CategoryIcon className={`w-5 h-5 ${categoryColor}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setExpandedInsight(isExpanded ? null : insight.id)}
                          className="p-1 hover:bg-white/50 rounded transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </div>

                      <div className="bg-white/60 rounded-lg p-3 mb-3">
                        <p className="text-sm text-gray-700 italic">{insight.naturalLanguageInsight}</p>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <ConfidenceIndicator confidence={insight.confidence} />
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            Valid for {Math.ceil((insight.validUntil.getTime() - Date.now()) / (24 * 60 * 60 * 1000))} days
                          </span>
                        </div>
                        {insight.impactScore && (
                          <div className="flex items-center gap-1">
                            <Zap className="w-4 h-4 text-amber-500" />
                            <span className="text-gray-600">Impact: {insight.impactScore}/100</span>
                          </div>
                        )}
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-4 pt-4 border-t border-gray-200"
                          >
                            {/* Evidence */}
                            {insight.evidenceBase.length > 0 && (
                              <div className="mb-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Evidence</h4>
                                <div className="space-y-2">
                                  {insight.evidenceBase.map((evidence, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-sm">
                                      <Info className="w-4 h-4 text-gray-400 mt-0.5" />
                                      <div>
                                        <span className="text-gray-600">{evidence.description}</span>
                                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                                          evidence.strength === 'strong' ? 'bg-green-100 text-green-700' :
                                          evidence.strength === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                                          'bg-gray-100 text-gray-700'
                                        }`}>
                                          {evidence.strength}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Actions */}
                            {insight.isActionable && insight.actions.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Recommended Actions</h4>
                                <div className="space-y-2">
                                  {insight.actions.map(action => (
                                    <div key={action.id} className="bg-white/80 rounded-lg p-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-gray-900">{action.action}</span>
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                          action.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                          action.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                          action.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                          'bg-gray-100 text-gray-700'
                                        }`}>
                                          {action.priority}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span>Impact: {action.estimatedImpact}%</span>
                                        <span>{action.requiredTime} min</span>
                                        <span>{action.difficulty}</span>
                                      </div>
                                      <div className="flex gap-2 mt-3">
                                        <button
                                          onClick={() => markInsightActioned(insight.id)}
                                          disabled={isMarkingActioned}
                                          className="flex-1 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium disabled:opacity-50"
                                        >
                                          Mark as Done
                                        </button>
                                        <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                                          Schedule
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Tags */}
                            {insight.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-3">
                                {insight.tags.map(tag => (
                                  <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

          {/* Patterns Tab */}
          {activeTab === 'patterns' && insightsDashboard?.patterns && (
            <motion.div
              key="patterns"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {insightsDashboard.patterns.map(pattern => (
                <div key={pattern.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{pattern.description}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-sm text-gray-500">
                          Type: <span className="font-medium text-gray-700">{pattern.patternType.replace('_', ' ')}</span>
                        </span>
                        <span className="text-sm text-gray-500">
                          Frequency: <span className="font-medium text-gray-700">{pattern.frequency.type}</span>
                        </span>
                        <span className="text-sm text-gray-500">
                          Strength: <span className="font-medium text-gray-700">{Math.round(pattern.strength * 100)}%</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Triggers and Outcomes */}
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    {pattern.triggers.length > 0 && (
                      <div className="bg-yellow-50 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-yellow-800 mb-2">Triggers</h4>
                        {pattern.triggers.map(trigger => (
                          <div key={trigger.id} className="text-sm text-yellow-700">
                            {trigger.triggerEvents.join(', ')}
                          </div>
                        ))}
                      </div>
                    )}
                    {pattern.outcomes.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-blue-800 mb-2">Outcomes</h4>
                        {pattern.outcomes.map((outcome, idx) => (
                          <div key={idx} className="text-sm text-blue-700">
                            {outcome.outcome} ({Math.round(outcome.probability * 100)}% likely)
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Clinical Relevance */}
                  {pattern.clinicalRelevance.isClinicallySignificant && (
                    <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2 text-purple-700">
                        <Shield className="w-4 h-4" />
                        <span className="text-sm font-medium">Clinically Significant</span>
                      </div>
                      <p className="text-sm text-purple-600 mt-1">
                        {pattern.clinicalRelevance.recommendedActions.join('. ')}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          )}

          {/* Predictions Tab */}
          {activeTab === 'predictions' && insightsDashboard?.predictions && (
            <motion.div
              key="predictions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {insightsDashboard.predictions.map(model => (
                <div key={model.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">
                      {model.modelType.replace('_', ' ').charAt(0).toUpperCase() + model.modelType.slice(1).replace('_', ' ')}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Accuracy:</span>
                      <div className="flex items-center gap-1">
                        <div className="w-24">
                          <ProgressBar value={model.accuracy.overall * 100} color="bg-green-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {Math.round(model.accuracy.overall * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Predictions */}
                  {model.predictions.map((prediction, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{prediction.outcome}</span>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-full text-sm ${
                            prediction.probability >= 0.7 ? 'bg-green-100 text-green-700' :
                            prediction.probability >= 0.4 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {Math.round(prediction.probability * 100)}% likely
                          </span>
                          <ConfidenceIndicator confidence={prediction.confidence} />
                        </div>
                      </div>

                      {/* Contributing Factors */}
                      {prediction.factors.length > 0 && (
                        <div className="mt-3">
                          <h5 className="text-xs font-semibold text-gray-600 mb-2">Key Factors:</h5>
                          <div className="space-y-1">
                            {prediction.factors.map((factor, fidx) => (
                              <div key={fidx} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">{factor.factor}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-20">
                                    <ProgressBar 
                                      value={Math.abs(factor.impact) * 100}
                                      color={factor.impact > 0 ? 'bg-green-500' : 'bg-red-500'}
                                    />
                                  </div>
                                  <span className={`text-xs ${factor.modifiable ? 'text-blue-600' : 'text-gray-400'}`}>
                                    {factor.modifiable ? 'Modifiable' : 'Fixed'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Preventive Actions */}
                      {prediction.preventiveActions.length > 0 && (
                        <div className="mt-3 p-2 bg-blue-50 rounded">
                          <h5 className="text-xs font-semibold text-blue-700 mb-1">Preventive Actions:</h5>
                          <ul className="text-sm text-blue-600 space-y-0.5">
                            {prediction.preventiveActions.map((action, aidx) => (
                              <li key={aidx} className="flex items-start gap-1">
                                <ChevronRight className="w-3 h-3 mt-0.5" />
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Model Features */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Important Features</h4>
                    <div className="space-y-1">
                      {model.features.slice(0, 3).map(feature => (
                        <div key={feature.feature} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{feature.feature}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20">
                              <ProgressBar value={feature.importance * 100} color="bg-purple-500" />
                            </div>
                            <span className="text-xs text-gray-500">{Math.round(feature.importance * 100)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && insightsDashboard?.recommendations && (
            <motion.div
              key="recommendations"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {insightsDashboard.recommendations.map(rec => (
                <div key={rec.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className={`p-4 ${
                    rec.priority === 'urgent' ? 'bg-red-50' :
                    rec.priority === 'high' ? 'bg-orange-50' :
                    rec.priority === 'medium' ? 'bg-yellow-50' :
                    'bg-gray-50'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rec.priority === 'urgent' ? 'bg-red-200 text-red-800' :
                        rec.priority === 'high' ? 'bg-orange-200 text-orange-800' :
                        rec.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-gray-200 text-gray-800'
                      }`}>
                        {rec.priority}
                      </span>
                    </div>

                    <div className="mt-3 p-3 bg-white/70 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Why this matters:</span> {rec.rationale}
                      </p>
                    </div>

                    {/* Expected Impact */}
                    {rec.expectedImpact && (
                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-600">
                            Expected improvement: <span className="font-medium text-green-700">
                              {Math.round(((rec.expectedImpact.expectedValue - rec.expectedImpact.currentValue) / rec.expectedImpact.currentValue) * 100)}%
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-gray-600">
                            Results in: <span className="font-medium text-blue-700">
                              {rec.expectedImpact.timeToImpact} days
                            </span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Implementation Guide */}
                  {rec.implementation && (
                    <div className="p-4 bg-white">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">How to implement:</h4>
                      <div className="space-y-2">
                        {rec.implementation.steps.map((step, idx) => (
                          <div key={idx} className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium">
                              {step.order}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-700">{step.description}</p>
                              {step.tips.length > 0 && (
                                <ul className="mt-1 text-xs text-gray-500 list-disc list-inside">
                                  {step.tips.map((tip, tidx) => (
                                    <li key={tidx}>{tip}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            <span className="text-xs text-gray-400">{step.duration} min</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">Total time: {rec.implementation.estimatedTime} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">Difficulty: {rec.implementation.difficulty}</span>
                        </div>
                      </div>

                      {/* Optimal Timing */}
                      {rec.implementation.optimalTiming && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <h5 className="text-xs font-semibold text-blue-700 mb-1">Best times:</h5>
                          <p className="text-sm text-blue-600">
                            {rec.implementation.optimalTiming.timeOfDay.join(', ')} on {rec.implementation.optimalTiming.daysOfWeek.join(', ')}
                          </p>
                        </div>
                      )}

                      <div className="mt-4 flex gap-2">
                        <button className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium">
                          Start Now
                        </button>
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                          Schedule
                        </button>
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                          Learn More
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          )}

          {/* Progress Tab */}
          {activeTab === 'progress' && insightsDashboard?.progressMetrics && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Overall Wellness Score */}
              <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Overall Wellness Score</h3>
                  <TrendIndicator 
                    trend={convertTrend(insightsDashboard.progressMetrics.overallWellness._trend)}
                    value={insightsDashboard.progressMetrics.overallWellness.changeRate}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-primary-600">
                    {insightsDashboard.progressMetrics.overallWellness.score}
                  </div>
                  <div className="flex-1">
                    <ProgressBar 
                      value={insightsDashboard.progressMetrics.overallWellness.score}
                      color="bg-gradient-to-r from-primary-500 to-purple-500"
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      Projected to reach {insightsDashboard.progressMetrics.overallWellness.projectedScore} in 30 days
                    </p>
                  </div>
                </div>

                {/* Components */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
                  {insightsDashboard.progressMetrics.overallWellness.components.map(component => (
                    <div key={component.name} className="bg-white/80 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600">{component.name}</span>
                        <TrendIndicator trend={convertTrend(component._trend)} />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{component.score}</div>
                      <ProgressBar value={component.score} color="bg-gray-400" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Trend Analysis */}
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { label: 'Short Term (7 days)', data: insightsDashboard.progressMetrics.trendAnalysis.shortTerm },
                  { label: 'Medium Term (30 days)', data: insightsDashboard.progressMetrics.trendAnalysis.mediumTerm },
                  { label: 'Long Term (90 days)', data: insightsDashboard.progressMetrics.trendAnalysis.longTerm },
                ].map(_trend => (
                  <div key={_trend.label} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">{_trend.label}</h4>
                    <div className="flex items-center justify-between mb-2">
                      <TrendIndicator trend={_trend.data.direction} value={_trend.data.magnitude} />
                      <ConfidenceIndicator confidence={_trend.data.confidence} />
                    </div>
                    <div className="text-xs text-gray-500">
                      Key factors: {_trend.data.keyFactors.join(', ')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Milestones */}
              {insightsDashboard.progressMetrics.milestoneAchievements.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Achievements</h3>
                  <div className="space-y-3">
                    {insightsDashboard.progressMetrics.milestoneAchievements.map(milestone => (
                      <div key={milestone.id} className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-amber-100 rounded-lg">
                            <Award className="w-5 h-5 text-amber-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{milestone.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                            <p className="text-sm text-amber-600 mt-2 italic">{milestone.celebration}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>Achieved: {new Date(milestone.achievedDate).toLocaleDateString()}</span>
                              <span>Next: {milestone.nextMilestone}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Domain Metrics */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Domain Progress</h3>
                <div className="space-y-3">
                  {insightsDashboard.progressMetrics.domainMetrics.map(domain => (
                    <div key={domain.domain} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{domain.domain}</h4>
                        <span className="text-sm text-gray-500">
                          {domain.currentScore} / {domain.targetScore}
                        </span>
                      </div>
                      <ProgressBar 
                        value={domain.progress * 100}
                        color={domain.progress >= 0.7 ? 'bg-green-500' : domain.progress >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'}
                      />
                      {domain.subMetrics.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {domain.subMetrics.map(metric => (
                            <div key={metric.name} className="text-sm">
                              <span className="text-gray-600">{metric.name}:</span>
                              <span className={`ml-1 font-medium ${metric.achieved ? 'text-green-600' : 'text-gray-900'}`}>
                                {metric.value} {metric.unit}
                                {metric.achieved && <CheckCircle className="inline w-3 h-3 ml-1" />}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Info className="w-4 h-4" />
            <span>AI insights are suggestions based on your data patterns</span>
          </div>
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Privacy Settings
          </button>
        </div>
      </div>
    </div>
  );
}