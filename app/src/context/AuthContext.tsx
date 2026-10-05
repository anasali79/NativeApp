/**
 * Auth context: manages session state (token + user), restores from AsyncStorage on launch.
 * Provides login(), register(), logout() to the entire app.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../domain/types';
import { loginUser, registerUser, getMe } from '../api/auth';
import { saveToken, clearToken, getStoredToken, setUnauthorizedHandler } from '../api/client';

interface AuthState {
  user: User | null;
  ready: boolean; // true once we've checked AsyncStorage
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    ready: false,
    loading: false,
  });

  const logout = useCallback(async () => {
    await clearToken();
    setState((prev) => ({ ...prev, user: null }));
  }, []);

  // Restore session on app start
  useEffect(() => {
    const restore = async () => {
      try {
        const token = await getStoredToken();
        if (token) {
          const user = await getMe();
          setState({ user, ready: true, loading: false });
        } else {
          setState({ user: null, ready: true, loading: false });
        }
      } catch {
        // Token invalid or network error — clear and show auth
        await clearToken();
        setState({ user: null, ready: true, loading: false });
      }
    };
    restore();
  }, []);

  // Auto-logout on 401 from any API call
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const response = await loginUser(email, password);
      await saveToken(response.token);
      setState((prev) => ({ ...prev, user: response.user, loading: false }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false }));
      throw error;
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const response = await registerUser(email, password);
      await saveToken(response.token);
      setState((prev) => ({ ...prev, user: response.user, loading: false }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false }));
      throw error;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook to access auth state and actions */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
