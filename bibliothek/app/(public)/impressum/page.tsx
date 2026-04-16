import { Box, Container, Divider, Typography } from '@mui/material'
import Link from 'next/link'

export default function ImpressumPage() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>Impressum</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 4 }}>
        Angaben gemäß § 5 TMG
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>Verantwortlich</Typography>
          <Typography variant="body2">Mathis Neunzig</Typography>
          <Typography variant="body2">Unter den Weiden 5</Typography>
          <Typography variant="body2">68199 Mannheim</Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>Kontakt</Typography>
          <Typography variant="body2" color="text.secondary">
            info@neunziglabs.de
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>Hinweis zur Verantwortlichkeit</Typography>
          <Typography variant="body2" color="text.secondary">
            Dieses System ist ein internes Bibliotheksverwaltungssystem und nicht öffentlich
            zugänglich. Es wird ausschließlich für den Einsatz an Bildungseinrichtungen
            bereitgestellt.
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>Haftung für Inhalte</Typography>
          <Typography variant="body2" color="text.secondary">
            Als Diensteanbieter bin ich gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen
            Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG bin ich
            als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
            Informationen zu überwachen oder nach Umständen zu forschen, die auf eine
            rechtswidrige Tätigkeit hinweisen.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Link href="/" style={{ fontSize: 14, textDecoration: 'none', color: 'inherit' }}>
          ← Zurück zur Startseite
        </Link>
      </Box>
    </Container>
  )
}
