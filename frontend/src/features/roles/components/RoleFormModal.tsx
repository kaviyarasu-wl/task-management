import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, ModalFooter } from '@/shared/components/ui/Modal';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { PermissionGroup } from './PermissionGroup';
import { usePermissions, useCreateRole, useUpdateRole } from '../hooks/useRoles';
import { roleFormSchema, type RoleFormData } from '../validators/role.validators';
import type { Role } from '../types/role.types';

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRole?: Role | null;
}

export function RoleFormModal({
  isOpen,
  onClose,
  editingRole,
}: RoleFormModalProps) {
  const { data: permissionCategories = [] } = usePermissions();
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();

  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set()
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: '',
      description: '',
      permissions: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      const permissions = new Set(editingRole?.permissions ?? []);
      setSelectedPermissions(permissions);
      reset({
        name: editingRole?.name ?? '',
        description: editingRole?.description ?? '',
        permissions: editingRole?.permissions ?? [],
      });
    }
  }, [isOpen, editingRole, reset]);

  // Sync selected permissions to form value
  useEffect(() => {
    setValue('permissions', Array.from(selectedPermissions));
  }, [selectedPermissions, setValue]);

  const handleTogglePermission = useCallback((permissionId: string) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(
    (categoryId: string, isSelected: boolean) => {
      const category = permissionCategories.find((c) => c.id === categoryId);
      if (!category) return;

      setSelectedPermissions((prev) => {
        const next = new Set(prev);
        for (const perm of category.permissions) {
          if (isSelected) {
            next.add(perm.id);
          } else {
            next.delete(perm.id);
          }
        }
        return next;
      });
    },
    [permissionCategories]
  );

  const onSubmit = (data: RoleFormData) => {
    if (editingRole) {
      updateMutation.mutate(
        { roleId: editingRole._id, data },
        { onSuccess: () => onClose() }
      );
    } else {
      createMutation.mutate(data, { onSuccess: () => onClose() });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingRole ? 'Edit Role' : 'Create Role'}
      description="Define permissions for this role"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Role Name"
            placeholder="e.g. Project Manager"
            error={errors.name?.message}
            required
            {...register('name')}
          />
          <Input
            label="Description"
            placeholder="Brief description of this role"
            error={errors.description?.message}
            {...register('description')}
          />
        </div>

        {/* Permissions */}
        <div>
          <p className="mb-3 text-sm font-medium text-foreground/90">
            Permissions
            {errors.permissions && (
              <span className="ml-2 text-destructive">
                - {errors.permissions.message}
              </span>
            )}
          </p>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {permissionCategories.map((category) => (
              <PermissionGroup
                key={category.id}
                category={category}
                selectedPermissions={selectedPermissions}
                onTogglePermission={handleTogglePermission}
                onToggleAll={handleToggleAll}
              />
            ))}
          </div>
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {editingRole ? 'Update Role' : 'Create Role'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
