'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert, Box, Chip, CircularProgress, Container, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, IconButton, InputLabel,
  MenuItem, Select, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Tooltip, Typography, Button,
} from '@mui/material'
import FeedbackIcon from '@mui/icons-material/Feedback'
import DeleteIcon from '@mui/icons-material/Delete'
import EditNoteIcon from '@mui/icons-material/EditNote'

type FeedbackStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
type FeedbackCategory = 'BUG' | 'IMPROVEMENT' | 'QUESTION' | 'OTHER'
type FeedbackSeverity = 'LOW' | 'MEDIUM' | 'HIGH'

interface FeedbackUser {
  id: string
  username: string
  firstname: string | null
  lastname: string | null
  email: string
}

interface FeedbackItem {
  id: string
  category: FeedbackCategory
  severity: FeedbackSeverity
  description: string
  pageUrl: string | null
  status: FeedbackStatus
  adminNote: string | null
  createdAt: string
  user: FeedbackUser | null
}

const CATEGORY_COLORS: Record<FeedbackCategory, 'error' | 'info' | 'warning' | 'default'> = {
  BUG: 'error',
  IMPROVEMENT: 'info',
  QUESTION: 'warning',
  OTHER: 'default',
}

const SEVERITY_COLORS: Record<FeedbackSeverity, 'success' | 'warning' | 'error'> = {
  LOW: 'success',
  MEDIUM: 'warning',
  HIGH: 'error',
}

const STATUS_COLORS: Record<FeedbackStatus, 'default' | 'primary' | 'success' | 'error'> = {
  OPEN: 'error',
  IN_PROGRESS: 'primary',
  RESOLVED: 'success',
  CLOSED: 'default',
}

export default function AdminFeedbackPage() {
  const { t } = useTranslation()
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('')

  // Detail dialog
  const [selected, setSelected] = useState<FeedbackItem | null>(null)
  const [editStatus, setEditStatus] = useState<FeedbackStatus>('OPEN')
  const [editNote, setEditNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
    BUG: t('admin.feedback.categoryBug'),
    IMPROVEMENT: t('admin.feedback.categoryImprovement'),
    QUESTION: t('admin.feedback.categoryQuestion'),
    OTHER: t('admin.feedback.categoryOther'),
  }

  const SEVERITY_LABELS: Record<FeedbackSeverity, string> = {
    LOW: t('admin.feedback.severityLow'),
    MEDIUM: t('admin.feedback.severityMedium'),
    HIGH: t('admin.feedback.severityHigh'),
  }

  const STATUS_LABELS: Record<FeedbackStatus, string> = {
    OPEN: t('admin.feedback.statusOpen'),
    IN_PROGRESS: t('admin.feedback.statusInProgress'),
    RESOLVED: t('admin.feedback.statusResolved'),
    CLOSED: t('admin.feedback.statusClosed'),
  }

  const loadData = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    fetch(`/api/admin/feedback?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items ?? [])
        setTotal(d.total ?? 0)
      })
      .finally(() => setLoading(false))
  }, [filterStatus])

  useEffect(() => { loadData() }, [loadData])

  function openDetail(item: FeedbackItem) {
    setSelected(item)
    setEditStatus(item.status)
    setEditNote(item.adminNote ?? '')
    setSaveError(null)
  }

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch(`/api/admin/feedback/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: editStatus, adminNote: editNote || undefined }),
      })
      if (!res.ok) throw new Error(t('admin.feedback.saveError'))
      setItems((prev) => prev.map((i) => i.id === selected.id ? { ...i, status: editStatus, adminNote: editNote } : i))
      setSelected(null)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('admin.feedback.deleteConfirm'))) return
    await fetch(`/api/admin/feedback/${id}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((i) => i.id !== id))
    setTotal((tot) => tot - 1)
    if (selected?.id === id) setSelected(null)
  }

  const openCount = items.filter((i) => i.status === 'OPEN').length

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <FeedbackIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5">{t('admin.feedback.title')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {t('admin.feedback.total', { count: total })}
            {openCount > 0 && <Chip label={t('admin.feedback.open', { count: openCount })} color="error" size="small" />}
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>{t('common.status')}</InputLabel>
          <Select
            value={filterStatus}
            label={t('common.status')}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <MenuItem value="">{t('admin.feedback.statusAll')}</MenuItem>
            <MenuItem value="OPEN">{t('admin.feedback.statusOpen')}</MenuItem>
            <MenuItem value="IN_PROGRESS">{t('admin.feedback.statusInProgress')}</MenuItem>
            <MenuItem value="RESOLVED">{t('admin.feedback.statusResolved')}</MenuItem>
            <MenuItem value="CLOSED">{t('admin.feedback.statusClosed')}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ overflowX: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 600 } }}>
                <TableCell>{t('admin.feedback.colCategory')}</TableCell>
                <TableCell>{t('admin.feedback.colSeverity')}</TableCell>
                <TableCell>{t('admin.feedback.colDescription')}</TableCell>
                <TableCell>{t('admin.feedback.colUser')}</TableCell>
                <TableCell>{t('admin.feedback.colPage')}</TableCell>
                <TableCell>{t('common.status')}</TableCell>
                <TableCell>{t('admin.feedback.colDate')}</TableCell>
                <TableCell align="right">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Chip
                      label={CATEGORY_LABELS[item.category]}
                      color={CATEGORY_COLORS[item.category]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={SEVERITY_LABELS[item.severity]}
                      color={SEVERITY_COLORS[item.severity]}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 300 }}>
                    <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {item.user ? (
                      <Box>
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      {[item.user.firstname, item.user.lastname].filter(Boolean).join(' ') || item.user.username}
                    </Typography>
                        <Typography variant="caption" color="text.secondary">{item.user.email}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.disabled">{t('admin.feedback.guest')}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.pageUrl ? (
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                        {item.pageUrl}
                      </Typography>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={STATUS_LABELS[item.status]}
                      color={STATUS_COLORS[item.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title={t('admin.feedback.editTooltip')}>
                      <IconButton size="small" onClick={() => openDetail(item)}>
                        <EditNoteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('admin.feedback.deleteTooltip')}>
                      <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    {t('admin.feedback.empty')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Box>

      {/* Detail / Edit dialog */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        {selected && (
          <>
            <DialogTitle>{t('admin.feedback.editDialogTitle')}</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
                {saveError && <Alert severity="error">{saveError}</Alert>}

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={CATEGORY_LABELS[selected.category]} color={CATEGORY_COLORS[selected.category]} size="small" />
                  <Chip label={SEVERITY_LABELS[selected.severity]} color={SEVERITY_COLORS[selected.severity]} size="small" variant="outlined" />
                  {selected.user && (
                    <Chip label={selected.user.email} size="small" variant="outlined" />
                  )}
                  {!selected.user && (
                    <Chip label={t('admin.feedback.guest')} size="small" variant="outlined" />
                  )}
                </Box>

                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', bgcolor: 'action.hover', p: 1.5, borderRadius: 1 }}>
                  {selected.description}
                </Typography>

                {selected.pageUrl && (
                  <Typography variant="caption" color="text.secondary">
                    {t('admin.feedback.colPage')}: <code>{selected.pageUrl}</code>
                  </Typography>
                )}

                <FormControl fullWidth size="small">
                  <InputLabel>{t('common.status')}</InputLabel>
                  <Select value={editStatus} label={t('common.status')} onChange={(e) => setEditStatus(e.target.value as FeedbackStatus)}>
                    <MenuItem value="OPEN">{t('admin.feedback.statusOpen')}</MenuItem>
                    <MenuItem value="IN_PROGRESS">{t('admin.feedback.statusInProgress')}</MenuItem>
                    <MenuItem value="RESOLVED">{t('admin.feedback.statusResolved')}</MenuItem>
                    <MenuItem value="CLOSED">{t('admin.feedback.statusClosed')}</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label={t('admin.feedback.adminNote')}
                  multiline
                  minRows={2}
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder={t('admin.feedback.adminNotePlaceholder')}
                  slotProps={{ htmlInput: { maxLength: 1000 } }}
                  size="small"
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => handleDelete(selected.id)} color="error" disabled={saving}>{t('common.delete')}</Button>
              <Box sx={{ flex: 1 }} />
              <Button onClick={() => setSelected(null)} color="inherit" disabled={saving}>{t('common.cancel')}</Button>
              <Button
                onClick={handleSave}
                variant="contained"
                disabled={saving}
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {saving ? t('common.saving') : t('common.save')}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  )
}
