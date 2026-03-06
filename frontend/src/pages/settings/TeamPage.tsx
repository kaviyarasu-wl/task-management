import { useState } from 'react';
import { Users, Loader2, UserPlus } from 'lucide-react';
import { useMembers, useTenant } from '@/features/users/hooks/useUsers';
import { useUpdateRole, useRemoveMember } from '@/features/users/hooks/useUserMutations';
import { useInvitations } from '@/features/users/hooks/useInvitations';
import { useInvitationMutations } from '@/features/users/hooks/useInvitationMutations';
import { MemberRow } from '@/features/users/components/MemberRow';
import { InviteMemberModal } from '@/features/users/components/InviteMemberModal';
import { PendingInvitationRow } from '@/features/users/components/PendingInvitationRow';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { useAuthStore } from '@/features/auth';
import { ResponsiveTable } from '@/shared/components/ResponsiveTable';
import type { User } from '@/shared/types/entities.types';
import type { UserRole } from '@/shared/types/api.types';

export function TeamPage() {
  const [removingMember, setRemovingMember] = useState<User | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const currentUser = useAuthStore((state) => state.user);

  const { data: membersData, isLoading: isLoadingMembers } = useMembers();
  const { data: tenantData } = useTenant();
  const { data: invitationsData, isLoading: isLoadingInvitations } = useInvitations();
  const updateRoleMutation = useUpdateRole();
  const removeMemberMutation = useRemoveMember();
  const { resendInvitation, cancelInvitation } = useInvitationMutations();

  const members = membersData?.data ?? [];
  const tenant = tenantData?.data;
  const pendingInvitations =
    invitationsData?.data?.filter((i) => i.status === 'pending') ?? [];

  const canInvite = currentUser?.role === 'owner' || currentUser?.role === 'admin';

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team</h1>
          {tenant && (
            <p className="mt-1 text-muted-foreground">
              {tenant.name} - {members.length} / {tenant.settings.maxUsers} members
            </p>
          )}
        </div>
        {canInvite && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 min-h-[44px]"
          >
            <UserPlus className="h-4 w-4" />
            Invite Member
          </button>
        )}
      </div>

      {/* Team Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
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
          <ResponsiveTable>
          <table className="w-full min-w-[600px]">
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
          </ResponsiveTable>
        </div>
      )}

      {/* Pending Invitations */}
      {canInvite && !isLoadingInvitations && pendingInvitations.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground">Pending Invitations</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {pendingInvitations.length} invitation{pendingInvitations.length !== 1 ? 's' : ''} waiting for response
          </p>
          <div className="mt-4 rounded-lg border border-border bg-background">
            <ResponsiveTable>
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-border text-left text-sm text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingInvitations.map((invitation) => (
                  <PendingInvitationRow
                    key={invitation._id}
                    invitation={invitation}
                    onResend={(id) => resendInvitation.mutate(id)}
                    onCancel={(id) => cancelInvitation.mutate(id)}
                    isResending={resendInvitation.isPending}
                    isCancelling={cancelInvitation.isPending}
                  />
                ))}
              </tbody>
            </table>
            </ResponsiveTable>
          </div>
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

      {/* Invite Modal */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </div>
  );
}
