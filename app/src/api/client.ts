/**
 * HTTP client wrapper for the backend API.
 * - Attaches Bearer token from AsyncStorage
 * - Parses server error messages into readable strings
 * - Triggers unauthorized handler on 401 (session expired)
 *
 * Android emulator reaches host machine's localhost via 10.0.2.2
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://todo-backend-d7q0.onrender.com';
const TOKEN_KEY = '@auth_token';

let unauthorizedHandler: (() => void) | null = null;

/** Register a callback to be called when a 401 response is received */
export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler;
}

/** Generic fetch wrapper that handles auth and error parsing */
async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Handle 401 — session expired
  if (response.status === 401 && unauthorizedHandler) {
    // Only trigger auto-logout for non-auth routes (don't loop on login failures)
    if (!path.startsWith('/auth/login') && !path.startsWith('/auth/register')) {
      unauthorizedHandler();
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // Server returns { message: string | string[] }
    const msg = data?.message;
    const errorMessage = Array.isArray(msg) ? msg[0] : msg || 'Something went wrong.';
    throw new Error(errorMessage);
  }

  return data as T;
}

export async function saveToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

// Convenience methods
export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
