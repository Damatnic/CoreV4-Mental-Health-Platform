import React from 'react';
import { Shield, Lock, Heart, Gift, Eye, UserX, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Privacy Banner Component
 * 
 * Displays privacy and free access guarantees
 * Reassures users about data protection and no-cost access
 */

export function PrivacyBanner() {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const privacyFeatures = [
    { icon: UserX, text: 'No Registration Required', color: 'text-blue-600' },
    { icon: Lock, text: 'Zero Data Collection', color: 'text-purple-600' },
    { icon: Eye, text: 'Complete Anonymity', color: 'text-indigo-600' },
    { icon: Gift, text: '100% Free Forever', color: 'text-green-600' },
  ];

  return (
    <>
      {/* Floating Privacy Badge */}
      <div className="fixed bottom-4 left-4 z-50">
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 group"
          aria-label="Privacy and Free Access Information"
        >
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span className="hidden group-hover:inline-block pr-2 font-medium">
              Private & Free
            </span>
          </div>
        </motion.button>
      </div>

      {/* Expanded Privacy Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-20 left-4 z-50 bg-white rounded-2xl shadow-2xl p-6 max-w-sm border border-gray-100"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Your Privacy Matters</h3>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close privacy panel"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3">
                {privacyFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className={`${feature.color} bg-opacity-10 p-2 rounded-lg`}>
                      <feature.icon className={`h-5 w-5 ${feature.color}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{feature.text}</span>
                  </motion.div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-600">
                  We believe mental health support should be accessible to everyone. 
                  No barriers, no tracking, no costs. Just help when you need it.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner for First-Time Visitors */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 border-b border-blue-100"
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">Always Free</span>
            </div>
            <div className="hidden sm:block text-gray-300">•</div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">100% Anonymous</span>
            </div>
            <div className="hidden sm:block text-gray-300">•</div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-purple-800">No Data Collection</span>
            </div>
            <div className="hidden sm:block text-gray-300">•</div>
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              <span className="font-medium text-gray-700">You Deserve Support</span>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

/**
 * Inline Privacy Badge Component
 * For use within other components
 */
export function PrivacyBadge({ variant = 'default' }: { variant?: 'default' | 'small' | 'inline' }) {
  if (variant === 'small') {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
        <Shield className="h-3 w-3" />
        <span>Private</span>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <span className="inline-flex items-center gap-1 text-blue-600 text-sm">
        <Shield className="h-4 w-4" />
        <span className="font-medium">Anonymous & Free</span>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
      <Shield className="h-5 w-5 text-blue-600" />
      <div>
        <p className="text-sm font-medium text-gray-900">Your Privacy is Protected</p>
        <p className="text-xs text-gray-600">No registration, no tracking, completely free</p>
      </div>
    </div>
  );
}

/**
 * Free Forever Badge
 */
export function FreeBadge() {
  return (
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', duration: 0.3 }}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-full font-medium shadow-md"
    >
      <Gift className="h-4 w-4" />
      <span>100% Free Forever</span>
    </motion.div>
  );
}