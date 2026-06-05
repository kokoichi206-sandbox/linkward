import { SCHEME_CATALOG } from '../../src/schemes/catalog'
import { sendToBackground } from '../../src/shared/messages'
import type { BackgroundRequest } from '../../src/shared/messages'
import type { SchemeAction, Settings } from '../../src/shared/types'

const ACTIONS: { value: SchemeAction; label: string }[] = [
  { value: 'confirm', label: '確認する' },
  { value: 'block', label: 'ブロック' },
  { value: 'copy', label: 'コピー' },
  { value: 'allow', label: '許可' },
]

function showError(message: string): void {
  const el = document.getElementById('error')
  if (el) el.textContent = message
}

// 設定変更を background(単一 writer)へ送り、返ってきた最新設定で再描画する。
async function update(message: BackgroundRequest): Promise<void> {
  const res = await sendToBackground(message)
  if (!res.ok) {
    showError(res.error)
    return
  }
  showError('')
  render(res.data as Settings)
}

function render(settings: Settings): void {
  const list = document.getElementById('schemes')
  if (!list) return
  list.replaceChildren()

  for (const info of SCHEME_CATALOG) {
    const enabled = settings.schemes.includes(info.scheme)
    const action = settings.schemeRules[info.scheme] ?? 'confirm'

    const row = document.createElement('label')
    row.className = 'row'

    const check = document.createElement('input')
    check.type = 'checkbox'
    check.checked = enabled
    check.addEventListener('change', () => {
      void update({
        type: 'settings/setSchemeEnabled',
        payload: { scheme: info.scheme, enabled: check.checked },
      })
    })

    const name = document.createElement('span')
    name.className = 'label'
    name.textContent = info.label

    const select = document.createElement('select')
    select.disabled = !enabled
    for (const a of ACTIONS) {
      const opt = document.createElement('option')
      opt.value = a.value
      opt.textContent = a.label
      if (a.value === action) opt.selected = true
      select.append(opt)
    }
    select.addEventListener('change', () => {
      void update({
        type: 'settings/setSchemeRule',
        payload: { scheme: info.scheme, action: select.value as SchemeAction },
      })
    })

    row.append(check, name, select)
    list.append(row)
  }
}

async function main(): Promise<void> {
  const res = await sendToBackground({ type: 'settings/get' })
  if (!res.ok) {
    showError(res.error)
    return
  }
  render(res.data as Settings)
}

void main()
