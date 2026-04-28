'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
        setError(d.error ?? t('common.error'))
      } else {
        setSuccess(role === 'STUDENT' ? t('admin.users.approvedSuccess') : t('admin.users.guestSuccess'))
        setTimeout(() => router.push('/admin/users'), 1500)
      }
    } catch {
      setError(t('common.networkError'))
    } finally {
      setLoading(null)
    }
  }

  async function handleDelete() {
    if (!confirm(t('admin.users.deleteConfirm', { username: user.username }))) return
    setLoading('delete')
    setError('')
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? t('admin.users.deleteError'))
      } else {
        setSuccess(t('admin.users.deletedSuccess'))
        setTimeout(() => router.push('/admin/users'), 1500)
      }
    } catch {
      setError(t('common.networkError'))
    } finally {
      setLoading(null)
    }
  }

  const fullName = [user.firstname, user.lastname].filter(Boolean).join(' ') || '—'
  const address = [user.street, user.housenr, user.zipcode, user.city, user.country].filter(Boolean).join(', ') || null

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Button component={Link} href="/admin/users" startIcon={<ArrowBackIcon />} sx={{ mb: 3 }} variant="text" color="inherit">
        {t('admin.users.backToList')}
      </Button>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <PeopleIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Box>
          <Typography variant="h5">{t('admin.users.approveTitle')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('admin.users.approveSubtitle')}</Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{t('admin.users.userData')}</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip
                label={user.role}
                color={user.role === 'ADMIN' ? 'secondary' : user.role === 'STUDENT' ? 'primary' : 'default'}
                size="small"
              />
              {user.email_verified
                ? <Chip icon={<VerifiedIcon />} label={t('admin.users.emailVerified')} color="success" size="small" variant="outlined" />
                : <Chip icon={<WarningAmberIcon />} label={t('admin.users.emailNotVerified')} color="warning" size="small" variant="outlined" />}
            </Box>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={1}>
            <Row label={t('common.name')} value={fullName} />
            <Row label={t('admin.users.colUsername')} value={<span style={{ fontFamily: 'monospace' }}>{user.username}</span>} />
            <Row label={t('common.email')} value={user.email} />
            <Row label={t('common.phone')} value={user.phone} />
            <Row label={t('common.address')} value={address} />
            <Row label={t('admin.users.registeredAt')} value={new Date(user.createdAt).toLocaleString('de-DE')} />
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>{t('admin.users.decision')}</Typography>
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
              {user.role === 'STUDENT' ? t('admin.users.alreadyStudent') : t('admin.users.approveAsStudent')}
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
              {t('admin.users.keepAsGuest')}
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
              {t('admin.users.deleteAccount')}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  )
}
