'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import {
  Alert, Box, Button, Card, CardContent, Checkbox, CircularProgress,
  Divider, FormControlLabel, FormHelperText, Grid, IconButton,
  InputAdornment, Step, StepLabel, Stepper, TextField, Typography,
} from '@mui/material'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

type FieldErrors = Record<string, string[]>

const STEPS_KEYS = ['auth.stepAccount', 'auth.stepAddress'] as const

export default function RegisterPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [step, setStep] = useState(0)

  // Step 1 fields
  const [form, setForm] = useState({
    firstname: '', lastname: '', username: '', email: '', phone: '',
    password: '', passwordConfirm: '',
  })
  // Step 2 fields
  const [address, setAddress] = useState({
    street: '', housenr: '', zipcode: '', city: '', country: '',
  })
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [agbAccepted, setAgbAccepted] = useState(false)

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: [] }))
  }

  function handleAddressChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function validateStep1(): boolean {
    const errors: FieldErrors = {}
    if (!form.firstname.trim()) errors.firstname = ['Vorname ist erforderlich']
    if (!form.lastname.trim()) errors.lastname = ['Nachname ist erforderlich']
    if (!form.username.trim()) errors.username = ['Benutzername ist erforderlich']
    else if (!/^[a-zA-Z0-9_]{3,30}$/.test(form.username)) errors.username = ['3–30 Zeichen, nur Buchstaben/Zahlen/Unterstriche']
    if (!form.email.trim()) errors.email = ['E-Mail ist erforderlich']
    if (!form.password) errors.password = ['Passwort ist erforderlich']
    else if (form.password.length < 8) errors.password = ['Mindestens 8 Zeichen']
    if (form.password !== form.passwordConfirm) errors.passwordConfirm = ['Passwörter stimmen nicht überein']
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleNext() {
    if (validateStep1()) setStep(1)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!agbAccepted) {
      setFieldErrors((prev) => ({ ...prev, agbAccepted: [t('auth.agbRequired')] }))
      return
    }
    setError('')
    setFieldErrors({})
    setSuccess('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          ...address,
          marketingConsent,
          agbAccepted,
        }),
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
      <Card sx={{ width: '100%', maxWidth: 560 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <MenuBookIcon sx={{ fontSize: 48, color: 'primary.main' }} />
            <Typography variant="h5" sx={{ mt: 1 }}>{t('auth.registerTitle')}</Typography>
            <Typography variant="body2" color="text.secondary">{t('auth.registerSubtitle')}</Typography>
          </Box>

          <Stepper activeStep={step} sx={{ mb: 3 }}>
            {STEPS_KEYS.map((key) => (
              <Step key={key}><StepLabel>{t(key)}</StepLabel></Step>
            ))}
          </Stepper>

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}<br /><small>Weiterleitung zur Anmeldeseite…</small>
            </Alert>
          )}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* Step 1: Account */}
          {step === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <TextField label={t('auth.firstnameLabel')} name="firstname" value={form.firstname} onChange={handleChange} required fullWidth error={!!fe('firstname')} helperText={fe('firstname')} />
                </Grid>
                <Grid size={6}>
                  <TextField label={t('auth.lastnameLabel')} name="lastname" value={form.lastname} onChange={handleChange} required fullWidth error={!!fe('lastname')} helperText={fe('lastname')} />
                </Grid>
              </Grid>
              <TextField label={t('auth.usernameLabel')} name="username" value={form.username} onChange={handleChange} required fullWidth error={!!fe('username')} helperText={fe('username') ?? t('auth.usernameHelper')} />
              <TextField label={t('auth.emailLabel')} name="email" type="email" value={form.email} onChange={handleChange} required fullWidth error={!!fe('email')} helperText={fe('email')} />
              <TextField label={t('auth.phoneLabel')} name="phone" type="tel" value={form.phone} onChange={handleChange} fullWidth />
              <TextField
                label={t('auth.passwordLabel')} name="password" type={showPw ? 'text' : 'password'}
                value={form.password} onChange={handleChange} required fullWidth
                error={!!fe('password')} helperText={fe('password') ?? t('auth.passwordHelper')}
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
              <TextField label={t('auth.passwordConfirmLabel')} name="passwordConfirm" type={showPw ? 'text' : 'password'} value={form.passwordConfirm} onChange={handleChange} required fullWidth error={!!fe('passwordConfirm')} helperText={fe('passwordConfirm')} />
              <Button variant="contained" size="large" fullWidth endIcon={<ArrowForwardIcon />} onClick={handleNext}>
                {t('common.next')}
              </Button>
            </Box>
          )}

          {/* Step 2: Address + Consent */}
          {step === 1 && (
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{t('auth.addressOptional')}</Typography>
              <Grid container spacing={2}>
                <Grid size={8}>
                  <TextField label="Straße" name="street" value={address.street} onChange={handleAddressChange} fullWidth size="small" />
                </Grid>
                <Grid size={4}>
                  <TextField label="Hausnr." name="housenr" value={address.housenr} onChange={handleAddressChange} fullWidth size="small" />
                </Grid>
                <Grid size={4}>
                  <TextField label="PLZ" name="zipcode" value={address.zipcode} onChange={handleAddressChange} fullWidth size="small" />
                </Grid>
                <Grid size={8}>
                  <TextField label="Stadt" name="city" value={address.city} onChange={handleAddressChange} fullWidth size="small" />
                </Grid>
                <Grid size={12}>
                  <TextField label="Land" name="country" value={address.country} onChange={handleAddressChange} fullWidth size="small" />
                </Grid>
              </Grid>

              <Divider sx={{ my: 1 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Einwilligungen</Typography>
              <Box>
                <FormControlLabel
                  control={<Checkbox checked={marketingConsent} onChange={(e) => setMarketingConsent(e.target.checked)} />}
                  label={
                    <Typography variant="body2">
                      {t('auth.marketingConsent')}
                    </Typography>
                  }
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4, mt: -0.5 }}>
                  {t('auth.marketingConsentNote')}
                </Typography>
              </Box>

              <Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={agbAccepted}
                      onChange={(e) => {
                        setAgbAccepted(e.target.checked)
                        if (e.target.checked) setFieldErrors((prev) => ({ ...prev, agbAccepted: [] }))
                      }}
                      color={fe('agbAccepted') ? 'error' : 'primary'}
                    />
                  }
                  label={
                    <Typography variant="body2">
                      {t('auth.agbAccepted')}
                    </Typography>
                  }
                />
                {fe('agbAccepted') && (
                  <FormHelperText error sx={{ ml: 4 }}>{fe('agbAccepted')}</FormHelperText>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => setStep(0)} disabled={loading}>
                  {t('common.back')}
                </Button>
                <Button type="submit" variant="contained" size="large" fullWidth disabled={loading} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <PersonAddIcon />}>
                  {loading ? t('auth.registerLoading') : t('auth.registerButton')}
                </Button>
              </Box>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" align="center">
            {t('auth.alreadyAccount')}{' '}
            <Link href="/login" style={{ fontWeight: 600, textDecoration: 'none' }}>{t('auth.loginLink')}</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
