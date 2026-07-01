import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { createMaintenanceRequest, fetchMaintenanceRequests } from '../../api/maintenance.api';
import { StatusChip } from '../../components/StatusChip';
import type { MaintenancePriority } from '../../types';

export function MaintenanceListPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const requestsQuery = useQuery({ queryKey: ['maintenance'], queryFn: fetchMaintenanceRequests });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<{ title: string; description: string; priority: MaintenancePriority }>({
    title: '',
    description: '',
    priority: 'MEDIUM',
  });

  const createMutation = useMutation({
    mutationFn: createMaintenanceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      setDialogOpen(false);
      setForm({ title: '', description: '', priority: 'MEDIUM' });
    },
  });

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Chamados de Manutenção</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => setDialogOpen(true)}>
          Abrir Chamado
        </Button>
      </Box>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Aberto por</TableCell>
              <TableCell>Prioridade</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requestsQuery.data?.map((req) => (
              <TableRow
                key={req.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/maintenance/${req.id}`)}
              >
                <TableCell>{req.title}</TableCell>
                <TableCell>{req.openedBy?.name}</TableCell>
                <TableCell>
                  <StatusChip status={req.priority} />
                </TableCell>
                <TableCell>
                  <StatusChip status={req.status} />
                </TableCell>
                <TableCell>{new Date(req.createdAt).toLocaleDateString('pt-BR')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Abrir Chamado</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Título"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <TextField
            label="Descrição"
            multiline
            minRows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <TextField
            select
            label="Prioridade"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value as MaintenancePriority })}
          >
            <MenuItem value="LOW">Baixa</MenuItem>
            <MenuItem value="MEDIUM">Média</MenuItem>
            <MenuItem value="HIGH">Alta</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => createMutation.mutate(form)}>
            Enviar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
