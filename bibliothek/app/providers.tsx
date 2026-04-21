'use client'

import { createContext, useContext, useEffect, useMemo, useState, Suspense } from 'react'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { CartProvider } from '@/lib/cart/CartContext'
import NavigationProgress from '@/app/components/NavigationProgress'

type ColorMode = 'light' | 'dark'

const ColorModeContext = createContext<{ mode: ColorMode; toggle: () => void }>({
  mode: 'light',
  toggle: () => {},
})

export function useColorMode() {
  return useContext(ColorModeContext)
}

function buildTheme(mode: ColorMode) {
  const isDark = mode === 'dark'
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#e65100',       // deep orange
        light: '#ff8330',
        dark: '#ac1900',
        contrastText: '#fff',
      },
      secondary: {
        main: '#c62828',       // red
        light: '#ff5f52',
        dark: '#8e0000',
        contrastText: '#fff',
      },
      warning: {
        main: '#f9a825',
      },
      background: {
        default: isDark ? '#121212' : '#f7f4f0',
        paper:   isDark ? '#1e1e1e' : '#ffffff',
      },
      divider: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    typography: {
      fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 },
    },
    shape: { borderRadius: 8 },
    components: {
      MuiButton: { defaultProps: { disableElevation: true } },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          },
        },
      },
      MuiTextField: {
        defaultProps: { variant: 'outlined' },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.23)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
            '&.Mui-focused': {
              color: '#e65100',
            },
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          input: {
            color: isDark ? '#fff' : 'inherit',
            '&::placeholder': {
              color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              opacity: 1,
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          icon: {
            color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.54)',
          },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.6)',
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
              color: isDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)',
            },
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            '&.MuiChip-outlined': {
              borderColor: isDark ? 'rgba(255,255,255,0.2)' : undefined,
            },
          },
        },
      },
    },
  })
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Read initial color mode from the data attribute set by the inline script in layout.tsx.
  // This avoids the visibility:hidden flash while still preventing light/dark flicker.
  const [mode, setMode] = useState<ColorMode>(() => {
    if (typeof document !== 'undefined') {
      const dm = document.documentElement.dataset.colorMode as ColorMode | undefined
      if (dm === 'dark' || dm === 'light') return dm
    }
    return 'light'
  })

  useEffect(() => {
    // Sync in case the script ran after useState initializer (SSR hydration)
    const stored = localStorage.getItem('colorMode') as ColorMode | null
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    setMode(stored ?? preferred)
  }, [])

  function toggle() {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('colorMode', next)
      document.documentElement.dataset.colorMode = next
      return next
    })
  }

  const theme = useMemo(() => buildTheme(mode), [mode])

  return (
    <ColorModeContext.Provider value={{ mode, toggle }}>
      <SessionProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <CartProvider>
            <Suspense>
              <NavigationProgress />
            </Suspense>
            {children}
          </CartProvider>
        </ThemeProvider>
      </SessionProvider>
    </ColorModeContext.Provider>
  )
}
