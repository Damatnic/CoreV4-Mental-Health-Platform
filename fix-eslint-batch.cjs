#!/usr/bin/env node

/**
 * Batch ESLint fix script - Fast systematic fixes
 */

const fs = require('fs');
const path = require('path');

// Pattern replacements for common errors
const REPLACEMENTS = [
  // Fix numeric base errors (_32 -> 32, _16 -> 16, etc.)
  { pattern: /\b_(\d+)\b/g, replacement: '$1' },
  
  // Fix localStorage.key errors
  { pattern: /localStorage\._key\((_?)([a-zA-Z]+)\)/g, replacement: 'localStorage.key($2)' },
  
  // Fix console._error -> console.error
  { pattern: /console\._error/g, replacement: 'console.error' },
  
  // Replace console with logger (if logger is imported)
  { pattern: /console\.log\(/g, replacement: 'logger.info(', needsImport: true },
  { pattern: /console\.warn\(/g, replacement: 'logger.warn(', needsImport: true },
  { pattern: /console\.error\(/g, replacement: 'logger.error(', needsImport: true },
  
  // Fix @ts-ignore to @ts-expect-error
  { pattern: /@ts-ignore/g, replacement: '@ts-expect-error' },
  
  // Fix React unescaped entities
  { pattern: /(\w)'(\w)/g, replacement: '$1\'$2', inJSX: true },
  
  // Fix _null, _true, _false
  { pattern: /\b_null\b/g, replacement: 'null' },
  { pattern: /\b_true\b/g, replacement: 'true' },
  { pattern: /\b_false\b/g, replacement: 'false' },
];

// Get all TypeScript files
function getAllTsFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    try {
      const stat = fs.statSync(filePath);
      
      // Skip unnecessary directories
      if (file === 'node_modules' || file === 'dist' || file === 'dev-dist' || 
          file === 'coverage' || file === '.git' || file === 'agent-system') {
        continue;
      }
      
      if (stat.isDirectory()) {
        getAllTsFiles(filePath, fileList);
      } else if (file.match(/\.(ts|tsx)$/) && !file.endsWith('.d.ts')) {
        fileList.push(filePath);
      }
    } catch (e) {
      // Skip files we can't access
    }
  }
  
  return fileList;
}

// Process single file
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let changed = false;
    let fixCount = 0;
    
    // Check if logger is imported
    const hasLoggerImport = /import.*logger.*from/.test(content);
    
    // Apply all replacements
    for (const { pattern, replacement, needsImport, inJSX } of REPLACEMENTS) {
      if (needsImport && !hasLoggerImport) continue;
      
      const before = content;
      content = content.replace(pattern, replacement);
      if (before !== content) {
        changed = true;
        fixCount++;
      }
    }
    
    // Fix broken variable references (remove underscore from used variables)
    // Pattern: const _variable used as variable
    const variableFixPattern = /\bconst _([a-zA-Z][a-zA-Z0-9]*)\b/g;
    const matches = [...content.matchAll(variableFixPattern)];
    
    for (const match of matches) {
      const varName = match[1];
      const underscoreVar = `_${varName}`;
      
      // Check if the non-underscore version is used
      const usageRegex = new RegExp(`\\b${varName}\\b`, 'g');
      const underscoreUsageRegex = new RegExp(`\\b${underscoreVar}\\b`, 'g');
      
      const usages = (content.match(usageRegex) || []).length;
      const underscoreUsages = (content.match(underscoreUsageRegex) || []).length;
      
      // If non-underscore is used more than underscore version, fix it
      if (usages > underscoreUsages) {
        content = content.replace(new RegExp(`\\bconst _${varName}\\b`), `const ${varName}`);
        content = content.replace(new RegExp(`\\blet _${varName}\\b`), `let ${varName}`);
        changed = true;
        fixCount++;
      }
    }
    
    // Add logger import if console replacements were made and logger isn't imported
    if (changed && !hasLoggerImport && content.includes('logger.')) {
      const importStatement = `import { logger } from '@/utils/logger';\n`;
      
      // Find the right place to add import (after other imports)
      const firstImportMatch = content.match(/^import /m);
      if (firstImportMatch) {
        const insertPos = content.indexOf(firstImportMatch[0]);
        content = content.slice(0, insertPos) + importStatement + content.slice(insertPos);
      } else {
        // No imports, add at the beginning
        content = importStatement + content;
      }
    }
    
    // Write back if changed
    if (changed) {
      fs.writeFileSync(filePath, content);
      const relativePath = path.relative(process.cwd(), filePath);
      console.log(`✓ Fixed ${fixCount} issues in ${relativePath}`);
      return fixCount;
    }
    
    return 0;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

// Main execution
function main() {
  console.log('🔧 Starting batch ESLint fixes...\n');
  
  const files = getAllTsFiles('src');
  console.log(`Found ${files.length} TypeScript files\n`);
  
  let totalFixes = 0;
  let filesFixed = 0;
  
  for (const file of files) {
    const fixes = processFile(file);
    if (fixes > 0) {
      totalFixes += fixes;
      filesFixed++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`  Files processed: ${files.length}`);
  console.log(`  Files fixed: ${filesFixed}`);
  console.log(`  Total fixes: ${totalFixes}`);
  
  console.log('\n✅ Batch fix complete!');
}

main();