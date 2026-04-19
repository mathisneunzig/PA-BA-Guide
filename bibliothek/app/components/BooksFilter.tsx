'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Box, Button, Checkbox, FormControl, InputAdornment, InputLabel, ListItemText,
  MenuItem, OutlinedInput, Select, TextField,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import type { SelectChangeEvent } from '@mui/material'
import { THEMENGEBIETE } from '@/app/components/ThemengebietPicker'
import { PROGRAMMIERSPRACHEN } from '@/app/components/ProgrammiersprachePicker'
import { HAUPTKATEGORIEN } from '@/app/components/HauptkategoriePicker'

interface Props {
  initialQ: string
  initialTags: string[]
  initialProgrammiersprachen: string[]
  initialHauptkategorie: string
}

export default function BooksFilter({ initialQ, initialTags, initialProgrammiersprachen, initialHauptkategorie }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [q, setQ] = useState(initialQ)
  const [tags, setTags] = useState<string[]>(initialTags)
  const [langs, setLangs] = useState<string[]>(initialProgrammiersprachen)
  const [hauptkategorie, setHauptkategorie] = useState<string[]>(
    initialHauptkategorie ? initialHauptkategorie.split(',') : []
  )

  const submit = useCallback((
    newQ: string,
    newTags: string[],
    newLangs: string[],
    newHk: string[],
  ) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('q', newQ)
    params.set('tags', newTags.join(','))
    params.set('programmiersprachen', newLangs.join(','))
    params.set('hauptkategorie', newHk.join(','))
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }, [router, searchParams])

  function handleTagsChange(e: SelectChangeEvent<string[]>) {
    const val = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value
    setTags(val)
    submit(q, val, langs, hauptkategorie)
  }

  function handleLangsChange(e: SelectChangeEvent<string[]>) {
    const val = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value
    setLangs(val)
    submit(q, tags, val, hauptkategorie)
  }

  function handleHkChange(e: SelectChangeEvent<string[]>) {
    const val = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value
    setHauptkategorie(val)
    submit(q, tags, langs, val)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    submit(q, tags, langs, hauptkategorie)
  }

  return (
    <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
      <TextField
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Titel, Autor, ISBN suchen…"
        size="small"
        sx={{ flex: 1, minWidth: 200 }}
        slotProps={{ input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        } }}
      />

      {/* Themengebiet multi-select */}
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Themengebiet</InputLabel>
        <Select
          multiple
          value={tags}
          onChange={handleTagsChange}
          input={<OutlinedInput label="Themengebiet" />}
          renderValue={(selected) => selected.length === 0 ? '' : `${selected.length} gewählt`}
        >
          {THEMENGEBIETE.map((t) => (
            <MenuItem key={t} value={t} dense>
              <Checkbox checked={tags.includes(t)} size="small" />
              <ListItemText primary={t} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Programmiersprache multi-select */}
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Programmiersprache</InputLabel>
        <Select
          multiple
          value={langs}
          onChange={handleLangsChange}
          input={<OutlinedInput label="Programmiersprache" />}
          renderValue={(selected) => selected.length === 0 ? '' : `${selected.length} gewählt`}
        >
          {PROGRAMMIERSPRACHEN.map((l) => (
            <MenuItem key={l} value={l} dense>
              <Checkbox checked={langs.includes(l)} size="small" />
              <ListItemText primary={l} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Hauptkategorie multi-select */}
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Kategorie</InputLabel>
        <Select
          multiple
          value={hauptkategorie}
          onChange={handleHkChange}
          input={<OutlinedInput label="Kategorie" />}
          renderValue={(selected) => selected.length === 0 ? '' : selected.join(', ')}
        >
          {HAUPTKATEGORIEN.map(({ label, code }) => (
            <MenuItem key={code} value={code} dense>
              <Checkbox checked={hauptkategorie.includes(code)} size="small" />
              <ListItemText primary={`${code} – ${label}`} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button type="submit" variant="contained" startIcon={<SearchIcon />}>Suchen</Button>
    </Box>
  )
}
