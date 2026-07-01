import { apiClient } from './client';
import type { MaintenancePriority, MaintenanceRequest, MaintenanceStatus } from '../types';

export function fetchMaintenanceRequests() {
  return apiClient.get<MaintenanceRequest[]>('/maintenance').then((r) => r.data);
}

export function fetchMaintenanceRequest(id: string) {
  return apiClient.get<MaintenanceRequest>(`/maintenance/${id}`).then((r) => r.data);
}

export function createMaintenanceRequest(data: {
  title: string;
  description: string;
  priority?: MaintenancePriority;
  unitId?: string;
}) {
  return apiClient.post<MaintenanceRequest>('/maintenance', data).then((r) => r.data);
}

export function updateMaintenanceStatus(id: string, status: MaintenanceStatus) {
  return apiClient.patch<MaintenanceRequest>(`/maintenance/${id}/status`, { status }).then((r) => r.data);
}

export function addMaintenanceComment(id: string, message: string) {
  return apiClient.post(`/maintenance/${id}/comments`, { message }).then((r) => r.data);
}
