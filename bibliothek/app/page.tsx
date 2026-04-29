'use client'

import { Box, Button, Container, Typography, Stack, Divider } from '@mui/material'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import SearchIcon from '@mui/icons-material/Search'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import LoginIcon from '@mui/icons-material/Login'
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

export default function HomePage() {
  const { t } = useTranslation()

  const FEATURES = [
    {
      icon: <SearchIcon sx={{ fontSize: 32, color: 'primary.main' }} />,
      title: t('home.feature1Title'),
      text: t('home.feature1Text'),
    },
    {
      icon: <BookmarkBorderIcon sx={{ fontSize: 32, color: 'primary.main' }} />,
      title: t('home.feature2Title'),
      text: t('home.feature2Text'),
    },
    {
      icon: <AssignmentTurnedInIcon sx={{ fontSize: 32, color: 'primary.main' }} />,
      title: t('home.feature3Title'),
      text: t('home.feature3Text'),
    },
    {
      icon: <PeopleAltIcon sx={{ fontSize: 32, color: 'primary.main' }} />,
      title: t('home.feature4Title'),
      text: t('home.feature4Text'),
    },
  ]

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
            {t('home.title')}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.85, mb: 4, fontWeight: 400, maxWidth: 560, mx: 'auto' }}>
            {t('home.subtitle')}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'center' }}>
            <Link href="/books" style={{ textDecoration: 'none' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<SearchIcon />}
                sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' }, fontWeight: 700, px: 4 }}
              >
                {t('home.searchBooks')}
              </Button>
            </Link>
            <Link href="/register" style={{ textDecoration: 'none' }}>
              <Button
                variant="outlined"
                size="large"
                startIcon={<PersonAddIcon />}
                sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'white', bgcolor: 'primary.dark' }, fontWeight: 700, px: 4 }}
              >
                {t('home.createAccount')}
              </Button>
            </Link>
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <Button
                variant="text"
                size="large"
                startIcon={<LoginIcon />}
                sx={{ color: 'white', opacity: 0.85, '&:hover': { opacity: 1, bgcolor: 'primary.dark' }, px: 3 }}
              >
                {t('home.login')}
              </Button>
            </Link>
          </Stack>
        </Container>
      </Box>

      {/* Features */}
      <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
        <Typography variant="h5" align="center" sx={{ fontWeight: 700, mb: 1 }}>
          {t('home.featuresTitle')}
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 6 }}>
          {t('home.featuresSubtitle')}
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
          {t('home.noAccount')}{' '}
          <Link href="/register" style={{ color: 'inherit', fontWeight: 600 }}>
            {t('home.registerNow')}
          </Link>
          {' '}·{' '}
          <Link href="/impressum" style={{ color: 'inherit' }}>{t('public.impressum')}</Link>
          {' '}·{' '}
          <Link href="/datenschutz" style={{ color: 'inherit' }}>{t('public.datenschutz')}</Link>
          {' '}·{' '}
          <Link href="/agb" style={{ color: 'inherit' }}>{t('public.agb')}</Link>
        </Typography>
      </Box>
    </Box>
  )
}
