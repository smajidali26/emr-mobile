/**
 * Login Screen
 * Handles user authentication with Azure AD B2C and biometric options
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Switch,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@lib/auth/auth-context';
import { biometricAuth } from '@lib/storage/biometric-auth';
import { tokenStorage } from '@lib/storage/token-storage';
import { Button, Card } from '@components/ui';
import { secureLogger } from '@lib/utils/secure-logger';

/**
 * SECURITY FIX: Document client-side rate limiting
 * Assigned: Heather Roberts
 *
 * IMPORTANT: Client-side rate limiting is for UX only and does NOT provide security.
 * This implementation:
 * - Prevents accidental rapid-fire login attempts
 * - Provides user-friendly feedback for failed login attempts
 * - Can be easily bypassed by clearing app data or using API directly
 *
 * TODO: Verify backend rate limiting is implemented
 * Backend MUST implement rate limiting at the API level to prevent:
 * - Brute force attacks
 * - Credential stuffing
 * - Account enumeration
 *
 * Backend should implement:
 * - Per-IP rate limiting (e.g., max 5 attempts per 15 minutes)
 * - Per-account rate limiting (e.g., max 3 attempts per 15 minutes)
 * - Progressive delays or CAPTCHA after failed attempts
 * - Account lockout after excessive failed attempts
 * - Monitoring and alerting for suspicious login patterns
 */

// Client-side rate limiting configuration (UX only - NOT a security control)
const MAX_LOGIN_ATTEMPTS = 3;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isLoading, error, authenticateWithBiometric, isAuthenticated } = useAuth();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('Biometric');
  const [rememberMe, setRememberMe] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  // Rate limiting state
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const failedAttempts = useRef<number[]>([]);

  useEffect(() => {
    checkBiometricAvailability();
    animateEntrance();
    checkLockoutStatus();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(app)/home');
    }
  }, [isAuthenticated]);

  // Update lockout timer
  useEffect(() => {
    if (isLockedOut && lockoutEndTime) {
      const interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, lockoutEndTime - now);
        setRemainingTime(remaining);

        if (remaining === 0) {
          setIsLockedOut(false);
          setLockoutEndTime(null);
          failedAttempts.current = [];
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isLockedOut, lockoutEndTime]);

  const checkLockoutStatus = async () => {
    try {
      const lockoutData = await tokenStorage.getItem('loginLockout');
      if (lockoutData) {
        const { endTime, attempts } = JSON.parse(lockoutData);
        const now = Date.now();

        if (endTime > now) {
          setIsLockedOut(true);
          setLockoutEndTime(endTime);
          setRemainingTime(endTime - now);
        } else {
          // Lockout expired, clear it
          await tokenStorage.deleteItem('loginLockout');
        }

        if (attempts) {
          failedAttempts.current = attempts;
        }
      }
    } catch (error) {
      secureLogger.error('Failed to check lockout status:', error);
    }
  };

  /**
   * Record a failed login attempt for client-side rate limiting
   *
   * SECURITY NOTE (Assigned: Heather Roberts):
   * This is CLIENT-SIDE rate limiting only - provides UX feedback but NO security.
   * Can be bypassed by:
   * - Clearing app data/cache
   * - Reinstalling the app
   * - Making direct API calls
   *
   * Backend MUST implement proper rate limiting for actual security protection.
   */
  const recordFailedAttempt = async () => {
    const now = Date.now();

    // Remove attempts outside the window
    failedAttempts.current = failedAttempts.current.filter(
      (timestamp) => now - timestamp < ATTEMPT_WINDOW
    );

    // Add new failed attempt
    failedAttempts.current.push(now);

    // Check if we've exceeded max attempts
    if (failedAttempts.current.length >= MAX_LOGIN_ATTEMPTS) {
      const endTime = now + LOCKOUT_DURATION;
      setIsLockedOut(true);
      setLockoutEndTime(endTime);
      setRemainingTime(LOCKOUT_DURATION);

      // Persist lockout state
      await tokenStorage.saveItem(
        'loginLockout',
        JSON.stringify({
          endTime,
          attempts: failedAttempts.current,
        })
      );

      secureLogger.warn(`Account locked due to ${MAX_LOGIN_ATTEMPTS} failed login attempts`);

      Alert.alert(
        'Account Locked',
        `Too many failed login attempts. Please try again in ${Math.ceil(
          LOCKOUT_DURATION / 60000
        )} minutes.`,
        [{ text: 'OK' }]
      );
    }
  };

  const clearLockout = async () => {
    setIsLockedOut(false);
    setLockoutEndTime(null);
    failedAttempts.current = [];
    await tokenStorage.deleteItem('loginLockout');
  };

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const checkBiometricAvailability = async () => {
    const available = await biometricAuth.isAvailable();
    setBiometricAvailable(available);

    if (available) {
      const type = await biometricAuth.getBiometricTypeName();
      setBiometricType(type);
    }
  };

  /**
   * Handle sign-in with Azure AD
   *
   * SECURITY NOTE (Assigned: Heather Roberts):
   * Client-side lockout check below is for UX only.
   * Backend API MUST enforce rate limiting to prevent brute force attacks.
   */
  const handleSignIn = async () => {
    // Check if account is locked (CLIENT-SIDE CHECK - UX ONLY)
    if (isLockedOut) {
      const minutes = Math.ceil(remainingTime / 60000);
      Alert.alert(
        'Account Locked',
        `Too many failed login attempts. Please try again in ${minutes} minute${
          minutes > 1 ? 's' : ''
        }.`,
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await signIn();

      // Clear failed attempts on successful login
      await clearLockout();

      // Store remember me preference
      if (rememberMe) {
        // The tokens are already stored by the auth service
        // We just need to note that the user wants to stay signed in
        await tokenStorage.saveItem('rememberMe', 'true');
      }

      // Check if user should be prompted for biometric setup
      const hasSetupBiometric = await tokenStorage.getItem('biometricSetupComplete');
      if (!hasSetupBiometric && biometricAvailable) {
        router.replace('/(auth)/biometric-setup');
      }
    } catch (err) {
      // Record failed attempt
      await recordFailedAttempt();

      secureLogger.error('Sign in failed:', err);

      if (!isLockedOut) {
        Alert.alert(
          'Sign In Failed',
          error || 'An error occurred during sign in. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleBiometricSignIn = async () => {
    try {
      const success = await authenticateWithBiometric();
      if (success) {
        // Clear any lockout on successful biometric auth
        await clearLockout();
        router.replace('/(app)/home');
      } else {
        Alert.alert(
          'Authentication Failed',
          `${biometricType} authentication failed. Please try again or use the sign in button.`,
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      secureLogger.error('Biometric auth error:', err);
      Alert.alert(
        'Authentication Error',
        'An error occurred during biometric authentication.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo and Header */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>EMR</Text>
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to access your electronic medical records securely
            </Text>
          </Animated.View>

          {/* Login Card */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <Card variant="elevated" padding="lg" style={styles.card}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                onPress={handleSignIn}
                disabled={isLockedOut}
              >
                Sign in with Azure AD
              </Button>

              {isLockedOut && (
                <View style={styles.lockoutContainer}>
                  <Text style={styles.lockoutText}>
                    Account locked. Try again in {Math.ceil(remainingTime / 60000)} minute
                    {Math.ceil(remainingTime / 60000) > 1 ? 's' : ''}
                  </Text>
                </View>
              )}

              {/* Remember Me Toggle */}
              <View style={styles.rememberMeContainer}>
                <Text style={styles.rememberMeLabel}>Remember me</Text>
                <Switch
                  value={rememberMe}
                  onValueChange={setRememberMe}
                  trackColor={{ false: '#E2E8F0', true: '#93C5FD' }}
                  thumbColor={rememberMe ? '#2563EB' : '#64748B'}
                  ios_backgroundColor="#E2E8F0"
                />
              </View>

              {biometricAvailable && (
                <>
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <Button
                    variant="outline"
                    size="lg"
                    fullWidth
                    onPress={handleBiometricSignIn}
                  >
                    Sign in with {biometricType}
                  </Button>
                </>
              )}

              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </Card>
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By signing in, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  card: {
    marginBottom: 24,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingVertical: 8,
  },
  rememberMeLabel: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  lockoutContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  lockoutText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
    fontWeight: '500',
  },
});
