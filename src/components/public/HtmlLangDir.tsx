'use client'

import { useEffect } from 'react'

import { isRtl } from '@/i18n'

/**
 * Keeps <html lang> and <html dir> in sync with the active locale on every
 * client-side navigation. The inline script in the locale layout only runs on
 * the initial full page load, so without this the direction (RTL for Arabic)
 * would stay stuck when switching languages without a hard refresh.
 */
export function HtmlLangDir({ locale }: { locale: string }) {
  useEffect(() => {
    const el = document.documentElement
    el.lang = locale
    el.dir = isRtl(locale) ? 'rtl' : 'ltr'
  }, [locale])

  return null
}
