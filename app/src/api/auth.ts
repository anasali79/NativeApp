import { api } from './client';
import { AuthResponse, User } from '../domain/types';

/** Register a new user account */
export function registerUser(email: string, password: string): Promise<AuthResponse> {
  return api.post<AuthResponse>('/auth/register', { email, password });
}

/** Log in with existing credentials */
export function loginUser(email: string, password: string): Promise<AuthResponse> {
  return api.post<AuthResponse>('/auth/login', { email, password });
}

/** Get current user info (validates token) */
export function getMe(): Promise<User> {
  return api.get<User>('/auth/me');
}
