import { MoreHorizontal, Shield, UserMinus } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { User } from '@/shared/types/entities.types';
import type { UserRole } from '@/shared/types/api.types';
import { RoleBadge } from './RoleBadge';
import { useAuthStore } from '@/features/auth';
import { cn, getInitials, formatDate } from '@/shared/lib/utils';

interface MemberRowProps {
  member: User;
  onRoleChange: (userId: string, role: UserRole) => void;
  onRemove: (member: User) => void;
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'viewer', label: 'Viewer' },
];

export function MemberRow({ member, onRoleChange, onRemove }: MemberRowProps) {
  const currentUser = useAuthStore((state) => state.user);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isCurrentUser = currentUser?._id === member._id;
  const isOwner = member.role === 'owner';
  const canManage =
    (currentUser?.role === 'owner' || currentUser?.role === 'admin') &&
    !isCurrentUser &&
    !isOwner;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setIsRoleMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <tr className="group border-b border-border hover:bg-muted/50">
      {/* User Info */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            {getInitials(member.firstName, member.lastName)}
          </div>
          <div>
            <p className="font-medium text-foreground">
              {member.firstName} {member.lastName}
              {isCurrentUser && (
                <span className="ml-2 text-xs text-muted-foreground">(You)</span>
              )}
            </p>
            <p className="text-sm text-muted-foreground">{member.email}</p>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-4 py-3">
        <RoleBadge role={member.role} />
      </td>

      {/* Joined */}
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {formatDate(member.createdAt)}
      </td>

      {/* Last Login */}
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {member.lastLoginAt ? formatDate(member.lastLoginAt) : 'Never'}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        {canManage && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="rounded-md p-1 opacity-0 hover:bg-muted group-hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-md border border-border bg-background py-1 shadow-lg">
                <button
                  onClick={() => {
                    setIsRoleMenuOpen(!isRoleMenuOpen);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                >
                  <Shield className="h-4 w-4" />
                  Change Role
                </button>

                {isRoleMenuOpen && (
                  <div className="border-t border-border py-1">
                    {ROLE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          onRoleChange(member._id, option.value);
                          setIsMenuOpen(false);
                          setIsRoleMenuOpen(false);
                        }}
                        className={cn(
                          'block w-full px-3 py-2 text-left text-sm hover:bg-muted',
                          member.role === option.value && 'bg-muted'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onRemove(member);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
                >
                  <UserMinus className="h-4 w-4" />
                  Remove
                </button>
              </div>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}
