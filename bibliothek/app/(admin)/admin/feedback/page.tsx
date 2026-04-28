'use client'

import { useCallback, useEffect, useState } from 'react'
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

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  BUG: 'Fehler',
  IMPROVEMENT: 'Verbesserung',
  QUESTION: 'Frage',
  OTHER: 'Sonstiges',
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

const SEVERITY_LABELS: Record<FeedbackSeverity, string> = {
  LOW: 'Niedrig',
  MEDIUM: 'Mittel',
  HIGH: 'Hoch',
}

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  OPEN: 'Offen',
  IN_PROGRESS: 'In Bearbeitung',
  RESOLVED: 'Gelöst',
  CLOSED: 'Geschlossen',
}

const STATUS_COLORS: Record<FeedbackStatus, 'default' | 'primary' | 'success' | 'error'> = {
  OPEN: 'error',
  IN_PROGRESS: 'primary',
  RESOLVED: 'success',
  CLOSED: 'default',
}

export default function AdminFeedbackPage() {
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
      if (!res.ok) throw new Error('Fehler beim Speichern')
      setItems((prev) => prev.map((i) => i.id === selected.id ? { ...i, status: editStatus, adminNote: editNote } : i))
      setSelected(null)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Feedback wirklich löschen?')) return
    await fetch(`/api/admin/feedback/${id}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((i) => i.id !== id))
    setTotal((t) => t - 1)
    if (selected?.id === id) setSelected(null)
  }

  const openCount = items.filter((i) => i.status === 'OPEN').length

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <FeedbackIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5">Feedback & Probleme</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {total} Einträge gesamt
            {openCount > 0 && <Chip label={`${openCount} offen`} color="error" size="small" />}
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filterStatus}
            label="Status"
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <MenuItem value="">Alle</MenuItem>
            <MenuItem value="OPEN">Offen</MenuItem>
            <MenuItem value="IN_PROGRESS">In Bearbeitung</MenuItem>
            <MenuItem value="RESOLVED">Gelöst</MenuItem>
            <MenuItem value="CLOSED">Geschlossen</MenuItem>
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
                <TableCell>Kategorie</TableCell>
                <TableCell>Schwere</TableCell>
                <TableCell>Beschreibung</TableCell>
                <TableCell>Nutzer</TableCell>
                <TableCell>Seite</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Datum</TableCell>
                <TableCell align="right">Aktionen</TableCell>
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
                      <Typography variant="caption" color="text.disabled">Gast</Typography>
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
                      {new Date(item.createdAt).toLocaleDateString('de-DE')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Bearbeiten">
                      <IconButton size="small" onClick={() => openDetail(item)}>
                        <EditNoteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Löschen">
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
                    Keine Einträge gefunden.
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
            <DialogTitle>Feedback bearbeiten</DialogTitle>
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
                    <Chip label="Gast" size="small" variant="outlined" />
                  )}
                </Box>

                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', bgcolor: 'action.hover', p: 1.5, borderRadius: 1 }}>
                  {selected.description}
                </Typography>

                {selected.pageUrl && (
                  <Typography variant="caption" color="text.secondary">
                    Seite: <code>{selected.pageUrl}</code>
                  </Typography>
                )}

                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select value={editStatus} label="Status" onChange={(e) => setEditStatus(e.target.value as FeedbackStatus)}>
                    <MenuItem value="OPEN">Offen</MenuItem>
                    <MenuItem value="IN_PROGRESS">In Bearbeitung</MenuItem>
                    <MenuItem value="RESOLVED">Gelöst</MenuItem>
                    <MenuItem value="CLOSED">Geschlossen</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Admin-Notiz (intern)"
                  multiline
                  minRows={2}
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Interne Notiz für das Team …"
                  slotProps={{ htmlInput: { maxLength: 1000 } }}
                  size="small"
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => handleDelete(selected.id)} color="error" disabled={saving}>Löschen</Button>
              <Box sx={{ flex: 1 }} />
              <Button onClick={() => setSelected(null)} color="inherit" disabled={saving}>Abbrechen</Button>
              <Button
                onClick={handleSave}
                variant="contained"
                disabled={saving}
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {saving ? 'Speichern …' : 'Speichern'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  )
}
