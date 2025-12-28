/**
 * Index Screen
 * Initial screen that redirects based on authentication status
 */

import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useAuth } from '@lib/auth/auth-context';
import { LoadingSpinner } from '@components/ui';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  // Redirect based on authentication status
  if (isAuthenticated) {
    return <Redirect href="/(app)/home" />;
  }

  return <Redirect href="/(auth)/login" />;
}
