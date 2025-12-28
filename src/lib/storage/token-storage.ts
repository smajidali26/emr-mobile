/**
 * Token Storage
 * Secure storage for authentication tokens using expo-secure-store
 */

import * as SecureStore from 'expo-secure-store';
import { AuthTokens } from '../../types/auth.types';
import { secureLogger } from '../utils/secure-logger';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'emr_access_token',
  REFRESH_TOKEN: 'emr_refresh_token',
  ID_TOKEN: 'emr_id_token',
  EXPIRES_AT: 'emr_expires_at',
} as const;

class TokenStorage {
  /**
   * Saves authentication tokens to secure storage
   */
  async saveTokens(tokens: AuthTokens): Promise<void> {
    try {
      await Promise.all([
        SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken),
        SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
        SecureStore.setItemAsync(STORAGE_KEYS.ID_TOKEN, tokens.idToken),
        SecureStore.setItemAsync(STORAGE_KEYS.EXPIRES_AT, tokens.expiresAt.toString()),
      ]);
    } catch (error) {
      secureLogger.error('Failed to save tokens:', error);
      throw new Error('Failed to save authentication tokens');
    }
  }

  /**
   * Retrieves authentication tokens from secure storage
   */
  async getTokens(): Promise<AuthTokens | null> {
    try {
      const [accessToken, refreshToken, idToken, expiresAt] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
        SecureStore.getItemAsync(STORAGE_KEYS.ID_TOKEN),
        SecureStore.getItemAsync(STORAGE_KEYS.EXPIRES_AT),
      ]);

      if (!accessToken || !refreshToken || !idToken || !expiresAt) {
        return null;
      }

      return {
        accessToken,
        refreshToken,
        idToken,
        expiresAt: parseInt(expiresAt, 10),
      };
    } catch (error) {
      secureLogger.error('Failed to retrieve tokens:', error);
      return null;
    }
  }

  /**
   * Retrieves the access token from secure storage
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      secureLogger.error('Failed to retrieve access token:', error);
      return null;
    }
  }

  /**
   * Retrieves the refresh token from secure storage
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      secureLogger.error('Failed to retrieve refresh token:', error);
      return null;
    }
  }

  /**
   * Clears all authentication tokens from secure storage
   */
  async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
        SecureStore.deleteItemAsync(STORAGE_KEYS.ID_TOKEN),
        SecureStore.deleteItemAsync(STORAGE_KEYS.EXPIRES_AT),
      ]);
    } catch (error) {
      secureLogger.error('Failed to clear tokens:', error);
      throw new Error('Failed to clear authentication tokens');
    }
  }

  /**
   * Updates only the access token (useful after token refresh)
   */
  async updateAccessToken(accessToken: string, expiresAt: number): Promise<void> {
    try {
      await Promise.all([
        SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
        SecureStore.setItemAsync(STORAGE_KEYS.EXPIRES_AT, expiresAt.toString()),
      ]);
    } catch (error) {
      secureLogger.error('Failed to update access token:', error);
      throw new Error('Failed to update access token');
    }
  }

  /**
   * Saves a generic item to secure storage
   */
  async saveItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(`emr_${key}`, value);
    } catch (error) {
      secureLogger.error(`Failed to save ${key}:`, error);
      throw new Error(`Failed to save ${key}`);
    }
  }

  /**
   * Retrieves a generic item from secure storage
   */
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(`emr_${key}`);
    } catch (error) {
      secureLogger.error(`Failed to retrieve ${key}:`, error);
      return null;
    }
  }

  /**
   * Deletes a generic item from secure storage
   */
  async deleteItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(`emr_${key}`);
    } catch (error) {
      secureLogger.error(`Failed to delete ${key}:`, error);
      throw new Error(`Failed to delete ${key}`);
    }
  }
}

export const tokenStorage = new TokenStorage();
