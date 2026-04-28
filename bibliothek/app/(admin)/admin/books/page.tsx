'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box, Button, Chip, CircularProgress, Container, Dialog, DialogActions,
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
  const { t } = useTranslation()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [printTarget, setPrintTarget] = useState<PrintTarget | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    fetch('/api/books?limit=500')
      .then((r) => r.json())
      .then((d) => setBooks(d.books ?? []))
      .finally(() => setLoading(false))
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
      setDeleteError(d.error ?? t('admin.books.deleteError'))
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <MenuBookIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5">{t('admin.books.title')}</Typography>
            <Typography variant="body2" color="text.secondary">{t('admin.books.count', { count: books.length })}</Typography>
          </Box>
        </Box>
        <Button href="/admin/books/new" variant="contained" startIcon={<AddIcon />}>
          {t('admin.books.addBook')}
        </Button>
      </Box>

      <Box sx={{ overflowX: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 600 } }}>
              <TableCell sx={{ width: 52 }}>{t('admin.books.cover')}</TableCell>
              <TableCell>{t('admin.books.titleAuthor')}</TableCell>
              <TableCell>{t('admin.books.shelf')}</TableCell>
              <TableCell>{t('admin.books.barcode')}</TableCell>
              <TableCell>{t('admin.books.copies')}</TableCell>
              <TableCell>{t('admin.books.topics')}</TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{t('common.actions')}</TableCell>
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
                      {book.tags.split(',').slice(0, 3).map((tag) => (
                        <Chip key={tag} label={tag.trim()} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="caption" color="text.disabled">—</Typography>
                  )}
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  <Tooltip title={t('admin.books.editTooltip')}>
                    <IconButton size="small" href={`/admin/books/${book.id}/edit`}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('admin.books.printLabelTooltip')}>
                    <IconButton size="small" onClick={() => setPrintTarget({ barcode: book.id, title: book.title, mode: 'label' })}>
                      <LabelIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('admin.books.printShelfTooltip')}>
                    <IconButton
                      size="small"
                      onClick={() => setPrintTarget({ barcode: book.id, title: book.regalnummer ?? book.title, mode: 'shelf' })}
                      disabled={!book.regalnummer}
                    >
                      <ShelfIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={copied === book.id ? t('common.copied') : t('admin.books.bibtexTooltip')}>
                    <IconButton
                      size="small"
                      onClick={() => copyBibtex(book)}
                      color={copied === book.id ? 'success' : 'default'}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('admin.books.deleteTooltip')}>
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
                  {t('admin.books.empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        )}
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
        <DialogTitle>{t('admin.books.deleteConfirmTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>{deleteTarget?.title}</strong> {t('admin.books.deleteConfirmText')}
          </DialogContentText>
          {deleteError && (
            <DialogContentText color="error" sx={{ mt: 1 }}>{deleteError}</DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>{t('common.cancel')}</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? t('common.deleting') : t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
