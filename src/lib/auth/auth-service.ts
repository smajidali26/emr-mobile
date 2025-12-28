/**
 * Authentication Service
 * Handles Azure AD B2C authentication flows using expo-auth-session
 */

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { AuthTokens, User, AuthError } from '../../types/auth.types';
import {
  azureB2CConfig,
  getAuthorizationEndpoint,
  getTokenEndpoint,
} from './config';
import { tokenStorage } from '../storage/token-storage';
import { secureLogger } from '../utils/secure-logger';

// Enable dismissing the browser on iOS
WebBrowser.maybeCompleteAuthSession();

export class AuthService {
  private discovery: AuthSession.DiscoveryDocument;
  private jwksUri: string;

  constructor() {
    const authEndpoint = getAuthorizationEndpoint(azureB2CConfig.signInPolicy);
    const tokenEndpoint = getTokenEndpoint(azureB2CConfig.signInPolicy);

    this.discovery = {
      authorizationEndpoint: authEndpoint,
      tokenEndpoint: tokenEndpoint,
    };

    // JWKS endpoint for Azure B2C
    this.jwksUri = `https://${azureB2CConfig.authorityDomain}/${azureB2CConfig.tenantName}.onmicrosoft.com/${azureB2CConfig.signInPolicy}/discovery/v2.0/keys`;
  }

  /**
   * Initiates the OAuth2 authorization code flow with PKCE
   */
  async signIn(): Promise<{ tokens: AuthTokens; user: User }> {
    try {
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'emr',
        path: 'auth/callback',
      });

      const request = new AuthSession.AuthRequest({
        clientId: azureB2CConfig.clientId,
        scopes: azureB2CConfig.scopes,
        redirectUri,
        usePKCE: true,
        extraParams: {
          prompt: 'login',
        },
      });

      const result = await request.promptAsync(this.discovery);

      if (result.type === 'success') {
        const { code } = result.params;

        // Exchange code for tokens
        const tokens = await this.exchangeCodeForTokens(code, request);

        // Verify and decode user from ID token
        const user = await this.verifyAndDecodeIdToken(tokens.idToken);

        // Store tokens securely
        await tokenStorage.saveTokens(tokens);

        return { tokens, user };
      } else if (result.type === 'error') {
        throw this.createAuthError(
          'AUTH_FAILED',
          result.error?.message || 'Authentication failed'
        );
      } else {
        throw this.createAuthError('AUTH_CANCELLED', 'Authentication cancelled');
      }
    } catch (error) {
      secureLogger.error('Sign in error:', error);
      throw error;
    }
  }

  /**
   * Exchanges authorization code for access tokens
   */
  private async exchangeCodeForTokens(
    code: string,
    request: AuthSession.AuthRequest
  ): Promise<AuthTokens> {
    try {
      const tokenResult = await AuthSession.exchangeCodeAsync(
        {
          clientId: azureB2CConfig.clientId,
          code,
          redirectUri: request.redirectUri,
          extraParams: {
            code_verifier: request.codeVerifier || '',
          },
        },
        this.discovery
      );

      const expiresAt = Date.now() + (tokenResult.expiresIn || 3600) * 1000;

      return {
        accessToken: tokenResult.accessToken,
        refreshToken: tokenResult.refreshToken || '',
        idToken: tokenResult.idToken || '',
        expiresAt,
      };
    } catch (error) {
      secureLogger.error('Token exchange error:', error);
      throw this.createAuthError('TOKEN_EXCHANGE_FAILED', 'Failed to exchange code for tokens');
    }
  }

  /**
   * Refreshes the access token using the refresh token
   */
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const tokenResult = await AuthSession.refreshAsync(
        {
          clientId: azureB2CConfig.clientId,
          refreshToken,
        },
        this.discovery
      );

      const expiresAt = Date.now() + (tokenResult.expiresIn || 3600) * 1000;

      return {
        accessToken: tokenResult.accessToken,
        refreshToken: tokenResult.refreshToken || refreshToken,
        idToken: tokenResult.idToken || '',
        expiresAt,
      };
    } catch (error) {
      secureLogger.error('Token refresh error:', error);
      throw this.createAuthError('TOKEN_REFRESH_FAILED', 'Failed to refresh tokens');
    }
  }

  /**
   * Verifies JWT signature and decodes the ID token to extract user information
   * This method properly validates the token using Azure B2C's JWKS endpoint
   */
  private async verifyAndDecodeIdToken(idToken: string): Promise<User> {
    try {
      // Create JWKS client for Azure B2C
      const JWKS = createRemoteJWKSet(new URL(this.jwksUri));

      // Expected issuer
      const expectedIssuer = `https://${azureB2CConfig.authorityDomain}/${azureB2CConfig.tenantId}/v2.0/`;

      // Verify the token signature and claims
      const { payload } = await jwtVerify(idToken, JWKS, {
        issuer: expectedIssuer,
        audience: azureB2CConfig.clientId,
      });

      return {
        id: (payload.sub as string) || (payload.oid as string),
        email: (payload.email as string) || (payload.emails as string[])?.[0] || '',
        name: (payload.name as string) || '',
        givenName: payload.given_name as string,
        familyName: payload.family_name as string,
        roles: payload.extension_Role ? [payload.extension_Role as string] : [],
        tenantId: (payload.tid as string) || azureB2CConfig.tenantId,
      };
    } catch (error) {
      secureLogger.error('Token verification failed:', error);
      throw this.createAuthError('TOKEN_VERIFICATION_FAILED', 'Failed to verify ID token signature');
    }
  }

  /**
   * Unsafe token decode for backward compatibility (used only where token is already verified)
   * DO NOT use this for authentication - use verifyAndDecodeIdToken instead
   */
  private decodeIdTokenUnsafe(idToken: string): User {
    try {
      const base64Url = idToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const payload = JSON.parse(jsonPayload);

      return {
        id: payload.sub || payload.oid,
        email: payload.email || payload.emails?.[0] || '',
        name: payload.name || '',
        givenName: payload.given_name,
        familyName: payload.family_name,
        roles: payload.extension_Role ? [payload.extension_Role] : [],
        tenantId: payload.tid || azureB2CConfig.tenantId,
      };
    } catch (error) {
      secureLogger.error('Token decode error:', error);
      throw this.createAuthError('TOKEN_DECODE_FAILED', 'Failed to decode ID token');
    }
  }

  /**
   * Signs out the user
   */
  async signOut(): Promise<void> {
    try {
      await tokenStorage.clearTokens();
      // Optionally, you can also clear the web browser session
      // await WebBrowser.dismissBrowser();
    } catch (error) {
      secureLogger.error('Sign out error:', error);
      throw this.createAuthError('SIGN_OUT_FAILED', 'Failed to sign out');
    }
  }

  /**
   * Checks if tokens are expired
   */
  isTokenExpired(expiresAt: number): boolean {
    return Date.now() >= expiresAt - 60000; // 1 minute buffer
  }

  /**
   * Creates a standardized auth error
   */
  private createAuthError(code: string, message: string): AuthError {
    return {
      code,
      message,
    };
  }
}

export const authService = new AuthService();
