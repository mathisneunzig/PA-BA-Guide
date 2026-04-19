'use client'

import {
  Avatar, Box, Divider, Drawer, IconButton, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem,
  Tooltip, Typography,
} from '@mui/material'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import DashboardIcon from '@mui/icons-material/Dashboard'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks'
import PersonIcon from '@mui/icons-material/Person'
import SettingsIcon from '@mui/icons-material/Settings'
import ManageSearchIcon from '@mui/icons-material/ManageSearch'
import AssignmentIcon from '@mui/icons-material/Assignment'
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn'
import LibraryAddIcon from '@mui/icons-material/LibraryAdd'
import GroupIcon from '@mui/icons-material/Group'
import LogoutIcon from '@mui/icons-material/Logout'
import LoginIcon from '@mui/icons-material/Login'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useSession, signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const COLLAPSED_W = 56
const EXPANDED_W = 220

const NAV_LINKS = [
  { label: 'Bücher', href: '/books', icon: <MenuBookIcon /> },
]
const PROTECTED_LINKS = [
  { label: 'Dashboard', href: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Meine Ausleihen', href: '/my-loans', href2: '/my-loans/new', icon: <BookmarkIcon /> },
  { label: 'Sammelausleihe', href: '/my-loans/multi', icon: <LibraryBooksIcon /> },
  { label: 'Profil', href: '/profile', icon: <PersonIcon /> },
  { label: 'Einstellungen', href: '/settings', icon: <SettingsIcon /> },
]
const ADMIN_LINKS = [
  { label: 'Bücher verwalten', href: '/admin/books', icon: <ManageSearchIcon /> },
  { label: 'Ausleihen verwalten', href: '/admin/loans', icon: <AssignmentIcon /> },
  { label: 'Sammelausleihe', href: '/admin/loans/multi', icon: <LibraryAddIcon /> },
  { label: 'Rückgabe', href: '/admin/return', icon: <AssignmentReturnIcon /> },
  { label: 'Benutzer verwalten', href: '/admin/users', icon: <GroupIcon /> },
]

interface NavItemProps {
  label: string
  href: string
  icon: React.ReactNode
  active: boolean
  expanded: boolean
}

function NavItem({ label, href, icon, active, expanded }: NavItemProps) {
  return (
    <ListItem disablePadding sx={{ display: 'block' }}>
      <Tooltip title={expanded ? '' : label} placement="right" arrow>
        <ListItemButton
          component={Link}
          href={href}
          selected={active}
          sx={{
            minHeight: 44,
            justifyContent: expanded ? 'initial' : 'center',
            px: expanded ? 2 : 1.5,
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: expanded ? 1.5 : 0,
              justifyContent: 'center',
              color: active ? 'primary.main' : 'inherit',
            }}
          >
            {icon}
          </ListItemIcon>
          {expanded && (
            <ListItemText
              primary={label}
              slotProps={{ primary: { variant: 'body2', noWrap: true, sx: { fontWeight: active ? 600 : 400 } } }}
            />
          )}
        </ListItemButton>
      </Tooltip>
    </ListItem>
  )
}

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const isAdmin = session?.user?.role === 'ADMIN'
  const isLoggedIn = !!session?.user
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  async function handleSignOut() {
    setAnchorEl(null)
    await signOut({ redirect: false })
    router.push('/login')
  }

  function isActive(href: string, href2?: string) {
    return pathname === href || pathname.startsWith(href + '/') || (href2 ? pathname.startsWith(href2) : false)
  }

  const drawerWidth = expanded ? EXPANDED_W : COLLAPSED_W

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            overflowX: 'hidden',
            transition: 'width 0.2s ease',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        {/* Logo row */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: expanded ? 'space-between' : 'center',
            px: expanded ? 1.5 : 0.5,
            py: 1.2,
            minHeight: 52,
          }}
        >
          {expanded && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
              <MenuBookIcon color="primary" sx={{ flexShrink: 0 }} />
              <Typography variant="subtitle1" color="primary" noWrap sx={{ fontWeight: 700 }}>
                Bibliothek
              </Typography>
            </Box>
          )}
          {!expanded && <MenuBookIcon color="primary" />}
          <IconButton size="small" onClick={() => setExpanded((e) => !e)} sx={{ ml: expanded ? 0 : 'auto', mr: expanded ? 0 : 'auto' }}>
            {expanded ? <ChevronLeftIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
          </IconButton>
        </Box>

        <Divider />

        {/* Nav links */}
        <List dense sx={{ flex: 1, py: 0.5 }}>
          {NAV_LINKS.map((l) => (
            <NavItem key={l.href} {...l} active={isActive(l.href)} expanded={expanded} />
          ))}

          {mounted && isLoggedIn && (
            <>
              <Divider sx={{ my: 0.5 }} />
              {PROTECTED_LINKS.map((l) => (
                <NavItem key={l.href} {...l} active={isActive(l.href, (l as { href2?: string }).href2)} expanded={expanded} />
              ))}
            </>
          )}

          {mounted && isAdmin && (
            <>
              <Divider sx={{ my: 0.5 }} />
              {expanded && (
                <Typography variant="caption" color="text.disabled" sx={{ px: 2, py: 0.5, display: 'block' }}>
                  Admin
                </Typography>
              )}
              {ADMIN_LINKS.map((l) => (
                <NavItem key={l.href} {...l} active={isActive(l.href)} expanded={expanded} />
              ))}
            </>
          )}
        </List>

        <Divider />

        {/* User section */}
        <Box sx={{ p: 0.5, py: 1 }}>
          {!mounted ? null : isLoggedIn ? (
            <>
              <Tooltip title={expanded ? '' : (session.user?.name ?? session.user?.email ?? '')} placement="right" arrow>
                <ListItemButton
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  sx={{ borderRadius: 1, justifyContent: expanded ? 'initial' : 'center', px: expanded ? 1.5 : 0.75 }}
                >
                  <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: 13, flexShrink: 0 }}>
                    {session.user?.name?.[0]?.toUpperCase() ?? 'U'}
                  </Avatar>
                  {expanded && (
                    <Box sx={{ ml: 1.5, minWidth: 0 }}>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>{session.user?.name}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>{session.user?.role}</Typography>
                    </Box>
                  )}
                </ListItemButton>
              </Tooltip>
              <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
                <MenuItem disabled>
                  <Typography variant="caption" color="text.secondary">
                    {session.user?.email}
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
            <Tooltip title={expanded ? '' : 'Anmelden'} placement="right" arrow>
              <ListItemButton
                component={Link}
                href="/login"
                sx={{ borderRadius: 1, justifyContent: expanded ? 'initial' : 'center', px: expanded ? 1.5 : 0.75 }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: expanded ? 1.5 : 0, justifyContent: 'center' }}>
                  <LoginIcon />
                </ListItemIcon>
                {expanded && <ListItemText primary="Anmelden" slotProps={{ primary: { variant: 'body2' } }} />}
              </ListItemButton>
            </Tooltip>
          )}
        </Box>
      </Drawer>

      {/* Main content */}
      <Box component="main" sx={{ flex: 1, minWidth: 0, bgcolor: 'background.default' }}>
        {children}
      </Box>
    </Box>
  )
}
