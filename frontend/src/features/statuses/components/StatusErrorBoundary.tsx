import { Component, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface StatusErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface StatusErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class StatusErrorBoundary extends Component<
  StatusErrorBoundaryProps,
  StatusErrorBoundaryState
> {
  constructor(props: StatusErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): StatusErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error('StatusErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Something went wrong
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {this.state.error?.message || 'Failed to load statuses'}
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for use with React Query error states
interface StatusErrorFallbackProps {
  message?: string;
  onRetry?: () => void;
}

export function StatusErrorFallback({
  message = 'Failed to load statuses',
  onRetry,
}: StatusErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
      <h2 className="mb-2 text-lg font-semibold text-foreground">
        Something went wrong
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      )}
    </div>
  );
}
