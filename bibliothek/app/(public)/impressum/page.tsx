'use client'

import { Box, Container, Divider, Typography } from '@mui/material'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

export default function ImpressumPage() {
  const { t } = useTranslation()
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>{t('impressum.title')}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 4 }}>
        {t('impressum.subtitle')}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>{t('impressum.responsible')}</Typography>
          <Typography variant="body2">Mathis Neunzig</Typography>
          <Typography variant="body2">Unter den Weiden 5</Typography>
          <Typography variant="body2">68199 Mannheim</Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>{t('impressum.contact')}</Typography>
          <Typography variant="body2" color="text.secondary">
            info@neunziglabs.de
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>{t('impressum.hinweis')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('impressum.hinweisText')}
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>{t('impressum.haftung')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('impressum.haftungText')}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Link href="/" style={{ fontSize: 14, textDecoration: 'none', color: 'inherit' }}>
          {t('impressum.back')}
        </Link>
      </Box>
    </Container>
  )
}
