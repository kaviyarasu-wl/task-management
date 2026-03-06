import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, Mail } from 'lucide-react';
import {
  createInvitationSchema,
  type CreateInvitationFormData,
} from '../validators/invitation.validators';
import { useInvitationMutations } from '../hooks/useInvitationMutations';
import { useRoles } from '@/features/roles';
import { cn } from '@/shared/lib/utils';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FALLBACK_ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin', description: 'Full access to settings and members' },
  { value: 'member', label: 'Member', description: 'Can create and manage tasks' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
] as const;

export function InviteMemberModal({ isOpen, onClose }: InviteMemberModalProps) {
  const { createInvitation } = useInvitationMutations();
  const { data: roles = [] } = useRoles();
  const assignableRoles = roles.filter((r) => r.slug !== 'owner');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateInvitationFormData>({
    resolver: zodResolver(createInvitationSchema),
    defaultValues: { role: 'member' },
  });

  const onSubmit = async (data: CreateInvitationFormData) => {
    await createInvitation.mutateAsync(data);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Invite Team Member</h2>
          </div>
          <button onClick={handleClose} className="rounded-md p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email Address
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className={cn(
                'mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
                'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
                errors.email && 'border-destructive'
              )}
              placeholder="colleague@company.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Role</label>
            {assignableRoles.length > 0 ? (
              <select
                {...register('role')}
                className={cn(
                  'mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
                  'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
                )}
              >
                {assignableRoles.map((role) => (
                  <option key={role._id} value={role.slug}>
                    {role.name} ({role.permissions.length} permissions)
                  </option>
                ))}
              </select>
            ) : (
              <div className="mt-2 space-y-2">
                {FALLBACK_ROLE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 hover:bg-muted"
                  >
                    <input
                      type="radio"
                      value={option.value}
                      {...register('role')}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-foreground">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createInvitation.isPending}
              className={cn(
                'flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
                'hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {createInvitation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Send Invitation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
