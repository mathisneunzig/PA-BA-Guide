'use client'

import { Box, Card, CardActionArea, CardContent, CardMedia, Chip, Stack, Typography } from '@mui/material'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import CartButton from '@/app/components/CartButton'
import { useTranslation } from 'react-i18next'

interface Book {
  id: string
  title: string
  author: string
  coverUrl: string | null
  regalnummer: string | null
  tags: string | null
  availableCopies: number
  totalCopies: number
}

interface Props {
  book: Book
  isLoggedIn: boolean
  isAdmin: boolean
}

export default function BookCard({ book, isLoggedIn, isAdmin }: Props) {
  const { t } = useTranslation()
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <CardActionArea href={`/books/${book.id}`} sx={{ flex: 1 }}>
        {book.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <CardMedia component="img" image={book.coverUrl} alt={book.title} sx={{ height: 180, objectFit: 'contain', bgcolor: 'action.hover', pt: 1 }} />
        ) : (
          <Box sx={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover' }}>
            <MenuBookIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
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
            <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', mt: 0.5 }}>
              {book.tags.split(',').slice(0, 2).map((t) => (
                <Chip key={t} label={t.trim()} size="small" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
              ))}
            </Stack>
          )}
          <Box sx={{ mt: 1 }}>
            <Chip
              label={book.availableCopies > 0 ? t('books.available', { available: book.availableCopies, total: book.totalCopies }) : t('books.unavailable')}
              color={book.availableCopies > 0 ? 'success' : 'default'}
              size="small"
            />
          </Box>
        </CardContent>
      </CardActionArea>

      {/* Cart button — shown for all logged-in users */}
      {isLoggedIn && (
        <Box sx={{ position: 'absolute', top: 6, right: 6 }}>
          <CartButton
            book={{ id: book.id, title: book.title, author: book.author, coverUrl: book.coverUrl }}
            size="small"
          />
        </Box>
      )}
    </Card>
  )
}
