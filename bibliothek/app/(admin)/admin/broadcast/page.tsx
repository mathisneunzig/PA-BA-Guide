'use client'

import { useState } from 'react'
import {
  Alert, Box, Button, Card, CardActionArea, CardContent, CircularProgress,
  Container, Divider, LinearProgress, TextField, Tooltip, Typography,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import NewspaperIcon from '@mui/icons-material/Newspaper'
import BuildIcon from '@mui/icons-material/Build'
import CelebrationIcon from '@mui/icons-material/Celebration'
import AnnouncementIcon from '@mui/icons-material/Announcement'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'

type TemplateId = 'broadcast-news' | 'broadcast-maintenance' | 'broadcast-event' | 'broadcast-general'

interface Template {
  id: TemplateId
  label: string
  description: string
  color: string
  bgColor: string
  icon: React.ReactNode
  eyebrow: string
  showTime: boolean
}

const TEMPLATES: Template[] = [
  {
    id: 'broadcast-news',
    label: 'Neuigkeiten',
    description: 'Allgemeine Neuigkeiten und Ankündigungen',
    color: '#1565c0',
    bgColor: '#e3f2fd',
    icon: <NewspaperIcon />,
    eyebrow: '📰 Neuigkeiten',
    showTime: true,
  },
  {
    id: 'broadcast-maintenance',
    label: 'Wartung',
    description: 'Hinweise auf geplante Wartungsarbeiten oder Ausfälle',
    color: '#e65100',
    bgColor: '#fff3e0',
    icon: <BuildIcon />,
    eyebrow: '🔧 Wartungshinweis',
    showTime: true,
  },
  {
    id: 'broadcast-event',
    label: 'Veranstaltung',
    description: 'Einladung zu einem Event oder einer Veranstaltung',
    color: '#2e7d32',
    bgColor: '#e8f5e9',
    icon: <CelebrationIcon />,
    eyebrow: '🎉 Veranstaltung',
    showTime: true,
  },
  {
    id: 'broadcast-general',
    label: 'Mitteilung',
    description: 'Allgemeine Mitteilung ohne spezifische Kategorie',
    color: '#4a148c',
    bgColor: '#f3e5f5',
    icon: <AnnouncementIcon />,
    eyebrow: '📢 Mitteilung',
    showTime: true,
  },
]

export default function BroadcastPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('broadcast-news')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [timeFrom, setTimeFrom] = useState('')
  const [timeTo, setTimeTo] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number; failed: number; errors: string[] } | null>(null)
  const [error, setError] = useState('')

  const tpl = TEMPLATES.find((t) => t.id === selectedTemplate)!

  async function handleSend() {
    if (!subject.trim()) { setError('Bitte einen Betreff eingeben.'); return }
    if (!message.trim()) { setError('Bitte eine Nachricht eingeben.'); return }
    setError('')
    setSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          template: selectedTemplate,
          timeFrom: timeFrom.trim() || undefined,
          timeTo: timeTo.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Fehler beim Senden'); return }
      setResult(data)
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setSending(false)
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <SendIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Box>
          <Typography variant="h5">Rundmail</Typography>
          <Typography variant="body2" color="text.secondary">
            Nachricht an alle Nutzer senden
          </Typography>
        </Box>
      </Box>

      {/* Template picker */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        Vorlage wählen
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 1.5, mb: 3 }}>
        {TEMPLATES.map((t) => (
          <Card
            key={t.id}
            variant={selectedTemplate === t.id ? 'elevation' : 'outlined'}
            sx={{
              border: selectedTemplate === t.id ? `2px solid ${t.color}` : '1px solid',
              borderColor: selectedTemplate === t.id ? t.color : 'divider',
              transition: 'border-color 0.15s',
            }}
          >
            <CardActionArea onClick={() => setSelectedTemplate(t.id)} sx={{ p: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 40, height: 40, borderRadius: 1.5, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', bgcolor: t.bgColor, color: t.color, flexShrink: 0,
                  }}
                >
                  {t.icon}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                    {t.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                    {t.description}
                  </Typography>
                </Box>
              </Box>
            </CardActionArea>
          </Card>
        ))}
      </Box>

      {/* Email preview header */}
      <Box
        sx={{
          borderRadius: 1.5, overflow: 'hidden', mb: 3, border: '1px solid', borderColor: 'divider',
        }}
      >
        <Box sx={{ bgcolor: tpl.color, color: '#fff', px: 3, py: 2 }}>
          <Typography variant="caption" sx={{ opacity: 0.85, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>
            {tpl.eyebrow}
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 0.5 }}>
            {subject || 'Betreff der E-Mail'}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.75 }}>📚 Bibliothek</Typography>
        </Box>
        <Box sx={{ bgcolor: 'background.paper', px: 3, py: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {message ? (message.length > 140 ? message.slice(0, 140) + '…' : message) : 'Nachrichteninhalt erscheint hier…'}
          </Typography>
          {(timeFrom || timeTo) && (
            <Box sx={{ mt: 1, display: 'inline-block', bgcolor: tpl.bgColor, borderRadius: 1, px: 1.5, py: 0.5 }}>
              <Typography variant="caption" sx={{ color: tpl.color, fontWeight: 600 }}>
                🕐 {timeFrom}{timeFrom && timeTo ? ' – ' : ''}{timeTo}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Form */}
      <Card>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>E-Mail verfassen</Typography>
          <Divider />

          <TextField
            label="Betreff"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            fullWidth
            size="small"
            placeholder="z.B. Geplante Wartungsarbeiten am 20. April"
          />

          <TextField
            label="Nachricht"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            fullWidth
            multiline
            rows={5}
            size="small"
            placeholder="Schreibe hier deine Nachricht…"
          />

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Zeitangabe (optional)
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Tooltip title="Startzeitpunkt oder einzelner Zeitpunkt">
                <TextField
                  label="Von / Ab"
                  value={timeFrom}
                  onChange={(e) => setTimeFrom(e.target.value)}
                  size="small"
                  placeholder="z.B. 20. April 2026, 10:00 Uhr"
                  sx={{ flex: 1, minWidth: 200 }}
                />
              </Tooltip>
              <Tooltip title="Endzeitpunkt (leer lassen für Einzelzeitpunkt)">
                <TextField
                  label="Bis"
                  value={timeTo}
                  onChange={(e) => setTimeTo(e.target.value)}
                  size="small"
                  placeholder="z.B. 20. April 2026, 18:00 Uhr"
                  sx={{ flex: 1, minWidth: 200 }}
                />
              </Tooltip>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Freitext – wird genau so in der E-Mail angezeigt
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      {result && (
        <Alert
          severity={result.failed === 0 ? 'success' : result.sent === 0 ? 'error' : 'warning'}
          icon={result.failed === 0 ? <CheckCircleIcon /> : <ErrorIcon />}
          sx={{ mt: 2 }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {result.sent} E-Mail{result.sent !== 1 ? 's' : ''} erfolgreich gesendet
            {result.failed > 0 && `, ${result.failed} fehlgeschlagen`}
          </Typography>
          {result.errors.length > 0 && (
            <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2 }}>
              {result.errors.map((e, i) => (
                <li key={i}><Typography variant="caption">{e}</Typography></li>
              ))}
            </Box>
          )}
        </Alert>
      )}

      {sending && <LinearProgress sx={{ mt: 2 }} />}

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={sending ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
          onClick={handleSend}
          disabled={sending || !subject.trim() || !message.trim()}
        >
          {sending ? 'Sende…' : 'Rundmail senden'}
        </Button>
      </Box>
    </Container>
  )
}
