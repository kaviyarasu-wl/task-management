import { useState } from 'react';
import {
  Search,
  MoreVertical,
  Pencil,
  ArrowRightLeft,
  Trash2,
  Key,
} from 'lucide-react';
import { useAdminUsers } from '@/features/admin/hooks/useAdminUsers';
import { useAdminUserMutations } from '@/features/admin/hooks/useAdminUserMutations';
import { useAdminTenants } from '@/features/admin/hooks/useAdminTenants';
import { Card } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Modal } from '@/shared/components/ui/Modal';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import type { AdminUser } from '@/features/admin/types/adminUser.types';

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'viewer', label: 'Viewer' },
];

const ROLE_EDIT_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'viewer', label: 'Viewer' },
];

const MOVE_ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'viewer', label: 'Viewer' },
];

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case 'owner':
      return 'warning' as const;
    case 'admin':
      return 'info' as const;
    default:
      return 'secondary' as const;
  }
}

export function UsersPage() {
  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [movingUser, setMovingUser] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [targetTenantId, setTargetTenantId] = useState('');
  const [moveRole, setMoveRole] = useState('member');

  // Edit form state
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    role: '',
  });

  // Queries
  const { data: usersData, isLoading } = useAdminUsers({
    search: search || undefined,
    role: roleFilter || undefined,
    page,
    limit: 20,
  });
  const { data: tenantsData } = useAdminTenants({ limit: 100 });

  // Mutations
  const { updateUser, moveUser, deleteUser, resetPassword } =
    useAdminUserMutations();

  const users = usersData?.data ?? [];
  const totalPages = usersData?.totalPages ?? 1;
  const tenants = tenantsData?.data ?? [];

  const handleEditOpen = (user: AdminUser) => {
    setEditingUser(user);
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
  };

  const handleUpdate = () => {
    if (!editingUser) return;
    updateUser.mutate(
      { userId: editingUser._id, data: editForm },
      { onSuccess: () => setEditingUser(null) }
    );
  };

  const handleMove = () => {
    if (!movingUser || !targetTenantId) return;
    moveUser.mutate(
      {
        userId: movingUser._id,
        targetTenantId,
        newRole: moveRole,
      },
      {
        onSuccess: () => {
          setMovingUser(null);
          setTargetTenantId('');
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deletingUser) return;
    deleteUser.mutate(deletingUser._id, {
      onSuccess: () => setDeletingUser(null),
    });
  };

  const buildDropdownItems = (user: AdminUser) => [
    {
      id: 'edit',
      label: 'Edit',
      icon: <Pencil className="h-4 w-4" />,
      onClick: () => handleEditOpen(user),
    },
    {
      id: 'move',
      label: 'Move to Tenant',
      icon: <ArrowRightLeft className="h-4 w-4" />,
      onClick: () => setMovingUser(user),
    },
    {
      id: 'reset-password',
      label: 'Reset Password',
      icon: <Key className="h-4 w-4" />,
      onClick: () => resetPassword.mutate(user._id),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      danger: true,
      onClick: () => setDeletingUser(user),
    },
  ];

  const tenantSelectOptions = tenants
    .filter((t) => t.tenantId !== movingUser?.tenantId)
    .map((tenant) => ({
      value: tenant.tenantId,
      label: `${tenant.name} (${tenant.slug})`,
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="mt-1 text-gray-300">
          Manage users across all tenants
        </p>
      </div>

      {/* Filters */}
      <Card variant="dark" className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by email or name..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 backdrop-blur-none text-white"
              />
            </div>
          </div>
          <Select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            options={ROLE_OPTIONS}
            className="bg-slate-700/50 border-slate-600/50 backdrop-blur-none text-white"
          />
        </div>
      </Card>

      {/* Table */}
      <Card variant="dark" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-700/50 bg-slate-700/30">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  User
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Tenant
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Last Login
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-3">
                      <Skeleton className="h-10 w-full" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-300"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-white">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-300">
                          {user.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {user.tenantName || user.tenantId}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Dropdown
                        trigger={
                          <span className="rounded-lg p-1 hover:bg-slate-700/50">
                            <MoreVertical className="h-4 w-4 text-gray-300" />
                          </span>
                        }
                        items={buildDropdownItems(user)}
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
              Page {page} of {totalPages}
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

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit User"
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="First Name"
              value={editForm.firstName}
              onChange={(e) =>
                setEditForm({ ...editForm, firstName: e.target.value })
              }
            />
            <Input
              label="Last Name"
              value={editForm.lastName}
              onChange={(e) =>
                setEditForm({ ...editForm, lastName: e.target.value })
              }
            />
          </div>
          <Select
            label="Role"
            value={editForm.role}
            onChange={(e) =>
              setEditForm({ ...editForm, role: e.target.value })
            }
            options={ROLE_EDIT_OPTIONS}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} isLoading={updateUser.isPending}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Move Modal */}
      <Modal
        isOpen={!!movingUser}
        onClose={() => setMovingUser(null)}
        title="Move User to Tenant"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Moving <strong>{movingUser?.email}</strong> to a different tenant.
          </p>
          <Select
            label="Target Tenant"
            value={targetTenantId}
            onChange={(e) => setTargetTenantId(e.target.value)}
            options={tenantSelectOptions}
            placeholder="Select tenant..."
          />
          <Select
            label="Role in New Tenant"
            value={moveRole}
            onChange={(e) => setMoveRole(e.target.value)}
            options={MOVE_ROLE_OPTIONS}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setMovingUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleMove}
              isLoading={moveUser.isPending}
              disabled={!targetTenantId}
            >
              Move User
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDelete}
        title="Delete User Permanently"
        message={`Are you sure you want to permanently delete ${deletingUser?.email}? This cannot be undone.`}
        confirmText="Delete Permanently"
        isDestructive
        isLoading={deleteUser.isPending}
      />
    </div>
  );
}
