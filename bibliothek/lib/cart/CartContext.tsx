'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

export interface CartBook {
  id: string        // barcode
  title: string
  author: string
  coverUrl?: string | null
}

interface CartContextValue {
  items: CartBook[]
  add: (book: CartBook) => Promise<{ ok: boolean; error?: string }>
  remove: (id: string) => void
  clear: () => void
  has: (id: string) => boolean
  /** Seconds remaining on the hold TTL (counts down from 600). null = no items. */
  secondsLeft: number | null
}

const CartContext = createContext<CartContextValue>({
  items: [],
  add: async () => ({ ok: true }),
  remove: () => {},
  clear: () => {},
  has: () => false,
  secondsLeft: null,
})

export function useCart() {
  return useContext(CartContext)
}

const STORAGE_KEY = 'reservationCart'
const HOLD_TTL_MS = 10 * 60 * 1000          // 10 minutes
const HEARTBEAT_MS = 5 * 60 * 1000          // refresh holds every 5 minutes
const STORAGE_EXPIRES_KEY = 'cartHoldExpires'

function loadItems(): CartBook[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}

function loadExpires(): number | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_EXPIRES_KEY)
  if (!raw) return null
  const n = Number(raw)
  return isNaN(n) ? null : n
}

function saveItems(items: CartBook[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function saveExpires(ts: number) {
  localStorage.setItem(STORAGE_EXPIRES_KEY, String(ts))
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(STORAGE_EXPIRES_KEY)
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartBook[]>([])
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // --- Hydrate from localStorage on mount ---
  useEffect(() => {
    const storedItems = loadItems()
    const storedExpires = loadExpires()
    const now = Date.now()

    if (storedItems.length > 0 && storedExpires && storedExpires > now) {
      setItems(storedItems)
      setExpiresAt(storedExpires)
    } else if (storedItems.length > 0 && (!storedExpires || storedExpires <= now)) {
      // Items expired while app was closed — clear silently
      clearStorage()
    }
    setMounted(true)
  }, [])

  // --- Heartbeat: refresh holds every 5 minutes ---
  useEffect(() => {
    if (!mounted) return
    if (items.length === 0) {
      if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null }
      return
    }
    if (heartbeatRef.current) return // already running

    heartbeatRef.current = setInterval(async () => {
      try {
        await fetch('/api/cart/hold', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: true }),
        })
        const newExpires = Date.now() + HOLD_TTL_MS
        setExpiresAt(newExpires)
        saveExpires(newExpires)
      } catch { /* ignore — user will see timer hit 0 */ }
    }, HEARTBEAT_MS)

    return () => {
      if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null }
    }
  }, [mounted, items.length])

  // --- Auto-expire: clear cart when timer runs out ---
  useEffect(() => {
    if (!expiresAt || items.length === 0) return
    const remaining = expiresAt - Date.now()
    if (remaining <= 0) { _clearLocal(); return }
    const t = setTimeout(() => { _clearLocal() }, remaining)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt, items.length])

  function _clearLocal() {
    setItems([])
    setExpiresAt(null)
    clearStorage()
    if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null }
  }

  // --- Public API ---

  const add = useCallback(async (book: CartBook): Promise<{ ok: boolean; error?: string }> => {
    // Optimistically update UI immediately
    setItems((prev) => {
      if (prev.some((b) => b.id === book.id)) return prev
      const next = [...prev, book]
      saveItems(next)
      return next
    })

    // Set/reset expiry
    const newExpires = Date.now() + HOLD_TTL_MS
    setExpiresAt(newExpires)
    saveExpires(newExpires)

    // Place hold on server
    try {
      const res = await fetch('/api/cart/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: book.id }),
      })
      if (!res.ok) {
        // Roll back optimistic update
        setItems((prev) => {
          const next = prev.filter((b) => b.id !== book.id)
          saveItems(next)
          if (next.length === 0) { setExpiresAt(null); clearStorage() }
          return next
        })
        const data = await res.json().catch(() => ({}))
        return { ok: false, error: data.error ?? 'Buch konnte nicht reserviert werden' }
      }
      return { ok: true }
    } catch {
      // Network error — roll back
      setItems((prev) => {
        const next = prev.filter((b) => b.id !== book.id)
        saveItems(next)
        if (next.length === 0) { setExpiresAt(null); clearStorage() }
        return next
      })
      return { ok: false, error: 'Netzwerkfehler' }
    }
  }, [])

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((b) => b.id !== id)
      saveItems(next)
      if (next.length === 0) {
        setExpiresAt(null)
        clearStorage()
        if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null }
      }
      return next
    })
    // Release hold on server (fire and forget)
    fetch('/api/cart/hold', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId: id }),
    }).catch(() => {})
  }, [])

  const clear = useCallback(() => {
    _clearLocal()
    // Release all holds on server
    fetch('/api/cart/hold', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const has = useCallback((id: string) => items.some((b) => b.id === id), [items])

  const secondsLeft = expiresAt && items.length > 0
    ? Math.max(0, Math.round((expiresAt - Date.now()) / 1000))
    : null

  if (!mounted) {
    return <CartContext.Provider value={{ items: [], add, remove, clear, has, secondsLeft: null }}>{children}</CartContext.Provider>
  }

  return (
    <CartContext.Provider value={{ items, add, remove, clear, has, secondsLeft }}>
      {children}
    </CartContext.Provider>
  )
}
