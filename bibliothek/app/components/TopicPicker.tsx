'use client'

import { Box, Chip, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

export const THEMENGEBIETE = [
  'Informatik',
  'Data Science',
  'Datenbanken',
  'Programmiersprachen',
  'Softwarearchitektur',
  'IT-Sicherheit',
  'Künstliche Intelligenz',
  'Machine Learning',
  'Webentwicklung',
  'Cloud Computing',
  'Statistik',
  'Algorithmen',
  'Projektmanagement',
  'Testing',
  'Usability',
  'Zertifizierungen',
  'Requirements Engineering',
]

export const THEMA_KEYS: Record<string, string> = {
  'Informatik': 'books.thema_Informatik',
  'Data Science': 'books.thema_DataScience',
  'Datenbanken': 'books.thema_Datenbanken',
  'Programmiersprachen': 'books.thema_Programmiersprachen',
  'Softwarearchitektur': 'books.thema_Softwarearchitektur',
  'IT-Sicherheit': 'books.thema_ITSicherheit',
  'Künstliche Intelligenz': 'books.thema_KI',
  'Machine Learning': 'books.thema_ML',
  'Webentwicklung': 'books.thema_Web',
  'Cloud Computing': 'books.thema_Cloud',
  'Statistik': 'books.thema_Statistik',
  'Algorithmen': 'books.thema_Algorithmen',
  'Projektmanagement': 'books.thema_PM',
  'Testing': 'books.thema_Testing',
  'Usability': 'books.thema_Usability',
  'Zertifizierungen': 'books.thema_Zertifizierungen',
  'Requirements Engineering': 'books.thema_RE',
}

interface Props {
  selected: string[]
  onChange: (tags: string[]) => void
}

export default function ThemengebietPicker({ selected, onChange }: Props) {
  const { t } = useTranslation()

  function toggle(tag: string) {
    if (selected.includes(tag)) {
      onChange(selected.filter((item) => item !== tag))
    } else {
      onChange([...selected, tag])
    }
  }

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        {t('books.themaLabel')}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {THEMENGEBIETE.map((tag) => (
          <Chip
            key={tag}
            label={t(THEMA_KEYS[tag] ?? tag)}
            onClick={() => toggle(tag)}
            color={selected.includes(tag) ? 'primary' : 'default'}
            variant={selected.includes(tag) ? 'filled' : 'outlined'}
            size="small"
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Box>
    </Box>
  )
}
