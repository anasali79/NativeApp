/**
 * App root: wraps everything in AuthProvider.
 * Shows splash while restoring session, then Auth or Home screen.
 */
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AuthScreen } from './src/screens/AuthScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { lightColors } from './src/theme/colors';

function AppContent() {
  const { ready, user } = useAuth();

  // Splash screen while restoring session from AsyncStorage
  if (!ready) {
    return (
      <View style={styles.splash}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={lightColors.signal} />
      </View>
    );
  }

  // No session → show auth; session exists → show home
  return user ? <HomeScreen /> : <AuthScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: lightColors.chalk,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
