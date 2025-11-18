import { Config } from '@/constants/Config';

export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
  success: boolean;
}

export interface APIRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export class APIService {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || Config.API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Make an API request
   */
  async request<T = any>(
    endpoint: string,
    options: APIRequestOptions = {}
  ): Promise<APIResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = 30000, // Increased timeout to 30 seconds
    } = options;

    const url = `${this.baseURL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const requestHeaders = {
      ...this.defaultHeaders,
      ...headers,
    };
    
    // Log the actual URL being called for debugging
    console.log('🌐 Making API Request:');
    console.log('Method:', method);
    console.log('URL:', url);
    console.log('Headers:', requestHeaders);

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      credentials: 'include', // Important for cookies
    };

    if (body && method !== 'GET') {
      requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseData = await response.json().catch(() => ({}));
      
      // Log the response for debugging
      console.log('📡 API Response Received:');
      console.log('Status:', response.status);
      console.log('OK:', response.ok);
      console.log('Data:', responseData);

      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          error: responseData.message || responseData.error || `HTTP ${response.status}`,
          data: responseData,
        };
      }

      return {
        success: true,
        status: response.status,
        data: responseData,
      };
    } catch (error: any) {
      console.error('API Request Error:', error);
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          status: 408,
          error: 'Request timeout',
        };
      }

      return {
        success: false,
        status: 0,
        error: error.message || 'Network error',
      };
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, headers?: Record<string, string>): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, headers });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, headers });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, headers?: Record<string, string>): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body, headers });
  }

  /**
   * Set default headers
   */
  setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  /**
   * Set authorization header
   */
  setAuthToken(token: string): void {
    this.setDefaultHeaders({ Authorization: `Bearer ${token}` });
  }

  /**
   * Clear authorization header
   */
  clearAuthToken(): void {
    const { Authorization, ...headers } = this.defaultHeaders;
    this.defaultHeaders = headers;
  }

  /**
   * Get current base URL
   */
  getBaseURL(): string {
    return this.baseURL;
  }

  /**
   * Set new base URL
   */
  setBaseURL(baseURL: string): void {
    this.baseURL = baseURL;
  }
}

// Create default API service instance
export const apiService = new APIService();

// Create AI API service instance with longer timeout
export const aiAPIService = new APIService(Config.AI_API_URL);

// Export commonly used methods for convenience
export const api = {
  get: apiService.get.bind(apiService),
  post: apiService.post.bind(apiService),
  put: apiService.put.bind(apiService),
  delete: apiService.delete.bind(apiService),
  patch: apiService.patch.bind(apiService),
  setAuthToken: apiService.setAuthToken.bind(apiService),
  clearAuthToken: apiService.clearAuthToken.bind(apiService),
};

export const aiAPI = {
  get: (endpoint: string, headers?: Record<string, string>) => 
    aiAPIService.request(endpoint, { method: 'GET', headers, timeout: 45000 }),
  post: (endpoint: string, body?: any, headers?: Record<string, string>) => 
    aiAPIService.request(endpoint, { method: 'POST', body, headers, timeout: 45000 }),
  put: (endpoint: string, body?: any, headers?: Record<string, string>) => 
    aiAPIService.request(endpoint, { method: 'PUT', body, headers, timeout: 45000 }),
  delete: (endpoint: string, headers?: Record<string, string>) => 
    aiAPIService.request(endpoint, { method: 'DELETE', headers, timeout: 45000 }),
  patch: (endpoint: string, body?: any, headers?: Record<string, string>) => 
    aiAPIService.request(endpoint, { method: 'PATCH', body, headers, timeout: 45000 }),
  setAuthToken: aiAPIService.setAuthToken.bind(aiAPIService),
  clearAuthToken: aiAPIService.clearAuthToken.bind(aiAPIService),
};

// Legacy Profile API interface (for backward compatibility)
export interface LegacyProfileData {
  idol: string;
  personality: string;
  goals: string;
  challenges: string;
  communicationStyle: string;
  interests: string;
  values: string;
  supportNeeds: string;
}

// New Onboarding Data interfaces
export interface FullTrackOnboardingData {
  inspirationFigure: string;
  inspirationQuality: string;
  actorAuthorStyle: string;
  actorAuthorTone: string;
  spiritualPractices: string;
  spiritualReflection: string;
  lifeLandscape: string;
  safePlace: string;
  strengthSymbol: string;
  sensoryAnchor: string;
  chapterTitle: string;
  strengthMoment: string;
  primaryHope: string;
  copingPattern: string;
}

export interface FastTrackOnboardingData {
  inspirationFigure: string;
  inspirationQuality: string;
  actorAuthorStyle: string;
  actorAuthorTone: string;
  spiritualPractices: string;
  spiritualReflection: string;
  chapterTitle: string;
  primaryHope: string;
}

export interface OnboardingRequest {
  inspirationFigure: string;
  inspirationQuality: string;
  actorAuthorStyle: string;
  actorAuthorTone: string;
  spiritualPractices: string;
  spiritualReflection: string;
  chapterTitle: string;
  primaryHope: string;
  lifeLandscape?: string;
  safePlace?: string;
  strengthSymbol?: string;
  sensoryAnchor?: string;
  strengthMoment?: string;
  copingPattern?: string;
  onboardingType: 'full-track' | 'fast-track';
}

export interface ProfileResponse {
  success: boolean;
  message?: string;
  profile: {
    // Legacy fields
    idol: string;
    personality: string;
    goals: string;
    challenges: string;
    communicationStyle: string;
    interests: string;
    values: string;
    supportNeeds: string;
    
    // New onboarding fields
    inspirationFigure: string;
    inspirationQuality: string;
    actorAuthorStyle: string;
    actorAuthorTone: string;
    spiritualPractices: string;
    spiritualReflection: string;
    lifeLandscape?: string;
    safePlace?: string;
    strengthSymbol?: string;
    sensoryAnchor?: string;
    chapterTitle: string;
    strengthMoment?: string;
    primaryHope: string;
    copingPattern?: string;
    onboardingType: 'full-track' | 'fast-track';
    onboardingCompletedAt: string;
    updatedAt: string;
  };
}

// Profile API methods
export const profileAPI = {
  // Complete onboarding process (POST)
  completeOnboarding: async (onboardingData: OnboardingRequest): Promise<APIResponse<ProfileResponse>> => {
    console.log('🎯 Completing onboarding:', onboardingData);
    return api.post('/api/patient-auth/profile', onboardingData);
  },
  
  // Update individual profile fields (PUT)
  updateProfile: async (profileData: Partial<OnboardingRequest>): Promise<APIResponse<ProfileResponse>> => {
    console.log('📝 Updating profile fields:', profileData);
    return api.put('/api/patient-auth/profile', profileData);
  },
  
  // Get complete profile (GET)
  getProfile: async (): Promise<APIResponse<ProfileResponse>> => {
    console.log('📖 Fetching user profile');
    return api.get('/api/patient-auth/profile');
  },
  
  // Legacy method for backward compatibility
  updateLegacyProfile: async (profileData: LegacyProfileData): Promise<APIResponse> => {
    console.log('📝 Updating legacy profile:', profileData);
    return api.put('/api/patient-auth/profile', profileData);
  },
};

// Password Reset API methods
export const passwordResetAPI = {
  // Request password reset (POST)
  requestPasswordReset: async (email: string): Promise<APIResponse> => {
    console.log('🔐 Requesting password reset for:', email);
    return api.post('/api/patient-auth/forgot-password', { email });
  },
  
  // Validate reset token (GET)
  validateResetToken: async (token: string): Promise<APIResponse> => {
    console.log('🔍 Validating reset token');
    return api.get(`/api/patient-auth/reset-password?token=${token}`);
  },
  
  // Reset password with token (POST)
  resetPassword: async (token: string, newPassword: string): Promise<APIResponse> => {
    console.log('🔑 Resetting password with token');
    return api.post('/api/patient-auth/reset-password', { token, newPassword });
  },
};

// Journal Entry interfaces
export type MediaType = 'text' | 'photo' | 'handwritten' | 'voice';

export interface JournalEntry {
  id?: string;
  title: string;
  content: string;
  mediaType: MediaType;
  mood?: number;
  mediaUrl?: string;
  transcribedText?: string;
  timestamp?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JournalEntryCreateRequest {
  title: string;
  content: string;
  mediaType: MediaType;
  mood?: number;
  mediaUrl?: string;
  transcribedText?: string;
}

export interface JournalEntryUpdateRequest {
  title?: string;
  content?: string;
  mood?: number;
  mediaUrl?: string;
  transcribedText?: string;
}

export interface JournalEntriesListResponse {
  success: boolean;
  data: JournalEntry[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface JournalEntryResponse {
  success: boolean;
  data: JournalEntry;
  message?: string;
}

// Journal API methods
export const journalAPI = {
  // Create new journal entry (POST)
  createEntry: async (entryData: JournalEntryCreateRequest): Promise<APIResponse<JournalEntryResponse>> => {
    console.log('📝 Creating journal entry:', entryData);
    return api.post('/api/backend/journal/entries', entryData);
  },
  
  // Get all journal entries (GET) - with optional pagination
  getEntries: async (page?: number, limit?: number): Promise<APIResponse<JournalEntriesListResponse>> => {
    console.log('📖 Fetching journal entries');
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page.toString());
    if (limit) queryParams.append('limit', limit.toString());
    const query = queryParams.toString();
    return api.get(`/api/backend/journal/entries${query ? `?${query}` : ''}`);
  },
  
  // Get single journal entry by ID (GET)
  getEntry: async (id: string): Promise<APIResponse<JournalEntryResponse>> => {
    console.log('📖 Fetching journal entry:', id);
    return api.get(`/api/backend/journal/entries/${id}`);
  },
  
  // Update journal entry (PUT)
  updateEntry: async (id: string, entryData: JournalEntryUpdateRequest): Promise<APIResponse<JournalEntryResponse>> => {
    console.log('✏️ Updating journal entry:', id, entryData);
    return api.put(`/api/backend/journal/entries/${id}`, entryData);
  },
  
  // Delete journal entry (DELETE)
  deleteEntry: async (id: string): Promise<APIResponse> => {
    console.log('🗑️ Deleting journal entry:', id);
    return api.delete(`/api/backend/journal/entries/${id}`);
  },
};
