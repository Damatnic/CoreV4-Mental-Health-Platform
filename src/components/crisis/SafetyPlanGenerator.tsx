import { logger } from '../../utils/logger';
/**
 * Safety Plan Generator Component
 * Creates personalized crisis safety plans with evidence-based interventions
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Heart, Phone, _MessageSquare, _MapPin, Activity,
  Brain, _Users, _Home, _Sun, _Moon, _Coffee, _Book, _Music,
  _Zap, AlertTriangle, CheckCircle, Edit, Save, Download,
  Plus, X, _ChevronRight, _Lock, _Unlock
} from 'lucide-react';
import { secureStorage } from '../../services/security/SecureLocalStorage';
import { _detectCrisisLevel } from '../../utils/crisis';

interface _SafetyPlanSection {
  id: string;
  title: string;
  icon: React.ElementType;
  items: string[];
  customizable: boolean;
  required: boolean;
}

interface PersonalizedSafetyPlan {
  id: string;
  userId?: string;
  createdAt: Date;
  lastUpdated: Date;
  warningSignals: string[];
  copingStrategies: string[];
  distractionTechniques: string[];
  supportPeople: {
    name: string;
    phone: string;
    relationship: string;
    available: string;
  }[];
  safePlaces: {
    location: string;
    why: string;
    howToGet: string;
  }[];
  professionalContacts: {
    name: string;
    role: string;
    phone: string;
    email?: string;
    available: string;
  }[];
  reasonsToLive: string[];
  selfCareActivities: string[];
  emergencyNumbers: {
    service: string;
    number: string;
    available: string;
  }[];
  personalNotes?: string;
  isLocked: boolean;
}

const _DEFAULT_SAFETY_PLAN: PersonalizedSafetyPlan = {
  id: `safety-plan-${Date.now()}`,
  createdAt: new Date(),
  lastUpdated: new Date(),
  warningSignals: [
    'Feeling overwhelmed or hopeless',
    'Isolating from friends and family',
    'Changes in sleep patterns',
    'Difficulty concentrating',
    'Increased anxiety or panic'
  ],
  copingStrategies: [
    'Deep breathing exercises (4-7-8 technique)',
    'Progressive muscle relaxation',
    'Mindfulness meditation',
    'Grounding techniques (5-4-3-2-1)',
    'Cold water on face or ice pack',
    'Physical exercise or walking'
  ],
  distractionTechniques: [
    'Listen to calming music',
    'Watch funny videos',
    'Draw or color',
    'Play with a pet',
    'Count backwards from 100',
    'Name items in categories'
  ],
  supportPeople: [],
  safePlaces: [
    {
      location: 'Local park',
      why: 'Nature helps me feel calm',
      howToGet: 'Walk or short drive'
    },
    {
      location: 'Library',
      why: 'Quiet and peaceful environment',
      howToGet: 'Public transportation'
    }
  ],
  professionalContacts: [],
  reasonsToLive: [
    'My future goals and dreams',
    'People who care about me',
    'Things I want to experience',
    'My values and beliefs',
    'Small joys in daily life'
  ],
  selfCareActivities: [
    'Take a warm bath or shower',
    'Prepare a healthy meal',
    'Get 8 hours of sleep',
    'Spend time in nature',
    'Practice gratitude',
    'Engage in a hobby'
  ],
  emergencyNumbers: [
    {
      service: '988 Suicide & Crisis Lifeline',
      number: '988',
      available: '24/7'
    },
    {
      service: 'Crisis Text Line',
      number: 'Text HOME to 741741',
      available: '24/7'
    },
    {
      service: 'Emergency Services',
      number: '911',
      available: '24/7'
    }
  ],
  isLocked: false
};

export const SafetyPlanGenerator: React.FC = () => {
  const [safetyPlan, setSafetyPlan] = useState<PersonalizedSafetyPlan>(_DEFAULT_SAFETY_PLAN);
  const [isEditing, setIsEditing] = useState(false);
  const [__activeSection, _setActiveSection] = useState<string | null>(null);
  const [__showSuccess, setShowSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Load saved safety plan on mount
  useEffect(() => {
    const savedPlan = secureStorage.getItem('personalSafetyPlan');
    if (savedPlan) {
      try {
        const parsed = JSON.parse(savedPlan);
        setSafetyPlan({
          ...parsed,
          createdAt: new Date(parsed.createdAt),
          lastUpdated: new Date(parsed.lastUpdated)
        });
      } catch (error) {
        logger.error('Failed to load safety plan', 'SafetyPlanGenerator', error);
      }
    }
  }, []);

  const saveSafetyPlan = () => {
    // Validate required fields
    const errors = [];
    if (safetyPlan.warningSignals.length === 0) {
      errors.push('Please add at least one warning signal');
    }
    if (safetyPlan.copingStrategies.length === 0) {
      errors.push('Please add at least one coping strategy');
    }
    if (safetyPlan.emergencyNumbers.length === 0) {
      errors.push('Please add at least one emergency contact');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Save to secure storage
    const _updatedPlan = {
      ...safetyPlan,
      lastUpdated: new Date()
    };
    
    secureStorage.setItem('personalSafetyPlan', JSON.stringify(_updatedPlan));
    setSafetyPlan(_updatedPlan);
    setIsEditing(false);
    setShowSuccess(true);
    setValidationErrors([]);
    
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const exportSafetyPlan = () => {
    const planText = generatePlanText();
    const _blob = new Blob([planText], { type: 'text/plain' });
    const url = URL.createObjectURL(_blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safety-plan-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(_url);
  };

  const generatePlanText = () => {
    let text = '=== MY PERSONAL SAFETY PLAN ===\n\n';
    text += `Created: ${safetyPlan.createdAt.toLocaleDateString()}\n`;
    text += `Last Updated: ${safetyPlan.lastUpdated.toLocaleDateString()}\n\n`;
    
    text += '1. WARNING SIGNALS (Signs I need to use my plan):\n';
    safetyPlan.warningSignals.forEach(signal => {
      text += `   • ${signal}\n`;
    });
    
    text += '\n2. COPING STRATEGIES (Things I can do on my own):\n';
    safetyPlan.copingStrategies.forEach(strategy => {
      text += `   • ${strategy}\n`;
    });
    
    text += '\n3. DISTRACTION TECHNIQUES:\n';
    safetyPlan.distractionTechniques.forEach(technique => {
      text += `   • ${technique}\n`;
    });
    
    if (safetyPlan.supportPeople.length > 0) {
      text += '\n4. SUPPORT PEOPLE:\n';
      safetyPlan.supportPeople.forEach(person => {
        text += `   • ${person.name} (${person.relationship})\n`;
        text += `     Phone: ${person.phone}\n`;
        text += `     Available: ${person.available}\n`;
      });
    }
    
    if (safetyPlan.safePlaces.length > 0) {
      text += '\n5. SAFE PLACES:\n';
      safetyPlan.safePlaces.forEach(place => {
        text += `   • ${place.location}\n`;
        text += `     Why it helps: ${place.why}\n`;
        text += `     How to get there: ${place.howToGet}\n`;
      });
    }
    
    text += '\n6. REASONS TO LIVE:\n';
    safetyPlan.reasonsToLive.forEach(reason => {
      text += `   • ${reason}\n`;
    });
    
    text += '\n7. EMERGENCY CONTACTS:\n';
    safetyPlan.emergencyNumbers.forEach(contact => {
      text += `   • ${contact.service}: ${contact.number} (${contact.available})\n`;
    });
    
    if (safetyPlan.personalNotes) {
      text += `\nPERSONAL NOTES:\n${safetyPlan.personalNotes}\n`;
    }
    
    text += '\n=== REMEMBER: You are not alone. Help is always available. ===';
    
    return text;
  };

  const addItem = (section: keyof PersonalizedSafetyPlan, item: unknown) => {
    setSafetyPlan(prev => ({
      ...prev,
      [section]: Array.isArray(prev[section]) 
        ? [...(prev[section] as unknown[]), item]
        : item
    }));
  };

  const removeItem = (section: keyof PersonalizedSafetyPlan, index: number) => {
    setSafetyPlan(prev => ({
      ...prev,
      [section]: (prev[section] as unknown[]).filter((_, i) => i !== index)
    }));
  };

  const updateItem = (section: keyof PersonalizedSafetyPlan, index: number, value: unknown) => {
    setSafetyPlan(prev => ({
      ...prev,
      [section]: (prev[section] as unknown[]).map((item, i) => i === index ? value : item)
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-3 rounded-xl">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Personal Safety Plan</h1>
              <p className="text-gray-300">Your personalized crisis prevention toolkit</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Plan</span>
                </button>
                <button
                  onClick={exportSafetyPlan}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={saveSafetyPlan}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setValidationErrors([]);
                  }}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Success Message */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-500/20 border border-green-400 text-green-300 px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <CheckCircle className="h-5 w-5" />
              <span>Safety plan saved successfully!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-500/20 border border-red-400 text-red-300 px-4 py-2 rounded-lg mt-4">
            {validationErrors.map((error, index) => (
              <div key={index} className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Safety Plan Sections */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Warning Signals */}
        <SafetyPlanSectionComponent
          title="Warning Signals"
          subtitle="Early signs that I need to use my safety plan"
          icon={AlertTriangle}
          items={safetyPlan.warningSignals}
          isEditing={isEditing}
          onAdd={(item) => addItem('warningSignals', item)}
          onRemove={(index) => removeItem('warningSignals', index)}
          onUpdate={(index, value) => updateItem('warningSignals', index, value)}
          placeholder="e.g., Feeling overwhelmed, isolating myself"
          color="from-orange-400 to-red-500"
        />

        {/* Coping Strategies */}
        <SafetyPlanSectionComponent
          title="Coping Strategies"
          subtitle="Things I can do on my own to feel better"
          icon={Brain}
          items={safetyPlan.copingStrategies}
          isEditing={isEditing}
          onAdd={(item) => addItem('copingStrategies', item)}
          onRemove={(index) => removeItem('copingStrategies', index)}
          onUpdate={(index, value) => updateItem('copingStrategies', index, value)}
          placeholder="e.g., Deep breathing, go for a walk"
          color="from-blue-400 to-indigo-500"
        />

        {/* Distraction Techniques */}
        <SafetyPlanSectionComponent
          title="Distraction Techniques"
          subtitle="Activities to shift my focus"
          icon={Activity}
          items={safetyPlan.distractionTechniques}
          isEditing={isEditing}
          onAdd={(item) => addItem('distractionTechniques', item)}
          onRemove={(index) => removeItem('distractionTechniques', index)}
          onUpdate={(index, value) => updateItem('distractionTechniques', index, value)}
          placeholder="e.g., Listen to music, watch a movie"
          color="from-purple-400 to-pink-500"
        />

        {/* Reasons to Live */}
        <SafetyPlanSectionComponent
          title="Reasons to Live"
          subtitle="What makes life worth living for me"
          icon={Heart}
          items={safetyPlan.reasonsToLive}
          isEditing={isEditing}
          onAdd={(item) => addItem('reasonsToLive', item)}
          onRemove={(index) => removeItem('reasonsToLive', index)}
          onUpdate={(index, value) => updateItem('reasonsToLive', index, value)}
          placeholder="e.g., My family, future goals, my pet"
          color="from-pink-400 to-red-500"
        />

        {/* Emergency Contacts - Always Visible */}
        <motion.div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-2 rounded-lg">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Emergency Contacts</h2>
                <p className="text-gray-400 text-sm">Available 24/7 for immediate support</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {safetyPlan.emergencyNumbers.map((contact, index) => (
              <div key={index} className="bg-gray-900/50 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">{contact.service}</div>
                  <div className="text-gray-300">{contact.number}</div>
                  <div className="text-gray-400 text-sm">{contact.available}</div>
                </div>
                <button
                  onClick={() => window.location.href = `tel:${contact.number.replace(/\D/g, '')}`}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Call Now
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Reusable Section Component
interface SafetyPlanSectionProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  items: string[];
  isEditing: boolean;
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, value: string) => void;
  placeholder: string;
  color: string;
}

// Component renamed to avoid conflict with interface
const SafetyPlanSectionComponent: React.FC<SafetyPlanSectionProps> = ({
  title,
  subtitle,
  icon: Icon,
  items,
  isEditing,
  onAdd,
  onRemove,
  onUpdate,
  placeholder,
  color
}) => {
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim()) {
      onAdd(newItem.trim());
      setNewItem('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`bg-gradient-to-r ${color} p-2 rounded-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <p className="text-gray-400 text-sm">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between bg-gray-900/30 rounded-lg p-3">
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => onUpdate(index, e.target.value)}
                  className="flex-1 bg-transparent text-gray-300 outline-none"
                />
                <button
                  onClick={() => onRemove(index)}
                  className="text-red-400 hover:text-red-300 ml-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <span className="text-gray-300">{item}</span>
            )}
          </div>
        ))}
        
        {isEditing && (
          <div className="flex items-center space-x-2 mt-3">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
              placeholder={placeholder}
              className="flex-1 bg-gray-900/50 text-white placeholder-gray-500 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAdd}
              className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SafetyPlanGenerator;