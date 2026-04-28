'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { LoanStatus } from '@prisma/client'
import {
  Box, Button, Chip, CircularProgress, Collapse, Container, IconButton, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import PinDropIcon from '@mui/icons-material/PinDrop'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import Link from 'next/link'
import { GroupStatusActions, ItemStatusActions } from './LoanStatusActions'

const STATUS_OPTIONS = ['', 'RESERVED', 'ACTIVE', 'RETURNED', 'OVERDUE', 'CANCELLED'] as const
const STATUS_LABEL: Record<string, string> = {
  '': 'Alle', RESERVED: 'Reserviert', ACTIVE: 'Ausgeliehen',
  RETURNED: 'Zurückgegeben', OVERDUE: 'Überfällig', CANCELLED: 'Storniert',
}
const STATUS_COLOR: Record<LoanStatus, 'warning' | 'success' | 'default' | 'error' | 'info'> = {
  RESERVED: 'warning', ACTIVE: 'success', RETURNED: 'default', OVERDUE: 'error', CANCELLED: 'default',
}

const HANDOVER_LABEL: Record<string, string> = { PICKUP: 'Abholung', MEETINGPOINT: 'Treffpunkt', SHIPPING: 'Versand' }
const HANDOVER_ICON: Record<string, React.ReactNode> = {
  PICKUP: <MeetingRoomIcon fontSize="inherit" />,
  MEETINGPOINT: <PinDropIcon fontSize="inherit" />,
  SHIPPING: <LocalShippingIcon fontSize="inherit" />,
}

interface LoanItem {
  id: string
  status: LoanStatus
  returnedAt: string | null
  book: { id: string; title: string; author: string; regalnummer: string | null }
}

interface LoanGroup {
  id: string
  status: LoanStatus
  dueDate: string
  startDate: string
  handoverMethod: string | null
  handoverDate: string | null
  handoverLocation: string | null
  handoverCost: number | null
  notes: string | null
  user: { username: string; email: string }
  items: LoanItem[]
}

function HandoverCell({ group }: { group: LoanGroup }) {
  if (!group.handoverMethod) return <Typography variant="caption" color="text.disabled">—</Typography>
  const label = HANDOVER_LABEL[group.handoverMethod] ?? group.handoverMethod
  const icon = HANDOVER_ICON[group.handoverMethod]
  const details: string[] = []
  if (group.handoverDate) details.push(new Date(group.handoverDate).toLocaleDateString('de-DE'))
  if (group.handoverLocation) details.push(group.handoverLocation)
  if (group.handoverCost != null) details.push(`${Number(group.handoverCost).toFixed(2)} €`)
  const tooltipText = details.length > 0 ? details.join(' · ') : label
  return (
    <Tooltip title={tooltipText} placement="top">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'default' }}>
        <Box sx={{ color: 'text.secondary', fontSize: 14, display: 'flex' }}>{icon}</Box>
        <Typography variant="caption">{label}</Typography>
        {details.length > 0 && (
          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 100 }}>
            · {details[0]}
          </Typography>
        )}
      </Box>
    </Tooltip>
  )
}

function GroupRow({ group, onDone }: { group: LoanGroup; onDone: () => void }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <TableRow hover sx={{ '& > td': { borderBottom: expanded ? 'none' : undefined } }}>
        <TableCell sx={{ width: 36, p: 0.5 }}>
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <MenuBookIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
            <Typography variant="body2">
              {group.items.length === 1
                ? group.items[0].book.title
                : `${group.items.length} Bücher`}
            </Typography>
          </Box>
          {group.items.length > 1 && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {group.items.slice(0, 2).map((i) => i.book.title).join(', ')}{group.items.length > 2 ? ` +${group.items.length - 2}` : ''}
            </Typography>
          )}
        </TableCell>
        <TableCell>
          <Typography variant="body2">{group.user.username}</Typography>
          <Typography variant="caption" color="text.secondary">{group.user.email}</Typography>
        </TableCell>
        <TableCell>
          <Chip label={STATUS_LABEL[group.status]} color={STATUS_COLOR[group.status]} size="small" />
        </TableCell>
        <TableCell>
          <HandoverCell group={group} />
        </TableCell>
        <TableCell>
          <Typography variant="body2" color={group.status === 'OVERDUE' ? 'error' : 'inherit'}>
            {new Date(group.dueDate).toLocaleDateString('de-DE')}
          </Typography>
        </TableCell>
        <TableCell>
          <GroupStatusActions groupId={group.id} groupStatus={group.status} onDone={onDone} />
        </TableCell>
      </TableRow>

      {/* Expanded item rows */}
      <TableRow>
        <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ bgcolor: 'action.hover', px: 3, py: 1 }}>
              {group.notes && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                  Notiz: {group.notes}
                </Typography>
              )}
              <Table size="small">
                <TableBody>
                  {group.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell sx={{ border: 0, py: 0.5, pl: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.book.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.book.author}</Typography>
                        {item.book.regalnummer && (
                          <Typography variant="caption" color="text.disabled" sx={{ ml: 1 }}>
                            Regal: {item.book.regalnummer}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ border: 0, py: 0.5 }}>
                        <Chip label={STATUS_LABEL[item.status]} color={STATUS_COLOR[item.status]} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell sx={{ border: 0, py: 0.5 }}>
                        {item.returnedAt && (
                          <Typography variant="caption" color="text.secondary">
                            Zurück: {new Date(item.returnedAt).toLocaleDateString('de-DE')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ border: 0, py: 0.5 }}>
                        <ItemStatusActions itemId={item.id} itemStatus={item.status} onDone={onDone} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}

function AdminLoansContent() {
  const searchParams = useSearchParams()
  const status = (searchParams.get('status') ?? '') as LoanStatus | ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))

  const [groups, setGroups] = useState<LoanGroup[]>([])
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
      .then((data) => { setGroups(data.groups ?? []); setTotal(data.total ?? 0) })
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
                <TableCell sx={{ width: 36 }} />
                <TableCell>Bücher</TableCell>
                <TableCell>Nutzer</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Übergabe</TableCell>
                <TableCell>Fällig</TableCell>
                <TableCell>Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groups.map((group) => (
                <GroupRow key={group.id} group={group} onDone={load} />
              ))}
              {groups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
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
