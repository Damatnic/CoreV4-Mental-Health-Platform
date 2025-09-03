#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript/TSX files
const files = glob.sync('src/**/*.{ts,tsx}', {
  cwd: process.cwd(),
  absolute: true
});

let totalFixed = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  
  // Pattern 1: catch (_error) where _error is not used in the catch block
  // Replace with just catch block without parameter
  const catchPattern = /catch\s*\(\s*_error\s*\)\s*{([^}]*)}/g;
  
  content = content.replace(catchPattern, (match, blockContent) => {
    // Check if _error is actually used in the block
    if (!blockContent.includes('_error')) {
      modified = true;
      totalFixed++;
      // If there's a logger.error call without _error, keep it
      // Otherwise, just use empty catch
      if (blockContent.includes('logger.error') && !blockContent.includes('_error')) {
        return `catch {${blockContent}}`;
      }
      return `catch {${blockContent}}`;
    }
    return match;
  });
  
  // Pattern 2: catch (_error: any) or catch (_error: Error)
  const typedCatchPattern = /catch\s*\(\s*_error\s*:\s*\w+\s*\)\s*{([^}]*)}/g;
  
  content = content.replace(typedCatchPattern, (match, blockContent) => {
    if (!blockContent.includes('_error')) {
      modified = true;
      totalFixed++;
      return `catch {${blockContent}}`;
    }
    return match;
  });
  
  // Pattern 3: Fix cases where error is referenced but _error is the parameter
  const mismatchedErrorPattern = /catch\s*\(\s*_error\s*\)\s*{([^}]*(?:console\.error|logger\.error)[^}]*)}/g;
  
  content = content.replace(mismatchedErrorPattern, (match, blockContent) => {
    // If the block references 'error' (not '_error'), rename the parameter
    if (blockContent.includes('error') && !blockContent.includes('_error')) {
      modified = true;
      totalFixed++;
      return match.replace('catch (_error)', 'catch (error)');
    }
    return match;
  });
  
  if (modified) {
    fs.writeFileSync(file, content);
    console.log(`Fixed: ${path.relative(process.cwd(), file)}`);
  }
});

console.log(`\nTotal fixes applied: ${totalFixed}`);