'use client'

import { useTranslation } from 'react-i18next'
import { Box, Button, Card, CardContent, Typography } from '@mui/material'
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const { t } = useTranslation()
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <MarkEmailReadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>{t('auth.verifyTitle')}</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {t('auth.verifyText')}
          </Typography>
          <Button href="/login" variant="outlined" fullWidth>
            {t('auth.backToLogin')}
          </Button>
        </CardContent>
      </Card>
    </Box>
  )
}
