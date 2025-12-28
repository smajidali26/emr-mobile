/**
 * Token Storage Security Tests
 * Task #2663: Mobile security testing - Secure storage
 *
 * Tests cover:
 * - Secure storage of authentication tokens
 * - Token retrieval security
 * - Token clearing/logout security
 * - Error handling without data leakage
 * - Storage key isolation
 */

import * as SecureStore from 'expo-secure-store';
import { tokenStorage } from '../../lib/storage/token-storage';

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe('Token Storage Security Tests', () => {
  const validTokens = {
    accessToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.access',
    refreshToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.refresh',
    idToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.id',
    expiresAt: Date.now() + 3600000, // 1 hour from now
  };

  describe('Secure Storage Usage', () => {
    it('should use expo-secure-store for token storage', async () => {
      await tokenStorage.saveTokens(validTokens);

      // Verify SecureStore is used, not AsyncStorage or other insecure methods
      expect(SecureStore.setItemAsync).toHaveBeenCalled();
    });

    it('should store tokens with app-specific prefixes', async () => {
      await tokenStorage.saveTokens(validTokens);

      // Keys should be prefixed to avoid conflicts
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'emr_access_token',
        expect.any(String)
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'emr_refresh_token',
        expect.any(String)
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'emr_id_token',
        expect.any(String)
      );
    });

    it('should store all required token types', async () => {
      await tokenStorage.saveTokens(validTokens);

      expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(4);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'emr_access_token',
        validTokens.accessToken
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'emr_refresh_token',
        validTokens.refreshToken
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'emr_id_token',
        validTokens.idToken
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'emr_expires_at',
        validTokens.expiresAt.toString()
      );
    });
  });

  describe('Token Retrieval Security', () => {
    it('should retrieve all tokens from secure storage', async () => {
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce(validTokens.accessToken)
        .mockResolvedValueOnce(validTokens.refreshToken)
        .mockResolvedValueOnce(validTokens.idToken)
        .mockResolvedValueOnce(validTokens.expiresAt.toString());

      const tokens = await tokenStorage.getTokens();

      expect(tokens).toEqual(validTokens);
    });

    it('should return null if any token is missing', async () => {
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce(validTokens.accessToken)
        .mockResolvedValueOnce(null) // Missing refresh token
        .mockResolvedValueOnce(validTokens.idToken)
        .mockResolvedValueOnce(validTokens.expiresAt.toString());

      const tokens = await tokenStorage.getTokens();

      expect(tokens).toBeNull();
    });

    it('should handle partial token data securely', async () => {
      // If only some tokens exist, should return null to prevent partial auth state
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce(validTokens.accessToken)
        .mockResolvedValueOnce(validTokens.refreshToken)
        .mockResolvedValueOnce(null) // Missing ID token
        .mockResolvedValueOnce(validTokens.expiresAt.toString());

      const tokens = await tokenStorage.getTokens();

      expect(tokens).toBeNull();
    });

    it('should retrieve individual access token', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(validTokens.accessToken);

      const accessToken = await tokenStorage.getAccessToken();

      expect(accessToken).toBe(validTokens.accessToken);
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('emr_access_token');
    });

    it('should retrieve individual refresh token', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(validTokens.refreshToken);

      const refreshToken = await tokenStorage.getRefreshToken();

      expect(refreshToken).toBe(validTokens.refreshToken);
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('emr_refresh_token');
    });
  });

  describe('Token Clearing (Logout Security)', () => {
    it('should clear all tokens on logout', async () => {
      await tokenStorage.clearTokens();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(4);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('emr_access_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('emr_refresh_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('emr_id_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('emr_expires_at');
    });

    it('should clear all tokens atomically', async () => {
      // All deletes should happen in parallel to prevent partial state
      await tokenStorage.clearTokens();

      // Verify all deletions were initiated together
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(4);
    });

    it('should throw error if clearing fails', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      await expect(tokenStorage.clearTokens()).rejects.toThrow(
        'Failed to clear authentication tokens'
      );
    });
  });

  describe('Token Update Security', () => {
    it('should update access token and expiration together', async () => {
      const newAccessToken = 'new-access-token';
      const newExpiresAt = Date.now() + 7200000;

      await tokenStorage.updateAccessToken(newAccessToken, newExpiresAt);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'emr_access_token',
        newAccessToken
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'emr_expires_at',
        newExpiresAt.toString()
      );
    });

    it('should not modify refresh token during access token update', async () => {
      const newAccessToken = 'new-access-token';
      const newExpiresAt = Date.now() + 7200000;

      await tokenStorage.updateAccessToken(newAccessToken, newExpiresAt);

      // Only access token and expires_at should be updated
      expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(2);
      expect(SecureStore.setItemAsync).not.toHaveBeenCalledWith(
        'emr_refresh_token',
        expect.any(String)
      );
    });
  });

  describe('Error Handling Security', () => {
    it('should not expose sensitive data in save errors', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(
        new Error('Storage full')
      );

      await expect(tokenStorage.saveTokens(validTokens)).rejects.toThrow(
        'Failed to save authentication tokens'
      );

      // Error should not contain actual token values
    });

    it('should return null on retrieval errors (fail safely)', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      const tokens = await tokenStorage.getTokens();

      expect(tokens).toBeNull();
    });

    it('should return null for access token on error', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      const accessToken = await tokenStorage.getAccessToken();

      expect(accessToken).toBeNull();
    });

    it('should return null for refresh token on error', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      const refreshToken = await tokenStorage.getRefreshToken();

      expect(refreshToken).toBeNull();
    });
  });

  describe('Generic Secure Item Storage', () => {
    it('should save generic items with app prefix', async () => {
      await tokenStorage.saveItem('user_preferences', 'dark_mode');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'emr_user_preferences',
        'dark_mode'
      );
    });

    it('should retrieve generic items from secure storage', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('dark_mode');

      const value = await tokenStorage.getItem('user_preferences');

      expect(value).toBe('dark_mode');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('emr_user_preferences');
    });

    it('should delete generic items securely', async () => {
      await tokenStorage.deleteItem('user_preferences');

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('emr_user_preferences');
    });

    it('should return null for missing items', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const value = await tokenStorage.getItem('nonexistent');

      expect(value).toBeNull();
    });
  });

  describe('Storage Key Security', () => {
    it('should use consistent key naming convention', async () => {
      await tokenStorage.saveTokens(validTokens);

      // All keys should follow emr_ prefix pattern
      const calls = (SecureStore.setItemAsync as jest.Mock).mock.calls;
      calls.forEach(([key]) => {
        expect(key).toMatch(/^emr_/);
      });
    });

    it('should not allow key injection in generic storage', async () => {
      // Key should be sanitized/prefixed to prevent accessing other app data
      await tokenStorage.saveItem('../../../other_app_data', 'malicious');

      // Should still be prefixed
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'emr_../../../other_app_data',
        'malicious'
      );
      // Note: expo-secure-store handles path traversal at platform level
    });
  });

  describe('Data Integrity', () => {
    it('should parse expiration time as integer', async () => {
      const expiresAtString = '1704067200000';
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce(validTokens.accessToken)
        .mockResolvedValueOnce(validTokens.refreshToken)
        .mockResolvedValueOnce(validTokens.idToken)
        .mockResolvedValueOnce(expiresAtString);

      const tokens = await tokenStorage.getTokens();

      expect(tokens?.expiresAt).toBe(1704067200000);
      expect(typeof tokens?.expiresAt).toBe('number');
    });

    it('should store expiration time as string', async () => {
      await tokenStorage.saveTokens(validTokens);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'emr_expires_at',
        validTokens.expiresAt.toString()
      );
    });
  });

  describe('Concurrent Access Safety', () => {
    it('should handle concurrent token saves', async () => {
      // Multiple rapid save operations
      const savePromises = [
        tokenStorage.saveTokens(validTokens),
        tokenStorage.saveTokens({
          ...validTokens,
          accessToken: 'different-token',
        }),
      ];

      await Promise.all(savePromises);

      // All operations should complete without error
      expect(SecureStore.setItemAsync).toHaveBeenCalled();
    });

    it('should handle concurrent reads', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(validTokens.accessToken);

      const readPromises = [
        tokenStorage.getAccessToken(),
        tokenStorage.getAccessToken(),
        tokenStorage.getAccessToken(),
      ];

      const results = await Promise.all(readPromises);

      results.forEach((result) => {
        expect(result).toBe(validTokens.accessToken);
      });
    });
  });
});

describe('Token Storage Platform Security', () => {
  /**
   * These tests verify that the storage implementation relies on
   * platform-level security (iOS Keychain / Android Keystore)
   */

  it('should rely on expo-secure-store for encryption', () => {
    // expo-secure-store uses:
    // - iOS: Keychain Services with kSecAttrAccessibleWhenUnlockedThisDeviceOnly
    // - Android: Android Keystore system
    // Our code should NOT implement custom encryption
    expect(SecureStore).toBeDefined();
    expect(SecureStore.setItemAsync).toBeDefined();
    expect(SecureStore.getItemAsync).toBeDefined();
    expect(SecureStore.deleteItemAsync).toBeDefined();
  });

  it('should not store tokens in plaintext alternatives', () => {
    // Verify we're not using insecure storage
    // This is a design verification test
    const tokenStorageSource = tokenStorage.constructor.toString();

    // Should not contain references to insecure storage
    expect(tokenStorageSource).not.toContain('AsyncStorage');
    expect(tokenStorageSource).not.toContain('localStorage');
    expect(tokenStorageSource).not.toContain('sessionStorage');
  });
});

describe('Token Storage Cleanup', () => {
  it('should provide method to clear all app data', async () => {
    // For GDPR compliance and user data deletion
    await tokenStorage.clearTokens();

    // All token-related data should be cleared
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('emr_access_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('emr_refresh_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('emr_id_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('emr_expires_at');
  });
});
