'use client'

import { IconCheck, IconShoppingCartPlus } from '@tabler/icons-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'

import { useCart, type CartItem } from './CartProvider'

type Props = {
  item: Omit<CartItem, 'qty'>
  /** "card" = compact icon button (product cards); "full" = labelled button. */
  variant?: 'card' | 'full'
  className?: string
}

export function AddToQuoteButton({ item, variant = 'full', className }: Props) {
  const cart = useCart()
  const t = useTranslations('cart')
  const [justAdded, setJustAdded] = useState(false)

  function onClick(e: React.MouseEvent) {
    // Product cards wrap the whole tile in a <Link>: don't navigate.
    e.preventDefault()
    e.stopPropagation()
    cart.add(item)
    setJustAdded(true)
    toast.success(t('added'))
    window.setTimeout(() => setJustAdded(false), 1500)
  }

  if (variant === 'card') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={t('add')}
        title={t('add')}
        className={cn(
          'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-brand transition hover:border-brand hover:bg-brand hover:text-white',
          className,
        )}
      >
        {justAdded ? <IconCheck size={18} /> : <IconShoppingCartPlus size={18} />}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg border border-brand/30 bg-brand/5 px-5 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white',
        className,
      )}
    >
      {justAdded ? <IconCheck size={18} /> : <IconShoppingCartPlus size={18} />}
      {justAdded ? t('added') : t('add')}
    </button>
  )
}
