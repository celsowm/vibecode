import { Box, Button, Card, CardContent, CardHeader, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, Switch, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PushPinIcon from '@mui/icons-material/PushPin';
import { createAnnouncement, deleteAnnouncement, fetchAnnouncements } from '../../api/announcements.api';
import { RoleGuard } from '../../components/RoleGuard';

export function AnnouncementsPage() {
  const queryClient = useQueryClient();
  const announcementsQuery = useQuery({ queryKey: ['announcements'], queryFn: fetchAnnouncements });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', pinned: false });

  const createMutation = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setDialogOpen(false);
      setForm({ title: '', body: '', pinned: false });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  });

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Avisos</Typography>
        <RoleGuard roles={['ADMIN', 'SINDICO']}>
          <Button startIcon={<AddIcon />} variant="contained" onClick={() => setDialogOpen(true)}>
            Novo Aviso
          </Button>
        </RoleGuard>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {announcementsQuery.data?.map((announcement) => (
          <Card key={announcement.id}>
            <CardHeader
              title={announcement.title}
              subheader={`${announcement.author?.name ?? ''} - ${new Date(
                announcement.createdAt,
              ).toLocaleDateString('pt-BR')}`}
              avatar={announcement.pinned ? <PushPinIcon color="primary" /> : undefined}
              action={
                <RoleGuard roles={['ADMIN', 'SINDICO']}>
                  <IconButton onClick={() => deleteMutation.mutate(announcement.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </RoleGuard>
              }
            />
            <CardContent>
              <Typography variant="body1">{announcement.body}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Novo Aviso</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Título"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <TextField
            label="Conteúdo"
            multiline
            minRows={4}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.pinned}
                onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
              />
            }
            label="Fixar no topo"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => createMutation.mutate(form)}>
            Publicar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
