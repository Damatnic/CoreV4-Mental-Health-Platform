/**
 * Integration Services Export
 * Central export point for all integration services
 */

// Import services
import { dataIntegrationService, IntegrationEvent } from './DataIntegrationService';
import { realtimeSyncService, RealtimeEvent } from './RealtimeSyncService';
import { crisisIntegrationService, CrisisEventType, CrisisSeverity } from './CrisisIntegrationService';
import { logger } from '../../utils/logger';

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
    await realtimeSyncService.connect({ _userId: userId, token });
    
    // Start data integration monitoring
    dataIntegrationService.forceSync();
    
    // Initialize crisis monitoring
    const crisisStatus = crisisIntegrationService.getCrisisStatus();
    logger.info('Crisis monitoring initialized:', JSON.stringify(crisisStatus));
    
    return {
      success: true,
      services: {
        realtime: realtimeSyncService.getConnectionState(),
        integration: dataIntegrationService.getState(),
        crisis: crisisStatus
      }
    };
  } catch (error) {
    logger.error('Failed to initialize integration services:', (error as Error).message);
    return {
      success: false,
      error: (error as Error).message
    };
  }
};

export const __cleanupIntegration = () => {
  // Cleanup all services
  realtimeSyncService.disconnect();
  dataIntegrationService.cleanup();
  crisisIntegrationService.cleanup();
};