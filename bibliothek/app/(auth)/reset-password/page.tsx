'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Alert, Box, Button, Card, CardContent, CircularProgress, IconButton, InputAdornment, TextField, Typography } from '@mui/material'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import LockResetIcon from '@mui/icons-material/LockReset'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

function ResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!token) return <Alert severity="error">Ungültiger oder fehlender Reset-Token.</Alert>

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, passwordConfirm }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error ?? 'Zurücksetzen fehlgeschlagen')
      else { setMessage(data.message); setTimeout(() => router.push('/login'), 2000) }
    } catch {
      setError('Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  const pwAdornment = (
    <InputAdornment position="end">
      <IconButton onClick={() => setShowPw((v) => !v)} edge="end">
        {showPw ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    </InputAdornment>
  )

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      <TextField label="Neues Passwort" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth slotProps={{ input: { endAdornment: pwAdornment } }} />
      <TextField label="Passwort bestätigen" type={showPw ? 'text' : 'password'} value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required fullWidth slotProps={{ input: { endAdornment: pwAdornment } }} />
      <Button type="submit" variant="contained" size="large" fullWidth disabled={loading} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <LockResetIcon />}>
        {loading ? 'Zurücksetzen…' : 'Passwort zurücksetzen'}
      </Button>
    </Box>
  )
}

export default function ResetPasswordPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <MenuBookIcon sx={{ fontSize: 48, color: 'primary.main' }} />
            <Typography variant="h5" sx={{ mt: 1 }}>Neues Passwort setzen</Typography>
          </Box>
          <Suspense fallback={<CircularProgress />}>
            <ResetForm />
          </Suspense>
        </CardContent>
      </Card>
    </Box>
  )
}
