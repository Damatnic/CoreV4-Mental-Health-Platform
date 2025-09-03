#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Fix specific parsing errors introduced by over-escaping
function fixParsingErrors(content, filePath) {
  let fixed = content;
  
  // Fix incorrectly escaped apostrophes in TypeScript type declarations and string literals
  // These patterns were incorrectly changed from 'string' to 'string&apos;
  fixed = fixed.replace(/\('([^']+)&apos;\)/g, "('$1')"); // Fix function calls with string literals
  fixed = fixed.replace(/<'week' \| 'month' \| 'quarter' \| 'year'>.*?&apos;/g, (match) => {
    return match.replace('&apos;', "'");
  });
  
  // Fix useState default values that were incorrectly escaped
  fixed = fixed.replace(/useState\(['"](.*?)&apos;['"]\)/g, "useState('$1')");
  fixed = fixed.replace(/useState<.*?>\(['"](.*?)&apos;['"]\)/g, (match) => {
    return match.replace('&apos;', "'");
  });
  
  // Fix string literals that were incorrectly escaped
  fixed = fixed.replace(/([=\s])['"]([^'"]*?)&apos;['"]/g, "$1'$2'");
  
  // Fix object property keys that were incorrectly escaped
  fixed = fixed.replace(/(['"])([^'"]+)&apos;(['"])\s*:/g, "$1$2'$3:");
  
  // Fix comparison operators with string literals
  fixed = fixed.replace(/===\s+['"]([^'"]+)&apos;['"]/g, "=== '$1'");
  fixed = fixed.replace(/!==\s+['"]([^'"]+)&apos;['"]/g, "!== '$1'");
  
  // Fix logger messages
  fixed = fixed.replace(/logger\.(error|warn|info|debug)\(['"](.*?)&apos;/g, "logger.$1('$2'");
  
  // Fix import statements
  fixed = fixed.replace(/from\s+['"]([^'"]+)&apos;['"]/g, "from '$1'");
  
  // Fix keyPath and other object properties
  fixed = fixed.replace(/keyPath:\s+['"]([^'"]+)&apos;['"]/g, "keyPath: '$1'");
  
  // Fix action type strings
  fixed = fixed.replace(/action:\s+['"]([^'"]+)&apos;['"]/g, "action: '$1'");
  
  // Fix badge and label strings in JSX
  fixed = fixed.replace(/badge=\{!isOnline \? ['"]([^'"]+)&apos;['"]/g, "badge={!isOnline ? '$1'");
  
  // Fix setActiveView calls
  fixed = fixed.replace(/setActiveView\(['"]([^'"]+)&apos;['"]\)/g, "setActiveView('$1')");
  
  // Fix window.location.href assignments
  fixed = fixed.replace(/window\.location\.href\s*=\s*['"]([^'"]+)&apos;/g, "window.location.href = '$1'");
  
  // Fix className conditionals
  fixed = fixed.replace(/\?\s+['"]([^'"]+)&apos;['"]\s+:/g, "? '$1' :");
  
  // Fix onChange handlers with type casting
  fixed = fixed.replace(/as\s+unknown/g, "as any");
  
  // Now properly escape apostrophes ONLY in JSX text content
  const lines = fixed.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Only process lines that contain JSX (have < and >)
    if (line.includes('>') && line.includes('<')) {
      // Find text between > and < (JSX text content)
      lines[i] = line.replace(/>([^<]+)</g, (match, text) => {
        // Skip if it already contains &apos; or is inside {}
        if (text.includes('&apos;') || text.includes('{')) {
          return match;
        }
        
        // Only escape actual apostrophes in text content
        const escapedText = text
          .replace(/\bdon't\b/g, "don&apos;t")
          .replace(/\bcan't\b/g, "can&apos;t")
          .replace(/\bwon't\b/g, "won&apos;t")
          .replace(/\bisn't\b/g, "isn&apos;t")
          .replace(/\baren't\b/g, "aren&apos;t")
          .replace(/\bwasn't\b/g, "wasn&apos;t")
          .replace(/\bweren't\b/g, "weren&apos;t")
          .replace(/\bhaven't\b/g, "haven&apos;t")
          .replace(/\bhasn't\b/g, "hasn&apos;t")
          .replace(/\bhadn't\b/g, "hadn&apos;t")
          .replace(/\bwouldn't\b/g, "wouldn&apos;t")
          .replace(/\bcouldn't\b/g, "couldn&apos;t")
          .replace(/\bshouldn't\b/g, "shouldn&apos;t")
          .replace(/\bYou're\b/g, "You&apos;re")
          .replace(/\byou're\b/g, "you&apos;re")
          .replace(/\bWe're\b/g, "We&apos;re")
          .replace(/\bwe're\b/g, "we&apos;re")
          .replace(/\bThey're\b/g, "They&apos;re")
          .replace(/\bthey're\b/g, "they&apos;re")
          .replace(/\bIt's\b/g, "It&apos;s")
          .replace(/\bit's\b/g, "it&apos;s")
          .replace(/\bI'm\b/g, "I&apos;m")
          .replace(/\bI've\b/g, "I&apos;ve")
          .replace(/\bI'll\b/g, "I&apos;ll")
          .replace(/\bI'd\b/g, "I&apos;d")
          .replace(/\byou've\b/g, "you&apos;ve")
          .replace(/\byou'll\b/g, "you&apos;ll")
          .replace(/\byou'd\b/g, "you&apos;d")
          .replace(/\bwe've\b/g, "we&apos;ve")
          .replace(/\bwe'll\b/g, "we&apos;ll")
          .replace(/\bwe'd\b/g, "we&apos;d")
          .replace(/\bthey've\b/g, "they&apos;ve")
          .replace(/\bthey'll\b/g, "they&apos;ll")
          .replace(/\bthey'd\b/g, "they&apos;d")
          .replace(/\bthere's\b/g, "there&apos;s")
          .replace(/\bhere's\b/g, "here&apos;s")
          .replace(/\bwhat's\b/g, "what&apos;s")
          .replace(/\bthat's\b/g, "that&apos;s")
          .replace(/\blet's\b/g, "let&apos;s");
        
        return `>${escapedText}<`;
      });
    }
  }
  fixed = lines.join('\n');
  
  return fixed;
}

// Fix unused variables
function fixUnusedVariables(content) {
  let fixed = content;
  
  // Prefix unused error variables with underscore
  fixed = fixed.replace(/\bcatch\s*\(\s*error\s*\)/g, 'catch (_error)');
  fixed = fixed.replace(/\bcatch\s*\(\s*e\s*\)/g, 'catch (_e)');
  fixed = fixed.replace(/\bcatch\s*\(\s*err\s*\)/g, 'catch (_err)');
  
  // Fix unused destructured state setters
  fixed = fixed.replace(/const\s+\[(\w+),\s+(set\w+)\]\s*=\s*useState/g, (match, state, setter) => {
    // Check if setter is used in the file
    const setterRegex = new RegExp(`\\b${setter}\\b`);
    const usageCount = (content.match(setterRegex) || []).length;
    if (usageCount <= 1) { // Only found in declaration
      return `const [${state}, _${setter}] = useState`;
    }
    return match;
  });
  
  // Fix unused function parameters
  fixed = fixed.replace(/\((\w+):\s*\w+\)\s*=>\s*\{/g, (match, param) => {
    // Check if parameter is used in the function body
    const afterMatch = content.substring(content.indexOf(match));
    const functionEnd = afterMatch.indexOf('}');
    const functionBody = afterMatch.substring(0, functionEnd);
    
    if (!functionBody.includes(param)) {
      return match.replace(param, '_' + param);
    }
    return match;
  });
  
  return fixed;
}

// Fix TypeScript any types
function fixAnyTypes(content) {
  let fixed = content;
  
  // Replace common any patterns with proper types
  fixed = fixed.replace(/:\s*any\[\]/g, ': unknown[]');
  fixed = fixed.replace(/:\s*any/g, ': unknown');
  fixed = fixed.replace(/as\s+any/g, 'as unknown');
  
  // Fix Function type
  fixed = fixed.replace(/:\s*Function/g, ': (...args: any[]) => any');
  
  return fixed;
}

// Main function to process files
async function fixAllFiles() {
  console.log('🔧 Starting comprehensive ESLint fixes...\n');
  
  // Get all TypeScript and React files
  const files = execSync('find src -type f \\( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \\)', {
    encoding: 'utf8',
    cwd: process.cwd()
  }).trim().split('\n').filter(Boolean);
  
  let fixedCount = 0;
  let errorCount = 0;
  
  for (const file of files) {
    const fullPath = path.join(process.cwd(), file);
    
    try {
      const originalContent = fs.readFileSync(fullPath, 'utf8');
      let fixedContent = originalContent;
      
      // Apply fixes
      fixedContent = fixParsingErrors(fixedContent, file);
      fixedContent = fixUnusedVariables(fixedContent);
      
      // Only fix any types in .ts and .tsx files
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        fixedContent = fixAnyTypes(fixedContent);
      }
      
      // Only write if changes were made
      if (fixedContent !== originalContent) {
        fs.writeFileSync(fullPath, fixedContent, 'utf8');
        console.log(`✅ Fixed: ${file}`);
        fixedCount++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Fixed ${fixedCount} files`);
  if (errorCount > 0) {
    console.log(`   ❌ Failed to process ${errorCount} files`);
  }
  
  // Run ESLint to see remaining errors
  console.log('\n🔍 Checking remaining ESLint errors...');
  try {
    execSync('npx eslint . --ext .js,.jsx,.ts,.tsx', { encoding: 'utf8' });
    console.log('✨ All ESLint errors fixed!');
  } catch (error) {
    const output = error.stdout || error.toString();
    const match = output.match(/✖ (\d+) problems/);
    if (match) {
      const remaining = parseInt(match[1]);
      console.log(`📝 ${remaining} issues remaining (manual fix needed)`);
      
      // Show categories of remaining issues
      const errors = output.match(/(\d+) errors?/);
      const warnings = output.match(/(\d+) warnings?/);
      if (errors) console.log(`   - ${errors[0]}`);
      if (warnings) console.log(`   - ${warnings[0]}`);
    }
  }
}

// Run the fixes
fixAllFiles().catch(console.error);