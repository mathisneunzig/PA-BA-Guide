'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import {
  Box, Button, Card, CardContent, CircularProgress, Divider,
  IconButton, InputAdornment, TextField, Typography, Alert,
} from '@mui/material'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import LoginIcon from '@mui/icons-material/Login'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'
  const verified = searchParams.get('verified')
  const { t } = useTranslation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? t('auth.loginFailed')); return }
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) setError(t('auth.invalidCredentials'))
      else router.push(callbackUrl)
    } catch {
      setError('Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {verified === 'true' && (
        <Alert severity="success">{t('auth.emailVerified')}</Alert>
      )}
      {error && <Alert severity="error">{error}</Alert>}

      <TextField label={t('auth.emailLabel')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth autoComplete="email" autoFocus />
      <TextField
        label={t('auth.passwordLabel')} type={showPw ? 'text' : 'password'} value={password}
        onChange={(e) => setPassword(e.target.value)} required fullWidth autoComplete="current-password"
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
      <Button type="submit" variant="contained" size="large" fullWidth disabled={loading} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <LoginIcon />}>
        {loading ? t('auth.loginLoading') : t('auth.loginButton')}
      </Button>
      <Typography variant="body2" align="center">
        <Link href="/forgot-password" style={{ color: 'inherit' }}>{t('auth.forgotPassword')}</Link>
      </Typography>
      <Divider />
      <Typography variant="body2" align="center">
        {t('auth.noAccount')}{' '}
        <Link href="/register" style={{ fontWeight: 600, textDecoration: 'none' }}>{t('auth.register')}</Link>
      </Typography>
    </Box>
  )
}

export default function LoginPage() {
  const { t } = useTranslation()
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <MenuBookIcon sx={{ fontSize: 48, color: 'primary.main' }} />
            <Typography variant="h5" sx={{ mt: 1 }}>{t('auth.loginTitle')}</Typography>
            <Typography variant="body2" color="text.secondary">{t('auth.loginSubtitle')}</Typography>
          </Box>
          <Suspense fallback={<CircularProgress />}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </Box>
  )
}
