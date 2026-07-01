import { apiClient } from './client';
import type { Resident } from '../types';

export function fetchResidents(unitId?: string) {
  return apiClient
    .get<Resident[]>('/residents', { params: unitId ? { unitId } : undefined })
    .then((r) => r.data);
}

export function createResident(data: { userId: string; unitId: string; isOwner?: boolean }) {
  return apiClient.post<Resident>('/residents', data).then((r) => r.data);
}

export function endResidentLink(id: string, endDate: string) {
  return apiClient.patch<Resident>(`/residents/${id}`, { endDate }).then((r) => r.data);
}

export function removeResident(id: string) {
  return apiClient.delete(`/residents/${id}`).then((r) => r.data);
}
