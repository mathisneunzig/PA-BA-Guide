import { getSessionUser } from '@/lib/auth/dal'
import {
  Alert, Box, Button, Card, CardContent, Chip, Container,
  Divider, Grid, Typography,
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import EditIcon from '@mui/icons-material/Edit'
import VerifiedIcon from '@mui/icons-material/Verified'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import Link from 'next/link'

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

export default async function ProfilePage() {
  const user = await getSessionUser()

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PersonIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          <Typography variant="h5">Mein Profil</Typography>
        </Box>
        <Button href="/settings" variant="outlined" startIcon={<EditIcon />}>
          Bearbeiten
        </Button>
      </Box>

      {!user?.email_verified && (
        <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 3 }}>
          Deine E-Mail-Adresse ist noch nicht verifiziert. Bitte überprüfe dein Postfach.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>Persönliche Informationen</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={1}>
                <Row label="Vorname" value={user?.firstname} />
                <Row label="Nachname" value={user?.lastname} />
                <Row label="Benutzername" value={user?.username} />
                <Row label="Telefon" value={user?.phone} />
                <Grid size={5}><Typography variant="body2" color="text.secondary">Rolle</Typography></Grid>
                <Grid size={7}>
                  <Chip label={user?.role} size="small" color={user?.role === 'ADMIN' ? 'secondary' : user?.role === 'STUDENT' ? 'primary' : 'default'} />
                </Grid>
                <Grid size={5}><Typography variant="body2" color="text.secondary">E-Mail</Typography></Grid>
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
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>Rechnungsadresse</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={1}>
                <Row label="Straße" value={user?.street ? `${user.street} ${user.housenr ?? ''}`.trim() : null} />
                <Row label="PLZ / Stadt" value={user?.zipcode ? `${user.zipcode} ${user.city ?? ''}`.trim() : null} />
                <Row label="Land" value={user?.country} />
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>Lieferadresse</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={1}>
                <Row label="Straße" value={user?.del_street ? `${user.del_street} ${user.del_housenr ?? ''}`.trim() : null} />
                <Row label="PLZ / Stadt" value={user?.del_zipcode ? `${user.del_zipcode} ${user.del_city ?? ''}`.trim() : null} />
                <Row label="Land" value={user?.del_country} />
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}
