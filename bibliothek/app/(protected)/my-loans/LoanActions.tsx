'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoanStatus } from '@prisma/client'
import {
  Box, Button, Chip, Typography,
} from '@mui/material'
import CancelIcon from '@mui/icons-material/Cancel'

interface Props {
  loanId: string
  status: LoanStatus
}

export default function LoanActions({ loanId, status }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (status !== 'RESERVED') return null

  async function handleCancel() {
    setLoading(true)
    try {
      await fetch(`/api/loans/${loanId}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ mt: 1.5 }}>
      <Button
        size="small"
        color="error"
        variant="outlined"
        onClick={handleCancel}
        disabled={loading}
        startIcon={<CancelIcon />}
      >
        {loading ? 'Storniere…' : 'Stornieren'}
      </Button>
    </Box>
  )
}
