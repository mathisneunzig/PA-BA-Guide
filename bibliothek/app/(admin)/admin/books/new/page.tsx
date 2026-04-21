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
import ThemengebietPicker from '@/app/components/TopicPicker'
import ProgrammiersprachePicker from '@/app/components/LanguagePicker'
import HauptkategoriePicker from '@/app/components/CategoryPicker'
import CoverUpload from '@/app/components/CoverUpload'
import QuickPrintDialog from '@/app/components/QuickPrintDialog'

export default function NewBookPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    isbn: '', title: '', author: '', publisher: '', year: '',
    language: 'de', totalCopies: '1', loanDurationWeeks: '13',
    description: '', coverUrl: '', hauptkategorie: '', regalnummer: '',
  })
  const [tags, setTags] = useState<string[]>([])
  const [programmiersprachen, setProgrammiersprachen] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdBarcode, setCreatedBarcode] = useState<string | null>(null)

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleHauptkategorieChange(code: string) {
    set('hauptkategorie', code)
    // Only auto-suggest if regalnummer is still empty or was auto-generated (starts with old code)
    if (!code) { set('regalnummer', ''); return }
    try {
      const res = await fetch(`/api/books/regalnummer/suggest/${code}`)
      if (res.ok) {
        const data = await res.json()
        set('regalnummer', data.regalnummer)
      }
    } catch { /* ignore */ }
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
      // Auto-populate tags from API metadata
      if (data.tags) {
        const suggested = data.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        if (suggested.length > 0) setTags(suggested)
      }
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
          tags: tags.length > 0 ? tags.join(',') : undefined,
          programmiersprachen: programmiersprachen.length > 0 ? programmiersprachen.join(',') : undefined,
          hauptkategorie: form.hauptkategorie || undefined,
          regalnummer: form.regalnummer || undefined,
          language: form.language || 'de',
          description: form.description || undefined,
          coverUrl: form.coverUrl || undefined,
          totalCopies: parseInt(form.totalCopies, 10),
          loanDurationWeeks: parseInt(form.loanDurationWeeks, 10),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        const err = data.error
        if (err && typeof err === 'object') {
          const fieldMsgs = Object.entries(err.fieldErrors ?? {})
            .map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`)
          setError([...(err.formErrors ?? []), ...fieldMsgs].join(' | ') || 'Fehler beim Erstellen')
        } else {
          setError(err ?? 'Fehler beim Erstellen')
        }
      }
      else setCreatedBarcode(data.id)
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
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  label="Autor *"
                  name="author"
                  value={form.author}
                  onChange={(e) => set('author', e.target.value)}
                  required
                  fullWidth
                  size="small"
                  helperText="Format: Nachname, Vorname (wird beim Auto-Fill automatisch normalisiert)"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>{tf('Sprache', 'language')}</Grid>
              <Grid size={{ xs: 12, sm: 6 }}>{tf('Verlag', 'publisher')}</Grid>
              <Grid size={{ xs: 12, sm: 6 }}>{tf('Anzahl Exemplare', 'totalCopies', true, 'number')}</Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <HauptkategoriePicker value={form.hauptkategorie} onChange={handleHauptkategorieChange} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>{tf('Regalnummer', 'regalnummer')}</Grid>
              <Grid size={12}>
                <ThemengebietPicker selected={tags} onChange={setTags} />
              </Grid>
              <Grid size={12}>
                <ProgrammiersprachePicker selected={programmiersprachen} onChange={setProgrammiersprachen} />
              </Grid>
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
              <Grid size={12}>
                <CoverUpload value={form.coverUrl} onChange={(url) => set('coverUrl', url)} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>Ausleihe</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
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

      {createdBarcode && (
        <QuickPrintDialog
          barcode={createdBarcode}
          modes={form.regalnummer ? ['label', 'shelf'] : ['label']}
          title={form.title}
          onClose={() => router.push('/admin/books')}
        />
      )}
    </Container>
  )
}
