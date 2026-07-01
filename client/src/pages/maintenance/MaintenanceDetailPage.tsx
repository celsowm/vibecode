import { Box, Button, Divider, MenuItem, Paper, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import {
  addMaintenanceComment,
  fetchMaintenanceRequest,
  updateMaintenanceStatus,
} from '../../api/maintenance.api';
import { RoleGuard } from '../../components/RoleGuard';
import { StatusChip } from '../../components/StatusChip';
import type { MaintenanceStatus } from '../../types';

export function MaintenanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const requestQuery = useQuery({
    queryKey: ['maintenance', id],
    queryFn: () => fetchMaintenanceRequest(id!),
    enabled: !!id,
  });

  const [comment, setComment] = useState('');

  const statusMutation = useMutation({
    mutationFn: (status: MaintenanceStatus) => updateMaintenanceStatus(id!, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance', id] }),
  });

  const commentMutation = useMutation({
    mutationFn: () => addMaintenanceComment(id!, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', id] });
      setComment('');
    },
  });

  if (!requestQuery.data) return null;
  const request = requestQuery.data;

  return (
    <div>
      <Typography variant="h4" sx={{ mb: 1 }}>
        {request.title}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <StatusChip status={request.priority} />
        <StatusChip status={request.status} />
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="body1">{request.description}</Typography>
        <Typography variant="caption" color="text.secondary">
          Aberto por {request.openedBy?.name} em {new Date(request.createdAt).toLocaleString('pt-BR')}
        </Typography>
      </Paper>

      <RoleGuard roles={['ADMIN', 'SINDICO']}>
        <Box sx={{ mb: 3 }}>
          <TextField
            select
            label="Alterar status"
            value={request.status}
            onChange={(e) => statusMutation.mutate(e.target.value as MaintenanceStatus)}
            sx={{ width: 220 }}
          >
            <MenuItem value="OPEN">Aberto</MenuItem>
            <MenuItem value="IN_PROGRESS">Em andamento</MenuItem>
            <MenuItem value="RESOLVED">Resolvido</MenuItem>
            <MenuItem value="CLOSED">Fechado</MenuItem>
          </TextField>
        </Box>
      </RoleGuard>

      <Typography variant="h6" sx={{ mb: 1 }}>
        Comentários
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
        {request.comments?.map((c) => (
          <Paper key={c.id} sx={{ p: 1.5 }} variant="outlined">
            <Typography variant="body2">{c.message}</Typography>
            <Typography variant="caption" color="text.secondary">
              {c.author?.name} - {new Date(c.createdAt).toLocaleString('pt-BR')}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Divider sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          placeholder="Adicionar comentário..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <Button variant="contained" onClick={() => commentMutation.mutate()} disabled={!comment}>
          Enviar
        </Button>
      </Box>
    </div>
  );
}
