'use client'

import { useState } from 'react'
import { Button, Snackbar } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { generateBibtex, type BibtexBook } from '@/lib/books/bibtex'

interface Props {
  book: BibtexBook
}

export default function BibtexButton({ book }: Props) {
  const [open, setOpen] = useState(false)

  async function handleCopy() {
    const bib = generateBibtex(book)
    try {
      await navigator.clipboard.writeText(bib)
    } catch {
      // Fallback: create textarea + execCommand
      const ta = document.createElement('textarea')
      ta.value = bib
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setOpen(true)
  }

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        color="inherit"
        startIcon={<ContentCopyIcon fontSize="small" />}
        onClick={handleCopy}
        sx={{ fontFamily: 'monospace', fontSize: '0.72rem' }}
      >
        BibTeX kopieren
      </Button>
      <Snackbar
        open={open}
        onClose={() => setOpen(false)}
        autoHideDuration={2500}
        message="BibTeX-Eintrag kopiert!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  )
}
