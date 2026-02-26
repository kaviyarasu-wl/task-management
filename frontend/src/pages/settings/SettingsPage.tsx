import { Building2, Users, FolderKanban, Loader2 } from 'lucide-react';
import { useTenantSettings, useUpdateSettings } from '@/features/settings/hooks/useSettings';
import { useMembers } from '@/features/users/hooks/useUsers';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { PlanBadge } from '@/features/settings/components/PlanBadge';
import { UsageCard } from '@/features/settings/components/UsageCard';
import { SettingsForm } from '@/features/settings/components/SettingsForm';
import type { SettingsFormData } from '@/features/settings/validators/settings.validators';
import { formatDate } from '@/shared/lib/utils';

export function SettingsPage() {
  const { data: tenantData, isLoading: isLoadingTenant } = useTenantSettings();
  const { data: membersData } = useMembers();
  const { data: projectsData } = useProjects();
  const updateMutation = useUpdateSettings();

  const tenant = tenantData?.data;
  const membersCount = membersData?.data?.length ?? 0;
  const projectsCount = projectsData?.pages?.[0]?.total ?? 0;

  const handleSettingsSubmit = (data: SettingsFormData) => {
    updateMutation.mutate(data);
  };

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

      {/* Settings Form */}
      <div className="mt-6 rounded-lg border border-border bg-background p-6">
        <h3 className="text-lg font-semibold text-foreground">Limits</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure resource limits for your organization
        </p>

        <div className="mt-6">
          <SettingsForm
            defaultValues={{
              maxUsers: tenant.settings.maxUsers,
              maxProjects: tenant.settings.maxProjects,
            }}
            onSubmit={handleSettingsSubmit}
            isLoading={updateMutation.isPending}
          />
        </div>
      </div>

      {/* Plan Info */}
      <div className="mt-6 rounded-lg border border-border bg-background p-6">
        <h3 className="text-lg font-semibold text-foreground">Plan Details</h3>
        <div className="mt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current Plan</span>
            <span className="font-medium capitalize text-foreground">{tenant.plan}</span>
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
        </div>

        {tenant.plan === 'free' && (
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
