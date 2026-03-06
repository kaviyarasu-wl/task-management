import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export function useFormattedNumber() {
  const { i18n } = useTranslation();
  const locale = i18n.language;

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions): string => {
      return new Intl.NumberFormat(locale, options).format(value);
    },
    [locale]
  );

  const formatPercent = useCallback(
    (value: number): string => {
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }).format(value);
    },
    [locale]
  );

  const formatCompact = useCallback(
    (value: number): string => {
      return new Intl.NumberFormat(locale, { notation: 'compact' }).format(value);
    },
    [locale]
  );

  return { formatNumber, formatPercent, formatCompact };
}
