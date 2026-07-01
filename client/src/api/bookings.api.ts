import { apiClient } from './client';
import type { Booking, CommonArea } from '../types';

export function fetchCommonAreas() {
  return apiClient.get<CommonArea[]>('/common-areas').then((r) => r.data);
}

export function createCommonArea(data: {
  name: string;
  description?: string;
  capacity?: number;
  openTime: string;
  closeTime: string;
}) {
  return apiClient.post<CommonArea>('/common-areas', data).then((r) => r.data);
}

export function updateCommonArea(id: string, data: Partial<CommonArea>) {
  return apiClient.patch<CommonArea>(`/common-areas/${id}`, data).then((r) => r.data);
}

export function deleteCommonArea(id: string) {
  return apiClient.delete(`/common-areas/${id}`).then((r) => r.data);
}

export function fetchBookings(filters?: { commonAreaId?: string; from?: string; to?: string }) {
  return apiClient.get<Booking[]>('/bookings', { params: filters }).then((r) => r.data);
}

export function createBooking(data: { commonAreaId: string; startsAt: string; endsAt: string; notes?: string }) {
  return apiClient.post<Booking>('/bookings', data).then((r) => r.data);
}

export function cancelBooking(id: string) {
  return apiClient.delete(`/bookings/${id}`).then((r) => r.data);
}
