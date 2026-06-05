import type { HistoryAction, SchemeAction } from './types'

// 履歴記録の入力。id/at は background が補う。
export interface NewHistoryInput {
  pageUrl: string
  scheme: string
  href: string
  action: HistoryAction
}

// content / popup / options -> background のリクエスト(判別共用体)。
// storage への書き込みは必ず background を経由する(単一 writer)。
export type BackgroundRequest =
  | { type: 'history/record'; payload: NewHistoryInput }
  | { type: 'history/list' }
  | { type: 'history/clear' }
  | { type: 'settings/get' }
  | { type: 'settings/allowSite'; payload: { host: string; scheme: string } }
  | { type: 'settings/blockScheme'; payload: { scheme: string } }
  | {
      type: 'settings/setSchemeEnabled'
      payload: { scheme: string; enabled: boolean }
    }
  | {
      type: 'settings/setSchemeRule'
      payload: { scheme: string; action: SchemeAction }
    }

// background -> 呼び出し元の応答。成功/失敗を必ず明示する(握りつぶさない)。
export type Result<T> = { ok: true; data: T } | { ok: false; error: string }

// 型付きの送信ヘルパー。content は fire-and-forget で使い、popup/options は結果を読む。
export function sendToBackground(
  message: BackgroundRequest,
): Promise<Result<unknown>> {
  return chrome.runtime.sendMessage(message)
}
