import { logger } from '@/utils/logger';
// Crisis Infrastructure Demonstration Hub - Showcases all crisis system capabilities
// CRITICAL: This demonstrates life-safety systems for stakeholder review

import React, { useState, useEffect } from 'react';
import { 
  Shield, Phone, MessageSquare, _MapPin, Brain, TestTube, WifiOff,
  AlertTriangle, Heart, _Clock, _CheckCircle, _XCircle,
  BarChart3, Activity
} from 'lucide-react';
import { EnhancedCrisisChat } from './EnhancedCrisisChat';
import { EmergencyServicesInterface } from './EmergencyServicesInterface';
import { mockWebSocketAdapter } from '../../services/crisis/MockWebSocketAdapter';
import { crisisScenarioTester, CrisisTestScenario, CRISIS_TEST_SCENARIOS } from '../../test/crisis/CrisisScenarioTesting';
import { offlineCrisisResources } from '../../services/crisis/OfflineCrisisResources';
import { assessCrisisSeverity } from '../../services/crisis/emergencyServices';
import { toast } from 'react-hot-toast';

interface SystemStatus {
  crisisChat: 'online' | 'offline' | 'testing';
  emergencyServices: 'active' | 'inactive';
  offlineResources: 'available' | 'unavailable';
  locationServices: 'enabled' | 'disabled';
  assessmentAlgorithm: 'operational' | 'error';
}

interface DemoStats {
  totalTests: number;
  passedTests: number;
  avgResponseTime: number;
  emergencyProtocolsActive: number;
  activeResources: number;
}

interface TestReport {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
  scenarios: Array<{
    name: string;
    passed: boolean;
    duration: number;
    error?: string;
  }>;
}

export function CrisisDemonstrationHub() {
  const [_activeDemo, setActiveDemo] = useState<string>('overview');
  const [_systemStatus, _setSystemStatus] = useState<SystemStatus>({
    crisisChat: 'offline',
    emergencyServices: 'inactive',
    offlineResources: 'unavailable',
    locationServices: 'disabled',
    assessmentAlgorithm: 'operational'
  });
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, _setTestResults] = useState<TestReport | null>(null);
  const [demoStats, setDemoStats] = useState<DemoStats>({
    totalTests: 0,
    passedTests: 0,
    avgResponseTime: 0,
    emergencyProtocolsActive: 0,
    activeResources: 0
  });
  const [simulatedScenario, _setSimulatedScenario] = useState<CrisisTestScenario | null>(null);

  // Initialize demonstration systems
  useEffect(() => {
    initializeDemoSystems();
    updateSystemStatus();
    loadDemoStats();
  }, []);

  // Initialize all demo systems
  const initializeDemoSystems = async () => {
    try {
      // Initialize WebSocket adapter
      await mockWebSocketAdapter.connect('demo-user', 'demo-token');
      
      // Check offline resources
      const offlineStatus = offlineCrisisResources.isAvailableOffline();
      
      // Check location services
      const locationAvailable = 'geolocation' in navigator;
      
      setSystemStatus(prev => ({
        ...prev,
        crisisChat: 'online',
        offlineResources: offlineStatus ? 'available' : 'unavailable',
        locationServices: locationAvailable ? 'enabled' : 'disabled',
        emergencyServices: 'active'
      }));
      
      toast.success('Crisis demonstration systems initialized');
    } catch (error) {
      logger.error('Demo initialization failed', 'CrisisDemonstrationHub', error);
      toast.error('Some demo systems failed to initialize');
    }
  };

  // Update system status - DISABLED: No periodic updates to prevent alerts
  const updateSystemStatus = () => {
    // DISABLED: Demo mode interval removed to prevent beeping/alerts
    // Originally ran every 5000ms but caused unwanted notification sounds
  };

  // Load demonstration statistics
  const loadDemoStats = () => {
    const __stats = mockWebSocketAdapter.getServerStats();
    const offlineStats = offlineCrisisResources.getConnectionStatus();
    
    setDemoStats({
      totalTests: CRISIS_TEST_SCENARIOS.length,
      passedTests: 0, // Will be updated by tests
      avgResponseTime: 150, // Simulated
      emergencyProtocolsActive: 4,
      activeResources: offlineStats.resourceCount
    });
  };

  // Run crisis system tests
  const runSystemTests = async () => {
    setIsRunningTests(true);
    toast.loading('Running comprehensive crisis system tests...');
    
    try {
      const __results = await crisisScenarioTester.runAllScenarios();
      const report = crisisScenarioTester.generateReport();
      
      setTestResults(report);
      setDemoStats(prev => ({
        ...prev,
        totalTests: report.totalTests,
        passedTests: report.passedTests,
        avgResponseTime: report.totalDuration / report.totalTests
      }));
      
      toast.dismiss();
      if (report.passedTests === report.totalTests) {
        toast.success('All crisis system tests passed! ✅');
      } else {
        toast.error(`${report.failedTests} tests failed - Review required`);
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Test execution failed');
      logger.error('Test failed', 'CrisisDemonstrationHub', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Simulate crisis scenario
  const simulateScenario = (scenario: CrisisTestScenario) => {
    setSimulatedScenario(_scenario);
    setActiveDemo('crisis-simulation');
    
    // Show scenario details
    toast.success(`Simulating: ${scenario.name}`, {
      duration: 5000,
      icon: '🎭'
    });
  };

  // Test emergency protocols
  const testEmergencyProtocols = (type: 'suicide_risk' | 'medical_emergency' | 'connection_loss') => {
    mockWebSocketAdapter.testEmergencyProtocol(type);
    toast.success(`Testing ${type.replace('_', ' ')} protocol`);
  };

  // Get status indicator color
  const getStatusColor = (status: string, type: string): string => {
    const statusMap: { [key: string]: { [key: string]: string } } = {
      crisisChat: {
        online: 'bg-green-500',
        offline: 'bg-red-500',
        testing: 'bg-yellow-500'
      },
      default: {
        active: 'bg-green-500',
        operational: 'bg-green-500',
        available: 'bg-green-500',
        enabled: 'bg-green-500',
        inactive: 'bg-gray-500',
        error: 'bg-red-500',
        unavailable: 'bg-red-500',
        disabled: 'bg-gray-500'
      }
    };
    
    return statusMap[type]?.[status] || statusMap.default?.[status] || 'bg-gray-500';
  };

  // Render system status panel
  const renderSystemStatus = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
        <Activity className="h-6 w-6 mr-2" />
        System Status
      </h3>
      
      <div className="space-y-3">
        {Object.entries(_systemStatus).map(([system, status]) => (
          <div key={system} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`h-3 w-3 rounded-full ${getStatusColor(status, system)}`}></div>
              <span className="font-medium capitalize">{system.replace(/([A-Z])/g, ' $1').trim()}</span>
            </div>
            <span className="text-sm text-gray-600 capitalize">{status}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{demoStats.activeResources}</div>
          <div className="text-xs text-blue-600">Offline Resources</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{demoStats.avgResponseTime.toFixed(0)}ms</div>
          <div className="text-xs text-green-600">Avg Response Time</div>
        </div>
      </div>
    </div>
  );

  // Render demo navigation
  const renderDemoNavigation = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Crisis System Demonstrations</h3>
      
      <div className="grid grid-cols-1 gap-3">
        {[
          { id: 'overview', label: 'System Overview', icon: BarChart3, description: 'Complete system status and capabilities' },
          { id: 'crisis-chat', label: 'Crisis Chat Demo', icon: MessageSquare, description: 'AI counselor chat simulation' },
          { id: 'emergency-services', label: 'Emergency Services', icon: Phone, description: 'GPS location & 911 dispatch' },
          { id: 'offline-resources', label: 'Offline Resources', icon: WifiOff, description: 'Offline crisis support tools' },
          { id: 'assessment-demo', label: 'Risk Assessment', icon: Brain, description: 'AI-powered crisis assessment' },
          { id: 'testing-suite', label: 'Testing Suite', icon: TestTube, description: 'Comprehensive system testing' }
        ].map((demo) => (
          <button
            key={demo.id}
            onClick={() => setActiveDemo(demo.id)}
            className={`p-4 rounded-lg text-left transition-colors ${
              activeDemo === demo.id
                ? 'bg-red-100 border-2 border-red-500'
                : 'bg-gray-50 border-2 border-transparent hover:bg-red-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <demo.icon className="h-6 w-6 text-red-600" />
              <div>
                <div className="font-semibold text-gray-900">{demo.label}</div>
                <div className="text-sm text-gray-600">{demo.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // Render test scenarios
  const renderTestScenarios = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Crisis Test Scenarios</h3>
        <button
          onClick={runSystemTests}
          disabled={isRunningTests}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          {isRunningTests ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Running Tests...</span>
            </>
          ) : (
            <>
              <TestTube className="h-4 w-4" />
              <span>Run All Tests</span>
            </>
          )}
        </button>
      </div>

      {testResults && (
        <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{testResults.passedTests}</div>
              <div className="text-sm text-gray-600">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{testResults.failedTests}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{testResults.totalTests}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{testResults.totalDuration.toFixed(0)}ms</div>
              <div className="text-sm text-gray-600">Duration</div>
            </div>
          </div>
          <div className="text-center font-semibold p-3 rounded-lg bg-gray-50">
            {testResults.summary}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CRISIS_TEST_SCENARIOS.map((scenario) => (
          <div key={scenario.id} className="bg-white rounded-lg p-4 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">{scenario.name}</h4>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                scenario.severity === 'critical' ? 'bg-red-100 text-red-800' :
                scenario.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                scenario.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {scenario.severity}
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
            <div className="flex space-x-2">
              <button
                onClick={() => simulateScenario(_scenario)}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                Simulate
              </button>
              <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render active demonstration content
  const renderActiveDemo = () => {
    switch (_activeDemo) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl p-8">
              <div className="flex items-center space-x-4">
                <Shield className="h-12 w-12" />
                <div>
                  <h2 className="text-3xl font-bold">Crisis Infrastructure System</h2>
                  <p className="text-red-100 text-lg">24/7 Life-Safety Mental Health Support Platform</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <MessageSquare className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">AI Crisis Chat</h3>
                <p className="text-sm text-gray-600">Real-time counselor simulation with emergency escalation</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <Phone className="h-12 w-12 text-red-600 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Emergency Services</h3>
                <p className="text-sm text-gray-600">GPS location sharing with 911 dispatch simulation</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <Brain className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Risk Assessment</h3>
                <p className="text-sm text-gray-600">AI-powered suicide risk evaluation with clinical accuracy</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <WifiOff className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Offline Resources</h3>
                <p className="text-sm text-gray-600">Critical support tools available without internet</p>
              </div>
            </div>
          </div>
        );

      case 'crisis-chat':
        return (
          <div>
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800">Demonstration Mode</h4>
                  <p className="text-sm text-yellow-700">This is a realistic simulation of crisis chat. In production, users would be connected to certified crisis counselors.</p>
                </div>
              </div>
            </div>
            <EnhancedCrisisChat />
          </div>
        );

      case 'emergency-services':
        return <EmergencyServicesInterface 
          crisisProfile={{
            userId: 'demo',
            riskLevel: 'elevated',
            indicators: ['stress', 'anxiety'],
            patterns: [],
            recommendations: [],
            lastUpdated: new Date()
          }}
        />;

      case 'offline-resources':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <WifiOff className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-800">Offline Mode Active</h4>
                  <p className="text-sm text-green-700">These resources remain available even without internet connection.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-red-600" />
                  Emergency Contacts
                </h3>
                {offlineCrisisResources.getEmergencyContacts().slice(0, 4).map(contact => (
                  <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
                    <div>
                      <div className="font-semibold text-sm">{contact.name}</div>
                      <div className="text-xs text-gray-600">{contact.phone}</div>
                    </div>
                    <button
                      onClick={() => window.location.href = `tel:${contact.phone}`}
                      className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg"
                    >
                      Call
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-purple-600" />
                  Immediate Resources
                </h3>
                {offlineCrisisResources.getImmediateCrisisResources().slice(0, 4).map(resource => (
                  <div key={resource.id} className="p-3 bg-gray-50 rounded-lg mb-2">
                    <div className="font-semibold text-sm">{resource.title}</div>
                    <div className="text-xs text-gray-600">{resource.content.substring(0, 80)}...</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'assessment-demo':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">AI-Powered Crisis Risk Assessment</h3>
              <div className="space-y-4">
                {CRISIS_TEST_SCENARIOS.slice(0, 3).map(scenario => (
                  <div key={scenario.id} className="border-2 border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">{scenario.name}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Expected Severity:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                          scenario.expectedOutcome.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          scenario.expectedOutcome.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          scenario.expectedOutcome.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {scenario.expectedOutcome.severity}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Immediate Response:</span>
                        <span className={`ml-2 ${scenario.expectedOutcome.requiresImmediate ? 'text-red-600' : 'text-green-600'}`}>
                          {scenario.expectedOutcome.requiresImmediate ? 'Required' : 'Not Required'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const result = assessCrisisSeverity(scenario.responses);
                        toast.success(`Assessment Complete: ${result.severity} risk level`, {
                          duration: 3000
                        });
                      }}
                      className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      Run Assessment
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'testing-suite':
        return renderTestScenarios();

      case 'crisis-simulation':
        return simulatedScenario ? (
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-bold text-red-800 mb-2">Simulating: {simulatedScenario.name}</h3>
              <p className="text-sm text-red-700">{simulatedScenario.description}</p>
            </div>
            <EnhancedCrisisChat />
          </div>
        ) : null;

      default:
        return <div>Select a demonstration from the menu</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-red-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Crisis Infrastructure Demo</h1>
                <p className="text-sm text-gray-600">Comprehensive Mental Health Crisis Support System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => testEmergencyProtocols('suicide_risk')}
                  className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                >
                  Test 988 Protocol
                </button>
                <button
                  onClick={() => testEmergencyProtocols('medical_emergency')}
                  className="px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Test 911 Protocol
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="space-y-6">
            {renderDemoNavigation()}
            {renderSystemStatus()}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {renderActiveDemo()}
          </div>
        </div>
      </div>

      {/* Emergency Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white p-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Crisis Support Available 24/7</span>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => window.location.href = 'tel:988'}
              className="px-3 py-1 bg-white text-red-600 rounded font-semibold hover:bg-red-50 transition-colors"
            >
              Call 988
            </button>
            <button
              onClick={() => window.location.href = 'tel:911'}
              className="px-3 py-1 bg-white text-red-600 rounded font-semibold hover:bg-red-50 transition-colors"
            >
              Call 911
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}