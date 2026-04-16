'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Alert, Box, Button, Card, CardContent, CircularProgress, TextField, Typography } from '@mui/material'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import EmailIcon from '@mui/icons-material/Email'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error ?? 'Etwas ist schiefgelaufen')
      else setMessage(data.message)
    } catch {
      setError('Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <MenuBookIcon sx={{ fontSize: 48, color: 'primary.main' }} />
            <Typography variant="h5" sx={{ mt: 1 }}>Passwort vergessen</Typography>
            <Typography variant="body2" color="text.secondary">Wir senden dir einen Link zum Zurücksetzen</Typography>
          </Box>

          {message ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              {message}
              <Box sx={{ mt: 1 }}>
                <Link href="/login" style={{ fontSize: 13 }}>Zurück zur Anmeldung</Link>
              </Box>
            </Alert>
          ) : (
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField label="E-Mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth autoFocus />
              <Button type="submit" variant="contained" size="large" fullWidth disabled={loading} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <EmailIcon />}>
                {loading ? 'Senden…' : 'Reset-Link senden'}
              </Button>
              <Typography variant="body2" align="center">
                <Link href="/login" style={{ textDecoration: 'none' }}>Zurück zur Anmeldung</Link>
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
