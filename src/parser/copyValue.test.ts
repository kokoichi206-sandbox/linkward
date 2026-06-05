import { describe, it, expect } from 'vitest'
import { extractCopyValue } from './copyValue'

describe('extractCopyValue', () => {
  it('mailto はメールアドレスのみ(subject/body を捨てる)', () => {
    expect(extractCopyValue('mailto', 'mailto:test@example.com')).toBe(
      'test@example.com',
    )
    expect(
      extractCopyValue(
        'mailto',
        'mailto:test@example.com?subject=Hello&body=Hi',
      ),
    ).toBe('test@example.com')
  })

  it('mailto の複数宛先はそのまま', () => {
    expect(
      extractCopyValue('mailto', 'mailto:a@example.com,b@example.com'),
    ).toBe('a@example.com,b@example.com')
  })

  it('mailto の percent エンコードを復元する', () => {
    expect(extractCopyValue('mailto', 'mailto:a%2Bb@example.com')).toBe(
      'a+b@example.com',
    )
  })

  it('tel/sms は番号部分のみ', () => {
    expect(extractCopyValue('tel', 'tel:+81-3-1234-5678')).toBe(
      '+81-3-1234-5678',
    )
    expect(extractCopyValue('sms', 'sms:0312345678?body=hi')).toBe('0312345678')
  })

  it('その他スキームはリンク全文', () => {
    expect(
      extractCopyValue('webcal', 'webcal://example.com/calendar.ics'),
    ).toBe('webcal://example.com/calendar.ics')
  })

  it('不正な percent 列は原文のまま返す', () => {
    expect(extractCopyValue('mailto', 'mailto:a%ZZ@example.com')).toBe(
      'a%ZZ@example.com',
    )
  })
})
