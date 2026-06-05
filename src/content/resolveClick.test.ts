// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { resolveClick } from './resolveClick'
import { DEFAULT_SETTINGS } from '../settings/defaults'
import type { Settings } from '../shared/types'

// 実際に click を dispatch し、capture リスナーで resolveClick を呼んだ結果を返す。
function resolveFor(
  node: Element,
  settings: Settings,
  host: string,
): ReturnType<typeof resolveClick> {
  let result: ReturnType<typeof resolveClick> = null
  const listener = (e: Event): void => {
    result = resolveClick(e as MouseEvent, settings, host)
    e.preventDefault() // jsdom の anchor 既定遷移(未実装警告)を避ける。本番では content が止める
  }
  document.addEventListener('click', listener, true)
  node.dispatchEvent(
    new MouseEvent('click', { bubbles: true, cancelable: true }),
  )
  document.removeEventListener('click', listener, true)
  return result
}

function anchor(attrs: Record<string, string>): HTMLAnchorElement {
  const a = document.createElement('a')
  for (const [key, value] of Object.entries(attrs)) a.setAttribute(key, value)
  document.body.append(a)
  return a
}

describe('resolveClick', () => {
  beforeEach(() => {
    document.body.replaceChildren()
  })

  it('target="_blank" の mailto を捕捉する', () => {
    const a = anchor({
      href: 'mailto:y.mori@divein.co.jp',
      target: '_blank',
      rel: 'noreferrer noopener',
    })
    expect(resolveFor(a, DEFAULT_SETTINGS, 'example.com')).toEqual({
      scheme: 'mailto',
      href: 'mailto:y.mori@divein.co.jp',
      action: 'confirm',
    })
  })

  it('anchor 内の子要素クリックでも捕捉する', () => {
    const a = anchor({ href: 'tel:0312345678' })
    const span = document.createElement('span')
    a.append(span)
    expect(resolveFor(span, DEFAULT_SETTINGS, 'example.com')).toEqual({
      scheme: 'tel',
      href: 'tel:0312345678',
      action: 'confirm',
    })
  })

  it('対象外スキーム(https)は介入しない', () => {
    const a = anchor({ href: 'https://example.com' })
    expect(resolveFor(a, DEFAULT_SETTINGS, 'example.com')).toBeNull()
  })

  it('無効化したスキームは介入しない', () => {
    const settings: Settings = { ...DEFAULT_SETTINGS, schemes: ['tel'] }
    const a = anchor({ href: 'mailto:a@example.com' })
    expect(resolveFor(a, settings, 'example.com')).toBeNull()
  })

  it('allow のサイト/スキームは介入しない', () => {
    const settings: Settings = {
      ...DEFAULT_SETTINGS,
      allowSites: { 'example.com': ['mailto'] },
    }
    const a = anchor({ href: 'mailto:a@example.com' })
    expect(resolveFor(a, settings, 'example.com')).toBeNull()
  })
})
