import { matchBlockedScheme } from '../schemes/match'
import { decideAction } from '../settings/decide'
import type { SchemeAction, Settings } from '../shared/types'

// 介入する場合の結果。allow(=介入しない)は null で表すため action には含めない。
export interface ClickResolution {
  scheme: string
  href: string
  action: Exclude<SchemeAction, 'allow'>
}

// クリックイベントから「介入すべきか / 何をするか」を判定する。
// preventDefault などの副作用は持たず、テスト可能な純粋判定に保つ。
export function resolveClick(
  event: MouseEvent,
  settings: Settings,
  host: string,
): ClickResolution | null {
  if (event.defaultPrevented) return null
  // 主ボタンのみ。修飾キー付きクリックはブラウザ既定に委ねる(将来: 修飾キーで一時許可)。
  if (event.button !== 0) return null
  if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
    return null
  }

  const target = event.target
  const anchor = target instanceof Element ? target.closest('a[href]') : null
  if (!anchor) return null

  // target="_blank" でも href 属性をそのまま読む(target は外部アプリ起動の有無に影響しない)。
  const href = anchor.getAttribute('href') ?? ''
  const scheme = matchBlockedScheme(href, settings.schemes)
  if (!scheme) return null

  const action = decideAction(scheme, host, settings)
  if (action === 'allow') return null // そのまま開かせる
  return { scheme, href, action }
}
