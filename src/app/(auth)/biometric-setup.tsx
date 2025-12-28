/**
 * Biometric Setup Screen
 * Prompts users to enable biometric authentication after first login
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { biometricAuth } from '@lib/storage/biometric-auth';
import { tokenStorage } from '@lib/storage/token-storage';
import { Button, Card } from '@components/ui';
import { useAuth } from '@lib/auth/auth-context';
import { secureLogger } from '@lib/utils/secure-logger';

export default function BiometricSetupScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [biometricType, setBiometricType] = useState('Biometric');
  const [isEnabling, setIsEnabling] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  useEffect(() => {
    // SECURITY FIX: Verify user is authenticated before allowing biometric setup
    if (!isAuthenticated || !user) {
      secureLogger.warn('Biometric setup blocked: User not authenticated');
      Alert.alert(
        'Authentication Required',
        'You must be signed in to enable biometric authentication.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
      return;
    }

    initializeBiometricInfo();
    animateEntrance();
  }, [isAuthenticated, user]);

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const initializeBiometricInfo = async () => {
    const type = await biometricAuth.getBiometricTypeName();
    setBiometricType(type);
  };

  const handleEnableBiometric = async () => {
    // SECURITY FIX: Double-check authentication before enabling biometric
    if (!isAuthenticated || !user) {
      secureLogger.warn('Biometric enable blocked: User not authenticated');
      Alert.alert(
        'Authentication Required',
        'You must be signed in to enable biometric authentication.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
      return;
    }

    setIsEnabling(true);
    try {
      const success = await biometricAuth.authenticate({
        promptMessage: `Enable ${biometricType} for quick and secure access`,
        cancelLabel: 'Not Now',
      });

      if (success) {
        // Mark biometric setup as complete
        await tokenStorage.saveItem('biometricEnabled', 'true');
        await tokenStorage.saveItem('biometricSetupComplete', 'true');
        router.replace('/(app)/home');
      } else {
        // User cancelled or failed, but mark setup as complete so we don't ask again
        await tokenStorage.saveItem('biometricSetupComplete', 'true');
        router.replace('/(app)/home');
      }
    } catch (error) {
      secureLogger.error('Biometric setup error:', error);
      // Mark as complete even on error to avoid loop
      await tokenStorage.saveItem('biometricSetupComplete', 'true');
      router.replace('/(app)/home');
    } finally {
      setIsEnabling(false);
    }
  };

  const handleSkip = async () => {
    await tokenStorage.saveItem('biometricSetupComplete', 'true');
    router.replace('/(app)/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Icon and Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>🔐</Text>
          </View>
          <Text style={styles.title}>Enable {biometricType}</Text>
          <Text style={styles.subtitle}>
            Use {biometricType} for quick and secure access to your medical records
          </Text>
        </Animated.View>

        {/* Benefits */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Card variant="outlined" padding="lg" style={styles.benefitsCard}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>⚡</Text>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Quick Access</Text>
                <Text style={styles.benefitDescription}>
                  Sign in instantly without entering credentials
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🛡️</Text>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Enhanced Security</Text>
                <Text style={styles.benefitDescription}>
                  Your biometric data never leaves your device
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>✨</Text>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Convenience</Text>
                <Text style={styles.benefitDescription}>
                  No need to remember passwords or PINs
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isEnabling}
            onPress={handleEnableBiometric}
            style={styles.enableButton}
          >
            Enable {biometricType}
          </Button>

          <Button
            variant="ghost"
            size="md"
            fullWidth
            onPress={handleSkip}
            disabled={isEnabling}
          >
            Skip for Now
          </Button>
        </Animated.View>

        {/* Footer Note */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            You can change this setting anytime in your account settings
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#DBEAFE',
  },
  iconText: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  benefitsCard: {
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  benefitIcon: {
    fontSize: 28,
    marginRight: 16,
    marginTop: 2,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  actions: {
    marginTop: 'auto',
  },
  enableButton: {
    marginBottom: 12,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
});
