'use client'

import { useCallback } from 'react'
import i18n from '@/lib/i18n/config'
import type { Locale } from '@/lib/i18n/server'

const SUPPORTED_LOCALES: Locale[] = ['de', 'en', 'fr', 'es']

export function getCurrentLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem('locale')
  if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) return stored as Locale
  return 'en'
}

export function useLocale() {
  const locale = i18n.language as Locale

  const setLocale = useCallback(async (next: Locale) => {
    localStorage.setItem('locale', next)
    // Sync cookie for server components
    document.cookie = `locale=${next}; path=/; max-age=31536000; SameSite=Lax`
    await i18n.changeLanguage(next)

    // Persist to DB if logged in
    try {
      await fetch('/api/users/locale', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: next }),
      })
    } catch {
      // Not logged in or network error — localStorage is still updated
    }
  }, [])

  return { locale, setLocale }
}
