'use client'

import {
  AppBar, Toolbar, Typography, Button, IconButton, Box,
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Divider, Avatar, Menu, MenuItem, Tooltip, useMediaQuery, useTheme,
} from '@mui/material'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import MenuIcon from '@mui/icons-material/Menu'
import DashboardIcon from '@mui/icons-material/Dashboard'
import BookIcon from '@mui/icons-material/Book'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import PersonIcon from '@mui/icons-material/Person'
import SettingsIcon from '@mui/icons-material/Settings'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import LogoutIcon from '@mui/icons-material/Logout'
import LoginIcon from '@mui/icons-material/Login'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'

const NAV_LINKS = [
  { label: 'Bücher', href: '/books', icon: <BookIcon /> },
]
const PROTECTED_LINKS = [
  { label: 'Dashboard', href: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Meine Ausleihen', href: '/my-loans', icon: <BookmarkIcon /> },
  { label: 'Profil', href: '/profile', icon: <PersonIcon /> },
  { label: 'Einstellungen', href: '/settings', icon: <SettingsIcon /> },
]
const ADMIN_LINKS = [
  { label: 'Bücher verwalten', href: '/admin/books', icon: <AdminPanelSettingsIcon /> },
  { label: 'Ausleihen verwalten', href: '/admin/loans', icon: <BookmarkIcon /> },
  { label: 'Benutzer verwalten', href: '/admin/users', icon: <PersonIcon /> },
]

export default function NavBar() {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [drawerOpen, setDrawerOpen] = useState(true)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const isAdmin = session?.user?.role === 'ADMIN'
  const isLoggedIn = !!session?.user

  const allLinks = [
    ...NAV_LINKS,
    ...(isLoggedIn ? PROTECTED_LINKS : []),
    ...(isAdmin ? ADMIN_LINKS : []),
  ]

  async function handleSignOut() {
    setAnchorEl(null)
    await signOut({ redirect: false })
    router.push('/login')
  }

  const drawer = (
    <Box sx={{ width: 260 }} onClick={() => setDrawerOpen(true)}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6" color="primary">Bibliothek</Typography>
      </Box>
      <Divider />
      <List>
        {allLinks.map((link) => (
          <ListItem key={link.href} disablePadding>
            <ListItemButton
              component={Link}
              href={link.href}
              selected={pathname === link.href || pathname.startsWith(link.href + '/')}
            >
              <ListItemIcon>{link.icon}</ListItemIcon>
              <ListItemText primary={link.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      {isLoggedIn && (
        <>
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={handleSignOut}>
                <ListItemIcon><LogoutIcon /></ListItemIcon>
                <ListItemText primary="Abmelden" />
              </ListItemButton>
            </ListItem>
          </List>
        </>
      )}
    </Box>
  )

  return (
    <>
      <AppBar position="sticky" elevation={1} sx={{ bgcolor: 'white', color: 'text.primary' }}>
        <Toolbar>
          {isMobile && (
            <IconButton edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            component={Link}
            href="/"
            sx={{ flexGrow: 1, textDecoration: 'none', color: 'primary.main', fontWeight: 700 }}
          >
            Bibliothek
          </Typography>

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 0.5, mr: 2 }}>
              {NAV_LINKS.map((link) => (
                <Button
                  key={link.href}
                  component={Link}
                  href={link.href}
                  color={pathname.startsWith(link.href) ? 'primary' : 'inherit'}
                  startIcon={link.icon}
                >
                  {link.label}
                </Button>
              ))}
              {isLoggedIn && PROTECTED_LINKS.map((link) => (
                <Button
                  key={link.href}
                  component={Link}
                  href={link.href}
                  color={pathname.startsWith(link.href) ? 'primary' : 'inherit'}
                  startIcon={link.icon}
                >
                  {link.label}
                </Button>
              ))}
              {isAdmin && ADMIN_LINKS.map((link) => (
                <Button
                  key={link.href}
                  component={Link}
                  href={link.href}
                  color={pathname.startsWith(link.href) ? 'primary' : 'inherit'}
                  startIcon={link.icon}
                >
                  {link.label}
                </Button>
              ))}
            </Box>
          )}

          {isLoggedIn ? (
            <>
              <Tooltip title={session.user?.email ?? ''}>
                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
                    {session.user?.name?.[0]?.toUpperCase() ?? 'U'}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
                <MenuItem disabled>
                  <Typography variant="caption" color="text.secondary">
                    {session.user?.name} · {session.user?.role}
                  </Typography>
                </MenuItem>
                <Divider />
                <MenuItem component={Link} href="/profile" onClick={() => setAnchorEl(null)}>
                  <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                  Profil
                </MenuItem>
                <MenuItem component={Link} href="/settings" onClick={() => setAnchorEl(null)}>
                  <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                  Einstellungen
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleSignOut} sx={{ color: 'error.main' }}>
                  <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                  Abmelden
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              component={Link}
              href="/login"
              variant="contained"
              size="small"
              startIcon={<LoginIcon />}
            >
              Anmelden
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        {drawer}
      </Drawer>
    </>
  )
}
