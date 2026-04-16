import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import {
  Box, Button, Card, CardContent, Chip, Container,
  Divider, Grid, Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd'
import LoginIcon from '@mui/icons-material/Login'

type Params = { params: Promise<{ barcode: string }> }

export default async function BookDetailPage({ params }: Params) {
  const { barcode } = await params
  const book = await prisma.book.findUnique({ where: { id: barcode } })
  if (!book) notFound()

  const session = await auth()
  const canBorrow = session?.user?.role === 'STUDENT' || session?.user?.role === 'ADMIN'

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
                {book.genre && <Chip label={book.genre} size="small" variant="outlined" />}
                {book.language && <Chip label={book.language.toUpperCase()} size="small" variant="outlined" />}
                <Chip
                  label={book.availableCopies > 0 ? `Verfügbar (${book.availableCopies}/${book.totalCopies})` : 'Nicht verfügbar'}
                  color={book.availableCopies > 0 ? 'success' : 'default'}
                  size="small"
                />
              </Box>

              <Box sx={{ mt: 2 }}>
                {canBorrow ? (
                  <Button
                   
                    href={`/my-loans/new?bookId=${book.id}`}
                    variant="contained"
                    startIcon={<BookmarkAddIcon />}
                    disabled={book.availableCopies === 0}
                  >
                    Reservieren / Ausleihen
                  </Button>
                ) : !session ? (
                  <Button href="/login" variant="outlined" startIcon={<LoginIcon />}>
                    Anmelden zum Ausleihen
                  </Button>
                ) : null}
              </Box>
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
                <Grid size={7}><Typography variant="caption" sx={{ fontFamily: "monospace" }}>{book.isbn13}</Typography></Grid>
              </>
            )}
            <Grid size={5}><Typography variant="caption" color="text.secondary">Barcode</Typography></Grid>
            <Grid size={7}><Typography variant="caption" sx={{ fontFamily: "monospace" }}>{book.id}</Typography></Grid>
            <Grid size={5}><Typography variant="caption" color="text.secondary">Max. Ausleihdauer</Typography></Grid>
            <Grid size={7}><Typography variant="caption">{book.loanDurationWeeks} Wochen</Typography></Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  )
}
