#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all files with unescaped entities errors
console.log('Finding files with unescaped entities...');
const eslintOutput = execSync('npx eslint src --ext .js,.jsx,.ts,.tsx 2>&1 || true', { 
  encoding: 'utf8',
  maxBuffer: 10 * 1024 * 1024 // 10MB buffer
});

// Parse ESLint output to find files with react/no-unescaped-entities errors
const lines = eslintOutput.split('\n');
const filesWithErrors = new Map();

lines.forEach(line => {
  if (line.includes('react/no-unescaped-entities')) {
    // Extract file path and line number
    const match = line.match(/^(.*?):(\d+):\d+\s+error\s+`(.)` can be escaped/);
    if (match) {
      const [, filePath, lineNum, char] = match;
      if (!filesWithErrors.has(filePath)) {
        filesWithErrors.set(filePath, []);
      }
      filesWithErrors.get(filePath).push({ lineNum: parseInt(lineNum), char });
    }
  }
});

console.log(`Found ${filesWithErrors.size} files with unescaped entities`);

// Process each file
filesWithErrors.forEach((errors, filePath) => {
  console.log(`Processing ${filePath}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Sort errors by line number in reverse order to avoid line number shifts
    errors.sort((a, b) => b.lineNum - a.lineNum);
    
    errors.forEach(({ lineNum, char }) => {
      const lineIndex = lineNum - 1;
      if (lineIndex >= 0 && lineIndex < lines.length) {
        let line = lines[lineIndex];
        
        // Only replace in JSX text content (not in attributes or JavaScript expressions)
        // Look for patterns like >text< or >text</
        const jsxTextPattern = />([^<]*)</g;
        
        line = line.replace(jsxTextPattern, (match, text) => {
          let escapedText = text;
          if (char === "'") {
            escapedText = text.replace(/'/g, '&apos;');
          } else if (char === '"') {
            escapedText = text.replace(/"/g, '&quot;');
          }
          return `>${escapedText}<`;
        });
        
        // Also handle text at the beginning of JSX lines
        if (line.trim().startsWith("'") || line.includes(">") && line.includes("'")) {
          // More conservative approach for mixed content
          const parts = line.split(/(<[^>]*>)/);
          for (let i = 0; i < parts.length; i++) {
            // Only process non-tag parts
            if (!parts[i].startsWith('<') && !parts[i].endsWith('>')) {
              if (char === "'" && !parts[i].includes('className=') && !parts[i].includes('onClick=')) {
                parts[i] = parts[i].replace(/'/g, '&apos;');
              } else if (char === '"') {
                parts[i] = parts[i].replace(/"/g, '&quot;');
              }
            }
          }
          line = parts.join('');
        }
        
        lines[lineIndex] = line;
      }
    });
    
    // Write back the modified content
    const newContent = lines.join('\n');
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`  ✓ Fixed ${errors.length} unescaped entities`);
    }
  } catch (error) {
    console.error(`  ✗ Error processing ${filePath}: ${error.message}`);
  }
});

console.log('Done fixing unescaped entities!');