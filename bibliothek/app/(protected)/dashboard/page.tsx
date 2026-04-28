'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'react-i18next'
import {
  Alert, Box, Button, Card, CardActionArea, CardContent,
  Container, Chip, Grid, Typography,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PersonIcon from '@mui/icons-material/Person'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

interface Stats { activeLoans: number; overdueLoans: number }

export default function DashboardPage() {
  const { data: session } = useSession()
  const { t } = useTranslation()
  const [stats, setStats] = useState<Stats>({ activeLoans: 0, overdueLoans: 0 })
  const [emailVerified, setEmailVerified] = useState(true)
  const user = session?.user

  useEffect(() => {
    if (!user?.id) return
    fetch(`/api/users/${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        setEmailVerified(data.email_verified ?? true)
      })
      .catch(() => {})
    fetch('/api/loans/stats')
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {})
  }, [user?.id])

  const quickLinks = [
    { href: '/books', label: t('dashboard.browseCatalog'), icon: <MenuBookIcon />, desc: t('dashboard.browseCatalogDesc') },
    { href: '/my-loans', label: t('dashboard.myLoans'), icon: <BookmarkIcon />, desc: t('dashboard.myLoansDesc') },
    { href: '/profile', label: t('dashboard.myProfile'), icon: <PersonIcon />, desc: t('dashboard.myProfileDesc') },
  ]

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <DashboardIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Typography variant="h5">{t('dashboard.title')}</Typography>
      </Box>

      {!emailVerified && (
        <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 3 }}>
          {t('dashboard.emailNotVerified')}
        </Alert>
      )}

      {stats.overdueLoans > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {t('dashboard.overdueWarning', { count: stats.overdueLoans, suffix: stats.overdueLoans > 1 ? 'n' : '' })}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6">
                {t('dashboard.welcome', { name: user?.name ?? user?.email ?? '' })}
              </Typography>
              <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
            </Box>
            <Chip
              label={user?.role}
              color={user?.role === 'ADMIN' ? 'secondary' : user?.role === 'STUDENT' ? 'primary' : 'default'}
              size="small"
            />
          </Box>

          {(stats.activeLoans > 0 || stats.overdueLoans > 0) && (
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              {stats.activeLoans > 0 && (
                <Chip label={t('dashboard.activeLoans', { count: stats.activeLoans })} color="success" size="small" variant="outlined" />
              )}
              {stats.overdueLoans > 0 && (
                <Chip label={t('dashboard.overdueLoans', { count: stats.overdueLoans })} color="error" size="small" variant="outlined" />
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {quickLinks.map((link) => (
          <Grid size={{ xs: 12, sm: 4 }} key={link.href}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea href={link.href} sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ color: 'primary.main', mb: 1 }}>{link.icon}</Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{link.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{link.desc}</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button href="/books" variant="contained" startIcon={<BookmarkIcon />}>
          {t('dashboard.reserveBooks')}
        </Button>
      </Box>
    </Container>
  )
}
