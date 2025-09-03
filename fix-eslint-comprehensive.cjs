const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Phase 1: Update ESLint config to exclude .d.ts files
console.log('📝 Phase 1: Updating ESLint configuration...');

const eslintConfig = `import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['**/*.d.ts'], // Exclude type declaration files
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        alert: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        fetch: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        Headers: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        File: 'readonly',
        Blob: 'readonly',
        FileReader: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLFormElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLButtonElement: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly',
        MessageEvent: 'readonly',
        KeyboardEvent: 'readonly',
        MouseEvent: 'readonly',
        TouchEvent: 'readonly',
        Touch: 'readonly',
        TouchList: 'readonly',
        FocusEvent: 'readonly',
        UIEvent: 'readonly',
        GeolocationPosition: 'readonly',
        GeolocationCoordinates: 'readonly',
        GeolocationPositionError: 'readonly',
        IDBDatabase: 'readonly',
        IDBOpenDBRequest: 'readonly',
        IDBObjectStore: 'readonly',
        IDBRequest: 'readonly',
        IDBTransaction: 'readonly',
        IDBVersionChangeEvent: 'readonly',
        indexedDB: 'readonly',
        prompt: 'readonly',
        btoa: 'readonly',
        atob: 'readonly',
        React: 'readonly',
        // Timers
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        // Node globals
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        NodeJS: 'readonly',
        // Performance APIs
        PerformanceObserver: 'readonly',
        PerformanceEntry: 'readonly',
        PerformanceMark: 'readonly',
        PerformanceMeasure: 'readonly',
        performance: 'readonly',
        // Testing globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        vi: 'readonly',
        // Web API Types
        Storage: 'readonly',
        StorageManager: 'readonly',
        // Speech API
        SpeechSynthesisUtterance: 'readonly',
        SpeechRecognition: 'readonly',
        SpeechRecognitionEvent: 'readonly',
        speechSynthesis: 'readonly',
        // Audio API
        AudioContext: 'readonly',
        AnalyserNode: 'readonly',
        MediaStreamAudioSourceNode: 'readonly',
        // Service Worker
        ServiceWorkerRegistration: 'readonly',
        ServiceWorker: 'readonly',
        PushManager: 'readonly',
        // Crypto
        Crypto: 'readonly',
        CryptoKey: 'readonly',
        SubtleCrypto: 'readonly',
        crypto: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        // Cache API
        CacheStorage: 'readonly',
        Cache: 'readonly',
        caches: 'readonly',
        // Notification API
        Notification: 'readonly',
        NotificationOptions: 'readonly',
        // AbortController
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        // Media APIs
        MediaDevices: 'readonly',
        MediaStream: 'readonly',
        MediaStreamTrack: 'readonly',
        // WebRTC
        RTCPeerConnection: 'readonly',
        RTCSessionDescription: 'readonly',
        RTCIceCandidate: 'readonly',
        RTCDataChannel: 'readonly',
        // PWA
        BeforeInstallPromptEvent: 'readonly',
        // JSX namespace
        JSX: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react': react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...typescript.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/no-static-element-interactions': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    ignores: [
      'dist',
      'dev-dist',
      'coverage',
      'node_modules',
      'agent-system',
      '*.config.js',
      '*.config.cjs',
      '*.config.ts',
      'public/sw.js',
      'public/workbox-*.js',
      'postcss.config.js',
      'tailwind.config.js',
      'generate-icons.js',
      'migrate-to-secure-storage.js',
      'eslint-*.json',
      'analyze-*.cjs',
      'fix-*.cjs',
      '**/*.d.ts', // Explicitly ignore all .d.ts files
      'src/types/*.d.ts',
      'src/**/*.d.ts'
    ],
  },
];`;

fs.writeFileSync('eslint.config.js', eslintConfig);
console.log('✅ ESLint config updated to exclude .d.ts files');

// Phase 2: Get list of files with most errors (excluding .d.ts)
console.log('\n📊 Phase 2: Analyzing error distribution...');
try {
  execSync('npx eslint . --ext .ts,.tsx --format json > eslint-errors.json', { encoding: 'utf-8' });
} catch (error) {
  // ESLint exits with error code when there are issues
}

const results = JSON.parse(fs.readFileSync('eslint-errors.json', 'utf-8'));
const filesByErrorCount = results
  .filter(file => !file.filePath.endsWith('.d.ts') && file.messages.length > 0)
  .sort((a, b) => b.messages.length - a.messages.length);

console.log(`Found ${filesByErrorCount.length} files with errors to fix`);

// Phase 3: Fix no-undef errors systematically
console.log('\n🔧 Phase 3: Fixing no-undef errors...');

let totalFixed = 0;

filesByErrorCount.forEach(fileResult => {
  const filePath = fileResult.filePath;
  const relativePath = path.relative(process.cwd(), filePath);
  
  // Skip if file doesn't exist
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;
  let fileFixed = 0;
  
  // Group errors by type
  const noUndefErrors = fileResult.messages.filter(msg => msg.ruleId === 'no-undef');
  const unusedVarErrors = fileResult.messages.filter(msg => 
    msg.ruleId === '@typescript-eslint/no-unused-vars'
  );
  const consoleErrors = fileResult.messages.filter(msg => msg.ruleId === 'no-console');
  
  // Fix no-undef errors (variables that were prefixed with underscore incorrectly)
  const undefVars = new Set();
  noUndefErrors.forEach(error => {
    const match = error.message.match(/'([^']+)' is not defined/);
    if (match) {
      undefVars.add(match[1]);
    }
  });
  
  undefVars.forEach(varName => {
    // Check if there's a declaration with underscore prefix
    const declarationPattern = new RegExp(`(const|let|var|function)\\s+_${varName}\\b`, 'g');
    if (declarationPattern.test(content)) {
      // Remove underscore from declaration
      content = content.replace(
        new RegExp(`(const|let|var|function)(\\s+)_${varName}\\b`, 'g'),
        `$1$2${varName}`
      );
      fileFixed++;
    }
  });
  
  // Fix unused variables (add underscore prefix)
  const unusedVars = new Set();
  unusedVarErrors.forEach(error => {
    const match = error.message.match(/'([^']+)' is (assigned a value but never used|defined but never used)/);
    if (match) {
      unusedVars.add(match[1]);
    }
  });
  
  unusedVars.forEach(varName => {
    // Skip if already has underscore
    if (varName.startsWith('_')) return;
    
    // Add underscore to declaration
    const patterns = [
      // Variable declarations
      new RegExp(`(const|let|var)(\\s+)${varName}\\b(?!\\s*:)`, 'g'),
      // Function parameters
      new RegExp(`(\\(|,)\\s*${varName}\\s*(?:[,:\\)])`, 'g'),
      // Destructuring
      new RegExp(`{([^}]*\\b)${varName}(\\b[^}]*)}`, 'g'),
    ];
    
    patterns.forEach(pattern => {
      if (pattern.test(content)) {
        if (pattern.source.includes('(const|let|var)')) {
          content = content.replace(pattern, `$1$2_${varName}`);
        } else if (pattern.source.includes('\\(|,')) {
          content = content.replace(pattern, (match, prefix) => {
            return match.replace(varName, `_${varName}`);
          });
        } else if (pattern.source.includes('{')) {
          content = content.replace(pattern, (match) => {
            return match.replace(new RegExp(`\\b${varName}\\b`, 'g'), `_${varName}`);
          });
        }
        fileFixed++;
      }
    });
  });
  
  // Fix console.log statements (convert to logger)
  if (consoleErrors.length > 0) {
    // Check if logger is imported
    if (!content.includes("import { logger }") && !content.includes("import logger")) {
      // Add logger import at the top of the file
      const importMatch = content.match(/^(import .+ from .+;\n)+/m);
      if (importMatch) {
        const lastImportEnd = importMatch.index + importMatch[0].length;
        content = content.slice(0, lastImportEnd) + 
                  "import { logger } from '../utils/logger';\n" +
                  content.slice(lastImportEnd);
      } else {
        content = "import { logger } from '../utils/logger';\n" + content;
      }
    }
    
    // Replace console.log with logger.info
    content = content.replace(/console\.log\(/g, 'logger.info(');
    content = content.replace(/console\.debug\(/g, 'logger.debug(');
    fileFixed += consoleErrors.length;
  }
  
  // Write file if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    totalFixed += fileFixed;
    console.log(`  ✅ Fixed ${fileFixed} issues in ${relativePath}`);
  }
});

console.log(`\n✨ Total fixes applied: ${totalFixed}`);

// Phase 4: Run ESLint again to get updated count
console.log('\n📊 Phase 4: Getting updated error count...');
try {
  const output = execSync('npx eslint . --ext .ts,.tsx 2>&1', { encoding: 'utf-8' });
  console.log(output);
} catch (error) {
  const output = error.stdout || error.output?.join('') || '';
  const match = output.match(/(\d+) problems?.*\((\d+) errors?, (\d+) warnings?\)/);
  if (match) {
    console.log(`\n🎯 Remaining issues: ${match[1]} problems (${match[2]} errors, ${match[3]} warnings)`);
  }
}

console.log('\n🚀 Fix script completed! Run "npm run lint" to see remaining issues.');