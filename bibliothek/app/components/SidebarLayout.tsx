'use client'

import {
  Avatar, Badge, Box, Divider, Drawer, IconButton, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem,
  Tooltip, Typography, useMediaQuery, useTheme,
} from '@mui/material'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import DashboardIcon from '@mui/icons-material/Dashboard'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import PersonIcon from '@mui/icons-material/Person'
import SettingsIcon from '@mui/icons-material/Settings'
import ManageSearchIcon from '@mui/icons-material/ManageSearch'
import AssignmentIcon from '@mui/icons-material/Assignment'
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn'
import LibraryAddIcon from '@mui/icons-material/LibraryAdd'
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd'
import GroupIcon from '@mui/icons-material/Group'
import SendIcon from '@mui/icons-material/Send'
import FeedbackIcon from '@mui/icons-material/Feedback'
import LogoutIcon from '@mui/icons-material/Logout'
import LoginIcon from '@mui/icons-material/Login'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import { useSession, signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useColorMode } from '@/app/providers'
import { useCart } from '@/lib/cart/CartContext'
import FeedbackButton from '@/app/components/FeedbackButton'
import LanguageSwitcher from '@/app/components/LanguageSwitcher'

const DRAWER_W = 220

interface NavItemProps {
  label: string
  href: string
  icon: React.ReactNode
  active: boolean
  badge?: number
}

function NavItem({ label, href, icon, active, badge }: NavItemProps) {
  return (
    <ListItem disablePadding sx={{ display: 'block' }}>
      <ListItemButton component={Link} href={href} selected={active} sx={{ minHeight: 44, px: 2 }}>
        <ListItemIcon sx={{ minWidth: 0, mr: 1.5, justifyContent: 'center', color: active ? 'primary.main' : 'inherit' }}>
          {badge != null && badge > 0 ? (
            <Badge badgeContent={badge} color="primary" max={9}>
              {icon}
            </Badge>
          ) : icon}
        </ListItemIcon>
        <ListItemText
          primary={label}
          slotProps={{ primary: { variant: 'body2', noWrap: true, sx: { fontWeight: active ? 600 : 400 } } }}
        />
      </ListItemButton>
    </ListItem>
  )
}

function DrawerContent({ onClose }: { onClose?: () => void }) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const { mode, toggle: toggleColorMode } = useColorMode()
  const { items: cartItems } = useCart()
  const { t } = useTranslation()

  const isAdmin = session?.user?.role === 'ADMIN'
  const isLoggedIn = !!session?.user
  const showCart = mounted && isLoggedIn

  const NAV_LINKS = [
    { label: t('nav.books'), href: '/books', icon: <MenuBookIcon /> },
  ]
  const PROTECTED_LINKS = [
    { label: t('nav.dashboard'), href: '/dashboard', icon: <DashboardIcon /> },
    { label: t('nav.myLoans'), href: '/my-loans', icon: <BookmarkIcon /> },
    { label: t('nav.profile'), href: '/profile', icon: <PersonIcon /> },
    { label: t('nav.settings'), href: '/settings', icon: <SettingsIcon /> },
  ]
  const ADMIN_LINKS = [
    { label: t('nav.adminBooks'), href: '/admin/books', icon: <ManageSearchIcon /> },
    { label: t('nav.adminLoans'), href: '/admin/loans', icon: <AssignmentIcon /> },
    { label: t('nav.adminMultiLoan'), href: '/admin/loans/multi', icon: <LibraryAddIcon /> },
    { label: t('nav.adminReserve'), href: '/admin/loans/reserve', icon: <BookmarkAddIcon /> },
    { label: t('nav.adminReturn'), href: '/admin/return', icon: <AssignmentReturnIcon /> },
    { label: t('nav.adminUsers'), href: '/admin/users', icon: <GroupIcon /> },
    { label: t('nav.adminBroadcast'), href: '/admin/broadcast', icon: <SendIcon /> },
    { label: t('nav.adminFeedback'), href: '/admin/feedback', icon: <FeedbackIcon /> },
  ]

  async function handleSignOut() {
    setAnchorEl(null)
    await signOut({ redirect: false })
    router.push('/login')
  }

  function isActive(href: string, href2?: string) {
    return pathname === href || pathname.startsWith(href + '/') || (href2 ? pathname.startsWith(href2) : false)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo row */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.2, minHeight: 52 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MenuBookIcon color="primary" />
          <Typography variant="subtitle1" color="primary" noWrap sx={{ fontWeight: 700 }}>
            Bibliothek
          </Typography>
        </Box>
        {onClose && (
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Divider />

      {/* Nav links */}
      <List dense sx={{ flex: 1, py: 0.5 }}>
        {NAV_LINKS.map((l) => (
          <NavItem key={l.href} {...l} active={isActive(l.href)} />
        ))}

        {mounted && isLoggedIn && (
          <>
            <Divider sx={{ my: 0.5 }} />
            {PROTECTED_LINKS.map((l) => (
              <NavItem key={l.href} {...l} active={isActive(l.href, (l as { href2?: string }).href2)} />
            ))}
            {/* Cart — for all logged-in users */}
            {showCart && (
              <NavItem
                label={t('nav.cart')}
                href="/cart"
                icon={<ShoppingCartIcon />}
                active={isActive('/cart')}
                badge={cartItems.length}
              />
            )}
          </>
        )}

        {mounted && isAdmin && (
          <>
            <Divider sx={{ my: 0.5 }} />
            <Typography variant="caption" color="text.disabled" sx={{ px: 2, py: 0.5, display: 'block' }}>
              {t('nav.admin')}
            </Typography>
            {ADMIN_LINKS.map((l) => (
              <NavItem key={l.href} {...l} active={isActive(l.href)} />
            ))}
          </>
        )}
      </List>

      <Divider />

      {/* Dark mode toggle */}
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 0.75 }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          {mode === 'dark' ? t('nav.darkMode') : t('nav.lightMode')}
        </Typography>
        <Tooltip title={mode === 'dark' ? t('nav.lightMode') : t('nav.darkMode')} placement="right" arrow>
          <IconButton size="small" onClick={toggleColorMode} color="inherit">
            {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      <Divider />

      {/* Language switcher */}
      <Box sx={{ px: 2, py: 0.75 }}>
        <LanguageSwitcher />
      </Box>

      <Divider />

      {/* User section */}
      <Box sx={{ p: 0.5, py: 1 }}>
        {!mounted ? null : isLoggedIn ? (
          <>
            <Tooltip title={session.user?.name ?? session.user?.email ?? ''} placement="right" arrow>
              <ListItemButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ borderRadius: 1, px: 1.5 }}>
                <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: 13, flexShrink: 0 }}>
                  {session.user?.name?.[0]?.toUpperCase() ?? 'U'}
                </Avatar>
                <Box sx={{ ml: 1.5, minWidth: 0 }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>{session.user?.name}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>{session.user?.role}</Typography>
                </Box>
              </ListItemButton>
            </Tooltip>
            <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
              <MenuItem disabled>
                <Typography variant="caption" color="text.secondary">{session.user?.email}</Typography>
              </MenuItem>
              <Divider />
              <MenuItem component={Link} href="/profile" onClick={() => setAnchorEl(null)}>
                <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                {t('nav.profile')}
              </MenuItem>
              <MenuItem component={Link} href="/settings" onClick={() => setAnchorEl(null)}>
                <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                {t('nav.settings')}
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleSignOut} sx={{ color: 'error.main' }}>
                <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                {t('nav.logout')}
              </MenuItem>
            </Menu>
          </>
        ) : (
          <ListItemButton component={Link} href="/login" sx={{ borderRadius: 1, px: 1.5 }}>
            <ListItemIcon sx={{ minWidth: 0, mr: 1.5, justifyContent: 'center' }}>
              <LoginIcon />
            </ListItemIcon>
            <ListItemText primary={t('nav.login')} slotProps={{ primary: { variant: 'body2' } }} />
          </ListItemButton>
        )}
      </Box>
    </Box>
  )
}

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  const drawerSx = {
    width: DRAWER_W,
    flexShrink: 0,
    '& .MuiDrawer-paper': {
      width: DRAWER_W,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid',
      borderColor: 'divider',
    },
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {!isMobile && (
        <Drawer variant="permanent" sx={drawerSx}>
          <DrawerContent />
        </Drawer>
      )}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={drawerSx}
        >
          <DrawerContent onClose={() => setMobileOpen(false)} />
        </Drawer>
      )}

      <Box component="main" sx={{ flex: 1, minWidth: 0, bgcolor: 'background.default' }}>
        {isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <IconButton size="small" onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
            <MenuBookIcon color="primary" fontSize="small" />
            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700 }}>
              Bibliothek
            </Typography>
          </Box>
        )}
        {children}
        <FeedbackButton />
      </Box>
    </Box>
  )
}
