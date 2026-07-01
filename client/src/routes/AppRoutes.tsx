import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../layout/AppLayout';
import { AnnouncementsPage } from '../pages/announcements/AnnouncementsPage';
import { BookingsPage } from '../pages/bookings/BookingsPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { ChargesPage } from '../pages/finance/ChargesPage';
import { MyChargesPage } from '../pages/finance/MyChargesPage';
import { LoginPage } from '../pages/login/LoginPage';
import { MaintenanceDetailPage } from '../pages/maintenance/MaintenanceDetailPage';
import { MaintenanceListPage } from '../pages/maintenance/MaintenanceListPage';
import { UnitsListPage } from '../pages/units/UnitsListPage';
import { ProtectedRoute } from './ProtectedRoute';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/units"
        element={
          <ProtectedRoute roles={['ADMIN', 'SINDICO']}>
            <AppLayout>
              <UnitsListPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/finance/charges"
        element={
          <ProtectedRoute roles={['ADMIN', 'SINDICO']}>
            <AppLayout>
              <ChargesPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/finance/my-charges"
        element={
          <ProtectedRoute roles={['MORADOR']}>
            <AppLayout>
              <MyChargesPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <AppLayout>
              <BookingsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/announcements"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AnnouncementsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/maintenance"
        element={
          <ProtectedRoute>
            <AppLayout>
              <MaintenanceListPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/maintenance/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <MaintenanceDetailPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
