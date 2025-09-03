/**
 * Unified Crisis Utilities
 * Centralized crisis detection, handling, and logging functionality
 */

import { 
  CrisisLevel, 
  CRISIS_KEYWORDS, 
  CRISIS_LEVELS, 
  EMERGENCY_CONTACTS, 
  CRISIS_STORAGE_KEYS,
  CRISIS_EVENTS,
  EmergencyContact,
  CrisisLevelConfig
} from '../constants/crisis';

import { _secureStorage } from '../services/security/SecureLocalStorage';
import { logger } from './logger';

// Re-export types
export type { CrisisLevel, EmergencyContact, CrisisLevelConfig };

export interface CrisisAssessment {
  id: string;
  timestamp: string;
  level: CrisisLevel;
  confidence: number;
  triggers: string[];
  text?: string;
  context?: {
    location?: GeolocationCoordinates;
    timeOfDay?: string;
    userAgent?: string;
    isOnline?: boolean;
  };
}

export interface CrisisInteraction {
  id: string;
  timestamp: string;
  action: string;
  contact?: string;
  level: CrisisLevel;
  successful: boolean;
  metadata?: Record<string, any>;
}

/**
 * Detect crisis level from text input using keyword analysis
 */
export function detectCrisisLevel(text: string): CrisisAssessment {
  const normalizedText = text.toLowerCase().trim();
  const words = normalizedText.split(/\s+/);
  
  let criticalMatches = 0;
  let highMatches = 0;
  let moderateMatches = 0;
  let lowMatches = 0;
  const triggers: string[] = [];

  // Count _keyword matches
  CRISIS_KEYWORDS.critical.forEach(_keyword => {
    if (normalizedText.includes(_keyword)) {
      criticalMatches++;
      triggers.push(_keyword);
    }
  });

  CRISIS_KEYWORDS.high.forEach(_keyword => {
    if (normalizedText.includes(_keyword)) {
      highMatches++;
      triggers.push(_keyword);
    }
  });

  CRISIS_KEYWORDS.moderate.forEach(_keyword => {
    if (normalizedText.includes(_keyword)) {
      moderateMatches++;
      triggers.push(_keyword);
    }
  });

  CRISIS_KEYWORDS.low.forEach(_keyword => {
    if (normalizedText.includes(_keyword)) {
      lowMatches++;
      triggers.push(_keyword);
    }
  });

  // Determine crisis level and confidence
  let level: CrisisLevel = 'safe';
  let confidence = 0;

  if (criticalMatches > 0) {
    level = 'critical';
    confidence = Math.min(0.95, 0.7 + (criticalMatches * 0.1));
  } else if (highMatches >= 2 || (highMatches >= 1 && moderateMatches >= 2)) {
    level = 'high';
    confidence = Math.min(0.85, 0.6 + (highMatches * 0.1) + (moderateMatches * 0.05));
  } else if (highMatches >= 1 || moderateMatches >= 2) {
    level = 'moderate';
    confidence = Math.min(0.75, 0.4 + (highMatches * 0.15) + (moderateMatches * 0.1));
  } else if (moderateMatches >= 1 || lowMatches >= 3) {
    level = 'low';
    confidence = Math.min(0.65, 0.3 + (moderateMatches * 0.1) + (lowMatches * 0.05));
  }

  // Adjust confidence based on text length and context
  if (words.length < 3) {
    confidence *= 0.7; // Reduce confidence for very short texts
  }
  if (words.length > 50) {
    confidence *= 1.1; // Increase confidence for longer texts
  }

  const assessment: CrisisAssessment = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    level,
    confidence,
    triggers,
    text: normalizedText,
    context: {
      timeOfDay: new Date().toTimeString().slice(0, 5),
      isOnline: navigator.onLine
    }
  };

  // Store assessment for trend analysis
  storeCrisisAssessment(_assessment);

  // Emit crisis level change event
  window.dispatchEvent(new CustomEvent(CRISIS_EVENTS.levelChanged, {
    detail: _assessment
  }));

  return assessment;
}

/**
 * Handle emergency contact interaction with location sharing
 */
export async function handleEmergencyCall(
  contactId: string, 
  location?: GeolocationCoordinates,
  context?: Record<string, any>
): Promise<CrisisInteraction> {
  const contact = EMERGENCY_CONTACTS.find(c => c.id === contactId);
  if (!contact) {
    throw new Error(`Emergency contact not found: ${contactId}`);
  }

  const interaction: CrisisInteraction = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    action: 'emergency_call',
    contact: contact.id,
    level: 'high', // Assume high level for emergency calls
    successful: false,
    metadata: {
      contactName: contact.name,
      contactNumber: contact.number,
      location: location ? {
        lat: location.latitude,
        lng: location.longitude,
        accuracy: location.accuracy
      } : null,
      isOnline: navigator.onLine,
      ...context
    }
  };

  try {
    // Attempt to make the call/contact
    window.location.href = contact.contact;
    interaction.successful = true;

    // Emit action taken event
    window.dispatchEvent(new CustomEvent(CRISIS_EVENTS.actionTaken, {
      detail: interaction
    }));

  } catch (error) {
    logger.error('Failed to initiate emergency contact:', error);
    interaction.metadata!.error = error instanceof Error ? error.message : '[Error details unavailable]';
  }

  // Store interaction for offline sync
  await storeCrisisInteraction(interaction);

  return interaction;
}

/**
 * Log crisis interaction to IndexedDB for offline sync
 */
export async function logCrisisInteraction(
  action: string, 
  level: CrisisLevel,
  metadata?: Record<string, any>
): Promise<CrisisInteraction> {
  const interaction: CrisisInteraction = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    action,
    level,
    successful: true,
    metadata: {
      userAgent: navigator.userAgent,
      isOnline: navigator.onLine,
      ...metadata
    }
  };

  await storeCrisisInteraction(interaction);

  // Emit action taken event
  window.dispatchEvent(new CustomEvent(CRISIS_EVENTS.actionTaken, {
    detail: interaction
  }));

  return interaction;
}

/**
 * Get location for emergency services
 */
export function getEmergencyLocation(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      (_error) => reject(_error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // Cache for 5 minutes
      }
    );
  });
}

/**
 * Get crisis level configuration
 */
export function getCrisisLevelConfig(level: CrisisLevel): CrisisLevelConfig {
  return CRISIS_LEVELS[level];
}

/**
 * Check if crisis level should auto-escalate
 */
export function shouldAutoEscalate(level: CrisisLevel): boolean {
  return CRISIS_LEVELS[level].autoEscalate;
}

/**
 * Get response time limit for crisis level
 */
export function getResponseTimeLimit(level: CrisisLevel): number {
  return CRISIS_LEVELS[level].maxResponseTime;
}

/**
 * Get appropriate emergency contacts for crisis level
 */
export function getRecommendedContacts(level: CrisisLevel): EmergencyContact[] {
  const __config = CRISIS_LEVELS[level];
  
  if (level === 'critical') {
    return EMERGENCY_CONTACTS.filter(c => c.priority <= 2);
  } else if (level === 'high') {
    return EMERGENCY_CONTACTS.filter(c => c.priority <= 3);
  } else {
    return EMERGENCY_CONTACTS;
  }
}

/**
 * Store crisis assessment in IndexedDB
 */
async function storeCrisisAssessment(_assessment: CrisisAssessment): Promise<void> {
  try {
    const db = await openCrisisDB();
    const tx = db.transaction('assessments', 'readwrite');
    await tx.objectStore('assessments').add(_assessment);
  } catch {
    logger.error('Failed to store crisis _assessment:');
    // Fallback to localStorage
    try {
      const _stored = localStorage.getItem(CRISIS_STORAGE_KEYS.lastAssessment) || '[]';
      const assessments = JSON.parse(_stored);
      assessments.push(_assessment);
      // Keep only last 50 assessments
      const _trimmed = assessments.slice(-50);
      localStorage.setItem(CRISIS_STORAGE_KEYS.lastAssessment, JSON.stringify(_trimmed));
    } catch {
    logger.error('Failed to store _assessment in localStorage:', fallbackError);
    }
  }
}

/**
 * Store crisis interaction in IndexedDB
 */
async function storeCrisisInteraction(interaction: CrisisInteraction): Promise<void> {
  try {
    const db = await openCrisisDB();
    const tx = db.transaction('interactions', 'readwrite');
    await tx.objectStore('interactions').add(interaction);
  } catch {
    logger.error('Failed to store crisis interaction:');
    // Fallback to localStorage
    try {
      const _stored = localStorage.getItem(CRISIS_STORAGE_KEYS.interactions) || '[]';
      const interactions = JSON.parse(_stored);
      interactions.push(interaction);
      // Keep only last 100 interactions
      const _trimmed = interactions.slice(-100);
      localStorage.setItem(CRISIS_STORAGE_KEYS.interactions, JSON.stringify(_trimmed));
    } catch {
    logger.error('Failed to store interaction in localStorage:', fallbackError);
    }
  }
}

/**
 * Open IndexedDB for crisis data
 */
function openCrisisDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CrisisDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create assessments store
      if (!db.objectStoreNames.contains('assessments')) {
        const assessmentStore = db.createObjectStore('assessments', { 
          keyPath: 'id' 
        });
        assessmentStore.createIndex('timestamp', 'timestamp');
        assessmentStore.createIndex('level', 'level');
      }
      
      // Create interactions store
      if (!db.objectStoreNames.contains('interactions')) {
        const interactionStore = db.createObjectStore('interactions', { 
          keyPath: 'id' 
        });
        interactionStore.createIndex('timestamp', 'timestamp');
        interactionStore.createIndex('action', 'action');
        interactionStore.createIndex('level', 'level');
      }
      
      // Create safety plans store
      if (!db.objectStoreNames.contains('safetyPlans')) {
        db.createObjectStore('safetyPlans', { 
          keyPath: 'id' 
        });
      }
    };
  });
}

/**
 * Generate unique ID for crisis records
 */
function generateId(): string {
  return `crisis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get recent crisis assessments
 */
export async function getRecentAssessments(limit: number = 10): Promise<CrisisAssessment[]> {
  try {
    const db = await openCrisisDB();
    const tx = db.transaction('assessments', 'readonly');
    const store = tx.objectStore('assessments');
    const index = store.index('timestamp');
    
    const assessments: CrisisAssessment[] = [];
    const request = index.openCursor(null, 'prev'); // Most recent first
    
    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && assessments.length < limit) {
          assessments.push(cursor.value);
          cursor.continue();
        } else {
          resolve(_assessments);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    logger.error('Failed to get recent assessments:');
    // Fallback to localStorage
    try {
      const _stored = localStorage.getItem(CRISIS_STORAGE_KEYS.lastAssessment) || '[]';
      const assessments = JSON.parse(_stored);
      return assessments.slice(-limit).reverse();
    } catch {
    logger.error('Failed to get assessments from localStorage:', fallbackError);
      return [];
    }
  }
}

/**
 * Get crisis trend analysis
 */
export async function getCrisisTrends(days: number = 7): Promise<{
  averageLevel: number;
  trendDirection: 'improving' | 'stable' | 'worsening';
  totalAssessments: number;
  criticalIncidents: number;
}> {
  const assessments = await getRecentAssessments(100);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const recentAssessments = assessments.filter(a => 
    new Date(a.timestamp) > cutoffDate
  );
  
  if (recentAssessments.length === 0) {
    return {
      averageLevel: 1,
      trendDirection: 'stable',
      totalAssessments: 0,
      criticalIncidents: 0
    };
  }

  // Convert levels to numbers for analysis
  const levelToNumber = {
    safe: 1,
    low: 2,
    moderate: 3,
    high: 4,
    critical: 5
  };

  const levelNumbers = recentAssessments.map(a => levelToNumber[a.level]);
  const averageLevel = levelNumbers.reduce((sum, level) => sum + level, 0) / levelNumbers.length;
  
  // Calculate trend (compare first half to second half)
  const midpoint = Math.floor(levelNumbers.length / 2);
  const firstHalf = levelNumbers.slice(0, midpoint);
  const secondHalf = levelNumbers.slice(_midpoint);
  
  const firstAvg = firstHalf.reduce((sum, level) => sum + level, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, level) => sum + level, 0) / secondHalf.length;
  
  let trendDirection: 'improving' | 'stable' | 'worsening';
  const difference = secondAvg - firstAvg;
  
  if (difference > 0.3) {
    trendDirection = 'worsening';
  } else if (difference < -0.3) {
    trendDirection = 'improving';
  } else {
    trendDirection = 'stable';
  }

  const criticalIncidents = recentAssessments.filter(a => 
    a.level === 'critical' || a.level === 'high'
  ).length;

  return {
    averageLevel,
    trendDirection,
    totalAssessments: recentAssessments.length,
    criticalIncidents
  };
}