/**
 * Auth context: manages session state (token + user), restores from AsyncStorage on launch.
 * Provides login(), register(), logout() to the entire app.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../domain/types';
import { loginUser, registerUser, getMe } from '../api/auth';
import {
  saveSession,
  clearSession,
  getStoredSession,
  saveStoredUser,
  setUnauthorizedHandler,
} from '../api/client';

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
    await clearSession();
    setState({ user: null, ready: true, loading: false });
  }, []);

  // Restore session on app start from local storage immediately
  useEffect(() => {
    let isMounted = true;

    const restore = async () => {
      try {
        const { token, user: cachedUser } = await getStoredSession();
        if (token) {
          // Immediately set user to avoid loading spinner and prevent unauthorized redirect
          const activeUser = cachedUser || { id: '', email: 'User' };
          if (isMounted) {
            setState({ user: activeUser, ready: true, loading: false });
          }

          // Background sync with server; if server is spinning up or offline, do NOT log out!
          try {
            const freshUser = await getMe();
            if (isMounted) {
              setState((prev) => ({ ...prev, user: freshUser }));
            }
            await saveStoredUser(freshUser);
          } catch {
            // Network error / server asleep: user stays logged in!
            // 401s are handled separately by setUnauthorizedHandler
          }
        } else {
          if (isMounted) {
            setState({ user: null, ready: true, loading: false });
          }
        }
      } catch {
        if (isMounted) {
          setState({ user: null, ready: true, loading: false });
        }
      }
    };

    restore();

    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-logout only when the server explicitly returns 401 Unauthorized
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const response = await loginUser(email, password);
      await saveSession(response.token, response.user);
      setState({ user: response.user, ready: true, loading: false });
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false }));
      throw error;
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const response = await registerUser(email, password);
      await saveSession(response.token, response.user);
      setState({ user: response.user, ready: true, loading: false });
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
