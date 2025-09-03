const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting focused no-undef fixes...\n');

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

// Common patterns that were broken by auto-fix
const fixPatterns = [
  // Broken underscore references in variable usage
  { pattern: /\b_(\d+)\b/g, replacement: '$1' },
  { pattern: /\b_array\b/g, replacement: 'array' },
  { pattern: /\b_key\b/g, replacement: 'key' },
  { pattern: /\b_value\b/g, replacement: 'value' },
  { pattern: /\b_item\b/g, replacement: 'item' },
  { pattern: /\b_index\b/g, replacement: 'index' },
  { pattern: /\b_element\b/g, replacement: 'element' },
  { pattern: /\b_result\b/g, replacement: 'result' },
  { pattern: /\b_data\b/g, replacement: 'data' },
  { pattern: /\b_response\b/g, replacement: 'response' },
  { pattern: /\b_options\b/g, replacement: 'options' },
  { pattern: /\b_config\b/g, replacement: 'config' },
  { pattern: /\b_params\b/g, replacement: 'params' },
  { pattern: /\b_args\b/g, replacement: 'args' },
  { pattern: /\b_callback\b/g, replacement: 'callback' },
  { pattern: /\b_handler\b/g, replacement: 'handler' },
  { pattern: /\b_event\b/g, replacement: 'event' },
  { pattern: /\b_target\b/g, replacement: 'target' },
  { pattern: /\b_source\b/g, replacement: 'source' },
  { pattern: /\b_context\b/g, replacement: 'context' },
  { pattern: /\b_state\b/g, replacement: 'state' },
  { pattern: /\b_props\b/g, replacement: 'props' },
  { pattern: /\b_component\b/g, replacement: 'component' },
  { pattern: /\b_children\b/g, replacement: 'children' },
  { pattern: /\b_node\b/g, replacement: 'node' },
  { pattern: /\b_parent\b/g, replacement: 'parent' },
  { pattern: /\b_child\b/g, replacement: 'child' },
  { pattern: /\b_next\b/g, replacement: 'next' },
  { pattern: /\b_prev\b/g, replacement: 'prev' },
  { pattern: /\b_current\b/g, replacement: 'current' },
  { pattern: /\b_message\b/g, replacement: 'message' },
  { pattern: /\b_error\b/g, replacement: 'error' },
  { pattern: /\b_warning\b/g, replacement: 'warning' },
  { pattern: /\b_info\b/g, replacement: 'info' },
  { pattern: /\b_debug\b/g, replacement: 'debug' },
  { pattern: /\b_log\b/g, replacement: 'log' },
  { pattern: /\b_user\b/g, replacement: 'user' },
  { pattern: /\b_token\b/g, replacement: 'token' },
  { pattern: /\b_session\b/g, replacement: 'session' },
  { pattern: /\b_request\b/g, replacement: 'request' },
  { pattern: /\b_response\b/g, replacement: 'response' },
  { pattern: /\b_body\b/g, replacement: 'body' },
  { pattern: /\b_headers\b/g, replacement: 'headers' },
  { pattern: /\b_status\b/g, replacement: 'status' },
  { pattern: /\b_code\b/g, replacement: 'code' },
  { pattern: /\b_type\b/g, replacement: 'type' },
  { pattern: /\b_name\b/g, replacement: 'name' },
  { pattern: /\b_id\b/g, replacement: 'id' },
  { pattern: /\b_url\b/g, replacement: 'url' },
  { pattern: /\b_path\b/g, replacement: 'path' },
  { pattern: /\b_file\b/g, replacement: 'file' },
  { pattern: /\b_dir\b/g, replacement: 'dir' },
  { pattern: /\b_ext\b/g, replacement: 'ext' },
  { pattern: /\b_size\b/g, replacement: 'size' },
  { pattern: /\b_length\b/g, replacement: 'length' },
  { pattern: /\b_count\b/g, replacement: 'count' },
  { pattern: /\b_total\b/g, replacement: 'total' },
  { pattern: /\b_sum\b/g, replacement: 'sum' },
  { pattern: /\b_avg\b/g, replacement: 'avg' },
  { pattern: /\b_min\b/g, replacement: 'min' },
  { pattern: /\b_max\b/g, replacement: 'max' },
  { pattern: /\b_start\b/g, replacement: 'start' },
  { pattern: /\b_end\b/g, replacement: 'end' },
  { pattern: /\b_begin\b/g, replacement: 'begin' },
  { pattern: /\b_finish\b/g, replacement: 'finish' },
  { pattern: /\b_duration\b/g, replacement: 'duration' },
  { pattern: /\b_timeout\b/g, replacement: 'timeout' },
  { pattern: /\b_interval\b/g, replacement: 'interval' },
  { pattern: /\b_delay\b/g, replacement: 'delay' },
  { pattern: /\b_timer\b/g, replacement: 'timer' },
  { pattern: /\b_timerId\b/g, replacement: 'timerId' },
  { pattern: /\b_trendLine\b/g, replacement: 'trendLine' },
  
  // Fix broken method calls
  { pattern: /localStorage\._/g, replacement: 'localStorage.' },
  { pattern: /sessionStorage\._/g, replacement: 'sessionStorage.' },
  { pattern: /console\._/g, replacement: 'console.' },
  { pattern: /window\._/g, replacement: 'window.' },
  { pattern: /document\._/g, replacement: 'document.' },
  { pattern: /navigator\._/g, replacement: 'navigator.' },
  { pattern: /location\._/g, replacement: 'location.' },
  { pattern: /history\._/g, replacement: 'history.' },
  { pattern: /crypto\._/g, replacement: 'crypto.' },
  { pattern: /Math\._/g, replacement: 'Math.' },
  { pattern: /JSON\._/g, replacement: 'JSON.' },
  { pattern: /Object\._/g, replacement: 'Object.' },
  { pattern: /Array\._/g, replacement: 'Array.' },
  { pattern: /String\._/g, replacement: 'String.' },
  { pattern: /Number\._/g, replacement: 'Number.' },
  { pattern: /Boolean\._/g, replacement: 'Boolean.' },
  { pattern: /Date\._/g, replacement: 'Date.' },
  { pattern: /Promise\._/g, replacement: 'Promise.' },
  { pattern: /Set\._/g, replacement: 'Set.' },
  { pattern: /Map\._/g, replacement: 'Map.' },
  { pattern: /WeakSet\._/g, replacement: 'WeakSet.' },
  { pattern: /WeakMap\._/g, replacement: 'WeakMap.' },
  
  // Fix specific broken references from error patterns
  { pattern: /\be\b(?=\s+is\s+not\s+defined|\)|\.|,|\s*})/g, replacement: 'error' },
  { pattern: /catch\s*\(\s*_(\w+)\s*\)/g, replacement: 'catch (_$1)' },
  { pattern: /\((\w+),\s*_(\w+)\)/g, replacement: '($1, $2)' },
  { pattern: /\(_(\w+),\s*(\w+)\)/g, replacement: '($1, $2)' },
];

// Special handling for specific files/patterns
const specialFixes = (content, filePath) => {
  let fixed = content;
  
  // Fix for loop iterators
  fixed = fixed.replace(/for\s*\(\s*let\s+_i\s*=/g, 'for (let i =');
  fixed = fixed.replace(/for\s*\(\s*const\s+_i\s*=/g, 'for (const i =');
  fixed = fixed.replace(/for\s*\(\s*let\s+_j\s*=/g, 'for (let j =');
  fixed = fixed.replace(/for\s*\(\s*const\s+_j\s*=/g, 'for (const j =');
  
  // Fix array destructuring
  fixed = fixed.replace(/const\s+\[_(\w+),\s*_(\w+)\]/g, 'const [$1, $2]');
  fixed = fixed.replace(/let\s+\[_(\w+),\s*_(\w+)\]/g, 'let [$1, $2]');
  
  // Fix object destructuring
  fixed = fixed.replace(/const\s+\{\s*_(\w+)\s*\}/g, 'const { $1 }');
  fixed = fixed.replace(/let\s+\{\s*_(\w+)\s*\}/g, 'let { $1 }');
  
  // Fix function parameters
  fixed = fixed.replace(/function\s+(\w+)\s*\(\s*_(\w+)/g, 'function $1($2');
  fixed = fixed.replace(/\((_\w+)\s*=>/g, '($1 =>');
  
  // Fix specific variable declarations that were incorrectly underscored
  const variableDeclarationPattern = /\b(const|let|var)\s+_(\w+)\s*=/g;
  fixed = fixed.replace(variableDeclarationPattern, (match, keyword, varName) => {
    // Check if this variable is actually used later without underscore
    const usagePattern = new RegExp(`\\b${varName}\\b(?!\\s*=)`, 'g');
    if (fixed.match(usagePattern)) {
      return `${keyword} ${varName} =`;
    }
    return match; // Keep underscore if truly unused
  });
  
  return fixed;
};

const processFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let fixed = content;
    
    // Apply general patterns
    fixPatterns.forEach(({ pattern, replacement }) => {
      fixed = fixed.replace(pattern, replacement);
    });
    
    // Apply special fixes
    fixed = specialFixes(fixed, filePath);
    
    if (fixed !== content) {
      // Create backup
      const backupPath = filePath + '.backup-no-undef';
      fs.writeFileSync(backupPath, content);
      
      // Write fixed content
      fs.writeFileSync(filePath, fixed);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}: ${error.message}`);
    return false;
  }
};

// Main execution
console.log('Getting files with no-undef errors...');
const filesWithErrors = getFilesWithErrors();
console.log(`Found ${filesWithErrors.length} files with no-undef errors\n`);

let totalFixed = 0;
const filesToProcess = filesWithErrors.slice(0, 50); // Process top 50 files first

filesToProcess.forEach(({ path: filePath, count }) => {
  const relativePath = filePath.replace(process.cwd() + '\\', '').replace(process.cwd() + '/', '');
  console.log(`Processing ${relativePath} (${count} no-undef errors)...`);
  
  if (processFile(filePath)) {
    totalFixed++;
    console.log(`  ✓ Fixed`);
  } else {
    console.log(`  - No changes needed`);
  }
});

console.log(`\nProcessed ${filesToProcess.length} files, fixed ${totalFixed} files`);
console.log('Run ESLint to check remaining errors');