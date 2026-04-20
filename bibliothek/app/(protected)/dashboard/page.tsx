import { getSessionUser } from '@/lib/auth/dal'
import { prisma } from '@/lib/prisma'
import {
  Alert, Box, Button, Card, CardActionArea, CardContent,
  Container, Chip, Grid, Typography,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PersonIcon from '@mui/icons-material/Person'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await getSessionUser()

  const [activeLoans, overdueLoans] = await Promise.all([
    prisma.loan.count({ where: { userId: user!.id, status: 'ACTIVE' } }),
    prisma.loan.count({ where: { userId: user!.id, status: 'OVERDUE' } }),
  ])

  const quickLinks = [
    { href: '/books', label: 'Bücherkatalog', icon: <MenuBookIcon />, desc: 'Verfügbare Bücher durchsuchen' },
    { href: '/my-loans', label: 'Meine Ausleihen', icon: <BookmarkIcon />, desc: 'Aktuelle und vergangene Ausleihen' },
    { href: '/profile', label: 'Mein Profil', icon: <PersonIcon />, desc: 'Persönliche Informationen verwalten' },
  ]

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <DashboardIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Typography variant="h5">Dashboard</Typography>
      </Box>

      {!user?.email_verified && (
        <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 3 }}>
          Deine E-Mail-Adresse ist noch nicht verifiziert. Bitte überprüfe dein Postfach.
        </Alert>
      )}

      {overdueLoans > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Du hast {overdueLoans} überfällige Ausleihe{overdueLoans > 1 ? 'n' : ''}. Bitte gib die Bücher zurück.
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6">
                Willkommen, {user?.firstname ?? user?.username}!
              </Typography>
              <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
            </Box>
            <Chip
              label={user?.role}
              color={user?.role === 'ADMIN' ? 'secondary' : user?.role === 'STUDENT' ? 'primary' : 'default'}
              size="small"
            />
          </Box>

          {(activeLoans > 0 || overdueLoans > 0) && (
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              {activeLoans > 0 && (
                <Chip label={`${activeLoans} aktiv`} color="success" size="small" variant="outlined" />
              )}
              {overdueLoans > 0 && (
                <Chip label={`${overdueLoans} überfällig`} color="error" size="small" variant="outlined" />
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
          Bücher reservieren
        </Button>
      </Box>
    </Container>
  )
}
