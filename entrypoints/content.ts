import { defineContentScript } from '#imports'
import { extractCopyValue } from '../src/parser/copyValue'
import { resolveClick } from '../src/content/resolveClick'
import { loadSettings, onSettingsChanged } from '../src/settings/store'
import { DEFAULT_SETTINGS } from '../src/settings/defaults'
import { sendToBackground } from '../src/shared/messages'
import type { HistoryAction, Settings } from '../src/shared/types'
import { showConfirm, showToast } from '../src/ui/overlay'

// capture phase で a[href] クリックを横取りし、対象スキームなら外部アプリ起動を止める。
// 判定は resolveClick(allowlist > schemeRules)に委ね、confirm のときだけ UI を出す。
export default defineContentScript({
  matches: ['*://*/*'],
  // iframe 内(webmail/埋め込み等)のリンクも捕まえるため全 frame に注入する。
  allFrames: true,
  matchAboutBlank: true,
  runAt: 'document_start',
  main() {
    // 設定ロード前の早すぎるクリックは既定(全スキーム confirm)で扱う。
    let settings: Settings = DEFAULT_SETTINGS
    void loadSettings().then((s) => {
      settings = s
    })
    onSettingsChanged((s) => {
      settings = s
    })

    const record = (
      action: HistoryAction,
      scheme: string,
      href: string,
    ): void => {
      void sendToBackground({
        type: 'history/record',
        payload: { pageUrl: location.href, scheme, href, action },
      })
    }

    const copy = (scheme: string, href: string): void => {
      const value = extractCopyValue(scheme, href)
      navigator.clipboard.writeText(value).then(
        () => {
          record('copy', scheme, href)
          showToast(`コピーしました: ${value}`)
        },
        (e) => {
          // クリップボードは secure context / フォーカス必須。失敗は黙らせず明示する。
          showToast(`コピーに失敗しました: ${String(e)}`)
        },
      )
    }

    // preventDefault 済みのリンクへ、ユーザーの明示操作で今だけ遷移する。
    const navigate = (href: string): void => {
      window.location.href = href
    }

    const handleClick = (event: MouseEvent): void => {
      const resolution = resolveClick(event, settings, location.hostname)
      if (!resolution) return

      // 外部アプリ起動を止め、サイト自身のハンドラより先に処理する。
      event.preventDefault()
      event.stopImmediatePropagation()

      const { scheme, href, action } = resolution
      switch (action) {
        case 'block':
          record('block', scheme, href)
          showToast(`ブロックしました: ${scheme}:`)
          return
        case 'copy':
          copy(scheme, href)
          return
        case 'confirm':
          showConfirm(
            { scheme, href, pageUrl: location.href },
            {
              onCopy: () => copy(scheme, href),
              onOpen: () => {
                record('open', scheme, href)
                navigate(href)
              },
              onAllowSite: () => {
                void sendToBackground({
                  type: 'settings/allowSite',
                  payload: { host: location.hostname, scheme },
                })
                record('allow-site', scheme, href)
                navigate(href)
              },
              onBlockScheme: () => {
                void sendToBackground({
                  type: 'settings/blockScheme',
                  payload: { scheme },
                })
                record('block-scheme', scheme, href)
                showToast(`今後 ${scheme}: は常にブロックします`)
              },
              onCancel: () => record('cancel', scheme, href),
            },
          )
          return
      }
    }

    document.addEventListener('click', handleClick, true)
  },
})
