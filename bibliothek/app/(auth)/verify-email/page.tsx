import { Box, Button, Card, CardContent, Typography } from '@mui/material'
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead'
import Link from 'next/link'

export default function VerifyEmailPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <MarkEmailReadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>E-Mail bestätigen</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Wir haben einen Bestätigungslink an deine E-Mail-Adresse gesendet. Klicke auf den Link, um dein Konto zu aktivieren. Der Link läuft nach 24 Stunden ab.
          </Typography>
          <Button href="/login" variant="outlined" fullWidth>
            Zurück zur Anmeldung
          </Button>
        </CardContent>
      </Card>
    </Box>
  )
}
