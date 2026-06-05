import { describe, it, expect } from 'vitest'
import { decideAction } from './decide'
import { DEFAULT_SETTINGS } from './defaults'
import type { Settings } from '../shared/types'

const base: Settings = DEFAULT_SETTINGS

describe('decideAction', () => {
  it('既定はスキームの schemeRules を返す(初期は confirm)', () => {
    expect(decideAction('mailto', 'example.com', base)).toBe('confirm')
  })

  it('サイト別 allowlist が schemeRules より優先される', () => {
    const settings: Settings = {
      ...base,
      schemeRules: { ...base.schemeRules, webcal: 'block' },
      allowSites: { 'calendar.google.com': ['webcal'] },
    }
    expect(decideAction('webcal', 'calendar.google.com', settings)).toBe(
      'allow',
    )
    // 別サイトでは allowlist が効かず schemeRules(block)が返る。
    expect(decideAction('webcal', 'example.com', settings)).toBe('block')
  })

  it('schemeRules の各動作をそのまま返す', () => {
    const settings: Settings = {
      ...base,
      schemeRules: { ...base.schemeRules, tel: 'block', sms: 'copy' },
    }
    expect(decideAction('tel', 'example.com', settings)).toBe('block')
    expect(decideAction('sms', 'example.com', settings)).toBe('copy')
  })

  it('未設定スキームは確認(confirm)に倒す', () => {
    const settings: Settings = { ...base, schemes: [...base.schemes, 'cursor'] }
    expect(decideAction('cursor', 'example.com', settings)).toBe('confirm')
  })
})
