'use client'

import { Box, IconButton, Menu, MenuItem, Tooltip, Typography } from '@mui/material'
import { useState } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import type { Locale } from '@/lib/i18n/server'

const LOCALES: { locale: Locale; label: string; flag: string }[] = [
  { locale: 'de',    label: 'Deutsch',     flag: '🇩🇪' },
  { locale: 'en',    label: 'English',     flag: '🇬🇧' },
  { locale: 'fr',    label: 'Français',    flag: '🇫🇷' },
  { locale: 'es',    label: 'Español',     flag: '🇪🇸' },
  { locale: 'pt',    label: 'Português',   flag: '🇵🇹' },
  { locale: 'nl',    label: 'Nederlands',  flag: '🇳🇱' },
  { locale: 'nl-BE', label: 'Vlaams',      flag: '🇧🇪' },
  { locale: 'sv',    label: 'Svenska',     flag: '🇸🇪' },
  { locale: 'da',    label: 'Dansk',       flag: '🇩🇰' },
  { locale: 'no',    label: 'Norsk',       flag: '🇳🇴' },
  { locale: 'fi',    label: 'Suomi',       flag: '🇫🇮' },
  { locale: 'is',    label: 'Íslenska',    flag: '🇮🇸' },
  { locale: 'cs',    label: 'Čeština',     flag: '🇨🇿' },
  { locale: 'pl',    label: 'Polski',      flag: '🇵🇱' },
  { locale: 'ru',    label: 'Русский',     flag: '🇷🇺' },
  { locale: 'uk',    label: 'Українська',  flag: '🇺🇦' },
  { locale: 'tr',    label: 'Türkçe',      flag: '🇹🇷' },
  { locale: 'ja',    label: '日本語',       flag: '🇯🇵' },
  { locale: 'zh',    label: '中文',         flag: '🇨🇳' },
  { locale: 'ko',    label: '한국어',       flag: '🇰🇷' },
]

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)

  const current = LOCALES.find((l) => l.locale === locale) ?? LOCALES[1]

  return (
    <>
      <Tooltip title={current.label} placement="top">
        <IconButton
          onClick={(e) => setAnchor(e.currentTarget)}
          size="small"
          sx={{ fontSize: '1.2rem', lineHeight: 1, p: 0.5 }}
        >
          {current.flag}
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { maxHeight: 320 } } }}
      >
        {LOCALES.map(({ locale: l, label, flag }) => (
          <MenuItem
            key={l}
            selected={locale === l}
            onClick={() => { setLocale(l); setAnchor(null) }}
            dense
          >
            <Typography sx={{ mr: 1, fontSize: '1.1rem' }}>{flag}</Typography>
            <Typography variant="body2">{label}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
