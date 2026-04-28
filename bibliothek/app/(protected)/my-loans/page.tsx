'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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

type LoanStatus = 'RESERVED' | 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'CANCELLED'

const STATUS_COLOR: Record<LoanStatus, 'warning' | 'success' | 'default' | 'error' | 'info'> = {
  RESERVED: 'warning', ACTIVE: 'success', RETURNED: 'default', OVERDUE: 'error', CANCELLED: 'default',
}

const HANDOVER_ICON: Record<string, React.ReactNode> = {
  PICKUP: <MeetingRoomIcon sx={{ fontSize: 14 }} />,
  MEETINGPOINT: <PinDropIcon sx={{ fontSize: 14 }} />,
  SHIPPING: <LocalShippingIcon sx={{ fontSize: 14 }} />,
}

interface LoanItem {
  id: string
  status: LoanStatus
  book: { id: string; title: string; author: string }
}

interface LoanGroup {
  id: string
  status: LoanStatus
  createdAt: string
  startDate: string
  dueDate: string
  handoverMethod?: string | null
  items: LoanItem[]
}

export default function MyLoansPage() {
  const { t } = useTranslation()
  const [groups, setGroups] = useState<LoanGroup[]>([])

  useEffect(() => {
    fetch('/api/loans')
      .then((r) => r.json())
      .then((data) => setGroups(data.groups ?? []))
      .catch(() => {})
  }, [])

  const STATUS_LABEL: Record<LoanStatus, string> = {
    RESERVED: t('loans.statusReserved'),
    ACTIVE: t('loans.statusActive'),
    RETURNED: t('loans.statusReturned'),
    OVERDUE: t('loans.statusOverdue'),
    CANCELLED: t('loans.statusCancelled'),
  }

  const HANDOVER_LABEL: Record<string, string> = {
    PICKUP: t('loans.handoverPickup'),
    MEETINGPOINT: t('loans.handoverMeetingpoint'),
    SHIPPING: t('loans.handoverShipping'),
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <BookmarkIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          <Typography variant="h5">{t('loans.title')}</Typography>
        </Box>
        <Button href="/books" variant="contained" startIcon={<AddIcon />}>
          {t('loans.reserveBooks')}
        </Button>
      </Box>

      {groups.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <MenuBookIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">{t('loans.empty')}</Typography>
            <Button href="/books" sx={{ mt: 2 }} variant="outlined">
              {t('loans.browseCatalog')}
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
                      {new Date(group.createdAt).toLocaleDateString()}
                      {' · '}
                      {group.items.length === 1
                        ? t('loans.booksCount', { count: group.items.length })
                        : t('loans.booksCountPlural', { count: group.items.length })}
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
                      {item.status !== group.status && (
                        <Chip label={STATUS_LABEL[item.status]} color={STATUS_COLOR[item.status]} size="small" variant="outlined" />
                      )}
                      <LoanActions itemId={item.id} status={item.status} />
                    </Box>
                  ))}
                </Stack>

                <Divider sx={{ my: 1.5 }} />

                {/* Dates */}
                <Stack direction="row" spacing={3}>
                  <Typography variant="caption" color="text.secondary">
                    {t('loans.startDate', { date: new Date(group.startDate).toLocaleDateString() })}
                  </Typography>
                  <Typography variant="caption" color={group.status === 'OVERDUE' ? 'error' : 'text.secondary'}>
                    {t('loans.dueDate', { date: new Date(group.dueDate).toLocaleDateString() })}
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
