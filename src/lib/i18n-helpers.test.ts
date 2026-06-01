import { describe, expect, it } from 'vitest'

import { localize, pickLocaleField, type TranslationsJson } from './i18n-helpers'

describe('pickLocaleField', () => {
  const translations: TranslationsJson = {
    ar: { name: 'الميزان', description: 'وصف' },
    en: { name: 'Balance' /* description missing */ },
  }

  it('returns the default value when locale is the default (fr)', () => {
    expect(pickLocaleField('Balance', translations, 'name', 'fr')).toBe('Balance')
  })

  it('returns the localized value when present', () => {
    expect(pickLocaleField('Balance', translations, 'name', 'ar')).toBe('الميزان')
    expect(pickLocaleField('Balance', translations, 'name', 'en')).toBe('Balance')
  })

  it('falls back to default when locale field is missing', () => {
    expect(pickLocaleField('description par défaut', translations, 'description', 'en'))
      .toBe('description par défaut')
  })

  it('treats empty / whitespace strings as missing', () => {
    const tr: TranslationsJson = { en: { name: '   ' } }
    expect(pickLocaleField('Default', tr, 'name', 'en')).toBe('Default')
  })

  it('handles null/undefined translations safely', () => {
    expect(pickLocaleField('X', null, 'name', 'ar')).toBe('X')
    expect(pickLocaleField('X', undefined, 'name', 'ar')).toBe('X')
  })
})

describe('localize', () => {
  const obj = { name: 'Balance', description: 'desc', other: 42 }
  const tr: TranslationsJson = { ar: { name: 'الميزان' } }

  it('returns object unchanged for default locale', () => {
    expect(localize(obj, tr, ['name', 'description'], 'fr')).toEqual(obj)
  })

  it('applies translations only on requested string fields', () => {
    const out = localize(obj, tr, ['name', 'description'], 'ar')
    expect(out.name).toBe('الميزان')
    expect(out.description).toBe('desc')
    expect(out.other).toBe(42)
  })
})
