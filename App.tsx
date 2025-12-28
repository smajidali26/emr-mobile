/**
 * App Entry Point
 * Main entry point for the EMR mobile application
 * This file is used by Expo Router as the main app component
 */

import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// Must be exported or Fast Refresh won't update the context
export function App() {
  // @ts-expect-error require.context is provided by Metro bundler
  const ctx = require.context('./src/app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
