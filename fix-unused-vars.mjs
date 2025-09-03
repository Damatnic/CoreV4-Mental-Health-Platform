#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Common patterns for unused variables
const patterns = [
  // Catch blocks
  { regex: /} catch \((\w+)(?:: any)?\) {/g, replacement: '} catch {' },
  // Function parameters that start with underscore already (don't change)
  { regex: /\b_\w+\b/g, skip: true },
  // Unused function parameters (more complex, needs context)
];

function fixUnusedVarsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changes = 0;
  
  // Fix catch blocks
  const catchRegex = /} catch \((\w+)(?::\s*\w+)?\) {/g;
  const newContent = content.replace(catchRegex, (match, varName) => {
    if (!varName.startsWith('_')) {
      changes++;
      return '} catch {';
    }
    return match;
  });
  
  if (changes > 0) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Fixed ${changes} unused catch variables in ${path.basename(filePath)}`);
  }
  
  return changes;
}

// Get all TypeScript files
function getAllTsFiles(dir) {
  const files = [];
  
  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== 'dist') {
        walk(fullPath);
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

// Main execution
const targetDirs = [
  path.join(__dirname, 'src'),
  path.join(__dirname, 'backend', 'src')
];

let totalFixed = 0;

for (const dir of targetDirs) {
  if (fs.existsSync(dir)) {
    const files = getAllTsFiles(dir);
    console.log(`Processing ${files.length} files in ${dir}...`);
    
    for (const file of files) {
      totalFixed += fixUnusedVarsInFile(file);
    }
  }
}

console.log(`\nTotal unused variables fixed: ${totalFixed}`);