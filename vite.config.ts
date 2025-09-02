import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production';
  
  return {
  plugins: [
    react({
      // Keep automatic JSX runtime for React 18+ compatibility
      jsxRuntime: 'automatic',
      // Fast refresh optimizations
      plugins: [
        // Enable React Fast Refresh optimizations
        ['@swc/plugin-react-refresh', {}],
      ],
      babel: isProduction ? {
        plugins: [
          ['babel-plugin-react-remove-properties', { properties: ['data-testid'] }],
          // Remove development-only code
          ['babel-plugin-transform-remove-console', { exclude: ['error', 'warn'] }],
        ]
      } : undefined
    }),
    splitVendorChunkPlugin(),
    // Bundle analyzer for production builds
    isProduction && visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico', 
        'robots.txt', 
        'apple-touch-icon.png',
        'icons/*.png',
        'fonts/*.woff2'
      ],
      manifest: false, // Using separate manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        cleanupOutdatedCaches: true,
        sourcemap: false, // Disable sourcemap for production
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/(api|admin)\//],
        runtimeCaching: [
          // API calls - Network First
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Images - Cache First
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          // Fonts - Cache First
          {
            urlPattern: /\.(?:woff|woff2|ttf|otf)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          // Crisis resources - Stale While Revalidate
          {
            urlPattern: /\/crisis\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'crisis-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
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
    }
  },
  worker: {
    format: 'es',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/workers/[name]-[hash].js'
      }
    }
  },
  build: {
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    minify: isProduction ? 'terser' : false,
    terserOptions: isProduction ? {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        global_defs: {
          __DEV__: false,
        },
        passes: 2, // Increase passes for better optimization
        // Enable safe optimizations for production
        inline: 3,
        reduce_vars: true,
        hoist_vars: true,
        join_vars: true,
        collapse_vars: true,
        sequences: true,
        dead_code: true,
        evaluate: true,
        loops: true,
        unused: true,
        toplevel: true,
        keep_infinity: true,
        keep_fargs: false, // Allow argument name mangling
        // Performance optimizations
        arrows: true,
        booleans_as_integers: true,
        drop_console: true,
        ecma: 2020,
        module: true,
        passes: 3,
        unsafe_arrows: true,
        unsafe_comps: true,
        unsafe_math: true,
        unsafe_methods: true,
        unsafe_proto: true,
      },
      mangle: {
        safari10: true,
        // Only reserve critical identifiers
        reserved: ['React', 'ReactDOM'],
        keep_fnames: false, // Allow function name mangling for smaller bundles
        keep_classnames: false, // Allow class name mangling
        toplevel: true,
        eval: false,
        module: true,
      },
      format: {
        comments: false,
        beautify: false,
        ecma: 2020,
      },
      safari10: true,
      module: true,
    } : undefined,
    rollupOptions: {
      external: (id) => {
        // Don't externalize scheduler - keep it bundled with React
        return false;
      },
      output: {
        manualChunks: (id) => {
          // Enhanced chunking strategy for optimal loading performance
          
          // Critical React ecosystem - keep together for optimal loading
          if (id.includes('react/') || id.includes('react-dom/') || id.includes('scheduler/')) {
            return 'react-core';
          }
          
          // Router and navigation - separate for route-based loading
          if (id.includes('react-router') || id.includes('@remix-run')) {
            return 'router';
          }
          
          // Console system - critical for UX, separate for caching
          if (id.includes('/console/') || id.includes('console') || id.includes('sound')) {
            return 'console-system';
          }
          
          // Crisis components - highest priority, separate chunk for instant loading
          if (id.includes('/crisis/') || id.includes('crisis') || id.includes('emergency')) {
            return 'crisis-core';
          }
          
          // Performance and monitoring - separate to avoid bloating main bundle
          if (id.includes('performance') || id.includes('monitor') || id.includes('web-vitals')) {
            return 'performance';
          }
          
          // UI framework components - group by library
          if (id.includes('@radix-ui') || id.includes('radix')) {
            return 'ui-radix';
          }
          if (id.includes('framer-motion')) {
            return 'animations'; // Separate animations for performance
          }
          if (id.includes('lucide-react') || id.includes('heroicons')) {
            return 'icons';
          }
          
          // Data management and state
          if (id.includes('@tanstack/react-query') || id.includes('swr')) {
            return 'data-fetching';
          }
          if (id.includes('zustand') || id.includes('jotai') || id.includes('valtio')) {
            return 'state-management';
          }
          if (id.includes('immer') || id.includes('immutable')) {
            return 'immutable';
          }
          
          // Network and communication
          if (id.includes('axios') || id.includes('fetch') || id.includes('ky')) {
            return 'http-client';
          }
          if (id.includes('socket.io') || id.includes('ws') || id.includes('pusher')) {
            return 'websocket';
          }
          
          // Charts and data visualization - heavy libraries
          if (id.includes('chart.js') || id.includes('chartjs')) {
            return 'charts-chartjs';
          }
          if (id.includes('recharts') || id.includes('victory') || id.includes('nivo')) {
            return 'charts-react';
          }
          if (id.includes('d3') && !id.includes('d3-')) {
            return 'd3-core';
          }
          if (id.includes('d3-')) {
            return 'd3-modules';
          }
          
          // Form handling
          if (id.includes('react-hook-form') || id.includes('formik') || id.includes('@hookform')) {
            return 'forms';
          }
          
          // Validation libraries
          if (id.includes('zod') || id.includes('yup') || id.includes('joi')) {
            return 'validation';
          }
          
          // Utilities and helpers
          if (id.includes('date-fns') || id.includes('dayjs') || id.includes('moment')) {
            return 'date-utils';
          }
          if (id.includes('lodash') || id.includes('ramda') || id.includes('underscore')) {
            return 'functional-utils';
          }
          if (id.includes('clsx') || id.includes('classnames') || id.includes('cn')) {
            return 'css-utils';
          }
          
          // Crypto and security - sensitive code isolation
          if (id.includes('crypto') || id.includes('bcrypt') || id.includes('jwt')) {
            return 'security';
          }
          
          // Testing utilities (should not be in production but just in case)
          if (id.includes('test') || id.includes('jest') || id.includes('vitest')) {
            return 'testing';
          }
          
          // Page-specific chunks for route-based code splitting
          if (id.includes('/pages/Wellness') || id.includes('wellness')) {
            return 'page-wellness';
          }
          if (id.includes('/pages/Community') || id.includes('community')) {
            return 'page-community';
          }
          if (id.includes('/pages/Professional') || id.includes('professional')) {
            return 'page-professional';
          }
          
          // Large vendor libraries - separate for caching
          if (id.includes('node_modules')) {
            // Group by size and usage patterns
            if (id.includes('react') && !id.includes('react-dom') && !id.includes('react-router')) {
              return 'react-ecosystem';
            }
            
            // Large libraries that benefit from separate caching
            const largeLibraries = ['lodash', 'moment', 'react-big-calendar', 'pdf', 'monaco'];
            for (const lib of largeLibraries) {
              if (id.includes(lib)) {
                return `vendor-${lib}`;
              }
            }
            
            // Everything else goes to general vendor chunk
            return 'vendor';
          }
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/js/${chunkInfo.name}-[hash].js`;
        },
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.');
          const ext = info?.[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff|woff2|eot|ttf|otf/i.test(ext || '')) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },
    reportCompressedSize: isProduction,
    chunkSizeWarningLimit: isProduction ? 500 : 1000, // Adjust warning limits
    sourcemap: isProduction ? 'hidden' : true, // Hidden sourcemaps in production
    cssCodeSplit: true,
    assetsInlineLimit: 8192, // Increased to 8KB for better performance
    
    // Enhanced performance optimizations
    modulePreload: {
      polyfill: false // Modern browsers only
    },
    
    // Optimize for modern browsers
    minify: isProduction ? 'terser' : false,
    
    // Aggressive compression in production
    ...(isProduction && {
      rollupOptions: {
        treeshake: {
          preset: 'recommended',
          moduleSideEffects: false,
        },
      },
    }),
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-dom/client',
      'react-router-dom',
      'scheduler',
      // Pre-bundle commonly used dependencies for faster dev startup
      '@tanstack/react-query',
      'zustand',
      'framer-motion',
      'date-fns',
      'clsx',
    ],
    exclude: [
      '@vite/client',
      // Exclude large dependencies that are better lazy-loaded
      'chart.js',
      'recharts'
    ],
    // Force optimization of problematic dependencies
    force: true,
    esbuildOptions: {
      target: 'es2020',
      supported: {
        bigint: true,
        'top-level-await': true,
      },
    },
  },
  define: {
    // Ensure proper React 18 compatibility and performance flags
    __DEV__: isProduction ? 'false' : 'true',
    'process.env.NODE_ENV': JSON.stringify(mode),
    // Feature flags for optimization
    __PERFORMANCE_MODE__: isProduction ? 'true' : 'false',
    __CONSOLE_SOUNDS__: 'true',
    __BUNDLE_ANALYZER__: isProduction ? 'false' : 'true',
    // Browser compatibility flags
    __MODERN_BROWSER__: 'true',
  },
  
  // Enhanced CSS processing
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
    preprocessorOptions: {
      css: {
        // Optimize CSS imports
        charset: false,
      },
    },
    // Inline CSS imports smaller than this threshold
    assetsInclude: ['**/*.css?inline'],
  },
  
  // Enhanced experimental features
  experimental: {
    // Enable build optimizations
    renderBuiltUrl(filename: string) {
      // Optimize asset URLs for CDN distribution
      return `/${filename}`;
    },
  },
  
  // Worker optimization
  worker: {
    format: 'es',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/workers/[name]-[hash].js',
        format: 'es',
      },
    },
  },
}});  // Close both the return object and the defineConfig function