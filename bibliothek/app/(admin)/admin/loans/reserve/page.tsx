'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Container,
  Divider, FormControlLabel, IconButton, InputAdornment, Radio, RadioGroup,
  Slider, Stack, TextField, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EventIcon from '@mui/icons-material/Event'
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import PinDropIcon from '@mui/icons-material/PinDrop'
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import Link from 'next/link'

type HandoverMethod = 'PICKUP' | 'MEETINGPOINT' | 'SHIPPING' | 'DROPOFF'

const HANDOVER_OPTIONS: { value: HandoverMethod; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'PICKUP',       label: 'Abholung',     icon: <MeetingRoomIcon fontSize="small" />,    description: 'Abholung beim Verleiher' },
  { value: 'MEETINGPOINT', label: 'Treffpunkt',    icon: <PinDropIcon fontSize="small" />,        description: 'Treffpunkt vereinbaren' },
  { value: 'SHIPPING',     label: 'Zusenden',      icon: <LocalShippingIcon fontSize="small" />,  description: 'Per Post zuschicken (zzgl. Versandkosten)' },
  { value: 'DROPOFF',      label: 'Vorbeibringen', icon: <DirectionsWalkIcon fontSize="small" />, description: 'Verleiher bringt das Buch vorbei' },
]

interface BookEntry {
  input: string
  barcode: string
  title: string
  author: string
  resolving: boolean
  error: string
}

function AdminMultiReserveForm() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [books, setBooks] = useState<BookEntry[]>(() => {
    const initial = searchParams.get('bookId') ?? ''
    return initial ? [{ input: initial, barcode: initial, title: '', author: '', resolving: false, error: '' }] : []
  })
  const [bookInput, setBookInput] = useState('')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [durationWeeks, setDurationWeeks] = useState(13)
  const [notes, setNotes] = useState('')
  const [handoverMethod, setHandoverMethod] = useState<HandoverMethod>('PICKUP')
  const [handoverDate, setHandoverDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [handoverLocation, setHandoverLocation] = useState('')
  const [handoverCost, setHandoverCost] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const durationDays = durationWeeks * 7
  const dueDate = new Date(startDate)
  dueDate.setDate(dueDate.getDate() + durationDays)

  const needsDate     = handoverMethod === 'PICKUP' || handoverMethod === 'MEETINGPOINT' || handoverMethod === 'DROPOFF'
  const needsLocation = handoverMethod === 'MEETINGPOINT'
  const needsCost     = handoverMethod === 'SHIPPING'

  async function resolveBook(input: string): Promise<{ barcode: string; title: string; author: string } | null> {
    if (/^\d{13}$/.test(input)) {
      const res = await fetch(`/api/books/${input}`)
      if (res.ok) { const b = await res.json(); return { barcode: b.id, title: b.title, author: b.author } }
    }
    const res = await fetch(`/api/books/by-regalnummer/${encodeURIComponent(input)}`)
    if (res.ok) { const b = await res.json(); return { barcode: b.id, title: b.title, author: b.author } }
    return null
  }

  async function addBook() {
    const input = bookInput.trim()
    if (!input) return
    if (books.some((b) => b.input === input)) { setBookInput(''); return }
    const entry: BookEntry = { input, barcode: '', title: '', author: '', resolving: true, error: '' }
    setBooks((prev) => [...prev, entry])
    setBookInput('')
    const result = await resolveBook(input)
    setBooks((prev) => prev.map((b) => b.input === input
      ? result ? { ...b, barcode: result.barcode, title: result.title, author: result.author, resolving: false }
               : { ...b, resolving: false, error: 'Buch nicht gefunden' }
      : b))
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
    const errors: string[] = []
    for (const book of validBooks) {
      const body: Record<string, unknown> = {
        bookId: book.barcode,
        startDate: new Date(startDate).toISOString(),
        durationDays,
        notes: notes || undefined,
        handoverMethod,
      }
      if (needsDate && handoverDate) body.handoverDate = new Date(handoverDate).toISOString()
      if (needsLocation && handoverLocation) body.handoverLocation = handoverLocation
      if (needsCost && handoverCost) body.handoverCost = parseFloat(handoverCost)

      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const d = await res.json(); errors.push(`${book.title}: ${d.error ?? 'Fehler'}`) }
    }
    setSubmitting(false)
    if (errors.length > 0) {
      setSubmitError(errors.join(' | '))
    } else {
      setSubmitSuccess(true)
      setTimeout(() => router.push('/admin/loans'), 1200)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {submitError && <Alert severity="error">{submitError}</Alert>}
      {submitSuccess && <Alert severity="success">Alle Reservierungen erfolgreich erstellt! Weiterleitung…</Alert>}

      {/* Book list */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>Bücher hinzufügen</Typography>
          <Typography variant="caption" color="text.secondary">Barcode (EAN-13) oder Regalnummer eingeben</Typography>
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
                <Box key={book.input} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 1, bgcolor: book.error ? 'error.50' : 'action.hover', border: '1px solid', borderColor: book.error ? 'error.200' : 'divider' }}>
                  {book.resolving ? <CircularProgress size={16} sx={{ mx: 1 }} /> : book.error ? <Chip label="Fehler" color="error" size="small" /> : <Chip label="OK" color="success" size="small" />}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>{book.title || book.input}</Typography>
                    {book.author && <Typography variant="caption" color="text.secondary" noWrap>{book.author}</Typography>}
                    {book.error && <Typography variant="caption" color="error">{book.error}</Typography>}
                  </Box>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>{book.input}</Typography>
                  <IconButton size="small" onClick={() => removeBook(book.input)} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Details */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>Reservierungsdetails</Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Startdatum" type="date" value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required size="small"
              slotProps={{ htmlInput: { min: new Date().toISOString().slice(0, 10) }, inputLabel: { shrink: true }, input: { startAdornment: <EventIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} /> } }}
            />
            <Box>
              <Typography variant="body2" gutterBottom>Ausleihdauer: <strong>{durationWeeks} Wochen</strong></Typography>
              <Slider value={durationWeeks} onChange={(_, v) => setDurationWeeks(v as number)} min={1} max={13} marks valueLabelDisplay="auto" valueLabelFormat={(v) => `${v} Wo.`} />
              <Typography variant="caption" color="text.secondary">Fällig am: {dueDate.toLocaleDateString('de-DE')}</Typography>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Übergabeart *</Typography>
              <RadioGroup value={handoverMethod} onChange={(e) => setHandoverMethod(e.target.value as HandoverMethod)}>
                {HANDOVER_OPTIONS.map((opt) => (
                  <FormControlLabel key={opt.value} value={opt.value} control={<Radio size="small" />}
                    label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>{opt.icon}<Box><Typography variant="body2">{opt.label}</Typography><Typography variant="caption" color="text.secondary">{opt.description}</Typography></Box></Box>}
                    sx={{ mb: 0.5, alignItems: 'flex-start', '& .MuiFormControlLabel-label': { mt: 0.5 } }}
                  />
                ))}
              </RadioGroup>
              {needsDate && (
                <TextField label={handoverMethod === 'PICKUP' ? 'Abholdatum' : handoverMethod === 'DROPOFF' ? 'Datum Vorbeibringen' : 'Treffpunkt-Datum'} type="date" value={handoverDate} onChange={(e) => setHandoverDate(e.target.value)} size="small" fullWidth sx={{ mt: 1.5 }} slotProps={{ htmlInput: { min: new Date().toISOString().slice(0, 10) }, inputLabel: { shrink: true } }} />
              )}
              {needsLocation && (
                <TextField label="Treffpunkt / Ort" value={handoverLocation} onChange={(e) => setHandoverLocation(e.target.value)} placeholder="z.B. Bibliothek, Zimmer 205" size="small" fullWidth sx={{ mt: 1.5 }} />
              )}
              {needsCost && (
                <TextField label="Versandkosten (€)" type="number" value={handoverCost} onChange={(e) => setHandoverCost(e.target.value)} size="small" sx={{ mt: 1.5, width: 200 }} slotProps={{ htmlInput: { min: 0, step: 0.01 }, input: { startAdornment: <InputAdornment position="start">€</InputAdornment> } }} />
              )}
            </Box>

            <TextField label="Notizen (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} multiline rows={2} size="small" />
          </Box>
        </CardContent>
      </Card>

      <Button type="submit" variant="contained" size="large"
        disabled={submitting || books.filter((b) => b.barcode).length === 0}
        startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <BookmarkAddIcon />}
      >
        {submitting ? 'Reserviere…' : `${books.filter((b) => b.barcode).length} Buch${books.filter((b) => b.barcode).length !== 1 ? 'er' : ''} reservieren`}
      </Button>
    </Box>
  )
}

export default function AdminMultiReservePage() {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <BookmarkAddIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Box>
          <Typography variant="h5">Sammelreservierung (Admin)</Typography>
          <Typography variant="body2" color="text.secondary">
            Mehrere Bücher gleichzeitig reservieren.{' '}
            <Link href="/admin/loans" style={{ color: 'inherit' }}>Zur Ausleihübersicht</Link>
          </Typography>
        </Box>
      </Box>
      <Suspense fallback={<CircularProgress />}>
        <AdminMultiReserveForm />
      </Suspense>
    </Container>
  )
}
