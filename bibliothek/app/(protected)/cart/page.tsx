'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert, Box, Button, Card, CardContent, CircularProgress,
  Container, Divider, FormControlLabel, IconButton, InputAdornment,
  Radio, RadioGroup, Slider, Stack, TextField, Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import EventIcon from '@mui/icons-material/Event'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import PinDropIcon from '@mui/icons-material/PinDrop'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import Link from 'next/link'
import { useCart } from '@/lib/cart/CartContext'
import CartTimer from '@/app/components/CartTimer'

type HandoverMethod = 'PICKUP' | 'MEETINGPOINT' | 'SHIPPING'

const HANDOVER_OPTIONS: { value: HandoverMethod; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'PICKUP',       label: 'Abholung',  icon: <MeetingRoomIcon fontSize="small" />,   description: 'Ich hole das Buch bei Mathis ab' },
  { value: 'MEETINGPOINT', label: 'Treffpunkt', icon: <PinDropIcon fontSize="small" />,       description: 'Wir vereinbaren einen Treffpunkt' },
  { value: 'SHIPPING',     label: 'Zusenden',   icon: <LocalShippingIcon fontSize="small" />, description: 'Buch wird zugeschickt (zzgl. Versandkosten)' },
]

export default function CartPage() {
  const router = useRouter()
  const { items, remove, clear } = useCart()

  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [durationWeeks, setDurationWeeks] = useState(13)
  const [notes, setNotes] = useState('')
  const [handoverMethod, setHandoverMethod] = useState<HandoverMethod>('PICKUP')
  const [handoverDate, setHandoverDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [handoverLocation, setHandoverLocation] = useState('')
  const [handoverCost, setHandoverCost] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [done, setDone] = useState(false)

  const durationDays = durationWeeks * 7
  const dueDate = new Date(startDate)
  dueDate.setDate(dueDate.getDate() + durationDays)

  const needsDate     = handoverMethod === 'PICKUP' || handoverMethod === 'MEETINGPOINT'
  const needsLocation = handoverMethod === 'MEETINGPOINT'
  const needsCost     = handoverMethod === 'SHIPPING'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0) return
    setSubmitError('')
    setSubmitting(true)

    const body: Record<string, unknown> = {
      bookIds: items.map((b) => b.id),
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

    setSubmitting(false)

    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setSubmitError(d.error ? (typeof d.error === 'string' ? d.error : JSON.stringify(d.error)) : 'Fehler beim Reservieren')
    } else {
      clear()
      setDone(true)
      setTimeout(() => router.push('/my-loans'), 1500)
    }
  }

  if (done) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Alert severity="success" sx={{ mb: 2 }}>
          Reservierung erfolgreich erstellt! Weiterleitung…
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <ShoppingCartIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Box>
          <Typography variant="h5">Warenkorb</Typography>
          <Typography variant="body2" color="text.secondary">
            {items.length} Buch{items.length !== 1 ? 'er' : ''} zur Reservierung
          </Typography>
        </Box>
      </Box>

      {items.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <ShoppingCartIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary" gutterBottom>Dein Warenkorb ist leer.</Typography>
            <Button href="/books" variant="outlined" sx={{ mt: 1 }}>Zum Katalog</Button>
          </CardContent>
        </Card>
      ) : (
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Hold timer */}
          <CartTimer />

          {submitError && <Alert severity="error">{submitError}</Alert>}

          {/* Book list */}
          <Card>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>
                Ausgewählte Bücher
              </Typography>
              <Stack spacing={1} sx={{ mt: 1 }}>
                {items.map((book) => (
                  <Box
                    key={book.id}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: 1, bgcolor: 'action.hover' }}
                  >
                    {book.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={book.coverUrl} alt={book.title} style={{ width: 32, height: 44, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />
                    ) : (
                      <Box sx={{ width: 32, height: 44, bgcolor: 'action.selected', borderRadius: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <MenuBookIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                      </Box>
                    )}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>{book.title}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>{book.author}</Typography>
                    </Box>
                    <IconButton size="small" color="error" onClick={() => remove(book.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
              <Button size="small" color="error" onClick={clear} sx={{ mt: 1 }}>
                Alle entfernen
              </Button>
            </CardContent>
          </Card>

          {/* Reservation details */}
          <Card>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>
                Reservierungsdetails
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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

                <Box>
                  <Typography variant="body2" gutterBottom>
                    Ausleihdauer: <strong>{durationWeeks} Wochen</strong>
                  </Typography>
                  <Slider
                    value={durationWeeks}
                    onChange={(_, v) => setDurationWeeks(v as number)}
                    min={1} max={13} marks
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => `${v} Wo.`}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Fällig am: {dueDate.toLocaleDateString('de-DE')}
                  </Typography>
                </Box>

                {/* Handover method */}
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Übergabeart *</Typography>
                  <RadioGroup value={handoverMethod} onChange={(e) => setHandoverMethod(e.target.value as HandoverMethod)}>
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

                  {needsDate && (
                    <TextField
                      label={handoverMethod === 'PICKUP' ? 'Abholdatum' : 'Treffpunkt-Datum'}
                      type="date" value={handoverDate} onChange={(e) => setHandoverDate(e.target.value)}
                      size="small" fullWidth sx={{ mt: 1.5 }}
                      slotProps={{ htmlInput: { min: new Date().toISOString().slice(0, 10) }, inputLabel: { shrink: true } }}
                    />
                  )}
                  {needsLocation && (
                    <TextField
                      label="Treffpunkt / Ort" value={handoverLocation}
                      onChange={(e) => setHandoverLocation(e.target.value)}
                      placeholder="z.B. Bibliothek, Zimmer 205"
                      size="small" fullWidth sx={{ mt: 1.5 }}
                    />
                  )}
                  {needsCost && (
                    <TextField
                      label="Versandkosten (€)" type="number" value={handoverCost}
                      onChange={(e) => setHandoverCost(e.target.value)}
                      size="small" sx={{ mt: 1.5, width: 200 }}
                      slotProps={{ htmlInput: { min: 0, step: 0.01 }, input: { startAdornment: <InputAdornment position="start">€</InputAdornment> } }}
                    />
                  )}
                </Box>

                <TextField
                  label="Notizen (optional)" value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  multiline rows={2} size="small"
                />
              </Box>
            </CardContent>
          </Card>

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={submitting || items.length === 0}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <BookmarkAddIcon />}
          >
            {submitting ? 'Reserviere…' : `${items.length} Buch${items.length !== 1 ? 'er' : ''} reservieren`}
          </Button>

          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            Du kannst auch <Link href="/books" style={{ color: 'inherit' }}>weitere Bücher</Link> hinzufügen.
          </Typography>
        </Box>
      )}
    </Container>
  )
}
