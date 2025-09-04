#!/usr/bin/env node
/**
 * Comprehensive CoreV4 Platform Analysis Script
 * Scans for TypeScript errors, missing imports, variable references, duplicates, and more
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, extname, relative } from 'path';
import { execSync } from 'child_process';

const PROJECT_ROOT = process.cwd();
const SRC_DIR = join(PROJECT_ROOT, 'src');

interface Issue {
  type: 'typescript' | 'import' | 'export' | 'variable' | 'duplicate' | 'css' | 'missing_util' | 'runtime' | 'unused' | 'outdated';
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line?: number;
  column?: number;
  message: string;
  suggestion?: string;
  category: string;
}

interface ScanResults {
  issues: Issue[];
  summary: {
    totalIssues: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    byCategory: Record<string, number>;
  };
  filesToCleanup: string[];
  missingFiles: string[];
  duplicateData: Array<{ type: string; files: string[]; content: string }>;
}

class ComprehensiveScanner {
  private results: ScanResults = {
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

  private allFiles: string[] = [];
  private tsFiles: string[] = [];
  private tsxFiles: string[] = [];
  private cssFiles: string[] = [];

  constructor() {
    this.scanFiles();
  }

  private scanFiles(): void {
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

  private getFilesRecursively(dir: string): string[] {
    const files: string[] = [];
    
    try {
      const entries = readdirSync(dir);
      
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        
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

  private addIssue(issue: Issue): void {
    this.results.issues.push(issue);
    this.results.summary.totalIssues++;
    this.results.summary[issue.severity]++;
    
    if (!this.results.summary.byCategory[issue.category]) {
      this.results.summary.byCategory[issue.category] = 0;
    }
    this.results.summary.byCategory[issue.category]++;
  }

  async runComprehensiveScan(): Promise<ScanResults> {
    console.log('\n🚀 Starting comprehensive platform scan...\n');
    
    // 1. TypeScript Compilation Check
    await this.scanTypeScriptErrors();
    
    // 2. Import/Export Analysis
    await this.scanImportExportIssues();
    
    // 3. Variable Reference Check
    await this.scanVariableReferences();
    
    // 4. Duplicate Code Detection
    await this.scanDuplicateCode();
    
    // 5. CSS Issues
    await this.scanCSSIssues();
    
    // 6. Missing Utilities/Components
    await this.scanMissingUtilities();
    
    // 7. Runtime Error Detection
    await this.scanRuntimeErrors();
    
    // 8. Unused Code Detection
    await this.scanUnusedCode();
    
    // 9. Outdated Implementations
    await this.scanOutdatedImplementations();
    
    // 10. File Cleanup Analysis
    await this.scanFilesToCleanup();
    
    console.log('\n✅ Comprehensive scan completed!\n');
    return this.results;
  }

  private async scanTypeScriptErrors(): Promise<void> {
    console.log('🔧 Scanning TypeScript compilation errors...');
    
    try {
      // Run TypeScript compiler to get all errors
      const tscOutput = execSync('npx tsc --noEmit --pretty false', { 
        encoding: 'utf8',
        cwd: PROJECT_ROOT 
      });
    } catch (error) {
      const output = error.stdout || error.message;
      const lines = output.split('\n');
      
      for (const line of lines) {
        // Parse TypeScript error format: file(line,col): error TS#### message
        const match = line.match(/^(.+?)\\((\d+),(\d+)\\):\s*error\s*TS(\d+):\s*(.+)$/);
        if (match) {
          const [, file, lineNum, colNum, errorCode, message] = match;
          
          this.addIssue({
            type: 'typescript',
            severity: this.getTypeScriptErrorSeverity(errorCode),
            file: relative(PROJECT_ROOT, file),
            line: parseInt(lineNum),
            column: parseInt(colNum),
            message: `TS${errorCode}: ${message}`,
            category: 'TypeScript Compilation'
          });
        }
      }
    }
  }

  private getTypeScriptErrorSeverity(errorCode: string): 'critical' | 'high' | 'medium' | 'low' {
    const criticalErrors = ['2307', '2304', '2339', '2322', '2345']; // Missing modules, undefined vars, type mismatches
    const highErrors = ['2571', '7053', '2769', '2578']; // Object type issues, no overload matches
    
    if (criticalErrors.includes(errorCode)) return 'critical';
    if (highErrors.includes(errorCode)) return 'high';
    return 'medium';
  }

  private async scanImportExportIssues(): Promise<void> {
    console.log('📦 Scanning import/export issues...');
    
    const importExportPattern = /^(import|export)\s+.*?from\s+['"]([^'"]+)['"];?$/gm;
    const exportPattern = /^export\s+(const|function|class|interface|type|enum)\s+(\w+)/gm;
    
    for (const file of [...this.tsFiles, ...this.tsxFiles]) {
      try {
        const content = readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        let match;
        while ((match = importExportPattern.exec(content)) !== null) {
          const [fullMatch, type, modulePath] = match;
          const lineNumber = content.substring(0, match.index).split('\n').length;
          
          // Check if imported module exists
          if (modulePath.startsWith('.')) {
            const resolvedPath = this.resolveRelativeImport(file, modulePath);
            if (!existsSync(resolvedPath)) {
              this.addIssue({
                type: 'import',
                severity: 'critical',
                file: relative(PROJECT_ROOT, file),
                line: lineNumber,
                message: `Missing import: ${modulePath} resolves to ${resolvedPath}`,
                suggestion: `Check if file exists or update import path`,
                category: 'Missing Imports'
              });
            }
          }
        }
        
        // Check for export issues
        exportPattern.lastIndex = 0;
        while ((match = exportPattern.exec(content)) !== null) {
          const [, , exportName] = match;
          // This could be expanded to check if exports are actually used
        }
        
      } catch (error) {
        this.addIssue({
          type: 'import',
          severity: 'medium',
          file: relative(PROJECT_ROOT, file),
          message: `Could not analyze imports: ${error.message}`,
          category: 'File Access Issues'
        });
      }
    }
  }

  private resolveRelativeImport(fromFile: string, importPath: string): string {
    const dir = join(fromFile, '..');
    let resolved = join(dir, importPath);
    
    // Try different extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    for (const ext of extensions) {
      if (existsSync(resolved + ext)) {
        return resolved + ext;
      }
    }
    
    // Try index files
    for (const ext of extensions) {
      const indexPath = join(resolved, 'index' + ext);
      if (existsSync(indexPath)) {
        return indexPath;
      }
    }
    
    return resolved;
  }

  private async scanVariableReferences(): Promise<void> {
    console.log('🔍 Scanning variable references...');
    
    const undefinedVarPattern = /\b(_+\w+|[a-zA-Z]\w*)\b/g;
    
    for (const file of [...this.tsFiles, ...this.tsxFiles]) {
      try {
        const content = readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          // Look for suspicious variable patterns (leading underscores, etc.)
          if (line.includes('_') && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
            const matches = line.match(/_+\w+/g);
            if (matches) {
              matches.forEach(match => {
                if (match.length > 2) { // More than just _var
                  this.addIssue({
                    type: 'variable',
                    severity: 'medium',
                    file: relative(PROJECT_ROOT, file),
                    line: index + 1,
                    message: `Suspicious variable name: ${match}`,
                    suggestion: 'Check if this variable is properly defined',
                    category: 'Variable References'
                  });
                }
              });
            }
          }
        });
        
      } catch (error) {
        // Skip if file can't be read
      }
    }
  }

  private async scanDuplicateCode(): Promise<void> {
    console.log('🔄 Scanning for duplicate code...');
    
    const codeBlocks = new Map<string, string[]>();
    
    for (const file of [...this.tsFiles, ...this.tsxFiles]) {
      try {
        const content = readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        // Look for duplicate function signatures, interfaces, etc.
        lines.forEach((line, index) => {
          const trimmed = line.trim();
          if (trimmed.length > 20 && (
            trimmed.startsWith('interface ') ||
            trimmed.startsWith('type ') ||
            trimmed.startsWith('const ') ||
            trimmed.startsWith('function ')
          )) {
            const key = trimmed.substring(0, 50); // First 50 chars as key
            if (!codeBlocks.has(key)) {
              codeBlocks.set(key, []);
            }
            codeBlocks.get(key)!.push(`${relative(PROJECT_ROOT, file)}:${index + 1}`);
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

  private async scanCSSIssues(): Promise<void> {
    console.log('🎨 Scanning CSS issues...');
    
    for (const file of this.cssFiles) {
      try {
        const content = readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          // Look for common CSS issues
          if (line.includes('!important')) {
            this.addIssue({
              type: 'css',
              severity: 'low',
              file: relative(PROJECT_ROOT, file),
              line: index + 1,
              message: 'Use of !important detected',
              suggestion: 'Consider using more specific selectors instead',
              category: 'CSS Issues'
            });
          }
          
          // Look for undefined CSS custom properties
          const customProps = line.match(/var\\(--[\\w-]+\\)/g);
          if (customProps) {
            customProps.forEach(prop => {
              // This would need to be cross-referenced with defined custom properties
            });
          }
        });
        
      } catch (error) {
        // Skip if file can't be read
      }
    }
  }

  private async scanMissingUtilities(): Promise<void> {
    console.log('🛠️ Scanning for missing utilities...');
    
    const commonUtilities = [
      'formatDate',
      'validateEmail',
      'debounce',
      'throttle',
      'deepClone',
      'generateId',
      'sanitizeInput',
      'parseJWT'
    ];
    
    for (const file of [...this.tsFiles, ...this.tsxFiles]) {
      try {
        const content = readFileSync(file, 'utf8');
        
        // Look for inline implementations that could use utilities
        commonUtilities.forEach(util => {
          if (content.includes(util) && !content.includes(`import.*${util}`)) {
            // Check if it's being implemented inline
            const lines = content.split('\n');
            lines.forEach((line, index) => {
              if (line.includes(util) && (line.includes('function') || line.includes('=>'))) {
                this.addIssue({
                  type: 'missing_util',
                  severity: 'low',
                  file: relative(PROJECT_ROOT, file),
                  line: index + 1,
                  message: `Potential inline ${util} implementation`,
                  suggestion: `Consider using utility from utils/ directory`,
                  category: 'Missing Utilities'
                });
              }
            });
          }
        });
        
      } catch (error) {
        // Skip if file can't be read
      }
    }
  }

  private async scanRuntimeErrors(): Promise<void> {
    console.log('⚠️ Scanning for potential runtime errors...');
    
    const runtimePatterns = [
      { pattern: /\.map\s*\(/g, issue: 'Potential map on non-array' },
      { pattern: /\.\w+\s*\?\./g, issue: 'Optional chaining usage' },
      { pattern: /JSON\.parse\(/g, issue: 'Unhandled JSON.parse' },
      { pattern: /localStorage\./g, issue: 'localStorage without error handling' },
      { pattern: /fetch\(/g, issue: 'Fetch without error handling' }
    ];
    
    for (const file of [...this.tsFiles, ...this.tsxFiles]) {
      try {
        const content = readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        runtimePatterns.forEach(({ pattern, issue }) => {
          lines.forEach((line, index) => {
            if (pattern.test(line) && !line.includes('try') && !line.includes('catch')) {
              this.addIssue({
                type: 'runtime',
                severity: 'medium',
                file: relative(PROJECT_ROOT, file),
                line: index + 1,
                message: issue,
                suggestion: 'Add proper error handling',
                category: 'Runtime Safety'
              });
            }
          });
        });
        
      } catch (error) {
        // Skip if file can't be read
      }
    }
  }

  private async scanUnusedCode(): Promise<void> {
    console.log('🗑️ Scanning for unused code...');
    
    // This would be a complex analysis - for now, look for obvious patterns
    for (const file of [...this.tsFiles, ...this.tsxFiles]) {
      try {
        const content = readFileSync(file, 'utf8');
        
        // Look for commented out code blocks
        const commentedCodePattern = /^\s*\/\/.*[{}();]/gm;
        let match;
        while ((match = commentedCodePattern.exec(content)) !== null) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          
          this.addIssue({
            type: 'unused',
            severity: 'low',
            file: relative(PROJECT_ROOT, file),
            line: lineNumber,
            message: 'Commented out code detected',
            suggestion: 'Remove if no longer needed',
            category: 'Code Cleanup'
          });
        }
        
      } catch (error) {
        // Skip if file can't be read
      }
    }
  }

  private async scanOutdatedImplementations(): Promise<void> {
    console.log('📅 Scanning for outdated implementations...');
    
    const outdatedPatterns = [
      { pattern: /componentWillMount|componentWillReceiveProps|componentWillUpdate/g, issue: 'Deprecated React lifecycle method' },
      { pattern: /ReactDOM\.render\(/g, issue: 'Legacy ReactDOM.render usage' },
      { pattern: /var\s+\w+/g, issue: 'var declaration (use const/let)' },
      { pattern: /new Date\(\)\.getYear\(\)/g, issue: 'Deprecated getYear() method' }
    ];
    
    for (const file of [...this.tsFiles, ...this.tsxFiles]) {
      try {
        const content = readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        outdatedPatterns.forEach(({ pattern, issue }) => {
          lines.forEach((line, index) => {
            if (pattern.test(line)) {
              this.addIssue({
                type: 'outdated',
                severity: 'medium',
                file: relative(PROJECT_ROOT, file),
                line: index + 1,
                message: issue,
                suggestion: 'Update to modern implementation',
                category: 'Outdated Code'
              });
            }
          });
        });
        
      } catch (error) {
        // Skip if file can't be read
      }
    }
  }

  private async scanFilesToCleanup(): Promise<void> {
    console.log('🧹 Scanning for files to cleanup...');
    
    const backupPattern = /\.(backup|bak|old|tmp)(\.\w+)?$/;
    const testPattern = /\.(test|spec)\.(ts|tsx|js|jsx)$/;
    
    for (const file of this.allFiles) {
      const fileName = relative(PROJECT_ROOT, file);
      
      // Backup files
      if (backupPattern.test(fileName)) {
        this.results.filesToCleanup.push(fileName);
        this.addIssue({
          type: 'unused',
          severity: 'low',
          file: fileName,
          message: 'Backup file detected',
          suggestion: 'Remove if no longer needed',
          category: 'File Cleanup'
        });
      }
      
      // Empty or near-empty files
      try {
        const content = readFileSync(file, 'utf8');
        if (content.trim().length < 50 && !testPattern.test(fileName)) {
          this.addIssue({
            type: 'unused',
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

  generateReport(): string {
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
      duplicateData.forEach((dup, index) => {
        report += `${index + 1}. **${dup.type}**: Found in ${dup.files.length} files\n`;
        report += `   - Pattern: ${dup.content}\n`;
        report += `   - Files: ${dup.files.join(', ')}\n\n`;
      });
    } else {
      report += `No significant code duplication detected.\n`;
    }

    report += `\n## Detailed Action Plan\n\n`;
    
    // Group issues by category for action plan
    const issuesByCategory = issues.reduce((acc, issue) => {
      if (!acc[issue.category]) acc[issue.category] = [];
      acc[issue.category].push(issue);
      return acc;
    }, {} as Record<string, Issue[]>);

    let taskCounter = 1;
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

    report += `\n## Total Tasks: ${taskCounter - 1}\n`;
    report += `## Tasks Completed: 0\n`;
    report += `## Tasks Remaining: ${taskCounter - 1}\n`;

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
  const reportFile = join(PROJECT_ROOT, 'COMPREHENSIVE_ANALYSIS_RESULTS.md');
  writeFileSync(reportFile, report);
  
  console.log(`📄 Analysis complete! Report saved to: ${reportFile}`);
  console.log(`\n📊 Summary:`);
  console.log(`   Critical Issues: ${results.summary.critical}`);
  console.log(`   High Priority: ${results.summary.high}`);
  console.log(`   Medium Priority: ${results.summary.medium}`);
  console.log(`   Low Priority: ${results.summary.low}`);
  console.log(`   Total Issues: ${results.summary.totalIssues}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Analysis failed:', error);
    process.exit(1);
  });
}
