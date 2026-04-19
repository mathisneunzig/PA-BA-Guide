'use client'

import { useState } from 'react'
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, LinearProgress, Stack, TextField, Typography,
} from '@mui/material'
import PrintIcon from '@mui/icons-material/Print'
import CheckIcon from '@mui/icons-material/Check'
import ErrorIcon from '@mui/icons-material/Error'

const STORAGE_KEY = 'printerName'

function getSavedPrinterName(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(STORAGE_KEY) ?? ''
}

interface PrintResult {
  barcode: string
  ok: boolean
  msg: string
}

interface Props {
  barcodes: string[]
  /** Titles for display — optional, keyed by barcode */
  titles?: Record<string, string>
  onClose: () => void
}

export default function PrintMultiLabels({ barcodes, titles = {}, onClose }: Props) {
  const [printerName, setPrinterName] = useState(getSavedPrinterName)
  const [printing, setPrinting] = useState(false)
  const [done, setDone] = useState(0)
  const [results, setResults] = useState<PrintResult[]>([])

  const savedName = getSavedPrinterName()

  async function handlePrint() {
    if (barcodes.length === 0) return
    setPrinting(true)
    setResults([])
    setDone(0)
    const name = printerName || 'default'

    for (const barcode of barcodes) {
      try {
        const res = await fetch(`/api/books/${barcode}/print`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ printerName: name }),
        })
        const data = await res.json()
        setResults((prev) => [
          ...prev,
          { barcode, ok: res.ok, msg: res.ok ? `OK: ${data.printer}` : (data.error ?? 'Fehler') },
        ])
      } catch {
        setResults((prev) => [...prev, { barcode, ok: false, msg: 'Verbindungsfehler' }])
      }
      setDone((n) => n + 1)
    }

    localStorage.setItem(STORAGE_KEY, printerName)
    setPrinting(false)
  }

  const progress = barcodes.length > 0 ? (done / barcodes.length) * 100 : 0
  const allDone = done === barcodes.length && done > 0
  const errors = results.filter((r) => !r.ok)

  return (
    <Dialog open onClose={printing ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Labels drucken ({barcodes.length} Bücher)</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Druckername (CUPS / Windows)"
            value={printerName}
            onChange={(e) => setPrinterName(e.target.value)}
            placeholder="default"
            size="small"
            helperText={
              savedName
                ? `Zuletzt genutzt: "${savedName}" — leer lassen für Standard`
                : 'Name des Druckers im OS, z.B. "EPSON_TM-T20" oder leer für Standard'
            }
            disabled={printing}
            fullWidth
          />

          {printing && (
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                {done} / {barcodes.length} gedruckt
              </Typography>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
          )}

          {allDone && (
            <Alert severity={errors.length === 0 ? 'success' : 'warning'}>
              {errors.length === 0
                ? `Alle ${barcodes.length} Labels erfolgreich gedruckt.`
                : `${barcodes.length - errors.length} erfolgreich, ${errors.length} Fehler.`}
            </Alert>
          )}

          {results.length > 0 && (
            <Stack spacing={0.5}>
              {results.map((r) => (
                <Box key={r.barcode} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {r.ok
                    ? <CheckIcon fontSize="small" color="success" />
                    : <ErrorIcon fontSize="small" color="error" />}
                  <Typography variant="caption" sx={{ flex: 1 }}>
                    {titles[r.barcode] ?? r.barcode}
                  </Typography>
                  {!r.ok && (
                    <Chip label={r.msg} size="small" color="error" variant="outlined" />
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={printing}>Schließen</Button>
        <Button
          variant="contained"
          onClick={handlePrint}
          disabled={printing || barcodes.length === 0}
          startIcon={printing ? <CircularProgress size={16} color="inherit" /> : <PrintIcon />}
        >
          {printing ? `Drucke ${done}/${barcodes.length}…` : 'Alle drucken'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
