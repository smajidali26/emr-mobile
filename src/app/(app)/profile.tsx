/**
 * User Profile Screen
 * Displays user profile information and account options
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@lib/auth/auth-context';
import { useCurrentUser } from '@lib/api/auth-api';
import { Button, Card } from '@components/ui';
import Constants from 'expo-constants';
import { secureLogger } from '@lib/utils/secure-logger';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { data: userProfile, isLoading, error, refetch, isRefetching } = useCurrentUser();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setIsSigningOut(true);
            try {
              await signOut();
              router.replace('/(auth)/login');
            } catch (error) {
              secureLogger.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setIsSigningOut(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleSettingsPress = () => {
    router.push('/(app)/settings');
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const displayUser = userProfile || user;
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  if (authLoading || (isLoading && !userProfile)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to Load Profile</Text>
          <Text style={styles.errorMessage}>
            We couldn't load your profile. Please check your connection and try again.
          </Text>
          <Button variant="primary" onPress={() => refetch()}>
            Retry
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Profile Card */}
        <Card variant="elevated" padding="lg" style={styles.profileCard}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {userProfile?.profilePictureUrl ? (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {getInitials(userProfile.name)}
                </Text>
              </View>
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {getInitials(displayUser?.name || 'U')}
                </Text>
              </View>
            )}
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{displayUser?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{displayUser?.email || ''}</Text>
            {displayUser?.roles && displayUser.roles.length > 0 && (
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>
                  {displayUser.roles[0]}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Profile Details */}
        <Card variant="outlined" padding="none" style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue}>{displayUser?.email || 'N/A'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone</Text>
            <Text style={styles.detailValue}>
              {userProfile?.phoneNumber || 'Not provided'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Role</Text>
            <Text style={styles.detailValue}>
              {displayUser?.roles?.[0] || 'User'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tenant ID</Text>
            <Text style={styles.detailValueSmall} numberOfLines={1}>
              {displayUser?.tenantId || 'N/A'}
            </Text>
          </View>
        </Card>

        {/* Action Buttons */}
        <Card variant="outlined" padding="none" style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleSettingsPress}
            activeOpacity={0.7}
          >
            <View style={styles.actionLeft}>
              <View style={styles.actionIconContainer}>
                <Text style={styles.actionIcon}>⚙️</Text>
              </View>
              <Text style={styles.actionText}>Settings</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => {
              Alert.alert(
                'Privacy Policy',
                'This would open the privacy policy in a web view or external browser.'
              );
            }}
            activeOpacity={0.7}
          >
            <View style={styles.actionLeft}>
              <View style={styles.actionIconContainer}>
                <Text style={styles.actionIcon}>🔒</Text>
              </View>
              <Text style={styles.actionText}>Privacy Policy</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => {
              Alert.alert(
                'Terms of Service',
                'This would open the terms of service in a web view or external browser.'
              );
            }}
            activeOpacity={0.7}
          >
            <View style={styles.actionLeft}>
              <View style={styles.actionIconContainer}>
                <Text style={styles.actionIcon}>📄</Text>
              </View>
              <Text style={styles.actionText}>Terms of Service</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </Card>

        {/* Sign Out Button */}
        <Button
          variant="danger"
          size="lg"
          fullWidth
          isLoading={isSigningOut}
          onPress={handleSignOut}
          style={styles.signOutButton}
        >
          Sign Out
        </Button>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version {appVersion}</Text>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  header: {
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  detailsCard: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  detailValue: {
    fontSize: 16,
    color: '#1E293B',
  },
  detailValueSmall: {
    fontSize: 14,
    color: '#64748B',
    maxWidth: '60%',
  },
  actionsCard: {
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionText: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  actionArrow: {
    fontSize: 24,
    color: '#94A3B8',
    fontWeight: '300',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  signOutButton: {
    marginBottom: 16,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  versionText: {
    fontSize: 14,
    color: '#94A3B8',
  },
});
