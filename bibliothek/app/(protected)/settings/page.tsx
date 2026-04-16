'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Alert, Box, Button, Card, CardContent, CircularProgress,
  Container, Divider, Grid, TextField, Typography,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import SettingsIcon from '@mui/icons-material/Settings'

export default function SettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [form, setForm] = useState({
    firstname: '', lastname: '', username: '', phone: '',
    street: '', housenr: '', zipcode: '', city: '', country: '',
    del_street: '', del_housenr: '', del_zipcode: '', del_city: '', del_country: '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!session?.user?.id) return
    setError('')
    setMessage('')
    setLoading(true)
    const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''))
    try {
      const res = await fetch(`/api/users/${session.user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error ?? 'Aktualisierung fehlgeschlagen')
      else { setMessage('Profil erfolgreich gespeichert.'); router.refresh() }
    } catch {
      setError('Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  const tf = (label: string, name: keyof typeof form, type = 'text') => (
    <TextField key={name} label={label} name={name} type={type} value={form[name]} onChange={handleChange} fullWidth placeholder={`Aktuellen Wert überschreiben`} size="small" />
  )

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <SettingsIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Typography variant="h5">Einstellungen</Typography>
      </Box>

      {message && <Alert severity="success" sx={{ mb: 3 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>Persönliche Informationen</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>{tf('Vorname', 'firstname')}</Grid>
              <Grid size={{ xs: 12, sm: 6 }}>{tf('Nachname', 'lastname')}</Grid>
              <Grid size={{ xs: 12, sm: 6 }}>{tf('Benutzername', 'username')}</Grid>
              <Grid size={{ xs: 12, sm: 6 }}>{tf('Telefon', 'phone', 'tel')}</Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>Rechnungsadresse</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={8}>{tf('Straße', 'street')}</Grid>
              <Grid size={4}>{tf('Hausnr.', 'housenr')}</Grid>
              <Grid size={4}>{tf('PLZ', 'zipcode')}</Grid>
              <Grid size={8}>{tf('Stadt', 'city')}</Grid>
              <Grid size={12}>{tf('Land', 'country')}</Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>Lieferadresse</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={8}>{tf('Straße', 'del_street')}</Grid>
              <Grid size={4}>{tf('Hausnr.', 'del_housenr')}</Grid>
              <Grid size={4}>{tf('PLZ', 'del_zipcode')}</Grid>
              <Grid size={8}>{tf('Stadt', 'del_city')}</Grid>
              <Grid size={12}>{tf('Land', 'del_country')}</Grid>
            </Grid>
          </CardContent>
        </Card>

        <Button type="submit" variant="contained" size="large" disabled={loading} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />} sx={{ alignSelf: 'flex-start', px: 4 }}>
          {loading ? 'Speichern…' : 'Änderungen speichern'}
        </Button>
      </Box>
    </Container>
  )
}
