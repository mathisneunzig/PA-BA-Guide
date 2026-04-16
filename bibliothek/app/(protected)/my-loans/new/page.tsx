'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Alert, Box, Button, Card, CardContent, CircularProgress,
  Container, Slider, TextField, Typography,
} from '@mui/material'
import EventIcon from '@mui/icons-material/Event'
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd'
import Link from 'next/link'

function ReservationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialBookId = searchParams.get('bookId') ?? ''

  const [bookId, setBookId] = useState(initialBookId)
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [durationWeeks, setDurationWeeks] = useState(13)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const durationDays = durationWeeks * 7
  const dueDate = new Date(startDate)
  dueDate.setDate(dueDate.getDate() + durationDays)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          startDate: new Date(startDate).toISOString(),
          durationDays,
          notes: notes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error ?? 'Reservierung fehlgeschlagen')
      else router.push('/my-loans')
    } catch {
      setError('Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {error && <Alert severity="error">{error}</Alert>}

      <TextField
        label="Buchbarcode (EAN-13)"
        value={bookId}
        onChange={(e) => setBookId(e.target.value)}
        placeholder="0201234567897"
        required
        slotProps={{ htmlInput: { pattern: '\\d{13}', style: { fontFamily: 'monospace' } } }}
        helperText="13-stelliger Barcode des Buches"
        size="small"
      />

      <TextField
        label="Abholdatum"
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        required
        size="small"
        slotProps={{
          htmlInput: { min: new Date().toISOString().slice(0, 10) },
          inputLabel: { shrink: true },
          input: { startAdornment: <EventIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} /> },
        }}
      />

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

      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={loading}
        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <BookmarkAddIcon />}
      >
        {loading ? 'Reserviere…' : 'Reservierung bestätigen'}
      </Button>
    </Box>
  )
}

export default function NewLoanPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <BookmarkAddIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Box>
          <Typography variant="h5">Buch reservieren</Typography>
          <Typography variant="body2" color="text.secondary">
            Oder geh zum{' '}
            <Link href="/books" style={{ color: 'inherit' }}>Katalog</Link>{' '}
            und klicke auf ein Buch.
          </Typography>
        </Box>
      </Box>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Suspense fallback={<CircularProgress />}>
            <ReservationForm />
          </Suspense>
        </CardContent>
      </Card>
    </Container>
  )
}
