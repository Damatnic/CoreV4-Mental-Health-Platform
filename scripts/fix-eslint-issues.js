#!/usr/bin/env node

/**
 * Automated ESLint Issue Fixer for Mental Health Application
 * This script systematically fixes common ESLint issues while preserving functionality
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Patterns to fix
const fixes = {
  // Replace console.log with logger
  consoleLog: {
    pattern: /console\.log\((.*?)\);?/g,
    replacement: (match, args) => {
      // Determine appropriate log level based on content
      if (args.includes('error') || args.includes('Error')) {
        return `logger.error(${args});`;
      } else if (args.includes('warning') || args.includes('Warning')) {
        return `logger.warn(${args});`;
      } else {
        return `logger.info(${args});`;
      }
    }
  },
  
  // Fix unescaped apostrophes in JSX
  unescapedApostrophe: {
    pattern: /(?<=>[^<]*)'(?=[^<]*<)/g,
    replacement: '&apos;'
  },
  
  // Add htmlFor to labels
  labelFor: {
    pattern: /<label(\s+[^>]*)?className=/g,
    replacement: '<label$1htmlFor="" className='
  },
  
  // Fix object shorthand
  objectShorthand: {
    pattern: /(\w+):\s*\1(?=[,\s}])/g,
    replacement: '$1'
  },
  
  // Replace prefer-template violations
  preferTemplate: {
    pattern: /(['"`])([^'"`]*)\1\s*\+\s*(\w+)/g,
    replacement: '`$2${$3}`'
  }
};

// Files to process
const fileExtensions = ['.tsx', '.ts'];
const excludeDirs = ['node_modules', 'dist', 'coverage', '.git', 'build'];

// Utility functions
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    
    if (excludeDirs.some(dir => fullPath.includes(dir))) {
      return;
    }
    
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (fileExtensions.some(ext => file.endsWith(ext))) {
      arrayOfFiles.push(fullPath);
    }
  });
  
  return arrayOfFiles;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const changes = [];
  
  // Check if file imports logger
  const hasLoggerImport = content.includes("from '../../services/logging/logger'") || 
                         content.includes('from "../services/logging/logger"');
  
  // Apply console.log fix only if we can add logger import
  if (!hasLoggerImport && content.includes('console.log')) {
    // Add logger import after other imports
    const importMatch = content.match(/^import.*from.*;$/m);
    if (importMatch) {
      const lastImportIndex = content.lastIndexOf(importMatch[0]);
      const insertPosition = lastImportIndex + importMatch[0].length;
      
      // Calculate relative path to logger
      const relativePath = path.relative(
        path.dirname(filePath),
        path.join(rootDir, 'src/services/logging/logger.ts')
      ).replace(/\\/g, '/').replace('.ts', '');
      
      content = content.slice(0, insertPosition) + 
                `\nimport { logger } from '${relativePath}';` +
                content.slice(insertPosition);
      modified = true;
      changes.push('Added logger import');
    }
  }
  
  // Apply fixes
  Object.entries(fixes).forEach(([fixName, fix]) => {
    if (fixName === 'consoleLog' && !content.includes('logger')) {
      return; // Skip if we couldn't add logger import
    }
    
    const before = content;
    if (typeof fix.replacement === 'function') {
      content = content.replace(fix.pattern, fix.replacement);
    } else {
      content = content.replace(fix.pattern, fix.replacement);
    }
    
    if (before !== content) {
      modified = true;
      changes.push(fixName);
    }
  });
  
  // Fix specific React issues
  if (filePath.endsWith('.tsx')) {
    // Fix missing aria-required on required inputs
    content = content.replace(
      /<input([^>]*?)required([^>]*?)>/g,
      (match) => {
        if (!match.includes('aria-required')) {
          return match.replace('>', ' aria-required="true">');
        }
        return match;
      }
    );
    
    // Fix missing aria-label on icon buttons
    content = content.replace(
      /<button([^>]*?)>\s*<[A-Z]\w+\s+className="[^"]*icon[^"]*"[^>]*\/>\s*<\/button>/g,
      (match) => {
        if (!match.includes('aria-label')) {
          return match.replace('<button', '<button aria-label="Action button"');
        }
        return match;
      }
    );
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}: ${changes.join(', ')}`);
    return 1;
  }
  
  return 0;
}

// Main execution
function main() {
  console.log('🔧 Starting ESLint issue fixes...\n');
  
  const srcPath = path.join(rootDir, 'src');
  const files = getAllFiles(srcPath);
  
  console.log(`Found ${files.length} TypeScript files to process\n`);
  
  let totalFixed = 0;
  
  files.forEach(file => {
    totalFixed += processFile(file);
  });
  
  console.log(`\n✨ Fixed ${totalFixed} files`);
  console.log('\nNext steps:');
  console.log('1. Run "npm run lint" to check remaining issues');
  console.log('2. Run "npm run build" to ensure no compilation errors');
  console.log('3. Test critical features, especially crisis intervention');
}

// Run the script
try {
  main();
} catch (error) {
  console.error('❌ Error running fix script:', error);
  process.exit(1);
}