import { prisma } from '@/lib/prisma'
import {
  Box, Card, CardActionArea, CardContent, CardMedia,
  Chip, Container, Grid, Stack, Typography,
} from '@mui/material'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import BooksFilter from '@/app/components/BooksFilter'
import { Suspense } from 'react'

interface SearchParams {
  q?: string
  tags?: string
  programmiersprachen?: string
  hauptkategorie?: string
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
  const tagsParam = sp.tags ?? ''
  const programmiersprachenParam = sp.programmiersprachen ?? ''
  const hauptkategorieParam = sp.hauptkategorie ?? ''
  const page = Math.max(1, parseInt(sp.page ?? '1', 10))
  const limit = 20
  const skip = (page - 1) * limit

  // Multi-value filters: comma-separated values in param
  const tagList = tagsParam ? tagsParam.split(',').filter(Boolean) : []
  const langList = programmiersprachenParam ? programmiersprachenParam.split(',').filter(Boolean) : []
  const hkList = hauptkategorieParam ? hauptkategorieParam.split(',').filter(Boolean) : []

  const andConditions: object[] = []
  if (tagList.length > 0) andConditions.push(...tagList.map((t) => ({ tags: { contains: t } })))
  if (langList.length > 0) andConditions.push(...langList.map((l) => ({ programmiersprachen: { contains: l } })))

  const where = {
    ...(q && {
      OR: [
        { title: { contains: q } },
        { author: { contains: q } },
        { isbn13: { contains: q } },
      ],
    }),
    ...(andConditions.length > 0 && { AND: andConditions }),
    ...(hkList.length > 0 && { hauptkategorie: { in: hkList } }),
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

      <Suspense>
        <BooksFilter
          initialQ={q}
          initialTags={tagList}
          initialProgrammiersprachen={langList}
          initialHauptkategorie={hauptkategorieParam}
        />
      </Suspense>

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
                  {book.regalnummer && (
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
                      {book.regalnummer}
                    </Typography>
                  )}
                  {book.tags && (
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", mt: 0.5 }}>
                      {book.tags.split(',').slice(0, 2).map((t) => (
                        <Chip key={t} label={t.trim()} size="small" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
                      ))}
                    </Stack>
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
            <Box component="a" href={`?q=${q}&tags=${tagsParam}&programmiersprachen=${programmiersprachenParam}&hauptkategorie=${hauptkategorieParam}&page=${page - 1}`} sx={{ textDecoration: 'none' }}>
              ← Zurück
            </Box>
          )}
          <Typography variant="body2" color="text.secondary">
            Seite {page} von {pages}
          </Typography>
          {page < pages && (
            <Box component="a" href={`?q=${q}&tags=${tagsParam}&programmiersprachen=${programmiersprachenParam}&hauptkategorie=${hauptkategorieParam}&page=${page + 1}`} sx={{ textDecoration: 'none' }}>
              Weiter →
            </Box>
          )}
        </Box>
      )}
    </Container>
  )
}
