import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ProjectsPage } from '@/pages/projects/ProjectsPage';
import { TasksPage } from '@/pages/tasks/TasksPage';
import { TeamPage } from '@/pages/settings/TeamPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { ProfilePage } from '@/pages/settings/ProfilePage';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ProtectedRoute, GuestRoute } from '@/features/auth';
import { ROUTES } from '@/shared/constants/routes';

export function AppRouter() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route
          path={ROUTES.LOGIN}
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path={ROUTES.REGISTER}
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
      </Route>

      {/* App routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
        <Route path={ROUTES.PROJECTS} element={<ProjectsPage />} />
        <Route path={ROUTES.TASKS} element={<TasksPage />} />
        <Route path={ROUTES.TEAM} element={<TeamPage />} />
        <Route
          path={ROUTES.SETTINGS}
          element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />

      {/* 404 */}
      <Route
        path="*"
        element={
          <div className="flex h-screen items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-foreground">404</h1>
              <p className="mt-2 text-muted-foreground">Page not found</p>
            </div>
          </div>
        }
      />
    </Routes>
  );
}
