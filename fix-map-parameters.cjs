const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Fixing map/filter/forEach parameter mismatches...\n');

// Get files with no-undef errors
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
    const noUndefErrors = file.messages.filter(msg => msg.ruleId === 'no-undef');
    if (noUndefErrors.length > 0) {
      // Group by undefined variable name
      const undefinedVars = {};
      noUndefErrors.forEach(err => {
        const match = err.message.match(/'(\w+)' is not defined/);
        if (match) {
          undefinedVars[match[1]] = (undefinedVars[match[1]] || 0) + 1;
        }
      });
      filesWithNoUndef.push({ 
        path: file.filePath, 
        count: noUndefErrors.length,
        vars: undefinedVars
      });
    }
  });
  
  return filesWithNoUndef.sort((a, b) => b.count - a.count);
};

const fixMapParameters = (content, undefinedVars) => {
  let fixed = content;
  
  // For each undefined variable, check if there's a corresponding _variable in map/filter/forEach
  Object.keys(undefinedVars).forEach(varName => {
    const underscored = '_' + varName;
    
    // Fix map functions: .map(_item) => { ... item ... }
    const mapPattern = new RegExp(`\\.map\\s*\\(\\s*\\(\\s*${underscored}\\b`, 'g');
    fixed = fixed.replace(mapPattern, `.map((${varName}`);
    
    // Fix filter functions
    const filterPattern = new RegExp(`\\.filter\\s*\\(\\s*\\(\\s*${underscored}\\b`, 'g');
    fixed = fixed.replace(filterPattern, `.filter((${varName}`);
    
    // Fix forEach functions
    const forEachPattern = new RegExp(`\\.forEach\\s*\\(\\s*\\(\\s*${underscored}\\b`, 'g');
    fixed = fixed.replace(forEachPattern, `.forEach((${varName}`);
    
    // Fix reduce functions
    const reducePattern = new RegExp(`\\.reduce\\s*\\(\\s*\\(\\s*\\w+,\\s*${underscored}\\b`, 'g');
    fixed = fixed.replace(reducePattern, (match) => match.replace(underscored, varName));
    
    // Fix find functions
    const findPattern = new RegExp(`\\.find\\s*\\(\\s*\\(\\s*${underscored}\\b`, 'g');
    fixed = fixed.replace(findPattern, `.find((${varName}`);
    
    // Fix some/every functions
    const somePattern = new RegExp(`\\.some\\s*\\(\\s*\\(\\s*${underscored}\\b`, 'g');
    fixed = fixed.replace(somePattern, `.some((${varName}`);
    const everyPattern = new RegExp(`\\.every\\s*\\(\\s*\\(\\s*${underscored}\\b`, 'g');
    fixed = fixed.replace(everyPattern, `.every((${varName}`);
    
    // Fix arrow functions with underscore parameters that are actually used
    const arrowPattern = new RegExp(`\\(${underscored}(,\\s*\\w+)?\\)\\s*=>`, 'g');
    fixed = fixed.replace(arrowPattern, (match, rest) => {
      // Check if the variable is used in the following code
      const afterArrow = fixed.substring(fixed.indexOf(match) + match.length, fixed.indexOf(match) + match.length + 500);
      if (afterArrow.includes(varName)) {
        return `(${varName}${rest || ''}) =>`;
      }
      return match;
    });
    
    // Fix destructuring in map/filter parameters
    const destructurePattern = new RegExp(`\\(\\s*\\{\\s*${underscored}\\b`, 'g');
    fixed = fixed.replace(destructurePattern, `({ ${varName}`);
    
    // Special case for common patterns
    if (varName === 'goal' || varName === 'item' || varName === 'user' || varName === 'task' || 
        varName === 'message' || varName === 'event' || varName === 'error' || varName === 'data') {
      // These are commonly mismatched in map functions
      const genericMapPattern = new RegExp(`\\.\\w+\\s*\\(\\s*${underscored}\\s*=>`, 'g');
      fixed = fixed.replace(genericMapPattern, (match) => match.replace(underscored, varName));
    }
  });
  
  // Fix specific common patterns
  fixed = fixed.replace(/\.map\s*\(\s*_(\w+)\s*=>\s*\{[\s\S]*?\1\b/g, (match, varName) => {
    return match.replace(new RegExp(`_${varName}\\s*=>`, 'g'), `${varName} =>`);
  });
  
  // Fix for-of loops with underscore variables
  fixed = fixed.replace(/for\s*\(\s*(?:const|let)\s+_(\w+)\s+of\b/g, (match, varName) => {
    // Check if the variable is used without underscore in the loop body
    const afterFor = fixed.substring(fixed.indexOf(match));
    const loopBodyMatch = afterFor.match(/\{[\s\S]*?\}/);
    if (loopBodyMatch && loopBodyMatch[0].includes(varName)) {
      return match.replace(`_${varName}`, varName);
    }
    return match;
  });
  
  return fixed;
};

// Process files
const filesWithErrors = getFilesWithErrors();
console.log(`Found ${filesWithErrors.length} files with no-undef errors\n`);

let totalFixed = 0;
const processLimit = 100; // Process top 100 files

filesWithErrors.slice(0, processLimit).forEach(({ path: filePath, count, vars }) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fixed = fixMapParameters(content, vars);
    
    if (fixed !== content) {
      // Create backup
      const backupPath = filePath + '.backup-map-fix';
      if (!fs.existsSync(backupPath)) {
        fs.writeFileSync(backupPath, content);
      }
      
      // Write fixed content
      fs.writeFileSync(filePath, fixed);
      totalFixed++;
      
      const relativePath = filePath.replace(process.cwd() + '\\', '').replace(process.cwd() + '/', '');
      console.log(`Fixed: ${relativePath} (${count} errors)`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}: ${error.message}`);
  }
});

console.log(`\nFixed ${totalFixed} files`);
console.log('Run ESLint to check remaining errors');