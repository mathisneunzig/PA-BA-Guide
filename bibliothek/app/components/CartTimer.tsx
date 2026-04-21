'use client'

import { useEffect, useState } from 'react'
import { Box, Chip, LinearProgress, Typography } from '@mui/material'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { useCart } from '@/lib/cart/CartContext'

export default function CartTimer() {
  const { secondsLeft, items } = useCart()
  const [display, setDisplay] = useState<number | null>(null)

  // Tick every second to keep display in sync
  useEffect(() => {
    if (secondsLeft === null || items.length === 0) { setDisplay(null); return }
    setDisplay(secondsLeft)
    const t = setInterval(() => {
      setDisplay((prev) => {
        if (prev === null || prev <= 0) { clearInterval(t); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [secondsLeft, items.length])

  if (display === null || items.length === 0) return null

  const minutes = Math.floor(display / 60)
  const seconds = display % 60
  const isWarning = display <= 120 // last 2 minutes
  const progress = (display / 600) * 100

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        {isWarning
          ? <WarningAmberIcon sx={{ fontSize: 16, color: 'warning.main' }} />
          : <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
        <Typography variant="caption" color={isWarning ? 'warning.main' : 'text.secondary'} sx={{ fontWeight: isWarning ? 600 : 400 }}>
          Reservierung gesperrt für:
        </Typography>
        <Chip
          label={`${minutes}:${String(seconds).padStart(2, '0')}`}
          size="small"
          color={isWarning ? 'warning' : 'default'}
          sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}
        />
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        color={isWarning ? 'warning' : 'primary'}
        sx={{ height: 3, borderRadius: 2 }}
      />
      {display === 0 && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
          Die Reservierung ist abgelaufen. Bücher wurden aus dem Warenkorb entfernt.
        </Typography>
      )}
    </Box>
  )
}
