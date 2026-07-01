import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { createResident, removeResident } from '../../api/residents.api';
import { createUnit, deleteUnit, fetchUnits } from '../../api/units.api';
import { fetchUsers, registerUser } from '../../api/users.api';
import { ConfirmDialog } from '../../components/ConfirmDialog';

export function UnitsListPage() {
  const queryClient = useQueryClient();
  const unitsQuery = useQuery({ queryKey: ['units'], queryFn: fetchUnits });
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: fetchUsers });

  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [unitForm, setUnitForm] = useState({ identifier: '', block: '', number: '' });

  const [residentDialogUnitId, setResidentDialogUnitId] = useState<string | null>(null);
  const [residentMode, setResidentMode] = useState<'existing' | 'new'>('existing');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '' });
  const [isOwner, setIsOwner] = useState(false);

  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  const createUnitMutation = useMutation({
    mutationFn: createUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setUnitDialogOpen(false);
      setUnitForm({ identifier: '', block: '', number: '' });
    },
  });

  const deleteUnitMutation = useMutation({
    mutationFn: deleteUnit,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['units'] }),
  });

  const linkResidentMutation = useMutation({
    mutationFn: async () => {
      let userId = selectedUserId;
      if (residentMode === 'new') {
        const created = await registerUser({ ...newUserForm, role: 'MORADOR' });
        userId = created.id;
      }
      return createResident({ userId, unitId: residentDialogUnitId!, isOwner });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeResidentDialog();
    },
  });

  const removeResidentMutation = useMutation({
    mutationFn: removeResident,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setRemoveTarget(null);
    },
  });

  function closeResidentDialog() {
    setResidentDialogUnitId(null);
    setSelectedUserId('');
    setNewUserForm({ name: '', email: '', password: '' });
    setIsOwner(false);
    setResidentMode('existing');
  }

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Unidades e Moradores</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => setUnitDialogOpen(true)}>
          Nova Unidade
        </Button>
      </Box>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Unidade</TableCell>
              <TableCell>Bloco</TableCell>
              <TableCell>Número</TableCell>
              <TableCell>Moradores</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {unitsQuery.data?.map((unit) => (
              <TableRow key={unit.id}>
                <TableCell>{unit.identifier}</TableCell>
                <TableCell>{unit.block ?? '-'}</TableCell>
                <TableCell>{unit.number}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {unit.residents?.map((r) => (
                      <Chip
                        key={r.id}
                        label={`${r.user?.name}${r.isOwner ? ' (proprietário)' : ''}`}
                        onDelete={() => setRemoveTarget(r.id)}
                        size="small"
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => setResidentDialogUnitId(unit.id)} title="Vincular morador">
                    <PersonAddIcon fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => deleteUnitMutation.mutate(unit.id)} title="Excluir unidade">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={unitDialogOpen} onClose={() => setUnitDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Nova Unidade</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Identificador"
            value={unitForm.identifier}
            onChange={(e) => setUnitForm({ ...unitForm, identifier: e.target.value })}
            placeholder="Bloco A - Apto 101"
            fullWidth
          />
          <TextField
            label="Bloco"
            value={unitForm.block}
            onChange={(e) => setUnitForm({ ...unitForm, block: e.target.value })}
            fullWidth
          />
          <TextField
            label="Número"
            value={unitForm.number}
            onChange={(e) => setUnitForm({ ...unitForm, number: e.target.value })}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnitDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => createUnitMutation.mutate(unitForm)}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!residentDialogUnitId} onClose={closeResidentDialog} fullWidth maxWidth="xs">
        <DialogTitle>Vincular Morador</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            select
            label="Modo"
            value={residentMode}
            onChange={(e) => setResidentMode(e.target.value as 'existing' | 'new')}
          >
            <MenuItem value="existing">Selecionar usuário existente</MenuItem>
            <MenuItem value="new">Criar novo usuário</MenuItem>
          </TextField>

          {residentMode === 'existing' ? (
            <TextField
              select
              label="Usuário"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              {usersQuery.data?.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <>
              <TextField
                label="Nome"
                value={newUserForm.name}
                onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
              />
              <TextField
                label="E-mail"
                type="email"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
              />
              <TextField
                label="Senha"
                type="password"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
              />
            </>
          )}

          <TextField
            select
            label="Proprietário?"
            value={isOwner ? 'yes' : 'no'}
            onChange={(e) => setIsOwner(e.target.value === 'yes')}
          >
            <MenuItem value="no">Não (inquilino)</MenuItem>
            <MenuItem value="yes">Sim (proprietário)</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeResidentDialog}>Cancelar</Button>
          <Button variant="contained" onClick={() => linkResidentMutation.mutate()}>
            Vincular
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!removeTarget}
        title="Encerrar vínculo"
        message="Deseja remover este morador da unidade?"
        onConfirm={() => removeResidentMutation.mutate(removeTarget!)}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}
