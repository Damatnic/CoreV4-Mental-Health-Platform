/**
 * Integration Services Export
 * Central export point for all integration services
 */

// Import services
import { dataIntegrationService, IntegrationEvent } from './DataIntegrationService';
import { realtimeSyncService, RealtimeEvent } from './RealtimeSyncService';
import { crisisIntegrationService, CrisisEventType, CrisisSeverity } from './CrisisIntegrationService';

// Core integration services
export { 
  dataIntegrationService,
  useDataIntegration,
  IntegrationEvent
} from './DataIntegrationService';

export {
  realtimeSyncService,
  useRealtimeSync,
  RealtimeEvent
} from './RealtimeSyncService';

export {
  crisisIntegrationService,
  useCrisisIntegration,
  CrisisEventType,
  CrisisSeverity
} from './CrisisIntegrationService';

// Integration utilities
export const initializeIntegration = async (userId: string, token: string) => {
  try {
    // Initialize real-time connection
    await realtimeSyncService.connect({ userId, token });
    
    // Start data integration monitoring
    dataIntegrationService.forceSync();
    
    // Initialize crisis monitoring
    const crisisStatus = crisisIntegrationService.getCrisisStatus();
    console.log('Crisis monitoring initialized:', crisisStatus);
    
    return {
      success: true,
      services: {
        realtime: realtimeSyncService.getConnectionState(),
        integration: dataIntegrationService.getState(),
        crisis: crisisStatus
      }
    };
  } catch (error) {
    console.error('Failed to initialize integration services:', error);
    return {
      success: false,
      error
    };
  }
};

export const cleanupIntegration = () => {
  // Cleanup all services
  realtimeSyncService.disconnect();
  dataIntegrationService.cleanup();
  crisisIntegrationService.cleanup();
};