'use client'

import { useState } from 'react'
import { Button, Stack } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn'

interface Props {
  loanId: string
  status: string
  onDone: () => void
}

export default function LoanStatusActions({ loanId, status, onDone }: Props) {
  const [loading, setLoading] = useState(false)

  async function update(newStatus: string) {
    setLoading(true)
    try {
      await fetch(`/api/loans/${loanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      onDone()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack direction="row" spacing={1}>
      {status === 'RESERVED' && (
        <Button
          size="small"
          color="success"
          variant="outlined"
          disabled={loading}
          startIcon={<CheckCircleIcon fontSize="small" />}
          onClick={() => update('ACTIVE')}
        >
          Aktivieren
        </Button>
      )}
      {(status === 'ACTIVE' || status === 'OVERDUE') && (
        <Button
          size="small"
          color="primary"
          variant="outlined"
          disabled={loading}
          startIcon={<AssignmentReturnIcon fontSize="small" />}
          onClick={() => update('RETURNED')}
        >
          Zurückgeben
        </Button>
      )}
    </Stack>
  )
}
