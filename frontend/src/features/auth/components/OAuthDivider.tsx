import { cn } from '@/shared/lib/utils';

interface OAuthDividerProps {
  className?: string;
}

export function OAuthDivider({ className }: OAuthDividerProps) {
  return (
    <div className={cn('relative', className)}>
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border/50" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">
          or continue with email
        </span>
      </div>
    </div>
  );
}
