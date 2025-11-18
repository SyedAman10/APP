# Journey Themes & Playlist Support - Backend Requirements

## Overview
Journey themes allow users and clinicians to customize the therapeutic experience with predefined themes, music preferences, and scheduling. This document outlines the required backend APIs and data models.

---

## Database Schema

### 1. Journey Theme Preferences Table
```sql
CREATE TABLE journey_theme_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Theme Settings
  selected_theme VARCHAR(50) NOT NULL DEFAULT 'relief',
  -- Possible values: 'relief', 'self-exploration', 'anxiety-release', 
  --                  'mindfulness', 'gratitude', 'processing'
  
  -- Scheduling Settings
  enable_scheduling BOOLEAN DEFAULT false,
  scheduled_time VARCHAR(20), -- 'morning', 'afternoon', 'evening', 'night'
  
  -- Music Settings
  enable_background_music BOOLEAN DEFAULT false,
  
  -- Clinician Override (optional)
  clinician_recommended_theme VARCHAR(50),
  clinician_override BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id)
);
```

### 2. Music Preferences Table
```sql
CREATE TABLE music_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Music Details
  name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500), -- For uploaded files (S3/storage URL)
  external_link VARCHAR(500), -- For Spotify/YouTube/Apple Music links
  music_type VARCHAR(50) NOT NULL, -- 'file', 'spotify', 'youtube', 'apple-music'
  
  -- File Metadata (for uploads)
  file_size_bytes BIGINT,
  duration_seconds INT,
  mime_type VARCHAR(100),
  
  -- Ordering
  display_order INT DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_music_preferences_user_id ON music_preferences(user_id);
```

### 3. Theme Session History (Optional - for analytics)
```sql
CREATE TABLE theme_session_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID, -- Link to chat/therapy session
  
  theme_used VARCHAR(50) NOT NULL,
  music_played_ids UUID[], -- Array of music preference IDs
  session_start TIMESTAMP NOT NULL,
  session_end TIMESTAMP,
  
  -- Metrics
  user_rating INT, -- 1-5 rating of experience
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_theme_history_user_id ON theme_session_history(user_id);
CREATE INDEX idx_theme_history_session_id ON theme_session_history(session_id);
```

---

## API Endpoints

### 1. Get User Theme Preferences
**GET** `/api/journey-themes/preferences`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "selected_theme": "relief",
    "enable_scheduling": false,
    "scheduled_time": "morning",
    "enable_background_music": true,
    "clinician_recommended_theme": null,
    "clinician_override": false,
    "music_preferences": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Calm Ocean Waves",
        "music_type": "file",
        "file_url": "https://storage.example.com/music/ocean-waves.mp3",
        "duration_seconds": 600,
        "display_order": 0
      },
      {
        "id": "223e4567-e89b-12d3-a456-426614174001",
        "name": "Meditation Playlist",
        "music_type": "spotify",
        "external_link": "https://open.spotify.com/playlist/...",
        "display_order": 1
      }
    ],
    "created_at": "2025-10-30T10:00:00Z",
    "updated_at": "2025-10-30T12:30:00Z"
  }
}
```

---

### 2. Update Theme Preferences
**PUT** `/api/journey-themes/preferences`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "selected_theme": "anxiety-release",
  "enable_scheduling": true,
  "scheduled_time": "evening",
  "enable_background_music": true
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Theme preferences updated successfully",
  "data": {
    "selected_theme": "anxiety-release",
    "enable_scheduling": true,
    "scheduled_time": "evening",
    "enable_background_music": true,
    "updated_at": "2025-10-30T14:30:00Z"
  }
}
```

---

### 3. Upload Music File
**POST** `/api/journey-themes/music/upload`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
audio_file: <binary file>
name: "Calming Piano Music"
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Music uploaded successfully",
  "data": {
    "id": "323e4567-e89b-12d3-a456-426614174002",
    "name": "Calming Piano Music",
    "music_type": "file",
    "file_url": "https://storage.example.com/music/user123/calming-piano.mp3",
    "file_size_bytes": 5242880,
    "duration_seconds": 300,
    "mime_type": "audio/mpeg",
    "display_order": 2,
    "created_at": "2025-10-30T15:00:00Z"
  }
}
```

**Validation:**
- Max file size: 50MB
- Allowed formats: .mp3, .wav, .m4a, .aac
- Validate audio file using FFmpeg or similar

---

### 4. Add External Music Link
**POST** `/api/journey-themes/music/link`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Relaxation Spotify Playlist",
  "music_type": "spotify",
  "external_link": "https://open.spotify.com/playlist/37i9dQZF1DX..."
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Music link added successfully",
  "data": {
    "id": "423e4567-e89b-12d3-a456-426614174003",
    "name": "Relaxation Spotify Playlist",
    "music_type": "spotify",
    "external_link": "https://open.spotify.com/playlist/37i9dQZF1DX...",
    "display_order": 3,
    "created_at": "2025-10-30T15:30:00Z"
  }
}
```

**Supported Music Types:**
- `spotify`: Spotify playlist/track URLs
- `youtube`: YouTube video/playlist URLs
- `apple-music`: Apple Music links

---

### 5. Delete Music Preference
**DELETE** `/api/journey-themes/music/:music_id`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Music removed successfully"
}
```

**Note:** If `music_type` is `file`, also delete the file from cloud storage.

---

### 6. Get Available Themes (System Reference)
**GET** `/api/journey-themes/available`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "themes": [
      {
        "id": "relief",
        "name": "Relief",
        "description": "Calming sessions for stress relief and relaxation",
        "recommended_for": ["anxiety", "stress", "overwhelm"],
        "color": "#10b981"
      },
      {
        "id": "self-exploration",
        "name": "Self-Exploration",
        "description": "Discover and understand yourself better",
        "recommended_for": ["identity", "growth", "curiosity"],
        "color": "#8b5cf6"
      },
      {
        "id": "anxiety-release",
        "name": "Anxiety Release",
        "description": "Techniques to manage and reduce anxiety",
        "recommended_for": ["anxiety", "panic", "worry"],
        "color": "#f59e0b"
      },
      {
        "id": "mindfulness",
        "name": "Mindfulness",
        "description": "Present moment awareness and meditation",
        "recommended_for": ["stress", "mindfulness", "peace"],
        "color": "#06b6d4"
      },
      {
        "id": "gratitude",
        "name": "Gratitude",
        "description": "Focus on positive aspects and appreciation",
        "recommended_for": ["depression", "negativity", "hopelessness"],
        "color": "#ec4899"
      },
      {
        "id": "processing",
        "name": "Processing",
        "description": "Work through difficult emotions and experiences",
        "recommended_for": ["trauma", "grief", "processing"],
        "color": "#6366f1"
      }
    ]
  }
}
```

---

### 7. Clinician Set Recommended Theme (Clinician Portal)
**POST** `/api/clinician/patients/:patient_id/journey-themes/recommend`

**Headers:**
```
Authorization: Bearer <clinician_jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "recommended_theme": "anxiety-release",
  "override": false,
  "reason": "Patient showing progress with anxiety management techniques"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Theme recommendation updated for patient",
  "data": {
    "patient_id": "patient-uuid",
    "clinician_recommended_theme": "anxiety-release",
    "clinician_override": false,
    "updated_at": "2025-10-30T16:00:00Z"
  }
}
```

**Notes:**
- If `override: true`, the patient cannot change their theme until clinician removes override
- If `override: false`, it's just a recommendation and patient can still choose

---

### 8. Record Theme Session (Analytics)
**POST** `/api/journey-themes/session`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "session_id": "session-uuid-123",
  "theme_used": "relief",
  "music_played_ids": ["music-id-1", "music-id-2"],
  "session_start": "2025-10-30T10:00:00Z",
  "session_end": "2025-10-30T10:45:00Z",
  "user_rating": 5
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Session recorded successfully"
}
```

---

## Cloud Storage Requirements

### Music File Storage
- **Service:** AWS S3, Google Cloud Storage, or Azure Blob Storage
- **Bucket Structure:**
  ```
  music-files/
    ├── user-{user_id}/
    │   ├── {timestamp}-{filename}.mp3
    │   └── {timestamp}-{filename}.mp3
  ```
- **CDN:** Use CloudFront or similar CDN for fast delivery
- **Signed URLs:** Generate temporary signed URLs for playback security
- **Retention:** Keep files until user deletes or account is closed

### File Upload Best Practices
1. **Validation:**
   - Check file type using magic bytes (not just extension)
   - Validate audio format using FFmpeg
   - Scan for malware
   
2. **Processing:**
   - Extract duration, bitrate, sample rate
   - Optionally: normalize audio levels
   - Optionally: convert to optimized format (e.g., AAC)
   
3. **Compression:**
   - Store original + compressed version
   - Serve compressed version for mobile

---

## Integration with AI Chat System

When user starts a chat session, the AI should be aware of the selected theme:

### Chat Context Enhancement
```json
{
  "user_id": "user-123",
  "session_id": "session-456",
  "journey_theme": {
    "current_theme": "anxiety-release",
    "is_clinician_recommended": false,
    "background_music_enabled": true
  }
}
```

### AI Behavior Adaptation
The AI should adapt its responses based on the theme:
- **Relief:** Focus on calming techniques, breathing exercises, gentle guidance
- **Self-Exploration:** Ask reflective questions, encourage introspection
- **Anxiety Release:** Provide grounding techniques, validation, coping strategies
- **Mindfulness:** Guide meditation, present-moment awareness
- **Gratitude:** Encourage positive reflection, appreciation exercises
- **Processing:** Allow deeper emotional work, validation of difficult feelings

---

## Scheduling Implementation

### Background Job (Cron Job)
Run hourly to check if users need theme switching:

```python
# Pseudocode
def check_scheduled_theme_switches():
    current_hour = get_current_hour()
    
    # Get users with scheduling enabled
    users = db.query("""
        SELECT user_id, scheduled_time
        FROM journey_theme_preferences
        WHERE enable_scheduling = true
    """)
    
    for user in users:
        should_switch = check_time_window(current_hour, user.scheduled_time)
        if should_switch:
            send_push_notification(
                user.user_id,
                title="Time for your journey",
                body=f"Your {get_theme_name(user.selected_theme)} session is ready"
            )
```

### Time Windows:
- **Morning:** 6:00 - 10:00
- **Afternoon:** 12:00 - 16:00
- **Evening:** 18:00 - 21:00
- **Night:** 21:00 - 23:00

---

## Security Considerations

1. **Authentication:**
   - All endpoints require valid JWT token
   - Validate user owns resources they're accessing

2. **File Upload Security:**
   - Validate file types strictly
   - Scan uploaded files for malware
   - Limit file sizes (max 50MB)
   - Use signed URLs with expiration

3. **Rate Limiting:**
   - Music uploads: 10 per hour per user
   - Preference updates: 30 per hour per user

4. **Data Privacy:**
   - Music files are private per user
   - Don't share music preferences between users
   - Delete files on account deletion

---

## Optional Advanced Features

### 1. Music Service Integration
For Spotify, Apple Music, YouTube Music integration:
- Implement OAuth flow for each service
- Store access/refresh tokens securely
- Fetch user playlists via APIs
- Handle token refresh

### 2. Curated Playlists
Create platform-curated playlists for each theme:
```json
{
  "curated_playlists": [
    {
      "theme": "relief",
      "title": "Ocean Waves & Nature Sounds",
      "description": "Calming natural sounds",
      "file_url": "https://..."
    }
  ]
}
```

### 3. Theme Analytics Dashboard (Clinician Portal)
Show clinicians:
- Most used themes by patient
- Theme effectiveness metrics
- Time spent per theme
- User ratings per theme

---

## Testing Checklist

- [ ] User can select and save theme preferences
- [ ] User can upload music files (various formats)
- [ ] User can add external music links
- [ ] User can enable/disable scheduling
- [ ] Music files are stored securely
- [ ] Music files are deleted when user removes them
- [ ] Clinician can recommend themes
- [ ] Clinician override prevents patient theme changes
- [ ] Session history is recorded correctly
- [ ] Push notifications work for scheduled themes
- [ ] File size limits are enforced
- [ ] Invalid file types are rejected
- [ ] Rate limiting works correctly

---

## Frontend-Backend Data Flow

```
User Action: Select "Anxiety Release" Theme
    ↓
Frontend: Call PUT /api/journey-themes/preferences
    ↓
Backend: Update journey_theme_preferences table
    ↓
Backend: Return success + updated preferences
    ↓
Frontend: Update local state & show confirmation
    ↓
User starts chat session
    ↓
Frontend: Include theme context in chat API call
    ↓
Backend AI: Adapt responses based on theme
```

---

## Summary

**Required Endpoints:**
1. ✅ GET `/api/journey-themes/preferences` - Get user preferences
2. ✅ PUT `/api/journey-themes/preferences` - Update preferences
3. ✅ POST `/api/journey-themes/music/upload` - Upload music file
4. ✅ POST `/api/journey-themes/music/link` - Add external link
5. ✅ DELETE `/api/journey-themes/music/:id` - Remove music
6. ✅ GET `/api/journey-themes/available` - Get available themes
7. ✅ POST `/api/clinician/patients/:id/journey-themes/recommend` - Clinician recommendation
8. ✅ POST `/api/journey-themes/session` - Record session analytics

**Optional Endpoints:**
- Music service OAuth integration
- Curated playlists
- Analytics dashboard

---

## Questions for Clarification

1. **Music Playback:** Should music play automatically when user starts a chat session, or manual play button?
2. **Clinician Portal:** Do you want clinicians to be able to see which themes patients are using?
3. **Theme Scheduling:** Should the app switch themes automatically at scheduled times, or just send a reminder?
4. **Music Services:** Priority for integration? (Spotify, Apple Music, YouTube Music)
5. **Curated Content:** Do you want platform-provided music/sounds for each theme?

Let me know if you need any clarification or additional endpoints!

