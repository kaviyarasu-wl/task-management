import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { AcceptInvitePage } from '@/pages/auth/AcceptInvitePage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ProjectsPage } from '@/pages/projects/ProjectsPage';
import { ProjectDetailPage } from '@/pages/projects/ProjectDetailPage';
import { TasksPage } from '@/pages/tasks/TasksPage';
import { CalendarPage } from '@/pages/calendar/CalendarPage';
import { TeamPage } from '@/pages/settings/TeamPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { ProfilePage } from '@/pages/settings/ProfilePage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { WebhooksPage } from '@/pages/settings/WebhooksPage';
import { StatusListPage } from '@/features/statuses/components/StatusListPage';
import { WorkflowPage } from '@/features/statuses/components/WorkflowPage';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { ProtectedRoute, GuestRoute } from '@/features/auth';
import { AdminRoute } from '@/features/admin/components/AdminRoute';
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { PlansPage } from '@/pages/admin/PlansPage';
import { TenantsPage } from '@/pages/admin/TenantsPage';
import { UsersPage } from '@/pages/admin/UsersPage';
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

      {/* Accept invitation (accessible to anyone) */}
      <Route path={ROUTES.ACCEPT_INVITE} element={<AcceptInvitePage />} />

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
        <Route path={ROUTES.PROJECT_DETAIL} element={<ProjectDetailPage />} />
        <Route path={ROUTES.TASKS} element={<TasksPage />} />
        <Route path={ROUTES.CALENDAR} element={<CalendarPage />} />
        <Route path={ROUTES.TEAM} element={<TeamPage />} />
        <Route
          path={ROUTES.REPORTS}
          element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.SETTINGS}
          element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.SETTINGS_STATUSES}
          element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <StatusListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.SETTINGS_WORKFLOW}
          element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <WorkflowPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.SETTINGS_WEBHOOKS}
          element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <WebhooksPage />
            </ProtectedRoute>
          }
        />
        <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
      </Route>

      {/* Admin login */}
      <Route element={<AuthLayout />}>
        <Route
          path={ROUTES.ADMIN_LOGIN}
          element={
            <GuestRoute>
              <AdminLoginPage />
            </GuestRoute>
          }
        />
      </Route>

      {/* Admin routes */}
      <Route
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route path={ROUTES.ADMIN} element={<AdminDashboardPage />} />
        <Route path={ROUTES.ADMIN_PLANS} element={<PlansPage />} />
        <Route path={ROUTES.ADMIN_TENANTS} element={<TenantsPage />} />
        <Route path={ROUTES.ADMIN_USERS} element={<UsersPage />} />
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
