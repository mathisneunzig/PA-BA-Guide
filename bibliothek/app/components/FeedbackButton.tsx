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
import { useTranslation } from 'react-i18next'

export default function FeedbackButton() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const { t } = useTranslation()
  const isLoggedIn = status === 'authenticated' && !!session?.user

  const CATEGORIES = [
    { value: 'BUG', label: t('feedback.categoryBug') },
    { value: 'IMPROVEMENT', label: t('feedback.categoryImprovement') },
    { value: 'QUESTION', label: t('feedback.categoryQuestion') },
    { value: 'OTHER', label: t('feedback.categoryOther') },
  ]

  const SEVERITIES = [
    { value: 'LOW', label: t('feedback.severityLow') },
    { value: 'MEDIUM', label: t('feedback.severityMedium') },
    { value: 'HIGH', label: t('feedback.severityHigh') },
  ]

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
      setError(t('feedback.tooShort'))
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
        throw new Error(data?.error ?? t('feedback.unknownError'))
      }
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('feedback.sendError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Tooltip title={t('feedback.tooltip')} placement="left" arrow>
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
          {t('feedback.title')}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
            {isLoggedIn ? t('feedback.describeProblem') : t('feedback.describeNotLoggedIn')}
          </Typography>
        </DialogTitle>

        <DialogContent>
          {success ? (
            <Box sx={{ py: 2 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                {t('feedback.success')}
              </Alert>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
              {error && <Alert severity="error">{error}</Alert>}

              {isLoggedIn && (
                <>
                  <FormControl fullWidth size="small">
                    <InputLabel>{t('feedback.categoryLabel')}</InputLabel>
                    <Select
                      value={category}
                      label={t('feedback.categoryLabel')}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {CATEGORIES.map((c) => (
                        <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel>{t('feedback.severityLabel')}</InputLabel>
                    <Select
                      value={severity}
                      label={t('feedback.severityLabel')}
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
                  label={t('feedback.describeLabel')}
                  multiline
                  minRows={isLoggedIn ? 4 : 5}
                  maxRows={10}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={isLoggedIn ? t('feedback.placeholder1') : t('feedback.placeholder2')}
                  slotProps={{ htmlInput: { maxLength: 2000 } }}
                />
                <FormHelperText sx={{ textAlign: 'right' }}>
                  {description.length} / 2000
                </FormHelperText>
              </FormControl>

              {pathname && (
                <Typography variant="caption" color="text.disabled">
                  {t('feedback.page', { path: pathname })}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          {success ? (
            <Button onClick={handleClose} variant="contained">{t('common.close')}</Button>
          ) : (
            <>
              <Button onClick={handleClose} disabled={submitting} color="inherit">{t('common.cancel')}</Button>
              <Button
                onClick={handleSubmit}
                variant="contained"
                disabled={submitting || description.trim().length < 10}
                startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {submitting ? t('common.sending') : t('common.send')}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  )
}
