'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Container,
  Divider, IconButton, Slider, Stack, TextField, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import Link from 'next/link'

interface BookEntry {
  input: string
  barcode: string
  title: string
  author: string
  resolving: boolean
  error: string
}

function AdminMultiLoanForm() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [books, setBooks] = useState<BookEntry[]>(() => {
    const initial = searchParams.get('bookId') ?? ''
    return initial ? [{ input: initial, barcode: initial, title: '', author: '', resolving: false, error: '' }] : []
  })
  const [bookInput, setBookInput] = useState('')
  const [durationWeeks, setDurationWeeks] = useState(13)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const durationDays = durationWeeks * 7
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + durationDays)

  async function resolveBook(input: string): Promise<{ barcode: string; title: string; author: string } | null> {
    if (/^\d{13}$/.test(input)) {
      const res = await fetch(`/api/books/${input}`)
      if (res.ok) {
        const b = await res.json()
        return { barcode: b.id, title: b.title, author: b.author }
      }
    }
    const res = await fetch(`/api/books/by-regalnummer/${encodeURIComponent(input)}`)
    if (res.ok) {
      const b = await res.json()
      return { barcode: b.id, title: b.title, author: b.author }
    }
    return null
  }

  async function addBook() {
    const input = bookInput.trim()
    if (!input) return
    if (books.some((b) => b.input === input)) {
      setBookInput('')
      return
    }

    const entry: BookEntry = { input, barcode: '', title: '', author: '', resolving: true, error: '' }
    setBooks((prev) => [...prev, entry])
    setBookInput('')

    const result = await resolveBook(input)
    setBooks((prev) =>
      prev.map((b) =>
        b.input === input
          ? result
            ? { ...b, barcode: result.barcode, title: result.title, author: result.author, resolving: false }
            : { ...b, resolving: false, error: 'Buch nicht gefunden' }
          : b
      )
    )
  }

  function removeBook(input: string) {
    setBooks((prev) => prev.filter((b) => b.input !== input))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validBooks = books.filter((b) => b.barcode && !b.error)
    if (validBooks.length === 0) { setSubmitError('Kein gültiges Buch hinzugefügt'); return }

    setSubmitError('')
    setSubmitting(true)

    const res = await fetch('/api/loans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookIds: validBooks.map((b) => b.barcode),
        startDate: new Date().toISOString(),
        durationDays,
        notes: notes || undefined,
        immediate: true,
      }),
    })
    setSubmitting(false)

    if (!res.ok) {
      const d = await res.json()
      setSubmitError(d.error ? (typeof d.error === 'string' ? d.error : JSON.stringify(d.error)) : 'Fehler')
    } else {
      setSubmitSuccess(true)
      setTimeout(() => router.push('/admin/loans'), 1200)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {submitError && <Alert severity="error">{submitError}</Alert>}
      {submitSuccess && <Alert severity="success">Alle Ausleihen erfolgreich erstellt! Weiterleitung…</Alert>}

      {/* Book list */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>Bücher hinzufügen</Typography>
          <Typography variant="caption" color="text.secondary">
            Barcode (EAN-13) oder Regalnummer (z.B. SAP0001) eingeben
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <TextField
              value={bookInput}
              onChange={(e) => setBookInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addBook() } }}
              placeholder="EAN-13 oder Regalnummer…"
              size="small"
              sx={{ flex: 1, '& input': { fontFamily: 'monospace' } }}
            />
            <Button variant="outlined" startIcon={<AddIcon />} onClick={addBook} disabled={!bookInput.trim()}>
              Hinzufügen
            </Button>
          </Box>

          {books.length > 0 && (
            <Stack spacing={1} sx={{ mt: 2 }}>
              {books.map((book) => (
                <Box
                  key={book.input}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 1, bgcolor: book.error ? 'error.50' : 'grey.50', border: '1px solid', borderColor: book.error ? 'error.200' : 'divider' }}
                >
                  {book.resolving ? (
                    <CircularProgress size={16} sx={{ mx: 1 }} />
                  ) : book.error ? (
                    <Chip label="Fehler" color="error" size="small" />
                  ) : (
                    <Chip label="OK" color="success" size="small" />
                  )}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                      {book.title || book.input}
                    </Typography>
                    {book.author && (
                      <Typography variant="caption" color="text.secondary" noWrap>{book.author}</Typography>
                    )}
                    {book.error && (
                      <Typography variant="caption" color="error">{book.error}</Typography>
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>
                    {book.input}
                  </Typography>
                  <IconButton size="small" onClick={() => removeBook(book.input)} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Duration */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>Ausleihdetails</Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="body2" gutterBottom>
                Ausleihdauer: <strong>{durationWeeks} Wochen</strong>
              </Typography>
              <Slider
                value={durationWeeks}
                onChange={(_, v) => setDurationWeeks(v as number)}
                min={1}
                max={13}
                marks
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `${v} Wo.`}
              />
              <Typography variant="caption" color="text.secondary">
                Fällig am: {dueDate.toLocaleDateString('de-DE')}
              </Typography>
            </Box>

            <TextField
              label="Notizen (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={2}
              size="small"
            />
          </Box>
        </CardContent>
      </Card>

      <Button
        type="submit"
        variant="contained"
        color="success"
        size="large"
        disabled={submitting || books.filter((b) => b.barcode).length === 0}
        startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
      >
        {submitting
          ? 'Leihe aus…'
          : `${books.filter((b) => b.barcode).length} Buch${books.filter((b) => b.barcode).length !== 1 ? 'er' : ''} direkt ausleihen`}
      </Button>
    </Box>
  )
}

export default function AdminMultiLoanPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <LibraryBooksIcon sx={{ fontSize: 36, color: 'success.main' }} />
        <Box>
          <Typography variant="h5">Sammelausleihe (Admin)</Typography>
          <Typography variant="body2" color="text.secondary">
            Mehrere Bücher direkt ausleihen — ohne Reservierung.{' '}
            <Link href="/admin/loans" style={{ color: 'inherit' }}>Zur Ausleihübersicht</Link>
          </Typography>
        </Box>
      </Box>

      <Suspense fallback={<CircularProgress />}>
        <AdminMultiLoanForm />
      </Suspense>
    </Container>
  )
}
