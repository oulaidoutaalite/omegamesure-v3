'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type CartItem = {
  slug: string
  name: string
  brand?: string | null
  image?: string | null
  qty: number
}

type CartContextValue = {
  /** True once the cart has been hydrated from localStorage (avoids SSR mismatch). */
  ready: boolean
  items: CartItem[]
  count: number
  add: (item: Omit<CartItem, 'qty'> & { qty?: number }) => void
  remove: (slug: string) => void
  setQty: (slug: string, qty: number) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = 'omx-devis-cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [ready, setReady] = useState(false)

  // Hydrate from localStorage on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setItems(
            parsed
              .filter((i) => i && typeof i.slug === 'string' && typeof i.name === 'string')
              .map((i) => ({
                slug: String(i.slug),
                name: String(i.name),
                brand: i.brand ?? null,
                image: i.image ?? null,
                qty: Math.max(1, Math.min(99999, Number(i.qty) || 1)),
              })),
          )
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true)
  }, [])

  // Persist on change (after hydration).
  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* quota / private mode — ignore */
    }
  }, [items, ready])

  const add = useCallback<CartContextValue['add']>((item) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.slug === item.slug)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], qty: Math.min(99999, next[idx].qty + (item.qty ?? 1)) }
        return next
      }
      return [
        ...prev,
        {
          slug: item.slug,
          name: item.name,
          brand: item.brand ?? null,
          image: item.image ?? null,
          qty: Math.max(1, item.qty ?? 1),
        },
      ]
    })
  }, [])

  const remove = useCallback((slug: string) => {
    setItems((prev) => prev.filter((i) => i.slug !== slug))
  }, [])

  const setQty = useCallback((slug: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) => (i.slug === slug ? { ...i, qty: Math.max(1, Math.min(99999, qty)) } : i)),
    )
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const count = useMemo(() => items.reduce((n, i) => n + i.qty, 0), [items])

  const value = useMemo<CartContextValue>(
    () => ({ ready, items, count, add, remove, setQty, clear }),
    [ready, items, count, add, remove, setQty, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) {
    // Defensive no-op so a stray usage never crashes the page.
    return {
      ready: false,
      items: [],
      count: 0,
      add: () => undefined,
      remove: () => undefined,
      setQty: () => undefined,
      clear: () => undefined,
    }
  }
  return ctx
}
