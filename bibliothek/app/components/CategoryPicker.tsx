'use client'

import {
  Box, FormControl, InputLabel, MenuItem, Select, Typography,
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material'

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
  function handleChange(e: SelectChangeEvent) {
    onChange(e.target.value)
  }

  return (
    <Box>
      <FormControl fullWidth size="small">
        <InputLabel>Hauptkategorie</InputLabel>
        <Select value={value} label="Hauptkategorie" onChange={handleChange}>
          <MenuItem value=""><em>Keine</em></MenuItem>
          {HAUPTKATEGORIEN.map(({ label, code }) => (
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
