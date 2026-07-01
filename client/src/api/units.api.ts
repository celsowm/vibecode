import { apiClient } from './client';
import type { Unit } from '../types';

export function fetchUnits() {
  return apiClient.get<Unit[]>('/units').then((r) => r.data);
}

export function fetchUnit(id: string) {
  return apiClient.get<Unit>(`/units/${id}`).then((r) => r.data);
}

export function createUnit(data: { identifier: string; block?: string; number: string }) {
  return apiClient.post<Unit>('/units', data).then((r) => r.data);
}

export function updateUnit(id: string, data: Partial<{ identifier: string; block: string; number: string }>) {
  return apiClient.patch<Unit>(`/units/${id}`, data).then((r) => r.data);
}

export function deleteUnit(id: string) {
  return apiClient.delete(`/units/${id}`).then((r) => r.data);
}
