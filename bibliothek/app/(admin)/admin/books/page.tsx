'use client'

import { useEffect, useState } from 'react'
import {
  Box, Button, Chip, Container, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle, IconButton,
  Stack, Table, TableBody, TableCell, TableHead, TableRow,
  Tooltip, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import LabelIcon from '@mui/icons-material/Label'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import ShelfIcon from '@mui/icons-material/Inventory2'
import QuickPrintDialog from '@/app/components/QuickPrintDialog'
import { generateBibtex } from '@/lib/books/bibtex'

interface Book {
  id: string
  title: string
  author: string
  coverUrl: string | null
  regalnummer: string | null
  tags: string | null
  isbn13: string | null
  publisher: string | null
  year: number | null
  availableCopies: number
  totalCopies: number
}

type PrintTarget = { barcode: string; title: string; mode: 'label' | 'shelf' }

export default function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [copied, setCopied] = useState<string | null>(null)
  const [printTarget, setPrintTarget] = useState<PrintTarget | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    fetch('/api/books?limit=500')
      .then((r) => r.json())
      .then((d) => setBooks(d.books ?? []))
  }, [])

  async function copyBibtex(book: Book) {
    const bib = generateBibtex(book)
    try {
      await navigator.clipboard.writeText(bib)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = bib
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(book.id)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError('')
    const res = await fetch(`/api/books/${deleteTarget.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) {
      setBooks((prev) => prev.filter((b) => b.id !== deleteTarget.id))
      setDeleteTarget(null)
    } else {
      const d = await res.json()
      setDeleteError(d.error ?? 'Fehler beim Löschen')
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <MenuBookIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5">Bücher verwalten</Typography>
            <Typography variant="body2" color="text.secondary">{books.length} Bücher</Typography>
          </Box>
        </Box>
        <Button href="/admin/books/new" variant="contained" startIcon={<AddIcon />}>
          Buch hinzufügen
        </Button>
      </Box>

      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 600 } }}>
              <TableCell sx={{ width: 52 }}>Cover</TableCell>
              <TableCell>Titel / Autor</TableCell>
              <TableCell>Regal</TableCell>
              <TableCell>Barcode</TableCell>
              <TableCell>Exemplare</TableCell>
              <TableCell>Themengebiete</TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {books.map((book) => (
              <TableRow key={book.id} hover>
                <TableCell sx={{ p: 0.5 }}>
                  {book.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      style={{ width: 36, height: 50, objectFit: 'cover', borderRadius: 2, display: 'block', border: '1px solid rgba(0,0,0,0.12)' }}
                    />
                  ) : (
                    <Box sx={{ width: 36, height: 50, bgcolor: 'action.hover', borderRadius: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MenuBookIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                    </Box>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{book.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{book.author}</Typography>
                </TableCell>
                <TableCell>
                  {book.regalnummer ? (
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 600 }}>
                      {book.regalnummer}
                    </Typography>
                  ) : (
                    <Typography variant="caption" color="text.disabled">—</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{book.id}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={`${book.availableCopies}/${book.totalCopies}`}
                    color={book.availableCopies > 0 ? 'success' : 'error'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  {book.tags ? (
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
                      {book.tags.split(',').slice(0, 3).map((t) => (
                        <Chip key={t} label={t.trim()} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="caption" color="text.disabled">—</Typography>
                  )}
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  <Tooltip title="Bearbeiten">
                    <IconButton size="small" href={`/admin/books/${book.id}/edit`}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Label drucken">
                    <IconButton size="small" onClick={() => setPrintTarget({ barcode: book.id, title: book.title, mode: 'label' })}>
                      <LabelIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Schrankplatz drucken">
                    <IconButton
                      size="small"
                      onClick={() => setPrintTarget({ barcode: book.id, title: book.regalnummer ?? book.title, mode: 'shelf' })}
                      disabled={!book.regalnummer}
                    >
                      <ShelfIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={copied === book.id ? 'Kopiert!' : 'BibTeX kopieren'}>
                    <IconButton
                      size="small"
                      onClick={() => copyBibtex(book)}
                      color={copied === book.id ? 'success' : 'default'}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Löschen">
                    <IconButton size="small" color="error" onClick={() => { setDeleteError(''); setDeleteTarget(book) }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {books.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Noch keine Bücher vorhanden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      {/* Per-book quick print */}
      {printTarget && (
        <QuickPrintDialog
          barcode={printTarget.barcode}
          mode={printTarget.mode}
          title={printTarget.title}
          onClose={() => setPrintTarget(null)}
        />
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Buch löschen?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>{deleteTarget?.title}</strong> wird unwiderruflich gelöscht. Bücher mit aktiven Ausleihen können nicht gelöscht werden.
          </DialogContentText>
          {deleteError && (
            <DialogContentText color="error" sx={{ mt: 1 }}>{deleteError}</DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Abbrechen</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Löschen…' : 'Löschen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
