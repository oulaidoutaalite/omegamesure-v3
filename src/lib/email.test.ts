import { describe, expect, it } from 'vitest'

import { escapeHtml, wrapEmail } from './email'

describe('escapeHtml', () => {
  it('escapes HTML special chars', () => {
    expect(escapeHtml('<script>alert("xss")</script>'))
      .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
  })
  it('escapes ampersands first to avoid double-escaping', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B')
  })
  it('escapes single quotes', () => {
    expect(escapeHtml("It's")).toBe('It&#39;s')
  })
  it('returns plain text unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world')
  })
})

describe('wrapEmail', () => {
  it('wraps content in an HTML document', () => {
    const html = wrapEmail('<p>hi</p>', { title: 'Test' })
    expect(html).toContain('<!doctype html>')
    expect(html).toContain('<title>Test</title>')
    expect(html).toContain('<p>hi</p>')
    expect(html).toContain('Omega Mesure')
  })
  it('uses a default title when none provided', () => {
    const html = wrapEmail('x')
    expect(html).toContain('<title>Omega Mesure</title>')
  })
})
