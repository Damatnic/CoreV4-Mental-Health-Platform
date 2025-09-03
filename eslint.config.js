import js from '@eslint/js';
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
        // Observer APIs
        MutationObserver: 'readonly',
        IntersectionObserver: 'readonly',
        ResizeObserver: 'readonly',
        MutationCallback: 'readonly',
        IntersectionObserverCallback: 'readonly',
        IntersectionObserverInit: 'readonly',
        ResizeObserverCallback: 'readonly',
        // Event types
        EventTarget: 'readonly',
        EventListener: 'readonly',
        AddEventListenerOptions: 'readonly',
        EventListenerOptions: 'readonly',
        FrameRequestCallback: 'readonly',
        // Request types
        RequestInit: 'readonly',
        RequestInfo: 'readonly',
        HeadersInit: 'readonly',
        // Stream APIs
        ReadableStream: 'readonly',
        WritableStream: 'readonly',
        TransformStream: 'readonly',
        // WebSocket
        WebSocket: 'readonly',
        CloseEvent: 'readonly',
        ErrorEvent: 'readonly',
        ProgressEvent: 'readonly',
        // Additional Event types
        DragEvent: 'readonly',
        WheelEvent: 'readonly',
        PointerEvent: 'readonly',
        StorageEvent: 'readonly',
        // Utility types
        DOMStringList: 'readonly',
        DOMRect: 'readonly',
        DOMRectList: 'readonly',
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
      'no-undef': 'off', // TypeScript handles this
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
];