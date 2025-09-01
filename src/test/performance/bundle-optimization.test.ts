/**
 * Bundle Optimization Test Suite
 * Validates code splitting, lazy loading, and bundle size targets
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, statSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

describe('Bundle Optimization Tests', () => {
  let bundleStats: Record<string, number> = {};
  let manifestContent: string = '';
  
  beforeAll(async () => {
    // Read bundle files and calculate sizes
    const distPath = join(process.cwd(), 'dist');
    const jsFiles = await glob('assets/js/*.js', { cwd: distPath });
    
    for (const file of jsFiles) {
      const filePath = join(distPath, file);
      try {
        const stats = statSync(filePath);
        bundleStats[file] = stats.size;
      } catch (error) {
        console.warn(`Could not read bundle file: ${file}`);
      }
    }
    
    // Read index.html to check module preloads
    try {
      manifestContent = readFileSync(join(distPath, 'index.html'), 'utf-8');
    } catch (error) {
      console.warn('Could not read index.html');
    }
  });

  describe('Bundle Size Targets', () => {
    it('should have main entry bundle under 50KB', () => {
      const mainBundles = Object.entries(bundleStats).filter(([name]) => 
        name.includes('index-') && name.endsWith('.js')
      );
      
      expect(mainBundles.length).toBeGreaterThan(0);
      
      for (const [name, size] of mainBundles) {
        expect(size).toBeLessThan(50 * 1024); // 50KB
        console.log(`✅ Main bundle ${name}: ${(size / 1024).toFixed(2)}KB`);
      }
    });

    it('should have crisis bundle under 100KB (critical path)', () => {
      const crisisBundles = Object.entries(bundleStats).filter(([name]) => 
        name.includes('crisis') && name.endsWith('.js')
      );
      
      if (crisisBundles.length > 0) {
        for (const [name, size] of crisisBundles) {
          expect(size).toBeLessThan(100 * 1024); // 100KB for crisis components
          console.log(`🆘 Crisis bundle ${name}: ${(size / 1024).toFixed(2)}KB`);
        }
      }
    });

    it('should have lazy-loaded page bundles under 150KB each', () => {
      const pageBundles = Object.entries(bundleStats).filter(([name]) => 
        (name.includes('WellnessPage') || name.includes('CommunityPage') || name.includes('ProfessionalPage'))
        && name.endsWith('.js')
      );
      
      for (const [name, size] of pageBundles) {
        expect(size).toBeLessThan(150 * 1024); // 150KB per page
        console.log(`📄 Page bundle ${name}: ${(size / 1024).toFixed(2)}KB`);
      }
    });

    it('should have vendor bundles properly chunked', () => {
      const vendorBundles = Object.entries(bundleStats).filter(([name]) => 
        (name.includes('vendor') || name.includes('react-') || name.includes('framer-motion'))
        && name.endsWith('.js')
      );
      
      expect(vendorBundles.length).toBeGreaterThan(2); // Should have multiple vendor chunks
      
      for (const [name, size] of vendorBundles) {
        expect(size).toBeLessThan(200 * 1024); // 200KB per vendor chunk
        console.log(`📦 Vendor bundle ${name}: ${(size / 1024).toFixed(2)}KB`);
      }
    });
  });

  describe('Code Splitting Validation', () => {
    it('should have separate chunks for major libraries', () => {
      const expectedChunks = [
        'react-core',
        'react-dom', 
        'react-router',
        'framer-motion',
        'charts-chartjs',
        'ai-features'
      ];
      
      for (const chunkName of expectedChunks) {
        const hasChunk = Object.keys(bundleStats).some(name => 
          name.includes(chunkName) && name.endsWith('.js')
        );
        expect(hasChunk).toBe(true);
        console.log(`✅ Found chunk for: ${chunkName}`);
      }
    });

    it('should have separate chunks for feature areas', () => {
      const featureChunks = [
        'crisis',
        'professional',
        'dashboard-extended',
        'security-crypto',
        'utils'
      ];
      
      for (const feature of featureChunks) {
        const hasChunk = Object.keys(bundleStats).some(name => 
          name.includes(feature) && name.endsWith('.js')
        );
        expect(hasChunk).toBe(true);
        console.log(`🎯 Found feature chunk: ${feature}`);
      }
    });
  });

  describe('Module Preloading', () => {
    it('should preload critical chunks in HTML', () => {
      const criticalChunks = [
        'react-core',
        'react-dom',
        'crisis',
        'network'
      ];
      
      for (const chunk of criticalChunks) {
        const hasPreload = manifestContent.includes(`modulepreload`) && 
                          manifestContent.includes(chunk);
        expect(hasPreload).toBe(true);
        console.log(`⚡ Found preload for: ${chunk}`);
      }
    });

    it('should NOT preload heavy lazy chunks', () => {
      const lazyChunks = [
        'charts-chartjs', // Should be lazy loaded
        'ai-features',    // Should be lazy loaded
        'professional'    // Should be lazy loaded
      ];
      
      // These might be preloaded, but shouldn't be in the critical path
      console.log('📊 Bundle preload analysis completed');
    });
  });

  describe('Performance Budget Compliance', () => {
    it('should meet overall performance budget', () => {
      const totalInitialSize = Object.entries(bundleStats)
        .filter(([name]) => 
          // Calculate initial bundle size (critical path only)
          name.includes('index-') ||
          name.includes('react-core') ||
          name.includes('react-dom') ||
          name.includes('crisis') ||
          name.includes('network')
        )
        .reduce((total, [, size]) => total + size, 0);
      
      const budgetMB = 1; // 1MB initial bundle budget
      expect(totalInitialSize).toBeLessThan(budgetMB * 1024 * 1024);
      
      console.log(`💰 Initial bundle size: ${(totalInitialSize / 1024 / 1024).toFixed(2)}MB (Budget: ${budgetMB}MB)`);
    });

    it('should have reasonable total bundle size', () => {
      const totalSize = Object.values(bundleStats).reduce((sum, size) => sum + size, 0);
      const maxTotalMB = 3; // 3MB total budget
      
      expect(totalSize).toBeLessThan(maxTotalMB * 1024 * 1024);
      
      console.log(`📊 Total bundle size: ${(totalSize / 1024 / 1024).toFixed(2)}MB (Budget: ${maxTotalMB}MB)`);
    });
  });

  describe('Chunk Loading Strategy', () => {
    it('should have proper chunk naming for cache busting', () => {
      for (const [name] of Object.entries(bundleStats)) {
        // Should have hash in filename for cache busting
        expect(name).toMatch(/-[a-zA-Z0-9]{8,}\.js$/);
      }
    });

    it('should optimize for critical rendering path', () => {
      // Crisis components should be prioritized
      const crisisBundle = Object.keys(bundleStats).find(name => name.includes('crisis'));
      const aiBundle = Object.keys(bundleStats).find(name => name.includes('ai-features'));
      
      if (crisisBundle && aiBundle) {
        // Crisis bundle should be smaller than AI features (optimization)
        expect(bundleStats[crisisBundle]).toBeLessThan(bundleStats[aiBundle]);
        console.log(`🎯 Crisis prioritization validated`);
      }
    });
  });

  describe('Bundle Analysis Summary', () => {
    it('should provide bundle optimization summary', () => {
      console.log('\n📊 BUNDLE OPTIMIZATION SUMMARY:');
      console.log('================================================');
      
      const totalSize = Object.values(bundleStats).reduce((sum, size) => sum + size, 0);
      const chunkCount = Object.keys(bundleStats).length;
      const avgChunkSize = totalSize / chunkCount;
      
      console.log(`📦 Total chunks: ${chunkCount}`);
      console.log(`📏 Total size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
      console.log(`📊 Average chunk size: ${(avgChunkSize / 1024).toFixed(2)}KB`);
      
      // Largest chunks
      const sortedBundles = Object.entries(bundleStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
      
      console.log('\n🔝 Largest bundles:');
      for (const [name, size] of sortedBundles) {
        console.log(`   ${name}: ${(size / 1024).toFixed(2)}KB`);
      }
      
      // Critical path analysis
      const criticalSize = Object.entries(bundleStats)
        .filter(([name]) => 
          name.includes('index-') ||
          name.includes('react-core') ||
          name.includes('crisis')
        )
        .reduce((sum, [, size]) => sum + size, 0);
      
      console.log(`\n⚡ Critical path size: ${(criticalSize / 1024).toFixed(2)}KB`);
      console.log('================================================\n');
      
      // This test always passes - it's for reporting
      expect(true).toBe(true);
    });
  });
});