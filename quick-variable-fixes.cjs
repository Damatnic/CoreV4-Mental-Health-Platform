#!/usr/bin/env node
/**
 * Quick Variable Fix Script for CoreV4
 * Fixes common variable naming issues identified in the analysis
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.cwd();
const SRC_DIR = path.join(PROJECT_ROOT, 'src');

// Common variable fixes mapping
const VARIABLE_FIXES = [
  // Main variable naming issues
  { from: '_newRoot', to: 'newRoot' },
  { from: '_rootElement', to: 'rootElement' },
  { from: '_lastBoot', to: 'lastBoot' },
  { from: '__showBoot', to: 'showBoot' },
  { from: '_setShowBoot', to: 'setShowBoot' },
  { from: '___isPending', to: 'isPending' },
  { from: '__toasterOptions', to: 'toasterOptions' },
  { from: '_link', to: 'link' },
  { from: '_showBoot', to: 'showBoot' },
  
  // Query variables
  { from: '_query', to: 'query' },
  
  // Device and test variables
  { from: '_device', to: 'device' },
  { from: '_results', to: 'results' },
  { from: '_BREAKPOINTS', to: 'BREAKPOINTS' },
  
  // This binding issues
  { from: '.bind(_this)', to: '.bind(this)' },
  
  // Import/export issues
  { from: '_subscription', to: 'subscription' },
  { from: '_i', to: 'i' },
  { from: '_schedule', to: 'schedule' },
  { from: '_action', to: 'action' },
  
  // Error handling
  { from: 'catch {', to: 'catch (error) {' },
  { from: 'catch (\s*\) {', to: 'catch (error) {' },
  
  // Test variables
  { from: '_issue', to: 'issue' },
  { from: '_outputPath', to: 'outputPath' },
  { from: '_message', to: 'message' },
  { from: '_passed', to: 'passed' },
  { from: '_TEST_SUITES', to: 'TEST_SUITES' },
  { from: '_error', to: 'error' },
  
  // Address variables  
  { from: 'r._address', to: 'r.address' },
];

// Common import fixes
const IMPORT_FIXES = [
  { from: "import { logger } from '../logging/logger';", to: "import { logger } from '../utils/logger';" },
  { from: "import { logger } from '../utils/utils/logger';", to: "import { logger } from '../logger';" },
  { from: "import { logger } from '../utils/logger';", to: "import { logger } from '../../utils/logger';" },
  { from: "import { _execSync }", to: "import { execSync }" },
];

class QuickFixer {
  constructor() {
    this.fixedFiles = [];
    this.totalFixes = 0;
  }

  getFilesRecursively(dir) {
    const files = [];
    
    try {
      const entries = fs.readdirSync(dir);
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!['node_modules', 'dist', 'coverage', '.git', 'test-results'].includes(entry)) {
            files.push(...this.getFilesRecursively(fullPath));
          }
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read directory ${dir}:`, error.message);
    }
    
    return files;
  }

  fixFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let fileChanged = false;
      let fileFixes = 0;

      // Apply variable fixes
      for (const fix of VARIABLE_FIXES) {
        const regex = new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = content.match(regex);
        if (matches) {
          content = content.replace(regex, fix.to);
          fileFixes += matches.length;
          fileChanged = true;
        }
      }

      // Apply import fixes
      for (const fix of IMPORT_FIXES) {
        if (content.includes(fix.from)) {
          content = content.replace(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.to);
          fileFixes++;
          fileChanged = true;
        }
      }

      // Write back if changed
      if (fileChanged) {
        fs.writeFileSync(filePath, content);
        this.fixedFiles.push({
          file: path.relative(PROJECT_ROOT, filePath),
          fixes: fileFixes
        });
        this.totalFixes += fileFixes;
      }

    } catch (error) {
      console.warn(`Could not process ${filePath}:`, error.message);
    }
  }

  run() {
    console.log('🔧 Running Quick Variable Fixes...\n');
    
    const files = this.getFilesRecursively(SRC_DIR);
    console.log(`Processing ${files.length} TypeScript files...\n`);

    for (const file of files) {
      this.fixFile(file);
    }

    console.log('\n✅ Quick fixes completed!\n');
    console.log(`📊 Summary:`);
    console.log(`   Files processed: ${files.length}`);
    console.log(`   Files fixed: ${this.fixedFiles.length}`);
    console.log(`   Total fixes applied: ${this.totalFixes}\n`);

    if (this.fixedFiles.length > 0) {
      console.log('📝 Fixed files:');
      this.fixedFiles.forEach(({ file, fixes }) => {
        console.log(`   ${file}: ${fixes} fixes`);
      });
    }

    return {
      processedFiles: files.length,
      fixedFiles: this.fixedFiles.length,
      totalFixes: this.totalFixes
    };
  }
}

// Run if called directly
if (require.main === module) {
  const fixer = new QuickFixer();
  const results = fixer.run();
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Run TypeScript compilation to check remaining errors');
  console.log('2. Run the comprehensive analysis again to verify fixes');
  console.log('3. Address any remaining critical issues manually');
}

module.exports = { QuickFixer };
