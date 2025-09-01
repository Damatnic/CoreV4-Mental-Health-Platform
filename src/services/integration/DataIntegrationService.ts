/**
 * Core Data Integration Service
 * Manages data flow and synchronization between all components
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useWellnessStore } from '../../stores/wellnessStore';
import { useActivityStore } from '../../stores/activityStore';
import { useAccessibilityStore } from '../../stores/accessibilityStore';
import { WebSocketService } from '../websocket/WebSocketService';
import { User } from '../api/types';
import { EventEmitter } from 'events';

// Integration event types
export enum IntegrationEvent {
  // Data sync events
  STORE_SYNC_STARTED = 'store:sync:started',
  STORE_SYNC_COMPLETED = 'store:sync:completed',
  STORE_SYNC_FAILED = 'store:sync:failed',
  
  // Cross-feature events
  MOOD_UPDATED = 'mood:updated',
  CRISIS_TRIGGERED = 'crisis:triggered',
  GOAL_ACHIEVED = 'goal:achieved',
  THERAPY_SESSION_COMPLETED = 'therapy:completed',
  MEDICATION_TAKEN = 'medication:taken',
  COMMUNITY_INTERACTION = 'community:interaction',
  
  // Real-time events
  REALTIME_CONNECTED = 'realtime:connected',
  REALTIME_DISCONNECTED = 'realtime:disconnected',
  REALTIME_MESSAGE = 'realtime:message',
  
  // System events
  OFFLINE_MODE_ENABLED = 'offline:enabled',
  OFFLINE_MODE_DISABLED = 'offline:disabled',
  DATA_PERSISTED = 'data:persisted',
  DATA_RESTORED = 'data:restored'
}

// Data flow configuration
interface DataFlowConfig {
  enableRealtime: boolean;
  enableOfflineSync: boolean;
  syncInterval: number; // milliseconds
  retryAttempts: number;
  batchSize: number;
}

// Integration state
interface IntegrationState {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncErrors: Error[];
  pendingChanges: Map<string, any>;
  dataFlowConfig: DataFlowConfig;
}

// Cross-component data mapping
interface DataMapping {
  source: string;
  target: string;
  transform?: (data: any) => any;
  filter?: (data: any) => boolean;
  bidirectional?: boolean;
}

class DataIntegrationService extends EventEmitter {
  private static instance: DataIntegrationService;
  private wsService: WebSocketService | null = null;
  private state: IntegrationState;
  private dataMappings: DataMapping[] = [];
  private syncTimer: NodeJS.Timeout | null = null;
  private offlineQueue: Map<string, any> = new Map();
  
  private constructor() {
    super();
    
    this.state = {
      isConnected: false,
      isSyncing: false,
      lastSyncTime: null,
      syncErrors: [],
      pendingChanges: new Map(),
      dataFlowConfig: {
        enableRealtime: true,
        enableOfflineSync: true,
        syncInterval: 30000, // 30 seconds
        retryAttempts: 3,
        batchSize: 50
      }
    };
    
    this.initializeDataMappings();
    this.setupStoreSubscriptions();
    this.initializeWebSocket();
    this.startPeriodicSync();
  }
  
  public static getInstance(): DataIntegrationService {
    if (!DataIntegrationService.instance) {
      DataIntegrationService.instance = new DataIntegrationService();
    }
    return DataIntegrationService.instance;
  }
  
  /**
   * Initialize data mappings between components
   */
  private initializeDataMappings() {
    this.dataMappings = [
      // Mood to Crisis mapping
      {
        source: 'wellness.mood',
        target: 'crisis.riskAssessment',
        transform: (moodData) => ({
          riskLevel: this.calculateRiskFromMood(moodData),
          timestamp: new Date(),
          factors: moodData.triggers || []
        }),
        filter: (moodData) => moodData.moodScore <= 3
      },
      
      // Activity to Wellness mapping
      {
        source: 'activity.completed',
        target: 'wellness.metrics',
        transform: (activity) => ({
          activityType: activity.type,
          moodImpact: activity.actualMoodImpact,
          completedAt: activity.completedAt
        }),
        bidirectional: false
      },
      
      // Therapy to Goals mapping
      {
        source: 'therapy.homework',
        target: 'activity.tasks',
        transform: (homework) => ({
          title: homework.title,
          type: 'therapy',
          therapyHomework: true,
          linkedGoalId: homework.goalId
        }),
        bidirectional: true
      },
      
      // Community to Wellness mapping
      {
        source: 'community.interaction',
        target: 'wellness.socialMetrics',
        transform: (interaction) => ({
          type: interaction.type,
          timestamp: interaction.timestamp,
          positiveImpact: interaction.sentiment > 0
        })
      },
      
      // Crisis to Professional Care mapping
      {
        source: 'crisis.event',
        target: 'professional.alerts',
        transform: (crisisEvent) => ({
          severity: crisisEvent.severity,
          timestamp: crisisEvent.timestamp,
          requiresImmediate: crisisEvent.severity === 'critical'
        }),
        filter: (crisisEvent) => crisisEvent.severity !== 'low'
      }
    ];
  }
  
  /**
   * Setup store subscriptions for data flow
   */
  private setupStoreSubscriptions() {
    // Subscribe to wellness store changes
    useWellnessStore.subscribe((state) => {
      if (state.moodEntries.length > 0) {
        this.handleDataChange('wellness.mood', state.moodEntries[state.moodEntries.length - 1]);
      }
    });
    
    // Subscribe to activity store changes
    useActivityStore.subscribe((state) => {
      const completed = state.activities.filter((a: any) => a.completed && !a.synced);
      completed.forEach((activity: any) => {
        this.handleDataChange('activity.completed', activity);
      });
    });
    
    // Subscribe to accessibility store for user preferences
    useAccessibilityStore.subscribe((state) => {
      this.updateDataFlowConfig({
        enableRealtime: !state.settings.reducedMotion
      });
    });
  }
  
  /**
   * Initialize WebSocket connection for real-time features
   */
  private async initializeWebSocket() {
    if (!this.state.dataFlowConfig.enableRealtime) return;
    
    try {
      this.wsService = WebSocketService.getInstance();
      this.wsService.connect('', { 
        id: 'anonymous',
        email: 'anonymous@example.com',
        username: 'anonymous',
        role: 'patient',
        profile: {
          firstName: 'Anonymous',
          lastName: 'User',
          timezone: 'UTC'
        },
        preferences: {
          theme: 'auto',
          notifications: {
            email: false,
            push: false,
            sms: false,
            crisisAlerts: true,
            appointmentReminders: false,
            medicationReminders: false,
            communityUpdates: false
          },
          privacy: {
            profileVisibility: 'private',
            shareDataWithTherapist: false,
            anonymousMode: true,
            allowResearch: false
          },
          accessibility: {
            fontSize: 'medium',
            highContrast: false,
            screenReaderMode: false,
            reducedMotion: false
          }
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActive: new Date(),
        isVerified: false,
        twoFactorEnabled: false
      });
      
      // Setup WebSocket event listeners
      this.wsService.on('connect', () => {
        this.state.isConnected = true;
        this.emit(IntegrationEvent.REALTIME_CONNECTED);
        this.syncOfflineQueue();
      });
      
      this.wsService.on('disconnect', () => {
        this.state.isConnected = false;
        this.emit(IntegrationEvent.REALTIME_DISCONNECTED);
      });
      
      // Handle real-time data updates
      this.wsService.on('data:update', (data: any) => {
        this.handleRealtimeUpdate(data);
      });
      
      // Handle crisis events
      this.wsService.on('crisis:alert', (alert: any) => {
        this.handleCrisisAlert(alert);
      });
      
      // Handle community updates
      this.wsService.on('community:update', (update: any) => {
        this.handleCommunityUpdate(update);
      });
      
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      this.state.syncErrors.push(error as Error);
    }
  }
  
  /**
   * Handle data changes from stores
   */
  private handleDataChange(source: string, data: any) {
    if (!data) return;
    
    // Find relevant mappings
    const mappings = this.dataMappings.filter(m => m.source === source);
    
    mappings.forEach(mapping => {
      // Apply filter if exists
      if (mapping.filter && !mapping.filter(data)) return;
      
      // Transform data if needed
      const transformedData = mapping.transform ? mapping.transform(data) : data;
      
      // Route to target
      this.routeDataToTarget(mapping.target, transformedData);
      
      // Handle bidirectional sync
      if (mapping.bidirectional) {
        this.syncBidirectional(mapping, transformedData);
      }
    });
    
    // Queue for persistence
    this.queueForPersistence(source, data);
    
    // Emit integration event
    this.emitDataChangeEvent(source, data);
  }
  
  /**
   * Route data to target component/store
   */
  private routeDataToTarget(target: string, data: any) {
    const [store, property] = target.split('.');
    
    if (!property) {
      console.warn('Invalid target format:', target);
      return;
    }
    
    switch (store) {
      case 'wellness':
        this.updateWellnessStore(property, data);
        break;
      case 'activity':
        this.updateActivityStore(property, data);
        break;
      case 'crisis':
        this.updateCrisisData(property, data);
        break;
      case 'professional':
        this.updateProfessionalData(property, data);
        break;
      case 'community':
        this.updateCommunityData(property, data);
        break;
      default:
        console.warn(`Unknown target store: ${store}`);
    }
  }
  
  /**
   * Update wellness store with integrated data
   */
  private updateWellnessStore(property: string, data: any) {
    const store = useWellnessStore.getState();
    
    switch (property) {
      case 'metrics':
        store.addWellnessMetric(data);
        break;
      case 'mood':
        store.addMoodEntry(data);
        break;
      case 'insights':
        // Insights are generated, not directly added
        store.generateInsights();
        break;
    }
  }
  
  /**
   * Update activity store with integrated data
   */
  private updateActivityStore(property: string, data: any) {
    const store = useActivityStore.getState();
    
    switch (property) {
      case 'tasks':
        store.addActivity(data);
        break;
      case 'goals':
        if (data.id) {
          store.updateGoal(data.id, data);
        } else {
          store.addGoal(data);
        }
        break;
    }
  }
  
  /**
   * Update crisis data
   */
  private updateCrisisData(property: string, data: any) {
    // Send to crisis service/store
    if (this.wsService && this.state.isConnected) {
      this.wsService.emit('crisis:update', { property, data });
    } else {
      this.offlineQueue.set(`crisis:${property}`, data);
    }
  }
  
  /**
   * Update professional care data
   */
  private updateProfessionalData(property: string, data: any) {
    // Send to professional care service
    if (this.wsService && this.state.isConnected) {
      this.wsService.emit('professional:update', { property, data });
    } else {
      this.offlineQueue.set(`professional:${property}`, data);
    }
  }
  
  /**
   * Update community data
   */
  private updateCommunityData(property: string, data: any) {
    // Send to community service
    if (this.wsService && this.state.isConnected) {
      this.wsService.emit('community:update', { property, data });
    } else {
      this.offlineQueue.set(`community:${property}`, data);
    }
  }
  
  /**
   * Handle real-time updates from WebSocket
   */
  private handleRealtimeUpdate(update: any) {
    const { source, data, timestamp } = update;
    
    // Check if update is newer than local data
    if (this.isNewerData(source, timestamp)) {
      this.handleDataChange(source, data);
    }
    
    this.emit(IntegrationEvent.REALTIME_MESSAGE, update);
  }
  
  /**
   * Handle crisis alerts
   */
  private handleCrisisAlert(alert: any) {
    // Immediate routing to crisis components
    this.emit(IntegrationEvent.CRISIS_TRIGGERED, alert);
    
    // Update relevant stores
    this.routeDataToTarget('crisis.alert', alert);
    this.routeDataToTarget('wellness.crisisEvent', alert);
    
    // Notify professional care if needed
    if (alert.severity === 'critical') {
      this.routeDataToTarget('professional.emergencyAlert', alert);
    }
  }
  
  /**
   * Handle community updates
   */
  private handleCommunityUpdate(update: any) {
    this.emit(IntegrationEvent.COMMUNITY_INTERACTION, update);
    this.routeDataToTarget('community.update', update);
  }
  
  /**
   * Calculate risk level from mood data
   */
  private calculateRiskFromMood(moodData: any): string {
    if (!moodData) return 'unknown';
    
    const { moodScore, triggers, stressLevel, anxietyLevel } = moodData;
    
    // Simple risk calculation (should be enhanced with ML model)
    let riskScore = 0;
    
    if (moodScore <= 2) riskScore += 3;
    else if (moodScore <= 3) riskScore += 2;
    else if (moodScore <= 4) riskScore += 1;
    
    if (stressLevel >= 8) riskScore += 2;
    else if (stressLevel >= 6) riskScore += 1;
    
    if (anxietyLevel >= 8) riskScore += 2;
    else if (anxietyLevel >= 6) riskScore += 1;
    
    if (triggers?.includes('suicidal_thoughts')) riskScore += 5;
    if (triggers?.includes('self_harm')) riskScore += 4;
    
    if (riskScore >= 7) return 'critical';
    if (riskScore >= 5) return 'high';
    if (riskScore >= 3) return 'medium';
    return 'low';
  }
  
  /**
   * Queue data for persistence
   */
  private queueForPersistence(source: string, data: any) {
    this.state.pendingChanges.set(source, {
      data,
      timestamp: new Date(),
      synced: false
    });
  }
  
  /**
   * Sync bidirectional data
   */
  private syncBidirectional(mapping: DataMapping, data: any) {
    // Implement bidirectional sync logic
    const reverseMapping = {
      source: mapping.target,
      target: mapping.source,
      transform: mapping.transform // May need reverse transform
    };
    
    // Add to sync queue
    this.queueForPersistence(`sync:${mapping.target}`, data);
  }
  
  /**
   * Check if update is newer than local data
   */
  private isNewerData(source: string, timestamp: Date): boolean {
    const lastUpdate = this.state.pendingChanges.get(source);
    if (!lastUpdate) return true;
    
    return timestamp > lastUpdate.timestamp;
  }
  
  /**
   * Emit data change event
   */
  private emitDataChangeEvent(source: string, data: any) {
    const eventMap: Record<string, IntegrationEvent> = {
      'wellness.mood': IntegrationEvent.MOOD_UPDATED,
      'activity.completed': IntegrationEvent.GOAL_ACHIEVED,
      'therapy.session': IntegrationEvent.THERAPY_SESSION_COMPLETED,
      'medication.taken': IntegrationEvent.MEDICATION_TAKEN,
      'community.interaction': IntegrationEvent.COMMUNITY_INTERACTION
    };
    
    const event = eventMap[source];
    if (event) {
      this.emit(event, data);
    }
  }
  
  /**
   * Start periodic sync
   */
  private startPeriodicSync() {
    if (!this.state.dataFlowConfig.enableOfflineSync) return;
    
    this.syncTimer = setInterval(() => {
      this.syncPendingChanges();
    }, this.state.dataFlowConfig.syncInterval);
  }
  
  /**
   * Sync pending changes
   */
  private async syncPendingChanges() {
    if (this.state.isSyncing) return;
    
    this.state.isSyncing = true;
    this.emit(IntegrationEvent.STORE_SYNC_STARTED);
    
    try {
      const changes = Array.from(this.state.pendingChanges.entries());
      const batches = this.createBatches(changes, this.state.dataFlowConfig.batchSize);
      
      for (const batch of batches) {
        await this.syncBatch(batch);
      }
      
      this.state.lastSyncTime = new Date();
      this.emit(IntegrationEvent.STORE_SYNC_COMPLETED);
      
    } catch (error) {
      console.error('Sync failed:', error);
      this.state.syncErrors.push(error as Error);
      this.emit(IntegrationEvent.STORE_SYNC_FAILED, error);
      
    } finally {
      this.state.isSyncing = false;
    }
  }
  
  /**
   * Sync a batch of changes
   */
  private async syncBatch(batch: [string, any][]): Promise<void> {
    // Implement batch sync logic
    // This would typically make an API call to sync data
    return new Promise((resolve) => {
      setTimeout(() => {
        batch.forEach(([key]) => {
          this.state.pendingChanges.delete(key);
        });
        resolve();
      }, 100);
    });
  }
  
  /**
   * Create batches from changes
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
  
  /**
   * Sync offline queue when reconnected
   */
  private async syncOfflineQueue() {
    if (this.offlineQueue.size === 0) return;
    
    const entries = Array.from(this.offlineQueue.entries());
    
    for (const [key, data] of entries) {
      try {
        const [store, property] = key.split(':');
        this.routeDataToTarget(`${store}.${property}`, data);
        this.offlineQueue.delete(key);
      } catch (error) {
        console.error(`Failed to sync offline item ${key}:`, error);
      }
    }
  }
  
  /**
   * Update data flow configuration
   */
  public updateDataFlowConfig(config: Partial<DataFlowConfig>) {
    this.state.dataFlowConfig = {
      ...this.state.dataFlowConfig,
      ...config
    };
    
    // Restart services if needed
    if (config.syncInterval !== undefined) {
      if (this.syncTimer) clearInterval(this.syncTimer);
      this.startPeriodicSync();
    }
    
    if (config.enableRealtime !== undefined) {
      if (config.enableRealtime && !this.wsService) {
        this.initializeWebSocket();
      } else if (!config.enableRealtime && this.wsService) {
        this.wsService.disconnect();
        this.wsService = null;
      }
    }
  }
  
  /**
   * Get integration state
   */
  public getState(): IntegrationState {
    return { ...this.state };
  }
  
  /**
   * Force sync all data
   */
  public async forceSync(): Promise<void> {
    await this.syncPendingChanges();
  }
  
  /**
   * Clear sync errors
   */
  public clearErrors() {
    this.state.syncErrors = [];
  }
  
  /**
   * Cleanup and disconnect
   */
  public cleanup() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    if (this.wsService) {
      this.wsService.disconnect();
    }
    
    this.removeAllListeners();
  }
}

// Export singleton instance
export const dataIntegrationService = DataIntegrationService.getInstance();

// Export hook for React components
export function useDataIntegration() {
  const service = DataIntegrationService.getInstance();
  
  return {
    forceSync: () => service.forceSync(),
    getState: () => service.getState(),
    updateConfig: (config: Partial<DataFlowConfig>) => service.updateDataFlowConfig(config),
    clearErrors: () => service.clearErrors(),
    on: (event: IntegrationEvent, callback: (...args: any[]) => void) => {
      service.on(event, callback);
      return () => service.off(event, callback);
    }
  };
}