/**
 * Azure AD B2C Configuration
 * Configuration for Azure AD B2C authentication
 *
 * SECURITY FIX: Uses lazy initialization to prevent app crash at module load
 * Configuration is validated on first access, allowing proper error handling
 */

import Constants from 'expo-constants';
import { AzureB2CConfig } from '../../types/auth.types';

/**
 * SECURITY FIX: Throw error in production if required env vars are missing
 * Assigned: Heather Roberts
 * Task: Add validation for AZURE_B2C_TENANT_NAME, AZURE_B2C_CLIENT_ID, and enforce in production
 *
 * ADDITIONAL FIX: Use __DEV__ for reliable production detection in React Native
 */

/**
 * Check if we're in production mode
 * Uses __DEV__ which is reliable in React Native, plus fallback checks
 */
const isProduction = (): boolean => {
  // __DEV__ is the most reliable way to detect development mode in React Native
  if (typeof __DEV__ !== 'undefined') {
    return !__DEV__;
  }
  // Fallback for environments where __DEV__ might not be available
  return (
    process.env.NODE_ENV === 'production' ||
    Constants.expoConfig?.extra?.environment === 'production'
  );
};

/**
 * Check if a value is a placeholder that shouldn't be used in production
 */
const isPlaceholderValue = (value: string): boolean => {
  const trimmed = value.trim().toLowerCase();
  return (
    !trimmed ||
    trimmed.includes('your-') ||
    trimmed.includes('example') ||
    trimmed.includes('placeholder') ||
    trimmed.includes('test-tenant') ||
    trimmed.includes('localhost')
  );
};

/**
 * Get environment variable with production validation
 * Throws error in production if required vars are missing or have placeholder values
 */
const getEnvVar = (key: string, defaultValue = '', isRequired = false): string => {
  const value = Constants.expoConfig?.extra?.[key] || defaultValue;

  // SECURITY FIX: In production, required variables must be set and cannot be placeholders
  if (isProduction() && isRequired) {
    if (isPlaceholderValue(value)) {
      throw new Error(
        `SECURITY ERROR: Required environment variable ${key} is not properly configured in production. ` +
        `Current value appears to be a placeholder. ` +
        `Please set valid values in app.json or environment configuration.`
      );
    }
  }

  return value;
};

/**
 * Cached configuration - initialized lazily on first access
 */
let _cachedConfig: AzureB2CConfig | null = null;
let _configError: Error | null = null;

/**
 * Initialize and validate the Azure B2C configuration
 * Called lazily on first access to prevent app crash at module load
 */
const initializeConfig = (): AzureB2CConfig => {
  return {
    tenantName: getEnvVar('AZURE_B2C_TENANT_NAME', 'your-tenant', true),
    tenantId: getEnvVar('AZURE_B2C_TENANT_ID', 'your-tenant-id', true),
    clientId: getEnvVar('AZURE_B2C_CLIENT_ID', 'your-client-id', true),
    redirectUri: getEnvVar('AZURE_B2C_REDIRECT_URI', 'emr://auth/callback'),
    authorityDomain: getEnvVar(
      'AZURE_B2C_AUTHORITY_DOMAIN',
      'your-tenant.b2clogin.com',
      true
    ),
    signInPolicy: getEnvVar('AZURE_B2C_SIGN_IN_POLICY', 'B2C_1_SignUpSignIn'),
    signUpPolicy: getEnvVar('AZURE_B2C_SIGN_UP_POLICY', 'B2C_1_SignUp'),
    resetPasswordPolicy: getEnvVar(
      'AZURE_B2C_RESET_PASSWORD_POLICY',
      'B2C_1_PasswordReset'
    ),
    scopes: [
      'openid',
      'profile',
      'offline_access',
      getEnvVar('AZURE_B2C_API_SCOPE', 'https://your-tenant.onmicrosoft.com/api/access', true),
    ],
  };
};

/**
 * Get the Azure B2C configuration
 * Lazily initializes and validates on first access
 * Throws error in production if configuration is invalid
 */
export const getAzureB2CConfig = (): AzureB2CConfig => {
  // Return cached error if initialization previously failed
  if (_configError) {
    throw _configError;
  }

  // Return cached config if already initialized
  if (_cachedConfig) {
    return _cachedConfig;
  }

  try {
    _cachedConfig = initializeConfig();
    return _cachedConfig;
  } catch (error) {
    _configError = error instanceof Error ? error : new Error(String(error));
    throw _configError;
  }
};

/**
 * Legacy export for backwards compatibility
 * Uses a getter to provide lazy initialization
 */
export const azureB2CConfig: AzureB2CConfig = new Proxy({} as AzureB2CConfig, {
  get(_target, prop) {
    const config = getAzureB2CConfig();
    return config[prop as keyof AzureB2CConfig];
  },
});

export const getAuthorizationEndpoint = (policy: string): string => {
  return `https://${azureB2CConfig.authorityDomain}/${azureB2CConfig.tenantName}.onmicrosoft.com/${policy}/oauth2/v2.0/authorize`;
};

export const getTokenEndpoint = (policy: string): string => {
  return `https://${azureB2CConfig.authorityDomain}/${azureB2CConfig.tenantName}.onmicrosoft.com/${policy}/oauth2/v2.0/token`;
};

export const getLogoutEndpoint = (policy: string): string => {
  return `https://${azureB2CConfig.authorityDomain}/${azureB2CConfig.tenantName}.onmicrosoft.com/${policy}/oauth2/v2.0/logout`;
};
