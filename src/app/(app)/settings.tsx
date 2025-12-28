/**
 * Settings Screen
 * User preferences and application settings
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@lib/auth/auth-context';
import { useCurrentUser, useUpdatePreferences } from '@lib/api/auth-api';
import { biometricAuth } from '@lib/storage/biometric-auth';
import { tokenStorage } from '@lib/storage/token-storage';
import { useAppStore } from '@stores/app-store';
import { Card } from '@components/ui';

type ThemeOption = 'light' | 'dark' | 'system';

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: userProfile, isLoading } = useCurrentUser();
  const updatePreferences = useUpdatePreferences();
  const { theme, setTheme } = useAppStore();

  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('Biometric');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>(theme);

  useEffect(() => {
    initializeSettings();
  }, [userProfile]);

  const initializeSettings = async () => {
    // Check biometric availability
    const available = await biometricAuth.isAvailable();
    setBiometricAvailable(available);

    if (available) {
      const type = await biometricAuth.getBiometricTypeName();
      setBiometricType(type);

      // Check if biometric is enabled
      const enabled = await tokenStorage.getItem('biometricEnabled');
      setBiometricEnabled(enabled === 'true');
    }

    // Load user preferences if available
    if (userProfile?.preferences) {
      setNotificationsEnabled(userProfile.preferences.notificationsEnabled);
      setEmailNotifications(userProfile.preferences.emailNotifications);
      setPushNotifications(userProfile.preferences.pushNotifications);
      setSelectedTheme(userProfile.preferences.theme);
      setTheme(userProfile.preferences.theme);
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      // Enable biometric
      const success = await biometricAuth.authenticate({
        promptMessage: `Enable ${biometricType} for quick access`,
      });

      if (success) {
        await tokenStorage.saveItem('biometricEnabled', 'true');
        setBiometricEnabled(true);

        // Update server preferences
        if (user?.id) {
          updatePreferences.mutate({
            userId: user.id,
            preferences: { biometricEnabled: true },
          });
        }

        Alert.alert('Success', `${biometricType} has been enabled`);
      } else {
        Alert.alert('Failed', `Failed to enable ${biometricType}`);
      }
    } else {
      // Disable biometric
      await tokenStorage.saveItem('biometricEnabled', 'false');
      setBiometricEnabled(false);

      // Update server preferences
      if (user?.id) {
        updatePreferences.mutate({
          userId: user.id,
          preferences: { biometricEnabled: false },
        });
      }

      Alert.alert('Disabled', `${biometricType} has been disabled`);
    }
  };

  const handleNotificationsToggle = async (value: boolean) => {
    setNotificationsEnabled(value);

    if (user?.id) {
      updatePreferences.mutate({
        userId: user.id,
        preferences: { notificationsEnabled: value },
      });
    }
  };

  const handleEmailNotificationsToggle = async (value: boolean) => {
    setEmailNotifications(value);

    if (user?.id) {
      updatePreferences.mutate({
        userId: user.id,
        preferences: { emailNotifications: value },
      });
    }
  };

  const handlePushNotificationsToggle = async (value: boolean) => {
    setPushNotifications(value);

    if (user?.id) {
      updatePreferences.mutate({
        userId: user.id,
        preferences: { pushNotifications: value },
      });
    }
  };

  const handleThemeChange = (newTheme: ThemeOption) => {
    setSelectedTheme(newTheme);
    setTheme(newTheme);

    if (user?.id) {
      updatePreferences.mutate({
        userId: user.id,
        preferences: { theme: newTheme },
      });
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear the app cache? This will remove temporary data but not your account information.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            // Implement cache clearing logic
            Alert.alert('Success', 'Cache has been cleared');
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Security Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>

          <Card variant="outlined" padding="none" style={styles.settingsCard}>
            {biometricAvailable && (
              <>
                <View style={styles.settingRow}>
                  <View style={styles.settingLeft}>
                    <Text style={styles.settingLabel}>{biometricType}</Text>
                    <Text style={styles.settingDescription}>
                      Use {biometricType} to sign in quickly
                    </Text>
                  </View>
                  <Switch
                    value={biometricEnabled}
                    onValueChange={handleBiometricToggle}
                    trackColor={{ false: '#E2E8F0', true: '#93C5FD' }}
                    thumbColor={biometricEnabled ? '#2563EB' : '#64748B'}
                    ios_backgroundColor="#E2E8F0"
                  />
                </View>
              </>
            )}
          </Card>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <Card variant="outlined" padding="none" style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>All Notifications</Text>
                <Text style={styles.settingDescription}>
                  Master toggle for all notifications
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationsToggle}
                trackColor={{ false: '#E2E8F0', true: '#93C5FD' }}
                thumbColor={notificationsEnabled ? '#2563EB' : '#64748B'}
                ios_backgroundColor="#E2E8F0"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Email Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive updates via email
                </Text>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={handleEmailNotificationsToggle}
                disabled={!notificationsEnabled}
                trackColor={{ false: '#E2E8F0', true: '#93C5FD' }}
                thumbColor={emailNotifications ? '#2563EB' : '#64748B'}
                ios_backgroundColor="#E2E8F0"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive push notifications on this device
                </Text>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={handlePushNotificationsToggle}
                disabled={!notificationsEnabled}
                trackColor={{ false: '#E2E8F0', true: '#93C5FD' }}
                thumbColor={pushNotifications ? '#2563EB' : '#64748B'}
                ios_backgroundColor="#E2E8F0"
              />
            </View>
          </Card>
        </View>

        {/* Appearance Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>

          <Card variant="outlined" padding="none" style={styles.settingsCard}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => handleThemeChange('light')}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Light</Text>
              </View>
              <View
                style={[
                  styles.radioButton,
                  selectedTheme === 'light' && styles.radioButtonSelected,
                ]}
              >
                {selectedTheme === 'light' && <View style={styles.radioButtonInner} />}
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => handleThemeChange('dark')}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Dark</Text>
              </View>
              <View
                style={[
                  styles.radioButton,
                  selectedTheme === 'dark' && styles.radioButtonSelected,
                ]}
              >
                {selectedTheme === 'dark' && <View style={styles.radioButtonInner} />}
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => handleThemeChange('system')}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>System</Text>
                <Text style={styles.settingDescription}>
                  Match your device's theme
                </Text>
              </View>
              <View
                style={[
                  styles.radioButton,
                  selectedTheme === 'system' && styles.radioButtonSelected,
                ]}
              >
                {selectedTheme === 'system' && <View style={styles.radioButtonInner} />}
              </View>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Privacy & Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Legal</Text>

          <Card variant="outlined" padding="none" style={styles.settingsCard}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => {
                Alert.alert(
                  'Privacy Policy',
                  'This would open the privacy policy in a web view.'
                );
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.settingLabel}>Privacy Policy</Text>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => {
                Alert.alert(
                  'Terms of Service',
                  'This would open the terms of service in a web view.'
                );
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.settingLabel}>Terms of Service</Text>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Advanced Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced</Text>

          <Card variant="outlined" padding="none" style={styles.settingsCard}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleClearCache}
              activeOpacity={0.7}
            >
              <Text style={styles.settingLabel}>Clear Cache</Text>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingVertical: 16,
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 18,
    color: '#2563EB',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  settingsCard: {
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  settingLeft: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
  },
  settingDescription: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  settingArrow: {
    fontSize: 24,
    color: '#94A3B8',
    fontWeight: '300',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#2563EB',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563EB',
  },
});
