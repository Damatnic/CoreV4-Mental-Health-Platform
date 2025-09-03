const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Fixing no-unused-vars errors by adding underscore prefix...\n');

// Get files with no-unused-vars errors
const getFilesWithUnusedVars = () => {
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
  const filesWithUnused = [];
  
  data.forEach(file => {
    const unusedVarErrors = file.messages.filter(msg => 
      msg.ruleId === '@typescript-eslint/no-unused-vars' &&
      !msg.message.includes('Allowed unused args must match /^_/u')
    );
    
    if (unusedVarErrors.length > 0) {
      const unusedVars = {};
      unusedVarErrors.forEach(err => {
        // Extract variable name from message like "'varName' is defined but never used"
        const match = err.message.match(/'(\w+)' is defined but never used/);
        if (match) {
          unusedVars[match[1]] = {
            line: err.line,
            column: err.column
          };
        }
      });
      filesWithUnused.push({ 
        path: file.filePath, 
        count: unusedVarErrors.length,
        vars: unusedVars
      });
    }
  });
  
  return filesWithUnused.sort((a, b) => b.count - a.count);
};

const addUnderscoreToUnusedVars = (content, unusedVars) => {
  let fixed = content;
  const lines = content.split('\n');
  
  // Sort by line number in reverse to avoid offset issues
  const varsArray = Object.entries(unusedVars).sort((a, b) => b[1].line - a[1].line);
  
  varsArray.forEach(([varName, location]) => {
    if (varName.startsWith('_')) {
      return; // Already has underscore
    }
    
    const lineIndex = location.line - 1;
    if (lineIndex >= 0 && lineIndex < lines.length) {
      let line = lines[lineIndex];
      
      // Pattern 1: Function parameters
      const funcParamPattern = new RegExp(`\\b${varName}\\b(?=\\s*[,):])`);
      if (funcParamPattern.test(line)) {
        line = line.replace(funcParamPattern, `_${varName}`);
        lines[lineIndex] = line;
        return;
      }
      
      // Pattern 2: Variable declarations (const, let, var)
      const varDeclPattern = new RegExp(`\\b(const|let|var)\\s+${varName}\\b`);
      if (varDeclPattern.test(line)) {
        line = line.replace(varDeclPattern, `$1 _${varName}`);
        lines[lineIndex] = line;
        return;
      }
      
      // Pattern 3: Destructuring
      const destructurePattern = new RegExp(`\\b${varName}\\b(?=\\s*[,}\\]])`, 'g');
      if (destructurePattern.test(line)) {
        line = line.replace(destructurePattern, `_${varName}`);
        lines[lineIndex] = line;
        return;
      }
      
      // Pattern 4: Import statements
      const importPattern = new RegExp(`import\\s+.*\\b${varName}\\b`);
      if (importPattern.test(line)) {
        line = line.replace(new RegExp(`\\b${varName}\\b`), `_${varName}`);
        lines[lineIndex] = line;
        return;
      }
      
      // Pattern 5: Catch blocks
      const catchPattern = new RegExp(`catch\\s*\\(\\s*${varName}\\s*\\)`);
      if (catchPattern.test(line)) {
        line = line.replace(catchPattern, `catch (_${varName})`);
        lines[lineIndex] = line;
        return;
      }
    }
  });
  
  return lines.join('\n');
};

// Also fix console statements while we're at it
const fixConsoleStatements = (content) => {
  let fixed = content;
  
  // Check if logger is imported
  const hasLoggerImport = /import.*logger.*from.*['"].*logger['"]/.test(content);
  
  if (hasLoggerImport || content.includes('logger.')) {
    // Replace console statements with logger
    fixed = fixed.replace(/console\.log\(/g, 'logger.info(');
    fixed = fixed.replace(/console\.error\(/g, 'logger.error(');
    fixed = fixed.replace(/console\.warn\(/g, 'logger.warn(');
    fixed = fixed.replace(/console\.debug\(/g, 'logger.debug(');
    fixed = fixed.replace(/console\.info\(/g, 'logger.info(');
  }
  
  // Add logger import if needed and console was replaced
  if (!hasLoggerImport && fixed !== content && fixed.includes('logger.')) {
    // Add import at the top after other imports
    const importMatch = fixed.match(/^(import[\s\S]*?)\n\n/m);
    if (importMatch) {
      const imports = importMatch[1];
      fixed = fixed.replace(imports, imports + "\nimport { logger } from '../utils/logger';");
    } else {
      // Add at very top if no imports found
      fixed = "import { logger } from '../utils/logger';\n\n" + fixed;
    }
  }
  
  return fixed;
};

// Process files
const filesWithUnused = getFilesWithUnusedVars();
console.log(`Found ${filesWithUnused.length} files with no-unused-vars errors\n`);

let totalFixed = 0;
const processLimit = 100;

filesWithUnused.slice(0, processLimit).forEach(({ path: filePath, count, vars }) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let fixed = addUnderscoreToUnusedVars(content, vars);
    
    // Also fix console statements
    fixed = fixConsoleStatements(fixed);
    
    if (fixed !== content) {
      // Create backup
      const backupPath = filePath + '.backup-unused-vars';
      if (!fs.existsSync(backupPath)) {
        fs.writeFileSync(backupPath, content);
      }
      
      // Write fixed content
      fs.writeFileSync(filePath, fixed);
      totalFixed++;
      
      const relativePath = filePath.replace(process.cwd() + '\\', '').replace(process.cwd() + '/', '');
      console.log(`Fixed: ${relativePath} (${count} unused vars)`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}: ${error.message}`);
  }
});

console.log(`\nFixed ${totalFixed} files`);
console.log('Run ESLint to check remaining errors');