import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

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
import sr from '@/public/locales/sr.json'
import hr from '@/public/locales/hr.json'
import sl from '@/public/locales/sl.json'
import sk from '@/public/locales/sk.json'
import mk from '@/public/locales/mk.json'

const DEFAULT_LOCALE = 'en'

const VALID_LOCALES = [
  'de','en','fr','es','ja','zh','ko','tr','ru','uk',
  'nl','nl-BE','sv','da','fi','no','is','pt','cs','pl',
  'sr','hr','sl','sk','mk',
]

export function getStoredLocale(): string {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  // Check cookie first (set by server-side rendering path)
  const cookie = document.cookie.split(';').map((c) => c.trim()).find((c) => c.startsWith('locale='))
  if (cookie) {
    const val = cookie.split('=')[1]
    if (val && VALID_LOCALES.includes(val)) return val
  }
  const stored = localStorage.getItem('locale')
  if (stored && VALID_LOCALES.includes(stored)) return stored
  const lang = navigator.language
  if (VALID_LOCALES.includes(lang)) return lang
  const base = lang.split('-')[0]
  if (VALID_LOCALES.includes(base)) return base
  return DEFAULT_LOCALE
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      de: { translation: de },
      en: { translation: en },
      fr: { translation: fr },
      es: { translation: es },
      ja: { translation: ja },
      zh: { translation: zh },
      ko: { translation: ko },
      tr: { translation: tr },
      ru: { translation: ru },
      uk: { translation: uk },
      nl: { translation: nl },
      'nl-BE': { translation: nlBE },
      sv: { translation: sv },
      da: { translation: da },
      fi: { translation: fi },
      no: { translation: no },
      is: { translation: is },
      pt: { translation: pt },
      cs: { translation: cs },
      pl: { translation: pl },
      sr: { translation: sr },
      hr: { translation: hr },
      sl: { translation: sl },
      sk: { translation: sk },
      mk: { translation: mk },
      sq: { translation: sq },
    },
    // Always start with 'en' so SSR and initial client render match.
    // Providers will call i18n.changeLanguage() after hydration.
    lng: DEFAULT_LOCALE,
    fallbackLng: DEFAULT_LOCALE,
    interpolation: { escapeValue: false },
  })
}

export default i18n
