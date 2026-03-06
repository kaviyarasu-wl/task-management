import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { ProtectedRoute, GuestRoute } from '@/features/auth';
import { AdminRoute } from '@/features/admin/components/AdminRoute';
import { LazyPageFallback } from '@/shared/components/LazyPageFallback';
import { ROUTES } from '@/shared/constants/routes';

// Lazy-loaded auth pages
const LoginPage = lazy(() =>
  import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('@/pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);
const AcceptInvitePage = lazy(() =>
  import('@/pages/auth/AcceptInvitePage').then((m) => ({ default: m.AcceptInvitePage }))
);
const OAuthCallbackPage = lazy(() =>
  import('@/pages/auth/OAuthCallbackPage').then((m) => ({ default: m.OAuthCallbackPage }))
);
const MFAVerifyPage = lazy(() =>
  import('@/pages/auth/MFAVerifyPage').then((m) => ({ default: m.MFAVerifyPage }))
);

// Lazy-loaded app pages
const DashboardPage = lazy(() =>
  import('@/pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const ProjectsPage = lazy(() =>
  import('@/pages/projects/ProjectsPage').then((m) => ({ default: m.ProjectsPage }))
);
const ProjectDetailPage = lazy(() =>
  import('@/pages/projects/ProjectDetailPage').then((m) => ({ default: m.ProjectDetailPage }))
);
const TasksPage = lazy(() =>
  import('@/pages/tasks/TasksPage').then((m) => ({ default: m.TasksPage }))
);
const CalendarPage = lazy(() =>
  import('@/pages/calendar/CalendarPage').then((m) => ({ default: m.CalendarPage }))
);
const TeamPage = lazy(() =>
  import('@/pages/settings/TeamPage').then((m) => ({ default: m.TeamPage }))
);
const SettingsPage = lazy(() =>
  import('@/pages/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const ProfilePage = lazy(() =>
  import('@/pages/settings/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);
const ReportsPage = lazy(() =>
  import('@/pages/reports/ReportsPage').then((m) => ({ default: m.ReportsPage }))
);
const SearchPage = lazy(() =>
  import('@/pages/search/SearchPage').then((m) => ({ default: m.SearchPage }))
);
const WebhooksPage = lazy(() =>
  import('@/pages/settings/WebhooksPage').then((m) => ({ default: m.WebhooksPage }))
);
const AuditLogPage = lazy(() =>
  import('@/pages/settings/AuditLogPage').then((m) => ({ default: m.AuditLogPage }))
);
const IntegrationsPage = lazy(() =>
  import('@/pages/settings/IntegrationsPage').then((m) => ({ default: m.IntegrationsPage }))
);

// Lazy-loaded feature pages
const RolesSettingsPage = lazy(() =>
  import('@/features/roles/components/RolesSettingsPage').then((m) => ({ default: m.RolesSettingsPage }))
);
const OAuthCallback = lazy(() =>
  import('@/features/integrations/components/OAuthCallback').then((m) => ({ default: m.OAuthCallback }))
);
const StatusListPage = lazy(() =>
  import('@/features/statuses/components/StatusListPage').then((m) => ({ default: m.StatusListPage }))
);
const WorkflowPage = lazy(() =>
  import('@/features/statuses/components/WorkflowPage').then((m) => ({ default: m.WorkflowPage }))
);

// Lazy-loaded admin pages
const AdminLoginPage = lazy(() =>
  import('@/pages/admin/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage }))
);
const AdminDashboardPage = lazy(() =>
  import('@/pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage }))
);
const PlansPage = lazy(() =>
  import('@/pages/admin/PlansPage').then((m) => ({ default: m.PlansPage }))
);
const TenantsPage = lazy(() =>
  import('@/pages/admin/TenantsPage').then((m) => ({ default: m.TenantsPage }))
);
const UsersPage = lazy(() =>
  import('@/pages/admin/UsersPage').then((m) => ({ default: m.UsersPage }))
);

export function AppRouter() {
  return (
    <Suspense fallback={<LazyPageFallback />}>
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

        {/* MFA verify (uses AuthLayout, accessible during login flow) */}
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.MFA_VERIFY} element={<MFAVerifyPage />} />
        </Route>

        {/* OAuth callback (no layout -- transitional page) */}
        <Route path={ROUTES.OAUTH_CALLBACK} element={<OAuthCallbackPage />} />

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
          <Route
            path={ROUTES.SETTINGS_ROLES}
            element={
              <ProtectedRoute allowedRoles={['owner', 'admin']}>
                <RolesSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.SETTINGS_AUDIT_LOG}
            element={
              <ProtectedRoute allowedRoles={['owner', 'admin']}>
                <AuditLogPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.SETTINGS_INTEGRATIONS}
            element={
              <ProtectedRoute allowedRoles={['owner', 'admin']}>
                <IntegrationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.INTEGRATION_OAUTH_CALLBACK}
            element={
              <ProtectedRoute allowedRoles={['owner', 'admin']}>
                <OAuthCallback />
              </ProtectedRoute>
            }
          />
          <Route path={ROUTES.SEARCH} element={<SearchPage />} />
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
    </Suspense>
  );
}
