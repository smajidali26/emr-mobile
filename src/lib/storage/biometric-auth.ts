/**
 * Biometric Authentication
 * Handles biometric authentication (Face ID, Touch ID, Fingerprint)
 */

import * as LocalAuthentication from 'expo-local-authentication';
import { BiometricAuthConfig } from '../../types/auth.types';

class BiometricAuth {
  /**
   * Checks if biometric authentication is available on the device
   */
  async isAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Biometric availability check failed:', error);
      return false;
    }
  }

  /**
   * Gets the supported biometric authentication types
   */
  async getSupportedTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    try {
      return await LocalAuthentication.supportedAuthenticationTypesAsync();
    } catch (error) {
      console.error('Failed to get supported biometric types:', error);
      return [];
    }
  }

  /**
   * Authenticates the user using biometric authentication
   */
  async authenticate(config?: Partial<BiometricAuthConfig>): Promise<boolean> {
    try {
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        console.warn('Biometric authentication not available');
        return false;
      }

      const defaultConfig: BiometricAuthConfig = {
        enabled: true,
        promptMessage: 'Authenticate to access your medical records',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      };

      const finalConfig = { ...defaultConfig, ...config };

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: finalConfig.promptMessage,
        cancelLabel: finalConfig.cancelLabel,
        disableDeviceFallback: finalConfig.disableDeviceFallback,
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  /**
   * Gets a user-friendly name for the biometric type
   */
  async getBiometricTypeName(): Promise<string> {
    try {
      const types = await this.getSupportedTypes();

      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'Face ID';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'Fingerprint';
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        return 'Iris';
      }

      return 'Biometric';
    } catch (error) {
      console.error('Failed to get biometric type name:', error);
      return 'Biometric';
    }
  }
}

export const biometricAuth = new BiometricAuth();
