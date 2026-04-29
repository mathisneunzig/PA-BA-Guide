'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import {
  Alert, Box, Button, Card, CardContent, CircularProgress,
  Container, Divider, Grid, TextField, Typography,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import SettingsIcon from '@mui/icons-material/Settings'

type FormState = {
  firstname: string; lastname: string; username: string; phone: string
  street: string; housenr: string; zipcode: string; city: string; country: string
  del_street: string; del_housenr: string; del_zipcode: string; del_city: string; del_country: string
}

const EMPTY: FormState = {
  firstname: '', lastname: '', username: '', phone: '',
  street: '', housenr: '', zipcode: '', city: '', country: '',
  del_street: '', del_housenr: '', del_zipcode: '', del_city: '', del_country: '',
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { t } = useTranslation()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    if (!session?.user?.id) return
    fetch(`/api/users/${session.user.id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          firstname:   data.firstname   ?? '',
          lastname:    data.lastname    ?? '',
          username:    data.username    ?? '',
          phone:       data.phone       ?? '',
          street:      data.street      ?? '',
          housenr:     data.housenr     ?? '',
          zipcode:     data.zipcode     ?? '',
          city:        data.city        ?? '',
          country:     data.country     ?? '',
          del_street:  data.del_street  ?? '',
          del_housenr: data.del_housenr ?? '',
          del_zipcode: data.del_zipcode ?? '',
          del_city:    data.del_city    ?? '',
          del_country: data.del_country ?? '',
        })
      })
      .catch(() => {})
      .finally(() => setInitializing(false))
  }, [session?.user?.id])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!session?.user?.id) return
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${session.user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error ?? t('settings.updateFailed'))
      else { setMessage(t('settings.saved')); router.refresh() }
    } catch {
      setError(t('common.unexpectedError'))
    } finally {
      setLoading(false)
    }
  }

  const tf = (label: string, name: keyof FormState, type = 'text') => (
    <TextField key={name} label={label} name={name} type={type} value={form[name]} onChange={handleChange} fullWidth size="small" />
  )

  if (initializing) {
    return (
      <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <SettingsIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Typography variant="h5">{t('settings.title')}</Typography>
      </Box>

      {message && <Alert severity="success" sx={{ mb: 3 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>{t('settings.personalInfo')}</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>{tf(t('settings.firstname'), 'firstname')}</Grid>
              <Grid size={{ xs: 12, sm: 6 }}>{tf(t('settings.lastname'), 'lastname')}</Grid>
              <Grid size={{ xs: 12, sm: 6 }}>{tf(t('settings.username'), 'username')}</Grid>
              <Grid size={{ xs: 12, sm: 6 }}>{tf(t('settings.phone'), 'phone', 'tel')}</Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>{t('settings.billingAddress')}</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={8}>{tf(t('settings.street'), 'street')}</Grid>
              <Grid size={4}>{tf(t('settings.housenr'), 'housenr')}</Grid>
              <Grid size={4}>{tf(t('settings.zipcode'), 'zipcode')}</Grid>
              <Grid size={8}>{tf(t('settings.city'), 'city')}</Grid>
              <Grid size={12}>{tf(t('settings.country'), 'country')}</Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>{t('settings.deliveryAddress')}</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={8}>{tf(t('settings.street'), 'del_street')}</Grid>
              <Grid size={4}>{tf(t('settings.housenr'), 'del_housenr')}</Grid>
              <Grid size={4}>{tf(t('settings.zipcode'), 'del_zipcode')}</Grid>
              <Grid size={8}>{tf(t('settings.city'), 'del_city')}</Grid>
              <Grid size={12}>{tf(t('settings.country'), 'del_country')}</Grid>
            </Grid>
          </CardContent>
        </Card>

        <Button type="submit" variant="contained" size="large" disabled={loading} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />} sx={{ alignSelf: 'flex-start', px: 4 }}>
          {loading ? t('common.saving') : t('common.saveChanges')}
        </Button>
      </Box>
    </Container>
  )
}
