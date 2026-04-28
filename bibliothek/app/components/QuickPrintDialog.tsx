'use client'

import { useState } from 'react'
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Stack, TextField, Typography,
} from '@mui/material'
import PrintIcon from '@mui/icons-material/Print'
import CheckIcon from '@mui/icons-material/Check'
import ErrorIcon from '@mui/icons-material/Error'
import { useTranslation } from 'react-i18next'

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

export default function QuickPrintDialog({ barcode, modes, mode, title, onClose }: Props) {
  const { t } = useTranslation()
  const activeModes: ('label' | 'shelf')[] = modes ?? (mode ? [mode] : ['label'])
  const [printerName, setPrinterName] = useState(getSaved)
  const [printing, setPrinting] = useState(false)
  const [results, setResults] = useState<PrintResult[]>([])

  const MODE_LABELS: Record<string, string> = {
    label: t('print.label'),
    shelf: t('print.shelf'),
  }

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
          setResults((prev) => [...prev, { mode: m, ok: true, msg: t('print.sentTo', { printer: data.printer }) }])
        } else {
          setResults((prev) => [...prev, { mode: m, ok: false, msg: data.error ?? t('print.printError') }])
        }
      } catch {
        setResults((prev) => [...prev, { mode: m, ok: false, msg: t('print.networkError') }])
      }
    }

    localStorage.setItem(STORAGE_KEY, name)
    setPrinting(false)
  }

  const saved = getSaved()
  const allDone = results.length === activeModes.length && results.length > 0
  const hasError = results.some((r) => !r.ok)

  const dialogTitle = activeModes.length > 1
    ? `${t('print.title')}${title ? ` — ${title}` : ''}`
    : `${MODE_LABELS[activeModes[0]]} ${t('print.print').toLowerCase()}${title ? ` — ${title}` : ''}`

  return (
    <Dialog open onClose={printing ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>{dialogTitle}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {activeModes.length > 1 && (
            <Typography variant="body2" color="text.secondary">
              {t('print.sequence', { modes: activeModes.map((m) => MODE_LABELS[m]).join(' + ') })}
            </Typography>
          )}
          <TextField
            label={t('print.printerLabel')}
            value={printerName}
            onChange={(e) => setPrinterName(e.target.value)}
            placeholder="default"
            size="small"
            helperText={saved ? t('print.printerLastUsed', { name: saved }) : t('print.printerHint')}
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
            <Alert severity="success">{t('print.allDone')}</Alert>
          )}
          {allDone && hasError && (
            <Alert severity="warning">{t('print.someError')}</Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={printing}>{t('common.close')}</Button>
        <Button
          variant="contained"
          onClick={handlePrint}
          disabled={printing || allDone}
          startIcon={printing ? <CircularProgress size={16} color="inherit" /> : <PrintIcon />}
        >
          {printing ? t('print.printing') : allDone ? t('print.printed') : t('print.print')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
