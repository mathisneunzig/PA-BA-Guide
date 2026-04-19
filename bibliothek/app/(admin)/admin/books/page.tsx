'use client'

import { useEffect, useState } from 'react'
import {
  Box, Button, Checkbox, Chip, Container, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle, IconButton,
  Stack, Table, TableBody, TableCell, TableHead, TableRow,
  Tooltip, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import LabelIcon from '@mui/icons-material/Label'
import PrintIcon from '@mui/icons-material/Print'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import PrintMultiLabels from '@/app/components/PrintMultiLabels'
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

export default function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showPrint, setShowPrint] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    fetch('/api/books?limit=500')
      .then((r) => r.json())
      .then((d) => setBooks(d.books ?? []))
  }, [])

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === books.length) setSelected(new Set())
    else setSelected(new Set(books.map((b) => b.id)))
  }

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
      setSelected((prev) => { const next = new Set(prev); next.delete(deleteTarget.id); return next })
      setDeleteTarget(null)
    } else {
      const d = await res.json()
      setDeleteError(d.error ?? 'Fehler beim Löschen')
    }
  }

  const selectedBarcodes = Array.from(selected)
  const selectedTitles = Object.fromEntries(
    books.filter((b) => selected.has(b.id)).map((b) => [b.id, b.title])
  )

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <MenuBookIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          <Typography variant="h5">Bücher verwalten</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {selected.size > 0 && (
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => setShowPrint(true)}
              size="small"
            >
              {selected.size} Label{selected.size !== 1 ? 's' : ''} drucken
            </Button>
          )}
          <Button href="/admin/books/new" variant="contained" startIcon={<AddIcon />}>
            Buch hinzufügen
          </Button>
        </Box>
      </Box>

      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 600 } }}>
              <TableCell padding="checkbox">
                <Checkbox
                  size="small"
                  checked={books.length > 0 && selected.size === books.length}
                  indeterminate={selected.size > 0 && selected.size < books.length}
                  onChange={toggleAll}
                />
              </TableCell>
              <TableCell sx={{ width: 52 }}>Cover</TableCell>
              <TableCell>Titel</TableCell>
              <TableCell>Autor</TableCell>
              <TableCell>Regal</TableCell>
              <TableCell>Barcode</TableCell>
              <TableCell>Exemplare</TableCell>
              <TableCell>Themengebiete</TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {books.map((book) => (
              <TableRow key={book.id} hover selected={selected.has(book.id)}>
                <TableCell padding="checkbox">
                  <Checkbox
                    size="small"
                    checked={selected.has(book.id)}
                    onChange={() => toggleSelect(book.id)}
                  />
                </TableCell>
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
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">{book.author}</Typography>
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
                <TableCell align="right">
                  <Tooltip title="Bearbeiten">
                    <IconButton size="small" href={`/admin/books/${book.id}/edit`}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Label (PNG)">
                    <IconButton size="small" component="a" href={`/api/books/${book.id}/label?format=png`} target="_blank">
                      <LabelIcon fontSize="small" />
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
                <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Noch keine Bücher vorhanden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      {showPrint && (
        <PrintMultiLabels
          barcodes={selectedBarcodes}
          titles={selectedTitles}
          onClose={() => setShowPrint(false)}
        />
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Buch löschen?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>{deleteTarget?.title}</strong> wird unwiderruflich gelöscht. Bücher mit aktiven Ausleihen können nicht gelöscht werden.
          </DialogContentText>
          {deleteError && (
            <DialogContentText color="error" sx={{ mt: 1 }}>
              {deleteError}
            </DialogContentText>
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