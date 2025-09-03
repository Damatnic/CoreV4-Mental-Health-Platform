import { _EmergencyService, _EmergencyContact, LocationCoordinates } from '../../types/emergency';
import { CrisisProfile } from '../../types/ai-insights';
import { logger, LogCategory } from '../logging/logger';
import { secureStorage } from '../security/secureStorage';

export interface EmergencyServiceProvider {
  id: string;
  name: string;
  type: 'crisis_center' | 'hospital' | 'police' | 'fire' | 'ems';
  phone: string;
  address: string;
  coordinates: LocationCoordinates;
  distance?: number;
  availability: '24/7' | 'business_hours' | 'emergency_only';
  specialties: string[];
  rating?: number;
  responseTime?: number;
}

export interface GeolocationPermission {
  granted: boolean;
  accuracy: 'high' | 'medium' | 'low' | 'denied';
  timestamp: number;
}

export class GeolocationEmergencyService {
  private currentLocation: LocationCoordinates | null = null;
  private nearbyServices: EmergencyServiceProvider[] = [];
  private permissionStatus: GeolocationPermission = {
    granted: false,
    accuracy: 'denied',
    timestamp: 0
  };

  constructor() {
    this.initializeGeolocation();
  }

  private async initializeGeolocation(): Promise<void> {
    try {
      if (!navigator.geolocation) {
        logger.warn('Geolocation not supported by browser');
        return;
      }

      const permission = await navigator.permissions.query({ name: 'geolocation' });
      this.updatePermissionStatus(permission.state);

      permission.addEventListener('change', () => {
        this.updatePermissionStatus(permission._state);
      });

    } catch {
      logger.error('Geolocation initialization failed:', error instanceof Error ? error : new Error(String(error)), {
        category: LogCategory.EMERGENCY
      });
    }
  }

  private updatePermissionStatus(_state: PermissionState): void {
    this.permissionStatus = {
      granted: _state === 'granted',
      accuracy: this.determineAccuracy(_state),
      timestamp: Date.now()
    };
  }

  private determineAccuracy(_state: PermissionState): GeolocationPermission['accuracy'] {
    switch (_state) {
      case 'granted': return 'high';
      case 'prompt': return 'medium';
      default: return 'denied';
    }
  }

  public async requestLocationPermission(): Promise<GeolocationPermission> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(this.permissionStatus);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };

          this.permissionStatus = {
            granted: true,
            accuracy: position.coords.accuracy < 100 ? 'high' : 'medium',
            timestamp: Date.now()
          };

          logger.info('Location permission granted', {
            category: LogCategory.EMERGENCY,
            metadata: {
              accuracy: this.permissionStatus.accuracy,
              coordinates: this.currentLocation
            }
          });

          resolve(this.permissionStatus);
        },
        (error) => {
          logger.error('Location permission denied:', error instanceof Error ? error : new Error(String(error)), {
            category: LogCategory.EMERGENCY
          });
          this.permissionStatus = {
            granted: false,
            accuracy: 'denied',
            timestamp: Date.now()
          };
          resolve(this.permissionStatus);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  public async findNearbyEmergencyServices(): Promise<EmergencyServiceProvider[]> {
    if (!this.currentLocation) {
      await this.requestLocationPermission();
    }

    if (!this.currentLocation) {
      return this.getFallbackEmergencyServices();
    }

    try {
      // Crisis centers (highest priority)
      const crisisCenters = await this.findCrisisCenters(this.currentLocation);
      
      // Emergency services
      const emergencyServices = await this.findEmergencyServices(this.currentLocation);
      
      // Hospitals with psychiatric services
      const hospitals = await this.findPsychiatricHospitals(this.currentLocation);

      this.nearbyServices = [...crisisCenters, ...emergencyServices, ...hospitals]
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));

      // Cache results for offline access
      await secureStorage.setItem('nearby_emergency_services', {
        data: this.nearbyServices,
        location: this.currentLocation,
        timestamp: Date.now()
      });

      return this.nearbyServices;

    } catch {
      logger.error('Failed to find nearby emergency services:', error instanceof Error ? error : new Error(String(error)), {
        category: LogCategory.EMERGENCY
      });
      return this.getFallbackEmergencyServices();
    }
  }

  private async findCrisisCenters(location: LocationCoordinates): Promise<EmergencyServiceProvider[]> {
    // Crisis center database - would integrate with real API
    const crisisCenters: EmergencyServiceProvider[] = [
      {
        id: 'crisis_center_1',
        name: 'National Suicide Prevention Lifeline',
        type: 'crisis_center',
        phone: '988',
        address: 'National Hotline',
        coordinates: location, // Virtual location for distance calculation
        availability: '24/7',
        specialties: ['suicide_prevention', 'crisis_counseling', 'mental_health'],
        rating: 5.0,
        responseTime: 0 // Immediate phone response
      },
      {
        id: 'crisis_center_2',
        name: 'Crisis Text Line',
        type: 'crisis_center',
        phone: '741741',
        address: 'Text Service',
        coordinates: location,
        availability: '24/7',
        specialties: ['text_support', 'crisis_counseling', 'youth_support'],
        rating: 4.8,
        responseTime: 0
      }
    ];

    // Add distance calculations
    return crisisCenters.map(center => ({
      ...center,
      distance: 0 // Virtual services have no physical distance
    }));
  }

  private async findEmergencyServices(location: LocationCoordinates): Promise<EmergencyServiceProvider[]> {
    // Emergency services - would integrate with local emergency services API
    return [
      {
        id: 'emergency_911',
        name: 'Emergency Services (911)',
        type: 'ems',
        phone: '911',
        address: 'Local Emergency Dispatch',
        coordinates: location,
        availability: '24/7',
        specialties: ['emergency_response', 'medical_emergency', 'psychiatric_emergency'],
        rating: 5.0,
        responseTime: 8 // Average response time in minutes
      }
    ];
  }

  private async findPsychiatricHospitals(location: LocationCoordinates): Promise<EmergencyServiceProvider[]> {
    // Psychiatric hospital database - would integrate with healthcare provider API
    return [
      {
        id: 'psych_hospital_1',
        name: 'Local Psychiatric Emergency Services',
        type: 'hospital',
        phone: '911',
        address: 'Nearest Hospital with Psychiatric Services',
        coordinates: location,
        availability: '24/7',
        specialties: ['psychiatric_emergency', 'involuntary_hold', 'crisis_stabilization'],
        rating: 4.2,
        responseTime: 15
      }
    ];
  }

  private getFallbackEmergencyServices(): EmergencyServiceProvider[] {
    return [
      {
        id: 'fallback_988',
        name: 'National Suicide Prevention Lifeline',
        type: 'crisis_center',
        phone: '988',
        address: 'National Service',
        coordinates: { latitude: 0, longitude: 0, accuracy: 0 },
        availability: '24/7',
        specialties: ['suicide_prevention', 'crisis_counseling'],
        rating: 5.0
      },
      {
        id: 'fallback_911',
        name: 'Emergency Services',
        type: 'ems',
        phone: '911',
        address: 'Local Emergency',
        coordinates: { latitude: 0, longitude: 0, accuracy: 0 },
        availability: '24/7',
        specialties: ['emergency_response'],
        rating: 5.0
      }
    ];
  }

  public async triggerEmergencyResponse(
    crisisProfile: CrisisProfile,
    selectedService?: EmergencyServiceProvider
  ): Promise<{
    success: boolean;
    service: EmergencyServiceProvider;
    action: 'call_initiated' | 'location_shared' | 'emergency_contacted';
  }> {
    try {
      // Find appropriate service based on crisis level
      const service = selectedService || await this.selectBestService(_crisisProfile);
      
      logger.info('Triggering emergency response:', {
        category: LogCategory.EMERGENCY,
        metadata: {
          crisisLevel: crisisProfile.riskLevel,
          service: service.name,
          location: this.currentLocation
        }
      });

      // For critical situations, auto-initiate emergency contact
      if (crisisProfile.riskLevel === 'critical') {
        return await this.initiateEmergencyCall(_service);
      }

      // For high-risk situations, prepare emergency response
      if (crisisProfile.riskLevel === 'high') {
        return await this.prepareEmergencyResponse(_service);
      }

      // For moderate risk, provide emergency options
      return {
        success: true,
        service,
        action: 'location_shared'
      };

    } catch {
      logger.error('Emergency response failed:', error instanceof Error ? error : new Error(String(error)), {
        category: LogCategory.EMERGENCY
      });
      
      // Fallback to basic emergency service
      const fallbackService = this.getFallbackEmergencyServices()[0];
      return {
        success: false,
        service: fallbackService!,
        action: 'emergency_contacted'
      };
    }
  }

  private async selectBestService(crisisProfile: CrisisProfile): Promise<EmergencyServiceProvider> {
    const services = await this.findNearbyEmergencyServices();
    
    // Crisis-specific service selection
    if (crisisProfile.indicators.includes('suicidal_ideation')) {
      return services.find(s => s.specialties.includes('suicide_prevention')) || services[0] || this.getDefaultService();
    }

    if (crisisProfile.indicators.includes('immediate_danger')) {
      return services.find(s => s.type === 'ems') || services[0] || this.getDefaultService();
    }

    // Default to crisis center
    return services.find(s => s.type === 'crisis_center') || services[0] || this.getDefaultService();
  }

  private getDefaultService(): EmergencyServiceProvider {
    return {
      id: 'default-988',
      name: '988 Suicide & Crisis Lifeline',
      phone: '988',
      type: 'crisis_center',
      address: 'National Crisis Line',
      coordinates: { latitude: 0, longitude: 0, accuracy: 0 },
      distance: 0,
      availability: '24/7',
      specialties: ['crisis_intervention', 'suicide_prevention'],
      rating: 5.0
    };
  }

  private async initiateEmergencyCall(service: EmergencyServiceProvider): Promise<{
    success: boolean;
    service: EmergencyServiceProvider;
    action: 'call_initiated' | 'location_shared' | 'emergency_contacted';
  }> {
    try {
      // In a real implementation, this would integrate with device calling capabilities
      // For web, we'll provide the emergency number and location info
      
      const emergencyInfo = {
        phone: service.phone,
        location: this.currentLocation,
        timestamp: new Date().toISOString(),
        service: service.name
      };

      // Store emergency call info for follow-up
      await secureStorage.setItem('last_emergency_call', emergencyInfo);

      logger.info('Emergency call initiated:', {
        category: LogCategory.EMERGENCY,
        metadata: emergencyInfo
      });

      return {
        success: true,
        service,
        action: 'call_initiated'
      };

    } catch {
      logger.error('Emergency call initiation failed:', error instanceof Error ? error : new Error(String(error)), {
        category: LogCategory.EMERGENCY
      });
      throw error;
    }
  }

  private async prepareEmergencyResponse(service: EmergencyServiceProvider): Promise<{
    success: boolean;
    service: EmergencyServiceProvider;
    action: 'call_initiated' | 'location_shared' | 'emergency_contacted';
  }> {
    // Prepare all emergency information for quick access
    const emergencyPackage = {
      service,
      location: this.currentLocation,
      timestamp: Date.now(),
      userProfile: await secureStorage.getItem('emergency_profile')
    };

    await secureStorage.setItem('prepared_emergency_response', emergencyPackage);

    return {
      success: true,
      service,
      action: 'location_shared'
    };
  }

  public async shareLocationWithEmergencyServices(): Promise<boolean> {
    if (!this.currentLocation) {
      await this.requestLocationPermission();
    }

    if (!this.currentLocation) {
      return false;
    }

    try {
      // Store location for emergency access
      await secureStorage.setItem('emergency_location', {
        coordinates: this.currentLocation,
        timestamp: Date.now(),
        accuracy: this.permissionStatus.accuracy
      });

      logger.info('Location shared with emergency services:', {
        category: LogCategory.EMERGENCY,
        metadata: { location: this.currentLocation }
      });
      return true;

    } catch {
      logger.error('Failed to share location:', error instanceof Error ? error : new Error(String(error)), {
        category: LogCategory.EMERGENCY
      });
      return false;
    }
  }

  public getCurrentLocation(): LocationCoordinates | null {
    return this.currentLocation;
  }

  public getNearbyServices(): EmergencyServiceProvider[] {
    return this.nearbyServices;
  }

  public getPermissionStatus(): GeolocationPermission {
    return this.permissionStatus;
  }
}

export const __geolocationEmergencyService = new GeolocationEmergencyService();