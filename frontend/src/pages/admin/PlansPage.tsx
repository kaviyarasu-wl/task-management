import { useState } from 'react';
import { Plus, MoreVertical, Star, Pencil, Trash2 } from 'lucide-react';
import { usePlans } from '@/features/admin/hooks/usePlans';
import { usePlanMutations } from '@/features/admin/hooks/usePlanMutations';
import { PlanFormModal } from '@/features/admin/components/plans/PlanFormModal';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import type { DropdownItem } from '@/shared/components/ui/Dropdown';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import type { Plan, CreatePlanData } from '@/features/admin/types/plan.types';

export function PlansPage() {
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);

  const { data: plans, isLoading } = usePlans();
  const { createPlan, updatePlan, deletePlan, setDefaultPlan } =
    usePlanMutations();

  const handleCreate = (data: CreatePlanData) => {
    createPlan.mutate(data, {
      onSuccess: () => setIsCreateModalOpen(false),
    });
  };

  const handleUpdate = (data: CreatePlanData) => {
    if (!editingPlan) return;
    updatePlan.mutate(
      { planId: editingPlan._id, data },
      { onSuccess: () => setEditingPlan(null) }
    );
  };

  const handleDelete = () => {
    if (!deletingPlan) return;
    deletePlan.mutate(deletingPlan._id, {
      onSuccess: () => setDeletingPlan(null),
    });
  };

  const formatLimit = (limit: number) => (limit === -1 ? '\u221E' : limit);

  const getDropdownItems = (plan: Plan): DropdownItem[] => {
    const items: DropdownItem[] = [
      {
        id: 'edit',
        label: 'Edit',
        icon: <Pencil className="h-4 w-4" />,
        onClick: () => setEditingPlan(plan),
      },
    ];

    if (!plan.isDefault) {
      items.push({
        id: 'set-default',
        label: 'Set as Default',
        icon: <Star className="h-4 w-4" />,
        onClick: () => setDefaultPlan.mutate(plan._id),
      });
    }

    items.push({
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      danger: true,
      onClick: () => setDeletingPlan(plan),
    });

    return items;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Plans</h1>
          <p className="mt-1 text-gray-300">
            Manage subscription plans
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Plan
        </Button>
      </div>

      {/* Plans Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans?.map((plan) => (
            <Card key={plan._id} variant="dark" className="relative p-6">
              {/* Actions Dropdown */}
              <div className="absolute right-4 top-4">
                <Dropdown
                  items={getDropdownItems(plan)}
                  align="right"
                  trigger={
                    <span className="rounded-lg p-1 hover:bg-slate-700/50 inline-flex">
                      <MoreVertical className="h-4 w-4 text-gray-300" />
                    </span>
                  }
                />
              </div>

              {/* Plan Info */}
              <div className="mb-4 flex items-start gap-2">
                <h3 className="text-lg font-semibold text-white">
                  {plan.name}
                </h3>
                {plan.isDefault && (
                  <Badge variant="success" size="sm">
                    Default
                  </Badge>
                )}
                {!plan.isActive && (
                  <Badge variant="secondary" size="sm">
                    Inactive
                  </Badge>
                )}
              </div>

              <p className="mb-4 text-sm text-gray-300">
                {plan.description || 'No description'}
              </p>

              {/* Pricing */}
              <div className="mb-4">
                <span className="text-2xl font-bold text-white">
                  ${plan.price}
                </span>
                <span className="text-gray-300">
                  /{plan.billingCycle === 'monthly' ? 'mo' : 'yr'}
                </span>
              </div>

              {/* Limits */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Projects</span>
                  <span className="text-white">
                    {formatLimit(plan.projectsLimit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Users</span>
                  <span className="text-white">
                    {formatLimit(plan.usersLimit)}
                  </span>
                </div>
              </div>

              {/* Features */}
              {plan.features.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1">
                  {plan.features.slice(0, 3).map((feature) => (
                    <Badge key={feature} variant="outline" size="sm">
                      {feature}
                    </Badge>
                  ))}
                  {plan.features.length > 3 && (
                    <Badge variant="outline" size="sm">
                      +{plan.features.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <PlanFormModal
        isOpen={isCreateModalOpen || !!editingPlan}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingPlan(null);
        }}
        plan={editingPlan}
        onSubmit={editingPlan ? handleUpdate : handleCreate}
        isLoading={createPlan.isPending || updatePlan.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingPlan}
        onClose={() => setDeletingPlan(null)}
        onConfirm={handleDelete}
        title="Delete Plan"
        message={`Are you sure you want to delete "${deletingPlan?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isDestructive
        isLoading={deletePlan.isPending}
      />
    </div>
  );
}
