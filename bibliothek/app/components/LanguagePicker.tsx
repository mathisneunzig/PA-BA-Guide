'use client'

import { Box, Chip, Typography } from '@mui/material'

export const LANGUAGES = [
  'Java',
  'Python',
  'JavaScript',
  'TypeScript',
  'C#',
  'C++',
  'Go',
  'Prolog',
  'PHP',
  'ABAP'
]

interface Props {
  selected: string[]
  onChange: (tags: string[]) => void
}

export default function LanguagePicker({ selected, onChange }: Props) {
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
        Programmiersprachen (mehrere wählbar)
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {LANGUAGES.map((tag) => (
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
