import { prisma } from '@/lib/prisma'
import {
  Box, Chip, Container, Table, TableBody, TableCell,
  TableHead, TableRow, Typography,
} from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import VerifiedIcon from '@mui/icons-material/Verified'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      firstname: true,
      lastname: true,
      role: true,
      email_verified: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <PeopleIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Box>
          <Typography variant="h5">Nutzerverwaltung</Typography>
          <Typography variant="body2" color="text.secondary">{users.length} Nutzer gesamt</Typography>
        </Box>
      </Box>

      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 600 } }}>
              <TableCell>Name</TableCell>
              <TableCell>Benutzername</TableCell>
              <TableCell>E-Mail</TableCell>
              <TableCell>Rolle</TableCell>
              <TableCell>Verifiziert</TableCell>
              <TableCell>Registriert</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>
                  <Typography variant="body2">
                    {[user.firstname, user.lastname].filter(Boolean).join(' ') || '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ fontFamily: "monospace" }}>{user.username}</Typography>
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
                    {new Date(user.createdAt).toLocaleDateString('de-DE')}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Keine Nutzer gefunden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    </Container>
  )
}
