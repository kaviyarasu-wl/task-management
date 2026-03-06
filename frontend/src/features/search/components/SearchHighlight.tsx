import { cn } from '@/shared/lib/utils';

interface SearchHighlightProps {
  text: string;
  highlight?: string;
  className?: string;
  maxLength?: number;
}

export function SearchHighlight({
  text,
  highlight,
  className,
  maxLength = 150,
}: SearchHighlightProps) {
  if (highlight) {
    const truncatedHighlight =
      highlight.length > maxLength
        ? highlight.slice(0, maxLength) + '...'
        : highlight;

    return (
      <span
        className={cn('search-highlight', className)}
        dangerouslySetInnerHTML={{ __html: truncatedHighlight }}
      />
    );
  }

  const displayText =
    text.length > maxLength ? text.slice(0, maxLength) + '...' : text;

  return <span className={className}>{displayText}</span>;
}
