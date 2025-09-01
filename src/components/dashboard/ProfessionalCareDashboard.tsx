import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Stethoscope, Calendar, Pill, Brain, Users, FileText,
  MessageSquare, Shield, Activity, TrendingUp, Bell,
  Settings, ChevronLeft, ChevronRight, Grid3x3
} from 'lucide-react';
import { DashboardWidget } from './DashboardWidget';
import { TherapySessionWidget } from './widgets/TherapySessionWidget';
import { CareTeamDashboard } from './widgets/CareTeamDashboard';
import { MedicationManagement } from './widgets/MedicationManagement';
import { TreatmentPlanProgress } from './widgets/TreatmentPlanProgress';
import { ProviderCommunication } from './widgets/ProviderCommunication';
import { HealthRecordsIntegration } from './widgets/HealthRecordsIntegration';
import { useAuth } from '../../contexts/AnonymousAuthContext';

export function ProfessionalCareDashboard() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'overview' | 'therapy' | 'team' | 'medication' | 'treatment' | 'communication' | 'records'>('overview');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Mock data for demonstration
  const mockTherapySessions = [
    {
      id: '1',
      providerId: 'dr1',
      providerName: 'Dr. Sarah Johnson',
      providerSpecialty: 'Clinical Psychologist',
      dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      duration: 50,
      type: 'individual' as const,
      format: 'telehealth' as const,
      status: 'confirmed' as const,
      insuranceCovered: true,
      copay: 25,
      sessionGoals: [
        { id: '1', goal: 'Discuss anxiety management techniques', priority: 'high' as const, discussed: false },
        { id: '2', goal: 'Review medication effectiveness', priority: 'medium' as const, discussed: false }
      ],
      schedule: [{ time: '14:00', withFood: false, taken: false }]
    }
  ];

  const mockProviders = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      role: 'therapist' as const,
      specialty: 'Anxiety & Depression',
      credentials: 'PhD, Licensed Clinical Psychologist',
      contactInfo: {
        phone: '555-0101',
        email: 'dr.johnson@mentalhealth.com',
        officePhone: '555-0100'
      },
      availability: {
        status: 'available' as const,
        officeHours: 'Mon-Fri 9AM-5PM',
        preferredContactMethod: 'portal' as const
      },
      location: {
        name: 'Mental Health Center',
        address: '123 Wellness St',
        isVirtual: false
      },
      rating: 4.8,
      insuranceAccepted: ['Blue Cross', 'Aetna', 'United']
    },
    {
      id: '2',
      name: 'Dr. Michael Chen',
      role: 'psychiatrist' as const,
      specialty: 'Medication Management',
      credentials: 'MD, Board Certified Psychiatrist',
      contactInfo: {
        phone: '555-0102',
        email: 'dr.chen@mentalhealth.com'
      },
      availability: {
        status: 'busy' as const,
        officeHours: 'Mon-Thu 8AM-4PM',
        preferredContactMethod: 'phone' as const
      },
      location: {
        name: 'Psychiatric Associates',
        address: '456 Mind Ave',
        isVirtual: true
      },
      rating: 4.9,
      insuranceAccepted: ['Blue Cross', 'Cigna']
    }
  ];

  const mockMedications = [
    {
      id: '1',
      name: 'Sertraline',
      genericName: 'Zoloft',
      dosage: '50mg',
      frequency: 'Once daily',
      schedule: [{ time: '08:00', withFood: true, taken: false }],
      purpose: 'Depression & Anxiety',
      prescribedBy: 'Dr. Michael Chen',
      prescribedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      adherenceRate: 92,
      remainingDoses: 15
    }
  ];

  const mockTreatmentGoals = [
    {
      id: '1',
      category: 'symptom_reduction' as const,
      title: 'Reduce Anxiety Symptoms',
      description: 'Decrease anxiety levels from severe to moderate',
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      createdDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      status: 'in_progress' as const,
      progress: 65,
      milestones: [
        { id: '1', title: 'Complete CBT module 1', completed: true, completedDate: new Date() },
        { id: '2', title: 'Practice relaxation techniques daily', completed: false, dueDate: new Date() }
      ],
      interventions: ['CBT therapy', 'Medication management', 'Mindfulness practice'],
      measuredBy: 'GAD-7 Assessment',
      baselineValue: 18,
      targetValue: 10,
      currentValue: 12,
      priority: 'high' as const,
      assignedBy: 'Dr. Sarah Johnson'
    }
  ];

  // Navigation items
  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: Grid3x3 },
    { id: 'therapy', label: 'Therapy Sessions', icon: Brain },
    { id: 'team', label: 'Care Team', icon: Users },
    { id: 'medication', label: 'Medications', icon: Pill },
    { id: 'treatment', label: 'Treatment Plan', icon: Activity },
    { id: 'communication', label: 'Messages', icon: MessageSquare },
    { id: 'records', label: 'Health Records', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex">
      {/* Sidebar Navigation */}
      <motion.div
        initial={{ width: 240 }}
        animate={{ width: isCollapsed ? 60 : 240 }}
        className="bg-white border-r border-gray-200 shadow-sm"
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            {!isCollapsed && (
              <div className="flex items-center space-x-2">
                <Stethoscope className="h-6 w-6 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-900">Professional Care</h2>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          </div>

          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id as any)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    activeView === item.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Info */}
        {!isCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-semibold text-sm">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500">Patient ID: #12345</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {activeView === 'overview' && 'Professional Care Overview'}
              {activeView === 'therapy' && 'Therapy Session Management'}
              {activeView === 'team' && 'Your Care Team'}
              {activeView === 'medication' && 'Medication Management'}
              {activeView === 'treatment' && 'Treatment Plan Progress'}
              {activeView === 'communication' && 'Provider Communication'}
              {activeView === 'records' && 'Health Records'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your mental health care with your professional team
            </p>
          </div>

          {/* Content based on active view */}
          <AnimatePresence mode="wait">
            {activeView === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {/* Therapy Sessions Widget */}
                <div className="lg:col-span-2 xl:col-span-1">
                  <DashboardWidget
                    widget={{
                      id: 'therapy-sessions',
                      type: 'professional_care',
                      title: 'Upcoming Therapy',
                      position: { x: 0, y: 0 },
                      size: { width: 4, height: 3 },
                      priority: 'high',
                      accessibility: {
                        ariaLabel: 'Therapy sessions',
                        keyboardShortcut: 'alt+t',
                        focusOrder: 1
                      }
                    }}
                    loading={false}
                    className="h-full"
                  >
                    <TherapySessionWidget sessions={mockTherapySessions} />
                  </DashboardWidget>
                </div>

                {/* Medication Widget */}
                <div>
                  <DashboardWidget
                    widget={{
                      id: 'medications',
                      type: 'professional_care',
                      title: "Today's Medications",
                      position: { x: 4, y: 0 },
                      size: { width: 4, height: 3 },
                      priority: 'high',
                      accessibility: {
                        ariaLabel: 'Medication management',
                        keyboardShortcut: 'alt+m',
                        focusOrder: 2
                      }
                    }}
                    loading={false}
                    className="h-full"
                  >
                    <MedicationManagement medications={mockMedications} />
                  </DashboardWidget>
                </div>

                {/* Treatment Progress Widget */}
                <div>
                  <DashboardWidget
                    widget={{
                      id: 'treatment-progress',
                      type: 'professional_care',
                      title: 'Treatment Progress',
                      position: { x: 8, y: 0 },
                      size: { width: 4, height: 3 },
                      priority: 'medium',
                      accessibility: {
                        ariaLabel: 'Treatment plan progress',
                        keyboardShortcut: 'alt+p',
                        focusOrder: 3
                      }
                    }}
                    loading={false}
                    className="h-full"
                  >
                    <TreatmentPlanProgress goals={mockTreatmentGoals} />
                  </DashboardWidget>
                </div>

                {/* Care Team Widget */}
                <div className="lg:col-span-2">
                  <DashboardWidget
                    widget={{
                      id: 'care-team',
                      type: 'professional_care',
                      title: 'Care Team',
                      position: { x: 0, y: 3 },
                      size: { width: 8, height: 3 },
                      priority: 'medium',
                      accessibility: {
                        ariaLabel: 'Care team dashboard',
                        keyboardShortcut: 'alt+c',
                        focusOrder: 4
                      }
                    }}
                    loading={false}
                    className="h-full"
                  >
                    <CareTeamDashboard providers={mockProviders} />
                  </DashboardWidget>
                </div>

                {/* Quick Stats */}
                <div>
                  <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Medication Adherence</span>
                        <span className="text-lg font-bold text-green-600">92%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Sessions This Month</span>
                        <span className="text-lg font-bold text-blue-600">3/4</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Treatment Progress</span>
                        <span className="text-lg font-bold text-purple-600">65%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Next Appointment</span>
                        <span className="text-sm font-medium text-gray-700">3 days</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center text-green-600">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        <span className="text-sm">Overall improvement trend</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeView === 'therapy' && (
              <motion.div
                key="therapy"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <TherapySessionWidget sessions={mockTherapySessions} />
              </motion.div>
            )}

            {activeView === 'team' && (
              <motion.div
                key="team"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <CareTeamDashboard providers={mockProviders} />
              </motion.div>
            )}

            {activeView === 'medication' && (
              <motion.div
                key="medication"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <MedicationManagement medications={mockMedications} />
              </motion.div>
            )}

            {activeView === 'treatment' && (
              <motion.div
                key="treatment"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <TreatmentPlanProgress goals={mockTreatmentGoals} />
              </motion.div>
            )}

            {activeView === 'communication' && (
              <motion.div
                key="communication"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-xl shadow-sm p-6 h-[calc(100vh-200px)]"
              >
                <ProviderCommunication />
              </motion.div>
            )}

            {activeView === 'records' && (
              <motion.div
                key="records"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <HealthRecordsIntegration />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}