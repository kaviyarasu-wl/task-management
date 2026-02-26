import { Link } from 'react-router-dom';
import { MoreHorizontal, Archive, Trash2, Edit } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { Project } from '@/shared/types/entities.types';
import { cn, formatRelativeTime } from '@/shared/lib/utils';
import { ROUTES } from '@/shared/constants/routes';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onArchive: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export function ProjectCard({ project, onEdit, onArchive, onDelete }: ProjectCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      className={cn(
        'group relative rounded-lg border border-border bg-background p-5 transition-shadow hover:shadow-md',
        project.isArchived && 'opacity-60'
      )}
    >
      {/* Color indicator */}
      {project.color && (
        <div
          className="absolute left-0 top-0 h-1 w-full rounded-t-lg"
          style={{ backgroundColor: project.color }}
        />
      )}

      {/* Menu button */}
      <div className="absolute right-3 top-3" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="rounded-md p-1 opacity-0 hover:bg-muted group-hover:opacity-100"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-1 w-36 rounded-md border border-border bg-background py-1 shadow-lg">
            <button
              onClick={() => {
                setIsMenuOpen(false);
                onEdit(project);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                onArchive(project);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
            >
              <Archive className="h-4 w-4" />
              {project.isArchived ? 'Unarchive' : 'Archive'}
            </button>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                onDelete(project);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <Link to={ROUTES.PROJECT_DETAIL.replace(':projectId', project._id)}>
        <h3 className="pr-8 font-semibold text-foreground hover:text-primary">
          {project.name}
          {project.isArchived && (
            <span className="ml-2 text-xs text-muted-foreground">(Archived)</span>
          )}
        </h3>
      </Link>

      {project.description && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {project.description}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>{project.memberIds.length} members</span>
        <span>{formatRelativeTime(project.updatedAt)}</span>
      </div>
    </div>
  );
}
