'use client'

import { useState } from 'react'
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, TextField, Tooltip,
} from '@mui/material'
import PrintIcon from '@mui/icons-material/Print'
import LabelIcon from '@mui/icons-material/Label'

const STORAGE_KEY = 'printerName'

function getSavedPrinterName(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(STORAGE_KEY) ?? ''
}

interface Props {
  barcode: string
}

export default function PrintLabelButtons({ barcode }: Props) {
  const [open, setOpen] = useState(false)
  const [printerName, setPrinterName] = useState(getSavedPrinterName)
  const [printing, setPrinting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  async function handlePrint() {
    setPrinting(true)
    setResult(null)
    const name = printerName || 'default'
    try {
      const res = await fetch(`/api/books/${barcode}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ printerName: name }),
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem(STORAGE_KEY, printerName)
        setResult({ ok: true, msg: `Gesendet an Drucker: ${data.printer}` })
      } else {
        setResult({ ok: false, msg: data.error ?? 'Druckfehler' })
      }
    } catch {
      setResult({ ok: false, msg: 'Verbindungsfehler' })
    } finally {
      setPrinting(false)
    }
  }

  const savedName = getSavedPrinterName()

  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      <Tooltip title="Barcode als PNG anzeigen">
        <Button
          size="small"
          variant="outlined"
          startIcon={<LabelIcon />}
          href={`/api/books/${barcode}/label?format=png`}
          target="_blank"
        >
          Label (PNG)
        </Button>
      </Tooltip>

      <Tooltip title="Direkt an USB-Drucker senden (ESC/POS)">
        <Button
          size="small"
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={() => { setOpen(true); setResult(null) }}
        >
          USB-Druck
        </Button>
      </Tooltip>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Direkt drucken (ESC/POS)</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
              fullWidth
            />
            {result && (
              <Alert severity={result.ok ? 'success' : 'error'}>{result.msg}</Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Schließen</Button>
          <Button
            variant="contained"
            onClick={handlePrint}
            disabled={printing}
            startIcon={printing ? <CircularProgress size={16} color="inherit" /> : <PrintIcon />}
          >
            {printing ? 'Drucke…' : 'Drucken'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
