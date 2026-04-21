'use client'

import { useRouter } from 'next/navigation'
import { Box, Pagination } from '@mui/material'

interface Props {
  page: number
  pages: number
  baseParams: string
}

export default function PaginationBar({ page, pages, baseParams }: Props) {
  const router = useRouter()

  function handleChange(_: React.ChangeEvent<unknown>, value: number) {
    const params = new URLSearchParams(baseParams)
    params.set('page', String(value))
    router.push(`?${params.toString()}`)
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <Pagination
        page={page}
        count={pages}
        onChange={handleChange}
        color="primary"
        showFirstButton
        showLastButton
        siblingCount={2}
      />
    </Box>
  )
}
