import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/shared/lib/i18n';
import { cn } from '@/shared/lib/utils';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation('settings');

  const handleLanguageChange = (languageCode: SupportedLanguage) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
      <div className="flex items-center gap-3">
        <Globe className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-foreground">{t('profile.language')}</p>
          <p className="text-xs text-muted-foreground">{t('profile.languageDescription')}</p>
        </div>
      </div>
      <select
        value={i18n.language}
        onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
        className={cn(
          'h-9 rounded-lg border border-border/50 bg-background/50 px-3 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-primary/50'
        )}
        aria-label={t('profile.language')}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
