import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  cancelBooking,
  createBooking,
  createCommonArea,
  fetchBookings,
  fetchCommonAreas,
} from '../../api/bookings.api';
import { RoleGuard } from '../../components/RoleGuard';
import { StatusChip } from '../../components/StatusChip';
import { useAuth } from '../../context/AuthContext';

export function BookingsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const areasQuery = useQuery({ queryKey: ['common-areas'], queryFn: fetchCommonAreas });
  const bookingsQuery = useQuery({ queryKey: ['bookings'], queryFn: () => fetchBookings() });

  const [areaDialogOpen, setAreaDialogOpen] = useState(false);
  const [areaForm, setAreaForm] = useState({ name: '', openTime: '08:00', closeTime: '22:00' });

  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({ commonAreaId: '', startsAt: '', endsAt: '', notes: '' });
  const [bookingError, setBookingError] = useState<string | null>(null);

  const createAreaMutation = useMutation({
    mutationFn: createCommonArea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['common-areas'] });
      setAreaDialogOpen(false);
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setBookingDialogOpen(false);
      setBookingError(null);
      setBookingForm({ commonAreaId: '', startsAt: '', endsAt: '', notes: '' });
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: { message?: string } | string } } })?.response?.data
          ?.message;
      setBookingError(
        typeof message === 'string' ? message : message?.message ?? 'Não foi possível criar a reserva',
      );
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  });

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Reservas de Áreas Comuns</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <RoleGuard roles={['ADMIN', 'SINDICO']}>
            <Button variant="outlined" onClick={() => setAreaDialogOpen(true)}>
              Nova Área Comum
            </Button>
          </RoleGuard>
          <Button startIcon={<AddIcon />} variant="contained" onClick={() => setBookingDialogOpen(true)}>
            Nova Reserva
          </Button>
        </Box>
      </Box>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Área</TableCell>
              <TableCell>Início</TableCell>
              <TableCell>Fim</TableCell>
              <TableCell>Reservado por</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bookingsQuery.data?.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>{booking.commonArea?.name}</TableCell>
                <TableCell>{new Date(booking.startsAt).toLocaleString('pt-BR')}</TableCell>
                <TableCell>{new Date(booking.endsAt).toLocaleString('pt-BR')}</TableCell>
                <TableCell>{booking.createdBy?.name}</TableCell>
                <TableCell>
                  <StatusChip status={booking.status} />
                </TableCell>
                <TableCell align="right">
                  {booking.status === 'CONFIRMED' &&
                    (booking.createdById === user?.id || user?.role !== 'MORADOR') && (
                      <IconButton
                        onClick={() => cancelBookingMutation.mutate(booking.id)}
                        aria-label={`Cancelar reserva ${booking.commonArea?.name ?? booking.id}`}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={areaDialogOpen} onClose={() => setAreaDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Nova Área Comum</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Nome"
            value={areaForm.name}
            onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
          />
          <TextField
            label="Horário de abertura"
            value={areaForm.openTime}
            onChange={(e) => setAreaForm({ ...areaForm, openTime: e.target.value })}
          />
          <TextField
            label="Horário de fechamento"
            value={areaForm.closeTime}
            onChange={(e) => setAreaForm({ ...areaForm, closeTime: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAreaDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => createAreaMutation.mutate(areaForm)}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bookingDialogOpen} onClose={() => setBookingDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Nova Reserva</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {bookingError && <Alert severity="error">{bookingError}</Alert>}
          <TextField
            select
            label="Área comum"
            value={bookingForm.commonAreaId}
            onChange={(e) => setBookingForm({ ...bookingForm, commonAreaId: e.target.value })}
          >
            {areasQuery.data?.map((area) => (
              <MenuItem key={area.id} value={area.id}>
                {area.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Início"
            type="datetime-local"
            slotProps={{ inputLabel: { shrink: true } }}
            value={bookingForm.startsAt}
            onChange={(e) => setBookingForm({ ...bookingForm, startsAt: e.target.value })}
          />
          <TextField
            label="Fim"
            type="datetime-local"
            slotProps={{ inputLabel: { shrink: true } }}
            value={bookingForm.endsAt}
            onChange={(e) => setBookingForm({ ...bookingForm, endsAt: e.target.value })}
          />
          <TextField
            label="Observações"
            value={bookingForm.notes}
            onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() =>
              createBookingMutation.mutate({
                commonAreaId: bookingForm.commonAreaId,
                startsAt: new Date(bookingForm.startsAt).toISOString(),
                endsAt: new Date(bookingForm.endsAt).toISOString(),
                notes: bookingForm.notes || undefined,
              })
            }
          >
            Reservar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
