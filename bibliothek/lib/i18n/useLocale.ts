'use client'

import { useCallback } from 'react'
import i18n from '@/lib/i18n/config'
import type { Locale } from '@/lib/i18n/server'
import { SUPPORTED_LOCALES } from '@/lib/i18n/server'

export function useLocale() {
  const locale = i18n.language as Locale

  const setLocale = useCallback(async (next: Locale) => {
    localStorage.setItem('locale', next)
    document.cookie = `locale=${next}; path=/; max-age=31536000; SameSite=Lax`
    await i18n.changeLanguage(next)

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
