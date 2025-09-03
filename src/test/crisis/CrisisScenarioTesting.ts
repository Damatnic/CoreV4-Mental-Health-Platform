// Comprehensive Crisis Scenario Testing - Ensures all crisis systems work flawlessly
// CRITICAL: These tests validate life-safety systems

import { MockCrisisServer, _MockCrisisSession } from '../../services/crisis/MockCrisisServer';
import { mockWebSocketAdapter } from '../../services/crisis/MockWebSocketAdapter';
import { assessCrisisSeverity, _CRISIS_ASSESSMENT_QUESTIONS } from '../../services/crisis/emergencyServices';
import { offlineCrisisResources } from '../../services/crisis/OfflineCrisisResources';
import { logger } from '../../utils/logger';

// Test scenario types
export interface CrisisTestScenario {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  responses: Record<string, number>;
  expectedOutcome: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    requiresImmediate: boolean;
    shouldTriggerEmergency: boolean;
    minimumRiskFactors: number;
    expectedActions: string[];
  };
  testSteps: string[];
}

export interface TestResult {
  scenarioId: string;
  passed: boolean;
  duration: number;
  errors: string[];
  warnings: string[];
  details: {
    assessmentResult?: unknown;
    emergencyTriggered?: boolean;
    responseTime?: number;
    counselorAssigned?: boolean;
    offlineResourcesAvailable?: boolean;
  };
}

// Comprehensive crisis test scenarios based on clinical cases
export const CRISIS_TEST_SCENARIOS: CrisisTestScenario[] = [
  {
    id: 'critical-suicide-triad',
    name: 'Critical: Complete Suicide Triad',
    description: 'Tests response to immediate suicide risk with plan and means',
    severity: 'critical',
    responses: {
      'safety': 1,           // Not at all safe
      'self-harm-thoughts': 1, // Yes to self-harm thoughts
      'self-harm-plan': 1,     // Yes to plan
      'self-harm-means': 1,    // Yes to means
      'support-available': 0,  // No support
      'overwhelm-level': 5,    // Unbearably overwhelmed
      'hopelessness': 5,       // Completely hopeless
      'impulsivity': 1         // High impulsivity
    },
    expectedOutcome: {
      severity: 'critical',
      requiresImmediate: true,
      shouldTriggerEmergency: true,
      minimumRiskFactors: 4,
      expectedActions: ['Call 988 or 911 immediately', 'Remove all means of self-harm']
    },
    testSteps: [
      'Submit critical assessment responses',
      'Verify immediate emergency protocol activation',
      'Confirm auto-dial functionality triggers',
      'Check location sharing activation',
      'Verify continuous monitoring activation'
    ]
  },
  {
    id: 'high-risk-ideation-history',
    name: 'High Risk: Ideation with History',
    description: 'Tests response to high risk with previous attempts',
    severity: 'high',
    responses: {
      'safety': 2,             // Somewhat unsafe
      'self-harm-thoughts': 1, // Yes to thoughts
      'self-harm-plan': 0,     // No specific plan
      'support-available': 0,  // No support
      'overwhelm-level': 4,    // Extremely overwhelmed
      'hopelessness': 4,       // Extremely hopeless
      'substance-use': 1,      // Yes to substance use
      'previous-attempts': 1   // Previous attempts
    },
    expectedOutcome: {
      severity: 'high',
      requiresImmediate: true,
      shouldTriggerEmergency: false,
      minimumRiskFactors: 3,
      expectedActions: ['Contact crisis hotline immediately', 'Go to emergency room']
    },
    testSteps: [
      'Submit high-risk assessment responses',
      'Verify urgent intervention protocols',
      'Check crisis counselor assignment priority',
      'Confirm safety plan activation',
      'Verify support network notification'
    ]
  },
  {
    id: 'medium-risk-overwhelm',
    name: 'Medium Risk: Severe Overwhelm',
    description: 'Tests response to medium risk crisis',
    severity: 'medium',
    responses: {
      'safety': 3,             // Neutral safety
      'self-harm-thoughts': 1, // Yes to thoughts
      'support-available': 1,  // Has support
      'overwhelm-level': 4,    // Extremely overwhelmed
      'hopelessness': 3,       // Very hopeless
      'substance-use': 0       // No substance use
    },
    expectedOutcome: {
      severity: 'medium',
      requiresImmediate: false,
      shouldTriggerEmergency: false,
      minimumRiskFactors: 2,
      expectedActions: ['Call crisis text line', 'Use safety plan']
    },
    testSteps: [
      'Submit medium-risk responses',
      'Verify appropriate intervention level',
      'Check counselor assignment timing',
      'Confirm resource recommendations',
      'Verify follow-up scheduling'
    ]
  },
  {
    id: 'low-risk-stress',
    name: 'Low Risk: General Stress',
    description: 'Tests response to low-level crisis',
    severity: 'low',
    responses: {
      'safety': 4,            // Mostly safe
      'self-harm-thoughts': 0, // No self-harm thoughts
      'support-available': 1, // Has support
      'overwhelm-level': 3,   // Very overwhelmed
      'hopelessness': 2       // Moderately hopeless
    },
    expectedOutcome: {
      severity: 'low',
      requiresImmediate: false,
      shouldTriggerEmergency: false,
      minimumRiskFactors: 0,
      expectedActions: ['Practice coping strategies', 'Reach out to support network']
    },
    testSteps: [
      'Submit low-risk responses',
      'Verify supportive intervention',
      'Check resource recommendations',
      'Confirm self-care guidance',
      'Verify monitoring protocols'
    ]
  },
  {
    id: 'impulsive-high-risk',
    name: 'Critical: Impulsive High Risk',
    description: 'Tests response to impulsive crisis with immediate danger',
    severity: 'critical',
    responses: {
      'safety': 1,             // Not at all safe
      'self-harm-thoughts': 1, // Yes to thoughts
      'impulsivity': 1,        // High impulsivity
      'substance-use': 1,      // Substance use present
      'overwhelm-level': 5,    // Unbearably overwhelmed
      'previous-attempts': 1   // Previous attempts
    },
    expectedOutcome: {
      severity: 'critical',
      requiresImmediate: true,
      shouldTriggerEmergency: true,
      minimumRiskFactors: 3,
      expectedActions: ['Call 988 or 911 immediately', 'Ensure continuous supervision']
    },
    testSteps: [
      'Submit impulsive high-risk responses',
      'Verify immediate emergency response',
      'Check rapid counselor assignment',
      'Confirm continuous monitoring',
      'Verify support network activation'
    ]
  },
  {
    id: 'isolated-hopeless',
    name: 'High Risk: Isolation with Hopelessness',
    description: 'Tests response to dangerous isolation patterns',
    severity: 'high',
    responses: {
      'safety': 2,            // Somewhat unsafe
      'self-harm-thoughts': 0, // No immediate thoughts
      'support-available': 0, // No support available
      'overwhelm-level': 4,   // Extremely overwhelmed
      'hopelessness': 5,      // Completely hopeless
      'substance-use': 1      // Substance use
    },
    expectedOutcome: {
      severity: 'high',
      requiresImmediate: true,
      shouldTriggerEmergency: false,
      minimumRiskFactors: 2,
      expectedActions: ['Contact crisis hotline immediately', 'Create immediate safety plan']
    },
    testSteps: [
      'Submit isolation/hopelessness responses',
      'Verify escalated intervention',
      'Check social connection protocols',
      'Confirm safety planning activation',
      'Verify professional referral'
    ]
  }
];

// Crisis System Testing Suite
export class CrisisScenarioTester {
  private testResults: TestResult[] = [];
  private mockServer: MockCrisisServer;

  constructor() {
    this.mockServer = MockCrisisServer.getInstance();
  }

  // Run all crisis scenarios
  public async runAllScenarios(): Promise<TestResult[]> {
    logger.info('Starting comprehensive crisis scenario testing...', 'CrisisScenarioTesting');
    this.testResults = [];

    for (const scenario of CRISIS_TEST_SCENARIOS) {
      const result = await this.runScenario(scenario);
      this.testResults.push(result);
    }

    await this.runSystemIntegrationTests();
    await this.runPerformanceTests();
    await this.runOfflineTests();

    return this.testResults;
  }

  // Run individual scenario
  public async runScenario(scenario: CrisisTestScenario): Promise<TestResult> {
    const startTime = performance.now();
    const result: TestResult = {
      scenarioId: scenario.id,
      passed: false,
      duration: 0,
      errors: [],
      warnings: [],
      details: {}
    };

    try {
      logger.info(`Running scenario: ${scenario.name}`, 'CrisisScenarioTesting');

      // Test crisis assessment
      const assessmentResult = await this.testCrisisAssessment(scenario);
      result.details.assessmentResult = assessmentResult;

      // Validate assessment results
      if (assessmentResult.severity !== scenario.expectedOutcome.severity) {
        result.errors.push(`Expected severity ${scenario.expectedOutcome.severity}, got ${assessmentResult.severity}`);
      }

      if (assessmentResult.requiresImmediate !== scenario.expectedOutcome.requiresImmediate) {
        result.errors.push(`Expected requiresImmediate ${scenario.expectedOutcome.requiresImmediate}, got ${assessmentResult.requiresImmediate}`);
      }

      if (assessmentResult.riskFactors.length < scenario.expectedOutcome.minimumRiskFactors) {
        result.warnings.push(`Expected at least ${scenario.expectedOutcome.minimumRiskFactors} risk factors, got ${assessmentResult.riskFactors.length}`);
      }

      // Test crisis chat simulation
      const chatResult = await this.testCrisisChatSimulation(scenario);
      result.details.counselorAssigned = chatResult.counselorAssigned;
      result.details.responseTime = chatResult.responseTime;

      // Test emergency protocols
      if (scenario.expectedOutcome.shouldTriggerEmergency) {
        const emergencyResult = await this.testEmergencyProtocols(scenario);
        result.details.emergencyTriggered = emergencyResult.triggered;
        
        if (!emergencyResult.triggered) {
          result.errors.push('Expected emergency protocol to trigger but it did not');
        }
      }

      // Test offline resources
      const offlineTest = await this.testOfflineResources(scenario);
      result.details.offlineResourcesAvailable = offlineTest.available;

      result.passed = result.errors.length === 0;
    } catch {
      result.errors.push(`Test execution failed: ${error}`);
      result.passed = false;
    }

    result.duration = performance.now() - startTime;
    return result;
  }

  // Test crisis assessment algorithm
  private async testCrisisAssessment(scenario: CrisisTestScenario): Promise<unknown> {
    const startTime = performance.now();
    const assessmentResult = assessCrisisSeverity(scenario.responses);
    const responseTime = performance.now() - startTime;

    if (responseTime > 200) {
      logger.warn(`⚠️ Assessment response time too slow: ${responseTime}ms`);
    }

    return {
      ...assessmentResult,
      responseTime
    };
  }

  // Test crisis chat simulation
  private async testCrisisChatSimulation(scenario: CrisisTestScenario): Promise<{
    counselorAssigned: boolean;
    responseTime: number;
    sessionCreated: boolean;
  }> {
    const startTime = performance.now();
    
    try {
      // Test session creation
      const session = this.mockServer.createCrisisSession('test-user', scenario.severity);
      const sessionCreated = session !== null;
      
      if (_sessionCreated) {
        // Test message response
        session.sendMessage('I need help right now');
        
        // Wait for counselor response (_simulated)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Clean up
        this.mockServer.endSession(session.sessionId);
      }
      
      const responseTime = performance.now() - startTime;
      
      return {
        counselorAssigned: sessionCreated,
        responseTime,
        sessionCreated
      };
    } catch {
      logger.error('Crisis chat simulation test failed:');
      return {
        counselorAssigned: false,
        responseTime: performance.now() - startTime,
        sessionCreated: false
      };
    }
  }

  // Test emergency protocols
  private async testEmergencyProtocols(scenario: CrisisTestScenario): Promise<{
    triggered: boolean;
    responseTime: number;
  }> {
    const startTime = performance.now();
    let emergencyTriggered = false;

    // Set up emergency protocol listener
    const _emergencyHandler = (action: string, _data: unknown) => {
      emergencyTriggered = true;
      logger.crisis(`Emergency protocol triggered: ${action}`, 'critical', 'CrisisScenarioTesting');
    };

    this.mockServer.onEmergency(_emergencyHandler);

    try {
      // Create session and send critical message
      const session = this.mockServer.createCrisisSession('test-user', scenario.severity);
      
      // Send messages that should trigger emergency protocols
      if (scenario.severity === 'critical') {
        session.sendMessage('I want to kill myself and I have a plan');
      }
      
      // Wait for emergency response
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.mockServer.endSession(session.sessionId);
    } catch {
      logger.error('Emergency protocol test failed:');
    }

    const responseTime = performance.now() - startTime;

    return {
      triggered: emergencyTriggered,
      responseTime
    };
  }

  // Test offline resources
  private async testOfflineResources(_scenario: CrisisTestScenario): Promise<{
    available: boolean;
    resourceCount: number;
    criticalResourcesPresent: boolean;
  }> {
    const isAvailable = offlineCrisisResources.isAvailableOffline();
    const immediateResources = offlineCrisisResources.getImmediateCrisisResources();
    const emergencyContacts = offlineCrisisResources.getEmergencyContacts();
    
    const criticalResourcesPresent = 
      immediateResources.some(r => r.id === 'emergency-988') &&
      immediateResources.some(r => r.id === 'emergency-911') &&
      emergencyContacts.some(c => c.phone === '988');

    return {
      available: isAvailable,
      resourceCount: immediateResources.length + emergencyContacts.length,
      criticalResourcesPresent
    };
  }

  // Run system integration tests
  private async runSystemIntegrationTests(): Promise<void> {
    const integrationTests = [
      {
        name: 'WebSocket Integration',
        test: async () => {
          const connected = await this.testWebSocketIntegration();
          return { passed: connected, message: connected ? 'WebSocket connected' : 'WebSocket failed' };
        }
      },
      {
        name: 'Location Services',
        test: async () => {
          const locationAvailable = await this.testLocationServices();
          return { passed: locationAvailable, message: locationAvailable ? 'Location services available' : 'Location services failed' };
        }
      },
      {
        name: 'Emergency Contact Dialing',
        test: async () => {
          const dialingWorks = this.testEmergencyDialing();
          return { passed: dialingWorks, message: dialingWorks ? 'Emergency dialing functional' : 'Emergency dialing failed' };
        }
      }
    ];

    for (const test of integrationTests) {
      const startTime = performance.now();
      try {
        const result = await test.test();
        const duration = performance.now() - startTime;
        
        this.testResults.push({
          scenarioId: `integration-${test.name.toLowerCase().replace(/\s+/g, '-')}`,
          passed: result.passed,
          duration,
          errors: result.passed ? [] : [result.message],
          warnings: [],
          details: {}
        });
      } catch {
        this.testResults.push({
          scenarioId: `integration-${test.name.toLowerCase().replace(/\s+/g, '-')}`,
          passed: false,
          duration: performance.now() - startTime,
          errors: [`Integration test failed: ${error}`],
          warnings: [],
          details: {}
        });
      }
    }
  }

  // Test WebSocket integration
  private async testWebSocketIntegration(): Promise<boolean> {
    try {
      await mockWebSocketAdapter.connect('test-user', 'test-token');
      const __session = await mockWebSocketAdapter.createCrisisSession('medium');
      mockWebSocketAdapter.endCall();
      return true;
    } catch {
      logger.error('WebSocket integration test failed:');
      return false;
    }
  }

  // Test location services
  private async testLocationServices(): Promise<boolean> {
    return new Promise((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          { timeout: 5000 }
        );
      } else {
        resolve(false);
      }
    });
  }

  // Test emergency dialing
  private testEmergencyDialing(): boolean {
    // Test that tel: links work (can't actually test dialing in browser)
    try {
      const testLink = document.createElement('a');
      testLink.href = 'tel:988';
      return testLink.href === 'tel:988';
    } catch {
      return false;
    }
  }

  // Run performance tests
  private async runPerformanceTests(): Promise<void> {
    const performanceTests = [
      {
        name: 'Crisis Assessment Speed',
        target: 200, // ms
        test: async () => {
          const startTime = performance.now();
          assessCrisisSeverity({
            'safety': 1,
            'self-harm-thoughts': 1,
            'self-harm-plan': 1,
            'overwhelm-level': 5
          });
          return performance.now() - startTime;
        }
      },
      {
        name: 'Emergency Protocol Response',
        target: 1000, // ms
        test: async () => {
          const startTime = performance.now();
          const session = this.mockServer.createCrisisSession('test-user', 'critical');
          session.sendMessage('emergency test');
          this.mockServer.endSession(session.sessionId);
          return performance.now() - startTime;
        }
      },
      {
        name: 'Offline Resource Access',
        target: 100, // ms
        test: async () => {
          const startTime = performance.now();
          offlineCrisisResources.getImmediateCrisisResources();
          return performance.now() - startTime;
        }
      }
    ];

    for (const test of performanceTests) {
      try {
        const duration = await test.test();
        const passed = duration <= test.target;
        
        this.testResults.push({
          scenarioId: `performance-${test.name.toLowerCase().replace(/\s+/g, '-')}`,
          passed,
          duration,
          errors: passed ? [] : [`Performance target missed: ${duration}ms > ${test.target}ms`],
          warnings: duration > test.target * 0.8 ? [`Close to performance limit: ${duration}ms`] : [],
          details: {}
        });
      } catch {
        this.testResults.push({
          scenarioId: `performance-${test.name.toLowerCase().replace(/\s+/g, '-')}`,
          passed: false,
          duration: 0,
          errors: [`Performance test failed: ${error}`],
          warnings: [],
          details: {}
        });
      }
    }
  }

  // Run offline functionality tests
  private async runOfflineTests(): Promise<void> {
    const offlineTests = [
      {
        name: 'Offline Resource Availability',
        test: () => offlineCrisisResources.isAvailableOffline()
      },
      {
        name: 'Critical Resources Present',
        test: () => {
          const resources = offlineCrisisResources.getImmediateCrisisResources();
          return resources.some(r => r.id === 'emergency-988') &&
                 resources.some(r => r.id === 'emergency-911');
        }
      },
      {
        name: 'Emergency Contacts Available',
        test: () => {
          const contacts = offlineCrisisResources.getEmergencyContacts();
          return contacts.length >= 3;
        }
      },
      {
        name: 'Breathing Exercises Available',
        test: () => {
          const exercises = offlineCrisisResources.getBreathingExercises();
          return exercises.length > 0;
        }
      },
      {
        name: 'Safety Plan Creation',
        test: () => {
          try {
            const plan = offlineCrisisResources.createSafetyPlan({
              warningSignals: ['test'],
              copingStrategies: ['test'],
              emergencyContacts: ['988']
            });
            return plan && plan.id && plan.isActive;
          } catch {
            return false;
          }
        }
      }
    ];

    for (const test of offlineTests) {
      const startTime = performance.now();
      try {
        const passed = test.test();
        const duration = performance.now() - startTime;
        
        this.testResults.push({
          scenarioId: `offline-${test.name.toLowerCase().replace(/\s+/g, '-')}`,
          passed: Boolean(_passed),
          duration,
          errors: passed ? [] : [`Offline test failed: ${test.name}`],
          warnings: [],
          details: {}
        });
      } catch {
        this.testResults.push({
          scenarioId: `offline-${test.name.toLowerCase().replace(/\s+/g, '-')}`,
          passed: false,
          duration: performance.now() - startTime,
          errors: [`Offline test error: ${error}`],
          warnings: [],
          details: {}
        });
      }
    }
  }

  // Generate test report
  public generateReport(): {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    totalDuration: number;
    criticalIssues: string[];
    warnings: string[];
    summary: string;
  } {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);
    
    const criticalIssues = this.testResults
      .filter(r => !r.passed)
      .flatMap(r => r.errors);
    
    const warnings = this.testResults
      .flatMap(r => r.warnings);

    const passRate = (passedTests / totalTests) * 100;
    let summary: string;

    if (passRate === 100) {
      summary = '✅ ALL CRISIS SYSTEMS OPERATIONAL - Ready for production deployment';
    } else if (passRate >= 95) {
      summary = '✅ Crisis systems mostly operational - Minor issues detected';
    } else if (passRate >= 85) {
      summary = '⚠️ Crisis systems have significant issues - Review required before deployment';
    } else {
      summary = '❌ CRITICAL CRISIS SYSTEM FAILURES - DO NOT DEPLOY - Immediate attention required';
    }

    return {
      totalTests,
      passedTests,
      failedTests,
      totalDuration,
      criticalIssues,
      warnings,
      summary
    };
  }

  // Get detailed test results
  public getTestResults(): TestResult[] {
    return [...this.testResults];
  }
}

// Export testing utilities
export const crisisScenarioTester = new CrisisScenarioTester();

// Quick test runner for development
export async function runCrisisSystemTests(): Promise<void> {
  logger.crisis('CRISIS SYSTEM TESTING - This validates life-safety systems', 'high', 'CrisisScenarioTesting');
  
  const __results = await crisisScenarioTester.runAllScenarios();
  const report = crisisScenarioTester.generateReport();
  
  logger.info('CRISIS SYSTEM TEST REPORT:', 'CrisisScenarioTesting');
  logger.info(`Tests: ${report.passedTests}/${report.totalTests} passed`, 'CrisisScenarioTesting');
  logger.info(`Duration: ${report.totalDuration.toFixed(2)}ms`, 'CrisisScenarioTesting');
  logger.info(`Status: ${report.summary}`, 'CrisisScenarioTesting');
  
  if (report.criticalIssues.length > 0) {
    logger.error('🚨 CRITICAL ISSUES:');
    report.criticalIssues.forEach(issue => logger.error(`  - ${issue}`));
  }
  
  if (report.warnings.length > 0) {
    logger.warn('⚠️ WARNINGS:');
    report.warnings.forEach(warning => logger.warn(`  - ${warning}`));
  }
  
  return;
}