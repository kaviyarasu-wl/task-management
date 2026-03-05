import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  FolderKanban,
  Loader2,
  ListChecks,
  GitBranch,
  Webhook,
  ChevronRight,
  Check,
} from 'lucide-react';
import { useTenantSettings } from '@/features/settings/hooks/useSettings';
import { useMembers } from '@/features/users/hooks/useUsers';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { PlanBadge } from '@/features/settings/components/PlanBadge';
import { UsageCard } from '@/features/settings/components/UsageCard';
import { formatDate } from '@/shared/lib/utils';
import { ROUTES } from '@/shared/constants/routes';

export function SettingsPage() {
  const { data: tenantData, isLoading: isLoadingTenant } = useTenantSettings();
  const { data: membersData } = useMembers();
  const { data: projectsData } = useProjects();
  const tenant = tenantData?.data;
  const membersCount = membersData?.data?.length ?? 0;
  const projectsCount = projectsData?.pages?.[0]?.total ?? 0;

  if (isLoadingTenant) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Failed to load organization settings
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-foreground">Organization Settings</h1>

      {/* Organization Info */}
      <div className="mt-6 rounded-lg border border-border bg-background p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{tenant.name}</h2>
              <p className="text-sm text-muted-foreground">@{tenant.slug}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Created {formatDate(tenant.createdAt)}
              </p>
            </div>
          </div>
          <PlanBadge plan={tenant.plan} />
        </div>
      </div>

      {/* Settings Navigation */}
      <div className="mt-6 rounded-lg border border-border bg-background">
        <h3 className="border-b border-border px-6 py-4 text-sm font-medium text-muted-foreground">
          Configuration
        </h3>
        <div className="divide-y divide-border">
          <Link
            to={ROUTES.SETTINGS_STATUSES}
            className="flex items-center justify-between px-6 py-4 hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <ListChecks className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium text-foreground">Statuses</p>
                <p className="text-sm text-muted-foreground">Manage task statuses and categories</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>

          <Link
            to={ROUTES.SETTINGS_WORKFLOW}
            className="flex items-center justify-between px-6 py-4 hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <GitBranch className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="font-medium text-foreground">Workflow</p>
                <p className="text-sm text-muted-foreground">Configure status transitions and rules</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>

          <Link
            to={ROUTES.SETTINGS_WEBHOOKS}
            className="flex items-center justify-between px-6 py-4 hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <Webhook className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-foreground">Webhooks</p>
                <p className="text-sm text-muted-foreground">Configure outgoing webhook integrations</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-foreground">Usage</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <UsageCard
            title="Team Members"
            current={membersCount}
            max={tenant.settings.maxUsers}
            icon={<Users className="h-5 w-5 text-muted-foreground" />}
          />
          <UsageCard
            title="Projects"
            current={projectsCount}
            max={tenant.settings.maxProjects}
            icon={<FolderKanban className="h-5 w-5 text-muted-foreground" />}
          />
        </div>
      </div>

      {/* Plan Info */}
      <div className="mt-6 rounded-lg border border-border bg-background p-6">
        <h3 className="text-lg font-semibold text-foreground">Plan Details</h3>
        <div className="mt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current Plan</span>
            <span className="font-medium capitalize text-foreground">
              {tenant.planDetails?.name ?? tenant.plan}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium text-green-600">
              {tenant.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Organization ID</span>
            <span className="font-mono text-xs text-foreground">{tenant.tenantId}</span>
          </div>

          {tenant.planDetails && (
            <>
              <div className="border-t border-border pt-3">
                <h4 className="text-sm font-medium text-foreground">Plan Limits</h4>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Projects</span>
                    <span className="font-medium text-foreground">
                      {tenant.planDetails.projectsLimit === -1
                        ? 'Unlimited'
                        : tenant.planDetails.projectsLimit}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Team Members</span>
                    <span className="font-medium text-foreground">
                      {tenant.planDetails.usersLimit === -1
                        ? 'Unlimited'
                        : tenant.planDetails.usersLimit}
                    </span>
                  </div>
                </div>
              </div>

              {tenant.planDetails.features.length > 0 && (
                <div className="border-t border-border pt-3">
                  <h4 className="text-sm font-medium text-foreground">Included Features</h4>
                  <ul className="mt-2 space-y-1.5">
                    {tenant.planDetails.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 shrink-0 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {(tenant.planDetails?.slug === 'free' || (!tenant.planDetails && tenant.plan === 'free')) && (
          <div className="mt-4 rounded-md bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              Upgrade to Pro or Enterprise for higher limits and advanced features.
            </p>
            <button className="mt-2 text-sm font-medium text-primary hover:underline">
              View Plans
            </button>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-6">
        <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Irreversible actions that affect your entire organization
        </p>

        <div className="mt-4">
          <button
            disabled
            className="rounded-md border border-destructive px-4 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete Organization
          </button>
          <p className="mt-2 text-xs text-muted-foreground">
            This feature is not available. Contact support for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
