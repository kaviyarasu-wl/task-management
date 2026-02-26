import { useState } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { useMembers, useTenant } from '@/features/users/hooks/useUsers';
import { useUpdateRole, useRemoveMember } from '@/features/users/hooks/useUserMutations';
import { MemberRow } from '@/features/users/components/MemberRow';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import type { User } from '@/shared/types/entities.types';
import type { UserRole } from '@/shared/types/api.types';

export function TeamPage() {
  const [removingMember, setRemovingMember] = useState<User | null>(null);

  const { data: membersData, isLoading: isLoadingMembers } = useMembers();
  const { data: tenantData } = useTenant();
  const updateRoleMutation = useUpdateRole();
  const removeMemberMutation = useRemoveMember();

  const members = membersData?.data ?? [];
  const tenant = tenantData?.data;

  const handleRoleChange = (userId: string, role: UserRole) => {
    updateRoleMutation.mutate({ userId, data: { role } });
  };

  const handleConfirmRemove = () => {
    if (removingMember) {
      removeMemberMutation.mutate(removingMember._id, {
        onSuccess: () => setRemovingMember(null),
      });
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team</h1>
          {tenant && (
            <p className="mt-1 text-muted-foreground">
              {tenant.name} - {members.length} / {tenant.settings.maxUsers} members
            </p>
          )}
        </div>
      </div>

      {/* Team Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {(['owner', 'admin', 'member', 'viewer'] as const).map((role) => {
          const count = members.filter((m) => m.role === role).length;
          return (
            <div
              key={role}
              className="rounded-lg border border-border bg-background p-4"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{count}</p>
                  <p className="text-sm capitalize text-muted-foreground">{role}s</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Members Table */}
      {isLoadingMembers ? (
        <div className="mt-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : members.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border p-12 text-center">
          <h3 className="font-medium text-foreground">No team members</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Invite members to your organization.
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-border bg-background">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Last Login</th>
                <th className="px-4 py-3 font-medium w-12"></th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <MemberRow
                  key={member._id}
                  member={member}
                  onRoleChange={handleRoleChange}
                  onRemove={setRemovingMember}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Remove Confirmation */}
      <ConfirmDialog
        isOpen={!!removingMember}
        onClose={() => setRemovingMember(null)}
        onConfirm={handleConfirmRemove}
        title="Remove Member"
        message={`Are you sure you want to remove ${removingMember?.firstName} ${removingMember?.lastName} from the organization?`}
        confirmText="Remove"
        isDestructive
        isLoading={removeMemberMutation.isPending}
      />
    </div>
  );
}
