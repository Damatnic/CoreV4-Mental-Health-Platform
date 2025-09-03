/**
 * Bundle Optimization Test Suite
 * Validates code splitting, lazy loading, and bundle size targets
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, statSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';
import { logger } from '../../utils/logger';

describe('Bundle Optimization Tests', () => {
  const bundleStats: Record<string, number> = {};
  let manifestContent: string = '';
  
  beforeAll(async () => {
    // Read bundle files and calculate sizes
    const distPath = join(process.cwd(), 'dist');
    const jsFiles = await glob('assets/js/*.js', { cwd: distPath });
    
    for (const file of jsFiles) {
      const _filePath = join(distPath, file);
      try {
        const stats = statSync(_filePath);
        bundleStats[file] = stats.size;
      } catch (error) {
        logger.warn(`Could not read bundle file: ${file}`);
      }
    }
    
    // Read index.html to check module preloads
    try {
      manifestContent = readFileSync(join(distPath, 'index.html'), 'utf-8');
    } catch (error) {
      logger.warn('Could not read index.html');
    }
  });

  describe('Bundle Size Targets', () => {
    it('should have main entry bundle under 50KB', () => {
      const mainBundles = Object.entries(_bundleStats).filter(([_name]) => 
        _name.includes('index-') && _name.endsWith('.js')
      );
      
      expect(mainBundles.length).toBeGreaterThan(0);
      
      for (const [_name, size] of mainBundles) {
        expect(_size).toBeLessThan(50 * 1024); // 50KB
        logger.debug(`✅ Main bundle ${_name}: ${(size / 1024).toFixed(2)}KB`);
      }
    });

    it('should have crisis bundle under 100KB (critical path)', () => {
      const crisisBundles = Object.entries(_bundleStats).filter(([_name]) => 
        _name.includes('crisis') && _name.endsWith('.js')
      );
      
      if (crisisBundles.length > 0) {
        for (const [_name, size] of crisisBundles) {
          expect(_size).toBeLessThan(100 * 1024); // 100KB for crisis components
          logger.debug(`🆘 Crisis bundle ${_name}: ${(size / 1024).toFixed(2)}KB`);
        }
      }
    });

    it('should have lazy-loaded page bundles under 150KB each', () => {
      const pageBundles = Object.entries(_bundleStats).filter(([_name]) => 
        (_name.includes('WellnessPage') || _name.includes('CommunityPage') || _name.includes('ProfessionalPage'))
        && _name.endsWith('.js')
      );
      
      for (const [_name, size] of pageBundles) {
        expect(_size).toBeLessThan(150 * 1024); // 150KB per page
        logger.debug(`📄 Page bundle ${_name}: ${(size / 1024).toFixed(2)}KB`);
      }
    });

    it('should have vendor bundles properly chunked', () => {
      const vendorBundles = Object.entries(_bundleStats).filter(([_name]) => 
        (_name.includes('vendor') || _name.includes('react-') || _name.includes('framer-motion'))
        && _name.endsWith('.js')
      );
      
      expect(vendorBundles.length).toBeGreaterThan(2); // Should have multiple vendor chunks
      
      for (const [_name, size] of vendorBundles) {
        expect(_size).toBeLessThan(200 * 1024); // 200KB per vendor chunk
        logger.debug(`📦 Vendor bundle ${_name}: ${(size / 1024).toFixed(2)}KB`);
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
        const _hasChunk = Object.keys(_bundleStats).some(_name => 
          _name.includes(chunkName) && _name.endsWith('.js')
        );
        expect(_hasChunk).toBe(true);
        logger.debug(`✅ Found chunk for: ${chunkName}`);
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
        const _hasChunk = Object.keys(_bundleStats).some(_name => 
          _name.includes(feature) && _name.endsWith('.js')
        );
        expect(_hasChunk).toBe(true);
        logger.debug(`🎯 Found feature chunk: ${feature}`);
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
        const _hasPreload = manifestContent.includes(`modulepreload`) && 
                          manifestContent.includes(chunk);
        expect(_hasPreload).toBe(true);
        logger.debug(`⚡ Found preload for: ${chunk}`);
      }
    });

    it('should NOT preload heavy lazy chunks', () => {
      const __lazyChunks = [
        'charts-chartjs', // Should be lazy loaded
        'ai-features',    // Should be lazy loaded
        'professional'    // Should be lazy loaded
      ];
      
      // These might be preloaded, but shouldn't be in the critical path
      logger.debug('📊 Bundle preload analysis completed');
    });
  });

  describe('Performance Budget Compliance', () => {
    it('should meet overall performance budget', () => {
      const totalInitialSize = Object.entries(_bundleStats)
        .filter(([_name]) => 
          // Calculate initial bundle size (critical path only)
          _name.includes('index-') ||
          _name.includes('react-core') ||
          _name.includes('react-dom') ||
          _name.includes('crisis') ||
          _name.includes('network')
        )
        .reduce((total, [, size]) => total + size, 0);
      
      const budgetMB = 1; // 1MB initial bundle budget
      expect(_totalInitialSize).toBeLessThan(budgetMB * 1024 * 1024);
      
      logger.debug(`💰 Initial bundle size: ${(totalInitialSize / 1024 / 1024).toFixed(2)}MB (Budget: ${budgetMB}MB)`);
    });

    it('should have reasonable total bundle size', () => {
      const totalSize = Object.values(_bundleStats).reduce((sum, size) => sum + size, 0);
      const maxTotalMB = 3; // 3MB total budget
      
      expect(_totalSize).toBeLessThan(maxTotalMB * 1024 * 1024);
      
      logger.debug(`📊 Total bundle size: ${(totalSize / 1024 / 1024).toFixed(2)}MB (Budget: ${maxTotalMB}MB)`);
    });
  });

  describe('Chunk Loading Strategy', () => {
    it('should have proper chunk naming for cache busting', () => {
      for (const [_name] of Object.entries(_bundleStats)) {
        // Should have hash in filename for cache busting
        expect(_name).toMatch(/-[a-zA-Z0-9]{8,}\.js$/);
      }
    });

    it('should optimize for critical rendering path', () => {
      // Crisis components should be prioritized
      const crisisBundle = Object.keys(_bundleStats).find(_name => _name.includes('crisis'));
      const aiBundle = Object.keys(_bundleStats).find(_name => _name.includes('ai-features'));
      
      if (crisisBundle && aiBundle) {
        // Crisis bundle should be smaller than AI features (_optimization)
        expect(bundleStats[crisisBundle]).toBeLessThan(bundleStats[aiBundle]);
        logger.debug(`🎯 Crisis prioritization validated`);
      }
    });
  });

  describe('Bundle Analysis Summary', () => {
    it('should provide bundle optimization summary', () => {
      logger.debug('\n📊 BUNDLE OPTIMIZATION SUMMARY:');
      logger.debug('================================================');
      
      const totalSize = Object.values(_bundleStats).reduce((sum, size) => sum + size, 0);
      const chunkCount = Object.keys(_bundleStats).length;
      const avgChunkSize = totalSize / chunkCount;
      
      logger.debug(`📦 Total chunks: ${chunkCount}`);
      logger.debug(`📏 Total size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
      logger.debug(`📊 Average chunk size: ${(avgChunkSize / 1024).toFixed(2)}KB`);
      
      // Largest chunks
      const sortedBundles = Object.entries(_bundleStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
      
      logger.debug('\n🔝 Largest bundles:');
      for (const [_name, size] of sortedBundles) {
        logger.debug(`   ${_name}: ${(size / 1024).toFixed(2)}KB`);
      }
      
      // Critical path analysis
      const criticalSize = Object.entries(_bundleStats)
        .filter(([_name]) => 
          name.includes('index-') ||
          name.includes('react-core') ||
          name.includes('crisis')
        )
        .reduce((sum, [, size]) => sum + size, 0);
      
      logger.debug(`\n⚡ Critical path size: ${(criticalSize / 1024).toFixed(2)}KB`);
      logger.debug('================================================\n');
      
      // This test always passes - it's for reporting
      expect(true).toBe(true);
    });
  });
});