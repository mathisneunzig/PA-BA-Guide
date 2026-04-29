'use client'

import { Box, Container, Divider, Typography } from '@mui/material'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()
  return (
    <Box component="footer" sx={{ mt: 'auto', py: 3, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', mb: 1 }}>
          <Link href="/impressum" style={{ textDecoration: 'none', color: 'inherit', fontSize: 14 }}>
            {t('public.impressum')}
          </Link>
          <Divider orientation="vertical" flexItem />
          <Link href="/datenschutz" style={{ textDecoration: 'none', color: 'inherit', fontSize: 14 }}>
            {t('public.datenschutz')}
          </Link>
          <Divider orientation="vertical" flexItem />
          <Link href="/agb" style={{ textDecoration: 'none', color: 'inherit', fontSize: 14 }}>
            {t('public.agb')}
          </Link>
        </Box>
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center' }}>
          {t('public.footer', { year: new Date().getFullYear() })}
        </Typography>
      </Container>
    </Box>
  )
}
