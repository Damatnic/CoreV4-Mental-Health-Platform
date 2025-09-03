/**
 * Integration Services Export
 * Central export point for all integration services
 */

// Import services
import { dataIntegrationService, _IntegrationEvent } from './DataIntegrationService';
import { realtimeSyncService, _RealtimeEvent } from './RealtimeSyncService';
import { crisisIntegrationService, _CrisisEventType, _CrisisSeverity } from './CrisisIntegrationService';
import { logger } from '../../utils/logger';

// Core integration services
export { 
  dataIntegrationService,
  useDataIntegration,
  _IntegrationEvent
} from './DataIntegrationService';

export {
  realtimeSyncService,
  useRealtimeSync,
  _RealtimeEvent
} from './RealtimeSyncService';

export {
  crisisIntegrationService,
  useCrisisIntegration,
  _CrisisEventType,
  _CrisisSeverity
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
    logger.info('Crisis monitoring initialized:', crisisStatus);
    
    return {
      success: true,
      services: {
        realtime: realtimeSyncService.getConnectionState(),
        integration: dataIntegrationService.getState(),
        crisis: crisisStatus
      }
    };
  } catch (error) {
    logger.error('Failed to initialize integration services:');
    return {
      success: false,
      undefined
    };
  }
};

export const __cleanupIntegration = () => {
  // Cleanup all services
  realtimeSyncService.disconnect();
  dataIntegrationService.cleanup();
  crisisIntegrationService.cleanup();
};