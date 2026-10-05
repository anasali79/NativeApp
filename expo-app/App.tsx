/**
 * App root: wraps everything in AuthProvider.
 * Shows splash while restoring session, then Auth or Home screen.
 */
import React from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#4FB894" />
      </View>
    );
  }

  // No session → show auth; session exists → show home
  return user ? <HomeScreen /> : <AuthScreen />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#0B101E',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
