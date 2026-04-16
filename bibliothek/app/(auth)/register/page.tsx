'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Alert, Box, Button, Card, CardContent, CircularProgress,
  Divider, Grid, IconButton, InputAdornment, TextField, Typography,
} from '@mui/material'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

type FieldErrors = Record<string, string[]>

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ firstname: '', lastname: '', username: '', email: '', phone: '', password: '', passwordConfirm: '' })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: [] }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setSuccess('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.details?.fieldErrors) setFieldErrors(data.details.fieldErrors)
        else setError(data.error ?? 'Registrierung fehlgeschlagen')
        return
      }
      setSuccess(data.message)
      setTimeout(() => router.push('/login'), 3000)
    } catch {
      setError('Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  const fe = (field: string) => fieldErrors[field]?.[0]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 520 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <MenuBookIcon sx={{ fontSize: 48, color: 'primary.main' }} />
            <Typography variant="h5" sx={{ mt: 1 }}>Konto erstellen</Typography>
            <Typography variant="body2" color="text.secondary">Registriere dich für die Bibliothek</Typography>
          </Box>

          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}<br /><small>Weiterleitung zur Anmeldeseite…</small></Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField label="Vorname" name="firstname" value={form.firstname} onChange={handleChange} required fullWidth error={!!fe('firstname')} helperText={fe('firstname')} />
              </Grid>
              <Grid size={6}>
                <TextField label="Nachname" name="lastname" value={form.lastname} onChange={handleChange} required fullWidth error={!!fe('lastname')} helperText={fe('lastname')} />
              </Grid>
            </Grid>
            <TextField label="Benutzername" name="username" value={form.username} onChange={handleChange} required fullWidth error={!!fe('username')} helperText={fe('username') ?? 'Buchstaben, Zahlen, Unterstriche'} />
            <TextField label="E-Mail" name="email" type="email" value={form.email} onChange={handleChange} required fullWidth error={!!fe('email')} helperText={fe('email')} />
            <TextField label="Telefon (optional)" name="phone" type="tel" value={form.phone} onChange={handleChange} fullWidth />
            <TextField
              label="Passwort" name="password" type={showPw ? 'text' : 'password'}
              value={form.password} onChange={handleChange} required fullWidth
              error={!!fe('password')} helperText={fe('password') ?? 'Mind. 8 Zeichen, Großbuchstabe, Zahl, Sonderzeichen'}
              slotProps={{ input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPw((v) => !v)} edge="end">
                      {showPw ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              } }}
            />
            <TextField label="Passwort bestätigen" name="passwordConfirm" type={showPw ? 'text' : 'password'} value={form.passwordConfirm} onChange={handleChange} required fullWidth error={!!fe('passwordConfirm')} helperText={fe('passwordConfirm')} />
            <Button type="submit" variant="contained" size="large" fullWidth disabled={loading} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <PersonAddIcon />}>
              {loading ? 'Registrieren…' : 'Konto erstellen'}
            </Button>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" align="center">
            Bereits ein Konto?{' '}
            <Link href="/login" style={{ fontWeight: 600, textDecoration: 'none' }}>Anmelden</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
