import React, { useState } from 'react';
import { Phone, MessageCircle, AlertTriangle, Shield, Clock, ChevronRight } from 'lucide-react';
import { CrisisPanelData } from '../../../types/dashboard';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface CrisisPanelWidgetProps {
  data?: CrisisPanelData;
  error?: string;
}

export function CrisisPanelWidget({ data, error }: CrisisPanelWidgetProps) {
  const navigate = useNavigate();
  const [showAllContacts, _setShowAllContacts] = useState(false);

  if (_error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-20 bg-gray-200 rounded-lg"></div>
        <div className="h-16 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  const getRiskLevelColor = () => {
    switch (data.currentRiskLevel) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'moderate':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-green-500 text-white';
    }
  };

  const formatLastCheckIn = () => {
    if (!data.lastCheckIn) return 'Never';
    
    const now = new Date();
    const checkIn = new Date(data.lastCheckIn);
    const hours = Math.floor((now.getTime() - checkIn.getTime()) / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  return (
    <div className="space-y-3">
      {/* Risk Level Indicator */}
      <div className={`rounded-lg p-3 ${getRiskLevelColor()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span className="font-medium">Current Risk Level</span>
          </div>
          <span className="font-bold uppercase">{data.currentRiskLevel}</span>
        </div>
        <div className="mt-2 flex items-center text-sm opacity-90">
          <Clock className="h-3 w-3 mr-1" />
          Last check-in: {formatLastCheckIn()}
        </div>
      </div>

      {/* Crisis Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/crisis')}
        className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg p-4 flex items-center justify-between transition-colors"
      >
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-6 w-6" />
          <div className="text-left">
            <p className="font-semibold">Need Immediate Help?</p>
            <p className="text-sm opacity-90">Get crisis support now</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5" />
      </motion.button>

      {/* Emergency Contacts */}
      {data.emergencyContacts && data.emergencyContacts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Emergency Contacts</h4>
            <button
              onClick={() => setShowAllContacts(!showAllContacts)}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              {showAllContacts ? 'Show Less' : 'Show All'}
            </button>
          </div>
          
          <AnimatePresence>
            {data.emergencyContacts
              .slice(0, showAllContacts ? undefined : 1)
              .map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white border border-gray-200 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{contact.name}</p>
                      <p className="text-xs text-gray-600">{contact.relationship}</p>
                    </div>
                    <div className="flex space-x-2">
                      {contact.preferredContact !== 'text' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `tel:${contact.phone}`;
                          }}
                          className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                        >
                          <Phone className="h-4 w-4" />
                        </button>
                      )}
                      {contact.preferredContact !== 'call' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `sms:${contact.phone}`;
                          }}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {contact.isAvailable && (
                    <div className="mt-2 flex items-center text-xs text-green-600">
                      <div className="w-2 h-2 bg-green-600 rounded-full mr-1"></div>
                      Available now
                    </div>
                  )}
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      )}

      {/* Crisis Hotlines */}
      {data.hotlines && data.hotlines.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">24/7 Crisis Hotlines</h4>
          {data.hotlines.slice(0, 2).map((hotline) => (
            <div
              key={hotline.id}
              className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100"
              onClick={() => {
                if (hotline.type === 'hotline') {
                  window.location.href = `tel:${hotline.contact}`;
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (hotline.type === 'hotline') {
                    window.location.href = `tel:${hotline.contact}`;
                  }
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{hotline.name}</p>
                  <p className="text-xs text-gray-600 mt-1">{hotline.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary-600">{hotline.contact}</p>
                  {hotline.available247 && (
                    <p className="text-xs text-green-600">24/7</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Safety Plan Link */}
      <button
        onClick={() => navigate('/crisis/safety-plan')}
        className="w-full bg-primary-100 text-primary-700 rounded-lg p-3 flex items-center justify-between hover:bg-primary-200 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4" />
          <span className="text-sm font-medium">View Safety Plan</span>
        </div>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}