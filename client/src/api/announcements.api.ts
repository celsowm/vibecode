import { apiClient } from './client';
import type { Announcement } from '../types';

export function fetchAnnouncements() {
  return apiClient.get<Announcement[]>('/announcements').then((r) => r.data);
}

export function createAnnouncement(data: { title: string; body: string; pinned?: boolean }) {
  return apiClient.post<Announcement>('/announcements', data).then((r) => r.data);
}

export function updateAnnouncement(id: string, data: Partial<{ title: string; body: string; pinned: boolean }>) {
  return apiClient.patch<Announcement>(`/announcements/${id}`, data).then((r) => r.data);
}

export function deleteAnnouncement(id: string) {
  return apiClient.delete(`/announcements/${id}`).then((r) => r.data);
}
