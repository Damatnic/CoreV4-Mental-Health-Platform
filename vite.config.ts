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
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        global_defs: {
          __DEV__: false, // Explicitly define dev as false in production
        },
        passes: 1, // Reduce passes to prevent over-optimization
        inline: false, // Prevent aggressive inlining that can cause lexical errors
        reduce_vars: false, // Prevent variable reduction issues
        hoist_vars: false, // Prevent variable hoisting issues
        join_vars: false, // Prevent variable joining that can cause temporal dead zones
        collapse_vars: false // Prevent variable collapsing issues
      },
      mangle: {
        safari10: true,
        reserved: ['d'], // Prevent mangling of common problematic variables
        keep_fnames: true, // Keep function names for debugging
        toplevel: false // Prevent top-level mangling issues
      },
      format: {
        comments: false
      },
      keep_fnames: true, // Preserve function names
      keep_classnames: true // Preserve class names
    },
    rollupOptions: {
      external: (id) => {
        // Don't externalize scheduler - keep it bundled with React
        return false;
      },
      output: {
        manualChunks: (id) => {
          // Core React dependencies - keep scheduler with React
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router') || id.includes('scheduler')) {
            return 'react-core';
          }
          
          // UI Libraries
          if (id.includes('framer-motion') || id.includes('@radix-ui')) {
            return 'ui-libs';
          }
          
          // Data management
          if (id.includes('@tanstack') || id.includes('zustand') || id.includes('axios') || id.includes('socket.io')) {
            return 'data-libs';
          }
          
          // Utilities
          if (id.includes('date-fns') || id.includes('clsx') || id.includes('zod') || id.includes('immer')) {
            return 'utils';
          }
          
          // Charts and visualization
          if (id.includes('chart') || id.includes('recharts')) {
            return 'charts';
          }
          
          // Crisis components - load immediately
          if (id.includes('/crisis/')) {
            return 'crisis';
          }
          
          // Node modules default chunk
          if (id.includes('node_modules')) {
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
    chunkSizeWarningLimit: 500,
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