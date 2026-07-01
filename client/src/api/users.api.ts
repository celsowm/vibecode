import { apiClient } from './client';
import type { Role, User } from '../types';

export function fetchUsers() {
  return apiClient.get<User[]>('/users').then((r) => r.data);
}

export function registerUser(data: { name: string; email: string; password: string; role: Role }) {
  return apiClient.post<User>('/auth/register', data).then((r) => r.data);
}
