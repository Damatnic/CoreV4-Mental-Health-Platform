#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixUndefinedErrors(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changes = 0;
  
  // Fix console.undefined patterns
  const patterns = [
    { regex: /console\.undefined\(/g, replacement: 'console.error(' },
    { regex: /toast\.undefined\(/g, replacement: 'toast.error(' },
    { regex: /\bundefined:\s*'([^']+)'/g, replacement: "error: '$1'" }, // Fix object property errors
    { regex: /\(undefined as Error\)/g, replacement: '(error as Error)' }, // Fix type cast
  ];
  
  let newContent = content;
  patterns.forEach(pattern => {
    const beforeLength = newContent.length;
    newContent = newContent.replace(pattern.regex, pattern.replacement);
    if (newContent.length !== beforeLength) {
      changes++;
    }
  });
  
  if (changes > 0) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Fixed ${changes} undefined error patterns in ${path.basename(filePath)}`);
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
      totalFixed += fixUndefinedErrors(file);
    }
  }
}

console.log(`\nTotal undefined errors fixed: ${totalFixed}`);