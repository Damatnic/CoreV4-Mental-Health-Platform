#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const fixes = {
  // Fix parsing errors with try-catch blocks
  parsingErrors: [
    {
      pattern: /catch\s*\{/g,
      replacement: 'catch (error) {'
    },
    {
      pattern: /catch\s*\(/g,
      checkNext: (content, index) => {
        const nextChar = content[index + 6];
        return nextChar === ')' || nextChar === ' )';
      },
      replacement: 'catch (error'
    }
  ],
  
  // Fix unescaped entities
  unescapedEntities: [
    {
      pattern: /(\w)'s\b/g,
      replacement: '$1&apos;s'
    },
    {
      pattern: /\bdon't\b/g,
      replacement: 'don&apos;t'
    },
    {
      pattern: /\bcan't\b/g,
      replacement: 'can&apos;t'
    },
    {
      pattern: /\bwon't\b/g,
      replacement: 'won&apos;t'
    },
    {
      pattern: /\bisn't\b/g,
      replacement: 'isn&apos;t'
    },
    {
      pattern: /\baren't\b/g,
      replacement: 'aren&apos;t'
    },
    {
      pattern: /\bwasn't\b/g,
      replacement: 'wasn&apos;t'
    },
    {
      pattern: /\bweren't\b/g,
      replacement: 'weren&apos;t'
    },
    {
      pattern: /\bhasn't\b/g,
      replacement: 'hasn&apos;t'
    },
    {
      pattern: /\bhaven't\b/g,
      replacement: 'haven&apos;t'
    },
    {
      pattern: /\bhadn't\b/g,
      replacement: 'hadn&apos;t'
    },
    {
      pattern: /\bwouldn't\b/g,
      replacement: 'wouldn&apos;t'
    },
    {
      pattern: /\bcouldn't\b/g,
      replacement: 'couldn&apos;t'
    },
    {
      pattern: /\bshouldn't\b/g,
      replacement: 'shouldn&apos;t'
    },
    {
      pattern: /\bI'm\b/g,
      replacement: 'I&apos;m'
    },
    {
      pattern: /\bI've\b/g,
      replacement: 'I&apos;ve'
    },
    {
      pattern: /\bI'll\b/g,
      replacement: 'I&apos;ll'
    },
    {
      pattern: /\bI'd\b/g,
      replacement: 'I&apos;d'
    },
    {
      pattern: /\byou're\b/g,
      replacement: 'you&apos;re'
    },
    {
      pattern: /\byou've\b/g,
      replacement: 'you&apos;ve'
    },
    {
      pattern: /\byou'll\b/g,
      replacement: 'you&apos;ll'
    },
    {
      pattern: /\byou'd\b/g,
      replacement: 'you&apos;d'
    },
    {
      pattern: /\bwe're\b/g,
      replacement: 'we&apos;re'
    },
    {
      pattern: /\bwe've\b/g,
      replacement: 'we&apos;ve'
    },
    {
      pattern: /\bwe'll\b/g,
      replacement: 'we&apos;ll'
    },
    {
      pattern: /\bwe'd\b/g,
      replacement: 'we&apos;d'
    },
    {
      pattern: /\bthey're\b/g,
      replacement: 'they&apos;re'
    },
    {
      pattern: /\bthey've\b/g,
      replacement: 'they&apos;ve'
    },
    {
      pattern: /\bthey'll\b/g,
      replacement: 'they&apos;ll'
    },
    {
      pattern: /\bthey'd\b/g,
      replacement: 'they&apos;d'
    },
    {
      pattern: /\bit's\b/g,
      replacement: 'it&apos;s'
    },
    {
      pattern: /\bthat's\b/g,
      replacement: 'that&apos;s'
    },
    {
      pattern: /\bhere's\b/g,
      replacement: 'here&apos;s'
    },
    {
      pattern: /\bthere's\b/g,
      replacement: 'there&apos;s'
    },
    {
      pattern: /\blet's\b/g,
      replacement: 'let&apos;s'
    }
  ],
  
  // Fix accessibility issues
  accessibilityFixes: [
    {
      // Fix label without accessible text
      pattern: /<label(\s+[^>]*)?>\s*<\/label>/g,
      replacement: (match, attrs) => {
        // Extract htmlFor if present
        const htmlForMatch = attrs?.match(/htmlFor=["']([^"']+)["']/);
        if (htmlForMatch) {
          return `<label${attrs || ''}><span className="sr-only">Label for ${htmlForMatch[1]}</span></label>`;
        }
        return match;
      }
    },
    {
      // Add role="button" to clickable divs
      pattern: /<div([^>]*onClick[^>]*)((?!role=)[^>])*>/g,
      replacement: (match, beforeOnClick, afterOnClick) => {
        if (!match.includes('role=')) {
          return match.replace(/>$/, ' role="button" tabIndex={0}>');
        }
        return match;
      }
    }
  ]
};

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Skip non-TypeScript/React files
    if (!filePath.match(/\.(tsx?|jsx?)$/)) {
      return false;
    }
    
    // Apply parsing error fixes
    fixes.parsingErrors.forEach(fix => {
      const originalContent = content;
      if (fix.checkNext) {
        // Special handling for conditional replacements
        let match;
        const regex = new RegExp(fix.pattern.source, fix.pattern.flags);
        while ((match = regex.exec(content)) !== null) {
          if (fix.checkNext(content, match.index)) {
            content = content.substring(0, match.index) + 
                     fix.replacement + 
                     content.substring(match.index + match[0].length);
          }
        }
      } else {
        content = content.replace(fix.pattern, fix.replacement);
      }
      if (content !== originalContent) modified = true;
    });
    
    // Only apply unescaped entity fixes in JSX/TSX files
    if (filePath.match(/\.(tsx|jsx)$/)) {
      // Find JSX text content and fix unescaped entities
      const jsxTextPattern = />([^<]+)</g;
      content = content.replace(jsxTextPattern, (match, text) => {
        let fixedText = text;
        fixes.unescapedEntities.forEach(fix => {
          fixedText = fixedText.replace(fix.pattern, fix.replacement);
        });
        return `>${fixedText}<`;
      });
      
      // Also fix in string literals within JSX
      const stringPattern = /(["'])([^"']*)'([^"']*)\1/g;
      content = content.replace(stringPattern, (match, quote, before, after) => {
        if (before.match(/\w$/) && after.match(/^(s|t|re|ve|ll|d|m)\b/)) {
          return `${quote}${before}&apos;${after}${quote}`;
        }
        return match;
      });
    }
    
    // Apply accessibility fixes
    if (filePath.match(/\.(tsx|jsx)$/)) {
      fixes.accessibilityFixes.forEach(fix => {
        const originalContent = content;
        if (typeof fix.replacement === 'function') {
          content = content.replace(fix.pattern, fix.replacement);
        } else {
          content = content.replace(fix.pattern, fix.replacement);
        }
        if (content !== originalContent) modified = true;
      });
    }
    
    // Fix unused variables by prefixing with underscore
    const unusedVarPattern = /const\s+(\[?)(\w+)(,?\s*)(\w+)?(\]?)\s*=\s*use/g;
    content = content.replace(unusedVarPattern, (match, bracket1, var1, comma, var2, bracket2) => {
      // Check if this looks like it might be unused
      const var1Pattern = new RegExp(`\\b${var1}\\b`, 'g');
      const var1Matches = (content.match(var1Pattern) || []).length;
      
      if (var2) {
        const var2Pattern = new RegExp(`\\b${var2}\\b`, 'g');
        const var2Matches = (content.match(var2Pattern) || []).length;
        
        // If setter function is never used, prefix with underscore
        if (var2Matches <= 2 && var2.startsWith('set')) {
          return `const ${bracket1}${var1}${comma}_${var2}${bracket2} = use`;
        }
      }
      
      // If main variable is never used, prefix with underscore
      if (var1Matches <= 2) {
        return `const ${bracket1}_${var1}${comma}${var2 || ''}${bracket2} = use`;
      }
      
      return match;
    });
    
    if (modified || content !== fs.readFileSync(filePath, 'utf8')) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('Starting ESLint fixes...');
  
  const patterns = [
    'src/**/*.tsx',
    'src/**/*.ts',
    'src/**/*.jsx',
    'src/**/*.js'
  ];
  
  let totalFixed = 0;
  
  patterns.forEach(pattern => {
    const files = glob.sync(pattern);
    files.forEach(file => {
      if (fixFile(file)) {
        console.log(`✅ Fixed: ${file}`);
        totalFixed++;
      }
    });
  });
  
  console.log(`\n✨ Fixed ${totalFixed} files`);
  
  // Run ESLint to check remaining issues
  console.log('\nRunning ESLint to check remaining issues...');
  const { execSync } = require('child_process');
  try {
    execSync('npx eslint . --ext .ts,.tsx,.js,.jsx --max-warnings 0', { stdio: 'inherit' });
    console.log('✅ No ESLint errors remaining!');
  } catch (error) {
    // ESLint will exit with error if there are still issues
    console.log('\n⚠️ Some ESLint issues remain. Run "npm run lint" to see details.');
  }
}

// Check for required dependencies
try {
  require('glob');
} catch (error) {
  console.error('Installing required dependency: glob');
  require('child_process').execSync('npm install --save-dev glob', { stdio: 'inherit' });
}

main();