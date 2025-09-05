// Core API Service with comprehensive error handling and retry logic
// Implements HIPAA-compliant data transmission and caching strategies
// SECURITY: Updated to use secure token storage

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { secureStorage } from '../security/SecureLocalStorage';
import { logger } from '../../utils/logger';
import { 
  ApiResponse, 
  ApiError, 
  User, 
  LoginRequest, 
  LoginResponse,
  RegisterRequest,
  MoodEntry,
  CrisisSession,
  Appointment,
  SafetyPlan,
  Therapist,
  CommunityPost,
  SupportGroup
} from './types';

// API Configuration - Updated for secure backend
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Version': '4.0.0',
    'X-Platform': 'CoreV4-Web'
  }
};

// Error codes for different scenarios
export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTH_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER_ERROR = 'SERVER_ERROR',
  MAINTENANCE = 'MAINTENANCE',
  CRISIS_ESCALATION = 'CRISIS_ESCALATION',
  HIPAA_VIOLATION = 'HIPAA_VIOLATION'
}

// Custom error class for API errors
export class ApiServiceError extends Error {
  constructor(
    public code: ErrorCode,
    public override message: string,
    public details?: unknown,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ApiServiceError';
  }
}

// Main API Service Class
export class ApiService {
  private static instance: ApiService;
  private axiosInstance: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenRefreshPromise: Promise<void> | null = null;

  private constructor() {
    this.axiosInstance = this.createAxiosInstance();
    this.setupInterceptors();
    this.loadTokensFromStorage();
  }

  // Singleton pattern for API service
  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Create configured axios instance
  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: API_CONFIG.headers,
    });
  }

  // Setup request and response interceptors
  private setupInterceptors(): void {
    // Request interceptor for authentication
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (this.accessToken && !config.headers['Skip-Auth']) {
          config.headers['Authorization'] = `Bearer ${this.accessToken}`;
        }
        
        // Add request tracking for audit logs (HIPAA compliance)
        config.headers['X-Request-ID'] = this.generateRequestId();
        config.headers['X-Request-Time'] = new Date().toISOString();
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Log successful API calls for audit (without sensitive data)
        this.logApiCall(response.config, response.status);
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        
        // Handle 401 errors (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            await this.refreshAccessToken();
            return this.axiosInstance(originalRequest);
          } catch (refreshErr) {
            this.handleLogout();
            throw new ApiServiceError(
              ErrorCode.AUTHENTICATION_ERROR,
              'Session expired. Please log in again.',
              refreshErr instanceof Error ? refreshErr : new Error('Token refresh failed')
            );
          }
        }

        // Log failed API calls for audit
        this.logApiCall(originalRequest, error.response?.status || 0, error.message);
        
        throw this.handleApiError(error);
      }
    );
  }

  // Generate unique request ID for tracking
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Log API calls for HIPAA audit compliance
  private logApiCall(config: AxiosRequestConfig, status: number, error?: string): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: config.method,
      url: config.url,
      status,
      error,
      userId: this.getCurrentUserId(),
      requestId: config.headers?.['X-Request-ID'],
    };
    
    // In production, send to secure logging service
    if (import.meta.env.PROD) {
      // TODO: Implement secure logging service integration
      logger.debug('API Audit Log', 'ApiService', logEntry);
    }
  }

  // Handle different types of API errors
  private handleApiError(error: AxiosError): ApiServiceError {
    if (!error.response) {
      // Network error
      return new ApiServiceError(
        ErrorCode.NETWORK_ERROR,
        'Unable to connect to the server. Please check your internet connection.',
        error.message
      );
    }

    const status = error.response.status;
    const data = error.response.data as { message?: string; errors?: any; retryAfter?: number; estimatedTime?: number };

    switch (status) {
      case 400:
        return new ApiServiceError(
          ErrorCode.VALIDATION_ERROR,
          data?.message || 'Invalid request data.',
          data?.errors,
          status
        );
      
      case 401:
        return new ApiServiceError(
          ErrorCode.AUTHENTICATION_ERROR,
          'Authentication required.',
          null,
          status
        );
      
      case 403:
        return new ApiServiceError(
          ErrorCode.AUTHENTICATION_ERROR,
          'You do not have permission to perform this action.',
          null,
          status
        );
      
      case 404:
        return new ApiServiceError(
          ErrorCode.NOT_FOUND,
          'The requested resource was not found.',
          null,
          status
        );
      
      case 429:
        return new ApiServiceError(
          ErrorCode.RATE_LIMIT,
          'Too many requests. Please try again later.',
          data?.retryAfter,
          status
        );
      
      case 503:
        return new ApiServiceError(
          ErrorCode.MAINTENANCE,
          'Service is temporarily unavailable for maintenance.',
          data?.estimatedTime,
          status
        );
      
      default:
        if (status >= 500) {
          return new ApiServiceError(
            ErrorCode.SERVER_ERROR,
            'An unexpected server error occurred. Please try again later.',
            data,
            status
          );
        }
        
        return new ApiServiceError(
          ErrorCode.SERVER_ERROR,
          data?.message || 'An unexpected error occurred.',
          data,
          status
        );
    }
  }

  // Token management methods - SECURITY: Updated to use secure storage
  private loadTokensFromStorage(): void {
    try {
      // Use secure storage for sensitive authentication tokens
      this.accessToken = secureStorage.getItem('access_token');
      this.refreshToken = secureStorage.getItem('refresh_token');
    } catch (error) {
      logger.error('Failed to load tokens from secure storage:');
    }
  }

  private saveTokensToStorage(accessToken: string, refreshToken: string): void {
    try {
      // Use secure storage for sensitive authentication tokens
      secureStorage.setItem('access_token', accessToken);
      secureStorage.setItem('refresh_token', refreshToken);
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
    } catch (error) {
      logger.error('Failed to save tokens to secure storage:');
    }
  }

  private clearTokensFromStorage(): void {
    try {
      // Use secure storage for token removal
      secureStorage.removeItem('access_token');
      secureStorage.removeItem('refresh_token');
      this.accessToken = null;
      this.refreshToken = null;
    } catch (error) {
      logger.error('Failed to clear tokens from secure storage:');
    }
  }

  private async refreshAccessToken(): Promise<void> {
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    this.tokenRefreshPromise = (async () => {
      try {
        if (!this.refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await this.axiosInstance.post('/auth/refresh', {
          refreshToken: this.refreshToken
        }, {
          headers: { 'Skip-Auth': 'true' }
        });

        const { accessToken, refreshToken } = response.data;
        this.saveTokensToStorage(accessToken, refreshToken);
      } finally {
        this.tokenRefreshPromise = null;
      }
    })();

    return this.tokenRefreshPromise;
  }

  private handleLogout(): void {
    this.clearTokensFromStorage();
    // Redirect to login page
    window.location.href = '/login';
  }

  private getCurrentUserId(): string | null {
    try {
      const _userStr = secureStorage.getItem('current_user');
      if (_userStr) {
        const _user = JSON.parse(_userStr);
        return _user.id;
      }
    } catch (error) {
      logger.error('Failed to get current _user ID:');
    }
    return null;
  }

  // Retry logic for failed requests
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    attempts: number = API_CONFIG.retryAttempts
  ): Promise<T> {
    let lastError: unknown;
    
    for (let i = 0; i < attempts; i++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        // Don't retry for certain error types
        if (error instanceof ApiServiceError) {
          if ([
            ErrorCode.AUTHENTICATION_ERROR,
            ErrorCode.VALIDATION_ERROR,
            ErrorCode.NOT_FOUND,
            ErrorCode.HIPAA_VIOLATION
          ].includes(error.code)) {
            throw error;
          }
        }
        
        // Wait before retrying (exponential backoff)
        if (i < attempts - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, API_CONFIG.retryDelay * Math.pow(2, i))
          );
        }
      }
    }
    
    throw lastError;
  }

  // ============================================
  // Authentication API Methods
  // ============================================

  public async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await this.axiosInstance.post<LoginResponse>(
        '/auth/login',
        credentials,
        { headers: { 'Skip-Auth': 'true' } }
      );
      
      const { accessToken, refreshToken, user } = response.data;
      this.saveTokensToStorage(accessToken, refreshToken);
      secureStorage.setItem('current_user', JSON.stringify(user));
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error as AxiosError);
    }
  }

  public async register(data: RegisterRequest): Promise<User> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<User>>(
        '/auth/register',
        data,
        { headers: { 'Skip-Auth': 'true' } }
      );
      
      return response.data.data!;
    } catch (error) {
      throw this.handleApiError(error as AxiosError);
    }
  }

  public async logout(): Promise<void> {
    try {
      await this.axiosInstance.post('/auth/logout');
    } catch (error) {
      logger.error('Logout error: ');
    } finally {
      this.handleLogout();
    }
  }

  // ============================================
  // User API Methods
  // ============================================

  public async getCurrentUser(): Promise<User> {
    return this.retryRequest(async () => {
      const response = await this.axiosInstance.get<ApiResponse<User>>('/users/me');
      return response.data.data!;
    });
  }

  public async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const response = await this.axiosInstance.patch<ApiResponse<User>>(
      `/users/${userId}`,
      updates
    );
    return response.data.data!;
  }

  // ============================================
  // Mental Health Data API Methods
  // ============================================

  public async getMoodEntries(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<MoodEntry[]> {
    return this.retryRequest(async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      
      const response = await this.axiosInstance.get<ApiResponse<MoodEntry[]>>(
        `/users/${userId}/mood-entries?${params}`
      );
      return response.data.data!;
    });
  }

  public async createMoodEntry(entry: Omit<MoodEntry, 'id'>): Promise<MoodEntry> {
    const response = await this.axiosInstance.post<ApiResponse<MoodEntry>>(
      '/mood-entries',
      entry
    );
    return response.data.data!;
  }

  public async getSafetyPlan(userId: string): Promise<SafetyPlan | null> {
    return this.retryRequest(async () => {
      const response = await this.axiosInstance.get<ApiResponse<SafetyPlan>>(
        `/users/${userId}/safety-plan`
      );
      return response.data.data || null;
    });
  }

  public async updateSafetyPlan(
    userId: string,
    updates: Partial<SafetyPlan>
  ): Promise<SafetyPlan> {
    const response = await this.axiosInstance.put<ApiResponse<SafetyPlan>>(
      `/users/${userId}/safety-plan`,
      updates
    );
    return response.data.data!;
  }

  // ============================================
  // Crisis Support API Methods
  // ============================================

  public async initiateCrisisSession(
    severity: CrisisSession['severity']
  ): Promise<CrisisSession> {
    const response = await this.axiosInstance.post<ApiResponse<CrisisSession>>(
      '/crisis/sessions',
      { severity, type: 'chat' }
    );
    return response.data.data!;
  }

  public async getCrisisSession(sessionId: string): Promise<CrisisSession> {
    return this.retryRequest(async () => {
      const response = await this.axiosInstance.get<ApiResponse<CrisisSession>>(
        `/crisis/sessions/${sessionId}`
      );
      return response.data.data!;
    });
  }

  public async endCrisisSession(
    sessionId: string,
    outcome: CrisisSession['outcome']
  ): Promise<CrisisSession> {
    const response = await this.axiosInstance.post<ApiResponse<CrisisSession>>(
      `/crisis/sessions/${sessionId}/end`,
      { outcome }
    );
    return response.data.data!;
  }

  // ============================================
  // Professional Support API Methods
  // ============================================

  public async searchTherapists(
    filters: {
      specializations?: string[];
      insurance?: string[];
      location?: string;
      availability?: boolean;
    }
  ): Promise<Therapist[]> {
    return this.retryRequest(async () => {
      const response = await this.axiosInstance.post<ApiResponse<Therapist[]>>(
        '/therapists/search',
        filters
      );
      return response.data.data!;
    });
  }

  public async getTherapist(therapistId: string): Promise<Therapist> {
    return this.retryRequest(async () => {
      const response = await this.axiosInstance.get<ApiResponse<Therapist>>(
        `/therapists/${therapistId}`
      );
      return response.data.data!;
    });
  }

  public async bookAppointment(
    appointmentData: Omit<Appointment, 'id'>
  ): Promise<Appointment> {
    const response = await this.axiosInstance.post<ApiResponse<Appointment>>(
      '/appointments',
      appointmentData
    );
    return response.data.data!;
  }

  public async getAppointments(
    userId: string,
    status?: Appointment['status']
  ): Promise<Appointment[]> {
    return this.retryRequest(async () => {
      const params = status ? `?status=${status}` : '';
      const response = await this.axiosInstance.get<ApiResponse<Appointment[]>>(
        `/users/${userId}/appointments${params}`
      );
      return response.data.data!;
    });
  }

  public async cancelAppointment(
    appointmentId: string,
    reason?: string
  ): Promise<Appointment> {
    const response = await this.axiosInstance.post<ApiResponse<Appointment>>(
      `/appointments/${appointmentId}/cancel`,
      { reason }
    );
    return response.data.data!;
  }

  // ============================================
  // Community API Methods
  // ============================================

  public async getCommunityPosts(
    groupId?: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<CommunityPost[]> {
    return this.retryRequest(async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString()
      });
      if (groupId) params.append('groupId', groupId);
      
      const response = await this.axiosInstance.get<ApiResponse<CommunityPost[]>>(
        `/community/posts?${params}`
      );
      return response.data.data!;
    });
  }

  public async createPost(post: Omit<CommunityPost, 'id'>): Promise<CommunityPost> {
    const response = await this.axiosInstance.post<ApiResponse<CommunityPost>>(
      '/community/posts',
      post
    );
    return response.data.data!;
  }

  public async getSupportGroups(): Promise<SupportGroup[]> {
    return this.retryRequest(async () => {
      const response = await this.axiosInstance.get<ApiResponse<SupportGroup[]>>(
        '/community/groups'
      );
      return response.data.data!;
    });
  }

  public async joinSupportGroup(groupId: string): Promise<SupportGroup> {
    const response = await this.axiosInstance.post<ApiResponse<SupportGroup>>(
      `/community/groups/${groupId}/join`
    );
    return response.data.data!;
  }

  // ============================================
  // File Upload Methods
  // ============================================

  public async uploadFile(
    file: File,
    type: 'avatar' | 'document' | 'resource'
  ): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    const response = await this.axiosInstance.post<ApiResponse<{ url: string }>>(
      '/files/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return response.data.data!.url;
  }
}

// Export singleton instance
export const _apiService = ApiService.getInstance();