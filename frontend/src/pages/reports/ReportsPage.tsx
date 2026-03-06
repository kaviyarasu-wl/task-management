import { Loader2, FileText } from 'lucide-react';
import { useProjects } from '@/features/projects';
import { useMembers } from '@/features/users';
import {
  ReportTabs,
  ReportFilters,
  TeamPerformanceReport,
  ProjectProgressReport,
  TimeReport,
  useReportFiltersStore,
} from '@/features/reports';
import { ExportDropdown } from '@/shared/components/ExportDropdown';
import { ExportProgressModal } from '@/shared/components/ExportProgressModal';
import { useExport } from '@/shared/hooks/useExport';

export function ReportsPage() {
  const { startExport, isExporting, progress, jobId, format, cancelExport } = useExport();
  const { activeTab, setActiveTab } = useReportFiltersStore();
  const { data: projectsData, isLoading: isLoadingProjects } = useProjects();
  const { data: membersData, isLoading: isLoadingMembers } = useMembers();

  const projects = projectsData?.pages.flatMap((p) => p.data) ?? [];
  const members = membersData?.data ?? [];

  const isInitialLoading = isLoadingProjects || isLoadingMembers;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        </div>
        <div className="sm:ml-auto">
          <ExportDropdown exportType="reports" onExport={startExport} />
        </div>
      </div>

      {isInitialLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Filters */}
          <ReportFilters projects={projects} users={members} />

          {/* Tabs */}
          <ReportTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'team' && <TeamPerformanceReport />}
            {activeTab === 'projects' && <ProjectProgressReport />}
            {activeTab === 'time' && <TimeReport />}
          </div>
        </>
      )}
      {/* Export Progress */}
      <ExportProgressModal
        isOpen={isExporting && !!jobId}
        onClose={() => {}}
        onCancel={cancelExport}
        progress={progress}
        format={format}
      />
    </div>
  );
}
