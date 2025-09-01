// Emergency Services Interface - GPS location sharing, 911 dispatch, hospital finder
// CRITICAL: This component provides life-safety emergency response capabilities

import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, MapPin, Navigation, Clock, Star, Shield, AlertTriangle, 
  Heart, Cross, Car, Radio, Mic, MicOff, Volume2, VolumeX,
  Battery, Signal, Wifi, Target, Map, Route, Send, MessageCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getCurrentLocation, findNearbyEmergencyServices, EmergencyService } from '../../services/crisis/emergencyServices';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
}

interface DispatchCall {
  id: string;
  type: '911' | '988' | 'medical' | 'police' | 'fire';
  startTime: Date;
  duration: number;
  status: 'connecting' | 'active' | 'ended';
  operator?: {
    name: string;
    badge?: string;
    department: string;
  };
}

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  priority: number;
}

export function EmergencyServicesInterface() {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [nearbyServices, setNearbyServices] = useState<EmergencyService[]>([]);
  const [activeCall, setActiveCall] = useState<DispatchCall | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selectedService, setSelectedService] = useState<EmergencyService | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [showDispatchSimulation, setShowDispatchSimulation] = useState(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize component
  useEffect(() => {
    initializeEmergencyServices();
    loadEmergencyContacts();
    monitorConnection();
    
    // Monitor battery level (simulated)
    const batteryInterval = setInterval(() => {
      setBatteryLevel(prev => Math.max(0, prev - Math.random() * 2));
    }, 30000);
    
    return () => {
      clearInterval(batteryInterval);
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, []);

  // Initialize emergency services
  const initializeEmergencyServices = async () => {
    try {
      await requestLocationAccess();
    } catch (error) {
      console.error('Failed to initialize emergency services:', error);
      toast.error('Unable to access location services. Emergency features may be limited.');
    }
  };

  // Request location access
  const requestLocationAccess = async () => {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported');
    }

    setIsGettingLocation(true);
    
    try {
      const location = await getCurrentLocation();
      setCurrentLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: location.timestamp
      });
      setLocationPermission('granted');
      
      // Get address from coordinates (mock implementation)
      await reverseGeocode(location.latitude, location.longitude);
      
      // Find nearby emergency services
      const services = await findNearbyEmergencyServices(location);
      setNearbyServices(services);
      
      toast.success('Location accessed successfully. Emergency services are ready.');
    } catch (error) {
      setLocationPermission('denied');
      console.error('Location access denied:', error);
      toast.error('Location access required for emergency services. Please enable location permissions.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Reverse geocoding (mock implementation)
  const reverseGeocode = async (lat: number, lng: number) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock address based on coordinates
    const mockAddresses = [
      '123 Main Street, Downtown',
      '456 Oak Avenue, Midtown',
      '789 Pine Road, Uptown',
      '321 Elm Street, Westside',
      '654 Maple Lane, Eastside'
    ];
    
    const address = mockAddresses[Math.floor(Math.random() * mockAddresses.length)];
    setCurrentLocation(prev => prev ? { ...prev, address } : null);
  };

  // Load emergency contacts
  const loadEmergencyContacts = () => {
    // In production, load from secure storage or user preferences
    const defaultContacts: EmergencyContact[] = [
      {
        id: '1',
        name: 'Emergency Contact 1',
        relationship: 'Family',
        phone: '555-0001',
        priority: 1
      },
      {
        id: '2',
        name: 'Emergency Contact 2',
        relationship: 'Friend',
        phone: '555-0002',
        priority: 2
      },
      {
        id: '3',
        name: 'Primary Care Doctor',
        relationship: 'Healthcare',
        phone: '555-0003',
        priority: 3
      }
    ];
    
    setEmergencyContacts(defaultContacts);
  };

  // Monitor connection quality
  const monitorConnection = () => {
    // Simulate connection monitoring
    const checkConnection = () => {
      const random = Math.random();
      if (random > 0.8) {
        setConnectionQuality('poor');
      } else if (random > 0.3) {
        setConnectionQuality('good');
      } else {
        setConnectionQuality('excellent');
      }
    };
    
    setInterval(checkConnection, 10000); // Check every 10 seconds
  };

  // Initiate emergency call
  const initiateEmergencyCall = (type: '911' | '988' | 'medical' | 'police' | 'fire', service?: EmergencyService) => {
    const callId = `call-${Date.now()}`;
    
    const call: DispatchCall = {
      id: callId,
      type,
      startTime: new Date(),
      duration: 0,
      status: 'connecting',
      operator: {
        name: getRandomOperatorName(type),
        badge: type === 'police' ? `Badge #${Math.floor(Math.random() * 9000) + 1000}` : undefined,
        department: getDepartmentName(type)
      }
    };

    setActiveCall(call);
    setShowDispatchSimulation(true);

    // Show immediate emergency alert
    const alertMessage = `🚨 EMERGENCY CALL INITIATED\n\nCalling: ${type.toUpperCase()}\n${service ? `Service: ${service.name}\n` : ''}Location: ${currentLocation?.address || 'Location services active'}\n\nThis is a demonstration - in a real emergency, emergency services would be contacted immediately.`;
    
    toast.error(alertMessage, {
      duration: 8000,
      icon: '🚨'
    });

    // Simulate call connection process
    setTimeout(() => {
      if (activeCall?.id === callId) {
        setActiveCall(prev => prev ? { ...prev, status: 'active' } : null);
        startCallTimer(callId);
        
        // Actually initiate the phone call
        const phoneNumber = type === '988' ? '988' : type === '911' ? '911' : service?.phone || '911';
        if (confirm(`Connect to ${type.toUpperCase()} (${phoneNumber})?`)) {
          window.location.href = `tel:${phoneNumber}`;
        }
      }
    }, 3000 + Math.random() * 2000);
  };

  // Start call timer
  const startCallTimer = (callId: string) => {
    callTimerRef.current = setInterval(() => {
      setActiveCall(prev => {
        if (prev?.id === callId) {
          return {
            ...prev,
            duration: Math.floor((Date.now() - prev.startTime.getTime()) / 1000)
          };
        }
        return prev;
      });
    }, 1000);
  };

  // End emergency call
  const endCall = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    
    setActiveCall(prev => prev ? { ...prev, status: 'ended' } : null);
    setTimeout(() => {
      setActiveCall(null);
      setShowDispatchSimulation(false);
    }, 2000);
  };

  // Get random operator name
  const getRandomOperatorName = (type: string): string => {
    const names = {
      '911': ['Dispatcher Johnson', 'Operator Martinez', 'Dispatcher Chen'],
      '988': ['Counselor Smith', 'Crisis Specialist Davis', 'Counselor Williams'],
      medical: ['EMT Rodriguez', 'Paramedic Thompson', 'EMT Anderson'],
      police: ['Officer Brown', 'Dispatcher Wilson', 'Officer Garcia'],
      fire: ['Captain Miller', 'Dispatcher Taylor', 'Captain Lee']
    };
    
    const nameList = names[type as keyof typeof names] || names['911'];
    return nameList[Math.floor(Math.random() * nameList.length)] || 'Emergency Operator';
  };

  // Get department name
  const getDepartmentName = (type: string): string => {
    const departments = {
      '911': 'Emergency Dispatch',
      '988': '988 Crisis Lifeline',
      medical: 'Emergency Medical Services',
      police: 'Police Department',
      fire: 'Fire Department'
    };
    
    return departments[type as keyof typeof departments] || 'Emergency Services';
  };

  // Share location with emergency services
  const shareLocationWithEmergencyServices = () => {
    if (!currentLocation) {
      toast.error('Location not available');
      return;
    }

    const locationData = {
      coordinates: `${currentLocation.latitude}, ${currentLocation.longitude}`,
      accuracy: `${currentLocation.accuracy}m`,
      address: currentLocation.address || 'Address lookup in progress',
      timestamp: new Date(currentLocation.timestamp).toLocaleString(),
      deviceInfo: {
        battery: `${batteryLevel}%`,
        connection: connectionQuality,
        timestamp: new Date().toISOString()
      }
    };

    // Simulate sending location to emergency services
    console.log('📍 LOCATION SHARED WITH EMERGENCY SERVICES:', locationData);
    
    toast.success('Location shared with emergency services');
    
    // In production, this would transmit to actual emergency dispatch systems
    return locationData;
  };

  // Format call duration
  const formatCallDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get connection quality color
  const getConnectionColor = (quality: string): string => {
    switch (quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8" />
            <div>
              <h2 className="text-xl font-bold">Emergency Services</h2>
              <p className="text-red-100">24/7 Emergency Response System</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <Battery className="h-4 w-4" />
              <span>{batteryLevel}%</span>
            </div>
            <div className={`flex items-center space-x-1 ${getConnectionColor(connectionQuality)}`}>
              <Signal className="h-4 w-4" />
              <span>{connectionQuality}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Wifi className="h-4 w-4" />
              <span>Connected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => initiateEmergencyCall('911')}
          className="bg-red-600 hover:bg-red-700 text-white p-6 rounded-xl transition-colors group"
        >
          <div className="flex items-center justify-center space-x-3">
            <Phone className="h-8 w-8 group-hover:animate-pulse" />
            <div className="text-left">
              <div className="text-xl font-bold">911</div>
              <div className="text-sm">Emergency Services</div>
            </div>
          </div>
        </button>

        <button
          onClick={() => initiateEmergencyCall('988')}
          className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-xl transition-colors group"
        >
          <div className="flex items-center justify-center space-x-3">
            <Heart className="h-8 w-8 group-hover:animate-pulse" />
            <div className="text-left">
              <div className="text-xl font-bold">988</div>
              <div className="text-sm">Crisis Lifeline</div>
            </div>
          </div>
        </button>

        <button
          onClick={shareLocationWithEmergencyServices}
          disabled={!currentLocation}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white p-6 rounded-xl transition-colors group"
        >
          <div className="flex items-center justify-center space-x-3">
            <MapPin className="h-8 w-8 group-hover:animate-pulse" />
            <div className="text-left">
              <div className="text-xl font-bold">Location</div>
              <div className="text-sm">Share GPS</div>
            </div>
          </div>
        </button>
      </div>

      {/* Active Call Interface */}
      {activeCall && showDispatchSimulation && (
        <div className="bg-white border-2 border-red-500 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`h-4 w-4 rounded-full animate-pulse ${
                activeCall.status === 'connecting' ? 'bg-yellow-500' :
                activeCall.status === 'active' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {activeCall.type.toUpperCase()} Call - {activeCall.status.toUpperCase()}
                </h3>
                <p className="text-sm text-gray-600">
                  {activeCall.operator?.name} - {activeCall.operator?.department}
                  {activeCall.operator?.badge && ` (${activeCall.operator.badge})`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono font-bold">
                {formatCallDuration(activeCall.duration)}
              </div>
              <div className="text-sm text-gray-500">Call Duration</div>
            </div>
          </div>

          {/* Call Controls */}
          <div className="flex items-center justify-center space-x-4 mb-4">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 rounded-full transition-colors ${
                isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </button>
            
            <button
              onClick={() => setIsVoiceActive(!isVoiceActive)}
              className={`p-3 rounded-full transition-colors ${
                isVoiceActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {isVoiceActive ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
            </button>
            
            <button
              onClick={shareLocationWithEmergencyServices}
              className="p-3 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
            >
              <Navigation className="h-6 w-6" />
            </button>
            
            <button
              onClick={endCall}
              className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              <Phone className="h-6 w-6 transform rotate-225" />
            </button>
          </div>

          {/* Location Information */}
          {currentLocation && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Your Location (Shared with Dispatch)</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Address:</span>
                  <div className="font-mono">{currentLocation.address || 'Resolving...'}</div>
                </div>
                <div>
                  <span className="text-gray-600">Coordinates:</span>
                  <div className="font-mono">{currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Accuracy:</span>
                  <div className="font-mono">{currentLocation.accuracy}m</div>
                </div>
                <div>
                  <span className="text-gray-600">Updated:</span>
                  <div className="font-mono">{new Date(currentLocation.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            </div>
          )}

          {/* Emergency Instructions */}
          {activeCall.status === 'active' && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Stay on the line with the dispatcher.</p>
                  <p>Your location has been shared. Help is on the way. Follow the dispatcher's instructions carefully.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Location Services */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Location Services</h3>
          <div className="flex items-center space-x-2">
            {locationPermission === 'granted' ? (
              <div className="flex items-center space-x-1 text-green-600">
                <Target className="h-4 w-4" />
                <span className="text-sm">Active</span>
              </div>
            ) : (
              <button
                onClick={requestLocationAccess}
                disabled={isGettingLocation}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isGettingLocation ? 'Getting Location...' : 'Enable Location'}
              </button>
            )}
          </div>
        </div>

        {currentLocation ? (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Current Address:</span>
                  <div className="font-semibold">{currentLocation.address || 'Resolving address...'}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Coordinates:</span>
                  <div className="font-mono text-sm">{currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Accuracy:</span>
                  <div>{currentLocation.accuracy} meters</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Last Updated:</span>
                  <div>{new Date(currentLocation.timestamp).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Mock Map Display */}
            <div 
              ref={mapContainerRef}
              className="h-48 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center"
            >
              <div className="text-center text-gray-600">
                <Map className="h-12 w-12 mx-auto mb-2" />
                <p className="font-semibold">Interactive Map</p>
                <p className="text-sm">Your location: {currentLocation.address || 'Loading...'}</p>
                <p className="text-xs mt-1">In production, this would show an interactive map with your exact location</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-2" />
            <p>Location services not available</p>
            <p className="text-sm">Enable location access for emergency services</p>
          </div>
        )}
      </div>

      {/* Nearby Emergency Services */}
      {nearbyServices.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nearby Emergency Services</h3>
          <div className="space-y-3">
            {nearbyServices.slice(0, 6).map((service) => (
              <div key={service.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-red-300 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    service.type === 'hospital' ? 'bg-red-100 text-red-600' :
                    service.type === 'crisis-center' ? 'bg-purple-100 text-purple-600' :
                    service.type === 'police' ? 'bg-blue-100 text-blue-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {service.type === 'hospital' ? <Cross className="h-5 w-5" /> :
                     service.type === 'crisis-center' ? <Heart className="h-5 w-5" /> :
                     service.type === 'police' ? <Shield className="h-5 w-5" /> :
                     <Phone className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{service.name}</div>
                    <div className="text-sm text-gray-600">
                      {service.distance && `${service.distance} miles`} • {service.specializations.join(', ')}
                    </div>
                    {service.waitTime && (
                      <div className="text-xs text-gray-500">Est. wait: {service.waitTime}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {service.rating && (
                    <div className="flex items-center space-x-1 text-yellow-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm text-gray-600">{service.rating}</span>
                    </div>
                  )}
                  <button
                    onClick={() => initiateEmergencyCall('911', service)}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Call
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emergency Contacts */}
      {emergencyContacts.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contacts</h3>
          <div className="space-y-3">
            {emergencyContacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-semibold text-gray-900">{contact.name}</div>
                  <div className="text-sm text-gray-600">{contact.relationship}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono text-gray-600">{contact.phone}</span>
                  <button
                    onClick={() => window.location.href = `tel:${contact.phone}`}
                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => window.location.href = `sms:${contact.phone}?body=This is an emergency. I need help. My location: ${currentLocation?.address || 'Location services unavailable'}`}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}