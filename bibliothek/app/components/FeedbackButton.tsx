'use client'

import { useState } from 'react'
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Fab, FormControl, FormHelperText, InputLabel, MenuItem, Select,
  TextField, Tooltip, Typography, Alert, CircularProgress,
} from '@mui/material'
import BugReportIcon from '@mui/icons-material/BugReport'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'

const CATEGORIES = [
  { value: 'BUG', label: 'Fehler / Bug' },
  { value: 'IMPROVEMENT', label: 'Verbesserungsvorschlag' },
  { value: 'QUESTION', label: 'Frage' },
  { value: 'OTHER', label: 'Sonstiges' },
]

const SEVERITIES = [
  { value: 'LOW', label: 'Niedrig — kleinere Unannehmlichkeit' },
  { value: 'MEDIUM', label: 'Mittel — beeinträchtigt die Nutzung' },
  { value: 'HIGH', label: 'Hoch — App nicht nutzbar' },
]

export default function FeedbackButton() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const isLoggedIn = status === 'authenticated' && !!session?.user

  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('BUG')
  const [severity, setSeverity] = useState('MEDIUM')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleOpen() {
    setOpen(true)
    setSuccess(false)
    setError(null)
  }

  function handleClose() {
    if (submitting) return
    setOpen(false)
    // Reset after close animation
    setTimeout(() => {
      setDescription('')
      setCategory('BUG')
      setSeverity('MEDIUM')
      setSuccess(false)
      setError(null)
    }, 300)
  }

  async function handleSubmit() {
    if (!description.trim() || description.trim().length < 10) {
      setError('Bitte beschreibe das Problem genauer (min. 10 Zeichen).')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          category: isLoggedIn ? category : 'OTHER',
          severity: isLoggedIn ? severity : 'LOW',
          pageUrl: pathname,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? 'Unbekannter Fehler')
      }
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Senden')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Tooltip title="Feedback / Problem melden" placement="left" arrow>
        <Fab
          size="small"
          color="default"
          onClick={handleOpen}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1200,
            boxShadow: 3,
            bgcolor: 'background.paper',
            color: 'text.secondary',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <BugReportIcon fontSize="small" />
        </Fab>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          Problem melden
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
            {isLoggedIn
              ? 'Beschreibe das Problem so genau wie möglich.'
              : 'Du bist nicht angemeldet. Du kannst trotzdem eine kurze Rückmeldung hinterlassen.'}
          </Typography>
        </DialogTitle>

        <DialogContent>
          {success ? (
            <Box sx={{ py: 2 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                Danke für dein Feedback! Wir schauen uns das an.
              </Alert>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
              {error && <Alert severity="error">{error}</Alert>}

              {isLoggedIn && (
                <>
                  <FormControl fullWidth size="small">
                    <InputLabel>Kategorie</InputLabel>
                    <Select
                      value={category}
                      label="Kategorie"
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {CATEGORIES.map((c) => (
                        <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel>Schweregrad</InputLabel>
                    <Select
                      value={severity}
                      label="Schweregrad"
                      onChange={(e) => setSeverity(e.target.value)}
                    >
                      {SEVERITIES.map((s) => (
                        <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </>
              )}

              <FormControl fullWidth>
                <TextField
                  label="Was ist das Problem?"
                  multiline
                  minRows={isLoggedIn ? 4 : 5}
                  maxRows={10}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    isLoggedIn
                      ? 'z.B. „Beim Reservieren eines Buches erscheint ein Fehler, obwohl Exemplare verfügbar sind."'
                      : 'Beschreibe kurz, was nicht funktioniert oder was du dir wünschst …'
                  }
                  slotProps={{ htmlInput: { maxLength: 2000 } }}
                />
                <FormHelperText sx={{ textAlign: 'right' }}>
                  {description.length} / 2000
                </FormHelperText>
              </FormControl>

              {pathname && (
                <Typography variant="caption" color="text.disabled">
                  Seite: {pathname}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          {success ? (
            <Button onClick={handleClose} variant="contained">Schließen</Button>
          ) : (
            <>
              <Button onClick={handleClose} disabled={submitting} color="inherit">Abbrechen</Button>
              <Button
                onClick={handleSubmit}
                variant="contained"
                disabled={submitting || description.trim().length < 10}
                startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {submitting ? 'Wird gesendet …' : 'Senden'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  )
}
