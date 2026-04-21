'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Box, Button, Checkbox, FormControl, InputAdornment, InputLabel, ListItemText,
  MenuItem, OutlinedInput, Select, TextField,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import SortIcon from '@mui/icons-material/Sort'
import type { SelectChangeEvent } from '@mui/material'
import { THEMENGEBIETE } from '@/app/components/TopicPicker'
import { PROGRAMMIERSPRACHEN } from '@/app/components/LanguagePicker'
import { HAUPTKATEGORIEN } from '@/app/components/CategoryPicker'
import { useState } from 'react'

export const SORT_OPTIONS = [
  { value: 'title_asc', label: 'Titel A–Z' },
  { value: 'title_desc', label: 'Titel Z–A' },
  { value: 'author_asc', label: 'Autor A–Z' },
  { value: 'year_desc', label: 'Neueste zuerst' },
  { value: 'year_asc', label: 'Älteste zuerst' },
  { value: 'hauptkategorie_asc', label: 'Kategorie' },
] as const

export type SortValue = typeof SORT_OPTIONS[number]['value']

const VALID_SORTS = SORT_OPTIONS.map((o) => o.value) as string[]

// Props only kept for SSR fallback (not used for controlling state)
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface Props {}

export default function BooksFilter(_: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Always derive from URL so back/forward navigation stays in sync
  const urlQ = searchParams.get('q') ?? ''
  const urlTags = searchParams.get('tags')?.split(',').filter(Boolean) ?? []
  const urlLangs = searchParams.get('programmiersprachen')?.split(',').filter(Boolean) ?? []
  const urlHk = searchParams.get('hauptkategorie')?.split(',').filter(Boolean) ?? []
  const urlSort = (VALID_SORTS.includes(searchParams.get('sort') ?? '') ? searchParams.get('sort') : 'title_asc') as SortValue

  // Local state only for the text field (so typing doesn't immediately navigate)
  const [q, setQ] = useState(urlQ)

  const submit = useCallback((
    newQ: string,
    newTags: string[],
    newLangs: string[],
    newHk: string[],
    newSort: SortValue,
  ) => {
    const params = new URLSearchParams()
    if (newQ) params.set('q', newQ)
    if (newTags.length) params.set('tags', newTags.join(','))
    if (newLangs.length) params.set('programmiersprachen', newLangs.join(','))
    if (newHk.length) params.set('hauptkategorie', newHk.join(','))
    if (newSort !== 'title_asc') params.set('sort', newSort)
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }, [router])

  function handleTagsChange(e: SelectChangeEvent<string[]>) {
    const val = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value
    submit(q, val, urlLangs, urlHk, urlSort)
  }

  function handleLangsChange(e: SelectChangeEvent<string[]>) {
    const val = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value
    submit(q, urlTags, val, urlHk, urlSort)
  }

  function handleHkChange(e: SelectChangeEvent<string[]>) {
    const val = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value
    submit(q, urlTags, urlLangs, val, urlSort)
  }

  function handleSortChange(e: SelectChangeEvent<string>) {
    submit(q, urlTags, urlLangs, urlHk, e.target.value as SortValue)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    submit(q, urlTags, urlLangs, urlHk, urlSort)
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
          value={urlTags}
          onChange={handleTagsChange}
          input={<OutlinedInput label="Themengebiet" />}
          renderValue={(selected) => selected.length === 0 ? '' : `${selected.length} gewählt`}
        >
          {THEMENGEBIETE.map((t) => (
            <MenuItem key={t} value={t} dense>
              <Checkbox checked={urlTags.includes(t)} size="small" />
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
          value={urlLangs}
          onChange={handleLangsChange}
          input={<OutlinedInput label="Programmiersprache" />}
          renderValue={(selected) => selected.length === 0 ? '' : `${selected.length} gewählt`}
        >
          {PROGRAMMIERSPRACHEN.map((l) => (
            <MenuItem key={l} value={l} dense>
              <Checkbox checked={urlLangs.includes(l)} size="small" />
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
          value={urlHk}
          onChange={handleHkChange}
          input={<OutlinedInput label="Kategorie" />}
          renderValue={(selected) => selected.length === 0 ? '' : selected.join(', ')}
        >
          {HAUPTKATEGORIEN.map(({ label, code }) => (
            <MenuItem key={code} value={code} dense>
              <Checkbox checked={urlHk.includes(code)} size="small" />
              <ListItemText primary={`${code} – ${label}`} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Sortierung */}
      <FormControl size="small" sx={{ minWidth: 170 }}>
        <InputLabel>Sortierung</InputLabel>
        <Select
          value={urlSort}
          onChange={handleSortChange}
          input={<OutlinedInput label="Sortierung" />}
          startAdornment={<InputAdornment position="start"><SortIcon fontSize="small" /></InputAdornment>}
        >
          {SORT_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value} dense>{o.label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button type="submit" variant="contained" startIcon={<SearchIcon />}>Suchen</Button>
    </Box>
  )
}
