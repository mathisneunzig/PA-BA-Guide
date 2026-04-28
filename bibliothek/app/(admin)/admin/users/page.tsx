'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box, Chip, CircularProgress, Container, IconButton,
  Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import VerifiedIcon from '@mui/icons-material/Verified'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import HowToRegIcon from '@mui/icons-material/HowToReg'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import Link from 'next/link'

interface User {
  id: string
  username: string
  email: string
  firstname: string | null
  lastname: string | null
  role: string
  email_verified: boolean
  createdAt: string
}

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [promoting, setPromoting] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function promoteToStudent(userId: string) {
    setPromoting(userId)
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'STUDENT' }),
      })
      if (res.ok) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: 'STUDENT' } : u))
      }
    } finally {
      setPromoting(null)
    }
  }

  const guestCount = users.filter((u) => u.role === 'GUEST').length

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <PeopleIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Box>
          <Typography variant="h5">{t('admin.users.title')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {t('admin.users.total', { count: users.length })}
            {guestCount > 0 && (
              <Chip label={t('admin.users.pending', { count: guestCount })} color="warning" size="small" />
            )}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ overflowX: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 600 } }}>
                <TableCell>{t('admin.users.colName')}</TableCell>
                <TableCell>{t('admin.users.colUsername')}</TableCell>
                <TableCell>{t('admin.users.colEmail')}</TableCell>
                <TableCell>{t('admin.users.colRole')}</TableCell>
                <TableCell>{t('admin.users.colVerified')}</TableCell>
                <TableCell>{t('admin.users.colRegistered')}</TableCell>
                <TableCell align="right">{t('admin.users.colActions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  hover
                  sx={user.role === 'GUEST' ? { bgcolor: 'rgba(255,167,38,0.08)' } : {}}
                >
                  <TableCell>
                    <Typography variant="body2">
                      {[user.firstname, user.lastname].filter(Boolean).join(' ') || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{user.username}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{user.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      color={user.role === 'ADMIN' ? 'secondary' : user.role === 'STUDENT' ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {user.email_verified
                      ? <VerifiedIcon sx={{ fontSize: 18, color: 'success.main' }} />
                      : <WarningAmberIcon sx={{ fontSize: 18, color: 'warning.main' }} />}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {user.role === 'GUEST' && (
                      <Tooltip title={t('admin.users.approveTooltip')}>
                        <IconButton
                          size="small"
                          color="success"
                          disabled={promoting === user.id}
                          onClick={() => promoteToStudent(user.id)}
                        >
                          {promoting === user.id
                            ? <CircularProgress size={16} />
                            : <HowToRegIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title={t('admin.users.detailsTooltip')}>
                      <IconButton
                        size="small"
                        component={Link}
                        href={`/admin/users/${user.id}/approve`}
                      >
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    {t('admin.users.empty')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Box>
    </Container>
  )
}
