'use client'

import { Box, Container, Divider, Typography } from '@mui/material'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

export default function AgbPage() {
  const { t } = useTranslation()
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        {t('agb.title')}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 4 }}>
        {t('agb.subtitle')}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>{t('agb.s1title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('agb.s1text')}
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>{t('agb.s2title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('agb.s2text')}
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>{t('agb.s3title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('agb.s3text')}
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>{t('agb.s4title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('agb.s4text')}
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>{t('agb.s5title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('agb.s5text')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('agb.s5marketing')}
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>{t('agb.s6title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('agb.s6text')}{' '}
            <Link href="/datenschutz" style={{ color: 'inherit' }}>{t('agb.s6link')}</Link>
            {t('agb.s6suffix')}
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>{t('agb.s7title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('agb.s7text')}
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>{t('agb.s8title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('agb.s8text')}
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>{t('agb.s9title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('agb.s9text')}{' '}
            <Link href="/impressum" style={{ color: 'inherit' }}>Mathis Neunzig</Link>
            {' '}(info@neunziglabs.de).
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Link href="/" style={{ fontSize: 14, textDecoration: 'none', color: 'inherit' }}>
          {t('agb.back')}
        </Link>
      </Box>
    </Container>
  )
}
