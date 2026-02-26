import { Link } from 'react-router-dom';
import { FolderKanban, CheckSquare, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/features/auth';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { StatsCard } from '@/shared/components/StatsCard';
import { ROUTES } from '@/shared/constants/routes';
import { formatRelativeTime } from '@/shared/lib/utils';

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { data: projectsData, isLoading: isLoadingProjects } = useProjects({ limit: 5 });

  const recentProjects = projectsData?.pages[0]?.data ?? [];
  const totalProjects = projectsData?.pages[0]?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s what&apos;s happening with your projects.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Projects"
          value={totalProjects}
          icon={FolderKanban}
        />
        <StatsCard
          title="Active Tasks"
          value="--"
          icon={CheckSquare}
        />
        <StatsCard
          title="Due This Week"
          value="--"
          icon={Clock}
        />
        <StatsCard
          title="Overdue"
          value="--"
          icon={AlertTriangle}
        />
      </div>

      {/* Recent Projects */}
      <div className="rounded-lg border border-border bg-background">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-semibold text-foreground">Recent Projects</h2>
          <Link
            to={ROUTES.PROJECTS}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoadingProjects ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : recentProjects.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No projects yet</p>
            <Link
              to={ROUTES.PROJECTS}
              className="mt-2 inline-block text-sm text-primary hover:underline"
            >
              Create your first project
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {recentProjects.map((project) => (
              <li key={project._id}>
                <Link
                  to={ROUTES.PROJECT_DETAIL.replace(':projectId', project._id)}
                  className="flex items-center justify-between p-4 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {project.color && (
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                    )}
                    <div>
                      <p className="font-medium text-foreground">{project.name}</p>
                      {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatRelativeTime(project.updatedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
