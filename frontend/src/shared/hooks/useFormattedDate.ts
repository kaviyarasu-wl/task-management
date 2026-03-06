import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export function useFormattedDate() {
  const { i18n } = useTranslation();
  const locale = i18n.language;

  const formatDate = useCallback(
    (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
      const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      };
      return new Intl.DateTimeFormat(locale, options ?? defaultOptions).format(new Date(date));
    },
    [locale]
  );

  const formatDateTime = useCallback(
    (date: string | Date): string => {
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(date));
    },
    [locale]
  );

  const formatRelativeTime = useCallback(
    (date: string | Date): string => {
      const now = new Date();
      const target = new Date(date);
      const diffMs = now.getTime() - target.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

      if (diffMinutes < 1) return rtf.format(0, 'minute');
      if (diffMinutes < 60) return rtf.format(-diffMinutes, 'minute');
      if (diffHours < 24) return rtf.format(-diffHours, 'hour');
      if (diffDays < 7) return rtf.format(-diffDays, 'day');
      return formatDate(date);
    },
    [locale, formatDate]
  );

  return { formatDate, formatDateTime, formatRelativeTime };
}
