'use client'

import { useState } from 'react'
import { Box, Button } from '@mui/material'
import LabelIcon from '@mui/icons-material/Label'
import ShelfIcon from '@mui/icons-material/Inventory2'
import QuickPrintDialog from './QuickPrintDialog'

interface Props {
  barcode: string
  title?: string
  hasRegalnummer?: boolean
}

export default function PrintLabelButtons({ barcode, title, hasRegalnummer }: Props) {
  const [mode, setMode] = useState<'label' | 'shelf' | null>(null)

  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      <Button
        size="small"
        variant="outlined"
        startIcon={<LabelIcon />}
        onClick={() => setMode('label')}
      >
        Label drucken
      </Button>

      {hasRegalnummer && (
        <Button
          size="small"
          variant="outlined"
          startIcon={<ShelfIcon />}
          onClick={() => setMode('shelf')}
        >
          Schrankplatz drucken
        </Button>
      )}

      {mode && (
        <QuickPrintDialog
          barcode={barcode}
          mode={mode}
          title={title}
          onClose={() => setMode(null)}
        />
      )}
    </Box>
  )
}
