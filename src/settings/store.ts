import { mergeSettings } from './defaults'
import type { Settings } from '../shared/types'

const STORAGE_KEY = 'settings'

// content script 用の read パス。書き込みは必ず background(単一 writer)を経由する。
export async function loadSettings(): Promise<Settings> {
  const got = await chrome.storage.local.get(STORAGE_KEY)
  return mergeSettings(got[STORAGE_KEY] as Partial<Settings> | undefined)
}

// 設定変更を購読する。background の保存が各タブの content にも届く(別コンテキスト同期)。
export function onSettingsChanged(
  callback: (settings: Settings) => void,
): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes[STORAGE_KEY]) return
    callback(
      mergeSettings(
        changes[STORAGE_KEY].newValue as Partial<Settings> | undefined,
      ),
    )
  })
}
