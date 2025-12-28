/**
 * App Layout
 * Layout for authenticated app screens with tab navigation
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { useAuth } from '@lib/auth/auth-context';
import { Redirect } from 'expo-router';
import { Platform, Text } from 'react-native';

export default function AppLayout() {
  const { isAuthenticated } = useAuth();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 8 : 12,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 85 : 65,
        },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <TabIcon icon="🏠" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <TabIcon icon="👤" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null, // Hide from tab bar - accessed from profile
        }}
      />
    </Tabs>
  );
}

// Simple icon component using emoji
function TabIcon({ icon, color, size }: { icon: string; color: string; size: number }) {
  return (
    <Text style={{ fontSize: size * 0.8, opacity: color === '#2563EB' ? 1 : 0.6 }}>
      {icon}
    </Text>
  );
}
