#!/usr/bin/env node

/**
 * Migration Script: Replace localStorage usage with secure storage
 * 
 * This script automatically migrates all localStorage usage in sensitive files
 * to use the new SecureLocalStorage wrapper for encrypted data protection
 */

import fs from 'fs';
import path from 'path';

// Files that contain sensitive data and should use secure storage
const SENSITIVE_FILES = [
  'src/components/crisis/',
  'src/components/wellness/',
  'src/hooks/',
  'src/services/',
  'src/stores/',
  'src/contexts/'
];

// Pattern to find localStorage usage
const LOCALSTORAGE_PATTERNS = [
  {
    pattern: /localStorage\.(getItem|setItem|removeItem)\(/g,
    replacement: (match, method) => `secureStorage.${method}(`
  }
];

// Import statement to add
const _SECURE_STORAGE_IMPORT = "import { secureStorage } from '../services/security/SecureLocalStorage';";

function findTSXFiles(dir, filesList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findTSXFiles(filePath, filesList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      // Skip test files and type definition files
      if (!file.includes('.test.') && !file.includes('.d.ts')) {
        filesList.push(filePath);
      }
    }
  });
  
  return filesList;
}

function calculateRelativeImportPath(filePath) {
  const fileDir = path.dirname(filePath);
  const secureStoragePath = path.resolve('src/services/security/SecureLocalStorage.ts');
  const relativePath = path.relative(fileDir, secureStoragePath);
  
  // Convert Windows paths to Unix-style for imports
  return relativePath.replace(/\\/g, '/').replace('.ts', '');
}

function migrateFile(filePath) {
  console.log(`📁 Checking: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let hasChanges = false;
  let hasLocalStorage = false;
  
  // Check if file uses localStorage
  if (content.includes('localStorage.')) {
    hasLocalStorage = true;
    console.log(`🔍 Found localStorage usage in: ${filePath}`);
    
    // Replace localStorage patterns
    LOCALSTORAGE_PATTERNS.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        hasChanges = true;
      }
    });
    
    // Add secure storage import if not already present
    if (hasChanges && !content.includes('SecureLocalStorage')) {
      const relativePath = calculateRelativeImportPath(filePath);
      const importStatement = `import { secureStorage } from '${relativePath}';`;
      
      // Find the last import statement and add after it
      const importLines = content.split('\n');
      let lastImportIndex = -1;
      
      importLines.forEach((line, index) => {
        if (line.trim().startsWith('import ')) {
          lastImportIndex = index;
        }
      });
      
      if (lastImportIndex >= 0) {
        importLines.splice(lastImportIndex + 1, 0, importStatement);
        content = importLines.join('\n');
      } else {
        // Add at the top if no imports found
        content = importStatement + '\n' + content;
      }
      
      console.log(`✅ Added secure storage import to: ${filePath}`);
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ Migrated localStorage to secure storage in: ${filePath}`);
    }
  }
  
  return { hasChanges, hasLocalStorage };
}

function main() {
  console.log('🔐 Starting localStorage to SecureStorage migration...\n');
  
  let totalFiles = 0;
  let migratedFiles = 0;
  let filesWithLocalStorage = 0;
  
  // Process each sensitive directory
  SENSITIVE_FILES.forEach(dirPattern => {
    const fullPath = path.resolve(dirPattern);
    
    if (fs.existsSync(fullPath)) {
      console.log(`📂 Processing directory: ${dirPattern}`);
      
      const files = findTSXFiles(fullPath);
      
      files.forEach(filePath => {
        totalFiles++;
        const { hasChanges, hasLocalStorage } = migrateFile(filePath);
        
        if (hasLocalStorage) {
          filesWithLocalStorage++;
        }
        
        if (hasChanges) {
          migratedFiles++;
        }
      });
      
      console.log(''); // Empty line for readability
    } else {
      console.log(`⚠️  Directory not found: ${dirPattern}`);
    }
  });
  
  // Summary
  console.log('🎯 Migration Summary:');
  console.log(`📊 Total files processed: ${totalFiles}`);
  console.log(`🔍 Files with localStorage: ${filesWithLocalStorage}`);
  console.log(`✅ Files migrated: ${migratedFiles}`);
  console.log(`🔒 Files now using secure storage: ${migratedFiles}`);
  
  if (migratedFiles > 0) {
    console.log('\n🔐 IMPORTANT: Set VITE_ENCRYPTION_KEY in your environment variables!');
    console.log('Example: VITE_ENCRYPTION_KEY=your-256-bit-encryption-key-here');
  }
  
  console.log('\n🎉 Migration completed successfully!');
}

// Run migration
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const ___dirname = dirname(__filename);

main();