import HealthKitService, { HealthDataSummary } from '@/services/HealthKitService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface HealthKitContextType {
  isEnabled: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  healthSummary: HealthDataSummary | null;
  lastSyncTime: Date | null;
  enableHealthKit: () => Promise<boolean>;
  disableHealthKit: () => Promise<void>;
  syncNow: () => Promise<boolean>;
  refreshSummary: () => Promise<void>;
  deleteAllData: () => Promise<boolean>;
}

const HealthKitContext = createContext<HealthKitContextType | undefined>(undefined);

const HEALTHKIT_ENABLED_KEY = '@healthkit_enabled';
const HEALTHKIT_LAST_SYNC_KEY = '@healthkit_last_sync';

export const HealthKitProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [healthSummary, setHealthSummary] = useState<HealthDataSummary | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Load saved settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Auto-sync when enabled
  useEffect(() => {
    if (isEnabled && isInitialized) {
      HealthKitService.startAutoSync(30); // Sync every 30 minutes
      syncNow(); // Initial sync
    } else {
      HealthKitService.stopAutoSync();
    }

    return () => {
      HealthKitService.stopAutoSync();
    };
  }, [isEnabled, isInitialized]);

  const loadSettings = async () => {
    try {
      // Check both iOS and Android
      const enabled = await AsyncStorage.getItem(HEALTHKIT_ENABLED_KEY);
      const lastSync = await AsyncStorage.getItem(HEALTHKIT_LAST_SYNC_KEY);

      if (enabled === 'true') {
        // Try to initialize health service (iOS or Android)
        try {
          const initialized = await HealthKitService.initialize();
          setIsInitialized(initialized);
          
          if (initialized) {
            setIsEnabled(true);

            if (lastSync) {
              setLastSyncTime(new Date(lastSync));
            }

            // Load health summary
            await refreshSummary();
          } else {
            // If initialization failed, clear the enabled state silently
            await AsyncStorage.removeItem(HEALTHKIT_ENABLED_KEY);
          }
        } catch (initError) {
          // Silently fail if Health Connect not available - user will see option to enable
          await AsyncStorage.removeItem(HEALTHKIT_ENABLED_KEY);
        }
      }
    } catch (error) {
      // Clear potentially corrupted state
      await AsyncStorage.removeItem(HEALTHKIT_ENABLED_KEY);
    }
  };

  const enableHealthKit = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Initialize HealthKit and request permissions
      const initialized = await HealthKitService.initialize();
      
      if (initialized) {
        setIsInitialized(true);
        setIsEnabled(true);
        await AsyncStorage.setItem(HEALTHKIT_ENABLED_KEY, 'true');
        
        // Perform initial sync
        await syncNow();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error enabling HealthKit:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const disableHealthKit = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Stop auto-sync
      HealthKitService.stopAutoSync();
      
      // Update state
      setIsEnabled(false);
      setHealthSummary(null);
      setLastSyncTime(null);
      
      // Clear saved settings
      await AsyncStorage.removeItem(HEALTHKIT_ENABLED_KEY);
      await AsyncStorage.removeItem(HEALTHKIT_LAST_SYNC_KEY);
    } catch (error) {
      console.error('Error disabling HealthKit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const syncNow = async (): Promise<boolean> => {
    if (!isInitialized) {
      console.log('HealthKit not initialized, cannot sync');
      return false;
    }

    setIsLoading(true);
    try {
      const success = await HealthKitService.syncToBackend();
      
      if (success) {
        const now = new Date();
        setLastSyncTime(now);
        await AsyncStorage.setItem(HEALTHKIT_LAST_SYNC_KEY, now.toISOString());
        
        // Refresh summary after sync
        await refreshSummary();
      }
      
      return success;
    } catch (error) {
      console.error('Error syncing health data:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSummary = async (): Promise<void> => {
    if (!isInitialized) {
      return;
    }

    try {
      const summary = await HealthKitService.getHealthSummary(7);
      if (summary) {
        setHealthSummary(summary);
      }
    } catch (error) {
      console.error('Error refreshing health summary:', error);
    }
  };

  const deleteAllData = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await HealthKitService.deleteAllHealthData();
      
      if (success) {
        setHealthSummary(null);
        setLastSyncTime(null);
        await AsyncStorage.removeItem(HEALTHKIT_LAST_SYNC_KEY);
      }
      
      return success;
    } catch (error) {
      console.error('Error deleting health data:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value: HealthKitContextType = {
    isEnabled,
    isInitialized,
    isLoading,
    healthSummary,
    lastSyncTime,
    enableHealthKit,
    disableHealthKit,
    syncNow,
    refreshSummary,
    deleteAllData,
  };

  return <HealthKitContext.Provider value={value}>{children}</HealthKitContext.Provider>;
};

export const useHealthKit = (): HealthKitContextType => {
  const context = useContext(HealthKitContext);
  if (context === undefined) {
    throw new Error('useHealthKit must be used within a HealthKitProvider');
  }
  return context;
};

