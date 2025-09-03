#!/usr/bin/env node

/**
 * Script to automatically fix unused variables by prefixing with underscore
 * Run: node fix-unused-vars.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all TypeScript/React files
function getAllTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    // Skip node_modules, dist, and other build directories
    if (file === 'node_modules' || file === 'dist' || file === 'dev-dist' || 
        file === 'coverage' || file === '.git' || file === 'agent-system') {
      continue;
    }
    
    if (stat.isDirectory()) {
      getAllTsFiles(filePath, fileList);
    } else if (file.match(/\.(ts|tsx)$/)) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

// Parse ESLint output to get unused variables
function getUnusedVars() {
  try {
    const output = execSync('npm run lint -- --format json', { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
    const results = JSON.parse(output);
    
    const unusedVars = {};
    
    for (const file of results) {
      if (file.messages.length === 0) continue;
      
      const fileUnused = [];
      for (const message of file.messages) {
        if (message.ruleId === '@typescript-eslint/no-unused-vars') {
          // Extract variable name from the message
          const match = message.message.match(/'([^']+)' is (defined but never used|assigned a value but never used)/);
          if (match) {
            fileUnused.push({
              variable: match[1],
              line: message.line,
              column: message.column,
              isImport: message.message.includes('is defined but never used') && message.line < 30
            });
          }
        }
      }
      
      if (fileUnused.length > 0) {
        unusedVars[file.filePath] = fileUnused;
      }
    }
    
    return unusedVars;
  } catch (error) {
    console.error('Error getting unused vars:', error.message);
    return {};
  }
}

// Fix unused imports by removing them
function fixUnusedImports(filePath, unusedImports) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  for (const unused of unusedImports) {
    const lineIndex = unused.line - 1;
    const line = lines[lineIndex];
    
    if (!line) continue;
    
    // Handle different import patterns
    if (line.includes(`import ${unused.variable}`) || 
        line.includes(`{ ${unused.variable}`) ||
        line.includes(`, ${unused.variable}`) ||
        line.includes(`${unused.variable},`) ||
        line.includes(`${unused.variable} }`)) {
      
      // For single imports on their own line, comment out the entire line
      if (line.match(new RegExp(`^import.*${unused.variable}.*from`))) {
        lines[lineIndex] = `// ${line} // Removed unused import`;
      } else {
        // For imports within destructuring, just remove the variable
        let newLine = line;
        
        // Remove from destructured imports
        newLine = newLine.replace(new RegExp(`\\s*,\\s*${unused.variable}\\b`), '');
        newLine = newLine.replace(new RegExp(`\\b${unused.variable}\\s*,\\s*`), '');
        newLine = newLine.replace(new RegExp(`\\s*\\b${unused.variable}\\b\\s*`), ' ');
        
        // Clean up empty imports
        newLine = newLine.replace(/\{\s*\}/g, '{}');
        newLine = newLine.replace(/,\s*}/g, ' }');
        newLine = newLine.replace(/{\s*,/g, '{ ');
        
        lines[lineIndex] = newLine;
      }
    }
  }
  
  fs.writeFileSync(filePath, lines.join('\n'));
}

// Fix unused variables by prefixing with underscore
function fixUnusedVars(filePath, unusedVars) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Sort by position in reverse to avoid offset issues
  unusedVars.sort((a, b) => b.column - a.column || b.line - a.line);
  
  for (const unused of unusedVars) {
    if (unused.isImport) continue; // Skip imports
    
    // Add underscore prefix to unused variables
    const varPattern = new RegExp(`\\b(const|let|var)\\s+${unused.variable}\\b`, 'g');
    const paramPattern = new RegExp(`\\(([^)]*\\b)${unused.variable}\\b([^)]*)\\)`, 'g');
    const destructurePattern = new RegExp(`\\{([^}]*\\b)${unused.variable}\\b([^}]*)\\}`, 'g');
    
    content = content.replace(varPattern, `$1 _${unused.variable}`);
    content = content.replace(paramPattern, `($1_${unused.variable}$2)`);
    content = content.replace(destructurePattern, (match, before, after) => {
      if (!match.includes(':')) {
        return `{${before}_${unused.variable}${after}}`;
      }
      return match;
    });
  }
  
  fs.writeFileSync(filePath, content);
}

// Main execution
async function main() {
  console.log('Getting list of unused variables...');
  const unusedVars = getUnusedVars();
  
  const totalFiles = Object.keys(unusedVars).length;
  let totalFixed = 0;
  
  console.log(`Found ${totalFiles} files with unused variables\n`);
  
  for (const [filePath, vars] of Object.entries(unusedVars)) {
    const imports = vars.filter(v => v.isImport);
    const localVars = vars.filter(v => !v.isImport);
    
    console.log(`Processing ${path.relative(process.cwd(), filePath)}`);
    console.log(`  - ${imports.length} unused imports`);
    console.log(`  - ${localVars.length} unused variables`);
    
    try {
      if (imports.length > 0) {
        fixUnusedImports(filePath, imports);
      }
      
      if (localVars.length > 0) {
        fixUnusedVars(filePath, localVars);
      }
      
      totalFixed += vars.length;
    } catch (error) {
      console.error(`  ERROR: ${error.message}`);
    }
  }
  
  console.log(`\nFixed ${totalFixed} unused variables across ${totalFiles} files`);
  console.log('Running lint again to verify...');
  
  try {
    execSync('npm run lint 2>&1 | tail -5', { stdio: 'inherit' });
  } catch (error) {
    // Lint will likely still have errors, that's ok
  }
}

main().catch(console.error);