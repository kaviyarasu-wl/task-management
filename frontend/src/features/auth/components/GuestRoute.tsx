import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '@/shared/constants/routes';

interface GuestRouteProps {
  children: React.ReactNode;
}

export function GuestRoute({ children }: GuestRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || ROUTES.DASHBOARD;
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}
