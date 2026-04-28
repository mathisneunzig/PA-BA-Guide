'use client'

import { Box, Container, Divider, Typography } from '@mui/material'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

export default function DatenschutzPage() {
  const { t } = useTranslation()
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>{t('datenschutz.title')}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 4 }}>
        {t('datenschutz.subtitle')}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

        {/* 1 */}
        <Box>
          <Typography variant="h6" gutterBottom>{t('datenschutz.s1title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('datenschutz.s1text')}
          </Typography>
          <Box sx={{ mt: 1, pl: 2, borderLeft: '3px solid', borderColor: 'divider' }}>
            <Typography variant="body2">Mathis Neunzig</Typography>
            <Typography variant="body2">Unter den Weiden 5</Typography>
            <Typography variant="body2">68199 Mannheim</Typography>
          </Box>
        </Box>

        <Divider />

        {/* 2 */}
        <Box>
          <Typography variant="h6" gutterBottom>{t('datenschutz.s2title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('datenschutz.s2text')}
          </Typography>
        </Box>

        <Divider />

        {/* 3 */}
        <Box>
          <Typography variant="h6" gutterBottom>{t('datenschutz.s3title')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {t('datenschutz.s3intro')}
          </Typography>
          <Box component="ul" sx={{ pl: 3, m: 0 }}>
            {(['s3item1', 's3item2', 's3item3', 's3item4', 's3item5', 's3item6'] as const).map((key) => (
              <Typography key={key} component="li" variant="body2" color="text.secondary">
                {t(`datenschutz.${key}`)}
              </Typography>
            ))}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('datenschutz.s3legal')}
          </Typography>
        </Box>

        <Divider />

        {/* 4 */}
        <Box>
          <Typography variant="h6" gutterBottom>{t('datenschutz.s4title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('datenschutz.s4text')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('datenschutz.s4legal')}
          </Typography>
        </Box>

        <Divider />

        {/* 5 */}
        <Box>
          <Typography variant="h6" gutterBottom>{t('datenschutz.s5title')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {t('datenschutz.s5intro')}
          </Typography>

          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2, mb: 0.5 }}>
            {t('datenschutz.s5autoTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {t('datenschutz.s5autoIntro')}
          </Typography>
          <Box component="ul" sx={{ pl: 3, m: 0 }}>
            {(['s5item1', 's5item2', 's5item3', 's5item4', 's5item5'] as const).map((key) => (
              <Typography key={key} component="li" variant="body2" color="text.secondary">
                {t(`datenschutz.${key}`)}
              </Typography>
            ))}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('datenschutz.s5autoNote')}
          </Typography>

          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2, mb: 0.5 }}>
            {t('datenschutz.s5usTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('datenschutz.s5usText')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('datenschutz.s5usLegalIntro')}
          </Typography>
          <Box component="ul" sx={{ pl: 3, m: 0 }}>
            {(['s5usItem1', 's5usItem2'] as const).map((key) => (
              <Typography key={key} component="li" variant="body2" color="text.secondary">
                {t(`datenschutz.${key}`)}
              </Typography>
            ))}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('datenschutz.s5legal')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('datenschutz.s5more')}{' '}
            <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer"
               style={{ color: 'inherit' }}>
              Vercel Privacy Policy
            </a>
            {' '}|{' '}
            <a href="https://vercel.com/legal/dpa" target="_blank" rel="noopener noreferrer"
               style={{ color: 'inherit' }}>
              Vercel DPA
            </a>
          </Typography>
        </Box>

        <Divider />

        {/* 6 */}
        <Box>
          <Typography variant="h6" gutterBottom>{t('datenschutz.s6title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('datenschutz.s6text')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('datenschutz.s6legal')}
          </Typography>
        </Box>

        <Divider />

        {/* 7 */}
        <Box>
          <Typography variant="h6" gutterBottom>{t('datenschutz.s7title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('datenschutz.s7text')}
          </Typography>
        </Box>

        <Divider />

        {/* 8 */}
        <Box>
          <Typography variant="h6" gutterBottom>{t('datenschutz.s8title')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {t('datenschutz.s8intro')}
          </Typography>
          <Box component="ul" sx={{ pl: 3, m: 0 }}>
            {(['s8item1', 's8item2', 's8item3', 's8item4', 's8item5', 's8item6'] as const).map((key) => (
              <Typography key={key} component="li" variant="body2" color="text.secondary">
                {t(`datenschutz.${key}`)}
              </Typography>
            ))}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('datenschutz.s8complaint')}{' '}
            <a href="https://www.baden-wuerttemberg.datenschutz.de" target="_blank" rel="noopener noreferrer"
               style={{ color: 'inherit' }}>
              {t('datenschutz.s8authorityName')}
            </a>.
          </Typography>
        </Box>

        <Divider />

        {/* 9 */}
        <Box>
          <Typography variant="h6" gutterBottom>{t('datenschutz.s9title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('datenschutz.s9text')}
          </Typography>
        </Box>

      </Box>

      <Box sx={{ mt: 4 }}>
        <Link href="/" style={{ fontSize: 14, textDecoration: 'none', color: 'inherit' }}>
          {t('datenschutz.back')}
        </Link>
      </Box>
    </Container>
  )
}
