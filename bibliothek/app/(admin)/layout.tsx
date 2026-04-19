import { requireRole } from '@/lib/auth/dal'
import SidebarLayout from '@/app/components/SidebarLayout'
import Footer from '@/app/components/Footer'
import { Box } from '@mui/material'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole('ADMIN')
  return (
    <SidebarLayout>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Box sx={{ flex: 1 }}>{children}</Box>
        <Footer />
      </Box>
    </SidebarLayout>
  )
}
