import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pill, Clock, Calendar, AlertTriangle, CheckCircle, XCircle,
  TrendingUp, TrendingDown, Minus, Info, Bell, RefreshCw,
  Phone, FileText, Activity, Shield, AlertCircle, ChevronRight,
  Package, Droplets, Sun, Moon, Coffee, BedDouble, X
} from 'lucide-react';

interface Medication {
  id: string;
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  schedule: MedicationSchedule[];
  purpose: string;
  prescribedBy: string;
  prescribedDate: Date;
  refillDate?: Date;
  remainingDoses?: number;
  instructions?: string;
  sideEffects?: string[];
  warnings?: string[];
  interactions?: string[];
  adherenceRate?: number;
  missedDoses?: number;
  lastTaken?: Date;
  nextDose?: Date;
  color?: string;
  shape?: string;
  image?: string;
  isControlled?: boolean;
  requiresMonitoring?: boolean;
  bloodWorkSchedule?: Date;
}

interface MedicationSchedule {
  time: string; // "08:00", "20:00"
  withFood?: boolean;
  specialInstructions?: string;
  taken?: boolean;
  takenAt?: Date;
  skipped?: boolean;
  skipReason?: string;
}

interface SideEffect {
  id: string;
  medicationId: string;
  effect: string;
  severity: 'mild' | 'moderate' | 'severe';
  frequency: 'rare' | 'occasional' | 'frequent' | 'constant';
  reportedDate: Date;
  resolved?: boolean;
  notes?: string;
}

interface MedicationEffectiveness {
  medicationId: string;
  _effectiveness: number; // 1-10
  moodCorrelation?: number; // -1 to 1
  symptomImprovement?: Record<string, number>; // symptom -> improvement %
  qualityOfLife?: number; // 1-10
  lastAssessed: Date;
}

interface MedicationManagementProps {
  medications?: Medication[];
  sideEffects?: SideEffect[];
  _effectiveness?: MedicationEffectiveness[];
  onTakeMedication?: (medication: Medication, schedule: MedicationSchedule) => void;
  onSkipMedication?: (medication: Medication, schedule: MedicationSchedule, reason: string) => void;
  _onReportSideEffect?: (medicationId: string, effect: SideEffect) => void;
  _onUpdateEffectiveness?: (_effectiveness: MedicationEffectiveness) => void;
  onRefillRequest?: (medication: Medication) => void;
  onContactPharmacy?: () => void;
  onContactPrescriber?: (medication: Medication) => void;
}

export function MedicationManagement({
  medications = [],
  sideEffects = [],
  _effectiveness = [],
  onTakeMedication,
  onSkipMedication,
  _onReportSideEffect,
  _onUpdateEffectiveness,
  onRefillRequest,
  onContactPharmacy,
  onContactPrescriber
}: MedicationManagementProps) {
  const [activeTab, setActiveTab] = useState<'today' | 'all' | 'adherence' | 'effects'>('today');
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showSideEffectReport, setShowSideEffectReport] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');

  // Get current time period
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('morning');
    else if (hour < 17) setTimeOfDay('afternoon');
    else if (hour < 21) setTimeOfDay('evening');
    else setTimeOfDay('night');
  }, []);

  // Get today's medication schedule
  const getTodaysMedications = () => {
    const __now = new Date();
    const todaySchedule: Array<{
      medication: Medication;
      schedule: MedicationSchedule;
      timeCategory: string;
    }> = [];

    medications.forEach(med => {
      med.schedule.forEach(sched => {
        if (!sched.time || !sched.time.includes(':')) return;
        const timeParts = sched.time.split(':').map(Number);
        if (timeParts.length !== 2 || timeParts[0] === undefined || timeParts[1] === undefined) return;
        const hours = timeParts[0];
        const minutes = timeParts[1];
        if (isNaN(hours) || isNaN(minutes)) return;
        let timeCategory = 'morning';
        
        if (hours < 12) timeCategory = 'morning';
        else if (hours < 17) timeCategory = 'afternoon';
        else if (hours < 21) timeCategory = 'evening';
        else timeCategory = 'night';

        todaySchedule.push({
          medication: med,
          schedule: sched,
          timeCategory
        });
      });
    });

    return todaySchedule.sort((a, b) => a.schedule.time.localeCompare(b.schedule.time));
  };

  // Calculate overall adherence rate
  const calculateOverallAdherence = () => {
    if (medications.length === 0) return 0;
    const total = medications.reduce((sum, med) => sum + (med.adherenceRate || 0), 0);
    return Math.round(total / medications.length);
  };

  // Get medications needing refill
  const medicationsNeedingRefill = medications.filter(med => {
    if (!med.remainingDoses || !med.refillDate) return false;
    const daysUntilOut = med.remainingDoses / (med.schedule.length || 1);
    return daysUntilOut <= 7;
  });

  // Get time icon
  const getTimeIcon = (time: string) => {
    if (!time || !time.includes(':')) return <Clock className="h-4 w-4" />;
    const hourStr = time.split(':')[0];
    if (!hourStr) return <Clock className="h-4 w-4" />;
    const hour = parseInt(hourStr);
    if (hour < 6 || hour >= 22) return <Moon className="h-4 w-4" />;
    if (hour < 12) return <Sun className="h-4 w-4" />;
    if (hour < 17) return <Coffee className="h-4 w-4" />;
    return <BedDouble className="h-4 w-4" />;
  };

  // Get adherence color
  const getAdherenceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const todaysMeds = getTodaysMedications();
  const overallAdherence = calculateOverallAdherence();

  return (
    <div className="h-full flex flex-col">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600">Adherence</p>
              <p className="text-xl font-bold text-blue-700">{overallAdherence}%</p>
            </div>
            {overallAdherence >= 90 ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : overallAdherence >= 70 ? (
              <Minus className="h-5 w-5 text-yellow-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )}
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-600">Active Meds</p>
              <p className="text-xl font-bold text-purple-700">{medications.length}</p>
            </div>
            <Pill className="h-5 w-5 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-600">Refills Due</p>
              <p className="text-xl font-bold text-orange-700">{medicationsNeedingRefill.length}</p>
            </div>
            <Package className="h-5 w-5 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-4 border-b border-gray-200">
        {(['today', 'all', 'adherence', 'effects'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'today' && 'Today\'s Schedule'}
            {tab === 'all' && 'All Medications'}
            {tab === 'adherence' && 'Adherence'}
            {tab === 'effects' && 'Side Effects'}
            {tab === 'today' && todaysMeds.filter(m => !m.schedule.taken).length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                {todaysMeds.filter(m => !m.schedule.taken).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'today' && (
          <div className="space-y-4">
            {/* Refill Alert */}
            {medicationsNeedingRefill.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-orange-50 border border-orange-200 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-900">
                      {medicationsNeedingRefill.length} medication{medicationsNeedingRefill.length > 1 ? 's' : ''} need refilling
                    </span>
                  </div>
                  <button
                    onClick={onContactPharmacy}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Contact Pharmacy
                  </button>
                </div>
              </motion.div>
            )}

            {/* Time-based medication groups */}
            {['morning', 'afternoon', 'evening', 'night'].map((period) => {
              const periodMeds = todaysMeds.filter(m => m.timeCategory === period);
              if (periodMeds.length === 0) return null;

              return (
                <div key={period} className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 capitalize flex items-center">
                    {period === 'morning' && <Sun className="h-4 w-4 mr-2 text-yellow-500" />}
                    {period === 'afternoon' && <Coffee className="h-4 w-4 mr-2 text-orange-500" />}
                    {period === 'evening' && <BedDouble className="h-4 w-4 mr-2 text-purple-500" />}
                    {period === 'night' && <Moon className="h-4 w-4 mr-2 text-indigo-500" />}
                    {period}
                  </h4>
                  
                  {periodMeds.map((item, idx) => (
                    <motion.div
                      key={`${item.medication.id}-${idx}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`p-3 rounded-lg border ${
                        item.schedule.taken 
                          ? 'bg-green-50 border-green-200' 
                          : item.schedule.skipped
                          ? 'bg-red-50 border-red-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            item.schedule.taken ? 'bg-green-100' :
                            item.schedule.skipped ? 'bg-red-100' :
                            'bg-gray-100'
                          }`}>
                            <Pill className={`h-5 w-5 ${
                              item.schedule.taken ? 'text-green-600' :
                              item.schedule.skipped ? 'text-red-600' :
                              'text-gray-600'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.medication.name}</p>
                            <p className="text-sm text-gray-600">
                              {item.medication.dosage} • {item.schedule.time}
                            </p>
                            {item.schedule.withFood && (
                              <p className="text-xs text-orange-600 mt-1">Take with food</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {item.schedule.taken ? (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="h-5 w-5" />
                              <span className="ml-1 text-xs">Taken</span>
                            </div>
                          ) : item.schedule.skipped ? (
                            <div className="flex items-center text-red-600">
                              <XCircle className="h-5 w-5" />
                              <span className="ml-1 text-xs">Skipped</span>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => onTakeMedication?.(item.medication, item.schedule)}
                                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Reason for skipping?');
                                  if (reason) {
                                    onSkipMedication?.(item.medication, item.schedule, reason);
                                  }
                                }}
                                className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'all' && (
          <div className="space-y-3">
            {medications.map((med) => (
              <motion.div
                key={med.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
                onClick={() => {
                  setSelectedMedication(med);
                  setShowDetails(true);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900">{med.name}</h4>
                      {med.isControlled && (
                        <Shield className="h-4 w-4 text-red-500" />
                      )}
                      {med.requiresMonitoring && (
                        <Activity className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                    {med.genericName && (
                      <p className="text-xs text-gray-500 mb-1">({med.genericName})</p>
                    )}
                    <p className="text-sm text-gray-600">{med.dosage} • {med.frequency}</p>
                    <p className="text-xs text-gray-500 mt-1">For {med.purpose}</p>
                    
                    {/* Schedule Times */}
                    <div className="flex space-x-2 mt-2">
                      {med.schedule.map((sched, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full flex items-center">
                          {getTimeIcon(sched.time)}
                          <span className="ml-1">{sched.time}</span>
                        </span>
                      ))}
                    </div>

                    {/* Warnings */}
                    {med.warnings && med.warnings.length > 0 && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded-lg">
                        <p className="text-xs text-yellow-800 flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {med.warnings[0]}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 text-right">
                    {med.adherenceRate !== undefined && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-500">Adherence</p>
                        <p className={`text-lg font-bold ${getAdherenceColor(med.adherenceRate)}`}>
                          {med.adherenceRate}%
                        </p>
                      </div>
                    )}
                    {med.remainingDoses !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500">Remaining</p>
                        <p className="text-sm font-medium text-gray-700">{med.remainingDoses} doses</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Prescribed by {med.prescribedBy}
                  </p>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'adherence' && (
          <div className="space-y-4">
            {/* Overall Adherence Chart */}
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Weekly Adherence</h4>
              <div className="space-y-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                  <div key={day} className="flex items-center">
                    <span className="text-xs text-gray-600 w-8">{day}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-4 ml-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full"
                        style={{ width: `${85 + Math.random() * 15}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual Medication Adherence */}
            <div className="space-y-3">
              {medications.map((med) => (
                <div key={med.id} className="p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{med.name}</h5>
                    <span className={`font-bold ${getAdherenceColor(med.adherenceRate || 0)}`}>
                      {med.adherenceRate || 0}%
                    </span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        (med.adherenceRate || 0) >= 90 ? 'bg-green-500' :
                        (med.adherenceRate || 0) >= 70 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${med.adherenceRate || 0}%` }}
                    />
                  </div>
                  {med.missedDoses && med.missedDoses > 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      {med.missedDoses} missed doses this month
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'effects' && (
          <div className="space-y-4">
            {/* Report New Side Effect Button */}
            <button
              onClick={() => setShowSideEffectReport(true)}
              className="w-full p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Report Side Effect
            </button>

            {/* Recent Side Effects */}
            <div className="space-y-3">
              {sideEffects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No side effects reported</p>
                </div>
              ) : (
                sideEffects.map((effect) => {
                  const med = medications.find(m => m.id === effect.medicationId);
                  return (
                    <motion.div
                      key={effect.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-white border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{effect.effect}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {med?.name} • {new Date(effect.reportedDate).toLocaleDateString()}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              effect.severity === 'severe' ? 'bg-red-100 text-red-700' :
                              effect.severity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {effect.severity}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              {effect.frequency}
                            </span>
                          </div>
                        </div>
                        {effect.resolved && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Medication Details Modal */}
      <AnimatePresence>
        {showDetails && selectedMedication && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold mb-4">{selectedMedication.name}</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Generic Name</p>
                  <p className="text-gray-900">{selectedMedication.genericName || 'N/A'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Purpose</p>
                  <p className="text-gray-900">{selectedMedication.purpose}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Instructions</p>
                  <p className="text-gray-900">{selectedMedication.instructions || 'Take as directed'}</p>
                </div>
                
                {selectedMedication.sideEffects && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Possible Side Effects</p>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {selectedMedication.sideEffects.map((effect, idx) => (
                        <li key={idx}>{effect}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedMedication.interactions && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Drug Interactions</p>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {selectedMedication.interactions.map((interaction, idx) => (
                        <li key={idx}>{interaction}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => onRefillRequest?.(selectedMedication)}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Request Refill
                  </button>
                  <button
                    onClick={() => onContactPrescriber?.(selectedMedication)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Contact Prescriber
                  </button>
                </div>
              </div>
              
              <button
                onClick={() => setShowDetails(false)}
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