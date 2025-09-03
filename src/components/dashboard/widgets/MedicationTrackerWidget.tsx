import React from 'react';
import { Pill, Clock, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  takenToday: boolean;
  nextDose?: Date;
  refillDate?: Date;
  adherenceRate: number;
}

interface MedicationTrackerWidgetProps {
  medications?: Medication[];
  error?: string;
}

export function MedicationTrackerWidget({ medications, error }: MedicationTrackerWidgetProps) {
  const navigate = useNavigate();

  if (_error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  // Mock data if not provided
  const meds = medications?.length ? medications : [
    {
      id: '1',
      name: 'Sertraline',
      dosage: '50mg',
      frequency: 'Once daily',
      times: ['08:00'],
      takenToday: false,
      nextDose: new Date(Date.now() + 1000 * 60 * 60 * 2),
      adherenceRate: 85
    },
    {
      id: '2',
      name: 'Vitamin D',
      dosage: '1000 IU',
      frequency: 'Once daily',
      times: ['08:00'],
      takenToday: true,
      adherenceRate: 92
    }
  ];

  const pendingMeds = meds.filter(m => !m.takenToday);
  const _overallAdherence = meds.reduce((sum, m) => sum + m.adherenceRate, 0) / meds.length;

  const getAdherenceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600 bg-green-100';
    if (rate >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-3">
      {/* Adherence Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Pill className="h-5 w-5 text-primary-600" />
            <span className="text-sm font-medium text-gray-900">Medication Tracker</span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAdherenceColor(_overallAdherence)}`}>
            {Math.round(_overallAdherence)}% adherence
          </span>
        </div>
      </div>

      {/* Pending Medications */}
      {pendingMeds.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-900">
              {pendingMeds.length} medication{pendingMeds.length > 1 ? 's' : ''} pending
            </span>
          </div>
          <button
            onClick={() => navigate('/wellness/medications')}
            className="w-full bg-yellow-100 hover:bg-yellow-200 text-yellow-900 rounded-md py-2 text-sm font-medium transition-colors"
          >
            Take Medications Now
          </button>
        </div>
      )}

      {/* Medication List */}
      <div className="space-y-2">
        {meds.slice(0, 3).map((med, index) => (
          <motion.div
            key={med.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/wellness/medications')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {med.takenToday ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Clock className="h-5 w-5 text-gray-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{med.name}</p>
                  <p className="text-xs text-gray-600">
                    {med.dosage} • {med.frequency}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {med.nextDose && !med.takenToday && (
                  <p className="text-xs text-gray-600">
                    Next: {new Date(med.nextDose).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                )}
                {med.takenToday && (
                  <p className="text-xs text-green-600">Taken</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Refill Reminder */}
      {meds.some(m => m.refillDate) && (
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-blue-800">
              Refill reminder: {meds.find(m => m.refillDate)?.name} in 5 days
            </span>
          </div>
        </div>
      )}

      {/* View All Link */}
      <button
        onClick={() => navigate('/wellness/medications')}
        className="w-full text-center py-2 text-sm text-primary-600 hover:text-primary-700"
      >
        Manage Medications
      </button>
    </div>
  );
}