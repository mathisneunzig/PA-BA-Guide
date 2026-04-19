'use client'

import { useState } from 'react'
import { LoanStatus } from '@prisma/client'
import {
  Box, Button, CircularProgress, Divider, ListItemIcon, ListItemText,
  Menu, MenuItem, Tooltip,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn'
import CancelIcon from '@mui/icons-material/Cancel'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

interface Props {
  loanId: string
  status: LoanStatus
  onDone: () => void
}

// Valid transitions per status (admin can force most things)
const TRANSITIONS: Record<LoanStatus, Array<{ to: LoanStatus; label: string; icon: React.ReactNode; color?: string }>> = {
  RESERVED: [
    { to: LoanStatus.ACTIVE,    label: 'Aktivieren (Ausleihe)',  icon: <CheckCircleIcon fontSize="small" />,      color: 'success.main' },
    { to: LoanStatus.CANCELLED, label: 'Stornieren',              icon: <CancelIcon fontSize="small" />,           color: 'error.main' },
  ],
  ACTIVE: [
    { to: LoanStatus.RETURNED,  label: 'Zurückgeben',             icon: <AssignmentReturnIcon fontSize="small" />, color: 'primary.main' },
    { to: LoanStatus.OVERDUE,   label: 'Als überfällig markieren',icon: <WarningAmberIcon fontSize="small" />,     color: 'warning.main' },
    { to: LoanStatus.CANCELLED, label: 'Stornieren',              icon: <CancelIcon fontSize="small" />,           color: 'error.main' },
  ],
  OVERDUE: [
    { to: LoanStatus.RETURNED,  label: 'Zurückgeben',             icon: <AssignmentReturnIcon fontSize="small" />, color: 'primary.main' },
    { to: LoanStatus.CANCELLED, label: 'Stornieren',              icon: <CancelIcon fontSize="small" />,           color: 'error.main' },
  ],
  RETURNED:  [],
  CANCELLED: [],
}

export default function LoanStatusActions({ loanId, status, onDone }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const transitions = TRANSITIONS[status] ?? []
  if (transitions.length === 0) return null

  async function applyTransition(to: LoanStatus) {
    setAnchorEl(null)
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/loans/${loanId}`, {
        method: 'PUT',
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

  // If only one transition available: show single button
  if (transitions.length === 1) {
    const t = transitions[0]
    return (
      <Box>
        <Button
          size="small"
          variant="outlined"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={13} /> : t.icon}
          onClick={() => applyTransition(t.to)}
          sx={{ color: t.color, borderColor: t.color, '&:hover': { borderColor: t.color } }}
        >
          {t.label}
        </Button>
        {error && <Box sx={{ fontSize: 11, color: 'error.main', mt: 0.5 }}>{error}</Box>}
      </Box>
    )
  }

  return (
    <Box>
      <Tooltip title="Status ändern">
        <Button
          size="small"
          variant="outlined"
          disabled={loading}
          endIcon={loading ? <CircularProgress size={13} /> : <ExpandMoreIcon fontSize="small" />}
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          Aktion
        </Button>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        {transitions.map((t, i) => (
          <Box key={t.to}>
            {i > 0 && t.to === LoanStatus.CANCELLED && <Divider />}
            <MenuItem onClick={() => applyTransition(t.to)} dense>
              <ListItemIcon sx={{ color: t.color }}>{t.icon}</ListItemIcon>
              <ListItemText
                primary={t.label}
                slotProps={{ primary: { variant: 'body2', sx: { color: t.color } } }}
              />
            </MenuItem>
          </Box>
        ))}
      </Menu>
      {error && <Box sx={{ fontSize: 11, color: 'error.main', mt: 0.5 }}>{error}</Box>}
    </Box>
  )
}
