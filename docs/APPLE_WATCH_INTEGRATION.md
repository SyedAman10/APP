# Cross-Platform Health Tracking Integration

## Overview
The LMN8 app now integrates with **both iOS (Apple Health/HealthKit)** and **Android (Health Connect)** to collect health metrics that provide deeper insights into users' mental wellness. This feature works with:
- 📱 **iOS**: Apple Watch & iPhone via HealthKit
- 🤖 **Android**: Samsung Galaxy Watch, Wear OS watches, & Android phones via Health Connect

Track heart rate, HRV, sleep patterns, activity levels, and more across all devices!

## Features

### Health Metrics Tracked
- **Heart Rate**: Real-time and average heart rate monitoring
- **Heart Rate Variability (HRV)**: Key indicator of stress and recovery
- **Steps & Activity**: Daily activity tracking
- **Sleep Analysis**: Sleep duration and quality
- **Resting Heart Rate**: Baseline cardiovascular health
- **Mindful Minutes**: Meditation and mindfulness tracking

### Privacy & Security
- ✅ All data is encrypted in transit and at rest
- ✅ Users maintain full control over their data
- ✅ Can disconnect and delete all synced data anytime
- ✅ Transparent about what data is collected and why

## Architecture

### Frontend Components

1. **HealthKitService** (`services/HealthKitService.ts`)
   - Interfaces with Apple HealthKit APIs
   - Collects health data from device
   - Handles permissions and initialization
   - Manages auto-sync functionality

2. **HealthKitContext** (`contexts/HealthKitContext.tsx`)
   - Global state management for health data
   - Auto-sync every 30 minutes when enabled
   - Persists user preferences
   - Provides hooks for components to access health data

3. **AppleWatchSettings** (`components/AppleWatchSettings.tsx`)
   - Beautiful UI component for settings screen
   - Toggle to enable/disable integration
   - View health summary cards
   - Manual sync button
   - Delete health data option

### Platform Support

| Platform | Service | Watches Supported |
|----------|---------|-------------------|
| iOS | HealthKit | Apple Watch (all models) |
| Android | Health Connect | Samsung Galaxy Watch, Wear OS watches, Fitbit |

### Backend Requirements

The backend needs to implement these endpoints:

1. **POST /api/health-data/sync**
   - Accepts bulk upload of health data points
   - Request body:
   ```json
   {
     "data": [
       {
         "dataType": "heart_rate",
         "value": 72,
         "unit": "bpm",
         "timestamp": "2025-10-27T10:30:00Z",
         "source": "Apple Watch"
       }
     ],
     "syncedAt": "2025-10-27T10:35:00Z"
   }
   ```

2. **GET /api/health-data/summary**
   - Query params: `startDate`, `endDate`
   - Returns aggregated health metrics
   - Response:
   ```json
   {
     "heartRate": {
       "average": 72,
       "min": 58,
       "max": 145,
       "latest": 68
     },
     "hrv": {
       "average": 45,
       "latest": 48
     },
     "steps": {
       "total": 42000,
       "average": 6000
     },
     "sleep": {
       "totalHours": 49,
       "average": 7.2
     },
     "lastSyncTime": "2025-10-27T10:35:00Z"
   }
   ```

3. **GET /api/health-data**
   - Query params: `startDate`, `endDate`, `dataType`
   - Returns detailed health data points

4. **DELETE /api/health-data**
   - Deletes all health data for the authenticated user
   - Maintains user privacy and data control

### Database Schema

```sql
CREATE TABLE health_data_sync (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  data_type VARCHAR(50) NOT NULL,  -- heart_rate, hrv, steps, etc.
  value NUMERIC NOT NULL,
  unit VARCHAR(20) NOT NULL,       -- bpm, ms, count, hours
  timestamp TIMESTAMP NOT NULL,     -- when the data was recorded
  synced_at TIMESTAMP NOT NULL,     -- when uploaded to backend
  source VARCHAR(50),               -- "Apple Watch", "iPhone"
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, data_type, timestamp)  -- Prevent duplicates
);

CREATE INDEX idx_health_data_user_time ON health_data_sync(user_id, timestamp DESC);
CREATE INDEX idx_health_data_type ON health_data_sync(user_id, data_type);
```

## Setup Instructions

### iOS Configuration

1. **Permissions are already configured** in `app.json`:
   - HealthKit entitlements enabled
   - Health share usage description added
   - Background fetch enabled for auto-sync

2. **Build the app**:
   ```bash
   npx expo prebuild --platform ios
   npx expo run:ios
   ```

### Android Configuration

1. **Permissions are already configured** in `app.json`:
   - Health Connect permissions for heart rate, HRV, steps, sleep
   - Background delivery enabled for auto-sync

2. **Health Connect Requirements**:
   - Android 14 (API 34) or higher recommended
   - Health Connect app must be installed (pre-installed on most devices)
   - Users can download from Play Store if not available

3. **Build the app**:
   ```bash
   npx expo prebuild --platform android
   npx expo run:android
   ```

### Testing

- **iOS**: Requires physical device (HealthKit doesn't work on simulator)
- **Android**: Can test on emulator with Health Connect, but real watch data needs physical device

## Usage

### For Users

**iOS:**
1. Go to **Settings** → **Health Tracking**
2. Toggle on "Enable Apple Health Sync"
3. Grant permissions when prompted by iOS
4. Health data will auto-sync every 30 minutes
5. View health insights in the settings card

**Android:**
1. Go to **Settings** → **Health Tracking**
2. Toggle on "Enable Health Connect Sync"
3. Grant permissions in Health Connect app
4. Health data will auto-sync every 30 minutes
5. View health insights in the settings card

### For Developers

```typescript
import { useHealthKit } from '@/contexts/HealthKitContext';

function MyComponent() {
  const {
    isEnabled,
    healthSummary,
    enableHealthKit,
    syncNow,
  } = useHealthKit();
  
  // Enable HealthKit
  const handleEnable = async () => {
    const success = await enableHealthKit();
    if (success) {
      console.log('HealthKit enabled!');
    }
  };
  
  // Manual sync
  const handleSync = async () => {
    await syncNow();
  };
  
  // Display health summary
  return (
    <View>
      {healthSummary?.heartRate && (
        <Text>Avg HR: {healthSummary.heartRate.average} bpm</Text>
      )}
    </View>
  );
}
```

## Therapeutic Use Cases

### Correlation with Mental Health
- **High resting heart rate** → May indicate stress or anxiety
- **Low HRV** → Associated with depression, burnout
- **Poor sleep quality** → Directly impacts mental health
- **Low activity levels** → Common in depression
- **Heart rate spikes** → May correlate with panic attacks or stress events

### AI Insights
The backend AI can analyze health data alongside:
- Journal entries
- Voice stress detection
- Chat conversations
- Mood patterns

This provides clinicians with a holistic view of the patient's wellness.

## Security Considerations

1. **Data Encryption**: All health data is encrypted in transit (HTTPS) and at rest
2. **User Consent**: Explicit consent required before any data collection
3. **Data Minimization**: Only collect necessary health metrics
4. **Right to Delete**: Users can delete all synced data anytime
5. **HIPAA Compliance**: Ensure backend follows HIPAA guidelines for PHI

## Future Enhancements

- [ ] Real-time alerts for abnormal patterns (e.g., elevated heart rate for extended periods)
- [ ] Correlation charts between health metrics and mood
- [ ] Integration with journal entries (show heart rate during journaling)
- [ ] Predictive analytics for mental health episodes
- [ ] Export health reports for clinicians
- [ ] Support for more metrics (blood oxygen, ECG, respiratory rate)
- [x] ✅ Android support via Health Connect (COMPLETED!)
- [ ] Support for Fitbit devices on Android
- [ ] Support for Garmin watches

## Testing

### Test on Real Device
HealthKit only works on **physical iOS devices**, not simulators.

### Test Flow
1. Enable Apple Health integration
2. Verify permissions prompt appears
3. Check that data syncs to backend
4. View health summary cards
5. Test manual sync
6. Test delete functionality
7. Disable and re-enable to verify state persistence

## Troubleshooting

### iOS Issues

**"HealthKit not available"**
- Only works on iOS devices (not simulators)
- Ensure device has Health app installed

**"Failed to initialize HealthKit"**
- Check that permissions are configured in app.json
- Rebuild the app: `npx expo prebuild --clean`
- Verify bundle identifier matches

**"No health data shown"**
- Ensure Apple Watch is paired and syncing
- Open Health app and verify data is present
- Try manual sync in settings

### Android Issues

**"Health Connect not available"**
- Requires Android 14+ (or Health Connect app installed)
- Download Health Connect from Google Play Store
- Ensure permissions are granted

**"Failed to initialize Health Connect"**
- Check that permissions are configured in app.json
- Rebuild the app: `npx expo prebuild --clean`
- Open Health Connect app and verify it's working

**"No health data shown"**
- Ensure Android watch is paired and syncing
- Open Health Connect app and verify data is present
- Check that watch app is syncing to Health Connect
- Try manual sync in settings

### Backend sync failures
- Check API endpoint URLs in Config.ts
- Verify authentication token is valid
- Check backend logs for errors

## Dependencies

- `react-native-health`: ^0.x.x - Apple HealthKit bridge (iOS)
- `react-native-health-connect`: ^0.x.x - Android Health Connect bridge
- `@react-native-async-storage/async-storage`: State persistence
- Expo SDK 53.x

## Resources

- [Apple HealthKit Documentation](https://developer.apple.com/documentation/healthkit)
- [react-native-health Library](https://github.com/agencyenterprise/react-native-health)
- [HIPAA Guidelines for Health Apps](https://www.hhs.gov/hipaa/for-professionals/index.html)

