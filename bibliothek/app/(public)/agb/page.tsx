import { Box, Container, Divider, Typography } from '@mui/material'
import Link from 'next/link'

export default function AgbPage() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Allgemeine Geschäftsbedingungen (AGB)
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 4 }}>
        Stand: April 2026
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>§ 1 Geltungsbereich</Typography>
          <Typography variant="body2" color="text.secondary">
            Diese Nutzungsbedingungen gelten für das interne Bibliotheksverwaltungssystem (nachfolgend
            „Bibliothek"), das ausschließlich Mitgliedern der Studierendengruppe zur Verfügung steht.
            Mit der Registrierung akzeptierst du diese AGB in der jeweils gültigen Fassung.
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>§ 2 Nutzerkonto</Typography>
          <Typography variant="body2" color="text.secondary">
            Jede natürliche Person darf nur ein Konto anlegen. Du bist verpflichtet, deine
            Zugangsdaten geheim zu halten und nicht an Dritte weiterzugeben. Eine Weitergabe des
            Kontos an andere Personen ist nicht gestattet. Das Konto wird erst nach Bestätigung
            der E-Mail-Adresse und Freischaltung durch einen Administrator aktiviert.
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>§ 3 Ausleihe und Reservierung</Typography>
          <Typography variant="body2" color="text.secondary">
            Bücher können über die Plattform reserviert und ausgeliehen werden. Die Ausleihdauer
            beträgt standardmäßig bis zu 13 Wochen und wird bei der Reservierung festgelegt. Bücher
            sind spätestens am Fälligkeitstag zurückzugeben. Bei Überschreitung des Rückgabedatums
            wird das Buch als überfällig markiert. Mehrfache Überschreitungen können zur Sperrung
            des Kontos führen.
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>§ 4 Sorgfaltspflicht</Typography>
          <Typography variant="body2" color="text.secondary">
            Ausgeliehene Bücher sind pfleglich zu behandeln und in dem Zustand zurückzugeben, in dem
            sie ausgeliehen wurden. Bei Verlust oder wesentlicher Beschädigung durch den Nutzer kann
            Ersatz in Höhe des Wiederbeschaffungswertes verlangt werden.
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>§ 5 E-Mail-Kommunikation</Typography>
          <Typography variant="body2" color="text.secondary">
            Transaktionale E-Mails (z.&nbsp;B. Reservierungsbestätigungen, Ausleihquittungen,
            Erinnerungen bei Überfälligkeit) werden unabhängig von deinen Präferenzen an die
            hinterlegte E-Mail-Adresse gesendet, da sie für die Nutzung des Dienstes notwendig sind.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Darüber hinaus können wir gelegentlich Informationen zu Neuigkeiten, Veranstaltungen,
            neuen Büchern und ähnlichen Themen versenden. Diese Marketing-E-Mails erhältst du nur,
            wenn du bei der Registrierung oder nachträglich in den Einstellungen ausdrücklich
            zugestimmt hast. Deine Einwilligung kannst du jederzeit in den Profileinstellungen
            widerrufen.
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>§ 6 Datenschutz</Typography>
          <Typography variant="body2" color="text.secondary">
            Die Verarbeitung personenbezogener Daten erfolgt gemäß der{' '}
            <Link href="/datenschutz" style={{ color: 'inherit' }}>Datenschutzerklärung</Link>.
            Mit der Registrierung stimmst du der dort beschriebenen Datenverarbeitung zu.
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>§ 7 Sperrung und Löschung</Typography>
          <Typography variant="body2" color="text.secondary">
            Administratoren sind berechtigt, Konten bei wiederholten Verstößen gegen diese AGB
            temporär zu sperren oder dauerhaft zu löschen. Alle offenen Ausleihen müssen vor einer
            Löschung abgeschlossen sein.
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>§ 8 Änderungen der AGB</Typography>
          <Typography variant="body2" color="text.secondary">
            Diese AGB können jederzeit angepasst werden. Über wesentliche Änderungen werden
            Nutzer per E-Mail informiert. Die weitere Nutzung der Plattform nach Inkrafttreten
            der geänderten AGB gilt als Zustimmung.
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>§ 9 Kontakt</Typography>
          <Typography variant="body2" color="text.secondary">
            Bei Fragen zu diesen AGB wende dich an:{' '}
            <Link href="/impressum" style={{ color: 'inherit' }}>Mathis Neunzig</Link>
            {' '}(info@neunziglabs.de).
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
