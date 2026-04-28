import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import de from '@/public/locales/de.json'
import en from '@/public/locales/en.json'
import fr from '@/public/locales/fr.json'
import es from '@/public/locales/es.json'

const DEFAULT_LOCALE = 'en'

function getInitialLocale(): string {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  const stored = localStorage.getItem('locale')
  if (stored && ['de', 'en', 'fr', 'es'].includes(stored)) return stored
  // Browser language detection fallback
  const lang = navigator.language.split('-')[0]
  if (['de', 'en', 'fr', 'es'].includes(lang)) return lang
  return DEFAULT_LOCALE
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      de: { translation: de },
      en: { translation: en },
      fr: { translation: fr },
      es: { translation: es },
    },
    lng: getInitialLocale(),
    fallbackLng: DEFAULT_LOCALE,
    interpolation: { escapeValue: false },
  })
}

export default i18n
