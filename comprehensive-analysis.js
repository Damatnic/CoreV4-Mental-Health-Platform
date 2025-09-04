#!/usr/bin/env node
/**
 * Comprehensive CoreV4 Platform Analysis Script
 * Scans for TypeScript errors, missing imports, variable references, duplicates, and more
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = process.cwd();
const SRC_DIR = path.join(PROJECT_ROOT, 'src');

class ComprehensiveScanner {
  constructor() {
    this.results = {
      issues: [],
      summary: {
        totalIssues: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        byCategory: {}
      },
      filesToCleanup: [],
      missingFiles: [],
      duplicateData: []
    };

    this.allFiles = [];
    this.tsFiles = [];
    this.tsxFiles = [];
    this.cssFiles = [];
    
    this.scanFiles();
  }

  scanFiles() {
    console.log('🔍 Scanning project files...');
    this.allFiles = this.getFilesRecursively(SRC_DIR);
    this.tsFiles = this.allFiles.filter(f => f.endsWith('.ts') && !f.endsWith('.d.ts'));
    this.tsxFiles = this.allFiles.filter(f => f.endsWith('.tsx'));
    this.cssFiles = this.allFiles.filter(f => f.endsWith('.css') || f.endsWith('.scss'));
    
    console.log(`Found ${this.allFiles.length} total files:`);
    console.log(`  - ${this.tsFiles.length} TypeScript files`);
    console.log(`  - ${this.tsxFiles.length} TypeScript React files`);
    console.log(`  - ${this.cssFiles.length} CSS/SCSS files`);
  }

  getFilesRecursively(dir) {
    const files = [];
    
    try {
      const entries = fs.readdirSync(dir);
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip node_modules, dist, coverage, etc.
          if (!['node_modules', 'dist', 'coverage', '.git', 'test-results'].includes(entry)) {
            files.push(...this.getFilesRecursively(fullPath));
          }
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read directory ${dir}:`, error.message);
    }
    
    return files;
  }

  addIssue(issue) {
    this.results.issues.push(issue);
    this.results.summary.totalIssues++;
    this.results.summary[issue.severity]++;
    
    if (!this.results.summary.byCategory[issue.category]) {
      this.results.summary.byCategory[issue.category] = 0;
    }
    this.results.summary.byCategory[issue.category]++;
  }

  async runComprehensiveScan() {
    console.log('\n🚀 Starting comprehensive platform scan...\n');
    
    // 1. TypeScript Compilation Check
    await this.scanTypeScriptErrors();
    
    // 2. Import/Export Analysis
    await this.scanImportExportIssues();
    
    // 3. Variable Reference Check
    await this.scanVariableReferences();
    
    // 4. Duplicate Code Detection
    await this.scanDuplicateCode();
    
    // 5. Missing Files Check
    await this.scanMissingFiles();
    
    // 6. File Cleanup Analysis
    await this.scanFilesToCleanup();
    
    console.log('\n✅ Comprehensive scan completed!\n');
    return this.results;
  }

  async scanTypeScriptErrors() {
    console.log('🔧 Scanning TypeScript compilation errors...');
    
    try {
      // Run TypeScript compiler to get all errors
      execSync('npx tsc --noEmit --pretty false', { 
        encoding: 'utf8',
        cwd: PROJECT_ROOT 
      });
    } catch (error) {
      const output = error.stdout || error.message;
      const lines = output.split('\n');
      
      for (const line of lines) {
        // Parse TypeScript error format: file(line,col): error TS#### message
        const match = line.match(/^(.+?)\((\d+),(\d+)\):\s*error\s*TS(\d+):\s*(.+)$/);
        if (match) {
          const [, file, lineNum, colNum, errorCode, message] = match;
          
          this.addIssue({
            type: 'typescript',
            severity: this.getTypeScriptErrorSeverity(errorCode),
            file: path.relative(PROJECT_ROOT, file),
            line: parseInt(lineNum),
            column: parseInt(colNum),
            message: `TS${errorCode}: ${message}`,
            category: 'TypeScript Compilation'
          });
        }
      }
    }
  }

  getTypeScriptErrorSeverity(errorCode) {
    const criticalErrors = ['2307', '2304', '2339', '2322', '2345']; // Missing modules, undefined vars, type mismatches
    const highErrors = ['2571', '7053', '2769', '2578']; // Object type issues, no overload matches
    
    if (criticalErrors.includes(errorCode)) return 'critical';
    if (highErrors.includes(errorCode)) return 'high';
    return 'medium';
  }

  async scanImportExportIssues() {
    console.log('📦 Scanning import/export issues...');
    
    const importExportPattern = /^(import|export)\s+.*?from\s+['"]([^'"]+)['"];?$/gm;
    
    for (const file of [...this.tsFiles, ...this.tsxFiles]) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        let match;
        while ((match = importExportPattern.exec(content)) !== null) {
          const [fullMatch, type, modulePath] = match;
          const lineNumber = content.substring(0, match.index).split('\n').length;
          
          // Check if imported module exists
          if (modulePath.startsWith('.')) {
            const resolvedPath = this.resolveRelativeImport(file, modulePath);
            if (!fs.existsSync(resolvedPath)) {
              this.addIssue({
                type: 'import',
                severity: 'critical',
                file: path.relative(PROJECT_ROOT, file),
                line: lineNumber,
                message: `Missing import: ${modulePath} resolves to ${resolvedPath}`,
                suggestion: `Check if file exists or update import path`,
                category: 'Missing Imports'
              });
            }
          }
        }
        
      } catch (error) {
        this.addIssue({
          type: 'import',
          severity: 'medium',
          file: path.relative(PROJECT_ROOT, file),
          message: `Could not analyze imports: ${error.message}`,
          category: 'File Access Issues'
        });
      }
    }
  }

  resolveRelativeImport(fromFile, importPath) {
    const dir = path.join(fromFile, '..');
    let resolved = path.join(dir, importPath);
    
    // Try different extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    for (const ext of extensions) {
      if (fs.existsSync(resolved + ext)) {
        return resolved + ext;
      }
    }
    
    // Try index files
    for (const ext of extensions) {
      const indexPath = path.join(resolved, 'index' + ext);
      if (fs.existsSync(indexPath)) {
        return indexPath;
      }
    }
    
    return resolved;
  }

  async scanVariableReferences() {
    console.log('🔍 Scanning variable references...');
    
    for (const file of [...this.tsFiles, ...this.tsxFiles]) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          // Look for suspicious variable patterns (leading underscores, mismatched variables)
          if (line.includes('_') && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
            // Check for obvious variable reference issues
            const suspiciousPatterns = [
              /_+[a-zA-Z]\w+/g,  // Multiple underscores
              /\b[a-zA-Z]\w*_\w+_\w+/g, // Multiple underscore separators
              /\bnewRoot\b.*\b_newRoot\b/g, // Mismatched variable names
              /\brootElement\b.*\b_rootElement\b/g,
              /\btoasterOptions\b.*\b__toasterOptions\b/g
            ];
            
            suspiciousPatterns.forEach(pattern => {
              const matches = line.match(pattern);
              if (matches) {
                matches.forEach(match => {
                  this.addIssue({
                    type: 'variable',
                    severity: 'high',
                    file: path.relative(PROJECT_ROOT, file),
                    line: index + 1,
                    message: `Suspicious variable reference: ${match}`,
                    suggestion: 'Check if this variable is properly defined and named consistently',
                    category: 'Variable References'
                  });
                });
              }
            });
          }
          
          // Look for common undefined variable patterns from TypeScript errors
          const undefinedPatterns = [
            /\b_this\b/g,
            /\b_device\b/g,
            /\bresults\b.*\.push/g,
            /\b_BREAKPOINTS\b/g,
            /\b_query\b/g,
            /\be\b.*instanceof/g // Catch blocks using 'e' without declaration
          ];
          
          undefinedPatterns.forEach(pattern => {
            if (pattern.test(line) && !line.includes('catch') && !line.includes('const ') && !line.includes('let ') && !line.includes('var ')) {
              this.addIssue({
                type: 'variable',
                severity: 'critical',
                file: path.relative(PROJECT_ROOT, file),
                line: index + 1,
                message: `Potential undefined variable usage in: ${line.trim()}`,
                suggestion: 'Define the variable or fix the reference',
                category: 'Undefined Variables'
              });
            }
          });
        });
        
      } catch (error) {
        // Skip if file can't be read
      }
    }
  }

  async scanDuplicateCode() {
    console.log('🔄 Scanning for duplicate code...');
    
    const codeBlocks = new Map();
    
    for (const file of [...this.tsFiles, ...this.tsxFiles]) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        // Look for duplicate function signatures, interfaces, etc.
        lines.forEach((line, index) => {
          const trimmed = line.trim();
          if (trimmed.length > 20 && (
            trimmed.startsWith('interface ') ||
            trimmed.startsWith('type ') ||
            trimmed.startsWith('const ') ||
            trimmed.startsWith('function ') ||
            trimmed.startsWith('export const ') ||
            trimmed.startsWith('export function ')
          )) {
            const key = trimmed.substring(0, 50); // First 50 chars as key
            if (!codeBlocks.has(key)) {
              codeBlocks.set(key, []);
            }
            codeBlocks.get(key).push(`${path.relative(PROJECT_ROOT, file)}:${index + 1}`);
          }
        });
        
      } catch (error) {
        // Skip if file can't be read
      }
    }
    
    // Find duplicates
    for (const [code, locations] of codeBlocks) {
      if (locations.length > 1) {
        this.results.duplicateData.push({
          type: 'code',
          files: locations,
          content: code
        });
        
        this.addIssue({
          type: 'duplicate',
          severity: 'low',
          file: locations[0].split(':')[0],
          message: `Potential duplicate code found in ${locations.length} files: ${code}`,
          suggestion: 'Consider extracting to shared utility',
          category: 'Code Duplication'
        });
      }
    }
  }

  async scanMissingFiles() {
    console.log('📂 Scanning for missing critical files...');
    
    const criticalFiles = [
      'src/utils/logger.ts',
      'src/components/ErrorBoundary.tsx',
      'src/components/ui/EnhancedLayout.tsx',
      'src/components/navigation/FloatingCrisisButton.tsx',
      'src/contexts/AuthContext.tsx',
      'src/services/api/ApiService.ts'
    ];
    
    criticalFiles.forEach(filePath => {
      const fullPath = path.join(PROJECT_ROOT, filePath);
      if (!fs.existsSync(fullPath)) {
        this.results.missingFiles.push(filePath);
        this.addIssue({
          type: 'missing_file',
          severity: 'critical',
          file: filePath,
          message: `Critical file missing: ${filePath}`,
          suggestion: 'Create this essential file for the application to function',
          category: 'Missing Files'
        });
      }
    });
  }

  async scanFilesToCleanup() {
    console.log('🧹 Scanning for files to cleanup...');
    
    const backupPattern = /\.(backup|bak|old|tmp)(\.\w+)?$/;
    const duplicateFixPattern = /fix-.*\.(cjs|mjs|ps1|js)$/;
    
    for (const file of this.allFiles) {
      const fileName = path.relative(PROJECT_ROOT, file);
      
      // Backup files
      if (backupPattern.test(fileName)) {
        this.results.filesToCleanup.push(fileName);
        this.addIssue({
          type: 'cleanup',
          severity: 'low',
          file: fileName,
          message: 'Backup file detected',
          suggestion: 'Remove if no longer needed',
          category: 'File Cleanup'
        });
      }
      
      // Fix script files (many duplicates in root)
      if (duplicateFixPattern.test(fileName) && !fileName.includes('src/')) {
        this.results.filesToCleanup.push(fileName);
        this.addIssue({
          type: 'cleanup',
          severity: 'medium',
          file: fileName,
          message: 'Fix script file that may be outdated',
          suggestion: 'Review and remove if fixes have been applied',
          category: 'Script Cleanup'
        });
      }
      
      // Empty or near-empty files
      try {
        const content = fs.readFileSync(file, 'utf8');
        if (content.trim().length < 50 && !fileName.includes('test') && !fileName.includes('.d.ts')) {
          this.addIssue({
            type: 'cleanup',
            severity: 'low',
            file: fileName,
            message: 'Nearly empty file',
            suggestion: 'Remove if not needed',
            category: 'File Cleanup'
          });
        }
      } catch (error) {
        // Skip if file can't be read
      }
    }
  }

  generateReport() {
    const { issues, summary, filesToCleanup, duplicateData } = this.results;
    
    let report = `# CoreV4 Platform Comprehensive Analysis Report
Generated: ${new Date().toISOString()}

## Executive Summary
- **Total Issues Found**: ${summary.totalIssues}
- **Critical Issues**: ${summary.critical}
- **High Priority Issues**: ${summary.high}
- **Medium Priority Issues**: ${summary.medium}
- **Low Priority Issues**: ${summary.low}

## Issues by Category
`;

    for (const [category, count] of Object.entries(summary.byCategory)) {
      report += `- **${category}**: ${count} issues\n`;
    }

    report += `\n## Critical Issues (Immediate Action Required)\n`;
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    criticalIssues.forEach((issue, index) => {
      report += `${index + 1}. **${issue.file}${issue.line ? `:${issue.line}` : ''}**\n`;
      report += `   - ${issue.message}\n`;
      if (issue.suggestion) {
        report += `   - *Suggestion*: ${issue.suggestion}\n`;
      }
      report += `\n`;
    });

    report += `\n## High Priority Issues\n`;
    const highIssues = issues.filter(i => i.severity === 'high');
    highIssues.forEach((issue, index) => {
      report += `${index + 1}. **${issue.file}${issue.line ? `:${issue.line}` : ''}**\n`;
      report += `   - ${issue.message}\n`;
      if (issue.suggestion) {
        report += `   - *Suggestion*: ${issue.suggestion}\n`;
      }
      report += `\n`;
    });

    report += `\n## Medium Priority Issues\n`;
    const mediumIssues = issues.filter(i => i.severity === 'medium');
    mediumIssues.slice(0, 20).forEach((issue, index) => { // Limit to first 20 for readability
      report += `${index + 1}. **${issue.file}${issue.line ? `:${issue.line}` : ''}**\n`;
      report += `   - ${issue.message}\n`;
      if (issue.suggestion) {
        report += `   - *Suggestion*: ${issue.suggestion}\n`;
      }
      report += `\n`;
    });

    if (mediumIssues.length > 20) {
      report += `... and ${mediumIssues.length - 20} more medium priority issues.\n\n`;
    }

    report += `\n## File Cleanup Recommendations\n`;
    if (filesToCleanup.length > 0) {
      filesToCleanup.forEach(file => {
        report += `- ${file}\n`;
      });
    } else {
      report += `No files identified for cleanup.\n`;
    }

    report += `\n## Duplicate Code Detection\n`;
    if (duplicateData.length > 0) {
      duplicateData.slice(0, 10).forEach((dup, index) => { // Show first 10
        report += `${index + 1}. **${dup.type}**: Found in ${dup.files.length} files\n`;
        report += `   - Pattern: ${dup.content}\n`;
        report += `   - Files: ${dup.files.join(', ')}\n\n`;
      });
      
      if (duplicateData.length > 10) {
        report += `... and ${duplicateData.length - 10} more potential duplicates.\n\n`;
      }
    } else {
      report += `No significant code duplication detected.\n`;
    }

    report += `\n## Detailed Action Plan\n\n`;
    
    // Group issues by category for action plan
    const issuesByCategory = issues.reduce((acc, issue) => {
      if (!acc[issue.category]) acc[issue.category] = [];
      acc[issue.category].push(issue);
      return acc;
    }, {});

    let taskCounter = 1;
    
    // Priority order for categories
    const priorityOrder = [
      'TypeScript Compilation',
      'Missing Files',
      'Missing Imports',
      'Undefined Variables',
      'Variable References',
      'File Access Issues',
      'Code Duplication',
      'Script Cleanup',
      'File Cleanup'
    ];

    for (const category of priorityOrder) {
      if (issuesByCategory[category]) {
        report += `### ${category}\n`;
        issuesByCategory[category].forEach(issue => {
          report += `${taskCounter}. **${issue.severity.toUpperCase()}** - ${issue.file}${issue.line ? `:${issue.line}` : ''}\n`;
          report += `   - Issue: ${issue.message}\n`;
          if (issue.suggestion) {
            report += `   - Action: ${issue.suggestion}\n`;
          }
          report += `   - [ ] Task ${taskCounter}: Fix ${category.toLowerCase()} issue\n\n`;
          taskCounter++;
        });
        delete issuesByCategory[category];
      }
    }

    // Handle remaining categories
    for (const [category, categoryIssues] of Object.entries(issuesByCategory)) {
      report += `### ${category}\n`;
      categoryIssues.forEach(issue => {
        report += `${taskCounter}. **${issue.severity.toUpperCase()}** - ${issue.file}${issue.line ? `:${issue.line}` : ''}\n`;
        report += `   - Issue: ${issue.message}\n`;
        if (issue.suggestion) {
          report += `   - Action: ${issue.suggestion}\n`;
        }
        report += `   - [ ] Task ${taskCounter}: Fix ${category.toLowerCase()} issue\n\n`;
        taskCounter++;
      });
    }

    report += `\n## Progress Tracking\n`;
    report += `- **Total Tasks**: ${taskCounter - 1}\n`;
    report += `- **Tasks Completed**: 0\n`;
    report += `- **Tasks Remaining**: ${taskCounter - 1}\n`;
    report += `- **Completion Percentage**: 0%\n\n`;

    report += `## Next Steps\n`;
    report += `1. Address all Critical issues first (${summary.critical} issues)\n`;
    report += `2. Fix High priority issues (${summary.high} issues)\n`;
    report += `3. Tackle Medium priority issues in batches\n`;
    report += `4. Clean up identified files\n`;
    report += `5. Re-run this analysis to verify fixes\n`;

    return report;
  }
}

// Main execution
async function main() {
  console.log('🔍 CoreV4 Platform Comprehensive Analysis Starting...\n');
  
  const scanner = new ComprehensiveScanner();
  const results = await scanner.runComprehensiveScan();
  
  const report = scanner.generateReport();
  
  // Write report to file
  const reportFile = path.join(PROJECT_ROOT, 'COMPREHENSIVE_ANALYSIS_RESULTS.md');
  fs.writeFileSync(reportFile, report);
  
  console.log(`📄 Analysis complete! Report saved to: ${reportFile}`);
  console.log(`\n📊 Summary:`);
  console.log(`   Critical Issues: ${results.summary.critical}`);
  console.log(`   High Priority: ${results.summary.high}`);
  console.log(`   Medium Priority: ${results.summary.medium}`);
  console.log(`   Low Priority: ${results.summary.low}`);
  console.log(`   Total Issues: ${results.summary.totalIssues}`);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Analysis failed:', error);
    process.exit(1);
  });
}

module.exports = { ComprehensiveScanner };
