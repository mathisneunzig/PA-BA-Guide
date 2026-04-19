'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Alert, Box, Button, Card, CardContent, CircularProgress,
  Container, FormControlLabel, InputAdornment, Radio, RadioGroup,
  Slider, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material'
import EventIcon from '@mui/icons-material/Event'
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import PinDropIcon from '@mui/icons-material/PinDrop'
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

type HandoverMethod = 'PICKUP' | 'MEETINGPOINT' | 'SHIPPING' | 'DROPOFF'

const HANDOVER_OPTIONS: { value: HandoverMethod; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'PICKUP',       label: 'Abholung',       icon: <MeetingRoomIcon fontSize="small" />,    description: 'Ich hole das Buch ab' },
  { value: 'MEETINGPOINT', label: 'Treffpunkt',      icon: <PinDropIcon fontSize="small" />,        description: 'Wir vereinbaren einen Treffpunkt' },
  { value: 'SHIPPING',     label: 'Zusenden',        icon: <LocalShippingIcon fontSize="small" />,  description: 'Buch wird zugeschickt (zzgl. Versandkosten)' },
  { value: 'DROPOFF',      label: 'Vorbeibringen',   icon: <DirectionsWalkIcon fontSize="small" />, description: 'Ich bringe das Buch vorbei' },
]

function ReservationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  const initialBookId = searchParams.get('bookId') ?? ''

  const [bookId, setBookId] = useState(initialBookId)
  const [mode, setMode] = useState<'reserve' | 'borrow'>(
    searchParams.get('mode') === 'borrow' ? 'borrow' : 'reserve'
  )
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [durationWeeks, setDurationWeeks] = useState(13)
  const [notes, setNotes] = useState('')
  const [handoverMethod, setHandoverMethod] = useState<HandoverMethod>('PICKUP')
  const [handoverDate, setHandoverDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [handoverLocation, setHandoverLocation] = useState('')
  const [handoverCost, setHandoverCost] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const durationDays = durationWeeks * 7
  const dueDate = new Date(startDate)
  dueDate.setDate(dueDate.getDate() + durationDays)

  const needsDate     = handoverMethod === 'PICKUP' || handoverMethod === 'MEETINGPOINT' || handoverMethod === 'DROPOFF'
  const needsLocation = handoverMethod === 'MEETINGPOINT'
  const needsCost     = handoverMethod === 'SHIPPING'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        bookId,
        startDate: new Date(startDate).toISOString(),
        durationDays,
        notes: notes || undefined,
        immediate: mode === 'borrow',
      }

      if (mode === 'reserve') {
        body.handoverMethod = handoverMethod
        if (needsDate && handoverDate) body.handoverDate = new Date(handoverDate).toISOString()
        if (needsLocation && handoverLocation) body.handoverLocation = handoverLocation
        if (needsCost && handoverCost) body.handoverCost = parseFloat(handoverCost)
      }

      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error ?? 'Fehler')
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

      {/* Mode toggle — only admins can borrow directly */}
      {isAdmin && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Vorgang
          </Typography>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, v) => { if (v) setMode(v) }}
            size="small"
          >
            <ToggleButton value="reserve">
              <BookmarkAddIcon sx={{ mr: 0.75, fontSize: 16 }} />
              Reservieren
            </ToggleButton>
            <ToggleButton value="borrow">
              <CheckCircleIcon sx={{ mr: 0.75, fontSize: 16 }} />
              Direkt ausleihen
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

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

      {mode === 'reserve' && (
        <TextField
          label="Abholdatum / Startdatum"
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
      )}

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
        {mode === 'reserve' && (
          <Typography variant="caption" color="text.secondary">
            Fällig am: {dueDate.toLocaleDateString('de-DE')}
          </Typography>
        )}
      </Box>

      {/* Handover method — only for reservations */}
      {mode === 'reserve' && (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Übergabeart <Typography component="span" variant="caption" color="text.secondary">*</Typography>
          </Typography>
          <RadioGroup
            value={handoverMethod}
            onChange={(e) => setHandoverMethod(e.target.value as HandoverMethod)}
          >
            {HANDOVER_OPTIONS.map((opt) => (
              <FormControlLabel
                key={opt.value}
                value={opt.value}
                control={<Radio size="small" />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    {opt.icon}
                    <Box>
                      <Typography variant="body2">{opt.label}</Typography>
                      <Typography variant="caption" color="text.secondary">{opt.description}</Typography>
                    </Box>
                  </Box>
                }
                sx={{ mb: 0.5, alignItems: 'flex-start', '& .MuiFormControlLabel-label': { mt: 0.5 } }}
              />
            ))}
          </RadioGroup>

          {/* Conditional fields */}
          {needsDate && (
            <TextField
              label={handoverMethod === 'PICKUP' ? 'Abholdatum' : handoverMethod === 'DROPOFF' ? 'Datum Vorbeibringen' : 'Treffpunkt-Datum'}
              type="date"
              value={handoverDate}
              onChange={(e) => setHandoverDate(e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 1.5 }}
              slotProps={{
                htmlInput: { min: new Date().toISOString().slice(0, 10) },
                inputLabel: { shrink: true },
              }}
            />
          )}
          {needsLocation && (
            <TextField
              label="Treffpunkt / Ort"
              value={handoverLocation}
              onChange={(e) => setHandoverLocation(e.target.value)}
              placeholder="z.B. Bibliothek, Zimmer 205"
              size="small"
              fullWidth
              sx={{ mt: 1.5 }}
            />
          )}
          {needsCost && (
            <TextField
              label="Versandkosten (€)"
              type="number"
              value={handoverCost}
              onChange={(e) => setHandoverCost(e.target.value)}
              size="small"
              sx={{ mt: 1.5, width: 200 }}
              slotProps={{
                htmlInput: { min: 0, step: 0.01 },
                input: { startAdornment: <InputAdornment position="start">€</InputAdornment> },
              }}
            />
          )}
        </Box>
      )}

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
        color={mode === 'borrow' ? 'success' : 'primary'}
        startIcon={loading
          ? <CircularProgress size={18} color="inherit" />
          : mode === 'borrow' ? <CheckCircleIcon /> : <BookmarkAddIcon />}
      >
        {loading
          ? (mode === 'borrow' ? 'Leihe aus…' : 'Reserviere…')
          : (mode === 'borrow' ? 'Direkt ausleihen' : 'Reservierung bestätigen')}
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
          <Typography variant="h5">Buch ausleihen / reservieren</Typography>
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
