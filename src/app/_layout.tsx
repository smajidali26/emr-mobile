/**
 * Root Layout
 * Main layout for Expo Router with authentication and providers
 */

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@lib/auth/auth-context';
import { queryClient } from '@lib/api/query-client';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after app is ready
    const prepare = async () => {
      try {
        // Add any initialization logic here
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error during app initialization:', error);
      } finally {
        await SplashScreen.hideAsync();
      }
    };

    prepare();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#FFFFFF' },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  );
}
