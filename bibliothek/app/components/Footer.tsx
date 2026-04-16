import { Box, Container, Divider, Typography } from '@mui/material'
import Link from 'next/link'

export default function Footer() {
  return (
    <Box component="footer" sx={{ mt: 'auto', py: 3, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', mb: 1 }}>
          <Link href="/impressum" style={{ textDecoration: 'none', color: 'inherit', fontSize: 14 }}>
            Impressum
          </Link>
          <Divider orientation="vertical" flexItem />
          <Link href="/datenschutz" style={{ textDecoration: 'none', color: 'inherit', fontSize: 14 }}>
            Datenschutz
          </Link>
        </Box>
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center' }}>
          © {new Date().getFullYear()} Mathis Neunzig
        </Typography>
      </Container>
    </Box>
  )
}
