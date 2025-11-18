# API Debugging Guide

## Console Logging Added

The app now includes comprehensive console logging for API calls to help debug URL configuration and responses.

### What Gets Logged

When you attempt to sign in, you'll see the following console output:

#### 1. API Configuration (from AuthContext)
```
🔗 API Configuration:
Base URL: https://5b54a16a5c98.ngrok-free.app
Full Login URL: https://5b54a16a5c98.ngrok-free.app/api/patient-auth/login
Environment Variable: Not set (using default)
Login Data: { username: 'user@example.com', password: '***' }
```

#### 2. API Request (from APIService)
```
🌐 Making API Request:
Method: POST
URL: https://5b54a16a5c98.ngrok-free.app/api/patient-auth/login
Headers: {
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```

#### 3. API Response (from APIService)
```
📡 API Response Received:
Status: 200
OK: true
Data: { id: "123", name: "User", ... }
```

#### 4. Processed Response (from AuthContext)
```
📡 API Response:
Success: true
Status: 200
Error: undefined
Data: { id: "123", name: "User", ... }
```

### How to Test

1. Open your app's developer console
2. Navigate to the login screen
3. Enter credentials and attempt to sign in
4. Check the console for the logged information

### Environment Variable Testing

To test with a different API URL:

1. Create a `.env` file in your project root:
```bash
EXPO_PUBLIC_API_BASE_URL=https://your-new-api.com
```

2. Restart your development server
3. The console will show:
```
Environment Variable: https://your-new-api.com
Base URL: https://your-new-api.com
Full Login URL: https://your-new-api.com/api/patient-auth/login
```

### Troubleshooting

- **If Base URL shows default**: Environment variable not set
- **If URL is wrong**: Check your `.env` file
- **If request fails**: Check the response logs for error details
- **If no logs appear**: Check that console logging is enabled in your development environment
