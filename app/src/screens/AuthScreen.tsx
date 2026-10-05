/**
 * Auth screen per DESIGN.md:
 * - Single screen toggling between login and register modes
 * - Login: "Welcome back" / "Log in to see what is due."
 * - Register: "Start fresh" / "Create an account to keep your tasks in sync."
 * - Email + password fields, inline validation, server errors above button
 * - Password show/hide toggle
 * - Loading state on button, keyboard-safe layout
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { useAuth } from '../context/AuthContext';
import { Field } from '../components/Field';
import { Button } from '../components/Button';

export function AuthScreen() {
  const colors = useTheme();
  const { login, register, loading } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Validation errors (client-side)
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  // Server error
  const [serverError, setServerError] = useState('');

  const validate = (): boolean => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    setServerError('');

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Enter a valid email address.');
      valid = false;
    } else if (!emailRegex.test(email.trim())) {
      setEmailError('Enter a valid email address.');
      valid = false;
    }

    if (!password) {
      setPasswordError('Use at least 8 characters.');
      valid = false;
    } else if (password.length < 8) {
      setPasswordError('Use at least 8 characters.');
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      if (isLogin) {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setServerError(message);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setEmailError('');
    setPasswordError('');
    setServerError('');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.chalk }]}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={[typography.titleL, { color: colors.ink }]}>
            {isLogin ? 'Welcome back' : 'Start fresh'}
          </Text>
          <Text
            style={[
              typography.secondary,
              { color: colors.slate, marginTop: spacing.sm, marginBottom: spacing.xxl },
            ]}
          >
            {isLogin
              ? 'Log in to see what is due.'
              : 'Create an account to keep your tasks in sync.'}
          </Text>

          {/* Email field */}
          <Field
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={emailError}
            accessibilityLabel="Email"
          />

          {/* Password field with show/hide */}
          <View>
            <Field
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              error={passwordError}
              accessibilityLabel="Password"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.showToggle}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              accessibilityRole="button"
            >
              <Text style={[typography.meta, { color: colors.slate }]}>
                {showPassword ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Server error */}
          {serverError ? (
            <Text
              style={[
                typography.secondary,
                { color: colors.priorityHigh, marginBottom: spacing.base, textAlign: 'center' },
              ]}
            >
              {serverError}
            </Text>
          ) : null}

          {/* Submit button */}
          <Button
            title={isLogin ? 'Log in' : 'Create account'}
            onPress={handleSubmit}
            loading={loading}
          />

          {/* Toggle mode */}
          <TouchableOpacity
            onPress={toggleMode}
            style={styles.toggleBtn}
            accessibilityRole="button"
          >
            <Text style={[typography.secondary, { color: colors.slate, textAlign: 'center' }]}>
              {isLogin ? 'New here? ' : 'Already have an account? '}
              <Text style={{ color: colors.ink, fontWeight: '600' }}>
                {isLogin ? 'Create an account' : 'Log in'}
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  showToggle: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  toggleBtn: {
    marginTop: spacing.xl,
    minHeight: 48,
    justifyContent: 'center',
  },
});
