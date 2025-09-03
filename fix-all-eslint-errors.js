#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Helper function to fix file content
function fixFileContent(filePath, content) {
  const lines = content.split('\n');
  let modified = false;
  
  // Fix unescaped entities in JSX
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Only process JSX content (look for JSX tags)
    if (line.includes('>') && line.includes('<')) {
      // Replace apostrophes in JSX text content
      line = line.replace(/>([^<]*)</g, (match, text) => {
        const escaped = text
          .replace(/'/g, '&apos;')
          .replace(/"/g, '&quot;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/&(?!(apos|quot|lt|gt|amp|#\d+|#x[\da-fA-F]+);)/g, '&amp;');
        return `>${escaped}<`;
      });
      
      // Handle text at the start of lines after tags
      if (line.match(/>\s*[^<]/)) {
        const parts = line.split(/(<[^>]*>)/);
        for (let j = 0; j < parts.length; j++) {
          // Only process non-tag parts that aren't inside quotes
          if (!parts[j].startsWith('<') && !parts[j].includes('=')) {
            parts[j] = parts[j]
              .replace(/'/g, '&apos;')
              .replace(/"/g, '&quot;');
          }
        }
        line = parts.join('');
      }
    }
    
    // Fix unused variables by prefixing with underscore
    if (line.includes('} catch (error)') || line.includes('} catch(error)')) {
      line = line.replace(/catch\s*\(\s*error\s*\)/, 'catch (_error)');
      modified = true;
    }
    
    // Fix unused destructured variables
    if (line.includes('const {') || line.includes('const [')) {
      // Check if it looks like a hook or state that might have unused setter
      line = line.replace(/\[\s*(\w+),\s*set\w+\s*\]/, (match, varName) => {
        if (content.includes(varName) && !content.includes('set' + varName[0].toUpperCase() + varName.slice(1))) {
          return match.replace('set', '_set');
        }
        return match;
      });
    }
    
    // Fix parsing errors in event handlers
    if (line.includes('onKeyDown={(e) =')) {
      // Fix malformed arrow functions
      line = line.replace(/onKeyDown=\{[^}]*\}[^>]*onKeyDown=\{[^}]*\}/g, (match) => {
        // Keep only the first valid onKeyDown handler
        const firstHandler = match.match(/onKeyDown=\{[^}]*\}/);
        return firstHandler ? firstHandler[0] : match;
      });
      modified = true;
    }
    
    // Fix duplicate attributes
    if (line.includes('role="button"') && line.split('role="button"').length > 2) {
      // Keep only one role="button"
      const parts = line.split('role="button"');
      line = parts[0] + 'role="button"' + parts.slice(2).join('');
      modified = true;
    }
    
    if (lines[i] !== line) {
      lines[i] = line;
      modified = true;
    }
  }
  
  return { content: lines.join('\n'), modified };
}

// Process specific file types
async function processFiles() {
  console.log('Starting ESLint error fixes...\n');
  
  // Get list of all TypeScript/React files
  const files = execSync('find src -type f \\( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \\)', {
    encoding: 'utf8',
    cwd: process.cwd()
  }).trim().split('\n').filter(Boolean);
  
  let totalFixed = 0;
  
  for (const file of files) {
    const fullPath = path.join(process.cwd(), file);
    
    try {
      const originalContent = fs.readFileSync(fullPath, 'utf8');
      const { content: fixedContent, modified } = fixFileContent(fullPath, originalContent);
      
      if (modified) {
        fs.writeFileSync(fullPath, fixedContent, 'utf8');
        console.log(`✓ Fixed ${file}`);
        totalFixed++;
      }
    } catch (error) {
      console.error(`✗ Error processing ${file}: ${error.message}`);
    }
  }
  
  console.log(`\n✓ Processed ${totalFixed} files`);
  
  // Run ESLint to see remaining errors
  console.log('\nRunning ESLint to check remaining errors...');
  try {
    execSync('npx eslint . --ext .js,.jsx,.ts,.tsx', { encoding: 'utf8' });
    console.log('✓ No ESLint errors remaining!');
  } catch (error) {
    const output = error.stdout || error.toString();
    const match = output.match(/✖ (\d+) problems/);
    if (match) {
      console.log(`ℹ ${match[1]} problems remaining (will need manual fixes)`);
    }
  }
}

processFiles().catch(console.error);