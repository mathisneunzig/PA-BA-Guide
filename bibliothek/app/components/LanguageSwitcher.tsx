'use client'

import { Box, IconButton, Tooltip } from '@mui/material'
import { useLocale } from '@/lib/i18n/useLocale'
import type { Locale } from '@/lib/i18n/server'

const LOCALES: { locale: Locale; label: string; flag: string }[] = [
  { locale: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { locale: 'en', label: 'English', flag: '🇬🇧' },
  { locale: 'fr', label: 'Français', flag: '🇫🇷' },
  { locale: 'es', label: 'Español', flag: '🇪🇸' },
]

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()

  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      {LOCALES.map(({ locale: l, label, flag }) => (
        <Tooltip key={l} title={label} placement="top">
          <IconButton
            onClick={() => setLocale(l)}
            size="small"
            sx={{
              fontSize: '1.2rem',
              lineHeight: 1,
              p: 0.5,
              opacity: locale === l ? 1 : 0.4,
              filter: locale === l ? 'none' : 'grayscale(60%)',
              transition: 'opacity 0.15s, filter 0.15s',
              '&:hover': { opacity: 1, filter: 'none' },
            }}
          >
            {flag}
          </IconButton>
        </Tooltip>
      ))}
    </Box>
  )
}
