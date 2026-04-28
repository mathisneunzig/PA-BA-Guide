import { Box, Button, Container, Typography, Stack, Divider } from '@mui/material'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import SearchIcon from '@mui/icons-material/Search'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import LoginIcon from '@mui/icons-material/Login'
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import Link from 'next/link'

const FEATURES = [
  {
    icon: <SearchIcon sx={{ fontSize: 32, color: 'primary.main' }} />,
    title: 'Bücher entdecken',
    text: 'Durchsuche den gesamten Bestand nach Titel, Autor oder Themengebiet.',
  },
  {
    icon: <BookmarkBorderIcon sx={{ fontSize: 32, color: 'primary.main' }} />,
    title: 'Reservieren',
    text: 'Lege Bücher in den Warenkorb und reserviere sie mit wenigen Klicks.',
  },
  {
    icon: <AssignmentTurnedInIcon sx={{ fontSize: 32, color: 'primary.main' }} />,
    title: 'Ausleihen verwalten',
    text: 'Behalte den Überblick über deine aktiven Ausleihen und Rückgabefristen.',
  },
  {
    icon: <PeopleAltIcon sx={{ fontSize: 32, color: 'primary.main' }} />,
    title: 'Gemeinschaft',
    text: 'Teil der internen Bibliothek – exklusiv für Mitglieder der Studierendengruppe.',
  },
]

export default function HomePage() {
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Hero */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          py: { xs: 8, md: 12 },
          px: 2,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <MenuBookIcon sx={{ fontSize: 64, mb: 2, opacity: 0.9 }} />
          <Typography variant="h3" component="h1" sx={{ fontWeight: 800, mb: 2, lineHeight: 1.2 }}>
            Die Bibliothek
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.85, mb: 4, fontWeight: 400, maxWidth: 560, mx: 'auto' }}>
            Durchstöbere unseren Buchkatalog, reserviere Bücher und verwalte deine Ausleihen — alles an einem Ort.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'center' }}>
            <Link href="/books" style={{ textDecoration: 'none' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<SearchIcon />}
                sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' }, fontWeight: 700, px: 4 }}
              >
                Bücher suchen
              </Button>
            </Link>
            <Link href="/register" style={{ textDecoration: 'none' }}>
              <Button
                variant="outlined"
                size="large"
                startIcon={<PersonAddIcon />}
                sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'white', bgcolor: 'primary.dark' }, fontWeight: 700, px: 4 }}
              >
                Konto erstellen
              </Button>
            </Link>
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <Button
                variant="text"
                size="large"
                startIcon={<LoginIcon />}
                sx={{ color: 'white', opacity: 0.85, '&:hover': { opacity: 1, bgcolor: 'primary.dark' }, px: 3 }}
              >
                Anmelden
              </Button>
            </Link>
          </Stack>
        </Container>
      </Box>

      {/* Features */}
      <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
        <Typography variant="h5" align="center" sx={{ fontWeight: 700, mb: 1 }}>
          Alles, was du brauchst
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 6 }}>
          Die Bibliothek macht das Ausleihen einfach und übersichtlich.
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 4,
          }}
        >
          {FEATURES.map((f) => (
            <Box key={f.title} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  bgcolor: (theme) => `${theme.palette.primary.main}18`,
                }}
              >
                {f.icon}
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>{f.title}</Typography>
                <Typography variant="body2" color="text.secondary">{f.text}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>

      {/* Footer CTA */}
      <Divider />
      <Box sx={{ bgcolor: 'background.paper', py: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Noch kein Konto?{' '}
          <Link href="/register" style={{ color: 'inherit', fontWeight: 600 }}>
            Jetzt registrieren
          </Link>
          {' '}·{' '}
          <Link href="/impressum" style={{ color: 'inherit' }}>Impressum</Link>
          {' '}·{' '}
          <Link href="/datenschutz" style={{ color: 'inherit' }}>Datenschutz</Link>
          {' '}·{' '}
          <Link href="/agb" style={{ color: 'inherit' }}>AGB</Link>
        </Typography>
      </Box>
    </Box>
  )
}
