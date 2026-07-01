import { apiClient } from './client';
import type { User } from '../types';

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export function login(email: string, password: string) {
  return apiClient.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data);
}

export function fetchMe() {
  return apiClient.get<User>('/auth/me').then((r) => r.data);
}
