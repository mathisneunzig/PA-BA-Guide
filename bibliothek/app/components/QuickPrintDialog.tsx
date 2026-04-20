'use client'

import { useState } from 'react'
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Stack, TextField, Typography,
} from '@mui/material'
import PrintIcon from '@mui/icons-material/Print'
import CheckIcon from '@mui/icons-material/Check'
import ErrorIcon from '@mui/icons-material/Error'

const STORAGE_KEY = 'printerName'

function getSaved(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(STORAGE_KEY) ?? ''
}

interface PrintResult {
  mode: 'label' | 'shelf'
  ok: boolean
  msg: string
}

interface Props {
  barcode: string
  /** One or both modes to print */
  modes?: ('label' | 'shelf')[]
  /** Kept for backwards-compat when only one mode is needed */
  mode?: 'label' | 'shelf'
  title?: string
  onClose: () => void
}

const MODE_LABELS: Record<string, string> = {
  label: 'Buchlabel',
  shelf: 'Schrankplatz',
}

export default function QuickPrintDialog({ barcode, modes, mode, title, onClose }: Props) {
  const activeModes: ('label' | 'shelf')[] = modes ?? (mode ? [mode] : ['label'])
  const [printerName, setPrinterName] = useState(getSaved)
  const [printing, setPrinting] = useState(false)
  const [results, setResults] = useState<PrintResult[]>([])

  async function handlePrint() {
    setPrinting(true)
    setResults([])
    const name = printerName || 'default'

    for (const m of activeModes) {
      try {
        const res = await fetch(`/api/books/${barcode}/print`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ printerName: name, mode: m }),
        })
        const data = await res.json()
        if (res.ok) {
          setResults((prev) => [...prev, { mode: m, ok: true, msg: `Gesendet an: ${data.printer}` }])
        } else {
          setResults((prev) => [...prev, { mode: m, ok: false, msg: data.error ?? 'Druckfehler' }])
        }
      } catch {
        setResults((prev) => [...prev, { mode: m, ok: false, msg: 'Verbindungsfehler' }])
      }
    }

    localStorage.setItem(STORAGE_KEY, name)
    setPrinting(false)
  }

  const saved = getSaved()
  const allDone = results.length === activeModes.length && results.length > 0
  const hasError = results.some((r) => !r.ok)

  const dialogTitle = activeModes.length > 1
    ? `Label & Schrankplatz drucken${title ? ` — ${title}` : ''}`
    : `${MODE_LABELS[activeModes[0]]} drucken${title ? ` — ${title}` : ''}`

  return (
    <Dialog open onClose={printing ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>{dialogTitle}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {activeModes.length > 1 && (
            <Typography variant="body2" color="text.secondary">
              Druckt nacheinander: {activeModes.map((m) => MODE_LABELS[m]).join(' + ')}.
            </Typography>
          )}
          <TextField
            label="Druckername (CUPS / Windows)"
            value={printerName}
            onChange={(e) => setPrinterName(e.target.value)}
            placeholder="default"
            size="small"
            helperText={saved ? `Zuletzt: "${saved}" — leer lassen für Standard` : 'z.B. "EPSON_TM-T20" oder leer für Standard'}
            disabled={printing}
            fullWidth
            autoFocus
          />

          {results.length > 0 && (
            <Stack spacing={0.5}>
              {results.map((r) => (
                <Box key={r.mode} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {r.ok
                    ? <CheckIcon fontSize="small" color="success" />
                    : <ErrorIcon fontSize="small" color="error" />}
                  <Typography variant="body2" sx={{ flex: 1 }}>{MODE_LABELS[r.mode]}</Typography>
                  <Typography variant="caption" color={r.ok ? 'text.secondary' : 'error'}>{r.msg}</Typography>
                </Box>
              ))}
            </Stack>
          )}

          {allDone && !hasError && (
            <Alert severity="success">Alle Druckjobs erfolgreich gesendet.</Alert>
          )}
          {allDone && hasError && (
            <Alert severity="warning">Mindestens ein Druckjob fehlgeschlagen.</Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={printing}>Schließen</Button>
        <Button
          variant="contained"
          onClick={handlePrint}
          disabled={printing || allDone}
          startIcon={printing ? <CircularProgress size={16} color="inherit" /> : <PrintIcon />}
        >
          {printing ? 'Drucke…' : allDone ? 'Gedruckt' : 'Drucken'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
