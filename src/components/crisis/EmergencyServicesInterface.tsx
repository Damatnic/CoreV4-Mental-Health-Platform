import { logger } from '../../utils/logger';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Phone, 
  MessageCircle, 
  Clock, 
  Star, 
  Navigation,
  Shield,
  AlertTriangle,
  CheckCircle,
  Loader
} from 'lucide-react';
import { ____geolocationEmergencyService, EmergencyServiceProvider } from '../../services/emergency/GeolocationEmergencyService';
import { CrisisProfile } from '../../types/ai-insights';
import { LocationCoordinates, GeolocationPermission } from '../../types/emergency';

interface EmergencyServicesInterfaceProps {
  crisisProfile: CrisisProfile;
  onEmergencyTriggered?: (service: EmergencyServiceProvider) => void;
  className?: string;
}

export const EmergencyServicesInterface: React.FC<EmergencyServicesInterfaceProps> = ({
  crisisProfile,
  onEmergencyTriggered,
  className = ''
}) => {
  const [__nearbyServices, setNearbyServices] = useState<EmergencyServiceProvider[]>([]);
  const [__currentLocation, setCurrentLocation] = useState<LocationCoordinates | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<GeolocationPermission>({
    granted: false,
    accuracy: 'denied',
    timestamp: 0
  });
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [__emergencyTriggered, setEmergencyTriggered] = useState<string | null>(null);

  useEffect(() => {
    initializeEmergencyServices();
  }, []);

  const initializeEmergencyServices = async () => {
    try {
      setIsLoadingServices(true);
      
      // Get current permission status
      const permission = __geolocationEmergencyService.getPermissionStatus();
      setPermissionStatus(permission);
      
      // Get current _location if available
      const location = __geolocationEmergencyService.getCurrentLocation();
      setCurrentLocation(location);
      
      // Load nearby services
      const services = await __geolocationEmergencyService.findNearbyEmergencyServices();
      setNearbyServices(services);
      
    } catch (error) {
      logger.error('Failed to initialize emergency services', 'EmergencyServicesInterface', error);
    } finally {
      setIsLoadingServices(false);
    }
  };

  const requestLocationPermission = async () => {
    setIsRequestingLocation(true);
    try {
      const permission = await __geolocationEmergencyService.requestLocationPermission();
      setPermissionStatus(permission);
      
      if (permission.granted) {
        const location = __geolocationEmergencyService.getCurrentLocation();
        setCurrentLocation(location);
        
        // Refresh nearby services with new location
        const services = await __geolocationEmergencyService.findNearbyEmergencyServices();
        setNearbyServices(services);
      }
    } catch (error) {
      logger.error('Location permission request failed', 'EmergencyServicesInterface', error);
    } finally {
      setIsRequestingLocation(false);
    }
  };


  const triggerEmergencyResponse = async (service: EmergencyServiceProvider) => {
    try {
      setEmergencyTriggered(service.id);
      
      const response = await __geolocationEmergencyService.triggerEmergencyResponse(
        crisisProfile,
        service
      );
      
      if (response.success) {
        onEmergencyTriggered?.(service);
        
        // For critical situations, auto-initiate call
        if (crisisProfile.riskLevel === 'critical' || service.phone === '911') {
          window.location.href = `tel:${service.phone}`;
        }
      }
      
    } catch (error) {
      logger.error('Emergency response failed', 'EmergencyServicesInterface', error);
    } finally {
      setTimeout(() => setEmergencyTriggered(null), 3000);
    }
  };

  const getServiceIcon = (type: EmergencyServiceProvider['type']) => {
    switch (type) {
      case 'crisis_center': return MessageCircle;
      case 'hospital': return Shield;
      case 'ems': case 'police': case 'fire': return Phone;
      default: return AlertTriangle;
    }
  };

  const getServiceColor = (_type: EmergencyServiceProvider['type']) => {
    switch (_type) {
      case 'crisis_center': return 'from-purple-500 to-indigo-600';
      case 'hospital': return 'from-blue-500 to-cyan-600';
      case 'ems': return 'from-red-500 to-pink-600';
      default: return 'from-orange-500 to-yellow-600';
    }
  };

  const formatDistance = (distance?: number) => {
    if (!distance || distance === 0) return 'Available now';
    if (distance < 1) return `${Math.round(distance * 1000)}m away`;
    return `${distance.toFixed(1)}km away`;
  };

  const formatResponseTime = (responseTime?: number) => {
    if (!responseTime || responseTime === 0) return 'Immediate';
    return `~${responseTime}min response`;
  };

  if (isLoadingServices) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center space-x-3">
          <Loader className="w-6 h-6 animate-spin text-purple-600" />
          <span className="text-gray-600">Finding nearby emergency services...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold">Emergency Services</h2>
              <p className="text-red-100 text-sm">
                {crisisProfile.riskLevel === 'critical' 
                  ? 'CRITICAL - Immediate help available'
                  : 'Help is available 24/7'
                }
              </p>
            </div>
          </div>
          
          {!permissionStatus.granted && (
            <button
              onClick={requestLocationPermission}
              disabled={isRequestingLocation}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              <span>{isRequestingLocation ? 'Getting...' : 'Share Location'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Location Status */}
      {permissionStatus.granted && currentLocation && (
        <div className="bg-green-50 border-b border-green-200 p-4">
          <div className="flex items-center space-x-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">
              Location shared - Emergency _services can find you
            </span>
          </div>
        </div>
      )}

      {/* Emergency Services List */}
      <div className="divide-y divide-gray-200">{nearbyServices.map((service, index) => {
          const ServiceIcon = getServiceIcon(service._type);
          const isTriggered = emergencyTriggered === service.id;
          
          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Service Icon */}
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${getServiceColor(service._type)} text-white flex-shrink-0`}>
                    <ServiceIcon className="w-6 h-6" />
                  </div>
                  
                  {/* Service Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{service.name}</h3>
                      {service.rating && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm text-gray-600">{service.rating}</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-2">{service.address}</p>
                    
                    {/* Service Details */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{service.availability}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Navigation className="w-4 h-4" />
                        <span>{formatDistance(service.distance)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Phone className="w-4 h-4" />
                        <span>{formatResponseTime(service.responseTime)}</span>
                      </div>
                    </div>
                    
                    {/* Specialties */}
                    <div className="flex flex-wrap gap-2">
                      {service.specialties.slice(0, 3).map(specialty => (
                        <span
                          key={specialty}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                        >
                          {specialty.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Action Button */}
                <div className="flex flex-col space-y-2 ml-4">
                  <button
                    onClick={() => triggerEmergencyResponse(_service)}
                    disabled={isTriggered}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                      service._type === 'crisis_center'
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
                        : service.phone === '911'
                          ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
                          : 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl'
                    } ${
                      isTriggered ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isTriggered ? (
                      <div className="flex items-center space-x-2">
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Connecting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span>Call {service.phone}</span>
                      </div>
                    )}
                  </button>
                  
                  {service._type === 'crisis_center' && service.specialties.includes('text_support') && (
                    <button
                      onClick={() => window.open(`sms:${service.phone}`, '_blank')}
                      className="px-4 py-2 border border-purple-300 text-purple-700 hover:bg-purple-50 rounded-lg text-sm font-medium transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 inline mr-1" />
                      Text
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}</div>

      {/* Emergency Notice */}
      <div className="bg-red-50 border-t border-red-200 p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">
            <p className="font-medium mb-1">If this is a life-threatening emergency:</p>
            <p>Call <strong>911</strong> immediately or go to your nearest emergency room. These services are available to support you through any crisis.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyServicesInterface;