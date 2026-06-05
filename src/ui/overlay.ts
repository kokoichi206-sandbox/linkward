// content script がページに差し込む確認 UI とトースト。
// Shadow DOM でページの CSS から隔離する。実描画は実機 Chrome でのみ検証できる。

export interface ConfirmContext {
  scheme: string
  href: string
  pageUrl: string
}

export interface ConfirmActions {
  onCopy: () => void
  onOpen: () => void
  onAllowSite: () => void
  onBlockScheme: () => void
  onCancel: () => void
}

const HOST_ID = 'linkward-overlay'
const Z_INDEX = '2147483647'

const CSS = `
:host { all: initial; }
.lw-backdrop {
  position: fixed;
  inset: 0;
  z-index: ${Z_INDEX};
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.lw-card {
  width: min(420px, calc(100vw - 32px));
  background: #fff;
  color: #1a1a1a;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  padding: 20px;
  box-sizing: border-box;
}
.lw-title { font-size: 15px; font-weight: 600; margin: 0 0 12px; }
.lw-rows { font-size: 12px; line-height: 1.6; margin: 0 0 16px; }
.lw-row { display: flex; gap: 8px; }
.lw-key { color: #6b7280; flex: 0 0 44px; }
.lw-val { color: #111827; overflow-wrap: anywhere; }
.lw-actions { display: flex; flex-direction: column; gap: 8px; }
.lw-btn {
  appearance: none;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  color: #111827;
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 13px;
  cursor: pointer;
  text-align: left;
}
.lw-btn:hover { background: #f3f4f6; }
.lw-btn.lw-primary { border-color: #2563eb; background: #2563eb; color: #fff; }
.lw-btn.lw-primary:hover { background: #1d4ed8; }
.lw-btn.lw-danger { color: #b91c1c; border-color: #fca5a5; }
.lw-toasts {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: ${Z_INDEX};
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.lw-toast {
  background: #111827;
  color: #fff;
  font-size: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  max-width: 320px;
  overflow-wrap: anywhere;
}
`

let shadow: ShadowRoot | null = null

function ensureShadow(): ShadowRoot {
  if (shadow) return shadow
  const host = document.createElement('div')
  host.id = HOST_ID
  const root = host.attachShadow({ mode: 'open' })
  const style = document.createElement('style')
  style.textContent = CSS
  root.append(style)
  // document_start では body 未生成のことがあるため documentElement に逃がす。
  ;(document.body ?? document.documentElement).append(host)
  shadow = root
  return root
}

function row(key: string, value: string): HTMLDivElement {
  const wrap = document.createElement('div')
  wrap.className = 'lw-row'
  const k = document.createElement('span')
  k.className = 'lw-key'
  k.textContent = key
  const v = document.createElement('span')
  v.className = 'lw-val'
  v.textContent = value // textContent で描画(href/pageUrl は未信頼)
  wrap.append(k, v)
  return wrap
}

function button(
  label: string,
  variant: 'default' | 'primary' | 'danger',
  onClick: () => void,
): HTMLButtonElement {
  const btn = document.createElement('button')
  const modifier =
    variant === 'primary'
      ? ' lw-primary'
      : variant === 'danger'
        ? ' lw-danger'
        : ''
  btn.className = `lw-btn${modifier}`
  btn.type = 'button'
  btn.textContent = label
  btn.addEventListener('click', onClick)
  return btn
}

export function showConfirm(
  ctx: ConfirmContext,
  actions: ConfirmActions,
): void {
  const root = ensureShadow()
  root.querySelector('.lw-backdrop')?.remove() // 同時に複数出さない

  const backdrop = document.createElement('div')
  backdrop.className = 'lw-backdrop'

  const close = (): void => {
    backdrop.remove()
    document.removeEventListener('keydown', onKey, true)
  }
  const onKey = (e: KeyboardEvent): void => {
    if (e.key !== 'Escape') return
    close()
    actions.onCancel()
  }
  const wrap =
    (fn: () => void): (() => void) =>
    (): void => {
      close()
      fn()
    }

  const card = document.createElement('div')
  card.className = 'lw-card'

  const title = document.createElement('p')
  title.className = 'lw-title'
  title.textContent = '外部アプリを開こうとしています'

  const rows = document.createElement('div')
  rows.className = 'lw-rows'
  rows.append(
    row('種類', `${ctx.scheme}:`),
    row('リンク', ctx.href),
    row('ページ', ctx.pageUrl),
  )

  const list = document.createElement('div')
  list.className = 'lw-actions'
  list.append(
    button('コピーする', 'primary', wrap(actions.onCopy)),
    button('今回は開く', 'default', wrap(actions.onOpen)),
    button('このサイトでは常に許可', 'default', wrap(actions.onAllowSite)),
    button('この種類は常にブロック', 'danger', wrap(actions.onBlockScheme)),
    button('キャンセル', 'default', wrap(actions.onCancel)),
  )

  card.append(title, rows, list)
  backdrop.append(card)
  // 背景(カード外)クリックでキャンセル。
  backdrop.addEventListener('click', (e) => {
    if (e.target !== backdrop) return
    close()
    actions.onCancel()
  })
  document.addEventListener('keydown', onKey, true)
  root.append(backdrop)
}

export function showToast(message: string): void {
  const root = ensureShadow()
  let container = root.querySelector('.lw-toasts')
  if (!container) {
    container = document.createElement('div')
    container.className = 'lw-toasts'
    root.append(container)
  }
  const toast = document.createElement('div')
  toast.className = 'lw-toast'
  toast.textContent = message
  container.append(toast)
  setTimeout(() => toast.remove(), 2600)
}
