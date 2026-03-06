import fs from 'fs';
import path from 'path';
import { config } from '@config/index';
import { RequestContext } from '@core/context/RequestContext';

type TranslationMap = Record<string, Record<string, string>>;

const translations = new Map<string, TranslationMap>();

/**
 * Load all translation files at startup.
 * Called once during server initialization.
 */
export function loadTranslations(): void {
  const localesDir = path.resolve(__dirname, '../../locales');
  const supportedLocales = config.SUPPORTED_LOCALES.split(',');

  for (const locale of supportedLocales) {
    const trimmed = locale.trim();
    const filePath = path.join(localesDir, `${trimmed}.json`);
    if (fs.existsSync(filePath)) {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      translations.set(trimmed, content);
    }
  }

  console.log(`Translations loaded: ${Array.from(translations.keys()).join(', ')}`);
}

/**
 * Translate a key with optional interpolation.
 *
 * Uses dot notation: t('common.notFound', { resource: 'Task' })
 * Falls back to English if key is missing in target locale.
 * Falls back to the raw key if missing entirely.
 *
 * Locale is auto-detected from RequestContext when available.
 */
export function t(key: string, params?: Record<string, string>, locale?: string): string {
  const resolvedLocale =
    locale ??
    RequestContext.getOptional()?.locale ??
    config.DEFAULT_LOCALE;

  const [namespace, ...keyParts] = key.split('.');
  const translationKey = keyParts.join('.');

  // Try target locale first, then fall back to English
  let message =
    translations.get(resolvedLocale)?.[namespace]?.[translationKey] ??
    translations.get('en')?.[namespace]?.[translationKey] ??
    key;

  // Interpolate {{variable}} placeholders
  if (params) {
    for (const [paramKey, paramValue] of Object.entries(params)) {
      message = message.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'), paramValue);
    }
  }

  return message;
}

/**
 * Get the list of supported locales.
 */
export function getSupportedLocales(): string[] {
  return Array.from(translations.keys());
}
