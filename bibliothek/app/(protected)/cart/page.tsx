'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
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

export default function CartPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { items, remove, clear } = useCart()

  const HANDOVER_OPTIONS: { value: HandoverMethod; label: string; icon: React.ReactNode; description: string }[] = [
    { value: 'PICKUP',       label: t('cart.handoverPickup'),       icon: <MeetingRoomIcon fontSize="small" />,   description: t('cart.handoverPickupDesc') },
    { value: 'MEETINGPOINT', label: t('cart.handoverMeetingpoint'), icon: <PinDropIcon fontSize="small" />,       description: t('cart.handoverMeetingpointDesc') },
    { value: 'SHIPPING',     label: t('cart.handoverShipping'),     icon: <LocalShippingIcon fontSize="small" />, description: t('cart.handoverShippingDesc') },
  ]

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
      setSubmitError(d.error ? (typeof d.error === 'string' ? d.error : JSON.stringify(d.error)) : t('cart.error'))
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
          {t('cart.success')}
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <ShoppingCartIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Box>
          <Typography variant="h5">{t('cart.title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {items.length === 1 ? t('cart.subtitle', { count: items.length }) : t('cart.subtitlePlural', { count: items.length })}
          </Typography>
        </Box>
      </Box>

      {items.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <ShoppingCartIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary" gutterBottom>{t('cart.empty')}</Typography>
            <Button href="/books" variant="outlined" sx={{ mt: 1 }}>{t('cart.toCatalog')}</Button>
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
                {t('cart.selectedBooks')}
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
                {t('cart.removeAll')}
              </Button>
            </CardContent>
          </Card>

          {/* Reservation details */}
          <Card>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>
                {t('cart.reservationDetails')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label={t('cart.pickupDate')}
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
                    {t('cart.duration', { weeks: durationWeeks })}
                  </Typography>
                  <Slider
                    value={durationWeeks}
                    onChange={(_, v) => setDurationWeeks(v as number)}
                    min={1} max={13} marks
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => `${v} Wo.`}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {t('cart.dueDate', { date: dueDate.toLocaleDateString() })}
                  </Typography>
                </Box>

                {/* Handover method */}
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>{t('cart.handoverType')}</Typography>
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
                      label={handoverMethod === 'PICKUP' ? t('cart.pickupDateLabel') : t('cart.meetingDateLabel')}
                      type="date" value={handoverDate} onChange={(e) => setHandoverDate(e.target.value)}
                      size="small" fullWidth sx={{ mt: 1.5 }}
                      slotProps={{ htmlInput: { min: new Date().toISOString().slice(0, 10) }, inputLabel: { shrink: true } }}
                    />
                  )}
                  {needsLocation && (
                    <TextField
                      label={t('cart.meetingLocation')} value={handoverLocation}
                      onChange={(e) => setHandoverLocation(e.target.value)}
                      placeholder={t('cart.meetingLocationPlaceholder')}
                      size="small" fullWidth sx={{ mt: 1.5 }}
                    />
                  )}
                  {needsCost && (
                    <TextField
                      label={t('cart.shippingCost')} type="number" value={handoverCost}
                      onChange={(e) => setHandoverCost(e.target.value)}
                      size="small" sx={{ mt: 1.5, width: 200 }}
                      slotProps={{ htmlInput: { min: 0, step: 0.01 }, input: { startAdornment: <InputAdornment position="start">€</InputAdornment> } }}
                    />
                  )}
                </Box>

                <TextField
                  label={t('common.notes')} value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('common.notesPlaceholder')}
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
            {submitting ? t('cart.reserving') : (
              items.length === 1 ? t('cart.reserveButton', { count: items.length }) : t('cart.reserveButtonPlural', { count: items.length })
            )}
          </Button>

          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            {t('cart.addMoreBooks').split('weitere Bücher')[0]}
            <Link href="/books" style={{ color: 'inherit' }}>{t('nav.books').toLowerCase()}</Link>
            {t('cart.addMoreBooks').split('weitere Bücher')[1] ?? ''}
          </Typography>
        </Box>
      )}
    </Container>
  )
}
