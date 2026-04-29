'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { LoanStatus } from '@prisma/client'
import { Button } from '@mui/material'
import CancelIcon from '@mui/icons-material/Cancel'

interface Props {
  itemId: string
  status: LoanStatus
}

export default function LoanActions({ itemId, status }: Props) {
  const router = useRouter()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  if (status !== 'RESERVED') return null

  async function handleCancel() {
    setLoading(true)
    try {
      await fetch(`/api/loans/${itemId}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="small"
      color="error"
      variant="outlined"
      onClick={handleCancel}
      disabled={loading}
      startIcon={<CancelIcon sx={{ fontSize: 14 }} />}
      sx={{ flexShrink: 0, fontSize: 11, py: 0.25 }}
    >
      {loading ? t('loans.cancelling') : t('loans.cancel')}
    </Button>
  )
}
