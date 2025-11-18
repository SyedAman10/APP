# API Configuration Guide

## Overview

The LMN8 app uses a centralized API service system that manages all API calls through environment variables. This ensures consistent configuration across different environments (development, staging, production).

## Environment Variables

### Required Variables

Create a `.env` file in your project root with the following variables:

```bash
# AI API Configuration
EXPO_PUBLIC_AI_API_KEY=your_swiss_ai_api_key_here
EXPO_PUBLIC_AI_API_URL=https://api.publicai.co/v1
EXPO_PUBLIC_AI_MODEL=swiss-ai/apertus-8b-instruct

# Backend API Configuration
EXPO_PUBLIC_API_BASE_URL=https://your-backend-api.com
```

### Optional Variables

If not provided, the system will use these defaults:

- `EXPO_PUBLIC_AI_API_URL`: `https://api.publicai.co/v1`
- `EXPO_PUBLIC_AI_MODEL`: `swiss-ai/apertus-8b-instruct`
- `EXPO_PUBLIC_API_BASE_URL`: `https://5b54a16a5c98.ngrok-free.app` (development)

## API Services

### 1. Backend API Service (`api`)

Used for authentication and user management:

```typescript
import { api } from '@/services/APIService';

// Login
const response = await api.post('/api/patient-auth/login', {
  username: 'user@example.com',
  password: 'password'
});

// Set auth token
api.setAuthToken('your-jwt-token');

// Clear auth token
api.clearAuthToken();
```

### 2. AI API Service (`aiAPI`)

Used for AI chat completions:

```typescript
import { aiAPI } from '@/services/APIService';

// Chat completion
const response = await aiAPI.post('/chat/completions', {
  model: 'swiss-ai/apertus-8b-instruct',
  messages: [...],
  temperature: 0.7
});
```

## Configuration

### Config File (`constants/Config.ts`)

All API configuration is centralized in the Config file:

```typescript
export const Config = {
  // AI API Configuration
  AI_API_KEY: process.env.EXPO_PUBLIC_AI_API_KEY || '',
  AI_API_URL: process.env.EXPO_PUBLIC_AI_API_URL || 'https://api.publicai.co/v1',
  AI_MODEL: process.env.EXPO_PUBLIC_AI_MODEL || 'swiss-ai/apertus-8b-instruct',
  
  // Backend API Configuration
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://5b54a16a5c98.ngrok-free.app',
  
  // Other settings...
};
```

## Usage Examples

### Making API Calls

```typescript
import { api, aiAPI } from '@/services/APIService';

// Backend API call
const userResponse = await api.get('/api/user/profile');

// AI API call
const chatResponse = await aiAPI.post('/chat/completions', {
  model: 'swiss-ai/apertus-8b-instruct',
  messages: [
    { role: 'user', content: 'Hello!' }
  ]
});
```

### Error Handling

All API calls return a standardized response:

```typescript
interface APIResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
  success: boolean;
}

// Check for success
if (response.success) {
  console.log('Data:', response.data);
} else {
  console.error('Error:', response.error);
}
```

## Development Setup

1. Copy `env.example` to `.env`
2. Fill in your actual API keys and URLs
3. Restart your development server
4. The app will automatically use the new configuration

## Production Setup

1. Set environment variables in your deployment platform
2. Ensure all required variables are configured
3. The app will use production URLs automatically

## Troubleshooting

### Common Issues

1. **API calls failing**: Check that all environment variables are set correctly
2. **CORS errors**: Ensure your backend API supports CORS for your domain
3. **Authentication issues**: Verify that auth tokens are being set correctly

### Debug Mode

Enable debug logging by setting:

```bash
EXPO_PUBLIC_DEBUG=true
```

This will log all API requests and responses to the console.
