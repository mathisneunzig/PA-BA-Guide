'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert, Box, Button, Card, CardContent, CircularProgress,
  Container, Divider, Grid, TextField, Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import Link from 'next/link'

export default function NewBookPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    isbn: '', title: '', author: '', publisher: '', year: '',
    genre: '', language: 'de', totalCopies: '1', loanDurationWeeks: '13',
    description: '', coverUrl: '',
  })
  const [loading, setLoading] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleIsbnLookup() {
    if (!form.isbn) return
    setLookupLoading(true)
    try {
      const res = await fetch('/api/books/isbn-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isbn: form.isbn }),
      })
      const data = await res.json()
      setForm((prev) => ({
        ...prev,
        title: data.title ?? prev.title,
        author: data.author ?? prev.author,
        publisher: data.publisher ?? prev.publisher,
        year: data.year ? String(data.year) : prev.year,
        description: data.description ?? prev.description,
        coverUrl: data.coverUrl ?? prev.coverUrl,
        language: data.language ?? prev.language,
      }))
    } finally {
      setLookupLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          author: form.author,
          isbn13: form.isbn || undefined,
          publisher: form.publisher || undefined,
          year: form.year ? parseInt(form.year, 10) : undefined,
          genre: form.genre || undefined,
          language: form.language || 'de',
          description: form.description || undefined,
          coverUrl: form.coverUrl || undefined,
          totalCopies: parseInt(form.totalCopies, 10),
          loanDurationWeeks: parseInt(form.loanDurationWeeks, 10),
        }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error ?? 'Fehler beim Erstellen')
      else router.push('/admin/books')
    } finally {
      setLoading(false)
    }
  }

  const tf = (label: string, field: keyof typeof form, required = false, type = 'text') => (
    <TextField
      key={field}
      label={label}
      name={field}
      type={type}
      value={form[field]}
      onChange={(e) => set(field, e.target.value)}
      required={required}
      fullWidth
      size="small"
    />
  )

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <MenuBookIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Box>
          <Typography variant="h5">Buch hinzufügen</Typography>
          <Typography variant="body2" color="text.secondary">
            <Link href="/admin/books" style={{ color: 'inherit' }}>← Zurück zur Übersicht</Link>
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>ISBN Auto-Fill</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              value={form.isbn}
              onChange={(e) => set('isbn', e.target.value)}
              placeholder="ISBN-13 eingeben…"
              size="small"
              sx={{ flex: 1, '& input': { fontFamily: 'monospace' } }}
            />
            <Button
              onClick={handleIsbnLookup}
              disabled={lookupLoading || !form.isbn}
              variant="outlined"
              startIcon={lookupLoading ? <CircularProgress size={16} /> : <SearchIcon />}
            >
              {lookupLoading ? 'Suche…' : 'Auto-Fill'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>Buchdetails</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 8 }}>{tf('Titel *', 'title', true)}</Grid>
              <Grid size={{ xs: 12, sm: 4 }}>{tf('Jahr', 'year', false, 'number')}</Grid>
              <Grid size={{ xs: 12, sm: 8 }}>{tf('Autor *', 'author', true)}</Grid>
              <Grid size={{ xs: 12, sm: 4 }}>{tf('Sprache', 'language')}</Grid>
              <Grid size={{ xs: 12, sm: 6 }}>{tf('Verlag', 'publisher')}</Grid>
              <Grid size={{ xs: 12, sm: 6 }}>{tf('Genre', 'genre')}</Grid>
              <Grid size={12}>{tf('Cover URL', 'coverUrl')}</Grid>
              <Grid size={12}>
                <TextField
                  label="Beschreibung"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>Verfügbarkeit</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={6}>{tf('Anzahl Exemplare', 'totalCopies', true, 'number')}</Grid>
              <Grid size={6}>{tf('Max. Ausleihdauer (Wochen)', 'loanDurationWeeks', true, 'number')}</Grid>
            </Grid>
          </CardContent>
        </Card>

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <AddIcon />}
          sx={{ alignSelf: 'flex-start', px: 4 }}
        >
          {loading ? 'Erstelle…' : 'Buch erstellen'}
        </Button>
      </Box>
    </Container>
  )
}
