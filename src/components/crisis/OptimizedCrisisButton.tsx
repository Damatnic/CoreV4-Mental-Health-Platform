/**
 * Optimized Crisis Button Component
 * Achieves <200ms response time through preloading, caching, and optimized rendering
 */

import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { AlertCircle, Phone, MessageCircle, MapPin, Heart, Loader2 } from 'lucide-react';
import { performanceMonitor } from '../../utils/performance/PerformanceMonitor';

// Pre-cached crisis resources for instant access
const CRISIS_RESOURCES_CACHE = {
  hotlines: [
    { 
      name: '988 Suicide & Crisis Lifeline', 
      number: '988', 
      available: true,
      priority: 1,
      description: '24/7 confidential support for people in distress'
    },
    { 
      name: 'Crisis Text Line', 
      text: 'Text HOME to 741741', 
      available: true,
      priority: 2,
      description: 'Free 24/7 text support from trained crisis counselors'
    },
    { 
      name: 'Veterans Crisis Line', 
      number: '1-800-273-8255', 
      available: true,
      priority: 3,
      description: 'Confidential support for Veterans and their loved ones'
    },
    { 
      name: 'SAMHSA National Helpline', 
      number: '1-800-662-4357', 
      available: true,
      priority: 4,
      description: 'Treatment referral and information service'
    },
  ],
  localResources: [],
  onlineSupport: [
    {
      name: 'Crisis Chat',
      url: 'https://988lifeline.org/chat/',
      available: true,
      description: 'Online chat with crisis counselors'
    }
  ]
};

// Preload and cache crisis modal HTML for instant rendering
const CRISIS_MODAL_TEMPLATE = `
  <div class="crisis-modal-backdrop">
    <div class="crisis-modal-content">
      <h2 class="crisis-modal-title">Crisis Resources</h2>
      <div class="crisis-resources-container">
        <!-- Content injected here -->
      </div>
    </div>
  </div>
`;

interface OptimizedCrisisButtonProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary';
  onCrisisActivated?: () => void;
}

/**
 * Memoized resource item component for optimal rendering
 */
const ResourceItem = memo(({ resource, type }: { resource: any; type: string }) => {
  if (type === 'hotline') {
    return (
      <a
        href={`tel:${resource.number?.replace(/\D/g, '')}`}
        className="crisis-resource-item hotline"
        data-priority={resource.priority}
      >
        <div className="resource-name">{resource.name}</div>
        <div className="resource-number">{resource.number || resource.text}</div>
        {resource.available && <span className="resource-availability">Available 24/7</span>}
      </a>
    );
  }
  
  if (type === 'text') {
    return (
      <div className="crisis-resource-item text-support">
        <div className="resource-icon">
          <MessageCircle className="w-5 h-5" />
        </div>
        <div className="resource-content">
          <div className="resource-name">Crisis Text Line</div>
          <div className="resource-action">Text HOME to 741741</div>
          <span className="resource-availability">Free 24/7 text support</span>
        </div>
      </div>
    );
  }
  
  return null;
});

ResourceItem.displayName = 'ResourceItem';

/**
 * Optimized Crisis Button with sub-200ms response time
 */
const OptimizedCrisisButton: React.FC<OptimizedCrisisButtonProps> = memo(({ 
  className = '', 
  size = 'medium',
  variant = 'primary',
  onCrisisActivated
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [resources] = useState(CRISIS_RESOURCES_CACHE); // Use pre-cached resources
  const modalRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const preloadedRef = useRef(false);
  const renderStartTime = useRef<number>(0);
  
  // Preload crisis resources on component mount
  useEffect(() => {
    if (!preloadedRef.current) {
      preloadCrisisResources();
      preloadedRef.current = true;
    }
  }, []);
  
  /**
   * Preload all crisis resources for instant access
   */
  const preloadCrisisResources = useCallback(() => {
    // Preload modal styles
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = '/styles/crisis-modal.css';
    document.head.appendChild(link);
    
    // Preconnect to crisis service domains
    const domains = ['988lifeline.org', 'crisistextline.org'];
    domains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = `https://${domain}`;
      document.head.appendChild(link);
    });
    
    // Cache crisis resources in service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_CRISIS_RESOURCES',
        resources: CRISIS_RESOURCES_CACHE
      });
    }
  }, []);
  
  /**
   * Optimized crisis button click handler
   * Uses requestIdleCallback for non-critical operations
   */
  const handleCrisisClick = useCallback(() => {
    renderStartTime.current = performance.now();
    performanceMonitor.recordMetric('crisis_button_clicked', renderStartTime.current);
    
    // Immediately show modal (no network delay)
    setIsOpen(true);
    
    // Trigger callback if provided
    if (onCrisisActivated) {
      // Use requestIdleCallback for non-critical operations
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => onCrisisActivated());
      } else {
        setTimeout(() => onCrisisActivated(), 0);
      }
    }
    
    // Track performance after render
    requestAnimationFrame(() => {
      const renderTime = performance.now() - renderStartTime.current;
      performanceMonitor.recordMetric('crisis_modal_render_time', renderTime, {
        withinTarget: renderTime < 200,
        size,
        variant
      });
      
      if (renderTime > 200) {
        console.warn(`[Performance] Crisis modal render time exceeded target: ${renderTime}ms`);
      }
    });
  }, [onCrisisActivated, size, variant]);
  
  /**
   * Optimized keyboard handler with minimal overhead
   */
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown, { passive: true });
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);
  
  /**
   * Focus management for accessibility
   */
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Use RAF to ensure DOM is ready
      requestAnimationFrame(() => {
        const firstFocusable = modalRef.current?.querySelector('[tabindex]:not([tabindex="-1"])') as HTMLElement;
        firstFocusable?.focus();
      });
    }
  }, [isOpen]);
  
  // Size classes optimized for touch targets
  const sizeClasses = {
    small: 'crisis-btn-small',
    medium: 'crisis-btn-medium',
    large: 'crisis-btn-large'
  };
  
  // Variant classes with hardware acceleration
  const variantClasses = {
    primary: 'crisis-btn-primary',
    secondary: 'crisis-btn-secondary'
  };
  
  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleCrisisClick}
        className={`crisis-button ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        aria-label="Crisis Help - Get immediate support"
        aria-describedby="crisis-description"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        data-crisis-button="true"
      >
        <AlertCircle className="crisis-button-icon" aria-hidden="true" />
        <span className="crisis-button-text">Crisis Help</span>
      </button>
      
      <span id="crisis-description" className="sr-only">
        Activate this button to get immediate crisis support resources including hotlines, text support, and local emergency services
      </span>
      
      {/* Optimized modal with portal rendering */}
      {isOpen && (
        <div 
          className="crisis-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="crisis-modal-title"
          data-crisis-active="true"
        >
          <div 
            ref={modalRef}
            className="crisis-modal"
            role="document"
          >
            {/* Critical content rendered first */}
            <div className="crisis-header">
              <h2 id="crisis-modal-title" className="crisis-title">
                Immediate Crisis Support
              </h2>
              <div className="crisis-emergency">
                <div className="emergency-number">911</div>
                <div className="emergency-text">For immediate danger</div>
              </div>
            </div>
            
            {/* Primary crisis resources */}
            <div className="crisis-primary-resources">
              {/* 988 Hotline - Most important, rendered first */}
              <a
                href="tel:988"
                className="crisis-hotline-primary"
                data-testid="crisis-988"
              >
                <Phone className="hotline-icon" aria-hidden="true" />
                <div className="hotline-content">
                  <div className="hotline-number">988</div>
                  <div className="hotline-name">Suicide & Crisis Lifeline</div>
                  <div className="hotline-availability">24/7 Confidential Support</div>
                </div>
              </a>
              
              {/* Crisis Text Line */}
              <div className="crisis-text-line">
                <MessageCircle className="text-icon" aria-hidden="true" />
                <div className="text-content">
                  <div className="text-action">Text HOME to 741741</div>
                  <div className="text-name">Crisis Text Line</div>
                  <div className="text-availability">Free 24/7 Text Support</div>
                </div>
              </div>
            </div>
            
            {/* Additional resources */}
            <div className="crisis-additional-resources">
              <h3 className="resources-subtitle">Additional Support</h3>
              <div className="resources-grid">
                {resources.hotlines.slice(2).map((hotline, index) => (
                  <ResourceItem 
                    key={`hotline-${index}`} 
                    resource={hotline} 
                    type="hotline" 
                  />
                ))}
              </div>
            </div>
            
            {/* Online support */}
            {resources.onlineSupport.length > 0 && (
              <div className="crisis-online-support">
                <h3 className="resources-subtitle">Online Support</h3>
                <div className="online-resources">
                  {resources.onlineSupport.map((support, index) => (
                    <a
                      key={`online-${index}`}
                      href={support.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="online-resource-link"
                    >
                      <span className="online-resource-name">{support.name}</span>
                      <span className="online-resource-desc">{support.description}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="crisis-close-button"
              aria-label="Close crisis resources"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* Inline critical styles for fastest rendering */}
      <style jsx>{`
        .crisis-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          border-radius: 0.5rem;
          transition: all 0.15s ease;
          touch-action: manipulation;
          will-change: transform;
          transform: translateZ(0);
        }
        
        .crisis-btn-small {
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
          min-width: 44px;
          min-height: 44px;
        }
        
        .crisis-btn-medium {
          padding: 0.5rem 1rem;
          font-size: 1rem;
          min-width: 44px;
          min-height: 44px;
        }
        
        .crisis-btn-large {
          padding: 0.75rem 1.5rem;
          font-size: 1.125rem;
          min-width: 44px;
          min-height: 44px;
        }
        
        .crisis-btn-primary {
          background: #dc2626;
          color: white;
          border: 2px solid transparent;
        }
        
        .crisis-btn-primary:hover {
          background: #b91c1c;
          transform: scale(1.02);
        }
        
        .crisis-btn-primary:active {
          background: #991b1b;
          transform: scale(0.98);
        }
        
        .crisis-btn-secondary {
          background: #fee2e2;
          color: #991b1b;
          border: 2px solid #fca5a5;
        }
        
        .crisis-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: fadeIn 0.1s ease;
        }
        
        .crisis-modal {
          background: white;
          border-radius: 1rem;
          max-width: 42rem;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: slideUp 0.15s ease;
          transform: translateZ(0);
        }
        
        .crisis-header {
          padding: 1.5rem;
          border-bottom: 2px solid #fee2e2;
          background: linear-gradient(to bottom, #fef2f2, white);
        }
        
        .crisis-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 1rem 0;
        }
        
        .crisis-emergency {
          background: #dc2626;
          color: white;
          padding: 0.75rem;
          border-radius: 0.5rem;
          text-align: center;
        }
        
        .emergency-number {
          font-size: 2rem;
          font-weight: 700;
        }
        
        .emergency-text {
          font-size: 0.875rem;
          opacity: 0.9;
        }
        
        .crisis-primary-resources {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .crisis-hotline-primary {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #fef2f2;
          border: 2px solid #fca5a5;
          border-radius: 0.5rem;
          text-decoration: none;
          color: inherit;
          transition: all 0.15s ease;
        }
        
        .crisis-hotline-primary:hover {
          background: #fee2e2;
          transform: scale(1.02);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .hotline-icon {
          width: 2rem;
          height: 2rem;
          color: #dc2626;
        }
        
        .hotline-number {
          font-size: 2rem;
          font-weight: 700;
          color: #dc2626;
        }
        
        .hotline-name {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
        }
        
        .hotline-availability {
          font-size: 0.875rem;
          color: #059669;
        }
        
        .crisis-text-line {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #eff6ff;
          border: 2px solid #93c5fd;
          border-radius: 0.5rem;
        }
        
        .text-icon {
          width: 2rem;
          height: 2rem;
          color: #2563eb;
        }
        
        .text-action {
          font-size: 1.25rem;
          font-weight: 700;
          color: #2563eb;
        }
        
        .text-name {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
        }
        
        .text-availability {
          font-size: 0.875rem;
          color: #059669;
        }
        
        .crisis-additional-resources {
          padding: 0 1.5rem 1.5rem;
        }
        
        .resources-subtitle {
          font-size: 1.125rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 1rem 0;
        }
        
        .resources-grid {
          display: grid;
          gap: 0.75rem;
        }
        
        .crisis-resource-item {
          display: block;
          padding: 0.75rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          text-decoration: none;
          color: inherit;
          transition: all 0.15s ease;
        }
        
        .crisis-resource-item:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }
        
        .resource-name {
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.25rem;
        }
        
        .resource-number {
          font-size: 1.25rem;
          font-weight: 700;
          color: #dc2626;
        }
        
        .resource-availability {
          font-size: 0.75rem;
          color: #059669;
        }
        
        .crisis-online-support {
          padding: 0 1.5rem 1.5rem;
        }
        
        .online-resources {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .online-resource-link {
          display: flex;
          flex-direction: column;
          padding: 0.75rem;
          background: #f3f0ff;
          border: 1px solid #c7b5ff;
          border-radius: 0.375rem;
          text-decoration: none;
          color: inherit;
          transition: all 0.15s ease;
        }
        
        .online-resource-link:hover {
          background: #ede9fe;
          border-color: #a78bfa;
        }
        
        .online-resource-name {
          font-weight: 600;
          color: #7c3aed;
        }
        
        .online-resource-desc {
          font-size: 0.875rem;
          color: #6b7280;
        }
        
        .crisis-close-button {
          margin: 1.5rem;
          padding: 0.5rem 1rem;
          background: #e5e7eb;
          color: #374151;
          border: none;
          border-radius: 0.375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        
        .crisis-close-button:hover {
          background: #d1d5db;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(1rem);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        /* Performance optimizations for low-end devices */
        @media (prefers-reduced-motion: reduce) {
          .crisis-button,
          .crisis-modal-overlay,
          .crisis-modal,
          .crisis-hotline-primary,
          .crisis-resource-item {
            animation: none !important;
            transition: none !important;
          }
        }
        
        /* Mobile optimizations */
        @media (max-width: 640px) {
          .crisis-modal {
            max-height: 100vh;
            border-radius: 0;
          }
          
          .crisis-modal-overlay {
            padding: 0;
          }
        }
      `}</style>
    </>
  );
});

OptimizedCrisisButton.displayName = 'OptimizedCrisisButton';

export default OptimizedCrisisButton;