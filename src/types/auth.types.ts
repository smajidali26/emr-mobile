/**
 * Authentication Types
 * Defines types for Azure AD B2C authentication
 */

export interface User {
  id: string;
  email: string;
  name: string;
  givenName?: string;
  familyName?: string;
  roles: string[];
  tenantId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresAt: number;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AzureB2CConfig {
  tenantName: string;
  tenantId: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  authorityDomain: string;
  signInPolicy: string;
  signUpPolicy?: string;
  resetPasswordPolicy?: string;
}

export interface AuthError {
  code: string;
  message: string;
  details?: unknown;
}

export interface BiometricAuthConfig {
  enabled: boolean;
  promptMessage: string;
  cancelLabel: string;
  disableDeviceFallback?: boolean;
}

export interface UserRegistration {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserPreferences {
  biometricEnabled: boolean;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  theme: ThemeMode;
  language: string;
}

export interface UserProfile extends User {
  phoneNumber?: string;
  profilePictureUrl?: string;
  dateOfBirth?: string;
  preferences: UserPreferences;
}
