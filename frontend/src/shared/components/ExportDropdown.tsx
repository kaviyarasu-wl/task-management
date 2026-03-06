import { FileText, FileSpreadsheet, FileDown, Download } from 'lucide-react';
import { DropdownButton, type DropdownItem } from '@/shared/components/ui/Dropdown';
import type { ExportFormat, ExportType } from '@/shared/types/export.types';

interface ExportDropdownProps {
  exportType: ExportType;
  filters?: Record<string, string | undefined>;
  onExport: (
    type: ExportType,
    format: ExportFormat,
    filters?: Record<string, string>
  ) => void;
  disabled?: boolean;
  className?: string;
}

export function ExportDropdown({
  exportType,
  filters,
  onExport,
  disabled = false,
  className,
}: ExportDropdownProps) {
  const cleanFilters = filters
    ? (Object.fromEntries(
        Object.entries(filters).filter(
          (entry): entry is [string, string] => entry[1] !== undefined
        )
      ) as Record<string, string>)
    : undefined;

  const items: DropdownItem[] = [
    {
      id: 'csv',
      label: 'Export as CSV',
      icon: <FileDown className="h-4 w-4" />,
      disabled,
      onClick: () => onExport(exportType, 'csv', cleanFilters),
    },
    {
      id: 'pdf',
      label: 'Export as PDF',
      icon: <FileText className="h-4 w-4" />,
      disabled,
      onClick: () => onExport(exportType, 'pdf', cleanFilters),
    },
    {
      id: 'excel',
      label: 'Export as Excel',
      icon: <FileSpreadsheet className="h-4 w-4" />,
      disabled,
      onClick: () => onExport(exportType, 'excel', cleanFilters),
    },
  ];

  return (
    <DropdownButton
      items={items}
      variant="glass"
      size="sm"
      className={className}
    >
      <Download className="h-4 w-4" />
      Export
    </DropdownButton>
  );
}
