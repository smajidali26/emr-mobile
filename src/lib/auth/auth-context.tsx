/**
 * Authentication Context
 * Provides authentication state and methods throughout the app
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthState, User, AuthTokens } from '../../types/auth.types';
import { authService } from './auth-service';
import { tokenStorage } from '../storage/token-storage';
import { biometricAuth } from '../storage/biometric-auth';
import { useAuthStore } from '@stores/auth-store';
import { secureLogger } from '../utils/secure-logger';

interface AuthContextValue extends AuthState {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  authenticateWithBiometric: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const setAuthStore = useAuthStore((store) => store.setAuth);
  const clearAuthStore = useAuthStore((store) => store.clearAuth);

  /**
   * Initialize authentication state from secure storage
   */
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = useCallback(async () => {
    try {
      const tokens = await tokenStorage.getTokens();

      if (tokens) {
        // Check if token is expired
        if (authService.isTokenExpired(tokens.expiresAt)) {
          // Try to refresh the token
          try {
            const newTokens = await authService.refreshTokens(tokens.refreshToken);
            await tokenStorage.saveTokens(newTokens);
            // SECURITY FIX: Use verifyAndDecodeIdToken to validate JWT signature (Assigned: Katherine Mitchell)
            const user = await authService.verifyAndDecodeIdToken(newTokens.idToken);

            setState({
              user,
              tokens: newTokens,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            setAuthStore(user, newTokens);
          } catch (error) {
            // Refresh failed, clear tokens
            await tokenStorage.clearTokens();
            setState({
              user: null,
              tokens: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
            clearAuthStore();
          }
        } else {
          // Token is still valid
          // SECURITY FIX: Use verifyAndDecodeIdToken to validate JWT signature (Assigned: Katherine Mitchell)
          const user = await authService.verifyAndDecodeIdToken(tokens.idToken);
          setState({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          setAuthStore(user, tokens);
        }
      } else {
        setState({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      secureLogger.error('Failed to initialize auth:', error);
      setState({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to initialize authentication',
      });
    }
  }, [setAuthStore, clearAuthStore]);


  /**
   * Sign in with Azure AD B2C
   */
  const signIn = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { tokens, user } = await authService.signIn();

      setState({
        user,
        tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      setAuthStore(user, tokens);
    } catch (error) {
      secureLogger.error('Sign in failed:', error);
      setState({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Sign in failed',
      });
    }
  }, [setAuthStore]);

  /**
   * Sign out
   */
  const signOut = useCallback(async () => {
    try {
      await authService.signOut();
      setState({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      clearAuthStore();
    } catch (error) {
      secureLogger.error('Sign out failed:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Sign out failed',
      }));
    }
  }, [clearAuthStore]);

  /**
   * Refresh tokens
   */
  const refreshTokens = useCallback(async () => {
    try {
      if (!state.tokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const newTokens = await authService.refreshTokens(state.tokens.refreshToken);
      await tokenStorage.saveTokens(newTokens);

      setState((prev) => ({
        ...prev,
        tokens: newTokens,
      }));

      if (state.user) {
        setAuthStore(state.user, newTokens);
      }
    } catch (error) {
      secureLogger.error('Token refresh failed:', error);
      // If refresh fails, sign out the user
      await signOut();
    }
  }, [state.tokens, state.user, setAuthStore, signOut]);

  /**
   * Authenticate with biometric
   */
  const authenticateWithBiometric = useCallback(async (): Promise<boolean> => {
    try {
      // SECURITY FIX: Verify tokens exist and are valid before allowing biometric auth
      const tokens = await tokenStorage.getTokens();

      if (!tokens || !tokens.accessToken || !tokens.refreshToken) {
        secureLogger.warn('Biometric auth blocked: No tokens found in secure storage');
        return false;
      }

      // Verify tokens are not expired
      if (authService.isTokenExpired(tokens.expiresAt)) {
        secureLogger.warn('Biometric auth blocked: Tokens are expired');
        // Try to refresh the token first
        try {
          const newTokens = await authService.refreshTokens(tokens.refreshToken);
          await tokenStorage.saveTokens(newTokens);
          // SECURITY FIX: Use verifyAndDecodeIdToken to validate JWT signature (Assigned: Katherine Mitchell)
          const user = await authService.verifyAndDecodeIdToken(newTokens.idToken);

          setState({
            user,
            tokens: newTokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          setAuthStore(user, newTokens);
        } catch (refreshError) {
          secureLogger.error('Token refresh failed during biometric auth:', refreshError);
          await tokenStorage.clearTokens();
          return false;
        }
      }

      const isAvailable = await biometricAuth.isAvailable();
      if (!isAvailable) {
        return false;
      }

      const biometricName = await biometricAuth.getBiometricTypeName();
      const success = await biometricAuth.authenticate({
        promptMessage: `Use ${biometricName} to access your account`,
      });

      if (success && tokens) {
        // SECURITY FIX: Use verifyAndDecodeIdToken to validate JWT signature (Assigned: Katherine Mitchell)
        const user = await authService.verifyAndDecodeIdToken(tokens.idToken);
        setState({
          user,
          tokens,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        setAuthStore(user, tokens);
      }

      return success;
    } catch (error) {
      secureLogger.error('Biometric authentication failed:', error);
      return false;
    }
  }, [setAuthStore]);

  /**
   * SECURITY FIX: Automatic token refresh before expiry
   * Refreshes tokens 5 minutes before they expire
   */
  useEffect(() => {
    if (!state.tokens || !state.isAuthenticated) {
      return;
    }

    const setupTokenRefresh = () => {
      const now = Date.now();
      const expiresAt = state.tokens!.expiresAt;
      const refreshTime = expiresAt - 5 * 60 * 1000; // 5 minutes before expiry
      const timeUntilRefresh = refreshTime - now;

      if (timeUntilRefresh > 0) {
        secureLogger.info(`Token will auto-refresh in ${Math.ceil(timeUntilRefresh / 60000)} minutes`);

        const timeoutId = setTimeout(async () => {
          try {
            secureLogger.info('Auto-refreshing token before expiry');
            await refreshTokens();
          } catch (error) {
            secureLogger.error('Auto-refresh failed:', error);
            // If auto-refresh fails, sign out the user
            await signOut();
          }
        }, timeUntilRefresh);

        return () => clearTimeout(timeoutId);
      } else if (timeUntilRefresh > -60000) {
        // Token expires in less than 1 minute or just expired, refresh immediately
        refreshTokens().catch((error) => {
          secureLogger.error('Immediate token refresh failed:', error);
          signOut();
        });
      }
    };

    const cleanup = setupTokenRefresh();
    return cleanup;
  }, [state.tokens, state.isAuthenticated, refreshTokens, signOut]);

  const value: AuthContextValue = {
    ...state,
    signIn,
    signOut,
    refreshTokens,
    authenticateWithBiometric,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use authentication context
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
