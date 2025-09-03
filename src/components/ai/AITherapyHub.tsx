import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TherapistSelector, Therapist } from './TherapistSelector';
import TherapistChat from './TherapistChat';
import { Brain, ArrowLeft, Sparkles, Heart, Shield } from 'lucide-react';

interface AITherapyHubProps {
  onClose?: () => void;
}

const AITherapyHub: React.FC<AITherapyHubProps> = ({ onClose }) => {
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [currentView, setCurrentView] = useState<'selector' | 'chat'>('selector');

  const handleTherapistSelect = (therapist: Therapist) => {
    setSelectedTherapist(therapist);
    setCurrentView('chat');
  };

  const handleBackToSelector = () => {
    setCurrentView('selector');
    setSelectedTherapist(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <AnimatePresence mode="wait">
        {currentView === 'selector' ? (
          <motion.div
            key="selector"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header with close button */}
            {onClose && (
              <div className="absolute top-4 left-4 z-50">
                <button
                  onClick={onClose}
                  className="bg-gray-800/50 backdrop-blur-md text-white p-3 rounded-full hover:bg-gray-700/50 transition-colors shadow-console-card"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              </div>
            )}
            
            <TherapistSelector
              onSelectTherapist={handleTherapistSelect}
              selectedTherapist={selectedTherapist || undefined}
            />
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="h-screen"
          >
            {selectedTherapist && (
              <TherapistChat
                therapist={selectedTherapist}
                onBack={handleBackToSelector}
                fullScreen={true}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AITherapyHub;