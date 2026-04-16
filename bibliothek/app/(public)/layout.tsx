import NavBar from '@/app/components/NavBar'
import Footer from '@/app/components/Footer'
import { Box } from '@mui/material'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavBar />
      <Box component="main" sx={{ flex: 1, bgcolor: 'background.default' }}>
        {children}
      </Box>
      <Footer />
    </Box>
  )
}
