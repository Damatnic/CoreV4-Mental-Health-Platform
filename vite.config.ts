import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production';
  
  return {
  plugins: [
    react({
      // Keep automatic JSX runtime for React 18+ compatibility
      jsxRuntime: 'automatic',
      babel: isProduction ? {
        plugins: [
          ['babel-plugin-react-remove-properties', { properties: ['data-testid'] }]
        ]
      } : undefined
    }),
    splitVendorChunkPlugin(),
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
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console for debugging
        drop_debugger: false,
        pure_funcs: [],
        global_defs: {
          __DEV__: false,
        },
        passes: 1,
        inline: false, // CRITICAL: Prevent inlining
        reduce_vars: false, // CRITICAL: Prevent variable reduction
        hoist_vars: false, // CRITICAL: Prevent hoisting
        join_vars: false, // CRITICAL: Prevent variable joining
        collapse_vars: false, // CRITICAL: Prevent collapsing
        sequences: false, // CRITICAL: Prevent sequence optimization
        dead_code: false, // CRITICAL: Prevent dead code removal that causes issues
        evaluate: false, // CRITICAL: Prevent constant evaluation
        loops: false, // CRITICAL: Prevent loop optimization
        unused: false, // CRITICAL: Prevent unused variable removal
        toplevel: false, // CRITICAL: Prevent top-level optimization
        keep_infinity: true,
        keep_fargs: true
      },
      mangle: {
        safari10: true,
        // Reserve ALL single letters and common variables
        reserved: [
          'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 
          'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
          'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
          'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
          'Error', 'Event', 'Element', 'Export', 'React', 'ReactDOM'
        ],
        keep_fnames: true,
        keep_classnames: true,
        toplevel: false,
        eval: false
      },
      format: {
        comments: false,
        beautify: false
      },
      keep_fnames: true,
      keep_classnames: true,
      safari10: true
    },
    rollupOptions: {
      external: (id) => {
        // Don't externalize scheduler - keep it bundled with React
        return false;
      },
      output: {
        manualChunks: (id) => {
          // Core React dependencies - optimized size
          if (id.includes('react/') && !id.includes('react-dom') && !id.includes('react-router')) {
            return 'react-core';
          }
          if (id.includes('react-dom') || id.includes('scheduler')) {
            return 'react-dom';
          }
          if (id.includes('react-router')) {
            return 'react-router';
          }
          
          // UI Libraries - split by size
          if (id.includes('framer-motion')) {
            return 'framer-motion'; // Large library, separate chunk
          }
          if (id.includes('@radix-ui')) {
            return 'radix-ui';
          }
          
          // Data management - split by usage
          if (id.includes('@tanstack/react-query')) {
            return 'react-query';
          }
          if (id.includes('zustand') || id.includes('immer')) {
            return 'state-management';
          }
          if (id.includes('axios') || id.includes('socket.io')) {
            return 'network';
          }
          
          // Utilities - keep small
          if (id.includes('date-fns') || id.includes('clsx') || id.includes('zod')) {
            return 'utils';
          }
          
          // Charts - separate large visualization library
          if (id.includes('chart.js')) {
            return 'charts-chartjs';
          }
          if (id.includes('recharts')) {
            return 'charts-recharts';
          }
          
          // Crisis components - immediate loading, separate for importance
          if (id.includes('/crisis/') || id.includes('crisis')) {
            return 'crisis';
          }
          
          // Dashboard components - lazy load non-critical
          if (id.includes('/dashboard/') && !id.includes('PersonalDashboard')) {
            return 'dashboard-extended';
          }
          
          // Professional features - lazy load
          if (id.includes('/professional/') || id.includes('ProfessionalCare')) {
            return 'professional';
          }
          
          // Crypto and security - separate sensitive code
          if (id.includes('crypto') || id.includes('security')) {
            return 'security-crypto';
          }
          
          // AI features - lazy load heavy ML features
          if (id.includes('ai') || id.includes('insights') || id.includes('AIInsights')) {
            return 'ai-features';
          }
          
          // Node modules - split by importance
          if (id.includes('node_modules')) {
            // Critical for initial load
            if (id.includes('react') || id.includes('react-dom')) {
              return null; // Include in main bundle
            }
            // Secondary vendors
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
    reportCompressedSize: true,
    chunkSizeWarningLimit: 400, // More aggressive bundle size target
    sourcemap: true, // Enable source maps for debugging lexical declaration errors
    cssCodeSplit: true,
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      'scheduler' // Ensure scheduler is properly bundled
    ],
    exclude: ['@vite/client']
  },
  define: {
    // Ensure proper React 18 compatibility
    __DEV__: isProduction ? 'false' : 'true',
    'process.env.NODE_ENV': JSON.stringify(mode)
  }
}});  // Close both the return object and the defineConfig function