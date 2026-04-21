'use client'

import { Box, Chip, Typography } from '@mui/material'

export const PROGRAMMIERSPRACHEN = [
  'Python',
  'Java',
  'JavaScript',
  'TypeScript',
  'C',
  'C++',
  'C#',
  'Go',
  'Rust',
  'PHP',
  'SQL',
  'ABAP',
  'HTML',
  'CSS',
]

interface Props {
  selected: string[]
  onChange: (langs: string[]) => void
}

export default function ProgrammiersprachePicker({ selected, onChange }: Props) {
  function toggle(lang: string) {
    if (selected.includes(lang)) {
      onChange(selected.filter((l) => l !== lang))
    } else {
      onChange([...selected, lang])
    }
  }

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Programmiersprachen (mehrere wählbar)
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {PROGRAMMIERSPRACHEN.map((lang) => (
          <Chip
            key={lang}
            label={lang}
            onClick={() => toggle(lang)}
            color={selected.includes(lang) ? 'secondary' : 'default'}
            variant={selected.includes(lang) ? 'filled' : 'outlined'}
            size="small"
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Box>
    </Box>
  )
}
