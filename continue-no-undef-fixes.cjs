const fs = require('fs');
const { execSync } = require('child_process');

// Get list of files with most no-undef errors
const getFilesWithErrors = () => {
  let eslintOutput;
  try {
    eslintOutput = execSync('npx eslint . --format json', { 
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024
    });
  } catch (e) {
    eslintOutput = e.stdout;
  }
  
  const data = JSON.parse(eslintOutput);
  const filesWithNoUndef = [];
  
  data.forEach(file => {
    const noUndefCount = file.messages.filter(msg => msg.ruleId === 'no-undef').length;
    if (noUndefCount > 0) {
      filesWithNoUndef.push({ path: file.filePath, count: noUndefCount });
    }
  });
  
  return filesWithNoUndef.sort((a, b) => b.count - a.count);
};

// Process remaining files
const filesWithErrors = getFilesWithErrors();
console.log(`Found ${filesWithErrors.length} files still with no-undef errors`);
console.log(`Processing next 80 files...`);

const filesToProcess = filesWithErrors.slice(0, 80);
let processedCount = 0;

filesToProcess.forEach(({ path: filePath, count }) => {
  const relativePath = filePath.replace(process.cwd() + '\\', '').replace(process.cwd() + '/', '');
  
  // Read backup file if exists, otherwise original
  const backupPath = filePath + '.backup-no-undef';
  let content;
  try {
    if (fs.existsSync(backupPath)) {
      content = fs.readFileSync(backupPath, 'utf8');
    } else {
      content = fs.readFileSync(filePath, 'utf8');
    }
  } catch (e) {
    console.log(`Skipping ${relativePath}: ${e.message}`);
    return;
  }
  
  let fixed = content;
  
  // More aggressive fixing patterns
  // Fix all underscore prefixed variables that are actually used
  fixed = fixed.replace(/\bconst\s+_(\w+)\s*=/g, 'const $1 =');
  fixed = fixed.replace(/\blet\s+_(\w+)\s*=/g, 'let $1 =');
  fixed = fixed.replace(/\bvar\s+_(\w+)\s*=/g, 'var $1 =');
  
  // Fix function parameters
  fixed = fixed.replace(/function\s+(\w+)\s*\(([^)]*)\)/g, (match, name, params) => {
    const fixedParams = params.replace(/_(\w+)/g, '$1');
    return `function ${name}(${fixedParams})`;
  });
  
  // Fix arrow function parameters
  fixed = fixed.replace(/\(([^)]*)\)\s*=>/g, (match, params) => {
    const fixedParams = params.replace(/_(\w+)/g, '$1');
    return `(${fixedParams}) =>`;
  });
  
  // Fix single parameter arrow functions
  fixed = fixed.replace(/\b_(\w+)\s*=>/g, '$1 =>');
  
  // Fix destructuring
  fixed = fixed.replace(/\{\s*_(\w+)/g, '{ $1');
  fixed = fixed.replace(/\[\s*_(\w+)/g, '[ $1');
  fixed = fixed.replace(/,\s*_(\w+)/g, ', $1');
  
  // Fix catch blocks
  fixed = fixed.replace(/catch\s*\(\s*_(\w+)\s*\)/g, 'catch (_$1)');
  
  // Fix common undefined variables from errors
  fixed = fixed.replace(/\b_32\b/g, '32');
  fixed = fixed.replace(/\be\b(?=\s+instanceof|\s+&&|\s+\|\||\.message|\.stack|\.code|\.name)/g, 'error');
  fixed = fixed.replace(/\boptions\s+is\s+not\s+defined/g, 'options');
  
  if (fixed !== content) {
    // Write backup if doesn't exist
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, content);
    }
    fs.writeFileSync(filePath, fixed);
    processedCount++;
    console.log(`Fixed: ${relativePath} (${count} errors)`);
  }
});

console.log(`\nProcessed ${processedCount} files`);
