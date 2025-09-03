#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript and TSX files
const files = glob.sync('src/**/*.{ts,tsx}', { nodir: true });

let totalFixed = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Replace HTML entities
  content = content.replace(/&apos;/g, "'");
  content = content.replace(/&quot;/g, '"');
  content = content.replace(/&lt;/g, '<');
  content = content.replace(/&gt;/g, '>');
  content = content.replace(/&amp;/g, '&');
  
  // Check if content changed
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    totalFixed++;
    console.log(`Fixed HTML entities in: ${file}`);
  }
});

console.log(`\nTotal files fixed: ${totalFixed}`);