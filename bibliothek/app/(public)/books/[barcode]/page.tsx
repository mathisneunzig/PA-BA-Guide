import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import {
  Box, Button, Card, CardContent, Chip, Container,
  Divider, Grid, Stack, Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import LoginIcon from '@mui/icons-material/Login'
import BibtexButton from '@/app/components/BibtexButton'

type Params = { params: Promise<{ barcode: string }> }

export default async function BookDetailPage({ params }: Params) {
  const { barcode } = await params
  const book = await prisma.book.findUnique({ where: { id: barcode } })
  if (!book) notFound()

  const session = await auth()
  const role = session?.user?.role
  const canBorrow = role === 'STUDENT' || role === 'ADMIN'
  const isAdmin = role === 'ADMIN'

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        href="/books"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 3 }}
        variant="text"
        color="inherit"
      >
        Zurück zum Katalog
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
                <Box sx={{
                  width: 130, height: 180, bgcolor: 'grey.100', borderRadius: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MenuBookIcon sx={{ fontSize: 56, color: 'grey.400' }} />
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
                    label={`Regal: ${book.regalnummer}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                  />
                )}
                {book.tags && book.tags.split(',').map((t) => (
                  <Chip key={t} label={t.trim()} size="small" variant="outlined" />
                ))}
                {book.language && <Chip label={book.language.toUpperCase()} size="small" variant="outlined" color="default" />}
                <Chip
                  label={book.availableCopies > 0 ? `Verfügbar (${book.availableCopies}/${book.totalCopies})` : 'Nicht verfügbar'}
                  color={book.availableCopies > 0 ? 'success' : 'default'}
                  size="small"
                />
              </Box>

              <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
                {canBorrow ? (
                  <>
                    <Button
                      href={`/my-loans/new?bookId=${book.id}`}
                      variant="outlined"
                      startIcon={<BookmarkAddIcon />}
                      disabled={book.availableCopies === 0}
                      size="small"
                    >
                      Reservieren
                    </Button>
                    {isAdmin && (
                      <Button
                        href={`/my-loans/new?bookId=${book.id}`}
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        disabled={book.availableCopies === 0}
                        size="small"
                      >
                        Direkt ausleihen
                      </Button>
                    )}
                  </>
                ) : !session ? (
                  <Button href="/login" variant="outlined" startIcon={<LoginIcon />}>
                    Anmelden zum Ausleihen
                  </Button>
                ) : null}
              </Stack>
            </Grid>
          </Grid>

          {book.description && (
            <>
              <Divider sx={{ my: 2.5 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>Beschreibung</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                {book.description}
              </Typography>
            </>
          )}

          <Divider sx={{ my: 2.5 }} />
          <Grid container spacing={1}>
            {book.isbn13 && (
              <>
                <Grid size={5}><Typography variant="caption" color="text.secondary">ISBN-13</Typography></Grid>
                <Grid size={7}><Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{book.isbn13}</Typography></Grid>
              </>
            )}
            <Grid size={5}><Typography variant="caption" color="text.secondary">Barcode</Typography></Grid>
            <Grid size={7}><Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{book.id}</Typography></Grid>
            <Grid size={5}><Typography variant="caption" color="text.secondary">Max. Ausleihdauer</Typography></Grid>
            <Grid size={7}><Typography variant="caption">{book.loanDurationWeeks} Wochen</Typography></Grid>
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
