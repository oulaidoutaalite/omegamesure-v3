import { describe, expect, it } from 'vitest'

import { cn, formatQuoteReference, slugify } from './utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })
  it('resolves Tailwind conflicts (keeps last)', () => {
    expect(cn('px-2 px-4')).toBe('px-4')
  })
  it('drops falsy values', () => {
    expect(cn('a', undefined, false, null, 'b')).toBe('a b')
  })
})

describe('slugify', () => {
  it('lowercases', () => {
    expect(slugify('Hello WORLD')).toBe('hello-world')
  })
  it('strips diacritics', () => {
    expect(slugify('Étalonnage Métrologie')).toBe('etalonnage-metrologie')
  })
  it('collapses spaces and punctuation', () => {
    expect(slugify('  HPLC, GC & spectro --- 2025  ')).toBe('hplc-gc-spectro-2025')
  })
  it('removes leading/trailing dashes', () => {
    expect(slugify('---abc---')).toBe('abc')
  })
})

describe('formatQuoteReference', () => {
  it('pads the sequence to 4 digits', () => {
    expect(formatQuoteReference(1, 2026)).toBe('OM-2026-0001')
    expect(formatQuoteReference(42, 2026)).toBe('OM-2026-0042')
    expect(formatQuoteReference(1234, 2026)).toBe('OM-2026-1234')
  })
  it('does not truncate past 4 digits', () => {
    expect(formatQuoteReference(12345, 2026)).toBe('OM-2026-12345')
  })
  it('defaults the year to the current one', () => {
    const ref = formatQuoteReference(7)
    expect(ref).toMatch(/^OM-\d{4}-0007$/)
  })
})
