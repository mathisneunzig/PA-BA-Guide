'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  Container, Divider, Grid, Typography,
} from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import BlockIcon from '@mui/icons-material/Block'
import VerifiedIcon from '@mui/icons-material/Verified'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Link from 'next/link'

interface User {
  id: string
  firstname: string | null
  lastname: string | null
  username: string
  email: string
  phone: string | null
  role: string
  email_verified: boolean
  createdAt: Date
  street: string | null
  housenr: string | null
  zipcode: string | null
  city: string | null
  country: string | null
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <Grid size={4}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
      </Grid>
      <Grid size={8}>
        <Typography variant="body2">{value ?? <span style={{ color: '#aaa' }}>—</span>}</Typography>
      </Grid>
    </>
  )
}

export default function ApproveUserClient({ user }: { user: User }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'student' | 'guest' | 'delete' | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function setRole(role: 'STUDENT' | 'GUEST') {
    setLoading(role === 'STUDENT' ? 'student' : 'guest')
    setError('')
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Fehler')
      } else {
        setSuccess(role === 'STUDENT' ? 'Nutzer wurde als Student freigeschaltet.' : 'Nutzer bleibt als Gast.')
        setTimeout(() => router.push('/admin/users'), 1500)
      }
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setLoading(null)
    }
  }

  async function handleDelete() {
    if (!confirm(`Nutzer „${user.username}" wirklich löschen?`)) return
    setLoading('delete')
    setError('')
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Fehler beim Löschen')
      } else {
        setSuccess('Nutzer wurde gelöscht.')
        setTimeout(() => router.push('/admin/users'), 1500)
      }
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setLoading(null)
    }
  }

  const fullName = [user.firstname, user.lastname].filter(Boolean).join(' ') || '—'
  const address = [user.street, user.housenr, user.zipcode, user.city, user.country].filter(Boolean).join(', ') || null

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Button component={Link} href="/admin/users" startIcon={<ArrowBackIcon />} sx={{ mb: 3 }} variant="text" color="inherit">
        Zurück zur Nutzerliste
      </Button>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <PeopleIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Box>
          <Typography variant="h5">Nutzer prüfen</Typography>
          <Typography variant="body2" color="text.secondary">Registrierung freigeben oder ablehnen</Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Nutzerdaten</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip
                label={user.role}
                color={user.role === 'ADMIN' ? 'secondary' : user.role === 'STUDENT' ? 'primary' : 'default'}
                size="small"
              />
              {user.email_verified
                ? <Chip icon={<VerifiedIcon />} label="E-Mail bestätigt" color="success" size="small" variant="outlined" />
                : <Chip icon={<WarningAmberIcon />} label="Nicht bestätigt" color="warning" size="small" variant="outlined" />}
            </Box>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={1}>
            <Row label="Name" value={fullName} />
            <Row label="Benutzername" value={<span style={{ fontFamily: 'monospace' }}>{user.username}</span>} />
            <Row label="E-Mail" value={user.email} />
            <Row label="Telefon" value={user.phone} />
            <Row label="Adresse" value={address} />
            <Row label="Registriert" value={new Date(user.createdAt).toLocaleString('de-DE')} />
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Entscheidung</Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button
              variant="contained"
              color="success"
              size="large"
              startIcon={loading === 'student' ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
              disabled={!!loading || user.role === 'STUDENT'}
              onClick={() => setRole('STUDENT')}
              fullWidth
            >
              {user.role === 'STUDENT' ? 'Bereits Student' : 'Als Student freischalten'}
            </Button>
            <Button
              variant="outlined"
              color="warning"
              size="large"
              startIcon={loading === 'guest' ? <CircularProgress size={18} color="inherit" /> : <BlockIcon />}
              disabled={!!loading || user.role === 'GUEST'}
              onClick={() => setRole('GUEST')}
              fullWidth
            >
              Als Gast belassen
            </Button>
            <Divider />
            <Button
              variant="outlined"
              color="error"
              size="large"
              startIcon={loading === 'delete' ? <CircularProgress size={18} color="inherit" /> : <BlockIcon />}
              disabled={!!loading}
              onClick={handleDelete}
              fullWidth
            >
              Konto ablehnen &amp; löschen
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  )
}
