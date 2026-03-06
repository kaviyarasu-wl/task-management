import { Request, Response, NextFunction } from 'express';
import { config } from '@config/index';

/**
 * Extracts locale from Accept-Language header.
 * Returns the first supported locale or the default.
 *
 * This middleware runs BEFORE auth middleware. It stores the
 * detected locale on req so auth middleware can include it
 * in RequestContext.
 */
export function localeMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const acceptLanguage = req.headers['accept-language'];
  const supportedLocales = config.SUPPORTED_LOCALES.split(',').map((l) => l.trim());

  let detectedLocale = config.DEFAULT_LOCALE;

  if (acceptLanguage) {
    // Parse Accept-Language: en-US,en;q=0.9,es;q=0.8
    const preferred = acceptLanguage
      .split(',')
      .map((part) => {
        const [lang, qPart] = part.trim().split(';');
        const quality = qPart ? parseFloat(qPart.split('=')[1] ?? '1') : 1;
        return { lang: lang.split('-')[0].toLowerCase(), quality };
      })
      .sort((a, b) => b.quality - a.quality);

    for (const pref of preferred) {
      if (supportedLocales.includes(pref.lang)) {
        detectedLocale = pref.lang;
        break;
      }
    }
  }

  // Store on request object for auth middleware to pick up
  (req as Request & { detectedLocale: string }).detectedLocale = detectedLocale;

  next();
}
