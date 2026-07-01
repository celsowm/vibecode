export type Role = 'ADMIN' | 'SINDICO' | 'MORADOR';

export type ChargeStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELED';
export type BookingStatus = 'CONFIRMED' | 'CANCELED';
export type MaintenanceStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export interface Unit {
  id: string;
  identifier: string;
  block: string | null;
  number: string;
  residents?: Resident[];
}

export interface Resident {
  id: string;
  userId: string;
  unitId: string;
  isOwner: boolean;
  startDate: string;
  endDate: string | null;
  user?: { id: string; name: string; email: string };
  unit?: Unit;
}

export interface Fee {
  id: string;
  description: string;
  amount: string;
  referenceMonth: number;
  referenceYear: number;
  dueDay: number;
}

export interface Charge {
  id: string;
  feeId: string;
  unitId: string;
  amount: string;
  dueDate: string;
  status: ChargeStatus;
  unit?: Unit;
  fee?: Fee;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  chargeId: string;
  amountPaid: string;
  paidAt: string;
  method: string | null;
  registeredById: string;
}

export interface CommonArea {
  id: string;
  name: string;
  description: string | null;
  capacity: number | null;
  openTime: string;
  closeTime: string;
  isActive: boolean;
}

export interface Booking {
  id: string;
  commonAreaId: string;
  createdById: string;
  startsAt: string;
  endsAt: string;
  status: BookingStatus;
  notes: string | null;
  commonArea?: CommonArea;
  createdBy?: { id: string; name: string };
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  authorId: string;
  pinned: boolean;
  createdAt: string;
  author?: { id: string; name: string };
}

export interface MaintenanceComment {
  id: string;
  requestId: string;
  authorId: string;
  message: string;
  createdAt: string;
  author?: { id: string; name: string };
}

export interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  openedById: string;
  unitId: string | null;
  createdAt: string;
  resolvedAt: string | null;
  openedBy?: { id: string; name: string };
  comments?: MaintenanceComment[];
}
