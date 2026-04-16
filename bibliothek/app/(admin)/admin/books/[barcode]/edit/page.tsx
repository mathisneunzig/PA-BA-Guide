'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert, Box, Button, Card, CardContent, CircularProgress,
  Container, Divider, Grid, TextField, Typography,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import EditIcon from '@mui/icons-material/Edit'
import Link from 'next/link'

export default function EditBookPage({ params }: { params: Promise<{ barcode: string }> }) {
  const router = useRouter()
  const [barcode, setBarcode] = useState('')
  const [form, setForm] = useState({
    title: '', author: '', publisher: '', year: '',
    genre: '', language: '', description: '', coverUrl: '',
    totalCopies: '1', loanDurationWeeks: '13',
  })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    params.then(({ barcode: bc }) => {
      setBarcode(bc)
      fetch(`/api/books/${bc}`)
        .then((r) => r.json())
        .then((book) => {
          setForm({
            title: book.title ?? '',
            author: book.author ?? '',
            publisher: book.publisher ?? '',
            year: book.year ? String(book.year) : '',
            genre: book.genre ?? '',
            language: book.language ?? 'de',
            description: book.description ?? '',
            coverUrl: book.coverUrl ?? '',
            totalCopies: String(book.totalCopies ?? 1),
            loanDurationWeeks: String(book.loanDurationWeeks ?? 13),
          })
        })
        .finally(() => setFetching(false))
    })
  }, [params])

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/books/${barcode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          author: form.author,
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
      if (!res.ok) setError(data.error ?? 'Aktualisierung fehlgeschlagen')
      else router.push('/admin/books')
    } finally {
      setLoading(false)
    }
  }

  const tf = (label: string, field: keyof typeof form, required = false, type = 'text') => (
    <TextField
      key={field}
      label={label}
      value={form[field]}
      onChange={(e) => set(field, e.target.value)}
      required={required}
      type={type}
      fullWidth
      size="small"
    />
  )

  if (fetching) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <EditIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Box>
          <Typography variant="h5">Buch bearbeiten</Typography>
          <Typography variant="caption" sx={{ fontFamily: 'monospace' }} color="text.secondary">{barcode}</Typography>
          <br />
          <Typography variant="body2" color="text.secondary">
            <Link href="/admin/books" style={{ color: 'inherit' }}>← Zurück zur Übersicht</Link>
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

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
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          sx={{ alignSelf: 'flex-start', px: 4 }}
        >
          {loading ? 'Speichere…' : 'Änderungen speichern'}
        </Button>
      </Box>
    </Container>
  )
}
