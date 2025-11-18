import { Platform } from 'react-native';
import AppleHealthKit, {
    HealthKitPermissions,
    HealthValue,
    HealthValueOptions,
} from 'react-native-health';
import { APIService } from './APIService';

// Dynamically import Health Connect for Android (optional)
let HealthConnect: any = null;
try {
  if (Platform.OS === 'android') {
    HealthConnect = require('react-native-health-connect');
  }
} catch (error) {
  // Silently fail - Health Connect not available on this device/setup
  // This is expected and handled gracefully in the UI
}

export interface HealthDataPoint {
  dataType: 'heart_rate' | 'hrv' | 'steps' | 'sleep' | 'activity' | 'mindful_minutes' | 'resting_heart_rate' | 'blood_oxygen';
  value: number;
  unit: string;
  timestamp: string;
  source: string;
}

export interface HealthDataSummary {
  heartRate?: {
    average: number;
    min: number;
    max: number;
    latest: number;
  };
  hrv?: {
    average: number;
    latest: number;
  };
  steps?: {
    total: number;
    average: number;
  };
  sleep?: {
    totalHours: number;
    average: number;
  };
  lastSyncTime?: string;
}

class HealthKitService {
  private isInitialized = false;
  private syncInterval: NodeJS.Timeout | null = null;

  // HealthKit permissions we want to request
  private permissions: HealthKitPermissions = {
    permissions: {
      read: [
        AppleHealthKit.Constants.Permissions.HeartRate,
        AppleHealthKit.Constants.Permissions.HeartRateVariability,
        AppleHealthKit.Constants.Permissions.Steps,
        AppleHealthKit.Constants.Permissions.SleepAnalysis,
        AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
        AppleHealthKit.Constants.Permissions.RestingHeartRate,
        AppleHealthKit.Constants.Permissions.MindfulSession,
      ],
      write: [], // We don't need to write health data
    },
  };

  /**
   * Initialize Health services (HealthKit on iOS, Health Connect on Android)
   */
  async initialize(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      // iOS: Use HealthKit
      return new Promise((resolve) => {
        AppleHealthKit.initHealthKit(this.permissions, (error: string) => {
          if (error) {
            console.error('Error initializing HealthKit:', error);
            this.isInitialized = false;
            resolve(false);
          } else {
            console.log('HealthKit initialized successfully');
            this.isInitialized = true;
            resolve(true);
          }
        });
      });
    } else if (Platform.OS === 'android') {
      // Android: Use Health Connect (optional - only if available)
      if (!HealthConnect) {
        console.log('Health Connect library not available. Android health tracking requires react-native-health-connect to be properly linked.');
        return false;
      }

      try {
        const status = await HealthConnect.getSdkStatus();
        if (status === HealthConnect.SdkAvailabilityStatus.SDK_AVAILABLE) {
          // Initialize Health Connect
          const isInitialized = await HealthConnect.initialize();
          
          if (isInitialized) {
            // Request permissions for all health data types
            const permissions = [
              { accessType: 'read', recordType: 'HeartRate' },
              { accessType: 'read', recordType: 'HeartRateVariabilityRmssd' },
              { accessType: 'read', recordType: 'Steps' },
              { accessType: 'read', recordType: 'SleepSession' },
              { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
              { accessType: 'read', recordType: 'RestingHeartRate' },
            ];
            
            const granted = await HealthConnect.requestPermission(permissions);
            this.isInitialized = granted;
            console.log('Health Connect initialized:', granted);
            return granted;
          }
        } else {
          console.log('Health Connect not available on this device');
          return false;
        }
        return false;
      } catch (error) {
        console.error('Error initializing Health Connect:', error);
        return false;
      }
    } else {
      console.log('Health tracking not supported on this platform');
      return false;
    }
  }

  /**
   * Check if Health services are available and initialized
   */
  isAvailable(): boolean {
    return (Platform.OS === 'ios' || Platform.OS === 'android') && this.isInitialized;
  }

  /**
   * Get heart rate data from the last 24 hours
   */
  async getHeartRateData(hoursBack: number = 24): Promise<HealthDataPoint[]> {
    if (!this.isInitialized) {
      throw new Error('Health service not initialized');
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hoursBack);

    if (Platform.OS === 'ios') {
      // iOS: Use HealthKit
      return new Promise((resolve, reject) => {
        const options: HealthValueOptions = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        };

        AppleHealthKit.getHeartRateSamples(
          options,
          (err: Object, results: HealthValue[]) => {
            if (err) {
              reject(err);
              return;
            }

            const dataPoints: HealthDataPoint[] = results.map((sample) => ({
              dataType: 'heart_rate',
              value: sample.value,
              unit: 'bpm',
              timestamp: sample.startDate,
              source: sample.sourceName || 'Apple Watch',
            }));

            resolve(dataPoints);
          }
        );
      });
    } else if (Platform.OS === 'android') {
      // Android: Use Health Connect
      if (!HealthConnect) return [];
      
      try {
        const records = await HealthConnect.readRecords('HeartRate', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          },
        });

        const dataPoints: HealthDataPoint[] = records.map((record: any) => ({
          dataType: 'heart_rate',
          value: record.beatsPerMinute || record.samples?.[0]?.beatsPerMinute || 0,
          unit: 'bpm',
          timestamp: record.time || record.startTime,
          source: record.metadata?.dataOrigin?.packageName || 'Android Watch',
        }));

        return dataPoints;
      } catch (error) {
        console.error('Error reading heart rate from Health Connect:', error);
        return [];
      }
    }

    return [];
  }

  /**
   * Get Heart Rate Variability (HRV) data
   */
  async getHRVData(hoursBack: number = 24): Promise<HealthDataPoint[]> {
    if (!this.isInitialized) {
      throw new Error('Health service not initialized');
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hoursBack);

    if (Platform.OS === 'ios') {
      // iOS: Use HealthKit
      return new Promise((resolve, reject) => {
        const options: HealthValueOptions = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        };

        AppleHealthKit.getHeartRateVariabilitySamples(
          options,
          (err: Object, results: HealthValue[]) => {
            if (err) {
              reject(err);
              return;
            }

            const dataPoints: HealthDataPoint[] = results.map((sample) => ({
              dataType: 'hrv',
              value: sample.value,
              unit: 'ms',
              timestamp: sample.startDate,
              source: sample.sourceName || 'Apple Watch',
            }));

            resolve(dataPoints);
          }
        );
      });
    } else if (Platform.OS === 'android') {
      // Android: Use Health Connect
      if (!HealthConnect) return [];
      
      try {
        const records = await HealthConnect.readRecords('HeartRateVariabilityRmssd', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          },
        });

        const dataPoints: HealthDataPoint[] = records.map((record: any) => ({
          dataType: 'hrv',
          value: record.heartRateVariabilityMillis || 0,
          unit: 'ms',
          timestamp: record.time || record.startTime,
          source: record.metadata?.dataOrigin?.packageName || 'Android Watch',
        }));

        return dataPoints;
      } catch (error) {
        console.error('Error reading HRV from Health Connect:', error);
        return [];
      }
    }

    return [];
  }

  /**
   * Get steps data
   */
  async getStepsData(daysBack: number = 7): Promise<HealthDataPoint[]> {
    if (!this.isInitialized) {
      throw new Error('Health service not initialized');
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    if (Platform.OS === 'ios') {
      // iOS: Use HealthKit
      return new Promise((resolve, reject) => {
        const options: HealthValueOptions = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        };

        AppleHealthKit.getStepCount(
          options,
          (err: Object, results: HealthValue) => {
            if (err) {
              reject(err);
              return;
            }

            const dataPoint: HealthDataPoint = {
              dataType: 'steps',
              value: results.value,
              unit: 'count',
              timestamp: new Date().toISOString(),
              source: 'iPhone',
            };

            resolve([dataPoint]);
          }
        );
      });
    } else if (Platform.OS === 'android') {
      // Android: Use Health Connect
      if (!HealthConnect) return [];
      
      try {
        const records = await HealthConnect.readRecords('Steps', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          },
        });

        // Aggregate steps by day
        const dailySteps: { [key: string]: number } = {};
        records.forEach((record: any) => {
          const date = new Date(record.startTime).toDateString();
          dailySteps[date] = (dailySteps[date] || 0) + (record.count || 0);
        });

        const dataPoints: HealthDataPoint[] = Object.entries(dailySteps).map(([date, count]) => ({
          dataType: 'steps',
          value: count,
          unit: 'count',
          timestamp: new Date(date).toISOString(),
          source: 'Android Phone/Watch',
        }));

        return dataPoints;
      } catch (error) {
        console.error('Error reading steps from Health Connect:', error);
        return [];
      }
    }

    return [];
  }

  /**
   * Get sleep analysis data
   */
  async getSleepData(daysBack: number = 7): Promise<HealthDataPoint[]> {
    if (!this.isInitialized) {
      throw new Error('Health service not initialized');
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    if (Platform.OS === 'ios') {
      // iOS: Use HealthKit
      return new Promise((resolve, reject) => {
        const options: HealthValueOptions = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        };

        AppleHealthKit.getSleepSamples(
          options,
          (err: Object, results: any[]) => {
            if (err) {
              reject(err);
              return;
            }

            const dataPoints: HealthDataPoint[] = results.map((sample) => {
              const duration = (new Date(sample.endDate).getTime() - new Date(sample.startDate).getTime()) / (1000 * 60 * 60); // hours
              return {
                dataType: 'sleep',
                value: duration,
                unit: 'hours',
                timestamp: sample.startDate,
                source: sample.sourceName || 'iPhone',
              };
            });

            resolve(dataPoints);
          }
        );
      });
    } else if (Platform.OS === 'android') {
      // Android: Use Health Connect
      if (!HealthConnect) return [];
      
      try {
        const records = await HealthConnect.readRecords('SleepSession', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          },
        });

        const dataPoints: HealthDataPoint[] = records.map((record: any) => {
          const duration = (new Date(record.endTime).getTime() - new Date(record.startTime).getTime()) / (1000 * 60 * 60); // hours
          return {
            dataType: 'sleep',
            value: duration,
            unit: 'hours',
            timestamp: record.startTime,
            source: record.metadata?.dataOrigin?.packageName || 'Android Watch',
          };
        });

        return dataPoints;
      } catch (error) {
        console.error('Error reading sleep from Health Connect:', error);
        return [];
      }
    }

    return [];
  }

  /**
   * Get resting heart rate
   */
  async getRestingHeartRate(): Promise<HealthDataPoint | null> {
    if (!this.isInitialized) {
      throw new Error('HealthKit not initialized');
    }

    return new Promise((resolve, reject) => {
      AppleHealthKit.getRestingHeartRate(
        null,
        (err: Object, results: HealthValue) => {
          if (err) {
            reject(err);
            return;
          }

          if (!results) {
            resolve(null);
            return;
          }

          const dataPoint: HealthDataPoint = {
            dataType: 'resting_heart_rate',
            value: results.value,
            unit: 'bpm',
            timestamp: results.startDate || new Date().toISOString(),
            source: 'Apple Watch',
          };

          resolve(dataPoint);
        }
      );
    });
  }

  /**
   * Collect all available health data
   */
  async collectAllHealthData(): Promise<HealthDataPoint[]> {
    const allData: HealthDataPoint[] = [];

    try {
      // Get heart rate data (last 24 hours)
      const heartRate = await this.getHeartRateData(24);
      allData.push(...heartRate);

      // Get HRV data (last 24 hours)
      const hrv = await this.getHRVData(24);
      allData.push(...hrv);

      // Get steps (last 7 days)
      const steps = await this.getStepsData(7);
      allData.push(...steps);

      // Get sleep data (last 7 days)
      const sleep = await this.getSleepData(7);
      allData.push(...sleep);

      // Get resting heart rate
      const restingHR = await this.getRestingHeartRate();
      if (restingHR) {
        allData.push(restingHR);
      }

      return allData;
    } catch (error) {
      console.error('Error collecting health data:', error);
      throw error;
    }
  }

  /**
   * Sync health data to backend
   */
  async syncToBackend(): Promise<boolean> {
    try {
      const healthData = await this.collectAllHealthData();

      if (healthData.length === 0) {
        console.log('No health data to sync');
        return true;
      }

      const response = await APIService.post('/health-data/sync', {
        data: healthData,
        syncedAt: new Date().toISOString(),
      });

      console.log(`Synced ${healthData.length} health data points to backend`);
      return response.success;
    } catch (error) {
      console.error('Error syncing health data to backend:', error);
      return false;
    }
  }

  /**
   * Get health data summary from backend
   */
  async getHealthSummary(daysBack: number = 7): Promise<HealthDataSummary | null> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const response = await APIService.get('/health-data/summary', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      return response.data as HealthDataSummary;
    } catch (error) {
      console.error('Error fetching health summary:', error);
      return null;
    }
  }

  /**
   * Start automatic syncing at regular intervals
   */
  startAutoSync(intervalMinutes: number = 30): void {
    if (this.syncInterval) {
      this.stopAutoSync();
    }

    // Sync immediately
    this.syncToBackend();

    // Then sync at regular intervals
    this.syncInterval = setInterval(() => {
      this.syncToBackend();
    }, intervalMinutes * 60 * 1000);

    console.log(`Auto-sync started (every ${intervalMinutes} minutes)`);
  }

  /**
   * Stop automatic syncing
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Auto-sync stopped');
    }
  }

  /**
   * Delete all user health data from backend
   */
  async deleteAllHealthData(): Promise<boolean> {
    try {
      const response = await APIService.delete('/health-data');
      return response.success;
    } catch (error) {
      console.error('Error deleting health data:', error);
      return false;
    }
  }
}

export default new HealthKitService();

