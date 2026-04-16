import { Box, Container, Divider, Typography } from '@mui/material'
import Link from 'next/link'

export default function DatenschutzPage() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>Datenschutzerklärung</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 4 }}>
        Stand: April 2026
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

        {/* 1 */}
        <Box>
          <Typography variant="h6" gutterBottom>1. Verantwortlicher</Typography>
          <Typography variant="body2" color="text.secondary">
            Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
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
          <Typography variant="h6" gutterBottom>2. Allgemeines zur Datenverarbeitung</Typography>
          <Typography variant="body2" color="text.secondary">
            Dieses System ist ein internes Bibliotheksverwaltungssystem für Bildungseinrichtungen.
            Personenbezogene Daten werden nur erhoben und verarbeitet, soweit dies zur Bereitstellung
            der Funktionalität erforderlich ist. Die Verarbeitung erfolgt auf Grundlage der DSGVO.
          </Typography>
        </Box>

        <Divider />

        {/* 3 */}
        <Box>
          <Typography variant="h6" gutterBottom>3. Erhobene Daten bei Registrierung und Nutzung</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Bei der Registrierung und Nutzung des Systems werden folgende Daten verarbeitet:
          </Typography>
          <Box component="ul" sx={{ pl: 3, m: 0 }}>
            {[
              'Vorname und Nachname',
              'Benutzername',
              'E-Mail-Adresse',
              'Passwort (verschlüsselt gespeichert, nicht im Klartext)',
              'Rechnungs- und Lieferadresse (optional)',
              'Ausleihhistorie (ausgeliehene Bücher, Ausleihdaten, Rückgabedaten)',
            ].map((item) => (
              <Typography key={item} component="li" variant="body2" color="text.secondary">{item}</Typography>
            ))}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) sowie Art. 6 Abs. 1 lit. f DSGVO
            (berechtigtes Interesse am sicheren Betrieb des Systems).
          </Typography>
        </Box>

        <Divider />

        {/* 4 */}
        <Box>
          <Typography variant="h6" gutterBottom>4. E-Mail-Versand</Typography>
          <Typography variant="body2" color="text.secondary">
            Das System versendet transaktionale E-Mails (z. B. E-Mail-Verifikation, Passwort-Reset,
            Ausleihbestätigungen). Hierfür wird deine E-Mail-Adresse verwendet. Der E-Mail-Versand
            erfolgt über einen konfigurierbaren SMTP-Server. Es werden keine E-Mails zu Werbezwecken
            versendet.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.
          </Typography>
        </Box>

        <Divider />

        {/* 5 */}
        <Box>
          <Typography variant="h6" gutterBottom>5. Hosting durch Vercel</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Diese Anwendung wird auf der Plattform{' '}
            <strong>Vercel Inc., 340 Pine Street, Suite 701, San Francisco, CA 94104, USA</strong>{' '}
            gehostet. Vercel agiert dabei als Auftragsverarbeiter gemäß Art. 28 DSGVO.
          </Typography>

          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2, mb: 0.5 }}>
            Von Vercel automatisch verarbeitete Daten
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Beim Aufruf dieser Website verarbeitet Vercel im Rahmen des technischen Betriebs
            automatisch folgende Daten:
          </Typography>
          <Box component="ul" sx={{ pl: 3, m: 0 }}>
            {[
              'IP-Adresse des anfragenden Geräts (zur Geolokalisierung auf Stadt-/Länderebene)',
              'Aufgerufene URL, HTTP-Methode und HTTP-Statuscode',
              'Zeitstempel der Anfrage und Antwortzeiten',
              'Browser-Typ und Betriebssystem (User-Agent)',
              'Fehlermeldungen und Diagnosedaten',
            ].map((item) => (
              <Typography key={item} component="li" variant="body2" color="text.secondary">{item}</Typography>
            ))}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Diese Daten werden von Vercel für den technischen Betrieb, die Sicherheit und
            Stabilität des Hostingdienstes benötigt. Die Speicherdauer der Zugriffslogs ist
            abhängig vom gebuchten Vercel-Plan (Hobby: 1 Stunde, Pro: 1–30 Tage).
          </Typography>

          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2, mb: 0.5 }}>
            Datenübertragung in die USA
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Vercel ist ein US-amerikanisches Unternehmen. Die Serverinfrastruktur nutzt AWS,
            Microsoft Azure und Google Cloud Platform weltweit. Standardmäßig werden Serverless
            Functions in den USA betrieben; statische Inhalte werden über ein weltweites CDN
            mit Standorten auch in der EU ausgeliefert.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Für Datenübertragungen in die USA stützt sich Vercel auf:
          </Typography>
          <Box component="ul" sx={{ pl: 3, m: 0 }}>
            {[
              'EU-Standardvertragsklauseln (SCCs) nach Art. 46 Abs. 2 lit. c DSGVO',
              'EU-U.S. Data Privacy Framework (Vercel ist DPF-zertifiziert)',
            ].map((item) => (
              <Typography key={item} component="li" variant="body2" color="text.secondary">{item}</Typography>
            ))}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Rechtsgrundlage für die Verarbeitung durch Vercel: Art. 6 Abs. 1 lit. f DSGVO
            (berechtigtes Interesse am technischen Betrieb und der Sicherheit).
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Weitere Informationen:{' '}
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
          <Typography variant="h6" gutterBottom>6. Cookies und Sitzungsdaten</Typography>
          <Typography variant="body2" color="text.secondary">
            Das System verwendet ausschließlich technisch notwendige Cookies zur Verwaltung
            der Anmeldesitzung (Session-Token). Es werden keine Tracking- oder Analyse-Cookies
            eingesetzt. Keine Daten werden an Werbenetzwerke übermittelt.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.
          </Typography>
        </Box>

        <Divider />

        {/* 7 */}
        <Box>
          <Typography variant="h6" gutterBottom>7. Speicherdauer</Typography>
          <Typography variant="body2" color="text.secondary">
            Personenbezogene Daten werden nur so lange gespeichert, wie es für die Erfüllung
            der Zwecke erforderlich ist oder gesetzliche Aufbewahrungsfristen bestehen. Nach
            Austritt aus der Bildungseinrichtung oder auf Anfrage werden die Daten gelöscht.
          </Typography>
        </Box>

        <Divider />

        {/* 8 */}
        <Box>
          <Typography variant="h6" gutterBottom>8. Deine Rechte</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Du hast gegenüber dem Verantwortlichen folgende Rechte hinsichtlich deiner
            personenbezogenen Daten:
          </Typography>
          <Box component="ul" sx={{ pl: 3, m: 0 }}>
            {[
              'Recht auf Auskunft (Art. 15 DSGVO)',
              'Recht auf Berichtigung (Art. 16 DSGVO)',
              'Recht auf Löschung (Art. 17 DSGVO)',
              'Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)',
              'Recht auf Datenübertragbarkeit (Art. 20 DSGVO)',
              'Recht auf Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)',
            ].map((item) => (
              <Typography key={item} component="li" variant="body2" color="text.secondary">{item}</Typography>
            ))}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Du hast außerdem das Recht, dich bei der zuständigen Datenschutz-Aufsichtsbehörde
            zu beschweren. Die zuständige Behörde für Baden-Württemberg ist der{' '}
            <a href="https://www.baden-wuerttemberg.datenschutz.de" target="_blank" rel="noopener noreferrer"
               style={{ color: 'inherit' }}>
              Landesbeauftragter für Datenschutz und Informationsfreiheit Baden-Württemberg
            </a>.
          </Typography>
        </Box>

        <Divider />

        {/* 9 */}
        <Box>
          <Typography variant="h6" gutterBottom>9. Änderungen dieser Datenschutzerklärung</Typography>
          <Typography variant="body2" color="text.secondary">
            Diese Datenschutzerklärung kann bei Bedarf aktualisiert werden, um Änderungen am
            System oder an gesetzlichen Anforderungen Rechnung zu tragen. Die jeweils aktuelle
            Version ist auf dieser Seite abrufbar.
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
