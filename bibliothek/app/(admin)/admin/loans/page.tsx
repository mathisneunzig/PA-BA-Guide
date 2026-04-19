'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { LoanStatus } from '@prisma/client'
import {
  Box, Button, Chip, CircularProgress, Container, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import PinDropIcon from '@mui/icons-material/PinDrop'
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import Link from 'next/link'
import LoanStatusActions from './LoanStatusActions'

const STATUS_OPTIONS = ['', 'RESERVED', 'ACTIVE', 'RETURNED', 'OVERDUE', 'CANCELLED'] as const
const STATUS_LABEL: Record<string, string> = {
  '': 'Alle',
  RESERVED: 'Reserviert',
  ACTIVE: 'Ausgeliehen',
  RETURNED: 'Zurückgegeben',
  OVERDUE: 'Überfällig',
  CANCELLED: 'Storniert',
}
const STATUS_COLOR: Record<LoanStatus, 'warning' | 'success' | 'default' | 'error' | 'info'> = {
  RESERVED: 'warning', ACTIVE: 'success', RETURNED: 'default', OVERDUE: 'error', CANCELLED: 'default',
}

const HANDOVER_LABEL: Record<string, string> = {
  PICKUP: 'Abholung',
  MEETINGPOINT: 'Treffpunkt',
  SHIPPING: 'Versand',
  DROPOFF: 'Vorbeibringen',
}
const HANDOVER_ICON: Record<string, React.ReactNode> = {
  PICKUP: <MeetingRoomIcon fontSize="inherit" />,
  MEETINGPOINT: <PinDropIcon fontSize="inherit" />,
  SHIPPING: <LocalShippingIcon fontSize="inherit" />,
  DROPOFF: <DirectionsWalkIcon fontSize="inherit" />,
}

interface Loan {
  id: string
  status: LoanStatus
  dueDate: string
  handoverMethod: string | null
  handoverDate: string | null
  handoverLocation: string | null
  handoverCost: number | null
  book: { title: string }
  user: { username: string; email: string }
}

function HandoverCell({ loan }: { loan: Loan }) {
  if (!loan.handoverMethod) return <Typography variant="caption" color="text.disabled">—</Typography>

  const label = HANDOVER_LABEL[loan.handoverMethod] ?? loan.handoverMethod
  const icon = HANDOVER_ICON[loan.handoverMethod]

  const details: string[] = []
  if (loan.handoverDate) details.push(new Date(loan.handoverDate).toLocaleDateString('de-DE'))
  if (loan.handoverLocation) details.push(loan.handoverLocation)
  if (loan.handoverCost != null) details.push(`${Number(loan.handoverCost).toFixed(2)} €`)

  const tooltipText = details.length > 0 ? details.join(' · ') : label

  return (
    <Tooltip title={tooltipText} placement="top">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'default' }}>
        <Box sx={{ color: 'text.secondary', fontSize: 14, display: 'flex' }}>{icon}</Box>
        <Typography variant="caption">{label}</Typography>
        {details.length > 0 && (
          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 120 }}>
            · {details[0]}
          </Typography>
        )}
      </Box>
    </Tooltip>
  )
}

function AdminLoansContent() {
  const searchParams = useSearchParams()
  const status = (searchParams.get('status') ?? '') as LoanStatus | ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))

  const [loans, setLoans] = useState<Loan[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const limit = 25
  const pages = Math.ceil(total / limit)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    params.set('page', String(page))
    params.set('limit', String(limit))
    fetch(`/api/admin/loans?${params}`)
      .then((r) => r.json())
      .then((data) => { setLoans(data.loans ?? []); setTotal(data.total ?? 0) })
      .finally(() => setLoading(false))
  }, [status, page])

  useEffect(() => { load() }, [load])

  function buildHref(s: string, p = 1) {
    const q = new URLSearchParams()
    if (s) q.set('status', s)
    if (p > 1) q.set('page', String(p))
    return `/admin/loans${q.toString() ? '?' + q.toString() : ''}`
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <BookmarkIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Typography variant="h5">Alle Ausleihen</Typography>
      </Box>

      <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
        {STATUS_OPTIONS.map((s) => (
          <Chip
            key={s}
            label={STATUS_LABEL[s]}
            component={Link}
            href={buildHref(s)}
            clickable
            color={status === s ? 'primary' : 'default'}
            variant={status === s ? 'filled' : 'outlined'}
          />
        ))}
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {total} Ausleihe{total !== 1 ? 'n' : ''}
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 600 } }}>
                <TableCell>Buch</TableCell>
                <TableCell>Nutzer</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Übergabe</TableCell>
                <TableCell>Fällig</TableCell>
                <TableCell>Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loans.map((loan) => (
                <TableRow key={loan.id} hover>
                  <TableCell>
                    <Typography variant="body2">{loan.book.title}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{loan.user.username}</Typography>
                    <Typography variant="caption" color="text.secondary">{loan.user.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={STATUS_LABEL[loan.status]}
                      color={STATUS_COLOR[loan.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <HandoverCell loan={loan} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color={loan.status === 'OVERDUE' ? 'error' : 'inherit'}>
                      {new Date(loan.dueDate).toLocaleDateString('de-DE')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <LoanStatusActions loanId={loan.id} status={loan.status} onDone={load} />
                  </TableCell>
                </TableRow>
              ))}
              {loans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    Keine Ausleihen gefunden.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      )}

      {pages > 1 && (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'center', mt: 3 }}>
          {page > 1 && (
            <Button component={Link} href={buildHref(status, page - 1)} variant="outlined" size="small">Zurück</Button>
          )}
          <Typography variant="body2" color="text.secondary">
            Seite {page} von {pages}
          </Typography>
          {page < pages && (
            <Button component={Link} href={buildHref(status, page + 1)} variant="outlined" size="small">Weiter</Button>
          )}
        </Box>
      )}
    </Container>
  )
}

export default function AdminLoansPage() {
  return (
    <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>}>
      <AdminLoansContent />
    </Suspense>
  )
}
