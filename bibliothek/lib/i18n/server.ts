import de from '@/public/locales/de.json'
import en from '@/public/locales/en.json'
import fr from '@/public/locales/fr.json'
import es from '@/public/locales/es.json'
import ja from '@/public/locales/ja.json'
import zh from '@/public/locales/zh.json'
import ko from '@/public/locales/ko.json'
import tr from '@/public/locales/tr.json'
import ru from '@/public/locales/ru.json'
import uk from '@/public/locales/uk.json'
import nl from '@/public/locales/nl.json'
import nlBE from '@/public/locales/nl-BE.json'
import sv from '@/public/locales/sv.json'
import da from '@/public/locales/da.json'
import fi from '@/public/locales/fi.json'
import no from '@/public/locales/no.json'
import is from '@/public/locales/is.json'
import pt from '@/public/locales/pt.json'
import cs from '@/public/locales/cs.json'
import pl from '@/public/locales/pl.json'

const TRANSLATIONS = {
  de, en, fr, es, ja, zh, ko, tr, ru, uk,
  nl, 'nl-BE': nlBE, sv, da, fi, no, is, pt, cs, pl,
} as const

export type Locale = keyof typeof TRANSLATIONS
export const SUPPORTED_LOCALES: Locale[] = [
  'de','en','fr','es','ja','zh','ko','tr','ru','uk',
  'nl','nl-BE','sv','da','fi','no','is','pt','cs','pl',
]

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
