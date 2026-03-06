import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Shield } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { expandVariants } from '@/shared/lib/motion';
import type { PermissionCategory } from '../types/role.types';

interface PermissionGroupProps {
  category: PermissionCategory;
  selectedPermissions: Set<string>;
  onTogglePermission: (permissionId: string) => void;
  onToggleAll: (categoryId: string, isSelected: boolean) => void;
}

export function PermissionGroup({
  category,
  selectedPermissions,
  onTogglePermission,
  onToggleAll,
}: PermissionGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const categoryPermissionIds = category.permissions.map((p) => p.id);
  const selectedCount = categoryPermissionIds.filter((id) =>
    selectedPermissions.has(id)
  ).length;
  const totalCount = categoryPermissionIds.length;
  const isAllSelected = selectedCount === totalCount;
  const isSomeSelected = selectedCount > 0 && selectedCount < totalCount;

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      {/* Category Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex w-full items-center justify-between px-4 py-3',
          'bg-muted/30 hover:bg-muted/50 transition-colors',
          'min-h-[44px]'
        )}
      >
        <div className="flex items-center gap-3">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {category.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {selectedCount}/{totalCount}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Select All checkbox */}
          <label
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-xs text-muted-foreground">All</span>
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = isSomeSelected;
              }}
              onChange={(e) => onToggleAll(category.id, e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/50"
            />
          </label>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              isExpanded && 'rotate-180'
            )}
          />
        </div>
      </button>

      {/* Permission Checkboxes */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            variants={expandVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="overflow-hidden"
          >
            <div className="divide-y divide-border/30">
              {category.permissions.map((permission) => (
                <label
                  key={permission.id}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 px-4 py-3',
                    'hover:bg-muted/20 transition-colors',
                    'min-h-[44px]'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedPermissions.has(permission.id)}
                    onChange={() => onTogglePermission(permission.id)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/50"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {permission.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {permission.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
