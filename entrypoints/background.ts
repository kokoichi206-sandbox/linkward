import { defineBackground } from '#imports'
import type { BackgroundRequest, Result } from '../src/shared/messages'
import * as store from '../src/background/store'

// Service Worker。storage への書き込みを直列化する単一 writer。
// content / popup / options からのリクエストを受けて mutex 経由で永続化する。
export default defineBackground(() => {
  async function handle(message: BackgroundRequest): Promise<Result<unknown>> {
    switch (message.type) {
      case 'history/record':
        return { ok: true, data: await store.recordHistory(message.payload) }
      case 'history/list':
        return { ok: true, data: await store.listHistory() }
      case 'history/clear':
        await store.clearHistory()
        return { ok: true, data: null }
      case 'settings/get':
        return { ok: true, data: await store.getSettings() }
      case 'settings/allowSite':
        return {
          ok: true,
          data: await store.allowSite(
            message.payload.host,
            message.payload.scheme,
          ),
        }
      case 'settings/blockScheme':
        return {
          ok: true,
          data: await store.blockScheme(message.payload.scheme),
        }
      case 'settings/setSchemeEnabled':
        return {
          ok: true,
          data: await store.setSchemeEnabled(
            message.payload.scheme,
            message.payload.enabled,
          ),
        }
      case 'settings/setSchemeRule':
        return {
          ok: true,
          data: await store.setSchemeRule(
            message.payload.scheme,
            message.payload.action,
          ),
        }
      default: {
        // 全 type を網羅していることをコンパイル時に保証する。
        const exhaustive: never = message
        return { ok: false, error: `未知のリクエスト: ${String(exhaustive)}` }
      }
    }
  }

  chrome.runtime.onMessage.addListener(
    (message: BackgroundRequest, _sender, sendResponse) => {
      handle(message)
        .then(sendResponse)
        .catch((e) => sendResponse({ ok: false, error: String(e) }))
      // 非同期で応答するため true を返す。
      return true
    },
  )

  // ツールバーアイコンのクリックで設定画面を開く(popup は持たない)。
  chrome.action.onClicked.addListener(() => {
    void chrome.runtime.openOptionsPage()
  })
})
