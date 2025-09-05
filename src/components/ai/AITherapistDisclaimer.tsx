import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Info, 
  Phone, 
  Shield, 
  X, 
  CheckCircle,
  Heart,
  Brain,
  Users,
  AlertCircle,
  MessageSquare,
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface AITherapistDisclaimerProps {
  onAccept: () => void;
  isCompact?: boolean;
}

export const AITherapistDisclaimer: React.FC<AITherapistDisclaimerProps> = ({ 
  onAccept, 
  isCompact = false 
}) => {
  const [hasAccepted, setHasAccepted] = useState(false);
  const [showFullDisclaimer, setShowFullDisclaimer] = useState(false);
  const [acceptanceChecks, setAcceptanceChecks] = useState({
    understandAI: false,
    notReplacement: false,
    seekHelp: false,
    dataPrivacy: false
  });

  useEffect(() => {
    // Check if user has previously accepted disclaimers
    const previousAcceptance = localStorage.getItem('ai-therapist-disclaimer-accepted');
    if (previousAcceptance) {
      const acceptanceTime = new Date(previousAcceptance);
      const now = new Date();
      const daysSinceAcceptance = (now.getTime() - acceptanceTime.getTime()) / (1000 * 60 * 60 * 24);
      
      // Re-show disclaimer every 30 days for safety
      if (daysSinceAcceptance < 30) {
        setHasAccepted(true);
      }
    }
  }, []);

  const allChecked = Object.values(acceptanceChecks).every(v => v);

  const handleAccept = () => {
    if (allChecked) {
      localStorage.setItem('ai-therapist-disclaimer-accepted', new Date().toISOString());
      setHasAccepted(true);
      onAccept();
    }
  };

  const handleCheck = (key: keyof typeof acceptanceChecks) => {
    setAcceptanceChecks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (hasAccepted && !showFullDisclaimer) {
    // Compact reminder banner
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-console-lg p-4 mb-6 backdrop-blur-console"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500/20 rounded-console">
              <Brain className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium mb-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                AI Therapy Assistant
              </h3>
              <p className="text-gray-300 text-sm">
                Remember: I'm an AI assistant designed to help you explore your thoughts. 
                I'm not a replacement for professional mental health care.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowFullDisclaimer(true)}
            className="text-gray-400 hover:text-white transition-colors p-1"
            aria-label="View full disclaimer"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
        
        {/* Quick crisis reminder */}
        <motion.div 
          className="mt-3 pt-3 border-t border-gray-700/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-gray-300">
              In crisis? 
            </span>
            <a 
              href="tel:988" 
              className="text-red-400 hover:text-red-300 font-medium flex items-center gap-1 hover:underline"
            >
              <Phone className="w-3 h-3" />
              Call 988
            </a>
            <span className="text-gray-400">or</span>
            <a 
              href="/crisis" 
              className="text-red-400 hover:text-red-300 font-medium hover:underline"
            >
              Get immediate help
            </a>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Full disclaimer modal
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-console-lg max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-console-depth border border-gray-700/50"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-gray-700/50">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-console">
                    <Brain className="w-6 h-6 text-blue-400" />
                  </div>
                  AI Therapy Assistant - Important Information
                </h2>
                <p className="text-gray-300">
                  Please read and understand these important points before proceeding
                </p>
              </div>
              {showFullDisclaimer && (
                <button
                  onClick={() => setShowFullDisclaimer(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2"
                  aria-label="Close disclaimer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
            {/* Main disclaimers */}
            <div className="space-y-4 mb-6">
              {/* AI Nature Disclaimer */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-console-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-200 mb-2">
                      This is an AI Assistant, Not a Human Therapist
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      I am an artificial intelligence designed to help you explore and express your thoughts 
                      and feelings. I do not have human emotions, clinical training, or the ability to provide 
                      medical diagnoses or treatment. My responses are generated based on patterns in data, 
                      not professional therapeutic expertise.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Not a Replacement */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-red-900/20 to-pink-900/20 border border-red-500/30 rounded-console-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-red-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-200 mb-2">
                      Not a Replacement for Professional Care
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      This AI assistant cannot replace professional mental health treatment. If you are 
                      experiencing mental health challenges, please consult with a licensed therapist, 
                      counselor, or psychiatrist. Professional human support is essential for proper 
                      diagnosis and treatment of mental health conditions.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Crisis Situations */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-r from-red-600/30 to-red-800/30 border border-red-500/50 rounded-console-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-red-300 mt-0.5 animate-pulse" />
                  <div>
                    <h3 className="font-semibold text-red-200 mb-2">
                      In Crisis? Seek Immediate Human Help
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed mb-3">
                      If you're in crisis, having thoughts of self-harm, or experiencing a medical emergency, 
                      please immediately contact:
                    </p>
                    <div className="space-y-2">
                      <a 
                        href="tel:988" 
                        className="flex items-center gap-2 text-red-300 hover:text-red-200 font-medium"
                      >
                        <Phone className="w-4 h-4" />
                        988 - Suicide & Crisis Lifeline (US)
                      </a>
                      <a 
                        href="tel:911" 
                        className="flex items-center gap-2 text-red-300 hover:text-red-200 font-medium"
                      >
                        <AlertCircle className="w-4 h-4" />
                        911 - Emergency Services
                      </a>
                      <a 
                        href="/crisis" 
                        className="flex items-center gap-2 text-red-300 hover:text-red-200 font-medium"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Crisis Support Chat
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Privacy & Data */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-500/30 rounded-console-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-200 mb-2">
                      Privacy and Data Usage
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Conversations with this AI assistant may be processed to improve the service. 
                      While we implement security measures, please avoid sharing highly sensitive 
                      personal information such as full names, addresses, social security numbers, 
                      or financial information. Your privacy and safety are important to us.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* What the AI CAN do */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                How This AI Assistant Can Help
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5" />
                  <span>Provide a safe, judgment-free space to express your thoughts and feelings</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5" />
                  <span>Offer coping strategies and self-care suggestions based on established techniques</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5" />
                  <span>Help you reflect on your emotions and thought patterns</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5" />
                  <span>Provide general mental wellness information and resources</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5" />
                  <span>Be available 24/7 for non-emergency support and conversation</span>
                </li>
              </ul>
            </div>

            {/* Acceptance checkboxes */}
            <div className="space-y-3 mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Please confirm your understanding:
              </h3>
              
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={acceptanceChecks.understandAI}
                  onChange={() => handleCheck('understandAI')}
                  className="mt-0.5 w-5 h-5 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
                  I understand this is an AI assistant, not a human therapist or medical professional
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={acceptanceChecks.notReplacement}
                  onChange={() => handleCheck('notReplacement')}
                  className="mt-0.5 w-5 h-5 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
                  I understand this is not a replacement for professional mental health care
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={acceptanceChecks.seekHelp}
                  onChange={() => handleCheck('seekHelp')}
                  className="mt-0.5 w-5 h-5 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
                  I will seek immediate human help if I'm in crisis or having thoughts of self-harm
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={acceptanceChecks.dataPrivacy}
                  onChange={() => handleCheck('dataPrivacy')}
                  className="mt-0.5 w-5 h-5 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
                  I understand the privacy implications and will not share sensitive personal information
                </span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-900/50 p-6 border-t border-gray-700/50">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-gray-400">
                By proceeding, you acknowledge that you have read and understood these important disclaimers.
              </p>
              <div className="flex gap-3">
                {!hasAccepted && (
                  <button
                    onClick={() => window.history.back()}
                    className="px-6 py-3 rounded-console bg-gray-700 hover:bg-gray-600 text-white font-medium transition-all hover:scale-105"
                  >
                    Go Back
                  </button>
                )}
                <button
                  onClick={handleAccept}
                  disabled={!allChecked}
                  className={`px-6 py-3 rounded-console font-medium transition-all ${
                    allChecked 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white hover:scale-105 shadow-console-glow' 
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  I Understand - Continue to AI Assistant
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AITherapistDisclaimer;