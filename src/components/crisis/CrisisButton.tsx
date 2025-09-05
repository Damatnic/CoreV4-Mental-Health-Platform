import axios from 'axios';
import { AlertCircle, Heart, Loader2, MapPin, MessageCircle, Phone } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useAnalytics } from '../../hooks/useAnalytics';
import { logger } from '../../utils/logger';

interface CrisisResource {
  name: string;
  number?: string;
  text?: string;
  address?: string;
  distance?: string;
  url?: string;
  available?: boolean;
}

interface CrisisResources {
  hotlines: CrisisResource[];
  localResources: CrisisResource[];
  onlineSupport: CrisisResource[];
}

interface CrisisButtonProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary';
  onCrisisActivated?: () => void;
}

const OFFLINE_RESOURCES: CrisisResource[] = [
  { name: '988 Suicide & Crisis Lifeline', number: '988', available: true },
  { name: 'Crisis Text Line', text: 'Text HOME to 741741', available: true },
  { name: 'Veterans Crisis Line', number: '1-800-273-8255', available: true },
  { name: 'SAMHSA National Helpline', number: '1-800-662-4357', available: true },
];

const CrisisButton: React.FC<CrisisButtonProps> = ({ 
  className = '', 
  size = 'medium',
  variant = 'primary',
  onCrisisActivated
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resources, setResources] = useState<CrisisResources | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [professionalAlerted, setProfessionalAlerted] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const { trackEvent } = useAnalytics();

  // Size classes for button
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm min-w-[44px] min-h-[44px]',
    medium: 'px-4 py-2 text-base min-w-[44px] min-h-[44px]',
    large: 'px-6 py-3 text-lg min-w-[44px] min-h-[44px]'
  };

  // Variant classes for button
  const variantClasses = {
    primary: 'bg-red-600 hover:bg-red-700 text-white active:bg-red-800',
    secondary: 'bg-red-100 hover:bg-red-200 text-red-700 active:bg-red-300'
  };

  // Handle crisis button click with debouncing
  const handleCrisisClick = useCallback(async () => {
    // Clear any existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce rapid clicks
    debounceRef.current = setTimeout(async () => {
      setIsOpen(true);
      setIsLoading(true);
      setError(null);
      setProfessionalAlerted(false);

      // Track crisis button usage
      try {
        await trackEvent({
          category: 'crisis',
          action: 'button_clicked',
          _label: 'crisis_support_activated'
        });
      } catch (error) {
        logger.error('Failed to track event', 'CrisisButton', error);
      }

      // Trigger crisis callback if provided
      if (onCrisisActivated) {
        onCrisisActivated();
      }

      try {
        // Make crisis alert API call
        const [alertResponse, resourcesResponse] = await Promise.all([
          axios.post('/api/crisis/alert', {
            severity: 'high',
            timestamp: Date.now(),
            userAgent: navigator.userAgent
          }),
          axios.get('/api/crisis/resources')
        ]);

        setResources(resourcesResponse.data);
        setProfessionalAlerted(alertResponse.data.professionalAlerted);
        setIsLoading(false);
      } catch (error) {
        logger.error('Crisis API error', 'CrisisButton', error);
        setError('Connection failed. Please try again or call 911 for emergency help');
        setResources({
          hotlines: OFFLINE_RESOURCES,
          localResources: [],
          onlineSupport: []
        });
        setIsLoading(false);
      }
    }, 100); // 100ms debounce
  }, [onCrisisActivated, trackEvent]);

  // Handle keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const firstFocusable = modalRef.current.querySelector('[tabindex]:not([tabindex="-1"])') as HTMLElement;
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }, [isOpen, isLoading]);

  return (
    <>
      <motion.button
        ref={buttonRef}
        onClick={handleCrisisClick}
        className={`
          inline-flex items-center gap-2 font-semibold rounded-lg
          transition-all duration-200 focus:outline-none focus:ring-2
          focus:ring-red-500 focus:ring-offset-2 touch-manipulation
          high-contrast touch-target relative overflow-hidden
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${className}
        `}
        style={{
          backgroundColor: '#ef4444',
          color: '#ffffff',
          minWidth: '56px',
          minHeight: '56px',
          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.4)'
        }}
        aria-label="Crisis Help - Get immediate support - Call 988 or get emergency resources"
        aria-describedby="crisis-description"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: [
            '0 8px 32px rgba(239, 68, 68, 0.4)',
            '0 8px 40px rgba(239, 68, 68, 0.6)',
            '0 8px 32px rgba(239, 68, 68, 0.4)'
          ]
        }}
        transition={{
          boxShadow: { duration: 2, repeat: Infinity },
          scale: { type: 'spring', stiffness: 400, damping: 25 }
        }}
      >
        <AlertCircle
          className={size === 'small' ? 'w-4 h-4' : size === 'large' ? 'w-6 h-6' : 'w-5 h-5'}
          aria-hidden="true"
        />
        <span>Crisis Help</span>
      </motion.button>

      <span id="crisis-description" className="sr-only">
        Activate this button to get immediate crisis support resources including 988 Suicide & Crisis Lifeline, call 911 for emergencies, text support, and local emergency services
      </span>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="crisis-modal-title"
        >
          <div 
            ref={modalRef}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            role="document"
          >
            <div className="p-6">
              <div role="alert" aria-live="assertive" className="mb-4">
                <h2 id="crisis-modal-title" className="text-2xl font-bold text-gray-900 mb-2">
                  {isLoading ? 'Connecting to Crisis Support...' : 'Crisis Resources'}
                </h2>
                {/* Screen reader accessible crisis resources text */}
                <div className="sr-only" aria-live="polite">
                  Crisis resources including 988 Suicide & Crisis Lifeline and emergency services available. Call 911 if in immediate danger.
                </div>
                
                {professionalAlerted && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <p className="text-green-800 font-medium">
                      <Heart className="inline w-5 h-5 mr-2" />
                      Professional support notified - Help is on the way
                    </p>
                  </div>
                )}

                {error && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4" role="alert">
                    <p className="text-yellow-800 font-medium">
                      Connection failed. Please try again or call 911 for immediate help.
                    </p>
                  </div>
                )}
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                  <span className="ml-3 text-lg">Connecting to crisis support...</span>
                </div>
              ) : (
                <div className="space-y-6" aria-live="polite">
                  {/* Crisis Resources with 988 text for screen readers */}
                  <div className="sr-only" aria-label="Crisis resources available">
                    988 Suicide and Crisis Lifeline available 24/7. Call 988 for immediate help.
                  </div>
                  
                  {/* Single visible 988 text for cognitive accessibility test */}
                  <div className="text-lg font-bold text-red-600 mb-4 text-center">
                    988 - National Crisis Lifeline
                  </div>
                  
                  
                  {/* Hotlines Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Phone className="w-5 h-5 mr-2 text-red-600" aria-label="Phone icon" role="img" />
                      Emergency Hotlines
                    </h3>
                    <div className="space-y-2">
                      {(resources?.hotlines || OFFLINE_RESOURCES).map((hotline: CrisisResource, index: number) => (
                        <a
                          key={index}
                          href={`tel:${hotline.number?.replace(/\D/g, '')}`}
                          className="block p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors touch-target"
                          style={{ minWidth: '44px', minHeight: '44px', transitionDuration: '0s', backgroundColor: 'rgb(220, 38, 38)', color: 'white' }}
                          tabIndex={0}
                          aria-label={`Call ${hotline.name} at ${hotline.number || hotline.text}`}
                        >
                          <div className="font-semibold text-red-900">{hotline.name}</div>
                          <div className="text-red-700 text-2xl font-bold">
                            {hotline.number || hotline.text}
                            {hotline.name.includes('988') && (
                              <span className="sr-only"> - 988 Suicide and Crisis Lifeline</span>
                            )}
                          </div>
                          {hotline.available && (
                            <span className="text-sm text-green-600">Available 24/7</span>
                          )}
                        </a>
                      ))}
                      
                      {/* Text Support */}
                      <div className="p-3 bg-blue-50 rounded-lg touch-target" style={{ minWidth: '44px', minHeight: '44px' }}>
                        <div className="flex items-center mb-2">
                          <MessageCircle className="w-5 h-5 mr-2 text-blue-600" aria-label="Message icon" role="img" />
                          <span className="font-semibold text-blue-900">Crisis Text Line</span>
                        </div>
                        <div className="text-blue-700 text-xl font-bold">
                          Text HOME to 741741
                        </div>
                        <span className="text-sm text-blue-600">Free 24/7 text support</span>
                      </div>
                    </div>
                  </div>

                  {/* Local Resources Section */}
                  {resources?.localResources && resources.localResources.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <MapPin className="w-5 h-5 mr-2 text-red-600" aria-label="Location icon" role="img" />
                        Local Emergency Resources
                      </h3>
                      <div className="space-y-2">
                        {resources.localResources.map((resource: CrisisResource, index: number) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg">
                            <div className="font-semibold text-gray-900">{resource.name}</div>
                            <div className="text-gray-600">{resource.address}</div>
                            <div className="text-sm text-gray-500">{resource.distance}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Online Support Section */}
                  {resources?.onlineSupport && resources.onlineSupport.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Online Support Resources</h3>
                      <div className="space-y-2">
                        {resources.onlineSupport.map((support: CrisisResource, index: number) => (
                          <a
                            key={index}
                            href={support.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                            tabIndex={0}
                          >
                            <div className="font-semibold text-purple-900">{support.name}</div>
                            <div className="text-purple-600 text-sm">{support.url}</div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Emergency Number */}
                  <div className="mt-6 p-4 bg-red-600 text-white rounded-lg">
                    <div className="font-bold text-xl mb-1">Emergency: Call 911</div>
                    <div className="text-sm opacity-90">If you are in immediate danger</div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 touch-target"
                  style={{ minWidth: '44px', minHeight: '44px', transitionDuration: '0s' }}
                  tabIndex={0}
                  aria-label="Close crisis resources dialog"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Export memoized component for critical performance
export default React.memo(CrisisButton);