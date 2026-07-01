import { apiClient } from './client';
import type { Charge, ChargeStatus, Fee, Payment } from '../types';

export function fetchFees() {
  return apiClient.get<Fee[]>('/finance/fees').then((r) => r.data);
}

export function createFee(data: {
  description: string;
  amount: number;
  referenceMonth: number;
  referenceYear: number;
  dueDay: number;
}) {
  return apiClient.post<Fee>('/finance/fees', data).then((r) => r.data);
}

export function generateCharges(feeId: string) {
  return apiClient
    .post<{ feeId: string; unitsCharged: number; totalUnits: number }>(
      `/finance/fees/${feeId}/generate-charges`,
    )
    .then((r) => r.data);
}

export function fetchCharges(filters?: { status?: ChargeStatus; unitId?: string }) {
  return apiClient.get<Charge[]>('/finance/charges', { params: filters }).then((r) => r.data);
}

export function fetchCharge(id: string) {
  return apiClient.get<Charge>(`/finance/charges/${id}`).then((r) => r.data);
}

export function cancelCharge(id: string) {
  return apiClient.patch<Charge>(`/finance/charges/${id}/cancel`).then((r) => r.data);
}

export function fetchDelinquencyReport() {
  return apiClient.get<Charge[]>('/finance/reports/delinquency').then((r) => r.data);
}

export function registerPayment(data: { chargeId: string; amountPaid: number; method?: string }) {
  return apiClient.post<Payment>('/finance/payments', data).then((r) => r.data);
}

export function fetchPaymentsByCharge(chargeId: string) {
  return apiClient.get<Payment[]>('/finance/payments', { params: { chargeId } }).then((r) => r.data);
}
