/**
 * Home Screen
 * Main dashboard for authenticated users
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@lib/auth/auth-context';
import { Button, Card } from '@components/ui';

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
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
            try {
              await signOut();
              router.replace('/(auth)/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const quickActions = [
    {
      id: '1',
      title: 'My Records',
      description: 'View your medical records',
      icon: '📋',
      onPress: () => Alert.alert('Coming Soon', 'Medical records feature coming soon'),
    },
    {
      id: '2',
      title: 'Appointments',
      description: 'Manage appointments',
      icon: '📅',
      onPress: () => Alert.alert('Coming Soon', 'Appointments feature coming soon'),
    },
    {
      id: '3',
      title: 'Prescriptions',
      description: 'View prescriptions',
      icon: '💊',
      onPress: () => Alert.alert('Coming Soon', 'Prescriptions feature coming soon'),
    },
    {
      id: '4',
      title: 'Lab Results',
      description: 'Check lab results',
      icon: '🧪',
      onPress: () => Alert.alert('Coming Soon', 'Lab results feature coming soon'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <View style={styles.profileCircle}>
              <Text style={styles.profileInitial}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* User Info Card */}
        <Card variant="elevated" padding="lg" style={styles.userCard}>
          <Text style={styles.cardTitle}>Account Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role:</Text>
            <Text style={styles.infoValue}>
              {user?.roles.join(', ') || 'Patient'}
            </Text>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={action.onPress}
              >
                <Card variant="outlined" padding="md" style={styles.actionCardInner}>
                  <Text style={styles.actionIcon}>{action.icon}</Text>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionDescription}>{action.description}</Text>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sign Out Button */}
        <View style={styles.section}>
          <Button variant="outline" size="lg" fullWidth onPress={handleSignOut}>
            Sign Out
          </Button>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#64748B',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 4,
  },
  profileButton: {
    width: 48,
    height: 48,
  },
  profileCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userCard: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: '#1E293B',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  actionCard: {
    width: '50%',
    padding: 6,
  },
  actionCardInner: {
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});
