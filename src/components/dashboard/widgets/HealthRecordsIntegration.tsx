import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Download, Upload, Share2, Lock, Shield, 
  Activity, Heart, Brain, Pill, Calendar, Clock,
  AlertCircle, CheckCircle, Info, TrendingUp, TrendingDown,
  ChevronRight, Filter, Search, Eye, EyeOff, RefreshCw,
  User, Users, Clipboard, Award, BarChart3, Database,
  Minus, XCircle
} from 'lucide-react';

interface HealthRecord {
  id: string;
  type: 'assessment' | 'diagnosis' | 'lab_result' | 'imaging' | 'procedure' | 'immunization' | 'allergy';
  title: string;
  date: Date;
  provider: string;
  facility: string;
  status: 'final' | 'preliminary' | 'amended' | 'corrected';
  category: string;
  results?: any;
  attachments?: string[];
  notes?: string;
  confidentiality: 'normal' | 'restricted' | 'very_restricted';
  sharedWith?: string[];
}

interface Assessment {
  id: string;
  name: string;
  type: 'PHQ-9' | 'GAD-7' | 'PCL-5' | 'MDQ' | 'AUDIT' | 'Custom';
  date: Date;
  score: number;
  maxScore: number;
  severity: 'minimal' | 'mild' | 'moderate' | 'severe' | 'very_severe';
  interpretation: string;
  provider: string;
  followUpRequired: boolean;
  comparisonToPrevious?: 'improved' | 'stable' | 'worsened';
}

interface Diagnosis {
  id: string;
  code: string; // ICD-10
  description: string;
  dateOfDiagnosis: Date;
  provider: string;
  status: 'active' | 'resolved' | 'inactive';
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
}

interface LabResult {
  id: string;
  testName: string;
  value: string | number;
  unit?: string;
  referenceRange?: string;
  flag?: 'normal' | 'high' | 'low' | 'critical';
  date: Date;
  orderedBy: string;
  laboratory: string;
  category: string;
}

interface InsuranceInfo {
  id: string;
  provider: string;
  planName: string;
  memberId: string;
  groupNumber: string;
  effectiveDate: Date;
  expirationDate?: Date;
  copay: {
    specialist: number;
    primary: number;
    emergency: number;
    prescription: number;
  };
  deductible: {
    individual: number;
    met: number;
    remaining: number;
  };
  outOfPocketMax: {
    individual: number;
    met: number;
    remaining: number;
  };
  coverageDetails?: string[];
  priorAuthRequired?: string[];
}

interface EmergencyInfo {
  contacts: Array<{
    name: string;
    relationship: string;
    phone: string;
    isPrimary: boolean;
  }>;
  advanceDirectives?: {
    hasLivingWill: boolean;
    hasPowerOfAttorney: boolean;
    documentLocation?: string;
  };
  bloodType?: string;
  allergies?: string[];
  currentMedications?: string[];
  medicalConditions?: string[];
}

interface HealthRecordsIntegrationProps {
  records?: HealthRecord[];
  assessments?: Assessment[];
  diagnoses?: Diagnosis[];
  labResults?: LabResult[];
  insurance?: InsuranceInfo;
  emergency?: EmergencyInfo;
  onExportRecords?: (format: 'pdf' | 'csv' | 'json') => void;
  onImportRecords?: (file: File) => void;
  onShareRecord?: (recordId: string, recipientId: string) => void;
  onRequestRecords?: (providerId: string) => void;
  onUpdatePrivacy?: (recordId: string, level: string) => void;
  onRefreshData?: () => void;
}

export function HealthRecordsIntegration({
  records = [],
  assessments = [],
  diagnoses = [],
  labResults = [],
  insurance,
  emergency,
  onExportRecords,
  onImportRecords,
  onShareRecord,
  onRequestRecords,
  onUpdatePrivacy,
  onRefreshData
}: HealthRecordsIntegrationProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'assessments' | 'diagnoses' | 'labs' | 'insurance' | 'emergency'>('overview');
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showPrivateRecords, setShowPrivateRecords] = useState(false);

  // Calculate health metrics
  const calculateHealthMetrics = () => {
    const recentAssessments = assessments.filter(a => {
      const daysSince = (new Date().getTime() - new Date(a.date).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    });

    const improvementRate = recentAssessments.filter(a => a.comparisonToPrevious === 'improved').length / 
                           Math.max(recentAssessments.length, 1);

    return {
      totalRecords: records.length,
      recentAssessments: recentAssessments.length,
      activeDiagnoses: diagnoses.filter(d => d.status === 'active').length,
      abnormalLabs: labResults.filter(l => l.flag && l.flag !== 'normal').length,
      improvementRate: Math.round(improvementRate * 100)
    };
  };

  const metrics = calculateHealthMetrics();

  // Get record type icon
  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'assessment': return <Clipboard className="h-5 w-5" />;
      case 'diagnosis': return <Brain className="h-5 w-5" />;
      case 'lab_result': return <Activity className="h-5 w-5" />;
      case 'imaging': return <Eye className="h-5 w-5" />;
      case 'procedure': return <Heart className="h-5 w-5" />;
      case 'immunization': return <Shield className="h-5 w-5" />;
      case 'allergy': return <AlertCircle className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minimal':
      case 'mild': return 'text-green-600 bg-green-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'severe': return 'text-orange-600 bg-orange-50';
      case 'very_severe':
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Get lab flag color
  const getLabFlagColor = (flag: string) => {
    switch (flag) {
      case 'normal': return 'text-green-600';
      case 'high': return 'text-orange-600';
      case 'low': return 'text-blue-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Filter records
  const filteredRecords = records.filter(record => {
    const matchesSearch = record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.provider.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || record.type === filterType;
    const matchesPrivacy = showPrivateRecords || record.confidentiality === 'normal';
    return matchesSearch && matchesType && matchesPrivacy;
  });

  return (
    <div className="h-full flex flex-col">
      {/* Health Metrics Overview */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600">Total Records</p>
              <p className="text-xl font-bold text-blue-700">{metrics.totalRecords}</p>
            </div>
            <Database className="h-5 w-5 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-600">Assessments</p>
              <p className="text-xl font-bold text-purple-700">{metrics.recentAssessments}</p>
            </div>
            <Clipboard className="h-5 w-5 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-600">Active Diagnoses</p>
              <p className="text-xl font-bold text-orange-700">{metrics.activeDiagnoses}</p>
            </div>
            <Brain className="h-5 w-5 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-600">Abnormal Labs</p>
              <p className="text-xl font-bold text-red-700">{metrics.abnormalLabs}</p>
            </div>
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600">Improvement</p>
              <p className="text-xl font-bold text-green-700">{metrics.improvementRate}%</p>
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => onExportRecords?.('pdf')}
          className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center text-sm"
        >
          <Download className="h-4 w-4 mr-1" />
          Export Records
        </button>
        <button
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) onImportRecords?.(file);
            };
            input.click();
          }}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center text-sm"
        >
          <Upload className="h-4 w-4 mr-1" />
          Import
        </button>
        <button
          onClick={onRefreshData}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center text-sm"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Sync
        </button>
        <button
          onClick={() => setShowPrivateRecords(!showPrivateRecords)}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center text-sm ${
            showPrivateRecords 
              ? 'bg-orange-100 text-orange-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {showPrivateRecords ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
          {showPrivateRecords ? 'Showing Private' : 'Hide Private'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-4 border-b border-gray-200">
        {(['overview', 'assessments', 'diagnoses', 'labs', 'insurance', 'emergency'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-all capitalize ${
              activeTab === tab
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Search and Filter */}
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Types</option>
                <option value="assessment">Assessments</option>
                <option value="diagnosis">Diagnoses</option>
                <option value="lab_result">Lab Results</option>
                <option value="imaging">Imaging</option>
                <option value="procedure">Procedures</option>
              </select>
            </div>

            {/* Records List */}
            <div className="space-y-3">
              {filteredRecords.map((record) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedRecord(record);
                    setShowDetails(true);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        record.type === 'assessment' ? 'bg-purple-100' :
                        record.type === 'diagnosis' ? 'bg-orange-100' :
                        record.type === 'lab_result' ? 'bg-blue-100' :
                        'bg-gray-100'
                      }`}>
                        {getRecordIcon(record.type)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{record.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{record.provider} • {record.facility}</p>
                        <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                          <span>{new Date(record.date).toLocaleDateString()}</span>
                          <span className={`px-2 py-1 rounded-full ${
                            record.status === 'final' ? 'bg-green-100 text-green-700' :
                            record.status === 'preliminary' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {record.status}
                          </span>
                          {record.confidentiality !== 'normal' && (
                            <Lock className="h-3 w-3 text-orange-500" />
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'assessments' && (
          <div className="space-y-4">
            {assessments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clipboard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No assessments recorded</p>
              </div>
            ) : (
              assessments.map((assessment) => (
                <motion.div
                  key={assessment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-white border border-gray-200 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{assessment.name} ({assessment.type})</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Administered by {assessment.provider}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(assessment.severity)}`}>
                      {assessment.severity}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="text-xs text-gray-500">Score</p>
                        <p className="text-lg font-bold text-gray-900">
                          {assessment.score}/{assessment.maxScore}
                        </p>
                      </div>
                      {assessment.comparisonToPrevious && (
                        <div className="flex items-center">
                          {assessment.comparisonToPrevious === 'improved' ? (
                            <TrendingUp className="h-5 w-5 text-green-500 mr-1" />
                          ) : assessment.comparisonToPrevious === 'worsened' ? (
                            <TrendingDown className="h-5 w-5 text-red-500 mr-1" />
                          ) : (
                            <Minus className="h-5 w-5 text-gray-500 mr-1" />
                          )}
                          <span className={`text-sm ${
                            assessment.comparisonToPrevious === 'improved' ? 'text-green-600' :
                            assessment.comparisonToPrevious === 'worsened' ? 'text-red-600' :
                            'text-gray-600'
                          }`}>
                            {assessment.comparisonToPrevious}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(assessment.date).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded-lg">
                    {assessment.interpretation}
                  </p>

                  {assessment.followUpRequired && (
                    <div className="mt-3 p-2 bg-yellow-50 rounded-lg flex items-center text-yellow-700">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <span className="text-sm">Follow-up required</span>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === 'diagnoses' && (
          <div className="space-y-3">
            {diagnoses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Brain className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No diagnoses recorded</p>
              </div>
            ) : (
              diagnoses.map((diagnosis) => (
                <motion.div
                  key={diagnosis.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-white border border-gray-200 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{diagnosis.description}</h4>
                      <div className="flex items-center space-x-3 mt-1 text-sm text-gray-600">
                        <span>ICD-10: {diagnosis.code}</span>
                        <span>•</span>
                        <span>{diagnosis.provider}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          diagnosis.status === 'active' ? 'bg-red-100 text-red-700' :
                          diagnosis.status === 'resolved' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {diagnosis.status}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(diagnosis.severity)}`}>
                          {diagnosis.severity}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(diagnosis.dateOfDiagnosis).toLocaleDateString()}
                    </span>
                  </div>
                  {diagnosis.notes && (
                    <p className="mt-3 text-sm text-gray-600 p-2 bg-gray-50 rounded">
                      {diagnosis.notes}
                    </p>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === 'labs' && (
          <div className="space-y-3">
            {labResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No lab results available</p>
              </div>
            ) : (
              labResults.map((lab) => (
                <motion.div
                  key={lab.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-white border border-gray-200 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{lab.testName}</h4>
                      <div className="flex items-center space-x-3 mt-2">
                        <span className={`text-lg font-bold ${getLabFlagColor(lab.flag || 'normal')}`}>
                          {lab.value} {lab.unit}
                        </span>
                        {lab.referenceRange && (
                          <span className="text-sm text-gray-500">
                            (Range: {lab.referenceRange})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 mt-2 text-xs text-gray-600">
                        <span>{lab.laboratory}</span>
                        <span>•</span>
                        <span>Ordered by {lab.orderedBy}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500">
                        {new Date(lab.date).toLocaleDateString()}
                      </span>
                      {lab.flag && lab.flag !== 'normal' && (
                        <div className={`mt-1 px-2 py-1 text-xs rounded-full inline-block ${
                          lab.flag === 'critical' ? 'bg-red-100 text-red-700' :
                          lab.flag === 'high' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {lab.flag}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === 'insurance' && insurance && (
          <div className="space-y-4">
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Insurance Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Provider</p>
                  <p className="font-medium">{insurance.provider}</p>
                </div>
                <div>
                  <p className="text-gray-500">Plan</p>
                  <p className="font-medium">{insurance.planName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Member ID</p>
                  <p className="font-medium">{insurance.memberId}</p>
                </div>
                <div>
                  <p className="text-gray-500">Group #</p>
                  <p className="font-medium">{insurance.groupNumber}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Coverage Details</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Deductible</span>
                  <div className="text-right">
                    <p className="text-sm font-medium">${insurance.deductible.met} / ${insurance.deductible.individual}</p>
                    <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(insurance.deductible.met / insurance.deductible.individual) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Out of Pocket Max</span>
                  <div className="text-right">
                    <p className="text-sm font-medium">${insurance.outOfPocketMax.met} / ${insurance.outOfPocketMax.individual}</p>
                    <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(insurance.outOfPocketMax.met / insurance.outOfPocketMax.individual) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Copay Information</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Primary Care</span>
                  <span className="font-medium">${insurance.copay.primary}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Specialist</span>
                  <span className="font-medium">${insurance.copay.specialist}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Emergency</span>
                  <span className="font-medium">${insurance.copay.emergency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Prescription</span>
                  <span className="font-medium">${insurance.copay.prescription}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'emergency' && emergency && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-900 mb-3 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Emergency Contacts
              </h4>
              <div className="space-y-3">
                {emergency.contacts.map((contact, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{contact.name}</p>
                      <p className="text-sm text-gray-600">{contact.relationship}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{contact.phone}</p>
                      {contact.isPrimary && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Primary</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Medical Information</h4>
              <div className="space-y-3 text-sm">
                {emergency.bloodType && (
                  <div>
                    <p className="text-gray-500">Blood Type</p>
                    <p className="font-medium">{emergency.bloodType}</p>
                  </div>
                )}
                {emergency.allergies && emergency.allergies.length > 0 && (
                  <div>
                    <p className="text-gray-500 mb-1">Allergies</p>
                    <div className="flex flex-wrap gap-2">
                      {emergency.allergies.map((allergy, idx) => (
                        <span key={idx} className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                          {allergy}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {emergency.medicalConditions && emergency.medicalConditions.length > 0 && (
                  <div>
                    <p className="text-gray-500 mb-1">Medical Conditions</p>
                    <div className="flex flex-wrap gap-2">
                      {emergency.medicalConditions.map((condition, idx) => (
                        <span key={idx} className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                          {condition}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {emergency.advanceDirectives && (
              <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Advance Directives</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Living Will</span>
                    {emergency.advanceDirectives.hasLivingWill ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Power of Attorney</span>
                    {emergency.advanceDirectives.hasPowerOfAttorney ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  {emergency.advanceDirectives.documentLocation && (
                    <div className="mt-2 p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500">Document Location</p>
                      <p className="text-sm">{emergency.advanceDirectives.documentLocation}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}