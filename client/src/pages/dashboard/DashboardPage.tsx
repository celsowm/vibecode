import { Card, CardContent, Grid, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { fetchAnnouncements } from '../../api/announcements.api';
import { fetchCharges } from '../../api/finance.api';
import { fetchMaintenanceRequests } from '../../api/maintenance.api';
import { useAuth } from '../../context/AuthContext';

export function DashboardPage() {
  const { user } = useAuth();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'SINDICO';

  const chargesQuery = useQuery({
    queryKey: ['charges', 'dashboard'],
    queryFn: () => fetchCharges(isStaff ? { status: 'OVERDUE' } : undefined),
  });
  const announcementsQuery = useQuery({ queryKey: ['announcements'], queryFn: fetchAnnouncements });
  const maintenanceQuery = useQuery({ queryKey: ['maintenance'], queryFn: fetchMaintenanceRequests });

  const openMaintenance = maintenanceQuery.data?.filter((m) => m.status === 'OPEN').length ?? 0;

  return (
    <div>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Olá, {user?.name}
      </Typography>
      <Grid container spacing={2}>
        {isStaff && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">Cobranças em atraso</Typography>
                <Typography variant="h3">{chargesQuery.data?.length ?? '-'}</Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Avisos publicados</Typography>
              <Typography variant="h3">{announcementsQuery.data?.length ?? '-'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Chamados abertos</Typography>
              <Typography variant="h3">{openMaintenance}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
}
