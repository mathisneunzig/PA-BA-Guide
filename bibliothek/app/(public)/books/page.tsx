import { prisma } from '@/lib/prisma'
import {
  Box, Button, Card, CardActionArea, CardContent, CardMedia,
  Chip, Container, Grid, InputAdornment, TextField, Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import Link from 'next/link'

interface SearchParams {
  q?: string
  genre?: string
  language?: string
  page?: string
}

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const q = sp.q ?? ''
  const genre = sp.genre ?? ''
  const language = sp.language ?? ''
  const page = Math.max(1, parseInt(sp.page ?? '1', 10))
  const limit = 20
  const skip = (page - 1) * limit

  const where = {
    ...(q && {
      OR: [
        { title: { contains: q } },
        { author: { contains: q } },
        { isbn13: { contains: q } },
      ],
    }),
    ...(genre && { genre }),
    ...(language && { language }),
  }

  const [books, total] = await Promise.all([
    prisma.book.findMany({ where, skip, take: limit, orderBy: { title: 'asc' } }),
    prisma.book.count({ where }),
  ])

  const pages = Math.ceil(total / limit)

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <MenuBookIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Typography variant="h5">Bibliothekskatalog</Typography>
      </Box>

      <Box component="form" sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          name="q"
          defaultValue={q}
          placeholder="Titel, Autor, ISBN suchen…"
          size="small"
          sx={{ flex: 1, minWidth: 200 }}
          slotProps={{ input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          } }}
        />
        <TextField name="genre" defaultValue={genre} placeholder="Genre" size="small" sx={{ width: 140 }} />
        <TextField name="language" defaultValue={language} placeholder="Sprache" size="small" sx={{ width: 110 }} />
        <Button type="submit" variant="contained" startIcon={<SearchIcon />}>Suchen</Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {total} Buch{total !== 1 ? 'er' : ''} gefunden
      </Typography>

      <Grid container spacing={2}>
        {books.map((book) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={book.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardActionArea href={`/books/${book.id}`} sx={{ flex: 1 }}>
                {book.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <CardMedia component="img" image={book.coverUrl} alt={book.title} sx={{ height: 180, objectFit: 'contain', bgcolor: '#fafafa', pt: 1 }} />
                ) : (
                  <Box sx={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
                    <MenuBookIcon sx={{ fontSize: 48, color: 'grey.400' }} />
                  </Box>
                )}
                <CardContent sx={{ pb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>{book.title}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>{book.author}</Typography>
                  {book.genre && (
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>{book.genre}</Typography>
                  )}
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={book.availableCopies > 0 ? `Verfügbar (${book.availableCopies}/${book.totalCopies})` : 'Nicht verfügbar'}
                      color={book.availableCopies > 0 ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {books.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <MenuBookIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">Keine Bücher gefunden.</Typography>
        </Box>
      )}

      {pages > 1 && (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'center', mt: 4 }}>
          {page > 1 && (
            <Button href={`?q=${q}&genre=${genre}&language=${language}&page=${page - 1}`} variant="outlined" size="small">
              Zurück
            </Button>
          )}
          <Typography variant="body2" color="text.secondary">
            Seite {page} von {pages}
          </Typography>
          {page < pages && (
            <Button href={`?q=${q}&genre=${genre}&language=${language}&page=${page + 1}`} variant="outlined" size="small">
              Weiter
            </Button>
          )}
        </Box>
      )}
    </Container>
  )
}
