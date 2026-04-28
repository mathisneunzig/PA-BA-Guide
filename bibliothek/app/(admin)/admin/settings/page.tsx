'use client'

import { useState, useEffect } from 'react'
import {
  Alert, Box, Button, Card, CardContent, CircularProgress,
  Container, Divider, TextField, Typography,
} from '@mui/material'
import TuneIcon from '@mui/icons-material/Tune'
import SaveIcon from '@mui/icons-material/Save'
import MailOutlineIcon from '@mui/icons-material/Mail'

export default function AdminSettingsPage() {
  const [testEmails, setTestEmails] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/config?key=broadcast_test_emails')
      .then((r) => r.json())
      .then((d) => setTestEmails(d.value ?? ''))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'broadcast_test_emails', value: testEmails.trim() }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Fehler'); return }
      setMessage('Einstellungen gespeichert.')
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <TuneIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Box>
          <Typography variant="h5">Systemeinstellungen</Typography>
          <Typography variant="body2" color="text.secondary">Konfiguration für Administratoren</Typography>
        </Box>
      </Box>

      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <CircularProgress />
      ) : (
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MailOutlineIcon color="action" />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Testgruppe für Rundmails</Typography>
            </Box>
            <Divider />
            <Typography variant="body2" color="text.secondary">
              Diese E-Mail-Adressen erhalten Testmails, wenn auf der Rundmail-Seite „Testmail senden" geklickt wird.
              Mehrere Adressen mit Komma trennen.
            </Typography>
            <TextField
              label="Testgruppe (kommagetrennte E-Mails)"
              value={testEmails}
              onChange={(e) => setTestEmails(e.target.value)}
              fullWidth
              multiline
              rows={3}
              size="small"
              placeholder="test@example.com, admin@example.com"
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                onClick={save}
                disabled={saving}
              >
                Speichern
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  )
}
