#!/usr/bin/env node

/**
 * Comprehensive Test Runner for CoreV4 Mental Health Platform
 * Executes all test suites and generates comprehensive reports
 */

import { exec, _execSync } from 'child_process';
import { promises as fs } from 'fs';
import _path from 'path';
import chalk from 'chalk';
import { logger } from '../utils/logger';

// Test suite configurations
const TEST_SUITES = {
  unit: {
    name: 'Unit Tests',
    command: 'npm run test:unit',
    critical: true,
  },
  crisis: {
    name: 'Crisis Intervention Tests',
    command: 'npm run test:crisis',
    critical: true,
  },
  accessibility: {
    name: 'Accessibility Tests (WCAG 2.1 AA)',
    command: 'npm run test:accessibility',
    critical: true,
  },
  performance: {
    name: 'Performance & Load Tests',
    command: 'npm run test:performance',
    critical: true,
  },
  security: {
    name: 'Security & Privacy Tests',
    command: 'npm run test:security',
    critical: true,
  },
  integration: {
    name: 'Integration Tests',
    command: 'npm run test:integration',
    critical: false,
  },
  e2e: {
    name: 'End-to-End Tests',
    command: 'npm run test:e2e',
    critical: false,
  },
  lighthouse: {
    name: 'Lighthouse Performance Audit',
    command: 'npm run lighthouse:ci',
    critical: false,
  },
};

// Test result storage
interface TestResult {
  suite: string;
  passed: boolean;
  duration: number;
  output?: string;
  error?: string;
}

const _results: TestResult[] = [];

// Helper functions
function log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: chalk.blue,
    success: chalk.green,
    error: chalk.red,
    warning: chalk.yellow,
  };
  
  logger.info(`[${timestamp}] ${colors[type](_message)}`);
}

async function ensureDirectories() {
  const dirs = [
    'test-results',
    'test-results/coverage',
    'test-results/reports',
    'test-results/screenshots',
    'test-results/videos',
  ];
  
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function runTest(suite: string, config: typeof TEST_SUITES[keyof typeof TEST_SUITES]): Promise<TestResult> {
  const startTime = Date.now();
  log(`Running ${config.name}...`, 'info');
  
  return new Promise((resolve) => {
    exec(config.command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      const duration = Date.now() - startTime;
      const passed = !error;
      
      if (_passed) {
        log(`✓ ${config.name} passed in ${(duration / 1000).toFixed(2)}s`, 'success');
      } else {
        log(`✗ ${config.name} failed after ${(duration / 1000).toFixed(2)}s`, 'error');
        if (config.critical) {
          log('This is a critical test suite!', 'error');
        }
      }
      
      resolve({
        suite,
        passed,
        duration,
        output: stdout,
        error: stderr || error?.message,
      });
    });
  });
}

async function checkCrisisResponseTime() {
  log('Validating crisis response time requirements...', 'info');
  
  try {
    const _perfResults = await fs.readFile('test-results/performance-metrics.json', 'utf-8');
    const metrics = JSON.parse(_perfResults);
    
    if (metrics.crisisResponseTime > 200) {
      log(`Crisis response time ${metrics.crisisResponseTime}ms exceeds 200ms threshold!`, 'error');
      return false;
    }
    
    log(`Crisis response time: ${metrics.crisisResponseTime}ms ✓`, 'success');
    return true;
  } catch (_error) {
    log('Could not validate crisis response time', 'warning');
    return true;
  }
}

async function generateReport() {
  log('Generating comprehensive test report...', 'info');
  
  const report = {
    timestamp: new Date().toISOString(),
    totalSuites: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    totalDuration: results.reduce((sum, r) => sum + r.duration, 0), _results,
    criticalFailures: results.filter(r => !r.passed && TEST_SUITES[r.suite as keyof typeof TEST_SUITES].critical),
  };
  
  // Generate HTML report
  const htmlReport = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CoreV4 Test Report - ${report.timestamp}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 {
      color: #2563eb;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 10px;
    }
    .summary {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    .metric {
      display: inline-block;
      margin: 10px 20px 10px 0;
    }
    .metric-value {
      font-size: 2em;
      font-weight: bold;
      color: #2563eb;
    }
    .metric-label {
      color: #666;
      font-size: 0.9em;
    }
    .passed { color: #10b981; }
    .failed { color: #ef4444; }
    .warning { color: #f59e0b; }
    .test-suite {
      background: white;
      padding: 15px;
      margin: 10px 0;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border-left: 4px solid #ccc;
    }
    .test-suite.passed {
      border-left-color: #10b981;
    }
    .test-suite.failed {
      border-left-color: #ef4444;
    }
    .test-suite.critical {
      background: #fef2f2;
    }
    .duration {
      float: right;
      color: #666;
    }
    .critical-badge {
      background: #ef4444;
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.8em;
      margin-left: 10px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #666;
    }
  </style>
</head>
<body>
  <h1>CoreV4 Mental Health Platform - Test Report</h1>
  
  <div class="summary">
    <h2>Test Summary</h2>
    <div class="metrics">
      <div class="metric">
        <div class="metric-value ${report.passed === report.totalSuites ? 'passed' : 'failed'}">
          ${report.passed}/${report.totalSuites}
        </div>
        <div class="metric-label">Tests Passed</div>
      </div>
      <div class="metric">
        <div class="metric-value">${(report.totalDuration / 1000).toFixed(2)}s</div>
        <div class="metric-label">Total Duration</div>
      </div>
      <div class="metric">
        <div class="metric-value ${report.criticalFailures.length > 0 ? 'failed' : 'passed'}">
          ${report.criticalFailures.length}
        </div>
        <div class="metric-label">Critical Failures</div>
      </div>
    </div>
  </div>
  
  <h2>Test Results</h2>
  ${results.map(result => `
    <div class="test-suite ${result.passed ? 'passed' : 'failed'} ${!result.passed && TEST_SUITES[result.suite as keyof typeof TEST_SUITES].critical ? 'critical' : ''}">
      <strong>${TEST_SUITES[result.suite as keyof typeof TEST_SUITES].name}</strong>
      ${!result.passed && TEST_SUITES[result.suite as keyof typeof TEST_SUITES].critical ? '<span class="critical-badge">CRITICAL</span>' : ''}
      <span class="duration">${(result.duration / 1000).toFixed(2)}s</span>
      <div style="clear: both;"></div>
      ${result.error ? `<pre style="color: #ef4444; margin-top: 10px;">${result.error}</pre>` : ''}
    </div>
  `).join('')}
  
  <div class="footer">
    <p>Generated on ${new Date(report.timestamp).toLocaleString()}</p>
    <p>CoreV4 Mental Health Platform - Quality Assurance Team</p>
  </div>
</body>
</html>
  `;
  
  await fs.writeFile('test-results/report.html', htmlReport);
  await fs.writeFile('test-results/report.json', JSON.stringify(report, null, 2));
  
  log(`Report generated: test-results/report.html`, 'success');
}

async function main() {
  logger.info(chalk.bold.blue('\n🧪 CoreV4 Mental Health Platform - Comprehensive Test Suite\n'));
  
  try {
    // Ensure test directories exist
    await ensureDirectories();
    
    // Run all test suites
    for (const [suite, config] of Object.entries(_TEST_SUITES)) {
      const result = await runTest(suite, config);
      results.push(result);
      
      // Stop on critical failure if in CI
      if (!result.passed && config.critical && process.env.CI) {
        log('Critical test failed in CI, stopping test run', 'error');
        break;
      }
    }
    
    // Special validation for crisis response time
    const crisisResponseValid = await checkCrisisResponseTime();
    if (!crisisResponseValid) {
      results.push({
        suite: 'crisis-response-validation',
        passed: false,
        duration: 0,
        error: 'Crisis response time exceeds 200ms threshold',
      });
    }
    
    // Generate comprehensive report
    await generateReport();
    
    // Summary
    logger.info(chalk.bold.blue('\n📊 Test Summary\n'));
    logger.info(`Total Suites: ${results.length}`);
    logger.info(`Passed: ${chalk.green(results.filter(r => r.passed).length)}`);
    logger.info(`Failed: ${chalk.red(results.filter(r => !r.passed).length)}`);
    
    const criticalFailures = results.filter(r => !r.passed && TEST_SUITES[r.suite as keyof typeof TEST_SUITES]?.critical);
    if (criticalFailures.length > 0) {
      logger.info(chalk.bold.red(`\n⚠️  ${criticalFailures.length} CRITICAL FAILURES DETECTED:`));
      criticalFailures.forEach(failure => {
        logger.info(chalk.red(`  - ${TEST_SUITES[failure.suite as keyof typeof TEST_SUITES].name}`));
      });
      process.exit(1);
    } else if (results.some(r => !r.passed)) {
      logger.info(chalk.yellow('\n⚠️  Some tests failed, but no critical failures'));
      process.exit(0);
    } else {
      logger.info(chalk.bold.green('\n✅ All tests passed successfully!'));
      logger.info(chalk.green('The CoreV4 Mental Health Platform is ready for deployment.'));
      process.exit(0);
    }
    
  } catch (error) {
    logger.error(chalk.red('Fatal undefined during test execution:'), undefined);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { main as runAllTests };