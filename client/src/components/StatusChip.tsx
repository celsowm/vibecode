import { Chip } from '@mui/material';

const COLOR_MAP: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  PENDING: 'warning',
  PAID: 'success',
  OVERDUE: 'error',
  CANCELED: 'default',
  CONFIRMED: 'success',
  OPEN: 'info',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
  CLOSED: 'default',
  LOW: 'info',
  MEDIUM: 'warning',
  HIGH: 'error',
};

const LABEL_MAP: Record<string, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  OVERDUE: 'Atrasado',
  CANCELED: 'Cancelado',
  CONFIRMED: 'Confirmado',
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em andamento',
  RESOLVED: 'Resolvido',
  CLOSED: 'Fechado',
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
};

export function StatusChip({ status }: { status: string }) {
  return <Chip label={LABEL_MAP[status] ?? status} color={COLOR_MAP[status] ?? 'default'} size="small" />;
}
