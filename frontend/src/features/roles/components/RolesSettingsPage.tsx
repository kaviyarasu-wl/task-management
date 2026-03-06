import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Plus, Pencil, Trash2, Users, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { RoleFormModal } from './RoleFormModal';
import { useRoles, useDeleteRole } from '../hooks/useRoles';
import {
  pageVariants,
  staggerContainerVariants,
  staggerItemVariants,
} from '@/shared/lib/motion';
import { cn } from '@/shared/lib/utils';
import type { Role } from '../types/role.types';

export function RolesSettingsPage() {
  const { data: roles = [], isLoading } = useRoles();
  const deleteMutation = useDeleteRole();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingRole(null);
    setIsFormOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingRole) {
      deleteMutation.mutate(deletingRole._id, {
        onSuccess: () => setDeletingRole(null),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="max-w-4xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Roles</h1>
            <p className="text-sm text-muted-foreground">
              Manage roles and permissions for your organization
            </p>
          </div>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Create Role
        </Button>
      </div>

      {/* Roles List */}
      <motion.div
        variants={staggerContainerVariants}
        initial="initial"
        animate="animate"
        className="mt-6 space-y-3"
      >
        {roles.map((role) => (
          <motion.div
            key={role._id}
            variants={staggerItemVariants}
            className={cn(
              'flex items-center justify-between rounded-xl p-4',
              'bg-background/50 dark:bg-background/30',
              'backdrop-blur-sm',
              'border border-border/50',
              'hover:border-border transition-colors'
            )}
          >
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  role.isSystem ? 'bg-amber-500/10' : 'bg-primary/10'
                )}
              >
                {role.isSystem ? (
                  <Lock className="h-5 w-5 text-amber-500" />
                ) : (
                  <Shield className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground">{role.name}</h3>
                  {role.isSystem && (
                    <Badge variant="warning" size="sm">
                      System
                    </Badge>
                  )}
                </div>
                {role.description && (
                  <p className="text-sm text-muted-foreground">
                    {role.description}
                  </p>
                )}
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{role.permissions.length} permissions</span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {role.memberCount} members
                  </span>
                </div>
              </div>
            </div>

            {!role.isSystem && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleEdit(role)}
                  aria-label={`Edit ${role.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeletingRole(role)}
                  aria-label={`Delete ${role.name}`}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Modals */}
      <RoleFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingRole(null);
        }}
        editingRole={editingRole}
      />

      <ConfirmDialog
        isOpen={!!deletingRole}
        onClose={() => setDeletingRole(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Role"
        message={`Are you sure you want to delete "${deletingRole?.name}"? Members with this role will be reassigned to the default "member" role.`}
        confirmText="Delete"
        isDestructive
        isLoading={deleteMutation.isPending}
      />
    </motion.div>
  );
}
