'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

export interface CartBook {
  id: string        // barcode
  title: string
  author: string
  coverUrl?: string | null
}

interface CartContextValue {
  items: CartBook[]
  add: (book: CartBook) => void
  remove: (id: string) => void
  clear: () => void
  has: (id: string) => boolean
}

const CartContext = createContext<CartContextValue>({
  items: [],
  add: () => {},
  remove: () => {},
  clear: () => {},
  has: () => false,
})

export function useCart() {
  return useContext(CartContext)
}

const STORAGE_KEY = 'reservationCart'

function load(): CartBook[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartBook[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setItems(load())
    setMounted(true)
  }, [])

  function save(next: CartBook[]) {
    setItems(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const add = useCallback((book: CartBook) => {
    setItems((prev) => {
      if (prev.some((b) => b.id === book.id)) return prev
      const next = [...prev, book]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((b) => b.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const clear = useCallback(() => { save([]) }, [])
  const has = useCallback((id: string) => items.some((b) => b.id === id), [items])

  if (!mounted) {
    // Avoid SSR/client mismatch — render children with empty context until mounted
    return <CartContext.Provider value={{ items: [], add, remove, clear, has }}>{children}</CartContext.Provider>
  }

  return (
    <CartContext.Provider value={{ items, add, remove, clear, has }}>
      {children}
    </CartContext.Provider>
  )
}
