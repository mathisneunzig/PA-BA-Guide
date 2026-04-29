'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'react-i18next'
import {
  Alert, Box, Button, Card, CardContent, Chip, Container,
  Divider, Grid, Typography,
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import EditIcon from '@mui/icons-material/Edit'
import VerifiedIcon from '@mui/icons-material/Verified'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

interface UserData {
  firstname?: string | null; lastname?: string | null; username?: string
  phone?: string | null; role?: string; email?: string; email_verified?: boolean
  street?: string | null; housenr?: string | null; zipcode?: string | null; city?: string | null; country?: string | null
  del_street?: string | null; del_housenr?: string | null; del_zipcode?: string | null; del_city?: string | null; del_country?: string | null
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <>
      <Grid size={5}>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
      </Grid>
      <Grid size={7}>
        <Typography variant="body2">{value || '—'}</Typography>
      </Grid>
    </>
  )
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const { t } = useTranslation()
  const [user, setUser] = useState<UserData | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return
    fetch(`/api/users/${session.user.id}`)
      .then((r) => r.json())
      .then((data) => setUser(data))
      .catch(() => {})
  }, [session?.user?.id])

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PersonIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          <Typography variant="h5">{t('profile.title')}</Typography>
        </Box>
        <Button href="/settings" variant="outlined" startIcon={<EditIcon />}>
          {t('profile.edit')}
        </Button>
      </Box>

      {user && !user.email_verified && (
        <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 3 }}>
          {t('profile.emailNotVerified')}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>{t('profile.personalInfo')}</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={1}>
                <Row label={t('profile.firstname')} value={user?.firstname} />
                <Row label={t('profile.lastname')} value={user?.lastname} />
                <Row label={t('profile.username')} value={user?.username} />
                <Row label={t('profile.phone')} value={user?.phone} />
                <Grid size={5}><Typography variant="body2" color="text.secondary">{t('profile.role')}</Typography></Grid>
                <Grid size={7}>
                  <Chip label={user?.role} size="small" color={user?.role === 'ADMIN' ? 'secondary' : user?.role === 'STUDENT' ? 'primary' : 'default'} />
                </Grid>
                <Grid size={5}><Typography variant="body2" color="text.secondary">{t('profile.email')}</Typography></Grid>
                <Grid size={7}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2">{user?.email}</Typography>
                    {user?.email_verified
                      ? <VerifiedIcon sx={{ fontSize: 14, color: 'success.main' }} />
                      : <WarningAmberIcon sx={{ fontSize: 14, color: 'warning.main' }} />}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>{t('profile.billingAddress')}</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={1}>
                <Row label={t('profile.street')} value={user?.street ? `${user.street} ${user.housenr ?? ''}`.trim() : null} />
                <Row label={t('profile.zipCity')} value={user?.zipcode ? `${user.zipcode} ${user.city ?? ''}`.trim() : null} />
                <Row label={t('profile.country')} value={user?.country} />
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>{t('profile.deliveryAddress')}</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={1}>
                <Row label={t('profile.street')} value={user?.del_street ? `${user.del_street} ${user.del_housenr ?? ''}`.trim() : null} />
                <Row label={t('profile.zipCity')} value={user?.del_zipcode ? `${user.del_zipcode} ${user.del_city ?? ''}`.trim() : null} />
                <Row label={t('profile.country')} value={user?.del_country} />
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}
