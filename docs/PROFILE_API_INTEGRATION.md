# Profile API Integration

## Overview

The app now integrates with the backend API to save and load user profile data from the onboarding questions. This ensures that all user responses are persisted on the server.

## API Endpoints

### Update Profile
- **Method:** `PUT`
- **URL:** `/api/patient-auth/profile`
- **Headers:** `Content-Type: application/json`
- **Body:** Profile data object

### Get Profile
- **Method:** `GET`
- **URL:** `/api/patient-auth/profile`
- **Headers:** `Content-Type: application/json`

## Profile Data Structure

```typescript
interface ProfileData {
  idol: string;
  personality: string;
  goals: string;
  challenges: string;
  communicationStyle: string;
  interests: string;
  values: string;
  supportNeeds: string;
}
```

## Integration Points

### 1. Onboarding Completion (`app/onboarding.tsx`)

When users complete the onboarding flow:

1. **Data Collection:** All 8 onboarding questions are collected
2. **API Call:** Profile data is sent to backend via `PUT /api/patient-auth/profile`
3. **Error Handling:** If API call fails, onboarding continues (graceful degradation)
4. **Success Logging:** Console logs confirm successful save

```typescript
const response = await profileAPI.updateProfile(profileData);
if (response.success) {
  console.log('✅ Profile saved successfully:', response.data);
} else {
  console.warn('⚠️ Profile save failed:', response.error);
}
```

### 2. User Login (`contexts/AuthContext.tsx`)

When users log in:

1. **Authentication:** User credentials are validated
2. **Profile Loading:** User's profile data is fetched via `GET /api/patient-auth/profile`
3. **User Object:** Profile data is attached to the user object
4. **Fallback:** If profile loading fails, user can still proceed

```typescript
const profileResponse = await profileAPI.getProfile();
if (profileResponse.success && profileResponse.data) {
  setUser(prevUser => prevUser ? { ...prevUser, profile: profileResponse.data } : null);
}
```

### 3. API Service (`services/APIService.ts`)

Centralized API methods for profile operations:

```typescript
export const profileAPI = {
  updateProfile: async (profileData: ProfileData): Promise<APIResponse> => {
    return api.put('/api/patient-auth/profile', profileData);
  },
  
  getProfile: async (): Promise<APIResponse> => {
    return api.get('/api/patient-auth/profile');
  },
};
```

## Console Logging

The integration includes comprehensive logging:

### Onboarding Completion
```
💾 Saving profile data to backend...
📝 Updating user profile: { idol: "Elon Musk", personality: "Creative...", ... }
🌐 Making API Request:
Method: PUT
URL: https://your-api.com/api/patient-auth/profile
✅ Profile saved successfully: { success: true, ... }
```

### User Login
```
📖 Loading user profile...
📖 Fetching user profile
🌐 Making API Request:
Method: GET
URL: https://your-api.com/api/patient-auth/profile
✅ Profile loaded successfully: { idol: "Elon Musk", ... }
```

## Error Handling

### Graceful Degradation
- If profile save fails during onboarding, user can still complete the flow
- If profile load fails during login, user can still access the app
- All errors are logged to console for debugging

### Error Scenarios
1. **Network Issues:** API calls timeout or fail
2. **Server Errors:** Backend returns 4xx/5xx status codes
3. **Data Validation:** Invalid profile data format
4. **Authentication:** User not properly authenticated

## Testing

### Manual Testing
1. Complete onboarding with test data
2. Check console for "Profile saved successfully" message
3. Log out and log back in
4. Check console for "Profile loaded successfully" message
5. Verify profile data is available in user object

### API Testing
```bash
# Test profile update
curl -X PUT http://localhost:3001/api/patient-auth/profile \
  -H "Content-Type: application/json" \
  -b patient_cookies.txt \
  -d '{
    "idol": "Elon Musk",
    "personality": "Creative, analytical, empathetic, determined",
    "goals": "Career success, better relationships, personal growth",
    "challenges": "Anxiety, time management, self-doubt",
    "communicationStyle": "Direct and honest, motivational",
    "interests": "Art, technology, nature, music",
    "values": "Honesty, creativity, family, growth",
    "supportNeeds": "Motivation, accountability, emotional support"
  }'

# Test profile retrieval
curl -X GET http://localhost:3001/api/patient-auth/profile \
  -H "Content-Type: application/json" \
  -b patient_cookies.txt
```

## Benefits

1. **Data Persistence:** User responses are saved to backend
2. **Cross-Device Sync:** Profile data available across devices
3. **AI Personalization:** Backend can use profile data for AI responses
4. **Analytics:** Backend can analyze user patterns and preferences
5. **Backup:** User data is safely stored on server
