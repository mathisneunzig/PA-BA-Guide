'use client'

import { Box, Chip, Typography } from '@mui/material'

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

interface Props {
  selected: string[]
  onChange: (tags: string[]) => void
}

export default function ThemengebietPicker({ selected, onChange }: Props) {
  function toggle(tag: string) {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag))
    } else {
      onChange([...selected, tag])
    }
  }

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Themengebiete (mehrere wählbar)
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {THEMENGEBIETE.map((tag) => (
          <Chip
            key={tag}
            label={tag}
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
