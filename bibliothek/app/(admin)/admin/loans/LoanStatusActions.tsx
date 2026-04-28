'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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

/** Group-level actions (shown in the main table row) */
export function GroupStatusActions({ groupId, groupStatus, onDone }: GroupActionsProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  // Group-level transitions (activate whole group, cancel whole group)
  const GROUP_TRANSITIONS: Partial<Record<LoanStatus, Array<{ to: 'ACTIVE' | 'CANCELLED'; label: string; icon: React.ReactNode; color?: string }>>> = {
    RESERVED: [
      { to: 'ACTIVE',    label: t('admin.loans.activateAll'), icon: <CheckCircleIcon fontSize="small" />, color: 'success.main' },
      { to: 'CANCELLED', label: t('admin.loans.cancelAll'),   icon: <CancelIcon fontSize="small" />,      color: 'error.main' },
    ],
    ACTIVE: [
      { to: 'CANCELLED', label: t('admin.loans.cancelAll'),   icon: <CancelIcon fontSize="small" />,      color: 'error.main' },
    ],
    OVERDUE: [
      { to: 'CANCELLED', label: t('admin.loans.cancelAll'),   icon: <CancelIcon fontSize="small" />,      color: 'error.main' },
    ],
  }

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
        setError(d.error ?? t('common.error'))
      } else {
        onDone()
      }
    } finally {
      setLoading(false)
    }
  }

  if (transitions.length === 1) {
    const tr = transitions[0]
    return (
      <Box>
        <Button
          size="small" variant="outlined" disabled={loading}
          startIcon={loading ? <CircularProgress size={13} /> : tr.icon}
          onClick={() => apply(tr.to)}
          sx={{ color: tr.color, borderColor: tr.color }}
        >
          {tr.label}
        </Button>
        {error && <Typography variant="caption" color="error">{error}</Typography>}
      </Box>
    )
  }

  return (
    <Box>
      <Tooltip title={t('admin.loans.groupAction')}>
        <Button
          size="small" variant="outlined" disabled={loading}
          endIcon={loading ? <CircularProgress size={13} /> : <ExpandMoreIcon fontSize="small" />}
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          {t('admin.loans.action')}
        </Button>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        {transitions.map((tr, i) => (
          <Box key={tr.to}>
            {i > 0 && <Divider />}
            <MenuItem onClick={() => apply(tr.to)} dense>
              <ListItemIcon sx={{ color: tr.color }}>{tr.icon}</ListItemIcon>
              <ListItemText primary={tr.label} slotProps={{ primary: { variant: 'body2', sx: { color: tr.color } } }} />
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
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  // Item-level transitions
  const ITEM_TRANSITIONS: Partial<Record<LoanStatus, Array<{ to: 'RETURNED' | 'CANCELLED' | 'OVERDUE'; label: string; icon: React.ReactNode; color?: string }>>> = {
    ACTIVE: [
      { to: 'RETURNED',  label: t('admin.loans.returnItem'),   icon: <AssignmentReturnIcon fontSize="small" />, color: 'primary.main' },
      { to: 'OVERDUE',   label: t('admin.loans.markOverdue'),  icon: <WarningAmberIcon fontSize="small" />,     color: 'warning.main' },
      { to: 'CANCELLED', label: t('admin.loans.cancelItem'),   icon: <CancelIcon fontSize="small" />,           color: 'error.main' },
    ],
    OVERDUE: [
      { to: 'RETURNED',  label: t('admin.loans.returnItem'),   icon: <AssignmentReturnIcon fontSize="small" />, color: 'primary.main' },
      { to: 'CANCELLED', label: t('admin.loans.cancelItem'),   icon: <CancelIcon fontSize="small" />,           color: 'error.main' },
    ],
    RESERVED: [
      { to: 'CANCELLED', label: t('admin.loans.cancelItem'),   icon: <CancelIcon fontSize="small" />,           color: 'error.main' },
    ],
  }

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
        setError(d.error ?? t('common.error'))
      } else {
        onDone()
      }
    } finally {
      setLoading(false)
    }
  }

  if (transitions.length === 1) {
    const tr = transitions[0]
    return (
      <Box sx={{ display: 'inline-flex', flexDirection: 'column' }}>
        <Button
          size="small" variant="text" disabled={loading}
          startIcon={loading ? <CircularProgress size={12} /> : tr.icon}
          onClick={() => apply(tr.to)}
          sx={{ color: tr.color, fontSize: 11, py: 0.25, px: 0.75 }}
        >
          {tr.label}
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
        {t('admin.loans.action')}
      </Button>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        {transitions.map((tr, i) => (
          <Box key={tr.to}>
            {i > 0 && tr.to === 'CANCELLED' && <Divider />}
            <MenuItem onClick={() => apply(tr.to)} dense>
              <ListItemIcon sx={{ color: tr.color }}>{tr.icon}</ListItemIcon>
              <ListItemText primary={tr.label} slotProps={{ primary: { variant: 'body2', sx: { color: tr.color } } }} />
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
