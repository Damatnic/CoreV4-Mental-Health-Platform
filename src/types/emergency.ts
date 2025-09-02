export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: 'family' | 'friend' | 'professional' | 'crisis_center';
  isPrimary: boolean;
  isAvailable24_7: boolean;
}

export interface EmergencyProfile {
  userId: string;
  primaryContacts: EmergencyContact[];
  medicalInfo: {
    allergies: string[];
    medications: string[];
    conditions: string[];
    emergencyMedicalInfo: string;
  };
  crisisPreferences: {
    preferredContactMethod: 'call' | 'text' | 'app';
    allowLocationSharing: boolean;
    allowEmergencyContacts: boolean;
    preferredLanguage: string;
  };
  lastUpdated: number;
}

export interface EmergencyService {
  call911: () => Promise<void>;
  callSuicideHotline: () => Promise<void>;
  callCrisisTextLine: () => Promise<void>;
  contactEmergencyContact: (contactId: string) => Promise<void>;
  shareLocation: () => Promise<boolean>;
  triggerEmergencyProtocol: (severity: 'low' | 'medium' | 'high' | 'critical') => Promise<void>;
}

export interface EmergencyAlert {
  id: string;
  type: 'crisis_detected' | 'emergency_triggered' | 'location_shared' | 'help_requested';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  location?: LocationCoordinates;
  actionsTaken: string[];
  requiresFollowUp: boolean;
}

export interface GeolocationPermission {
  granted: boolean;
  accuracy: 'high' | 'medium' | 'low' | 'denied';
  timestamp: number;
}