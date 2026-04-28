'use client'

import { useState } from 'react'
import { LoanStatus } from '@prisma/client'
import {
  Box, Button, CircularProgress, Divider, ListItemIcon, ListItemText,
  Menu, MenuItem, Tooltip, Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn'
import CancelIcon from '@mui/icons-material/Cancel'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

interface GroupActionsProps {
  groupId: string
  groupStatus: LoanStatus
  onDone: () => void
}

interface ItemActionsProps {
  itemId: string
  itemStatus: LoanStatus
  onDone: () => void
}

// Group-level transitions (activate whole group, cancel whole group)
const GROUP_TRANSITIONS: Partial<Record<LoanStatus, Array<{ to: 'ACTIVE' | 'CANCELLED'; label: string; icon: React.ReactNode; color?: string }>>> = {
  RESERVED: [
    { to: 'ACTIVE',    label: 'Alle aktivieren',   icon: <CheckCircleIcon fontSize="small" />, color: 'success.main' },
    { to: 'CANCELLED', label: 'Alle stornieren',   icon: <CancelIcon fontSize="small" />,      color: 'error.main' },
  ],
  ACTIVE: [
    { to: 'CANCELLED', label: 'Alle stornieren',   icon: <CancelIcon fontSize="small" />,      color: 'error.main' },
  ],
  OVERDUE: [
    { to: 'CANCELLED', label: 'Alle stornieren',   icon: <CancelIcon fontSize="small" />,      color: 'error.main' },
  ],
}

// Item-level transitions
const ITEM_TRANSITIONS: Partial<Record<LoanStatus, Array<{ to: 'RETURNED' | 'CANCELLED' | 'OVERDUE'; label: string; icon: React.ReactNode; color?: string }>>> = {
  ACTIVE: [
    { to: 'RETURNED',  label: 'Zurückgeben',              icon: <AssignmentReturnIcon fontSize="small" />, color: 'primary.main' },
    { to: 'OVERDUE',   label: 'Als überfällig markieren', icon: <WarningAmberIcon fontSize="small" />,     color: 'warning.main' },
    { to: 'CANCELLED', label: 'Stornieren',               icon: <CancelIcon fontSize="small" />,           color: 'error.main' },
  ],
  OVERDUE: [
    { to: 'RETURNED',  label: 'Zurückgeben',              icon: <AssignmentReturnIcon fontSize="small" />, color: 'primary.main' },
    { to: 'CANCELLED', label: 'Stornieren',               icon: <CancelIcon fontSize="small" />,           color: 'error.main' },
  ],
  RESERVED: [
    { to: 'CANCELLED', label: 'Stornieren',               icon: <CancelIcon fontSize="small" />,           color: 'error.main' },
  ],
}

/** Group-level actions (shown in the main table row) */
export function GroupStatusActions({ groupId, groupStatus, onDone }: GroupActionsProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const transitions = GROUP_TRANSITIONS[groupStatus] ?? []
  if (transitions.length === 0) return null

  async function apply(to: 'ACTIVE' | 'CANCELLED') {
    setAnchorEl(null)
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/loans/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: to }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Fehler')
      } else {
        onDone()
      }
    } finally {
      setLoading(false)
    }
  }

  if (transitions.length === 1) {
    const t = transitions[0]
    return (
      <Box>
        <Button
          size="small" variant="outlined" disabled={loading}
          startIcon={loading ? <CircularProgress size={13} /> : t.icon}
          onClick={() => apply(t.to)}
          sx={{ color: t.color, borderColor: t.color }}
        >
          {t.label}
        </Button>
        {error && <Typography variant="caption" color="error">{error}</Typography>}
      </Box>
    )
  }

  return (
    <Box>
      <Tooltip title="Gruppen-Aktion">
        <Button
          size="small" variant="outlined" disabled={loading}
          endIcon={loading ? <CircularProgress size={13} /> : <ExpandMoreIcon fontSize="small" />}
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          Aktion
        </Button>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        {transitions.map((t, i) => (
          <Box key={t.to}>
            {i > 0 && <Divider />}
            <MenuItem onClick={() => apply(t.to)} dense>
              <ListItemIcon sx={{ color: t.color }}>{t.icon}</ListItemIcon>
              <ListItemText primary={t.label} slotProps={{ primary: { variant: 'body2', sx: { color: t.color } } }} />
            </MenuItem>
          </Box>
        ))}
      </Menu>
      {error && <Typography variant="caption" color="error">{error}</Typography>}
    </Box>
  )
}

/** Item-level actions (shown per book inside expanded group) */
export function ItemStatusActions({ itemId, itemStatus, onDone }: ItemActionsProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const transitions = ITEM_TRANSITIONS[itemStatus] ?? []
  if (transitions.length === 0) return null

  async function apply(to: 'RETURNED' | 'CANCELLED' | 'OVERDUE') {
    setAnchorEl(null)
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/loans/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: to }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Fehler')
      } else {
        onDone()
      }
    } finally {
      setLoading(false)
    }
  }

  if (transitions.length === 1) {
    const t = transitions[0]
    return (
      <Box sx={{ display: 'inline-flex', flexDirection: 'column' }}>
        <Button
          size="small" variant="text" disabled={loading}
          startIcon={loading ? <CircularProgress size={12} /> : t.icon}
          onClick={() => apply(t.to)}
          sx={{ color: t.color, fontSize: 11, py: 0.25, px: 0.75 }}
        >
          {t.label}
        </Button>
        {error && <Typography variant="caption" color="error">{error}</Typography>}
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'inline-flex', flexDirection: 'column' }}>
      <Button
        size="small" variant="text" disabled={loading}
        endIcon={loading ? <CircularProgress size={12} /> : <ExpandMoreIcon sx={{ fontSize: 13 }} />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ fontSize: 11, py: 0.25, px: 0.75 }}
      >
        Aktion
      </Button>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        {transitions.map((t, i) => (
          <Box key={t.to}>
            {i > 0 && t.to === 'CANCELLED' && <Divider />}
            <MenuItem onClick={() => apply(t.to)} dense>
              <ListItemIcon sx={{ color: t.color }}>{t.icon}</ListItemIcon>
              <ListItemText primary={t.label} slotProps={{ primary: { variant: 'body2', sx: { color: t.color } } }} />
            </MenuItem>
          </Box>
        ))}
      </Menu>
      {error && <Typography variant="caption" color="error">{error}</Typography>}
    </Box>
  )
}

// Default export for backwards compatibility
export default GroupStatusActions
