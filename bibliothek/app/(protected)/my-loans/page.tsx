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
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import PinDropIcon from '@mui/icons-material/PinDrop'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import Link from 'next/link'
import LoanActions from './LoanActions'

const STATUS_LABEL: Record<LoanStatus, string> = {
  RESERVED: 'Reserviert', ACTIVE: 'Ausgeliehen', RETURNED: 'Zurückgegeben',
  OVERDUE: 'Überfällig', CANCELLED: 'Storniert',
}
const STATUS_COLOR: Record<LoanStatus, 'warning' | 'success' | 'default' | 'error' | 'info'> = {
  RESERVED: 'warning', ACTIVE: 'success', RETURNED: 'default', OVERDUE: 'error', CANCELLED: 'default',
}

const HANDOVER_LABEL: Record<string, string> = {
  PICKUP: 'Abholung',
  MEETINGPOINT: 'Treffpunkt',
  SHIPPING: 'Versand',
}
const HANDOVER_ICON: Record<string, React.ReactNode> = {
  PICKUP: <MeetingRoomIcon sx={{ fontSize: 14 }} />,
  MEETINGPOINT: <PinDropIcon sx={{ fontSize: 14 }} />,
  SHIPPING: <LocalShippingIcon sx={{ fontSize: 14 }} />,
}

export default async function MyLoansPage() {
  const session = await verifySession()
  const groups = await prisma.loanGroup.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: { book: { select: { id: true, title: true, author: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <BookmarkIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          <Typography variant="h5">Meine Ausleihen</Typography>
        </Box>
        <Button href="/books" variant="contained" startIcon={<AddIcon />}>
          Bücher reservieren
        </Button>
      </Box>

      {groups.length === 0 ? (
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
          {groups.map((group) => (
            <Card key={group.id}>
              <CardContent>
                {/* Group header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(group.createdAt).toLocaleDateString('de-DE')}
                      {' · '}
                      {group.items.length} Buch{group.items.length !== 1 ? 'er' : ''}
                      {group.handoverMethod && (
                        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
                          {HANDOVER_ICON[group.handoverMethod]}
                          {HANDOVER_LABEL[group.handoverMethod] ?? group.handoverMethod}
                        </Box>
                      )}
                    </Typography>
                  </Box>
                  <Chip label={STATUS_LABEL[group.status]} color={STATUS_COLOR[group.status]} size="small" />
                </Box>

                <Divider sx={{ my: 1 }} />

                {/* Individual books */}
                <Stack spacing={1}>
                  {group.items.map((item) => (
                    <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <MenuBookIcon sx={{ fontSize: 18, color: 'text.disabled', flexShrink: 0 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                          <Link href={`/books/${item.book.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            {item.book.title}
                          </Link>
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>{item.book.author}</Typography>
                      </Box>
                      {/* Show individual item chip only if different from group status */}
                      {item.status !== group.status && (
                        <Chip label={STATUS_LABEL[item.status]} color={STATUS_COLOR[item.status]} size="small" variant="outlined" />
                      )}
                      {/* Cancel button per item */}
                      <LoanActions itemId={item.id} status={item.status} />
                    </Box>
                  ))}
                </Stack>

                <Divider sx={{ my: 1.5 }} />

                {/* Dates */}
                <Stack direction="row" spacing={3}>
                  <Typography variant="caption" color="text.secondary">
                    Start: {new Date(group.startDate).toLocaleDateString('de-DE')}
                  </Typography>
                  <Typography variant="caption" color={group.status === 'OVERDUE' ? 'error' : 'text.secondary'}>
                    Fällig: {new Date(group.dueDate).toLocaleDateString('de-DE')}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  )
}
