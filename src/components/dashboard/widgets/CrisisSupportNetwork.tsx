import { useState, useEffect, useCallback } from 'react';
import { 
  Users, Phone, MessageCircle, Video, CheckCircle, 
  Clock, MapPin, Star, AlertCircle, Plus, Edit2,
  UserPlus, Shield, Heart, Globe, Wifi, WifiOff,
  Calendar, Bell, ChevronRight, Circle, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../contexts/AnonymousAuthContext';
import { logger, LogCategory } from '../../../services/logging/logger';

interface SupportContact {
  id: string;
  name: string;
  relationship: 'family' | 'friend' | 'therapist' | 'counselor' | 'doctor' | 'peer' | 'sponsor';
  phone: string;
  email?: string;
  preferredContact: 'call' | 'text' | 'video' | 'any';
  availability: {
    status: 'available' | 'busy' | 'offline' | 'emergency-only';
    lastSeen?: Date;
    timezone?: string;
    schedule?: {
      day: string;
      start: string;
      end: string;
    }[];
  };
  trustLevel: 1 | 2 | 3 | 4 | 5;
  specializations?: string[];
  notes?: string;
  lastContact?: Date;
  contactFrequency?: 'daily' | 'weekly' | 'monthly' | 'as-needed';
  isProfessional: boolean;
  isEmergencyContact: boolean;
}

interface SupportGroup {
  id: string;
  name: string;
  type: 'peer' | 'therapy' | 'recovery' | 'crisis' | 'community';
  memberCount: number;
  isActive: boolean;
  nextMeeting?: Date;
  meetingFrequency: string;
  isOnline: boolean;
  location?: string;
  moderators: string[];
  description: string;
  joinUrl?: string;
}

interface CrisisBuddy {
  id: string;
  buddyId: string;
  name: string;
  status: 'paired' | 'available' | 'busy';
  lastCheckIn: Date;
  sharedSafetyPlan: boolean;
  mutualSupport: boolean;
  timezone: string;
}

export function CrisisSupportNetwork() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'contacts' | 'groups' | 'buddy' | 'professional'>('contacts');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showAddContact, setShowAddContact] = useState(false);
  const [selectedContact, setSelectedContact] = useState<SupportContact | null>(null);
  
  // Support contacts state
  const [supportContacts, setSupportContacts] = useState<SupportContact[]>([
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      relationship: 'therapist',
      phone: '555-0100',
      email: 'sarah.johnson@therapy.com',
      preferredContact: 'call',
      availability: {
        status: 'available',
        timezone: 'EST',
        schedule: [
          { day: 'Monday', start: '9:00', end: '17:00' },
          { day: 'Wednesday', start: '9:00', end: '17:00' },
          { day: 'Friday', start: '9:00', end: '14:00' }
        ]
      },
      trustLevel: 5,
      specializations: ['Anxiety', 'Depression', 'Trauma'],
      isProfessional: true,
      isEmergencyContact: true,
      lastContact: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      name: 'Mom',
      relationship: 'family',
      phone: '555-0101',
      preferredContact: 'any',
      availability: {
        status: 'available',
        lastSeen: new Date()
      },
      trustLevel: 5,
      isProfessional: false,
      isEmergencyContact: true,
      contactFrequency: 'weekly'
    },
    {
      id: '3',
      name: 'Alex Chen',
      relationship: 'friend',
      phone: '555-0102',
      email: 'alex@email.com',
      preferredContact: 'text',
      availability: {
        status: 'busy',
        lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      trustLevel: 4,
      isProfessional: false,
      isEmergencyContact: false,
      notes: 'Great listener, understands anxiety'
    }
  ]);

  // Support groups state
  const [supportGroups, setSupportGroups] = useState<SupportGroup[]>([
    {
      id: '1',
      name: 'Anxiety Support Circle',
      type: 'peer',
      memberCount: 24,
      isActive: true,
      nextMeeting: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      meetingFrequency: 'Weekly on Thursdays',
      isOnline: true,
      moderators: ['Jane Doe', 'John Smith'],
      description: 'A safe space for sharing experiences with anxiety',
      joinUrl: 'https://meet.example.com/anxiety-support'
    },
    {
      id: '2',
      name: 'Mindfulness & Recovery',
      type: 'recovery',
      memberCount: 18,
      isActive: true,
      nextMeeting: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      meetingFrequency: 'Twice weekly',
      isOnline: false,
      location: 'Community Center, Room 204',
      moderators: ['Dr. Williams'],
      description: 'Combining mindfulness practices with recovery support'
    }
  ]);

  // Crisis buddy state
  const [crisisBuddy, setCrisisBuddy] = useState<CrisisBuddy | null>({
    id: '1',
    buddyId: 'buddy123',
    name: 'Jordan Taylor',
    status: 'paired',
    lastCheckIn: new Date(Date.now() - 6 * 60 * 60 * 1000),
    sharedSafetyPlan: true,
    mutualSupport: true,
    timezone: 'EST'
  });

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get available contacts count
  const availableContactsCount = supportContacts.filter(
    c => c.availability.status === 'available'
  ).length;

  // Get emergency contacts
  const emergencyContacts = supportContacts.filter(c => c.isEmergencyContact);
  const professionalContacts = supportContacts.filter(c => c.isProfessional);

  // Contact action handlers
  const handleContactAction = useCallback((contact: SupportContact, action: 'call' | 'text' | 'video') => {
    logger.info('Support network contact initiated', {
      category: LogCategory.CRISIS,
      contactId: contact.id,
      action,
      relationship: contact.relationship
    });

    // Update last contact time
    setSupportContacts(prev => prev.map(c => 
      c.id === contact.id ? { ...c, lastContact: new Date() } : c
    ));

    // Perform action based on type
    switch (action) {
      case 'call':
        window.location.href = `tel:${contact.phone}`;
        break;
      case 'text':
        window.location.href = `sms:${contact.phone}`;
        break;
      case 'video':
        // Would integrate with video call service
        console.log('Starting video call with', contact.name);
        break;
    }
  }, []);

  // Check-in with crisis buddy
  const handleBuddyCheckIn = useCallback(() => {
    if (crisisBuddy) {
      setCrisisBuddy(prev => prev ? { ...prev, lastCheckIn: new Date() } : null);
      logger.info('Crisis buddy check-in completed', {
        category: LogCategory.CRISIS,
        buddyId: crisisBuddy.buddyId
      });
    }
  }, [crisisBuddy]);

  // Join support group
  const handleJoinGroup = useCallback((group: SupportGroup) => {
    if (group.isOnline && group.joinUrl) {
      window.open(group.joinUrl, '_blank');
    } else {
      // Show group details/location
      console.log('Group details:', group);
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Network Overview */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Your Support Network</h3>
            <p className="text-sm text-gray-600">
              {availableContactsCount} contacts available now
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <div className="flex items-center text-green-600">
                <Wifi className="h-4 w-4 mr-1" />
                <span className="text-xs">Online</span>
              </div>
            ) : (
              <div className="flex items-center text-orange-600">
                <WifiOff className="h-4 w-4 mr-1" />
                <span className="text-xs">Offline</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white bg-opacity-70 rounded-lg p-2 text-center">
            <Users className="h-5 w-5 text-purple-600 mx-auto mb-1" />
            <p className="text-lg font-bold">{supportContacts.length}</p>
            <p className="text-xs text-gray-600">Contacts</p>
          </div>
          <div className="bg-white bg-opacity-70 rounded-lg p-2 text-center">
            <Shield className="h-5 w-5 text-red-600 mx-auto mb-1" />
            <p className="text-lg font-bold">{emergencyContacts.length}</p>
            <p className="text-xs text-gray-600">Emergency</p>
          </div>
          <div className="bg-white bg-opacity-70 rounded-lg p-2 text-center">
            <Globe className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <p className="text-lg font-bold">{supportGroups.length}</p>
            <p className="text-xs text-gray-600">Groups</p>
          </div>
          <div className="bg-white bg-opacity-70 rounded-lg p-2 text-center">
            <Heart className="h-5 w-5 text-pink-600 mx-auto mb-1" />
            <p className="text-lg font-bold">{crisisBuddy ? 1 : 0}</p>
            <p className="text-xs text-gray-600">Buddy</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              { id: 'contacts', label: 'Contacts', icon: Users, count: supportContacts.length },
              { id: 'groups', label: 'Groups', icon: Globe, count: supportGroups.length },
              { id: 'buddy', label: 'Crisis Buddy', icon: Heart, count: crisisBuddy ? 1 : 0 },
              { id: 'professional', label: 'Professional', icon: Shield, count: professionalContacts.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-3 px-2 flex items-center justify-center space-x-1 font-medium text-sm transition-colors relative ${
                  activeTab === tab.id
                    ? 'border-b-2 border-primary-500 text-primary-700 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-gray-200 text-gray-600">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4">
          <AnimatePresence mode="wait">
            {/* Contacts Tab */}
            {activeTab === 'contacts' && (
              <motion.div
                key="contacts"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Personal Contacts
                  </h4>
                  <button
                    onClick={() => setShowAddContact(true)}
                    className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Contact</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {supportContacts.map((contact) => (
                    <motion.div
                      key={contact.id}
                      whileHover={{ scale: 1.02 }}
                      className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {/* Availability Indicator */}
                          <div className="relative">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              contact.availability.status === 'available' ? 'bg-green-100' :
                              contact.availability.status === 'busy' ? 'bg-yellow-100' :
                              contact.availability.status === 'emergency-only' ? 'bg-orange-100' :
                              'bg-gray-100'
                            }`}>
                              <Users className={`h-5 w-5 ${
                                contact.availability.status === 'available' ? 'text-green-600' :
                                contact.availability.status === 'busy' ? 'text-yellow-600' :
                                contact.availability.status === 'emergency-only' ? 'text-orange-600' :
                                'text-gray-400'
                              }`} />
                            </div>
                            <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                              contact.availability.status === 'available' ? 'bg-green-500' :
                              contact.availability.status === 'busy' ? 'bg-yellow-500' :
                              contact.availability.status === 'emergency-only' ? 'bg-orange-500' :
                              'bg-gray-400'
                            }`}></span>
                          </div>

                          {/* Contact Info */}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-gray-900">{contact.name}</p>
                              {contact.isEmergencyContact && (
                                <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                                  Emergency
                                </span>
                              )}
                              {contact.isProfessional && (
                                <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                  Professional
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 capitalize">{contact.relationship}</p>
                            
                            {/* Trust Level */}
                            <div className="flex items-center space-x-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < contact.trustLevel 
                                      ? 'text-yellow-400 fill-current' 
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                              <span className="text-xs text-gray-500 ml-1">Trust</span>
                            </div>

                            {/* Specializations */}
                            {contact.specializations && contact.specializations.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {contact.specializations.map((spec, idx) => (
                                  <span key={idx} className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                                    {spec}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Last Contact */}
                            {contact.lastContact && (
                              <p className="text-xs text-gray-500 mt-2">
                                Last contact: {new Date(contact.lastContact).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Contact Actions */}
                        <div className="flex items-center space-x-1">
                          {(contact.preferredContact === 'call' || contact.preferredContact === 'any') && (
                            <button
                              onClick={() => handleContactAction(contact, 'call')}
                              className="p-2 text-gray-600 hover:bg-white rounded-lg transition-colors"
                              aria-label={`Call ${contact.name}`}
                            >
                              <Phone className="h-4 w-4" />
                            </button>
                          )}
                          {(contact.preferredContact === 'text' || contact.preferredContact === 'any') && (
                            <button
                              onClick={() => handleContactAction(contact, 'text')}
                              className="p-2 text-gray-600 hover:bg-white rounded-lg transition-colors"
                              aria-label={`Text ${contact.name}`}
                            >
                              <MessageCircle className="h-4 w-4" />
                            </button>
                          )}
                          {(contact.preferredContact === 'video' || contact.preferredContact === 'any') && (
                            <button
                              onClick={() => handleContactAction(contact, 'video')}
                              className="p-2 text-gray-600 hover:bg-white rounded-lg transition-colors"
                              aria-label={`Video call ${contact.name}`}
                            >
                              <Video className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedContact(contact)}
                            className="p-2 text-gray-600 hover:bg-white rounded-lg transition-colors"
                            aria-label={`Edit ${contact.name}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {supportContacts.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">No contacts added yet</p>
                    <button
                      onClick={() => setShowAddContact(true)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Add Your First Contact
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Groups Tab */}
            {activeTab === 'groups' && (
              <motion.div
                key="groups"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Support Groups
                  </h4>
                  <button className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700">
                    <Plus className="h-4 w-4" />
                    <span>Find Groups</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {supportGroups.map((group) => (
                    <div key={group.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-gray-900">{group.name}</h4>
                            {group.isActive && (
                              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                                Active
                              </span>
                            )}
                            {group.isOnline ? (
                              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                Online
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                                In-Person
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">{group.description}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {group.memberCount} members
                            </span>
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {group.meetingFrequency}
                            </span>
                          </div>

                          {group.nextMeeting && (
                            <div className="mt-2 p-2 bg-yellow-50 rounded-lg">
                              <p className="text-sm font-medium text-yellow-900">
                                Next Meeting: {new Date(group.nextMeeting).toLocaleDateString()} 
                                at {new Date(group.nextMeeting).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {group.location && !group.isOnline && (
                                <p className="text-xs text-yellow-700 mt-1">
                                  <MapPin className="h-3 w-3 inline mr-1" />
                                  {group.location}
                                </p>
                              )}
                            </div>
                          )}

                          <div className="mt-3 flex items-center space-x-2">
                            <button
                              onClick={() => handleJoinGroup(group)}
                              className="px-3 py-1 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
                            >
                              {group.isOnline ? 'Join Online' : 'View Details'}
                            </button>
                            <button className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
                              Set Reminder
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {supportGroups.length === 0 && (
                  <div className="text-center py-8">
                    <Globe className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">No groups joined yet</p>
                    <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                      Browse Support Groups
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Crisis Buddy Tab */}
            {activeTab === 'buddy' && (
              <motion.div
                key="buddy"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Crisis Buddy System
                </h4>

                {crisisBuddy ? (
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900">Your Crisis Buddy</h4>
                        <p className="text-2xl font-bold text-purple-700 mt-1">{crisisBuddy.name}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        crisisBuddy.status === 'paired' ? 'bg-green-100 text-green-700' :
                        crisisBuddy.status === 'busy' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {crisisBuddy.status === 'paired' ? 'Active' : crisisBuddy.status}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white bg-opacity-70 rounded-lg p-3">
                        <Clock className="h-5 w-5 text-purple-600 mb-1" />
                        <p className="text-sm text-gray-600">Last Check-in</p>
                        <p className="font-medium">
                          {new Date(crisisBuddy.lastCheckIn).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                      <div className="bg-white bg-opacity-70 rounded-lg p-3">
                        <Globe className="h-5 w-5 text-purple-600 mb-1" />
                        <p className="text-sm text-gray-600">Timezone</p>
                        <p className="font-medium">{crisisBuddy.timezone}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2">
                        {crisisBuddy.sharedSafetyPlan ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-700">Safety plans shared</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {crisisBuddy.mutualSupport ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-700">Mutual support agreement</span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={handleBuddyCheckIn}
                        className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                      >
                        Check In Now
                      </button>
                      <button className="flex-1 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 font-medium">
                        Send Message
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">No crisis buddy paired yet</p>
                    <p className="text-sm text-gray-500 mb-4">
                      A crisis buddy provides mutual support during difficult times
                    </p>
                    <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                      Find a Crisis Buddy
                    </button>
                  </div>
                )}

                {/* Buddy Benefits */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h5 className="font-medium text-blue-900 mb-2">Benefits of a Crisis Buddy</h5>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>24/7 peer support from someone who understands</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Regular check-ins to prevent crisis escalation</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Shared safety plans and coping strategies</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Accountability and motivation for wellness goals</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}

            {/* Professional Tab */}
            {activeTab === 'professional' && (
              <motion.div
                key="professional"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3"
              >
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Professional Support Team
                </h4>

                <div className="space-y-3">
                  {professionalContacts.map((contact) => (
                    <div key={contact.id} className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Shield className="h-5 w-5 text-blue-600" />
                            <h4 className="font-medium text-gray-900">{contact.name}</h4>
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded capitalize">
                              {contact.relationship}
                            </span>
                          </div>

                          {/* Specializations */}
                          {contact.specializations && contact.specializations.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2 mb-3">
                              {contact.specializations.map((spec, idx) => (
                                <span key={idx} className="px-2 py-0.5 text-xs bg-white text-gray-700 rounded">
                                  {spec}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Availability Schedule */}
                          {contact.availability.schedule && (
                            <div className="mb-3">
                              <p className="text-sm font-medium text-gray-700 mb-1">Available Hours:</p>
                              <div className="grid grid-cols-3 gap-1 text-xs">
                                {contact.availability.schedule.map((slot, idx) => (
                                  <div key={idx} className="bg-white rounded px-2 py-1">
                                    <span className="font-medium">{slot.day.slice(0, 3)}:</span> {slot.start}-{slot.end}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Contact Information */}
                          <div className="flex items-center space-x-4 text-sm">
                            <a 
                              href={`tel:${contact.phone}`}
                              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                            >
                              <Phone className="h-4 w-4" />
                              <span>{contact.phone}</span>
                            </a>
                            {contact.email && (
                              <a 
                                href={`mailto:${contact.email}`}
                                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                              >
                                <MessageCircle className="h-4 w-4" />
                                <span>Email</span>
                              </a>
                            )}
                          </div>

                          {/* Last Contact */}
                          {contact.lastContact && (
                            <p className="text-xs text-gray-600 mt-2">
                              Last appointment: {new Date(contact.lastContact).toLocaleDateString()}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col space-y-1">
                          <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <Calendar className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleContactAction(contact, 'call')}
                            className="p-2 bg-white text-blue-600 rounded-lg hover:bg-blue-100"
                          >
                            <Phone className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {professionalContacts.length === 0 && (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">No professional contacts added</p>
                    <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                      Add Professional Contact
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Quick Support Actions */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Quick Support Actions</p>
        <div className="grid grid-cols-3 gap-2">
          <button className="py-2 px-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
            <Bell className="h-4 w-4 mx-auto mb-1" />
            Alert Network
          </button>
          <button className="py-2 px-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
            <MessageCircle className="h-4 w-4 mx-auto mb-1" />
            Group Message
          </button>
          <button className="py-2 px-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
            <Settings className="h-4 w-4 mx-auto mb-1" />
            Settings
          </button>
        </div>
      </div>
    </div>
  );
}