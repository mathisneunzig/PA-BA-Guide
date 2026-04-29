'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import {
  Box, Container, Grid, Typography,
} from '@mui/material'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import BooksFilter, { type SortValue } from '@/app/components/BooksFilter'
import BookCard from '@/app/components/BookCard'
import PaginationBar from '@/app/components/PaginationBar'
import { useSession } from 'next-auth/react'

interface Book {
  id: string; title: string; author: string; coverUrl?: string | null
  publisher?: string | null; year?: number | null; regalnummer?: string | null
  availableCopies: number; totalCopies: number; tags?: string | null
  language?: string | null; loanDurationWeeks: number
}

function toBookCardBook(book: Book) {
  return {
    ...book,
    coverUrl: book.coverUrl ?? null,
    regalnummer: book.regalnummer ?? null,
    publisher: book.publisher ?? null,
    year: book.year ?? null,
    tags: book.tags ?? null,
    language: book.language ?? null,
  }
}

function BooksPageContent() {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [books, setBooks] = useState<Book[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const q = searchParams.get('q') ?? ''
  const tags = searchParams.get('tags') ?? ''
  const programmiersprachen = searchParams.get('programmiersprachen') ?? ''
  const hauptkategorie = searchParams.get('hauptkategorie') ?? ''
  const sort = searchParams.get('sort') ?? 'title_asc'
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = 21
  const pages = Math.ceil(total / limit)

  const isLoggedIn = !!session?.user
  const isAdmin = session?.user?.role === 'ADMIN'

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (tags) params.set('tags', tags)
    if (programmiersprachen) params.set('programmiersprachen', programmiersprachen)
    if (hauptkategorie) params.set('hauptkategorie', hauptkategorie)
    params.set('page', String(page))
    params.set('limit', String(limit))

    fetch(`/api/books?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setBooks(data.books ?? [])
        setTotal(data.total ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [q, tags, programmiersprachen, hauptkategorie, page])

  const baseParams = new URLSearchParams()
  if (q) baseParams.set('q', q)
  if (tags) baseParams.set('tags', tags)
  if (programmiersprachen) baseParams.set('programmiersprachen', programmiersprachen)
  if (hauptkategorie) baseParams.set('hauptkategorie', hauptkategorie)
  if (sort !== 'title_asc') baseParams.set('sort', sort)

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <MenuBookIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Typography variant="h5">{t('books.title')}</Typography>
      </Box>

      <Suspense>
        <BooksFilter />
      </Suspense>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {total === 1 ? t('books.found', { count: total }) : t('books.foundPlural', { count: total })}
      </Typography>

      <Grid container spacing={2}>
        {books.map((book) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={book.id}>
            <BookCard book={toBookCardBook(book)} isLoggedIn={isLoggedIn} isAdmin={isAdmin} />
          </Grid>
        ))}
      </Grid>

      {!loading && books.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <MenuBookIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">{t('books.empty')}</Typography>
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

export default function BooksPage() {
  return (
    <Suspense>
      <BooksPageContent />
    </Suspense>
  )
}
