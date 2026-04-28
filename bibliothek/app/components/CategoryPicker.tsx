'use client'

import {
  Box, FormControl, InputLabel, MenuItem, Select, Typography,
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material'
import { useTranslation } from 'react-i18next'

export const HAUPTKATEGORIEN = [
  { label: 'Informatik Allgemein', code: 'INF' },
  { label: 'Mathe', code: 'MA' },
  { label: 'Softwarearchitekturen', code: 'SWA' },
  { label: 'KI', code: 'KI' },
  { label: 'SAP', code: 'SAP' },
  { label: 'Software Engineering', code: 'SWE' },
  { label: 'Schulbuch', code: 'SB' },
  { label: 'Magazin', code: 'MAG' },
  { label: 'Datenbanken', code: 'DB' },
  { label: 'Sonstiges', code: 'XX' },
]

interface Props {
  value: string  // stores the code, e.g. "SAP"
  onChange: (code: string) => void
}

export default function HauptkategoriePicker({ value, onChange }: Props) {
  const { t } = useTranslation()
  const HAUPTKATEGORIEN_LABELS = [
    { label: t('books.kat_INF'), code: 'INF' },
    { label: t('books.kat_MA'), code: 'MA' },
    { label: t('books.kat_SWA'), code: 'SWA' },
    { label: t('books.kat_KI'), code: 'KI' },
    { label: t('books.kat_SAP'), code: 'SAP' },
    { label: t('books.kat_SWE'), code: 'SWE' },
    { label: t('books.kat_SB'), code: 'SB' },
    { label: t('books.kat_MAG'), code: 'MAG' },
    { label: t('books.kat_DB'), code: 'DB' },
    { label: t('books.kat_XX'), code: 'XX' },
  ]

  function handleChange(e: SelectChangeEvent) {
    onChange(e.target.value)
  }

  return (
    <Box>
      <FormControl fullWidth size="small">
        <InputLabel>{t('books.catLabel')}</InputLabel>
        <Select value={value} label={t('books.catLabel')} onChange={handleChange}>
          <MenuItem value=""><em>{t('books.catNone')}</em></MenuItem>
          {HAUPTKATEGORIEN_LABELS.map(({ label, code }) => (
            <MenuItem key={code} value={code}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', px: 0.5, borderRadius: 0.5 }}>
                  {code}
                </Typography>
                {label}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )
}
