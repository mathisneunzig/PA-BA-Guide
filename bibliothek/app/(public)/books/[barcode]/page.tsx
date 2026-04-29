'use client'

import { useEffect, useState } from 'react'
import { useParams, notFound } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useSession } from 'next-auth/react'
import {
  Box, Button, Card, CardContent, Chip, Container,
  Divider, Grid, Stack, Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import LoginIcon from '@mui/icons-material/Login'
import BibtexButton from '@/app/components/BibtexButton'
import CartButton from '@/app/components/CartButton'

interface Book {
  id: string; title: string; author: string; coverUrl?: string | null
  publisher?: string | null; year?: number | null; regalnummer?: string | null
  availableCopies: number; totalCopies: number; tags?: string | null
  language?: string | null; loanDurationWeeks: number; isbn13?: string | null
  description?: string | null
}

export default function BookDetailPage() {
  const params = useParams<{ barcode: string }>()
  const { t } = useTranslation()
  const { data: session } = useSession()
  const [book, setBook] = useState<Book | null>(null)
  const [notFound404, setNotFound404] = useState(false)

  const isLoggedIn = !!session?.user
  const canUseCart = isLoggedIn

  useEffect(() => {
    fetch(`/api/books/${params.barcode}`)
      .then((r) => {
        if (r.status === 404) { setNotFound404(true); return null }
        return r.json()
      })
      .then((data) => { if (data) setBook(data) })
      .catch(() => {})
  }, [params.barcode])

  if (notFound404) return null // next/navigation notFound() can't be called async in client

  if (!book) return null

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button href="/books" startIcon={<ArrowBackIcon />} sx={{ mb: 3 }} variant="text" color="inherit">
        {t('books.backToCatalog')}
      </Button>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 'auto' }}>
              {book.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  style={{ width: 130, height: 180, objectFit: 'cover', borderRadius: 4, display: 'block' }}
                />
              ) : (
                <Box sx={{ width: 130, height: 180, bgcolor: 'action.hover', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MenuBookIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
                </Box>
              )}
            </Grid>

            <Grid size="grow">
              <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>{book.title}</Typography>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>{book.author}</Typography>

              {(book.publisher || book.year) && (
                <Typography variant="body2" color="text.secondary">
                  {[book.publisher, book.year].filter(Boolean).join(', ')}
                </Typography>
              )}

              <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {book.regalnummer && (
                  <Chip
                    label={t('books.shelf', { regalnummer: book.regalnummer })}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                  />
                )}
                {book.tags && book.tags.split(',').map((tag) => (
                  <Chip key={tag} label={tag.trim()} size="small" variant="outlined" />
                ))}
                {book.language && <Chip label={book.language.toUpperCase()} size="small" variant="outlined" />}
                <Chip
                  label={book.availableCopies > 0
                    ? t('books.available', { available: book.availableCopies, total: book.totalCopies })
                    : t('books.unavailable')}
                  color={book.availableCopies > 0 ? 'success' : 'default'}
                  size="small"
                />
              </Box>

              <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
                {canUseCart ? (
                  <CartButton
                    book={{ id: book.id, title: book.title, author: book.author, coverUrl: book.coverUrl }}
                    size="medium"
                  />
                ) : !isLoggedIn ? (
                  <Button href="/login" variant="outlined" startIcon={<LoginIcon />}>
                    {t('books.loginToReserve')}
                  </Button>
                ) : null}
              </Stack>
            </Grid>
          </Grid>

          {book.description && (
            <>
              <Divider sx={{ my: 2.5 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>{t('books.description')}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                {book.description}
              </Typography>
            </>
          )}

          <Divider sx={{ my: 2.5 }} />
          <Grid container spacing={1}>
            {book.isbn13 && (
              <>
                <Grid size={5}><Typography variant="caption" color="text.secondary">{t('books.isbn13')}</Typography></Grid>
                <Grid size={7}><Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{book.isbn13}</Typography></Grid>
              </>
            )}
            <Grid size={5}><Typography variant="caption" color="text.secondary">{t('books.barcode')}</Typography></Grid>
            <Grid size={7}><Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{book.id}</Typography></Grid>
            <Grid size={5}><Typography variant="caption" color="text.secondary">{t('books.maxLoanDuration')}</Typography></Grid>
            <Grid size={7}><Typography variant="caption">{t('books.weeks', { count: book.loanDurationWeeks })}</Typography></Grid>
          </Grid>

          <Box sx={{ mt: 2 }}>
            <BibtexButton book={{
              title: book.title,
              author: book.author,
              publisher: book.publisher,
              year: book.year,
              isbn13: book.isbn13,
              id: book.id,
              tags: book.tags,
            }} />
          </Box>
        </CardContent>
      </Card>
    </Container>
  )
}
