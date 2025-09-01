/**
 * Optimized Vite Configuration for CoreV4 Mental Health Platform
 * Focuses on performance, code splitting, and crisis response optimization
 */

import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import { compression } from 'vite-plugin-compression2';
import path from 'path';

// Performance-focused Vite configuration
export default defineConfig({
  plugins: [
    // Use SWC for faster builds
    react({
      jsxImportSource: '@emotion/react',
      plugins: [
        ['@swc/plugin-emotion', {}]
      ]
    }),
    
    // Advanced vendor chunk splitting
    splitVendorChunkPlugin(),
    
    // PWA with aggressive caching for crisis resources
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'robots.txt',
        'apple-touch-icon.png',
        'icons/*.png',
        'fonts/*.woff2',
        'crisis-resources.json' // Pre-cached crisis data
      ],
      manifest: false,
      workbox: {
        // Aggressive caching strategy for crisis resources
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2,json}'],
        cleanupOutdatedCaches: true,
        sourcemap: false, // Disable in production for smaller size
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/(api|admin)\//],
        
        // Runtime caching strategies
        runtimeCaching: [
          // Crisis resources - Cache First with immediate fallback
          {
            urlPattern: /\/crisis\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'crisis-cache-v1',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // 988 and emergency resources - Network First with fast timeout
          {
            urlPattern: /\/(988|emergency|hotline)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'emergency-cache-v1',
              networkTimeoutSeconds: 1, // 1 second timeout
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          },
          // API calls - Network First with reasonable timeout
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache-v1',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 // 1 hour
              }
            }
          },
          // Images - Cache First for performance
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache-v1',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          // Fonts - Cache First with long expiration
          {
            urlPattern: /\.(?:woff|woff2|ttf|otf)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-cache-v1',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ],
        
        // Precache crisis resources
        additionalManifestEntries: [
          { url: '/crisis-resources.json', revision: '1' },
          { url: '/emergency-contacts.json', revision: '1' }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    }),
    
    // Compression plugin for smaller bundles
    compression({
      algorithm: 'gzip',
      threshold: 1024, // Only compress files > 1KB
      deleteOriginalAssets: false,
      filter: /\.(js|css|html|svg|json)$/,
      compressionOptions: { level: 9 }
    }),
    
    compression({
      algorithm: 'brotliCompress',
      threshold: 1024,
      deleteOriginalAssets: false,
      filter: /\.(js|css|html|svg|json)$/,
      compressionOptions: { level: 11 }
    }),
    
    // Bundle analyzer (only in analyze mode)
    process.env.ANALYZE && visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap'
    })
  ].filter(Boolean),
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@types': path.resolve(__dirname, './src/types'),
      '@styles': path.resolve(__dirname, './src/styles')
    }
  },
  
  server: {
    port: 5173,
    host: true,
    open: true,
    cors: true,
    hmr: {
      overlay: true
    },
    // Warmup critical files for faster HMR
    warmup: {
      clientFiles: [
        './src/components/crisis/*.tsx',
        './src/pages/HomePage.tsx',
        './src/components/dashboard/*.tsx'
      ]
    }
  },
  
  // Web Worker configuration for offloading heavy tasks
  worker: {
    format: 'es',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/workers/[name]-[hash].js'
      }
    }
  },
  
  build: {
    target: 'es2020',
    minify: 'terser',
    
    // Advanced terser options for maximum optimization
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 3, // Multiple passes for better optimization
        ecma: 2020,
        module: true,
        toplevel: true,
        unsafe_arrows: true,
        unsafe_methods: true,
        unsafe_proto: true,
        unsafe_regexp: true,
        unsafe_undefined: true,
        unused: true
      },
      mangle: {
        safari10: true,
        toplevel: true,
        properties: {
          regex: /^_/ // Mangle private properties
        }
      },
      format: {
        comments: false,
        ecma: 2020
      }
    },
    
    rollupOptions: {
      output: {
        // Advanced manual chunks for optimal code splitting
        manualChunks: (id) => {
          // Crisis components - highest priority, smallest bundle
          if (id.includes('/crisis/')) {
            return 'crisis-critical';
          }
          
          // Emergency and safety components
          if (id.includes('emergency') || id.includes('safety') || id.includes('hotline')) {
            return 'emergency';
          }
          
          // React core libraries
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor';
          }
          
          // React Router
          if (id.includes('react-router')) {
            return 'router';
          }
          
          // UI component libraries
          if (id.includes('framer-motion')) {
            return 'animation';
          }
          
          if (id.includes('@radix-ui') || id.includes('lucide-react')) {
            return 'ui-components';
          }
          
          // Data management libraries
          if (id.includes('zustand')) {
            return 'state';
          }
          
          if (id.includes('@tanstack/react-query')) {
            return 'query';
          }
          
          if (id.includes('axios') || id.includes('socket.io')) {
            return 'network';
          }
          
          // Chart libraries (lazy loaded)
          if (id.includes('chart') || id.includes('recharts')) {
            return 'charts';
          }
          
          // Form libraries
          if (id.includes('react-hook-form') || id.includes('zod')) {
            return 'forms';
          }
          
          // Utility libraries
          if (id.includes('date-fns')) {
            return 'date-utils';
          }
          
          if (id.includes('clsx') || id.includes('immer')) {
            return 'utils';
          }
          
          // Wellness features
          if (id.includes('/wellness/')) {
            return 'wellness';
          }
          
          // Community features
          if (id.includes('/community/')) {
            return 'community';
          }
          
          // Professional features
          if (id.includes('/professional/')) {
            return 'professional';
          }
          
          // Dashboard components
          if (id.includes('/dashboard/')) {
            return 'dashboard';
          }
          
          // Performance monitoring
          if (id.includes('web-vitals') || id.includes('performance')) {
            return 'monitoring';
          }
          
          // Remaining node_modules
          if (id.includes('node_modules')) {
            // Group small dependencies together
            const module = id.split('node_modules/')[1].split('/')[0];
            
            // Keep small utilities together
            if (['tslib', 'classnames', 'invariant', 'warning'].includes(module)) {
              return 'vendor-utils';
            }
            
            // Crypto and security libraries
            if (id.includes('crypto')) {
              return 'crypto';
            }
            
            return 'vendor';
          }
        },
        
        // Optimize chunk file names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? 
            chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '') : 
            'chunk';
          
          // Critical chunks get shorter names
          if (chunkInfo.name?.includes('crisis')) {
            return 'c/[name]-[hash:8].js';
          }
          
          return 'assets/js/[name]-[hash:8].js';
        },
        
        entryFileNames: 'assets/js/[name]-[hash:8].js',
        
        // Optimize asset file names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.');
          const ext = info?.[info.length - 1];
          
          // Images
          if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp|avif/i.test(ext || '')) {
            return 'assets/img/[name]-[hash:8][extname]';
          }
          
          // Fonts
          if (/woff2?|eot|ttf|otf/i.test(ext || '')) {
            return 'assets/fonts/[name]-[hash:8][extname]';
          }
          
          // CSS
          if (ext === 'css') {
            return 'assets/css/[name]-[hash:8][extname]';
          }
          
          return 'assets/[name]-[hash:8][extname]';
        }
      },
      
      // Tree-shaking optimizations
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
      }
    },
    
    // Performance settings
    reportCompressedSize: true,
    chunkSizeWarningLimit: 300, // Warn for chunks > 300KB
    sourcemap: false, // Disable sourcemaps in production
    cssCodeSplit: true,
    assetsInlineLimit: 4096, // Inline assets < 4KB
    
    // CSS optimizations
    cssMinify: true,
    
    // Module preload for critical chunks
    modulePreload: {
      polyfill: true
    }
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'zustand'
    ],
    exclude: [
      '@vite/client',
      '@vite/env'
    ],
    esbuildOptions: {
      target: 'es2020',
      define: {
        global: 'globalThis'
      }
    }
  },
  
  // CSS optimizations
  css: {
    devSourcemap: false,
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: '[hash:base64:5]' // Shorter class names in production
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  
  // Performance hints
  preview: {
    port: 4173,
    strictPort: true,
    host: true,
    cors: true
  },
  
  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  }
});