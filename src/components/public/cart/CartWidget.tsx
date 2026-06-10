'use client'

import {
  IconFileInvoice,
  IconMinus,
  IconPhoto,
  IconPlus,
  IconShoppingCart,
  IconTrash,
  IconX,
} from '@tabler/icons-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Link } from '@/navigation'

import { useCart } from './CartProvider'

export function CartWidget() {
  const cart = useCart()
  const t = useTranslations('cart')
  const [open, setOpen] = useState(false)

  // Lock body scroll + close on Escape while the drawer is open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('title')}
        className="relative grid h-10 w-10 place-items-center rounded-lg text-foreground hover:bg-accent"
      >
        <IconShoppingCart size={20} />
        {cart.ready && cart.count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-orange px-1 text-[10px] font-bold leading-none text-white">
            {cart.count}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 end-0 flex w-full max-w-sm flex-col bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-bold">
                {t('title')}
                {cart.count > 0 && (
                  <span className="font-normal text-muted-foreground"> · {t('itemsCount', { n: cart.count })}</span>
                )}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="grid h-8 w-8 place-items-center rounded-md hover:bg-accent"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {cart.items.length === 0 ? (
                <div className="grid h-full place-items-center text-center">
                  <div>
                    <IconShoppingCart size={36} className="mx-auto text-muted-foreground/40" />
                    <p className="mt-3 text-sm font-medium">{t('empty')}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t('emptyHint')}</p>
                  </div>
                </div>
              ) : (
                <ul className="space-y-3">
                  {cart.items.map((it) => (
                    <li key={it.slug} className="flex gap-3 rounded-lg border border-border p-2">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                        {it.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-muted-foreground">
                            <IconPhoto size={18} />
                          </div>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <p className="line-clamp-2 text-xs font-semibold leading-tight">{it.name}</p>
                        {it.brand && <p className="text-[10px] text-muted-foreground">{it.brand}</p>}
                        <div className="mt-auto flex items-center gap-2 pt-1.5">
                          <div className="inline-flex items-center rounded-md border border-border">
                            <button type="button" onClick={() => cart.setQty(it.slug, it.qty - 1)} className="grid h-7 w-7 place-items-center hover:bg-accent" aria-label="-">
                              <IconMinus size={13} />
                            </button>
                            <span className="w-7 text-center text-xs font-medium">{it.qty}</span>
                            <button type="button" onClick={() => cart.setQty(it.slug, it.qty + 1)} className="grid h-7 w-7 place-items-center hover:bg-accent" aria-label="+">
                              <IconPlus size={13} />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => cart.remove(it.slug)}
                            aria-label={t('remove')}
                            className="ms-auto grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600"
                          >
                            <IconTrash size={15} />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {cart.items.length > 0 && (
              <div className="space-y-2 border-t border-border p-4">
                <Button asChild className="w-full bg-orange uppercase tracking-wide text-white hover:bg-orange-600">
                  <Link href="/devis" onClick={() => setOpen(false)}>
                    <IconFileInvoice size={16} /> {t('requestQuote')}
                  </Link>
                </Button>
                <button
                  type="button"
                  onClick={() => cart.clear()}
                  className="w-full py-1 text-center text-xs text-muted-foreground hover:text-red-600"
                >
                  {t('clear')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
