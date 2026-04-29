'use client'

import { useState } from 'react'
import { useCart, CartBook } from '@/lib/cart/CartContext'
import { CircularProgress, IconButton, Snackbar, Alert, Tooltip } from '@mui/material'
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart'
import RemoveShoppingCartIcon from '@mui/icons-material/RemoveShoppingCart'
import { useTranslation } from 'react-i18next'

interface Props {
  book: CartBook
  size?: 'small' | 'medium'
}

export default function CartButton({ book, size = 'small' }: Props) {
  const { t } = useTranslation()
  const { has, add, remove } = useCart()
  const inCart = has(book.id)
  const [loading, setLoading] = useState(false)
  const [snackError, setSnackError] = useState<string | null>(null)

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (loading) return

    if (inCart) {
      remove(book.id)
      return
    }

    setLoading(true)
    const result = await add(book)
    setLoading(false)
    if (!result.ok) {
      setSnackError(result.error ?? t('cart.addError'))
    }
  }

  return (
    <>
      <Tooltip title={inCart ? t('cart.removeFromCart') : t('cart.addToCart')}>
        <span>
          <IconButton
            size={size}
            color={inCart ? 'warning' : 'default'}
            onClick={handleClick}
            disabled={loading}
            aria-label={inCart ? t('cart.removeFromCart') : t('cart.addToCart')}
          >
            {loading
              ? <CircularProgress size={size === 'small' ? 16 : 20} color="inherit" />
              : inCart
                ? <RemoveShoppingCartIcon fontSize={size} />
                : <AddShoppingCartIcon fontSize={size} />}
          </IconButton>
        </span>
      </Tooltip>

      <Snackbar
        open={!!snackError}
        autoHideDuration={5000}
        onClose={() => setSnackError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setSnackError(null)} sx={{ width: '100%' }}>
          {snackError}
        </Alert>
      </Snackbar>
    </>
  )
}
