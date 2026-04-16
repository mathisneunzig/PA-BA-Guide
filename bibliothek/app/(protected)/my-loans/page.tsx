import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth/dal'
import { LoanStatus } from '@prisma/client'
import {
  Box, Button, Card, CardContent, Chip, Container,
  Typography, Stack, Divider,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import Link from 'next/link'
import LoanActions from './LoanActions'

const STATUS_LABEL: Record<LoanStatus, string> = {
  RESERVED: 'Reserviert', ACTIVE: 'Ausgeliehen', RETURNED: 'Zurückgegeben',
  OVERDUE: 'Überfällig', CANCELLED: 'Storniert',
}
const STATUS_COLOR: Record<LoanStatus, 'warning' | 'success' | 'default' | 'error' | 'info'> = {
  RESERVED: 'warning', ACTIVE: 'success', RETURNED: 'default', OVERDUE: 'error', CANCELLED: 'default',
}

export default async function MyLoansPage() {
  const session = await verifySession()
  const loans = await prisma.loan.findMany({
    where: { userId: session.user.id },
    include: { book: { select: { title: true, author: true, id: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <BookmarkIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          <Typography variant="h5">Meine Ausleihen</Typography>
        </Box>
        <Button href="/my-loans/new" variant="contained" startIcon={<AddIcon />}>
          Buch reservieren
        </Button>
      </Box>

      {loans.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <MenuBookIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">Noch keine Ausleihen.</Typography>
            <Button href="/books" sx={{ mt: 2 }} variant="outlined">
              Katalog durchsuchen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {loans.map((loan) => (
            <Card key={loan.id}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      <Link href={`/books/${loan.book.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        {loan.book.title}
                      </Link>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">{loan.book.author}</Typography>
                  </Box>
                  <Chip label={STATUS_LABEL[loan.status]} color={STATUS_COLOR[loan.status]} size="small" />
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Stack direction="row" spacing={3}>
                  <Typography variant="caption" color="text.secondary">
                    Start: {new Date(loan.startDate).toLocaleDateString('de-DE')}
                  </Typography>
                  <Typography variant="caption" color={loan.status === 'OVERDUE' ? 'error' : 'text.secondary'}>
                    Fällig: {new Date(loan.dueDate).toLocaleDateString('de-DE')}
                  </Typography>
                  {loan.returnedAt && (
                    <Typography variant="caption" color="text.secondary">
                      Zurückgegeben: {new Date(loan.returnedAt).toLocaleDateString('de-DE')}
                    </Typography>
                  )}
                </Stack>
                <LoanActions loanId={loan.id} status={loan.status} />
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  )
}
