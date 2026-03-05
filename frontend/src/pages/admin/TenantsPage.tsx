import { useState } from 'react';
import {
  Search,
  MoreVertical,
  Eye,
  ArrowRightLeft,
  UserX,
  UserCheck,
} from 'lucide-react';
import { useAdminTenants } from '@/features/admin/hooks/useAdminTenants';
import { useAdminTenantMutations } from '@/features/admin/hooks/useAdminTenantMutations';
import { useImpersonation } from '@/features/admin/hooks/useImpersonation';
import { usePlans } from '@/features/admin/hooks/usePlans';
import { TenantStatusBadge } from '@/features/admin/components/tenants/TenantStatusBadge';
import { Card } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { SkeletonTable } from '@/shared/components/ui/Skeleton';
import { Modal } from '@/shared/components/ui/Modal';
import type {
  AdminTenant,
  TenantSearchParams,
} from '@/features/admin/types/adminTenant.types';
import type { DropdownItem } from '@/shared/components/ui/Dropdown';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];

export function TenantsPage() {
  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TenantSearchParams['status']>('all');
  const [page, setPage] = useState(1);

  // Modals
  const [suspendingTenant, setSuspendingTenant] = useState<AdminTenant | null>(
    null
  );
  const [suspendReason, setSuspendReason] = useState('');
  const [changingPlan, setChangingPlan] = useState<AdminTenant | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [impersonatingTenant, setImpersonatingTenant] =
    useState<AdminTenant | null>(null);
  const [impersonateReason, setImpersonateReason] = useState('');

  // Queries
  const { data: tenantsData, isLoading } = useAdminTenants({
    search: search || undefined,
    status,
    page,
    limit: 20,
  });
  const { data: plans } = usePlans();

  // Mutations
  const { suspendTenant, activateTenant, changePlan } =
    useAdminTenantMutations();
  const { impersonate } = useImpersonation();

  const tenants = tenantsData?.data ?? [];
  const totalPages = tenantsData?.totalPages ?? 1;

  const handleSuspend = () => {
    if (!suspendingTenant || !suspendReason.trim()) return;
    suspendTenant.mutate(
      { tenantId: suspendingTenant.tenantId, reason: suspendReason },
      {
        onSuccess: () => {
          setSuspendingTenant(null);
          setSuspendReason('');
        },
      }
    );
  };

  const handleChangePlan = () => {
    if (!changingPlan || !selectedPlanId) return;
    changePlan.mutate(
      { tenantId: changingPlan.tenantId, planId: selectedPlanId },
      {
        onSuccess: () => {
          setChangingPlan(null);
          setSelectedPlanId('');
        },
      }
    );
  };

  const handleImpersonate = () => {
    if (!impersonatingTenant || !impersonateReason.trim()) return;
    impersonate.mutate(
      { tenantId: impersonatingTenant.tenantId, reason: impersonateReason },
      {
        onSuccess: () => {
          setImpersonatingTenant(null);
          setImpersonateReason('');
        },
      }
    );
  };

  const getDropdownItems = (tenant: AdminTenant): DropdownItem[] => {
    const items: DropdownItem[] = [
      {
        id: 'impersonate',
        label: 'Impersonate',
        icon: <Eye className="h-4 w-4" />,
        onClick: () => setImpersonatingTenant(tenant),
      },
      {
        id: 'change-plan',
        label: 'Change Plan',
        icon: <ArrowRightLeft className="h-4 w-4" />,
        onClick: () => {
          setChangingPlan(tenant);
          setSelectedPlanId(tenant.planId?._id ?? '');
        },
      },
    ];

    if (tenant.suspendedAt) {
      items.push({
        id: 'activate',
        label: 'Activate',
        icon: <UserCheck className="h-4 w-4" />,
        onClick: () => activateTenant.mutate(tenant.tenantId),
      });
    } else {
      items.push({
        id: 'suspend',
        label: 'Suspend',
        icon: <UserX className="h-4 w-4" />,
        danger: true,
        onClick: () => setSuspendingTenant(tenant),
      });
    }

    return items;
  };

  const planOptions =
    plans?.map((plan) => ({
      value: plan._id,
      label: `${plan.name} ($${plan.price}/${plan.billingCycle})`,
    })) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Tenants</h1>
        <p className="mt-1 text-gray-300">
          Manage all tenants across the platform
        </p>
      </div>

      {/* Filters */}
      <Card variant="dark" className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name or slug..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 backdrop-blur-none text-white"
              />
            </div>
          </div>
          <div className="w-48">
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as TenantSearchParams['status']);
                setPage(1);
              }}
              options={STATUS_OPTIONS}
              className="bg-slate-700/50 border-slate-600/50 backdrop-blur-none text-white"
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card variant="dark" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-700/50 bg-slate-700/30">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Tenant
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Plan
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-4">
                    <SkeletonTable rows={5} columns={5} />
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-300"
                  >
                    No tenants found
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant._id} className="hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-white">
                          {tenant.name}
                        </p>
                        <p className="text-sm text-gray-300">
                          {tenant.slug}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">
                        {tenant.planId?.name ?? 'Unknown'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <TenantStatusBadge
                        isActive={tenant.isActive}
                        suspendedAt={tenant.suspendedAt}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Dropdown
                        trigger={
                          <span className="rounded-lg p-1 hover:bg-slate-700/50 inline-flex">
                            <MoreVertical className="h-4 w-4 text-gray-300" />
                          </span>
                        }
                        items={getDropdownItems(tenant)}
                        align="right"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-700/50 px-4 py-3">
            <p className="text-sm text-gray-300">
              Page {page} of {totalPages} ({tenantsData?.total ?? 0} total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Suspend Modal */}
      <Modal
        isOpen={!!suspendingTenant}
        onClose={() => setSuspendingTenant(null)}
        title="Suspend Tenant"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Suspending <strong>{suspendingTenant?.name}</strong> will prevent all
            users from accessing the application.
          </p>
          <div>
            <label className="block text-sm font-medium text-white">
              Reason *
            </label>
            <Input
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Reason for suspension..."
              className="mt-1"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setSuspendingTenant(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspend}
              isLoading={suspendTenant.isPending}
              disabled={!suspendReason.trim()}
            >
              Suspend Tenant
            </Button>
          </div>
        </div>
      </Modal>

      {/* Change Plan Modal */}
      <Modal
        isOpen={!!changingPlan}
        onClose={() => setChangingPlan(null)}
        title="Change Plan"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Change plan for <strong>{changingPlan?.name}</strong>
          </p>
          <div>
            <Select
              label="New Plan"
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              options={planOptions}
              placeholder="Select plan..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setChangingPlan(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleChangePlan}
              isLoading={changePlan.isPending}
              disabled={!selectedPlanId}
            >
              Change Plan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Impersonate Modal */}
      <Modal
        isOpen={!!impersonatingTenant}
        onClose={() => setImpersonatingTenant(null)}
        title="Impersonate Tenant"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            You will be logged in as the owner of{' '}
            <strong>{impersonatingTenant?.name}</strong>. All actions will be
            logged.
          </p>
          <div>
            <label className="block text-sm font-medium text-white">
              Reason *
            </label>
            <Input
              value={impersonateReason}
              onChange={(e) => setImpersonateReason(e.target.value)}
              placeholder="Support ticket #123..."
              className="mt-1"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setImpersonatingTenant(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImpersonate}
              isLoading={impersonate.isPending}
              disabled={!impersonateReason.trim()}
            >
              Start Impersonation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
