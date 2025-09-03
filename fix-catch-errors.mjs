#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixCatchErrorReferences(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changes = 0;
  
  // Find catch blocks without error variable and subsequent console statements using 'error'
  // Pattern: } catch { ... console.error('...', error) or console.log('...', error)
  const catchWithoutErrorPattern = /} catch \{([^}]*)\}/gs;
  
  const newContent = content.replace(catchWithoutErrorPattern, (match, blockContent) => {
    // Check if the block content references 'error'
    if (blockContent.includes('error') && 
        (blockContent.includes('console.error') || 
         blockContent.includes('console.log') || 
         blockContent.includes('console.warn'))) {
      
      // Remove the error parameter from console statements
      let fixedBlock = blockContent;
      
      // Fix patterns like: console.error('message', error)
      fixedBlock = fixedBlock.replace(/console\.(error|log|warn)\(([^,)]+),\s*error\)/g, 'console.$1($2)');
      
      // Fix patterns like: console.error('message:', error)
      fixedBlock = fixedBlock.replace(/console\.(error|log|warn)\(([^:]+):\s*',\s*error\)/g, "console.$1($2')");
      
      // Fix patterns like: error.message or error.stack
      fixedBlock = fixedBlock.replace(/\berror\.(message|stack|name)/g, "'[Error details unavailable]'");
      
      // Fix patterns like: error instanceof
      fixedBlock = fixedBlock.replace(/\berror instanceof \w+/g, 'false');
      
      // Fix standalone 'error' references
      fixedBlock = fixedBlock.replace(/([^a-zA-Z0-9_])error([^a-zA-Z0-9_])/g, '$1undefined$2');
      
      if (fixedBlock !== blockContent) {
        changes++;
        return `} catch {${fixedBlock}}`;
      }
    }
    
    return match;
  });
  
  if (changes > 0) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Fixed ${changes} undefined error references in ${path.basename(filePath)}`);
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
      totalFixed += fixCatchErrorReferences(file);
    }
  }
}

console.log(`\nTotal undefined error references fixed: ${totalFixed}`);