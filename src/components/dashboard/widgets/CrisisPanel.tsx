import { useState } from 'react';
import { Phone, MessageCircle, AlertTriangle, Heart, Shield, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { CrisisPanelData } from '../../../types/dashboard';

interface CrisisPanelProps {
  data?: CrisisPanelData;
  onEmergencyCall?: (contact: string) => void;
  onOpenSafetyPlan?: () => void;
}

export function CrisisPanel({ data, onEmergencyCall, onOpenSafetyPlan }: CrisisPanelProps) {
  const [showFullPlan, setShowFullPlan] = useState(false);

  // Default crisis resources if no data provided
  const defaultHotlines = [
    { id: '1', name: '988 Suicide & Crisis Lifeline', contact: '988', type: 'hotline' as const, available247: true, description: 'Free, confidential crisis support', country: 'US' },
    { id: '2', name: 'Crisis Text Line', contact: 'Text HOME to 741741', type: 'text' as const, available247: true, description: 'Text-based crisis support', country: 'US' },
    { id: '3', name: 'Emergency Services', contact: '911', type: 'emergency' as const, available247: true, description: 'Immediate emergency response', country: 'US' },
  ];

  const hotlines = data?.hotlines || defaultHotlines;
  const riskLevel = data?.currentRiskLevel || 'low';

  // Risk level styling
  const getRiskLevelStyle = () => {
    switch (riskLevel) {
      case 'critical':
        return 'bg-red-100 border-red-500 text-red-900';
      case 'high':
        return 'bg-orange-100 border-orange-500 text-orange-900';
      case 'moderate':
        return 'bg-yellow-100 border-yellow-500 text-yellow-900';
      default:
        return 'bg-green-100 border-green-500 text-green-900';
    }
  };

  const getRiskLevelText = () => {
    switch (riskLevel) {
      case 'critical':
        return 'Immediate Support Available';
      case 'high':
        return 'Support Resources Ready';
      case 'moderate':
        return 'Resources Available';
      default:
        return 'You\'re Doing Well';
    }
  };

  return (
    <div className="space-y-4">
      {/* Risk Status Banner */}
      <div className={`p-3 rounded-lg border-l-4 ${getRiskLevelStyle()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span className="font-medium">{getRiskLevelText()}</span>
          </div>
          {data?.lastCheckIn && (
            <span className="text-sm opacity-75">
              Last check-in: {new Date(data.lastCheckIn).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Emergency Hotlines */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          24/7 Crisis Support
        </h4>
        <div className="grid gap-2">
          {hotlines.map((hotline) => (
            <motion.button
              key={hotline.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onEmergencyCall?.(hotline.contact)}
              className="flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors group"
              aria-label={`Contact ${hotline.name}`}
            >
              <div className="flex items-center space-x-3">
                {hotline.type === 'hotline' || hotline.type === 'emergency' ? (
                  <Phone className="h-5 w-5 text-red-600" />
                ) : (
                  <MessageCircle className="h-5 w-5 text-red-600" />
                )}
                <div className="text-left">
                  <p className="font-medium text-gray-900">{hotline.name}</p>
                  <p className="text-sm text-gray-600">{hotline.contact}</p>
                </div>
              </div>
              <AlertTriangle className="h-4 w-4 text-red-400 group-hover:text-red-600" />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Emergency Contacts */}
      {data?.emergencyContacts && data.emergencyContacts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Personal Emergency Contacts
          </h4>
          <div className="grid gap-2">
            {data.emergencyContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => onEmergencyCall?.(contact.phone)}
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={!contact.isAvailable}
              >
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{contact.name}</p>
                    <p className="text-sm text-gray-600">{contact.relationship}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {contact.isAvailable ? (
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  ) : (
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  )}
                  <span className="text-sm text-gray-500">
                    {contact.preferredContact === 'both' ? 'Call/Text' : contact.preferredContact}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Safety Plan Quick Access */}
      {data?.safetyPlan && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <button
            onClick={() => setShowFullPlan(!showFullPlan)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">My Safety Plan</span>
            </div>
            <span className="text-sm text-blue-600">
              {showFullPlan ? 'Hide' : 'View'}
            </span>
          </button>
          
          {showFullPlan && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-3 text-sm"
            >
              {/* Warning Signals */}
              {data.safetyPlan.warningSignals.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-700 mb-1">Warning Signals:</p>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {data.safetyPlan.warningSignals.map((signal, idx) => (
                      <li key={idx}>{signal}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Coping Strategies */}
              {data.safetyPlan.copingStrategies.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-700 mb-1">Coping Strategies:</p>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {data.safetyPlan.copingStrategies.map((strategy, idx) => (
                      <li key={idx}>{strategy}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Reasons to Live */}
              {data.safetyPlan.reasons && data.safetyPlan.reasons.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-700 mb-1">My Reasons:</p>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {data.safetyPlan.reasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <button
                onClick={onOpenSafetyPlan}
                className="mt-2 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Safety Plan
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* Quick Support Message */}
      <div className="mt-4 p-3 bg-purple-50 rounded-lg">
        <p className="text-sm text-purple-900">
          <span className="font-medium">Remember:</span> You are not alone. 
          Support is always available, and reaching out is a sign of strength.
        </p>
      </div>
    </div>
  );
}