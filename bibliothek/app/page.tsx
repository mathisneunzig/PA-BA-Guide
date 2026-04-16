import { Box, Button, Container, Typography, Stack, Paper } from '@mui/material'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import SearchIcon from '@mui/icons-material/Search'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import LoginIcon from '@mui/icons-material/Login'
import Link from 'next/link'

export default function HomePage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1565c0 0%, #6a1b9a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper sx={{ p: { xs: 4, md: 6 }, textAlign: 'center', borderRadius: 3 }}>
          <MenuBookIcon sx={{ fontSize: 72, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            Willkommen in der Bibliothek
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Durchstöbere unseren Buchkatalog, reserviere Bücher und verwalte deine Ausleihen — alles an einem Ort.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'center' }}>
            <Link href="/books" style={{ textDecoration: 'none' }}>
              <Button variant="contained" size="large" startIcon={<SearchIcon />} fullWidth>
                Bücher durchsuchen
              </Button>
            </Link>
            <Link href="/register" style={{ textDecoration: 'none' }}>
              <Button variant="outlined" size="large" startIcon={<PersonAddIcon />} fullWidth>
                Konto erstellen
              </Button>
            </Link>
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <Button variant="text" size="large" startIcon={<LoginIcon />} fullWidth>
                Anmelden
              </Button>
            </Link>
          </Stack>
        </Paper>
      </Container>
    </Box>
  )
}
