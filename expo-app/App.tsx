/**
 * App root: wraps everything in AuthProvider.
 * Shows splash while restoring session, then Auth or Home screen.
 */
import React from 'react';
import { View, Image, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AuthScreen } from './src/screens/AuthScreen';
import { HomeScreen } from './src/screens/HomeScreen';

function AppContent() {
  const { ready, user } = useAuth();

  // Splash screen while restoring session from AsyncStorage (no spinner)
  if (!ready) {
    return (
      <View style={styles.splash}>
        <StatusBar barStyle="dark-content" />
        <Image
          source={require('./assets/splash-icon.png')}
          style={styles.splashIcon}
          resizeMode="contain"
        />
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashIcon: {
    width: 140,
    height: 140,
  },
});
