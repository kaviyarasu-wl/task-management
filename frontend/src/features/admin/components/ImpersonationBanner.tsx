import { useState } from 'react';
import { Eye, LogOut, Loader2 } from 'lucide-react';
import { useImpersonation } from '../hooks/useImpersonation';
import { Button } from '@/shared/components/ui/Button';

interface ImpersonationBannerProps {
  tenant: {
    tenantId: string;
    name: string;
    slug: string;
  };
}

export function ImpersonationBanner({ tenant }: ImpersonationBannerProps) {
  const { exitImpersonation } = useImpersonation();
  const [isExiting, setIsExiting] = useState(false);

  const handleExit = async () => {
    setIsExiting(true);
    await exitImpersonation();
  };

  return (
    <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-center gap-4 bg-amber-500 px-4 py-2 text-amber-950 shadow-lg">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4" />
        <span className="font-medium">Impersonating:</span>
        <span>{tenant.name}</span>
        <span className="text-amber-800">({tenant.slug})</span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleExit}
        disabled={isExiting}
        className="bg-amber-600/20 text-amber-950 hover:bg-amber-600/30"
      >
        {isExiting ? (
          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="mr-1 h-4 w-4" />
        )}
        {isExiting ? 'Exiting...' : 'Exit Impersonation'}
      </Button>
    </div>
  );
}
