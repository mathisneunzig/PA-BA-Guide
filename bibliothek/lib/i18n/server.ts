import de from '@/public/locales/de.json'
import en from '@/public/locales/en.json'
import fr from '@/public/locales/fr.json'
import es from '@/public/locales/es.json'

const TRANSLATIONS = { de, en, fr, es } as const
export type Locale = keyof typeof TRANSLATIONS
export const SUPPORTED_LOCALES: Locale[] = ['de', 'en', 'fr', 'es']

export function getT(locale: string = 'en') {
  const safeLocale = SUPPORTED_LOCALES.includes(locale as Locale) ? (locale as Locale) : 'en'
  const dict = TRANSLATIONS[safeLocale] as Record<string, string>
  const fallback = TRANSLATIONS['en'] as Record<string, string>

  return function t(key: string, vars?: Record<string, string | number>): string {
    let str = dict[key] ?? fallback[key] ?? key
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replaceAll(`{{${k}}}`, String(v))
      }
    }
    return str
  }
}
