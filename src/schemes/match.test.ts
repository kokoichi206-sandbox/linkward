import { describe, it, expect } from 'vitest'
import { extractScheme, matchBlockedScheme } from './match'

const BLOCKED = ['mailto', 'tel', 'sms', 'webcal', 'zoommtg']

describe('extractScheme', () => {
  it('スキーム名を小文字で返す', () => {
    expect(extractScheme('mailto:a@example.com')).toBe('mailto')
    expect(extractScheme('MAILTO:a@example.com')).toBe('mailto')
    expect(extractScheme('webcal://example.com/c.ics')).toBe('webcal')
  })

  it('先頭の空白を無視する', () => {
    expect(extractScheme('  tel:0312345678')).toBe('tel')
  })

  it('スキームを持たない href は null', () => {
    expect(extractScheme('/path/to/page')).toBeNull()
    expect(extractScheme('#anchor')).toBeNull()
    expect(extractScheme('example.com')).toBeNull()
  })
})

describe('matchBlockedScheme', () => {
  it('対象スキームは名前を返す', () => {
    expect(matchBlockedScheme('mailto:a@example.com', BLOCKED)).toBe('mailto')
    expect(matchBlockedScheme('zoommtg://zoom.us/join', BLOCKED)).toBe(
      'zoommtg',
    )
  })

  it('対象外スキームは null', () => {
    expect(matchBlockedScheme('https://example.com', BLOCKED)).toBeNull()
    expect(matchBlockedScheme('http://example.com', BLOCKED)).toBeNull()
    expect(matchBlockedScheme('slack://open', BLOCKED)).toBeNull()
  })

  it('スキームなしは null', () => {
    expect(matchBlockedScheme('/relative', BLOCKED)).toBeNull()
  })
})
