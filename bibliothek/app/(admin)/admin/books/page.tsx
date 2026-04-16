import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import {
  Box, Button, Chip, Container, IconButton, Table, TableBody,
  TableCell, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import LabelIcon from '@mui/icons-material/Label'
import MenuBookIcon from '@mui/icons-material/MenuBook'

export default async function AdminBooksPage() {
  const books = await prisma.book.findMany({ orderBy: { title: 'asc' } })

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <MenuBookIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          <Typography variant="h5">Bücher verwalten</Typography>
        </Box>
        <Button href="/admin/books/new" variant="contained" startIcon={<AddIcon />}>
          Buch hinzufügen
        </Button>
      </Box>

      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 600 } }}>
              <TableCell>Titel</TableCell>
              <TableCell>Autor</TableCell>
              <TableCell>Barcode</TableCell>
              <TableCell>Exemplare</TableCell>
              <TableCell>Genre</TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {books.map((book) => (
              <TableRow key={book.id} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{book.title}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">{book.author}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ fontFamily: "monospace" }}>{book.id}</Typography>
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
                  <Typography variant="caption">{book.genre ?? '—'}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Bearbeiten">
                    <IconButton size="small" href={`/admin/books/${book.id}/edit`}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Label drucken (PNG)">
                    <IconButton size="small" component="a" href={`/api/books/${book.id}/label?format=png`} target="_blank">
                      <LabelIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {books.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Noch keine Bücher vorhanden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    </Container>
  )
}
