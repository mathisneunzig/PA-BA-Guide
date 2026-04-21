import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import {
  Box, Container, Grid, Typography,
} from '@mui/material'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import BooksFilter, { type SortValue } from '@/app/components/BooksFilter'
import BookCard from '@/app/components/BookCard'
import PaginationBar from '@/app/components/PaginationBar'
import { Suspense } from 'react'

interface SearchParams {
  q?: string
  tags?: string
  programmiersprachen?: string
  hauptkategorie?: string
  sort?: string
  page?: string
}

const VALID_SORTS: SortValue[] = ['title_asc', 'title_desc', 'author_asc', 'year_desc', 'year_asc', 'hauptkategorie_asc']

function buildOrderBy(sort: SortValue) {
  switch (sort) {
    case 'title_desc': return { title: 'desc' as const }
    case 'author_asc': return { author: 'asc' as const }
    case 'year_desc': return { year: 'desc' as const }
    case 'year_asc': return { year: 'asc' as const }
    case 'hauptkategorie_asc': return { hauptkategorie: 'asc' as const }
    default: return { title: 'asc' as const }
  }
}

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const [sp, session] = await Promise.all([searchParams, auth()])
  const q = sp.q ?? ''
  const tagsParam = sp.tags ?? ''
  const programmiersprachenParam = sp.programmiersprachen ?? ''
  const hauptkategorieParam = sp.hauptkategorie ?? ''
  const sort: SortValue = VALID_SORTS.includes(sp.sort as SortValue) ? (sp.sort as SortValue) : 'title_asc'
  const page = Math.max(1, parseInt(sp.page ?? '1', 10))
  const limit = 21
  const skip = (page - 1) * limit

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
    prisma.book.findMany({ where, skip, take: limit, orderBy: buildOrderBy(sort) }),
    prisma.book.count({ where }),
  ])

  const pages = Math.ceil(total / limit)
  const isLoggedIn = !!session?.user
  const isAdmin = session?.user?.role === 'ADMIN'

  // Build base params for pagination links (without page)
  const baseParams = new URLSearchParams()
  if (q) baseParams.set('q', q)
  if (tagsParam) baseParams.set('tags', tagsParam)
  if (programmiersprachenParam) baseParams.set('programmiersprachen', programmiersprachenParam)
  if (hauptkategorieParam) baseParams.set('hauptkategorie', hauptkategorieParam)
  if (sort !== 'title_asc') baseParams.set('sort', sort)

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <MenuBookIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Typography variant="h5">Bibliothekskatalog</Typography>
      </Box>

      <Suspense>
        <BooksFilter />
      </Suspense>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {total} Buch{total !== 1 ? 'er' : ''} gefunden
      </Typography>

      <Grid container spacing={2}>
        {books.map((book) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={book.id}>
            <BookCard book={book} isLoggedIn={isLoggedIn} isAdmin={isAdmin} />
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
        <Suspense>
          <PaginationBar page={page} pages={pages} baseParams={baseParams.toString()} />
        </Suspense>
      )}
    </Container>
  )
}
