/**
 * API Client
 * Axios-based HTTP client with authentication and error handling
 *
 * SECURITY FIX: Uses lazy initialization for API base URL validation
 * to prevent app crash at module load time
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import Constants from 'expo-constants';
import { tokenStorage } from '../storage/token-storage';
import { authService } from '../auth/auth-service';
import { ApiResponse, ApiError } from '../../types/api.types';
import { secureLogger } from '../utils/secure-logger';

/**
 * SECURITY FIX: Validate API base URL to prevent misconfiguration
 * Assigned: Derek Turner
 * Task: Throw error if API_BASE_URL contains 'example.com' or is not set in production
 *
 * ADDITIONAL FIX: Use __DEV__ for reliable production detection in React Native
 */

/**
 * Check if we're in production mode
 * Uses __DEV__ which is reliable in React Native, plus fallback checks
 */
const isProduction = (): boolean => {
  if (typeof __DEV__ !== 'undefined') {
    return !__DEV__;
  }
  return (
    process.env.NODE_ENV === 'production' ||
    Constants.expoConfig?.extra?.environment === 'production'
  );
};

/**
 * Check if a hostname is a private/internal address (SSRF protection)
 * SECURITY FIX: Prevent Server-Side Request Forgery attacks
 */
const isPrivateOrInternalHost = (hostname: string): boolean => {
  const lowerHost = hostname.toLowerCase();

  // Block localhost and loopback
  if (
    lowerHost === 'localhost' ||
    lowerHost === '127.0.0.1' ||
    lowerHost.startsWith('127.') ||
    lowerHost === '::1' ||
    lowerHost === '[::1]' ||
    lowerHost === '0.0.0.0'
  ) {
    return true;
  }

  // Block private IPv4 ranges (RFC 1918)
  // 10.0.0.0 - 10.255.255.255
  if (/^10\./.test(hostname)) {
    return true;
  }

  // 172.16.0.0 - 172.31.255.255
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) {
    return true;
  }

  // 192.168.0.0 - 192.168.255.255
  if (/^192\.168\./.test(hostname)) {
    return true;
  }

  // Block link-local addresses (169.254.x.x)
  if (/^169\.254\./.test(hostname)) {
    return true;
  }

  // Block metadata endpoints (cloud providers)
  if (
    lowerHost === '169.254.169.254' || // AWS/GCP/Azure metadata
    lowerHost === 'metadata.google.internal' ||
    lowerHost.endsWith('.internal')
  ) {
    return true;
  }

  return false;
};

/**
 * Validate a URL for security requirements
 * @throws Error if URL is invalid or doesn't meet security requirements
 */
const validateApiUrl = (url: string, context: string = 'API_BASE_URL'): string => {
  // Check if URL is not set or contains placeholder values
  if (!url || url.trim() === '') {
    throw new Error(
      `SECURITY ERROR: ${context} is not configured. Please set a valid API endpoint.`
    );
  }

  if (url.includes('example.com')) {
    throw new Error(
      `SECURITY ERROR: ${context} contains placeholder domain "example.com". ` +
      'Please configure a valid API endpoint.'
    );
  }

  // Validate URL format
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(
      `SECURITY ERROR: ${context} is not a valid URL format.`
    );
  }

  // SECURITY FIX: Block non-HTTP(S) protocols (file://, ftp://, etc.)
  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    throw new Error(
      `SECURITY ERROR: ${context} must use HTTP or HTTPS protocol. ` +
      `Received: ${parsedUrl.protocol}`
    );
  }

  // SECURITY FIX: SSRF protection - block private/internal addresses in production
  if (isProduction() && isPrivateOrInternalHost(parsedUrl.hostname)) {
    throw new Error(
      `SECURITY ERROR: ${context} cannot point to private or internal addresses in production. ` +
      'This is a security measure to prevent SSRF attacks.'
    );
  }

  // In production, require HTTPS
  if (isProduction() && parsedUrl.protocol !== 'https:') {
    throw new Error(
      `SECURITY ERROR: ${context} must use HTTPS protocol in production for secure communication.`
    );
  }

  // Warn in development about HTTP (but allow for local testing)
  if (!isProduction() && parsedUrl.protocol !== 'https:') {
    secureLogger.warn(
      `WARNING: ${context} is using insecure HTTP protocol. ` +
      'This should only be used for local development with mock data.'
    );
  }

  return url;
};

/**
 * Cached API base URL - validated lazily on first access
 */
let _cachedBaseUrl: string | null = null;
let _baseUrlError: Error | null = null;

/**
 * Get validated API base URL with lazy initialization
 * Throws error if URL is invalid (but only when accessed, not at module load)
 */
const getValidatedApiBaseUrl = (): string => {
  // Return cached error if validation previously failed
  if (_baseUrlError) {
    throw _baseUrlError;
  }

  // Return cached URL if already validated
  if (_cachedBaseUrl) {
    return _cachedBaseUrl;
  }

  try {
    const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl || 'https://api.emr.example.com';

    // Only validate strictly in production
    if (isProduction()) {
      _cachedBaseUrl = validateApiUrl(apiBaseUrl);
    } else {
      // In development, warn but allow placeholder URLs
      if (apiBaseUrl.includes('example.com')) {
        secureLogger.warn(
          'DEVELOPMENT: Using placeholder API URL. Configure a real endpoint for testing.'
        );
      }
      _cachedBaseUrl = apiBaseUrl;
    }

    return _cachedBaseUrl;
  } catch (error) {
    _baseUrlError = error instanceof Error ? error : new Error(String(error));
    throw _baseUrlError;
  }
};

const API_TIMEOUT = 30000; // 30 seconds

class ApiClient {
  private client: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;
  private _isInitialized: boolean = false;

  constructor() {
    // Create client with placeholder - actual URL set lazily on first request
    this.client = axios.create({
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Ensure client is initialized with validated base URL
   * Called lazily before first request
   */
  private ensureInitialized(): void {
    if (!this._isInitialized) {
      // This will throw in production if URL is invalid
      this.client.defaults.baseURL = getValidatedApiBaseUrl();
      this._isInitialized = true;
    }
  }

  /**
   * Sets up request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor to add auth token and validate expiry
    this.client.interceptors.request.use(
      async (config) => {
        // Get tokens from storage
        const tokens = await tokenStorage.getTokens();

        if (tokens) {
          // SECURITY FIX: Check if token is expired and proactively refresh
          if (authService.isTokenExpired(tokens.expiresAt)) {
            secureLogger.info('Token expired, refreshing before request');

            try {
              // SECURITY FIX: Robust locking with try/finally to prevent race conditions
              // Assigned: Steven Perez
              // Use shared refresh promise to prevent multiple concurrent refresh attempts
              if (!this.refreshPromise) {
                this.refreshPromise = this.performTokenRefresh(tokens.refreshToken);
              }

              const newAccessToken = await this.refreshPromise;
              config.headers.Authorization = `Bearer ${newAccessToken}`;
            } catch (error) {
              secureLogger.error('Token refresh failed in request interceptor:', error);
              await tokenStorage.clearTokens();
              return Promise.reject(error);
            } finally {
              // SECURITY FIX: Always clear refresh promise in finally block (Assigned: Steven Perez)
              // This ensures the lock is released even if an error occurs
              this.refreshPromise = null;
            }
          } else {
            config.headers.Authorization = `Bearer ${tokens.accessToken}`;
          }
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle 401 Unauthorized - token expired
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = await tokenStorage.getRefreshToken();
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            // SECURITY FIX: Robust locking with try/finally to prevent race conditions
            // Assigned: Steven Perez
            // Use shared refresh promise to prevent multiple concurrent refresh attempts
            if (!this.refreshPromise) {
              this.refreshPromise = this.performTokenRefresh(refreshToken);
            }

            const newAccessToken = await this.refreshPromise;

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }

            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            secureLogger.error('Token refresh failed in response interceptor:', refreshError);
            await tokenStorage.clearTokens();
            return Promise.reject(refreshError);
          } finally {
            // SECURITY FIX: Always clear refresh promise in finally block (Assigned: Steven Perez)
            // This ensures the lock is released even if an error occurs
            this.refreshPromise = null;
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Performs token refresh and returns new access token
   * This method is shared across all concurrent requests to prevent race conditions
   */
  private async performTokenRefresh(refreshToken: string): Promise<string> {
    try {
      const newTokens = await authService.refreshTokens(refreshToken);
      await tokenStorage.saveTokens(newTokens);
      return newTokens.accessToken;
    } catch (error) {
      secureLogger.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Handles API errors and formats them consistently
   */
  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      // Server responded with error status
      const data = error.response.data as { message?: string; errors?: ApiError[] };
      return {
        message: data?.message || 'An error occurred',
        code: error.response.status.toString(),
      };
    } else if (error.request) {
      // Request made but no response
      return {
        message: 'No response from server. Please check your connection.',
        code: 'NETWORK_ERROR',
      };
    } else {
      // Error in request setup
      return {
        message: error.message || 'An unexpected error occurred',
        code: 'REQUEST_ERROR',
      };
    }
  }

  /**
   * GET request
   */
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    this.ensureInitialized();
    const response: AxiosResponse<ApiResponse<T>> = await this.client.get(url, { params });
    return response.data.data;
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: unknown): Promise<T> {
    this.ensureInitialized();
    const response: AxiosResponse<ApiResponse<T>> = await this.client.post(url, data);
    return response.data.data;
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: unknown): Promise<T> {
    this.ensureInitialized();
    const response: AxiosResponse<ApiResponse<T>> = await this.client.put(url, data);
    return response.data.data;
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: unknown): Promise<T> {
    this.ensureInitialized();
    const response: AxiosResponse<ApiResponse<T>> = await this.client.patch(url, data);
    return response.data.data;
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string): Promise<T> {
    this.ensureInitialized();
    const response: AxiosResponse<ApiResponse<T>> = await this.client.delete(url);
    return response.data.data;
  }

  /**
   * Sets the base URL for API requests
   * SECURITY FIX: Validates the URL before setting to prevent security bypass
   */
  setBaseURL(baseURL: string): void {
    // SECURITY FIX: Validate the new URL before allowing it
    // This prevents bypassing the initial validation via setBaseURL
    if (isProduction()) {
      validateApiUrl(baseURL, 'setBaseURL');
    } else if (baseURL.includes('example.com')) {
      secureLogger.warn('WARNING: Setting API URL to placeholder domain in development mode.');
    }

    this.client.defaults.baseURL = baseURL;
    this._isInitialized = true;
  }

  /**
   * Sets a custom header
   */
  setHeader(key: string, value: string): void {
    this.client.defaults.headers.common[key] = value;
  }
}

export const apiClient = new ApiClient();
