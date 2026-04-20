'use client'

import { useCart, CartBook } from '@/lib/cart/CartContext'
import { IconButton, Tooltip } from '@mui/material'
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart'
import RemoveShoppingCartIcon from '@mui/icons-material/RemoveShoppingCart'

interface Props {
  book: CartBook
  size?: 'small' | 'medium'
}

export default function CartButton({ book, size = 'small' }: Props) {
  const { has, add, remove } = useCart()
  const inCart = has(book.id)

  return (
    <Tooltip title={inCart ? 'Aus Warenkorb entfernen' : 'In Warenkorb'}>
      <IconButton
        size={size}
        color={inCart ? 'warning' : 'default'}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          inCart ? remove(book.id) : add(book)
        }}
        aria-label={inCart ? 'Aus Warenkorb entfernen' : 'In Warenkorb'}
      >
        {inCart ? <RemoveShoppingCartIcon fontSize={size} /> : <AddShoppingCartIcon fontSize={size} />}
      </IconButton>
    </Tooltip>
  )
}
